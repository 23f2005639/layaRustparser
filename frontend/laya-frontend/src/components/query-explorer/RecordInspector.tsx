"use client";

import React, { useState } from "react";
import {
  StoredRecordItem,
  InclusionProofResponse,
  ApiErrorResponse,
} from "@/lib/types";
import { getProveInclusion, exportEvidenceBundle, ApiError } from "@/lib/api";
import {
  FileText,
  FileCode,
  ShieldCheck,
  ShieldAlert,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Fingerprint,
  Tag,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Network,
  Share2,
} from "lucide-react";

interface RecordInspectorProps {
  record: StoredRecordItem | null;
  onPivot: (field: "ip" | "vendor" | "disposition", value: string) => void;
  onClose?: () => void;
  isOffline?: boolean;
}

export function RecordInspector({
  record,
  onPivot,
  isOffline = false,
}: RecordInspectorProps) {
  // Clipboard states
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);

  // Proof state
  const [proofLoading, setProofLoading] = useState(false);
  const [proofData, setProofData] = useState<InclusionProofResponse | null>(null);
  const [proofError, setProofError] = useState<ApiErrorResponse | null>(null);
  const [proofStatus, setProofStatus] = useState<number | null>(null);
  const [proofOffline, setProofOffline] = useState(false);
  const [showAuditPath, setShowAuditPath] = useState(false);

  // Export state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!record) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#64748B] flex items-center justify-center">
          <FileText className="w-6 h-6 text-[#0284C7]" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h3 className="text-base font-semibold text-[#1E293B]">No record selected</h3>
          <p className="text-xs text-[#64748B]">
            Click any row in the results table to view its raw syslog payload, normalized OCSF v1.3 representation, and cryptographic proof.
          </p>
        </div>
      </div>
    );
  }

  // Extract pivot candidates
  const recordIp =
    record.ocsf?.src_endpoint?.ip ||
    record.ocsf?.dst_endpoint?.ip ||
    (record.raw_log.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/) || [])[0];
  const recordVendor = record.vendor;
  const recordDisposition = record.ocsf?.disposition;

  // Copy handlers
  const handleCopy = (text: string, type: "raw" | "json" | "sha") => {
    navigator.clipboard.writeText(text);
    if (type === "raw") {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } else if (type === "json") {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    }
  };

  // Proof Request Handler
  const handleRequestProof = async (live: boolean = false) => {
    setProofLoading(true);
    setProofOffline(false);
    setProofError(null);
    setProofData(null);
    setProofStatus(null);

    try {
      const res = await getProveInclusion(record.block_id, record.leaf_index, live);
      setProofStatus(res.status);
      if (res.status === 200 && res.data) {
        setProofData(res.data);
      } else if (res.status === 501 && res.error) {
        setProofError(res.error);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isOffline) {
          setProofOffline(true);
        } else if (err.status === 501 && err.data) {
          setProofStatus(501);
          setProofError(err.data);
        } else {
          setProofError(
            err.data || {
              error: "Proof Error",
              code: err.status || 500,
              message: err.message,
            }
          );
        }
      } else {
        setProofError({
          error: "Client Error",
          code: 500,
          message: err instanceof Error ? err.message : "Failed to verify inclusion proof",
        });
      }
    } finally {
      setProofLoading(false);
    }
  };

  // Export Bundle Handler
  const handleExportBundle = async () => {
    setExportLoading(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      const res = await exportEvidenceBundle(record.block_id);
      setExportSuccess(`Evidence bundle ${res.filename} exported successfully.`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setExportError(err.message);
      } else {
        setExportError(err instanceof Error ? err.message : "Evidence export unavailable.");
      }
    } finally {
      setExportLoading(false);
    }
  };

  const ocsfFormatted = JSON.stringify(record.ocsf, null, 2);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col gap-5 shadow-sm">
      {/* Inspector Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A1D20] text-white flex items-center justify-center shrink-0">
            <Fingerprint className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1E293B]">Record Forensics & Provenance</h2>
              <span className="font-mono text-xs text-[#0284C7] bg-[#0284C7]/10 px-2 py-0.5 rounded border border-[#0284C7]/30">
                Leaf #{record.leaf_index}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Side-by-side lossless raw syslog comparison against normalized OCSF v1.3 schema
            </p>
          </div>
        </div>

        {/* Action Buttons: Export & Proof */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBundle}
            disabled={exportLoading || isOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
              isOffline
                ? "bg-slate-200 text-slate-500 border border-slate-300"
                : "text-white bg-[#1A1D20] hover:bg-[#2E343A]"
            }`}
            title={
              isOffline
                ? "Backend Offline: Evidence bundle export requires an active backend connection"
                : "Download authoritative .tar.gz bundle from backend"
            }
          >
            <Download
              className={`w-3.5 h-3.5 ${isOffline ? "text-slate-400" : "text-[#0284C7]"} ${
                exportLoading ? "animate-bounce" : ""
              }`}
            />
            {exportLoading
              ? "Preparing bundle..."
              : isOffline
              ? "Export Unavailable (Offline)"
              : "Export Evidence Bundle"}
          </button>
        </div>
      </div>

      {/* Export Notifications */}
      {exportSuccess && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#10B981]" />
            <span className="font-medium">{exportSuccess}</span>
          </div>
          <button
            onClick={() => setExportSuccess(null)}
            className="text-xs hover:underline text-[#10B981]"
          >
            Dismiss
          </button>
        </div>
      )}

      {exportError && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[#FF5C5C] text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF5C5C]" />
            <span className="font-medium">{exportError}</span>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="text-xs hover:underline text-[#FF5C5C]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Provenance Metadata Grid */}
      <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Fingerprint className="w-3.5 h-3.5 text-[#0284C7]" />
            Cryptographic Provenance
          </span>
          <span className="text-[0.6875rem] font-mono text-[#64748B]">
            RFC 6962 Leaf Anchor
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Event ID */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[#64748B] font-mono text-[0.6875rem]">EVENT ID</span>
            <span
              className="font-mono text-[#1E293B] truncate"
              title={record.event_id || "Not available"}
            >
              {record.event_id || "Not available"}
            </span>
          </div>

          {/* Block ID & Leaf */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[#64748B] font-mono text-[0.6875rem]">BLOCK / LEAF</span>
            <span className="font-mono text-[#1E293B]">
              Block #{String(record.block_id).padStart(5, "0")} / Leaf #{record.leaf_index}
            </span>
          </div>

          {/* Timestamp */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[#64748B] font-mono text-[0.6875rem]">TIMESTAMP</span>
            <span
              className="font-mono text-[#1E293B] truncate"
              title={new Date(record.timestamp).toISOString()}
            >
              {new Date(record.timestamp).toUTCString()}
            </span>
          </div>

          {/* SHA-256 Digest */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[#64748B] font-mono text-[0.6875rem]">RAW SHA-256</span>
            <div className="flex items-center gap-1">
              <span
                className="font-mono text-[0.6875rem] text-[#0284C7] truncate max-w-[140px]"
                title={record.raw_hash || "Not available"}
              >
                {record.raw_hash || "Not available"}
              </span>
              {record.raw_hash && (
                <button
                  onClick={() => handleCopy(record.raw_hash, "sha")}
                  className="p-1 hover:bg-slate-200 rounded text-[#64748B] hover:text-[#1E293B] transition-colors"
                  title="Copy SHA-256 Digest"
                >
                  {copiedSha ? (
                    <Check className="w-3 h-3 text-[#10B981]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Investigation Pivots Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-[#E2E8F0]">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 mr-1">
          <Share2 className="w-3.5 h-3.5 text-[#0284C7]" />
          Investigation Pivots:
        </span>

        {recordIp && (
          <button
            onClick={() => !isOffline && onPivot("ip", recordIp)}
            disabled={isOffline}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg transition-colors ${
              isOffline
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                : "bg-[#0284C7]/10 hover:bg-[#0284C7]/20 text-[#0284C7] border border-[#0284C7]/30"
            }`}
            title={
              isOffline
                ? "Backend Offline: Pivot requires active backend connection"
                : `Pivot query to IP: ${recordIp}`
            }
          >
            <Network className="w-3 h-3" />
            Pivot by IP ({recordIp})
          </button>
        )}

        {recordVendor && (
          <button
            onClick={() => !isOffline && onPivot("vendor", recordVendor)}
            disabled={isOffline}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg transition-colors ${
              isOffline
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                : "bg-slate-100 hover:bg-slate-200 text-[#1E293B] border border-[#CBD5E1]"
            }`}
            title={
              isOffline
                ? "Backend Offline: Pivot requires active backend connection"
                : `Pivot query to Vendor: ${recordVendor}`
            }
          >
            <Tag className="w-3 h-3 text-[#64748B]" />
            Pivot by Vendor ({recordVendor})
          </button>
        )}

        {recordDisposition && (
          <button
            onClick={() => !isOffline && onPivot("disposition", recordDisposition)}
            disabled={isOffline}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg transition-colors ${
              isOffline
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                : "bg-slate-100 hover:bg-slate-200 text-[#1E293B] border border-[#CBD5E1]"
            }`}
            title={
              isOffline
                ? "Backend Offline: Pivot requires active backend connection"
                : `Pivot query to Disposition: ${recordDisposition}`
            }
          >
            <ExternalLink className="w-3 h-3 text-[#64748B]" />
            Pivot by Disposition ({recordDisposition})
          </button>
        )}
      </div>

      {/* Side-by-Side Raw vs OCSF View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Lossless Raw Log */}
        <div className="flex flex-col gap-2 bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0]">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0284C7]" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1E293B]">
                Raw Syslog Payload (Lossless)
              </span>
            </div>
            <button
              onClick={() => handleCopy(record.raw_log, "raw")}
              className="flex items-center gap-1 text-[0.6875rem] font-mono text-[#64748B] hover:text-[#1E293B] bg-white px-2 py-1 rounded border border-[#E2E8F0] transition-colors"
              title="Copy Raw Log"
            >
              {copiedRaw ? (
                <>
                  <Check className="w-3 h-3 text-[#10B981]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy Raw
                </>
              )}
            </button>
          </div>
          <pre className="font-mono text-xs text-[#1E293B] bg-white p-3 rounded-lg border border-[#E2E8F0] overflow-x-auto whitespace-pre-wrap break-all leading-relaxed shadow-inner max-h-[380px]">
            {record.raw_log}
          </pre>
          <span className="text-[0.6875rem] font-mono text-[#64748B]">
            Original byte sequence preserved exactly without mutation or trimming.
          </span>
        </div>

        {/* Right: Normalized OCSF Representation */}
        <div className="flex flex-col gap-2 bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0]">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#0284C7]" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1E293B]">
                Normalized OCSF v1.3 Schema
              </span>
            </div>
            <button
              onClick={() => handleCopy(ocsfFormatted, "json")}
              className="flex items-center gap-1 text-[0.6875rem] font-mono text-[#64748B] hover:text-[#1E293B] bg-white px-2 py-1 rounded border border-[#E2E8F0] transition-colors"
              title="Copy OCSF JSON"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3 h-3 text-[#10B981]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy JSON
                </>
              )}
            </button>
          </div>
          <pre className="font-mono text-xs text-[#0284C7] bg-[#1A1D20] p-3 rounded-lg border border-[#CBD5E1] overflow-x-auto whitespace-pre leading-relaxed shadow-inner max-h-[380px]">
            {ocsfFormatted}
          </pre>
          <span className="text-[0.6875rem] font-mono text-[#64748B]">
            Canonical Open Cybersecurity Schema Framework representation.
          </span>
        </div>
      </div>

      {/* Merkle Inclusion Proof Section */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
            <h3 className="text-sm font-semibold text-[#1E293B]">RFC 6962 Merkle Inclusion Proof</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRequestProof(false)}
              disabled={proofLoading || isOffline}
              className="px-2.5 py-1 text-xs font-mono bg-white hover:bg-slate-100 text-[#1E293B] border border-[#CBD5E1] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                isOffline
                  ? "Backend Offline: Proof verification requires active connection"
                  : "Default contract endpoint GET /prove/:block/:leaf"
              }
            >
              Check Standard Proof
            </button>

            <button
              onClick={() => handleRequestProof(true)}
              disabled={proofLoading || isOffline}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isOffline
                  ? "bg-slate-200 text-slate-500 border border-slate-300"
                  : "text-white bg-[#1A1D20] hover:bg-[#2E343A]"
              }`}
              title={
                isOffline
                  ? "Backend Offline: Live inclusion proof requires active backend connection"
                  : "Execute live RFC 6962 audit path calculation with ?live=true"
              }
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isOffline ? "text-slate-400" : "text-[#0284C7]"} ${
                  proofLoading ? "animate-spin" : ""
                }`}
              />
              {isOffline ? "Proof Unavailable (Offline)" : "Run Live Proof (?live=true)"}
            </button>
          </div>
        </div>

        {/* Proof State: Offline */}
        {(proofOffline || isOffline) && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Backend Offline:</strong> Cryptographic Merkle inclusion proof calculation is paused. Start the backend to verify RFC 6962 audit paths.
            </span>
          </div>
        )}

        {/* Proof State: 501 Not Implemented (distinguished from offline!) */}
        {proofStatus === 501 && proofError && (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                Proof unavailable — Merkle inclusion proof endpoint is currently stubbed.
              </span>
              <span className="font-mono text-[0.6875rem] text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                HTTP 501
              </span>
            </div>
            <p className="text-amber-700">{proofError.message}</p>
            <div className="pt-1">
              <button
                onClick={() => handleRequestProof(true)}
                className="text-xs font-semibold text-[#0284C7] hover:underline flex items-center gap-1"
              >
                Execute live computation now using ?live=true →
              </button>
            </div>
          </div>
        )}

        {/* Proof State: Other Error */}
        {proofStatus !== null && proofStatus !== 501 && proofStatus !== 200 && proofError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-[#FF5C5C] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF5C5C] shrink-0" />
            <span>Proof Error: {proofError.message}</span>
          </div>
        )}

        {/* Proof State: 200 OK Live Proof Result */}
        {proofData && (
          <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3.5 flex flex-col gap-3 text-xs">
            {/* Status Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#64748B]">Verification Result:</span>
                {proofData.verified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    VERIFIED (Cryptographic RFC 6962 Math & Ledger Match)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-[#FF5C5C]/10 text-[#FF5C5C] border border-[#FF5C5C]/30">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    TAMPER DETECTED / NOT VERIFIED
                  </span>
                )}
              </div>
              <span className="font-mono text-[0.6875rem] text-[#64748B]">
                {proofData.standard}
              </span>
            </div>

            {/* Proof Technical Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
              <div className="flex flex-col gap-0.5">
                <span className="text-[#64748B] text-[0.6875rem]">LEAF HASH (SHA-256)</span>
                <span className="text-[#1E293B] truncate" title={proofData.leaf_hash}>
                  {proofData.leaf_hash}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[#64748B] text-[0.6875rem]">CALCULATED ROOT</span>
                <span className="text-[#1E293B] truncate" title={proofData.calculated_merkle_root}>
                  {proofData.calculated_merkle_root}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[#64748B] text-[0.6875rem]">LEDGER ANCHORED ROOT</span>
                <span
                  className="text-[#0284C7] truncate"
                  title={proofData.ledger_merkle_root || "None"}
                >
                  {proofData.ledger_merkle_root || "No ledger entry"}
                </span>
              </div>
            </div>

            {/* Audit Path Steps Accordion */}
            {proofData.audit_path && proofData.audit_path.length > 0 && (
              <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-2">
                <button
                  onClick={() => setShowAuditPath(!showAuditPath)}
                  className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#1E293B] hover:text-[#0284C7] transition-colors"
                >
                  {showAuditPath ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#0284C7]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#0284C7]" />
                  )}
                  Audit Path Steps ({proofData.audit_path.length} hops)
                </button>

                {showAuditPath && (
                  <div className="flex flex-col gap-1.5 bg-white p-2.5 rounded border border-[#E2E8F0]">
                    {proofData.audit_path.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[0.6875rem] font-mono p-1 rounded bg-[#F8FAFC]"
                      >
                        <span className="text-[#64748B]">Step #{idx + 1} ({step.side} sibling):</span>
                        <span className="text-[#0284C7] truncate max-w-[280px]" title={step.hash}>
                          {step.hash}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty prompt when proof not yet run */}
        {!proofData && proofStatus === null && !proofOffline && (
          <div className="text-xs text-[#64748B] font-mono">
            Inclusion proof has not been computed for this leaf yet. Click &quot;Check Standard Proof&quot; or &quot;Run Live Proof (?live=true)&quot; above.
          </div>
        )}
      </div>
    </div>
  );
}
