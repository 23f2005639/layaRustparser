"use client";

import React, { useState } from "react";
import { InclusionProofResponse, ApiErrorResponse } from "@/lib/types";
import { getProveInclusion, ApiError } from "@/lib/api";
import {
  Fingerprint,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  GitCommit,
  ShieldCheck,
  Info,
  Zap,
} from "lucide-react";

interface ProofViewerProps {
  selectedBlockId: number;
  availableBlockIds: number[];
  onBlockChange?: (blockId: number) => void;
  isOffline?: boolean;
}

export function ProofViewer({
  selectedBlockId,
  availableBlockIds,
  onBlockChange,
}: ProofViewerProps) {
  const [blockId, setBlockId] = useState<number>(selectedBlockId);
  const [prevSelectedBlockId, setPrevSelectedBlockId] = useState<number>(selectedBlockId);
  const [leafIndex, setLeafIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Proof state
  const [proofData, setProofData] = useState<InclusionProofResponse | null>(null);
  const [proofError, setProofError] = useState<ApiErrorResponse | null>(null);
  const [status501, setStatus501] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Copy states
  const [copiedLeafHash, setCopiedLeafHash] = useState(false);
  const [copiedRootHash, setCopiedRootHash] = useState(false);
  const [copiedStepHash, setCopiedStepHash] = useState<string | null>(null);

  // Adjust state during render if prop changes
  if (selectedBlockId !== prevSelectedBlockId) {
    setPrevSelectedBlockId(selectedBlockId);
    setBlockId(selectedBlockId);
    setProofData(null);
    setProofError(null);
    setStatus501(false);
    setGeneralError(null);
  }

  const handleRequestProof = async (live: boolean = false) => {
    setLoading(true);
    setProofData(null);
    setProofError(null);
    setStatus501(false);
    setGeneralError(null);

    try {
      const res = await getProveInclusion(blockId, leafIndex, live);
      if (res.status === 200 && res.data) {
        setProofData(res.data);
      } else if (res.status === 501 && res.error) {
        setStatus501(true);
        setProofError(res.error);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isOffline) {
          setGeneralError("Backend Offline: Unable to reach proof service.");
        } else if (err.status === 501 && err.data) {
          setStatus501(true);
          setProofError(err.data);
        } else {
          setGeneralError(err.message || `Proof request failed with status ${err.status}`);
        }
      } else {
        setGeneralError(err instanceof Error ? err.message : "Failed to execute inclusion proof");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, type: "leaf" | "root" | "step") => {
    navigator.clipboard.writeText(text);
    if (type === "leaf") {
      setCopiedLeafHash(true);
      setTimeout(() => setCopiedLeafHash(false), 2000);
    } else if (type === "root") {
      setCopiedRootHash(true);
      setTimeout(() => setCopiedRootHash(false), 2000);
    } else {
      setCopiedStepHash(text);
      setTimeout(() => setCopiedStepHash(null), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A1D20] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Fingerprint className="w-5 h-5 text-[#0284C7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1E293B]">
                Merkle Inclusion Proof Verifier
              </h2>
              <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-sky-50 text-[#0284C7] border border-sky-200 font-semibold">
                RFC 6962 / Ledger-Anchored
              </span>
            </div>
            <p className="text-[0.75rem] text-[#64748B]">
              Audit path generation validating raw log containment within sealed block roots.
            </p>
          </div>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#F0F3FF] border border-[#C5C6CA]/40 text-[#0284C7] text-[0.6875rem] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7]" />
          <span>Cert Transparency Standard</span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0]">
          {/* Block ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.75rem] font-mono font-semibold text-[#1E293B]">
              Target Block ID
            </label>
            <div className="relative">
              <select
                value={blockId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBlockId(val);
                  if (onBlockChange) onBlockChange(val);
                }}
                className="h-9 px-3 pr-8 bg-white border border-[#CBD5E1] rounded text-[0.8125rem] font-mono text-[#1E293B] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
              >
                {availableBlockIds.map((id) => (
                  <option key={id} value={id}>
                    Block #{String(id).padStart(5, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leaf Index */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.75rem] font-mono font-semibold text-[#1E293B]">
              Leaf Index (0-based)
            </label>
            <input
              type="number"
              min={0}
              value={leafIndex}
              onChange={(e) => setLeafIndex(Math.max(0, parseInt(e.target.value) || 0))}
              className="h-9 w-28 px-3 bg-white border border-[#CBD5E1] rounded text-[0.8125rem] font-mono text-[#1E293B] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:ml-auto">
            {/* Standard default request (returns 501 per issue spec) */}
            <button
              type="button"
              onClick={() => handleRequestProof(false)}
              disabled={loading}
              className="h-9 px-3 rounded bg-white hover:bg-slate-100 border border-[#CBD5E1] text-[#475569] text-[0.75rem] font-mono font-medium transition-colors shadow-xs cursor-pointer"
              title="GET /prove/:block/:leaf (default 501 test)"
            >
              Default GET /prove
            </button>

            {/* Live proof request (?live=true) */}
            <button
              type="button"
              onClick={() => handleRequestProof(true)}
              disabled={loading}
              className="h-9 px-4 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white text-[0.75rem] font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Computing Proof...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Live Proof (?live=true)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[0.8125rem] flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Explicit 501 Not Implemented State Handling */}
        {status501 && proofError && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 flex flex-col gap-3 shadow-xs animate-fade-in">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <span>HTTP 501 Not Implemented — Default Proof Endpoint Response</span>
            </div>

            <p className="text-[0.75rem] text-amber-800 font-mono leading-relaxed">
              {proofError.message}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-amber-200">
              <span className="text-[0.6875rem] font-mono text-amber-700">
                To execute the live mathematical inclusion proof verification against the sealed ledger, trigger the supported live computation query parameter.
              </span>

              <button
                type="button"
                onClick={() => handleRequestProof(true)}
                className="px-3.5 py-1.5 rounded bg-[#1A1D20] hover:bg-[#2E343A] text-white text-[0.75rem] font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#0284C7] fill-[#0284C7]" />
                <span>Execute Live Proof (?live=true)</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Proof Result */}
        {proofData && (
          <div className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 flex flex-col gap-4 shadow-sm animate-fade-in">
            {/* Status Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                {proofData.verified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    PROOF VERIFIED: PASS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold bg-[#FF5C5C]/15 text-[#FF5C5C] border border-[#FF5C5C]/40 shadow-xs">
                    <XCircle className="w-4 h-4 text-[#FF5C5C]" />
                    PROOF FAILED: TAMPER DETECTED
                  </span>
                )}

                <span className="text-[0.75rem] font-mono text-[#64748B]">
                  Block <strong className="text-[#1E293B]">#{String(proofData.block_id).padStart(5, "0")}</strong> •
                  Leaf <strong className="text-[#1E293B]">#{proofData.leaf_index}</strong> (Tree Size: {proofData.tree_size.toLocaleString()})
                </span>
              </div>

              <span className="text-[0.6875rem] font-mono text-[#64748B] bg-white px-2.5 py-1 rounded border border-[#CBD5E1]">
                {proofData.standard}
              </span>
            </div>

            {/* Hashes Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Leaf Hash */}
              <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
                    Target Leaf Hash (h(0x00 || log)):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(proofData.leaf_hash, "leaf")}
                    className="p-1 rounded text-[#64748B] hover:text-[#1E293B]"
                    title="Copy leaf hash"
                  >
                    {copiedLeafHash ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <code className="text-[0.75rem] font-mono text-[#1E293B] break-all select-all">
                  {proofData.leaf_hash}
                </code>
              </div>

              {/* Calculated Merkle Root */}
              <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
                    Calculated Merkle Root:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(proofData.calculated_merkle_root, "root")}
                    className="p-1 rounded text-[#64748B] hover:text-[#1E293B]"
                    title="Copy calculated root"
                  >
                    {copiedRootHash ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <code
                  className={`text-[0.75rem] font-mono break-all select-all ${
                    proofData.verified ? "text-[#10B981] font-semibold" : "text-red-700 font-bold"
                  }`}
                >
                  {proofData.calculated_merkle_root}
                </code>
              </div>
            </div>

            {/* Ledger Root Comparison */}
            {proofData.ledger_merkle_root && (
              <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[0.75rem] font-mono">
                <span className="text-[#64748B]">Anchored Ledger Merkle Root:</span>
                <code className="text-[#1E293B] font-semibold break-all select-all">
                  {proofData.ledger_merkle_root}
                </code>
              </div>
            )}

            {/* Audit Path Steps */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[0.75rem] font-mono font-semibold text-[#1E293B] flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-[#0284C7]" /> RFC 6962 Cryptographic Audit Path (
                  {proofData.audit_path.length} steps)
                </span>
                <span className="text-[0.6875rem] font-mono text-[#64748B]">
                  O(log₂ N) Logarithmic Proof
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {proofData.audit_path.map((step, idx) => (
                  <div
                    key={`${step.hash}-${idx}`}
                    className="flex items-center justify-between gap-3 p-2.5 bg-white rounded border border-[#E2E8F0] text-[0.75rem] font-mono"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-[#64748B] flex items-center justify-center text-[0.6875rem] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <code className="text-[#0284C7] font-semibold truncate select-all">
                        {step.hash}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[0.6875rem] font-bold ${
                          step.side === "Left"
                            ? "bg-sky-50 text-[#0284C7] border border-sky-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {step.side}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText(step.hash, "step")}
                        className="p-1 rounded text-[#64748B] hover:text-[#1E293B]"
                        title="Copy step hash"
                      >
                        {copiedStepHash === step.hash ? (
                          <Check className="w-3 h-3 text-[#10B981]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
