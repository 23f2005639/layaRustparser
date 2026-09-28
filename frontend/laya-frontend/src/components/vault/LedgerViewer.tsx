"use client";

import React, { useState } from "react";
import { BlockItem } from "@/lib/types";
import { exportEvidenceBundle, ApiError } from "@/lib/api";
import {
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileQuestion,
  Search,
  RefreshCw,
  Download,
  Fingerprint,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";

interface LedgerViewerProps {
  blocks: BlockItem[];
  loading: boolean;
  onRefresh: () => void;
  onSelectBlockForProof?: (blockId: number) => void;
  onSelectBlockForDrill?: (blockId: number) => void;
  isOffline?: boolean;
}

export function LedgerViewer({
  blocks,
  loading,
  onRefresh,
  onSelectBlockForProof,
  onSelectBlockForDrill,
}: LedgerViewerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [exportingBlockId, setExportingBlockId] = useState<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const filtered = blocks.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.block_id.toString().includes(q) ||
      b.merkle_root.toLowerCase().includes(q) ||
      b.parquet_file.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q)
    );
  });

  const passCount = blocks.filter((b) => b.status === "PASS").length;
  const failCount = blocks.filter((b) => b.status === "FAIL").length;
  const unauditedCount = blocks.filter((b) => b.status === "UNAUDITED").length;

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExport = async (blockId: number) => {
    setExportingBlockId(blockId);
    setExportError(null);
    try {
      await exportEvidenceBundle(blockId);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setExportError(err.message);
      } else {
        setExportError(err instanceof Error ? err.message : "Failed to export bundle");
      }
    } finally {
      setExportingBlockId(null);
    }
  };

  const renderStatusBadge = (status: BlockItem["status"]) => {
    switch (status) {
      case "PASS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS
          </span>
        );
      case "FAIL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold bg-[#FF5C5C]/15 text-[#FF5C5C] border border-[#FF5C5C]/30 animate-pulse">
            <XCircle className="w-3.5 h-3.5" />
            FAIL
          </span>
        );
      case "FILE_MISSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.75rem] font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <FileQuestion className="w-3.5 h-3.5" />
            MISSING
          </span>
        );
      case "UNAUDITED":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.75rem] font-medium bg-amber-50 text-amber-700 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            UNAUDITED
          </span>
        );
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A1D20] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Lock className="w-5 h-5 text-[#0284C7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1E293B]">
                Archived Parquet Blocks &amp; Cryptographic Ledger
              </h2>
              <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-[#F0F3FF] border border-[#C5C6CA]/40 text-[#0284C7] font-semibold">
                {blocks.length} Blocks Sealed
              </span>
            </div>
            <p className="text-[0.75rem] text-[#64748B]">
              Append-only WORM ledger anchors with RFC 6962 SHA-256 Merkle root trees.
            </p>
          </div>
        </div>

        {/* Status Filter Buttons & Search */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 text-[0.75rem] font-mono text-[#64748B] mr-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Verified: {passCount}
            </span>
            {failCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 border border-red-200 text-red-700 font-semibold">
                <XCircle className="w-3.5 h-3.5 text-red-600" /> Tampered: {failCount}
              </span>
            )}
            {unauditedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Unaudited: {unauditedCount}
              </span>
            )}
          </div>

          {/* Status filter toggle */}
          <div className="flex items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded p-0.5 text-[0.6875rem] font-mono">
            {(["ALL", "PASS", "FAIL"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  statusFilter === s
                    ? "bg-white text-[#1E293B] font-bold shadow-xs border border-[#CBD5E1]"
                    : "text-[#64748B] hover:text-[#1E293B]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search block or hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[0.75rem] text-[#1E293B] placeholder:text-[#64748B]/70 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh blocks list from ledger"
            className="h-8 px-2.5 rounded bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#475569] hover:text-[#1E293B] text-[0.75rem] flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0284C7]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-800 text-[0.75rem] font-mono flex items-center justify-between">
          <span>{exportError}</span>
          <button
            onClick={() => setExportError(null)}
            className="text-red-600 hover:text-red-900 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[0.8125rem]">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-mono text-[0.6875rem] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Block ID</th>
              <th className="py-3 px-4 font-semibold">Timestamp</th>
              <th className="py-3 px-4 font-semibold">Leaf Count</th>
              <th className="py-3 px-4 font-semibold">Master Merkle Root Hash</th>
              <th className="py-3 px-4 font-semibold">Size</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading && blocks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#64748B]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0284C7]" />
                  Loading cryptographic ledger...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#64748B]">
                  No matching blocks found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const formattedId = `#${String(item.block_id).padStart(5, "0")}`;
                const dateStr = new Date(item.timestamp).toLocaleString("en-US", {
                  dateStyle: "short",
                  timeStyle: "medium",
                });
                const isTampered = item.status === "FAIL";

                return (
                  <tr
                    key={item.block_id}
                    className={`transition-colors ${
                      isTampered
                        ? "bg-red-50/40 hover:bg-red-50/70"
                        : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {/* Block ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1E293B] text-[0.875rem]">
                          {formattedId}
                        </span>
                        {!item.file_exists && (
                          <span className="text-[0.625rem] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-300">
                            unwritten
                          </span>
                        )}
                      </div>
                      <span className="text-[0.6875rem] font-mono text-[#64748B]">
                        {item.parquet_file}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-[#475569] font-mono text-[0.75rem]">
                      {dateStr}
                    </td>

                    {/* Leaf Count */}
                    <td className="py-3 px-4 text-[#1E293B] font-mono font-medium">
                      {item.leaf_count.toLocaleString("en-US")}
                    </td>

                    {/* Merkle Root */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code
                          className={`font-mono text-[0.75rem] truncate max-w-[200px] xl:max-w-xs ${
                            isTampered ? "text-red-700 font-bold" : "text-[#1E293B]"
                          }`}
                          title={item.merkle_root}
                        >
                          {item.merkle_root}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(item.merkle_root)}
                          className="p-1 rounded hover:bg-slate-100 text-[#64748B] hover:text-[#1E293B] shrink-0"
                          title="Copy Merkle Root"
                        >
                          {copiedHash === item.merkle_root ? (
                            <Check className="w-3.5 h-3.5 text-[#10B981]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="py-3 px-4 font-mono text-[0.75rem] text-[#64748B]">
                      {formatBytes(item.size_bytes)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{renderStatusBadge(item.status)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectBlockForProof && (
                          <button
                            type="button"
                            onClick={() => onSelectBlockForProof(item.block_id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[0.6875rem] font-medium bg-white hover:bg-slate-100 text-[#0284C7] border border-[#CBD5E1] transition-colors shadow-xs cursor-pointer"
                            title="Inspect Merkle inclusion proof"
                          >
                            <Fingerprint className="w-3 h-3 text-[#0284C7]" />
                            <span>Proof</span>
                          </button>
                        )}

                        {onSelectBlockForDrill && item.file_exists && (
                          <button
                            type="button"
                            onClick={() => onSelectBlockForDrill(item.block_id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[0.6875rem] font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors shadow-xs cursor-pointer"
                            title="Execute isolated tamper drill on clone"
                          >
                            <ShieldAlert className="w-3 h-3 text-red-600" />
                            <span>Drill</span>
                          </button>
                        )}

                        {item.file_exists && (
                          <button
                            type="button"
                            onClick={() => handleExport(item.block_id)}
                            disabled={exportingBlockId === item.block_id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[0.6875rem] font-medium bg-[#1A1D20] hover:bg-[#2E343A] text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                            title="Download courtroom evidence bundle (.tar.gz)"
                          >
                            <Download className={`w-3 h-3 ${exportingBlockId === item.block_id ? "animate-bounce" : ""}`} />
                            <span className="hidden sm:inline">Bundle</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[0.6875rem] text-[#64748B] font-mono">
        <span>Verified against append-only Merkle ledger with SHA-256 root anchoring.</span>
        <span>RFC 6962 / Columnar Snappy</span>
      </div>
    </div>
  );
}
