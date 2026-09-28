import {
  MetricsResponse,
  AlertItem,
  StoredRecordItem,
  AttackVectorItem,
  BlockItem,
  InclusionProofResponse,
  ApiErrorResponse,
} from "./types";

// Mirrors data/fixtures/api/metrics.json
export const mockMetrics: MetricsResponse = {
  eps: 142560.0,
  latency_p50_micros: 1.28,
  latency_p99_micros: 4.12,
  queue_depth: 0,
  queue_capacity: 50000,
  dropped_count: 0,
  lru_hit_rate: 0.962,
  total_ingested: 25000,
  total_parsed: 25000,
  total_blocks: 25,
  vendor_mix: {
    Cisco: 32.5,
    Fortinet: 28.0,
    "Palo Alto Networks": 21.5,
    Netgate: 12.0,
    OISF: 6.0,
    cisco_asa: 32.5,
    fortigate: 28.0,
    paloalto: 21.5,
    pfsense: 12.0,
    suricata: 6.0,
  },
  disposition_breakdown: {
    Allowed: 18240,
    Blocked: 5610,
    Dropped: 1150,
  },
  status: "HEALTHY",
};

// Mirrors data/fixtures/api/alerts.json
export const mockAlerts: AlertItem[] = [
  {
    id: "018e69d7-84b2-7c3a-9e12-4211832049b0",
    alert_type: "tamper_alarm",
    severity: "Critical",
    timestamp: 1789984500000,
    title: "Forensic Tamper Alarm in Block #00000",
    details:
      "Corrupted record at leaf 0: calculated SHA-256 94e9f783307521dd does not match stored hash. Merkle root comparison failed.",
    block_id: 0,
    leaf_index: 0,
  },
  {
    id: "018e69d7-84b2-7c3a-9e12-4211832049b1",
    alert_type: "new_template_drift",
    severity: "Medium",
    timestamp: 1789984455000,
    title: "Parser Drift: Unseen Template Pattern Detected",
    details:
      "DrainMiner identified novel log template: 'RT_FLOW: session <action> <src_ip>/<src_port>-><dst_ip>/<dst_port>'",
    block_id: 1,
    leaf_index: 12,
  },
  {
    id: "018e69d7-84b2-7c3a-9e12-4211832049b2",
    alert_type: "rare_cluster_surge",
    severity: "Low",
    timestamp: 1789984380000,
    title: "Traffic Volume Spike in Rare Cluster #4",
    details:
      "Cluster occurrence exceeded surge multiplier threshold (3.0x above rolling baseline).",
    block_id: 1,
    leaf_index: 88,
  },
];

