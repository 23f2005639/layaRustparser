"use client";

import React from "react";
import { SystemResponse } from "@/lib/types";
import {
  Activity,
  Sliders,
  Archive,
  Clock,
  CheckCircle2,
  Server,
  Zap,
} from "lucide-react";

interface QueueStatusCardProps {
  system: SystemResponse;
  eps?: number | null;
}

export function QueueStatusCard({ system, eps }: QueueStatusCardProps) {
  const depthPct =
    system.ingest_queue_capacity > 0
      ? ((system.ingest_queue_depth / system.ingest_queue_capacity) * 100).toFixed(2)
      : "0.00";

  const formatUptime = (secs: number) => {
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A1D20] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Activity className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">
              RingBuffer Ingest Queue &amp; Telemetry
            </h2>
            <p className="text-[0.75rem] text-[#64748B]">
              Real-time buffer capacity, dynamic parsers, and sealed ledger blocks.
            </p>
          </div>
        </div>

        <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Queue: Uncongested
        </span>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Queue Depth Progress Bar */}
        <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.75rem] font-mono font-semibold text-[#1E293B] flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#0284C7]" /> Ingest RingBuffer Queue Utilization
            </span>
            <span className="text-[0.75rem] font-mono text-[#64748B]">
              <strong className="text-[#1E293B]">
                {system.ingest_queue_depth.toLocaleString()}
              </strong>{" "}
              / {system.ingest_queue_capacity.toLocaleString()} slots ({depthPct}%)
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-[#10B981] rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(1, Math.min(100, Number(depthPct)))}%`,
              }}
            />
          </div>

          <span className="text-[0.6875rem] text-[#64748B]">
            Lock-free crossbeam / tokio mpsc ring buffer drops zero packets under normal saturation.
          </span>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Ingesting / EPS */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
                Ingesting / EPS
              </span>
              <Zap className="w-4 h-4 text-[#10B981]" />
            </div>
            <span className="text-xl font-mono font-bold text-[#1E293B]">
              {(eps ?? 0).toLocaleString("en-US")} EPS
            </span>
            <span className="text-[0.6875rem] text-[#64748B]">
              Real-time throughput from <code>/metrics</code>
            </span>
          </div>

          {/* Dynamic Parsers */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
                Dynamic Parsers
              </span>
              <Sliders className="w-4 h-4 text-[#0284C7]" />
            </div>
            <span className="text-xl font-mono font-bold text-[#1E293B]">
              {system.dynamic_parsers_loaded}
            </span>
            <span className="text-[0.6875rem] text-[#64748B]">
              Hot-loaded from <code>data/parsers/</code>
            </span>
          </div>

          {/* Archived Blocks */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
                Archived Blocks
              </span>
              <Archive className="w-4 h-4 text-[#10B981]" />
            </div>
            <span className="text-xl font-mono font-bold text-[#1E293B]">
              {system.total_archived_blocks.toLocaleString()}
            </span>
            <span className="text-[0.6875rem] text-[#64748B]">
              Sealed in ledger &amp; Parquet store
            </span>
          </div>

          {/* Process Uptime */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
                System Uptime
              </span>
              <Clock className="w-4 h-4 text-[#0284C7]" />
            </div>
            <span className="text-xl font-mono font-bold text-[#1E293B]">
              {formatUptime(system.uptime_secs)}
            </span>
            <span className="text-[0.6875rem] font-mono text-[#64748B]">
              {system.uptime_secs.toLocaleString()} total elapsed secs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
