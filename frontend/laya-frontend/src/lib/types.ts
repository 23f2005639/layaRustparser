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

// -----------------------------------------------------------------------------
// Issue #15: Parser & Integrity Management Types
// -----------------------------------------------------------------------------

export interface ParserItem {
  vendor: string;
  device_model: string;
  parser_type: "native_extractor" | "dynamic_onboarded" | string;
  status: "active" | "invalid" | "unreadable" | "malformed" | string;
  source_path?: string | null;
  regex_pattern?: string | null;
  confidence_score?: number | null;
  created_at?: number | null;
}

export interface ParserTestRequest {
  raw_log: string;
  vendor?: string;
  regex_pattern?: string;
  action_mappings?: Record<string, string>;
}

export interface ParserTestResponse {
  matched: boolean;
  vendor: string;
  parsed_ocsf?: Record<string, unknown> | null;
  parse_duration_micros: number;
  raw_hash: string;
  protocol_detected?: string | null;
  notes: string;
}

export interface ParserDefinition {
  vendor: string;
  device_model: string;
  regex_pattern: string;
  action_mappings: Record<string, string>;
  sample_logs?: string[];
  confidence_score: number;
  created_at?: number;
}

export interface ValidationReport {
  passed: boolean;
  total_samples: number;
  matched_samples: number;
  match_percentage: number;
  errors: string[];
}

export interface OnboardRequest {
  vendor: string;
  device_model?: string;
  sample_lines: string[];
  confirm?: boolean;
}

export interface OnboardResponse {
  status: "preview" | "hot_loaded" | string;
  persisted: boolean;
  vendor: string;
  device_model: string;
  parser_definition: ParserDefinition;
  validation_report: ValidationReport;
  json_path?: string | null;
  yaml_path?: string | null;
  message: string;
}

export interface TamperDrillRequest {
  block_id: number;
  leaf_index?: number;
  spoofed_ip?: string;
  confirm?: boolean;
}

export interface TamperReport {
  block_id: number;
  is_valid: boolean;
  calculated_root: string;
  ledger_root: string;
  mismatch_leaf?: number | null;
  stored_leaf_hash?: string | null;
  recalculated_leaf_hash?: string | null;
  timestamp: number;
}

export interface TamperDrillResponse {
  status: "preview" | "tamper_detected" | string;
  executed: boolean;
  target_block_id: number;
  target_leaf_index: number;
  spoofed_ip: string;
  source_evidence_path: string;
  scratch_drill_path: string;
  original_evidence_unmodified: boolean;
  tamper_report?: TamperReport | null;
  message: string;
}

export interface BatcherConfigDisplay {
  max_batch_size: number;
  max_batch_duration_ms: number;
  storage_dir: string;
  ledger_path: string;
  compression: string;
}

export interface BenchmarkSummary {
  mode?: string;
  throughput_speedup_factor?: number;
  latency_reduction_p50_pct?: number;
  [key: string]: unknown;
}

export interface SystemResponse {
  service_name: string;
  version: string;
  air_gapped: boolean;
  uptime_secs: number;
  batcher: BatcherConfigDisplay;
  ingest_queue_capacity: number;
  ingest_queue_depth: number;
  dynamic_parsers_loaded: number;
  total_archived_blocks: number;
  benchmark_summary?: BenchmarkSummary | null;
}