// Mirrors data/fixtures/api/records_block_1.json with OCSF canonical fields
export const mockRecords: StoredRecordItem[] = [
  {
    event_id: "0195d2c2-84b2-7c3a-9e12-4211832049b0",
    block_id: 1,
    leaf_index: 0,
    timestamp: 1789984478081,
    vendor: "Cisco",
    raw_log:
      "<166>Sep 21 14:00:01 asa-core-fw %ASA-6-302013: Built outbound TCP connection 1000672 for outside:203.0.113.54/25 to inside:10.1.6.180/52369",
    raw_hash:
      "07adfbb9820f436aad9377b6e78d85a4bccc6cae8197c06622a7b6590bd3b081",
    ocsf: {
      activity_id: 1,
      activity_name: "Open",
      category_uid: 4,
      class_uid: 4001,
      type_uid: 400101,
      disposition: "Allowed",
      time: 1789984478081,
      src_endpoint: {
        ip: "203.0.113.54",
        port: 25,
        interface: "outside",
      },
      dst_endpoint: {
        ip: "10.1.6.180",
        port: 52369,
        interface: "inside",
      },
      connection_info: {
        protocol_name: "TCP",
        protocol_num: 6,
        direction: "Outbound",
      },
      metadata: {
        product: {
          vendor_name: "Cisco",
          name: "ASA",
        },
        version: "1.3.0",
      },
    },
  },
  {
    event_id: "0195d2c2-84b2-7c3a-9e12-4211832049b1",
    block_id: 1,
    leaf_index: 1,
    timestamp: 1789984478082,
    vendor: "Fortinet",
    raw_log:
      '<189>date=2026-09-21 time=14:00:02 devname="FGT-DC-EDGE" logid="0000000019" type="traffic" srcip=192.168.7.45 srcport=29853 dstip=203.0.113.46 dstport=53 proto=17 action="deny"',
    raw_hash:
      "4b65ff82a3eb40ccb4d45f8203facb3f0b8f7e3071333a6187924ce3cb09caa0",
    ocsf: {
      activity_id: 3,
      activity_name: "Traffic/Flow",
      category_uid: 4,
      class_uid: 4001,
      type_uid: 400103,
      disposition: "Blocked",
      time: 1789984478082,
      src_endpoint: {
        ip: "192.168.7.45",
        port: 29853,
        interface: "port1",
      },
      dst_endpoint: {
        ip: "203.0.113.46",
        port: 53,
        interface: "port2",
      },
      connection_info: {
        protocol_name: "UDP",
        protocol_num: 17,
        direction: "Outbound",
      },
      metadata: {
        product: {
          vendor_name: "Fortinet",
          name: "FortiGate",
        },
        version: "1.3.0",
      },
    },
  },
  {
    event_id: "0195d2c2-84b2-7c3a-9e12-4211832049b2",
    block_id: 1,
    leaf_index: 2,
    timestamp: 1789984478085,
    vendor: "Palo Alto Networks",
    raw_log:
      "1,2026/09/21 14:00:03,001801000001,TRAFFIC,drop,1,2026/09/21 14:00:03,198.51.100.99,10.0.0.15,0.0.0.0,0.0.0.0,rule-drop,test,test,web-browsing,vsys1,untrust,trust,ethernet1/1,ethernet1/2,default,2026/09/21 14:00:03,1,1,443,443,0,0,0x0,tcp,drop,40,40,0,1,2026/09/21 14:00:03,0,any,0,0,0,0,,US,10.0.0.0-10.255.255.255,0,1,0,policy-deny,0,0,0,0,,fw-core-01,from-policy",
    raw_hash:
      "938fe1a221b068da6c99c7161b9a9d7010e955d5b778239088514ca69192938a",
    ocsf: {
      activity_id: 2,
      activity_name: "Close",
      category_uid: 4,
      class_uid: 4001,
      type_uid: 400102,
      disposition: "Dropped",
      time: 1789984478085,
      src_endpoint: {
        ip: "198.51.100.99",
        port: 443,
        interface: "ethernet1/1",
      },
      dst_endpoint: {
        ip: "10.0.0.15",
        port: 443,
        interface: "ethernet1/2",
      },
      connection_info: {
        protocol_name: "TCP",
        protocol_num: 6,
        direction: "Inbound",
      },
      metadata: {
        product: {
          vendor_name: "Palo Alto Networks",
          name: "PAN-OS",
        },
        version: "1.3.0",
      },
    },
  },
  {
    event_id: "0195d2c2-84b2-7c3a-9e12-4211832049b3",
    block_id: 1,
    leaf_index: 3,
    timestamp: 1789984478091,
    vendor: "OISF",
    raw_log:
      '{"timestamp":"2026-09-21T14:00:04.102Z","flow_id":981273912,"event_type":"alert","src_ip":"194.26.29.114","src_port":44921,"dest_ip":"10.1.6.180","dest_port":22,"proto":"TCP","alert":{"action":"allowed","gid":1,"signature_id":2010935,"rev":2,"signature":"ET SCAN Potential SSH Brute Force","category":"Attempted Information Leak","severity":2}}',
    raw_hash:
      "78a873b22e1189ac3e098d6fa7c22378b885c3e7b1654129ecbd098317a998bc",
    ocsf: {
      activity_id: 1,
      activity_name: "Open",
      category_uid: 4,
      class_uid: 4001,
      type_uid: 400101,
      disposition: "Allowed",
      time: 1789984478091,
      src_endpoint: {
        ip: "194.26.29.114",
        port: 44921,
      },
      dst_endpoint: {
        ip: "10.1.6.180",
        port: 22,
      },
      connection_info: {
        protocol_name: "TCP",
        protocol_num: 6,
      },
      metadata: {
        product: {
          vendor_name: "OISF",
          name: "EVE",
        },
        version: "1.3.0",
      },
    },
  },
];

