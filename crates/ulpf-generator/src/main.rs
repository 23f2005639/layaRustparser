use anyhow::{Context, Result};
use clap::Parser;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::io::AsyncWriteExt;
use tokio::net::{TcpStream, UdpSocket};

use ulpf_generator::{load_dataset, locate_data_dir, DatasetKind, Protocol};

#[derive(Parser, Debug)]
#[command(
    name = "ulpf-generator",
    about = "ULPF Multi-Threaded High-Speed Syslog Traffic Generator (10k - 500k+ EPS)"
)]
struct Cli {
    /// Target destination in IP:PORT format
    #[arg(short, long, default_value = "127.0.0.1:5140")]
    target: String,

    /// Transport protocol: udp or tcp
    #[arg(short, long, default_value = "udp")]
    proto: String,

    /// Target rate in Events Per Second (EPS). Set to 0 for unthrottled maximum speed.
    #[arg(short, long, default_value_t = 50000)]
    rate: u64,

    /// Duration to generate traffic in seconds (0 for infinite)
    #[arg(short, long, default_value_t = 10)]
    duration: u64,

    /// Dataset to stream: all, cisco, fortigate, paloalto, suricata, pfsense, kaggle
    #[arg(short = 'D', long, default_value = "all")]
    dataset: String,

    /// Number of concurrent worker tasks (defaults to number of logical CPU cores)
    #[arg(short, long)]
    workers: Option<usize>,

    /// Path to data/raw directory containing log files
    #[arg(long)]
    data_dir: Option<PathBuf>,

    /// Batch size of packets dispatched per worker loop iteration
    #[arg(long, default_value_t = 64)]
    batch_size: usize,
}

struct Stats {
    packets_sent: AtomicU64,
    bytes_sent: AtomicU64,
    errors: AtomicU64,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    let proto: Protocol = cli.proto.parse()?;
    let dataset_kind: DatasetKind = cli.dataset.parse()?;
    let target_addr: SocketAddr = cli
        .target
        .parse()
        .with_context(|| format!("Invalid target socket address '{}'", cli.target))?;

    let num_workers = cli.workers.unwrap_or_else(|| {
        let cpus = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(4);
        cpus.max(2)
    });

    println!("============================================================");
    println!(" ULPF High-Speed Syslog Traffic Generator");
    println!("============================================================");
    println!("  Target:      {} ({})", target_addr, proto);
    println!("  Dataset:     {}", dataset_kind);
    if cli.rate == 0 {
        println!("  Target Rate: UNTHROTTLED (MAX EPS)");
    } else {
        println!(
            "  Target Rate: {} EPS ({} pkts/sec across {} workers)",
            cli.rate, cli.rate, num_workers
        );
    }
    if cli.duration == 0 {
        println!("  Duration:    Infinite (Press Ctrl+C to stop)");
    } else {
        println!("  Duration:    {} seconds", cli.duration);
    }
    println!("  Workers:     {}", num_workers);
    println!("  Batch Size:  {}", cli.batch_size);

    // Locate data directory and load logs into memory
    let data_dir = locate_data_dir(cli.data_dir.as_deref())?;
    println!("  Data Path:   {:?}", data_dir);
    println!("Loading datasets into memory buffer...");
    let logs_str = load_dataset(dataset_kind, &data_dir)?;
    println!(
        "  [✓] Buffered {} unique log lines in RAM (Zero-Disk-IO during blast)",
        logs_str.len()
    );

    // Convert to Vec<Arc<[u8]>> or pre-encoded byte buffers
    let logs: Arc<Vec<Vec<u8>>> = Arc::new(
        logs_str
            .into_iter()
            .map(|s| {
                let mut b = s.into_bytes();
                if proto == Protocol::Tcp {
                    b.push(b'\n');
                }
                b
            })
            .collect(),
    );

    let stats = Arc::new(Stats {
        packets_sent: AtomicU64::new(0),
        bytes_sent: AtomicU64::new(0),
        errors: AtomicU64::new(0),
    });

    let running = Arc::new(AtomicBool::new(true));

    // Handle Ctrl+C gracefully
    let running_ctrlc = running.clone();
    tokio::spawn(async move {
        let _ = tokio::signal::ctrl_c().await;
        println!("\n[!] Received Ctrl+C, shutting down generator...");
        running_ctrlc.store(false, Ordering::SeqCst);
    });

