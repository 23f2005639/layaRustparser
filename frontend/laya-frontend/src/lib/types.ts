// Types matching backend API contracts (docs/CONTRACTS.md, docs/openapi.yaml, crates/ulpf-cli/src/serve/state.rs)

export type AlertSeverity = "Critical" | "High" | "Medium" | "Low" | "Info";

export interface AlertItem {
  id: string;
  alert_type: string;
  severity: AlertSeverity;
  timestamp: number;
  title: string;
  details: string;
  block_id?: number | null;
  leaf_index?: number | null;
}

export interface MetricsResponse {
  eps: number;
  latency_p50_micros: number;
  latency_p99_micros: number;
  queue_depth: number;
  queue_capacity: number;
  dropped_count: number;
  lru_hit_rate: number;
  total_ingested: number;
  total_parsed: number;
  total_blocks: number;
  vendor_mix: Record<string, number>;
  disposition_breakdown: Record<string, number>;
  status: string;
}

export interface StoredRecordItem {
  event_id: string;
  block_id: number;
  leaf_index: number;
  timestamp: number;
  vendor: string;
  raw_log: string;
  raw_hash: string;
  ocsf: {
    activity_id?: number;
    activity_name?: string;
    category_uid?: number;
    class_uid?: number;
    type_uid?: number;
    disposition?: string;
    time?: number;
    src_endpoint?: {
      ip?: string;
      port?: number;
      interface?: string;
    };
    dst_endpoint?: {
      ip?: string;
      port?: number;
      interface?: string;
    };
    connection_info?: {
      protocol_name?: string;
      protocol_num?: number;
      direction?: string;
    };
    metadata?: {
      product?: {
        vendor_name?: string;
        name?: string;
      };
      version?: string;
    };
    [key: string]: unknown;
  };
}

export interface BlockRecordsResponse {
  block_id: number;
  total_records_in_block: number;
  filtered_records_count: number;
  offset: number;
  limit: number;
  records: StoredRecordItem[];
}

export interface BlockItem {
  block_id: number;
  timestamp: number;
  leaf_count: number;
  merkle_root: string;
  parquet_file: string;
  status: "PASS" | "FAIL" | "FILE_MISSING" | "UNAUDITED";
  size_bytes: number;
  file_exists: boolean;
}

export interface AttackVectorItem {
  id: string;
  timestamp: string;
  ip: string;
  targetService: string;
  mitreAttack: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  playbook: string;
  status: "BLOCKED" | "CONTAINED" | "INVESTIGATING" | "MITIGATED";
}

export interface TimeSeriesPoint {
  time: string;
  eps: number;
  latency_p50: number;
}

export interface AuditStep {
  hash: string;
  side: "Left" | "Right";
}

export interface InclusionProofResponse {
  block_id: number;
  leaf_index: number;
  tree_size: number;
  leaf_hash: string;
  calculated_merkle_root: string;
  ledger_merkle_root: string | null;
  verified: boolean;
  audit_path: AuditStep[];
  standard: string;
}

export interface ApiErrorResponse {
  error: string;
  code: number;
  message: string;
  block_id?: number | null;
  leaf_index?: number | null;
}

export interface RecordsQueryParams {
  offset?: number;
  limit?: number;
  vendor?: string;
  disposition?: string;
  ip?: string;
  query?: string;
}
