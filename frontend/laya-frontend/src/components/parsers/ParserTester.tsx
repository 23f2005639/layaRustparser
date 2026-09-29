"use client";

import React, { useState } from "react";
import { ParserTestRequest, ParserTestResponse } from "@/lib/types";
import { testParser, ApiError } from "@/lib/api";
import {
  Play,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Clock,
  Terminal,
  FileCode,
  Shield,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface ParserTesterProps {
  availableVendors: string[];
  selectedVendor?: string;
  onVendorChange?: (vendor: string) => void;
  isOffline?: boolean;
}

const SAMPLE_LOGS: { name: string; vendor: string; log: string }[] = [
  {
    name: "Cisco ASA",
    vendor: "cisco_asa",
    log: "<166>Sep 21 14:00:01 asa-core-fw %ASA-6-302013: Built outbound TCP connection 1000672 for outside:203.0.113.54/25 to inside:10.1.6.180/52369",
  },
  {
    name: "FortiGate",
    vendor: "fortigate",
    log: `date=2026-09-21 time=14:00:01 devname="FG-CORE-01" type="traffic" subtype="forward" level="notice" action="accept" srcip=192.168.1.100 dstip=198.51.100.4 srcport=54321 dstport=443 proto=6`,
  },
  {
    name: "pfSense",
    vendor: "pfsense",
    log: "filterlog: 4,,,1000000103,igb0,match,pass,in,4,0x0,,64,0,0,DF,6,tcp,60,192.168.1.50,1.1.1.1,51423,443,0,S,12345678,,65535,,mss;sackOK;TS",
  },
  {
    name: "Juniper SRX",
    vendor: "juniper_srx",
    log: "RT_FLOW: RT_FLOW_SESSION_CREATE: session created 192.168.10.55/49152->10.0.0.1/443 None None 6 sample-policy trust untrust 12345 N/A(N/A) ge-0/0/0.0",
  },
];

export function ParserTester({
  availableVendors,
  selectedVendor = "cisco_asa",
  onVendorChange,
}: ParserTesterProps) {
  const [vendor, setVendor] = useState(selectedVendor);
  const [prevSelectedVendor, setPrevSelectedVendor] = useState(selectedVendor);
  const [rawLog, setRawLog] = useState(SAMPLE_LOGS[0].log);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParserTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Copy states
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Adjust state during render if prop changes
  if (selectedVendor !== prevSelectedVendor) {
    setPrevSelectedVendor(selectedVendor);
    setVendor(selectedVendor);
    const match = SAMPLE_LOGS.find((s) => s.vendor === selectedVendor);
    if (match) {
      setRawLog(match.log);
    }
  }

  const handleSelectPreset = (sample: (typeof SAMPLE_LOGS)[0]) => {
    setVendor(sample.vendor);
    if (onVendorChange) onVendorChange(sample.vendor);
    setRawLog(sample.log);
    setError(null);
  };

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawLog.trim()) {
      setError("Please provide a raw log line to test.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const payload: ParserTestRequest = {
      raw_log: rawLog.trim(),
      vendor: vendor.trim() || undefined,
    };

    try {
      const res = await testParser(payload);
      setResult(res.data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isOffline) {
          setError("Backend Offline: Unable to perform dry-run test.");
        } else {
          setError(err.message || `Test failed with status ${err.status}`);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to run parser test");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "hash" | "json") => {
    navigator.clipboard.writeText(text);
    if (type === "hash") {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A1D20] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Terminal className="w-5 h-5 text-[#0284C7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1E293B]">
                Dry-Run Parser Test Interface
              </h2>
              <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                POST /parsers/test
              </span>
            </div>
            <p className="text-[0.75rem] text-[#64748B]">
              Dry-run raw syslog against an active parser or universal baseline without mutating disk.
            </p>
          </div>
        </div>

        {/* Safety pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#F0F3FF] border border-[#C5C6CA]/40 text-[#0284C7] text-[0.6875rem] font-mono">
          <Shield className="w-3.5 h-3.5 text-[#0284C7]" />
          <span>100% Read-Only Dry-Run</span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Preset quick-loaders */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
          <span className="text-[0.75rem] font-mono text-[#64748B] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" /> Quick Load Sample Presets:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_LOGS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => handleSelectPreset(s)}
                className={`text-[0.75rem] font-mono px-2.5 py-1 rounded transition-colors border shadow-xs ${
                  vendor === s.vendor
                    ? "bg-white text-[#0284C7] font-semibold border-[#0284C7]/40 shadow-sm"
                    : "bg-white text-[#475569] hover:text-[#1E293B] border-[#CBD5E1] hover:bg-slate-50"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Test form */}
        <form onSubmit={handleRunTest} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Vendor Selector */}
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <label className="text-[0.75rem] font-mono font-semibold text-[#1E293B] flex items-center justify-between">
                <span>Vendor Identifier</span>
                <span className="text-[0.6875rem] text-[#64748B]">Optional / Baseline</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="vendor-options"
                  placeholder="e.g. cisco_asa or universal"
                  value={vendor}
                  onChange={(e) => {
                    setVendor(e.target.value);
                    if (onVendorChange) onVendorChange(e.target.value);
                  }}
                  className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[0.8125rem] text-[#1E293B] font-mono placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                />
                <datalist id="vendor-options">
                  <option value="universal" />
                  {availableVendors.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Raw Log Input */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[0.75rem] font-mono font-semibold text-[#1E293B] flex items-center justify-between">
                <span>Raw Log Line (Syslog / RFC 5424)</span>
                <span className="text-[0.6875rem] text-[#64748B]">Single line payload</span>
              </label>
              <textarea
                rows={2}
                placeholder="Paste raw syslog event here..."
                value={rawLog}
                onChange={(e) => setRawLog(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[0.8125rem] font-mono text-[#1E293B] placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] resize-none"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[0.6875rem] font-mono text-[#64748B]">
              Calculates SHA-256 raw hash, evaluates regex patterns, and maps to OCSF NetworkActivity schema.
            </span>

            <button
              type="submit"
              disabled={loading || !rawLog.trim()}
              className="px-4 py-2 rounded bg-[#1A1D20] text-white hover:bg-[#2E343A] disabled:opacity-50 text-[0.8125rem] font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0284C7]" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#0284C7] fill-[#0284C7]" />
                  <span>Run Dry-Run Test</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[0.8125rem] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="mt-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden flex flex-col gap-4 p-4 shadow-sm animate-fade-in">
            {/* Result Header Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                {result.matched ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    PARSER MATCHED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold bg-[#FF5C5C]/15 text-[#FF5C5C] border border-[#FF5C5C]/40 shadow-xs">
                    <XCircle className="w-4 h-4 text-[#FF5C5C]" />
                    NO MATCH / REJECTED
                  </span>
                )}

                <div className="flex items-center gap-2 text-[0.75rem] font-mono text-[#64748B]">
                  <span>Vendor: <strong className="text-[#1E293B]">{result.vendor}</strong></span>
                  {result.protocol_detected && (
                    <>
                      <span>•</span>
                      <span>Protocol: <strong className="text-[#0284C7]">{result.protocol_detected}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Latency */}
              <div className="flex items-center gap-1 text-[0.75rem] font-mono text-[#64748B] bg-white px-2.5 py-1 rounded border border-[#CBD5E1]">
                <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Parse Duration:</span>
                <span className="text-[#1E293B] font-semibold">{result.parse_duration_micros} µs</span>
              </div>
            </div>

            {/* SHA-256 Hash Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase shrink-0">
                  SHA-256 Raw Hash:
                </span>
                <code className="text-[0.75rem] font-mono text-[#1E293B] truncate select-all">
                  {result.raw_hash}
                </code>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(result.raw_hash, "hash")}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.6875rem] font-mono text-[#475569] hover:text-[#1E293B] hover:bg-slate-100 border border-[#CBD5E1] shrink-0"
              >
                {copiedHash ? (
                  <>
                    <Check className="w-3 h-3 text-[#10B981]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#64748B]" />
                    <span>Copy Hash</span>
                  </>
                )}
              </button>
            </div>

            {/* OCSF Normalized Payload Preview */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.75rem] font-mono font-semibold text-[#1E293B] flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-[#0284C7]" /> Normalized OCSF Representation (v1.3)
                </span>
                {result.parsed_ocsf && (
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(result.parsed_ocsf, null, 2), "json")
                    }
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.6875rem] font-mono text-[#475569] hover:text-[#1E293B] hover:bg-slate-100 border border-[#CBD5E1]"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3 h-3 text-[#10B981]" />
                        <span>Copied JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#64748B]" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {result.parsed_ocsf ? (
                <pre className="p-3 bg-white rounded-lg border border-[#E2E8F0] font-mono text-[0.75rem] text-[#1E293B] overflow-x-auto max-h-64 select-text">
                  {JSON.stringify(result.parsed_ocsf, null, 2)}
                </pre>
              ) : (
                <div className="p-4 bg-white rounded-lg border border-[#E2E8F0] text-center text-[#64748B] text-[0.75rem] font-mono">
                  No OCSF activity object produced for this raw log line.
                </div>
              )}
            </div>

            {/* Notes */}
            {result.notes && (
              <div className="text-[0.6875rem] font-mono text-[#64748B] italic">
                Notes: {result.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