    println!("Blasting traffic to {}...", target_addr);

    // Rate calculations per worker
    let worker_rate = if cli.rate > 0 {
        (cli.rate / num_workers as u64).max(1)
    } else {
        0
    };

    let start_time = Instant::now();
    let mut worker_handles = Vec::with_capacity(num_workers);

    for worker_id in 0..num_workers {
        let logs_clone = logs.clone();
        let stats_clone = stats.clone();
        let running_clone = running.clone();
        let batch_sz = cli.batch_size;

        let handle = tokio::spawn(async move {
            match proto {
                Protocol::Udp => {
                    run_udp_worker(
                        worker_id,
                        target_addr,
                        logs_clone,
                        stats_clone,
                        running_clone,
                        worker_rate,
                        batch_sz,
                    )
                    .await;
                }
                Protocol::Tcp => {
                    run_tcp_worker(
                        worker_id,
                        target_addr,
                        logs_clone,
                        stats_clone,
                        running_clone,
                        worker_rate,
                        batch_sz,
                    )
                    .await;
                }
            }
        });
        worker_handles.push(handle);
    }

    // Reporter task
    let stats_reporter = stats.clone();
    let running_reporter = running.clone();
    let duration_secs = cli.duration;

    let reporter_handle = tokio::spawn(async move {
        let mut prev_pkts = 0u64;
        let mut prev_bytes = 0u64;
        let mut second = 0u64;
        let mut interval = tokio::time::interval(Duration::from_secs(1));
        interval.tick().await; // first tick fires immediately

        while running_reporter.load(Ordering::Relaxed) {
            interval.tick().await;
            second += 1;

            let cur_pkts = stats_reporter.packets_sent.load(Ordering::Relaxed);
            let cur_bytes = stats_reporter.bytes_sent.load(Ordering::Relaxed);
            let cur_errors = stats_reporter.errors.load(Ordering::Relaxed);

            let delta_pkts = cur_pkts.saturating_sub(prev_pkts);
            let delta_bytes = cur_bytes.saturating_sub(prev_bytes);
            prev_pkts = cur_pkts;
            prev_bytes = cur_bytes;

            let mbytes_per_sec = (delta_bytes as f64) / (1024.0 * 1024.0);
            let total_mbytes = (cur_bytes as f64) / (1024.0 * 1024.0);

            println!(
                "[{:02}:{:02}] Rate: {:>7} pkts/s (EPS) | Bandwidth: {:>6.2} MB/s | Total: {:>9} pkts ({:>6.2} MB) | Errors: {}",
                second / 60,
                second % 60,
                delta_pkts,
                mbytes_per_sec,
                cur_pkts,
                total_mbytes,
                cur_errors
            );

            if duration_secs > 0 && second >= duration_secs {
                running_reporter.store(false, Ordering::SeqCst);
                break;
            }
        }
    });

    // Wait for reporter to finish (which signals running = false)
    let _ = reporter_handle.await;

    // Await all workers
    for h in worker_handles {
        let _ = h.await;
    }

    let elapsed = start_time.elapsed().as_secs_f64();
    let total_pkts = stats.packets_sent.load(Ordering::Relaxed);
    let total_bytes = stats.bytes_sent.load(Ordering::Relaxed);
    let total_errors = stats.errors.load(Ordering::Relaxed);
    let avg_eps = if elapsed > 0.0 {
        (total_pkts as f64 / elapsed) as u64
    } else {
        0
    };
    let avg_mb_sec = if elapsed > 0.0 {
        (total_bytes as f64 / (1024.0 * 1024.0)) / elapsed
    } else {
        0.0
    };

    println!("\n============================================================");
    println!(" ULPF Generator Run Finished");
    println!("============================================================");
    println!("  Target:            {} ({})", target_addr, proto);
    println!("  Dataset:           {}", dataset_kind);
    println!("  Elapsed Time:      {:.2} seconds", elapsed);
    println!("  Total Packets:     {} pkts", total_pkts);
    println!(
        "  Total Data Sent:   {:.2} MB ({} bytes)",
        (total_bytes as f64) / (1024.0 * 1024.0),
        total_bytes
    );
    println!("  Average Rate:      {} pkts/sec (EPS)", avg_eps);
    println!("  Average Bandwidth: {:.2} MB/sec", avg_mb_sec);
    println!("  Total Errors:      {}", total_errors);
    println!("============================================================");