// Correlated attack vectors matching Page 2 design
export const mockAttackVectors: AttackVectorItem[] = [
  {
    id: "ATK-001",
    timestamp: "2026-09-21 14:42:01.812",
    ip: "194.26.29.114",
    targetService: "SSH / Port 22",
    mitreAttack: "T1110.001 (Password Brute Force)",
    severity: "CRITICAL",
    playbook: "Auto-Drop Edge IP (SOAR #102)",
    status: "BLOCKED",
  },
  {
    id: "ATK-002",
    timestamp: "2026-09-21 14:41:49.201",
    ip: "45.154.255.88",
    targetService: "HTTPS / Port 443",
    mitreAttack: "T1190 (Exploit Public-Facing App)",
    severity: "HIGH",
    playbook: "WAF Rate-Limiting + Shunt",
    status: "CONTAINED",
  },
  {
    id: "ATK-003",
    timestamp: "2026-09-21 14:41:22.094",
    ip: "185.220.101.4",
    targetService: "DNS / Port 53",
    mitreAttack: "T1071.004 (DNS Tunneling Exfil)",
    severity: "CRITICAL",
    playbook: "Sinkhole Query + Alert Tier 3",
    status: "BLOCKED",
  },
  {
    id: "ATK-004",
    timestamp: "2026-09-21 14:40:55.772",
    ip: "89.248.165.71",
    targetService: "BGP / Port 179",
    mitreAttack: "T1498 (Network Denial of Service)",
    severity: "MEDIUM",
    playbook: "BGP Prefix Hijack Filter",
    status: "MITIGATED",
  },
  {
    id: "ATK-005",
    timestamp: "2026-09-21 14:39:10.518",
    ip: "103.145.13.20",
    targetService: "RDP / Port 3389",
    mitreAttack: "T1021.001 (Remote Desktop Protocol)",
    severity: "HIGH",
    playbook: "Network Access Control Revoke",
    status: "BLOCKED",
  },
];

// Mirrors data/fixtures/api/blocks.json
export const mockBlocks: BlockItem[] = [
  {
    block_id: 0,
    timestamp: 1789984478063,
    leaf_count: 1000,
    merkle_root: "e12dfacf15b6cc84fcedf91aeb3119f7d8c7a638e2c7e9541b9bb02d12833b72",
    parquet_file: "block_00000.parquet",
    status: "FAIL",
    size_bytes: 345163,
    file_exists: true,
  },
  {
    block_id: 1,
    timestamp: 1789984478081,
    leaf_count: 1000,
    merkle_root: "398e59a6304ea9fa83b3d9eb5f0739bf081a01ce4d34e30e5c320040fd9e69a8",
    parquet_file: "block_00001.parquet",
    status: "PASS",
    size_bytes: 425310,
    file_exists: true,
  },
  {
    block_id: 2,
    timestamp: 1789984478100,
    leaf_count: 1000,
    merkle_root: "e2e66d040598d535418c173721a4a6cf369f17d217e46429bd941c3bea30f1a1",
    parquet_file: "block_00002.parquet",
    status: "UNAUDITED",
    size_bytes: 0,
    file_exists: false,
  },
];

// Mirrors data/fixtures/api/prove_501.json
export const mockProve501: ApiErrorResponse = {
  error: "Not Implemented",
  code: 501,
  message:
    "Merkle inclusion proof endpoint is stubbed pending completion of #5 ([integrity/M] Ledger fsync + prove/consistency CLI). Pass '?live=true' to execute live RFC 6962 audit path computation.",
  block_id: 1,
  leaf_index: 0,
};

// Mirrors data/fixtures/api/prove_live.json
export const mockProveLive: InclusionProofResponse = {
  block_id: 1,
  leaf_index: 0,
  tree_size: 1000,
  leaf_hash: "bf242bcb35880d5a0c9fbbb8b3df79732672c6d1fdfdfbab75c01f5981317e9e",
  calculated_merkle_root: "398e59a6304ea9fa83b3d9eb5f0739bf081a01ce4d34e30e5c320040fd9e69a8",
  ledger_merkle_root: "398e59a6304ea9fa83b3d9eb5f0739bf081a01ce4d34e30e5c320040fd9e69a8",
  verified: true,
  audit_path: [
    {
      hash: "b5a92d4e8c3f1a2b0c4e5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c",
      side: "Right",
    },
    {
      hash: "c6b03e5f9d4a2b1c0d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d",
      side: "Right",
    },
    {
      hash: "d7c14f6a0e5b3c2d1e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8e",
      side: "Right",
    },
  ],
  standard: "RFC 6962 Certificate Transparency Standard",
};