    Ok(())
}

/// Returns how many packets to send this batch, sleeping first if the worker
/// is ahead of its target rate.
///
/// Previously this slept a fixed 500us and re-polled, tying pacing resolution
/// to the send path: the worker burned loop trips just to re-check the clock.
/// Sleeping once until the exact deadline the deficit implies decouples the
/// two — one timer wait per batch instead of a poll loop.
async fn next_batch_size(
    sent_count: u64,
    worker_start: Instant,
    target_rate: u64,
    batch_size: usize,
) -> usize {
    if target_rate == 0 {
        return batch_size;
    }
    let expected = worker_start.elapsed().as_secs_f64() * target_rate as f64;
    if sent_count as f64 > expected + batch_size as f64 {
        let ahead_secs = (sent_count as f64 - expected) / target_rate as f64;
        let deadline = tokio::time::Instant::now() + Duration::from_secs_f64(ahead_secs.max(0.0));
        tokio::time::sleep_until(deadline).await;
        return 0; // re-evaluate after the sleep; send nothing this trip
    }
    batch_size.min((expected as u64).saturating_sub(sent_count).max(1) as usize)
}

/// Collects the next `count` datagram payloads starting at `start_idx`,
/// wrapping around the corpus. Shared by the `sendmmsg` fast path and the
/// per-packet fallback so both emit identical wire bytes: 1 log = 1 datagram.
fn collect_batch(logs: &[Vec<u8>], start_idx: usize, count: usize) -> Vec<&[u8]> {
    let n = logs.len();
    (0..count)
        .map(|i| logs[(start_idx + i) % n].as_slice())
        .collect()
}

/// Sends one batch of datagrams, returning (packets_sent, bytes_sent, errors).
///
/// NOTE on `--batch-size`: before this change it only bounded how many loop
/// trips (individual `send()` syscalls) a worker did per iteration — it never
/// coalesced syscalls. The Linux path below finally makes it a real batch:
/// one `sendmmsg` syscall per batch. GSO (`UDP_SEGMENT`) was considered and
/// REJECTED: it splits one buffer into fixed-size segments, but corpus lines
/// vary in length by vendor, so GSO would need padding (changing wire bytes
/// and breaking benchmark comparability) or fail outright. `sendmmsg` keeps
/// 1 log = 1 datagram byte-for-byte.
async fn send_udp_batch(socket: &UdpSocket, batch: &[&[u8]]) -> (u64, u64, u64) {
    #[cfg(target_os = "linux")]
    {
        send_udp_batch_sendmmsg(socket, batch).await
    }
    #[cfg(not(target_os = "linux"))]
    {
        send_udp_batch_one_by_one(socket, batch).await
    }
}

/// Per-packet fallback: one `send()` per datagram. Used on non-Linux and
/// when `sendmmsg` hits a per-datagram error mid-batch.
async fn send_udp_batch_one_by_one(socket: &UdpSocket, batch: &[&[u8]]) -> (u64, u64, u64) {
    let mut pkts = 0u64;
    let mut bytes = 0u64;
    let mut errors = 0u64;
    for payload in batch {
        match socket.send(payload).await {
            Ok(n) => {
                pkts += 1;
                bytes += n as u64;
            }
            Err(_) => errors += 1,
        }
    }
    (pkts, bytes, errors)
}

/// Outcome of one `sendmmsg` syscall. Owns no pointers, so the async retry
/// loop can match on it without holding raw `iovec` borrows across `.await`.
#[cfg(target_os = "linux")]
enum MmsgOutcome {
    Sent(usize),
    Empty,
    WaitWritable,
    Retry,
    FallbackRemainder,
}

/// Owned `sendmmsg` scratch buffers: one iovec + one header per datagram.
/// The raw pointers inside make the plain `Vec`s `!Send`, which would poison
/// the worker future spawned on the multi-thread runtime. Wrapped so the
/// single owner (this worker task) can hold them across `.await` points.
/// Sound: the pointers target this struct's own iovec allocation and log
/// bytes borrowed for the batch, and no other thread can ever observe them —
/// `Send` only moves ownership, and the pointers stay valid wherever the
/// owner runs the syscall.
#[cfg(target_os = "linux")]
struct MmsgBufs {
    iovecs: Vec<libc::iovec>,
    headers: Vec<libc::mmsghdr>,
}

#[cfg(target_os = "linux")]
unsafe impl Send for MmsgBufs {}

/// Builds the `sendmmsg` scratch buffers for a batch. Iovecs borrow the log
/// buffers so payloads are never copied; headers are filled after the iovec
/// allocation is complete so no reallocation can dangle their pointers.
#[cfg(target_os = "linux")]
fn mmsg_bufs(batch: &[&[u8]]) -> MmsgBufs {
    let mut bufs = MmsgBufs {
        iovecs: batch
            .iter()
            .map(|b| libc::iovec {
                iov_base: b.as_ptr() as *mut libc::c_void,
                iov_len: b.len(),
            })
            .collect(),
        headers: Vec::with_capacity(batch.len()),
    };
    for iov in bufs.iovecs.iter_mut() {
        let mut hdr: libc::mmsghdr = unsafe { std::mem::zeroed() };
        // Connected socket: no per-message address needed.
        hdr.msg_hdr.msg_iov = iov;
        hdr.msg_hdr.msg_iovlen = 1;
        bufs.headers.push(hdr);
    }
    bufs
}

#[cfg(target_os = "linux")]
fn sendmmsg_once(fd: libc::c_int, headers: &mut [libc::mmsghdr]) -> MmsgOutcome {
    // SAFETY: caller guarantees `headers` points at live log buffers and
    // `fd` is the worker's connected UDP socket. The borrow ends on return.
    let ret = unsafe {
        libc::sendmmsg(
            fd,
            headers.as_mut_ptr(),
            headers.len() as libc::c_uint,
            0,
        )
    };
    if ret < 0 {
        return match std::io::Error::last_os_error().kind() {
            std::io::ErrorKind::Interrupted => MmsgOutcome::Retry,
            std::io::ErrorKind::WouldBlock => MmsgOutcome::WaitWritable,
            _ => MmsgOutcome::FallbackRemainder,
        };
    }
    if ret == 0 {
        return MmsgOutcome::Empty;
    }
    MmsgOutcome::Sent(ret as usize)
}

/// Batched send via `sendmmsg` on the tokio socket's fd. The socket stays
/// nonblocking: EINTR retries inline, EAGAIN waits for writability, and a
/// partial return resumes at the first unsent datagram.
#[cfg(target_os = "linux")]
async fn send_udp_batch_sendmmsg(socket: &UdpSocket, batch: &[&[u8]]) -> (u64, u64, u64) {
    use std::os::unix::io::AsRawFd;

    if batch.is_empty() {
        return (0, 0, 0);
    }
    let fd = socket.as_raw_fd();
    // One build per batch; partial sends resume at `sent` without rebuilding.
    let mut bufs = mmsg_bufs(batch);

    let mut sent = 0usize;
    let mut bytes = 0u64;
    let mut errors = 0u64;
    while sent < batch.len() {
        match sendmmsg_once(fd, &mut bufs.headers[sent..]) {
            MmsgOutcome::Retry => continue,
            MmsgOutcome::Empty => {
                // Should not happen for datagrams; yield, don't hot-spin.
                tokio::task::yield_now().await;
            }
            MmsgOutcome::WaitWritable => {
                if socket.writable().await.is_err() {
                    errors += (batch.len() - sent) as u64;
                    break;
                }
            }
            // e.g. EMSGSIZE for one oversize datagram aborts the whole call,
            // so drain the rest one by one like before.
            MmsgOutcome::FallbackRemainder => {
                let (p, b, e) = send_udp_batch_one_by_one(socket, &batch[sent..]).await;
                return (p, bytes + b, errors + e);
            }
            MmsgOutcome::Sent(n) => {
                for hdr in &bufs.headers[sent..sent + n] {
                    bytes += hdr.msg_len as u64;
                }
                sent += n;
            }
        }
    }
    (sent as u64, bytes, errors)
}

async fn run_udp_worker(
    worker_id: usize,
    target: SocketAddr,
    logs: Arc<Vec<Vec<u8>>>,
    stats: Arc<Stats>,
    running: Arc<AtomicBool>,
    target_rate: u64,
    batch_size: usize,
) {
    let socket = match UdpSocket::bind("0.0.0.0:0").await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[Worker {}] Failed to bind UDP socket: {}", worker_id, e);
            stats.errors.fetch_add(1, Ordering::Relaxed);
            return;
        }
    };

    if let Err(e) = socket.connect(target).await {
        eprintln!(
            "[Worker {}] Failed to connect UDP socket to {}: {}",
            worker_id, target, e
        );
        stats.errors.fetch_add(1, Ordering::Relaxed);
        return;
    }

    let num_logs = logs.len();
    let mut log_idx = (worker_id * 17) % num_logs;
    let worker_start = Instant::now();
    let mut sent_count = 0u64;

    while running.load(Ordering::Relaxed) {
        let to_send =
            next_batch_size(sent_count, worker_start, target_rate, batch_size).await;
        if to_send == 0 {
            continue;
        }

        // One batch = one sendmmsg syscall on Linux, still 1 log = 1 datagram.
        let batch = collect_batch(&logs, log_idx, to_send);
        log_idx = (log_idx + to_send) % num_logs;
        let (batch_pkts, batch_bytes, batch_errors) = send_udp_batch(&socket, &batch).await;

        sent_count += batch_pkts;
        stats.packets_sent.fetch_add(batch_pkts, Ordering::Relaxed);
        stats.bytes_sent.fetch_add(batch_bytes, Ordering::Relaxed);
        stats.errors.fetch_add(batch_errors, Ordering::Relaxed);

        if target_rate == 0 {
            // Unthrottled yield to allow cooperative task scheduling
            tokio::task::yield_now().await;
        }
    }
}

/// Connects a TCP stream with Nagle's algorithm disabled.
///
/// Benchmark payloads are small per-log `write_all` calls; leaving Nagle on
/// would delay segments up to ~200ms waiting to coalesce, adding jitter to
/// the measured ingest path that has nothing to do with parser throughput.
/// Single call site for both the initial connect and the reconnect path so
/// a reconnected stream can never silently lose the flag.
async fn connect_tcp(target: SocketAddr) -> Result<TcpStream> {
    let stream = TcpStream::connect(target)
        .await
        .with_context(|| format!("Failed to connect TCP to {}", target))?;
    stream
        .set_nodelay(true)
        .context("Failed to set TCP_NODELAY")?;
    Ok(stream)
}

async fn run_tcp_worker(
    worker_id: usize,
    target: SocketAddr,
    logs: Arc<Vec<Vec<u8>>>,
    stats: Arc<Stats>,
    running: Arc<AtomicBool>,
    target_rate: u64,
    batch_size: usize,
) {
    let mut stream = match connect_tcp(target).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[Worker {}] {:?}", worker_id, e);
            stats.errors.fetch_add(1, Ordering::Relaxed);
            return;
        }
    };

    let num_logs = logs.len();
    let mut log_idx = (worker_id * 17) % num_logs;
    let worker_start = Instant::now();
    let mut sent_count = 0u64;

    let mut send_buf = Vec::with_capacity(batch_size * 256);

    while running.load(Ordering::Relaxed) {
        let to_send =
            next_batch_size(sent_count, worker_start, target_rate, batch_size).await;
        if to_send == 0 {
            continue;
        }

        send_buf.clear();
        for _ in 0..to_send {
            let log_bytes = &logs[log_idx];
            log_idx = (log_idx + 1) % num_logs;
            send_buf.extend_from_slice(log_bytes);
        }

        match stream.write_all(&send_buf).await {
            Ok(_) => {
                sent_count += to_send as u64;
                stats
                    .packets_sent
                    .fetch_add(to_send as u64, Ordering::Relaxed);
                stats
                    .bytes_sent
                    .fetch_add(send_buf.len() as u64, Ordering::Relaxed);
            }
            Err(e) => {
                stats.errors.fetch_add(1, Ordering::Relaxed);
                eprintln!(
                    "[Worker {}] TCP write error: {}. Reconnecting...",
                    worker_id, e
                );
                tokio::time::sleep(Duration::from_millis(500)).await;
                // Reconnect through the same helper so TCP_NODELAY survives.
                if let Ok(new_stream) = connect_tcp(target).await {
                    stream = new_stream;
                }
            }
        }

        if target_rate == 0 {
            tokio::task::yield_now().await;
        }
    }
}
