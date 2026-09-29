"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TamperDrillRequest, TamperDrillResponse } from "@/lib/types";
import { tamperDrill, ApiError } from "@/lib/api";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Bell,
} from "lucide-react";

interface TamperDrillSectionProps {
  selectedBlockId: number;
  availableBlockIds: number[];
  onBlockChange?: (blockId: number) => void;
  onDrillSuccess?: () => void;
  isOffline?: boolean;
}

export function TamperDrillSection({
  selectedBlockId,
  availableBlockIds,
  onBlockChange,
  onDrillSuccess,
}: TamperDrillSectionProps) {
  const [blockId, setBlockId] = useState<number>(selectedBlockId);
  const [prevSelectedBlockId, setPrevSelectedBlockId] = useState<number>(selectedBlockId);
  const [leafIndex, setLeafIndex] = useState<number>(0);
  const [spoofedIp, setSpoofedIp] = useState<string>("10.99.99.99");

  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [drillResult, setDrillResult] = useState<TamperDrillResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Adjust state during render if prop changes
  if (selectedBlockId !== prevSelectedBlockId) {
    setPrevSelectedBlockId(selectedBlockId);
    setBlockId(selectedBlockId);
  }

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowConfirmModal(true);
  };

  const handleExecuteDrill = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);
    setDrillResult(null);

    const payload: TamperDrillRequest = {
      block_id: blockId,
      leaf_index: leafIndex,
      spoofed_ip: spoofedIp.trim() || "10.99.99.99",
      confirm: true,
    };

    try {
      const res = await tamperDrill(payload);
      setDrillResult(res.data);
      if (onDrillSuccess) onDrillSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isOffline) {
          setError("Backend Offline: Unable to reach tamper simulation engine.");
        } else {
          setError(err.message || `Tamper drill failed with status ${err.status}`);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to execute tamper drill");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-950 text-red-500 flex items-center justify-center shrink-0 shadow-sm border border-red-900/30">
            <ShieldAlert className="w-5 h-5 text-[#FF5C5C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1E293B]">
                Safe Adversarial Simulation (Tamper Drill)
              </h2>
              <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-semibold">
                POST /tamper/drill
              </span>
            </div>
            <p className="text-[0.75rem] text-[#64748B]">
              Injects spoofed telemetry into an isolated scratch copy to test Merkle discrepancy alarms.
            </p>
          </div>
        </div>

        {/* Protection badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[0.6875rem] font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Real Parquet Untouched</span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Prominent Evidence Protection Banner */}
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-emerald-200 text-[#10B981] flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-[#10B981]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-emerald-950">
                Evidence Protection Guarantee
              </span>
              <span className="text-xs text-emerald-800 font-mono">
                Real evidence in <code>data/parquet/</code> is NEVER modified. The backend clones the target block to <code>data/scratch/</code> before injecting damage.
              </span>
            </div>
          </div>
          <span className="text-[0.6875rem] font-mono px-2.5 py-1 rounded bg-white text-emerald-800 border border-emerald-200 font-bold shrink-0">
            100% NON-DESTRUCTIVE
          </span>
        </div>

        {/* Drill Form */}
        <form onSubmit={handleOpenConfirm} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Block */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-mono font-semibold text-[#1E293B]">
                Target Block ID *
              </label>
              <select
                value={blockId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBlockId(val);
                  if (onBlockChange) onBlockChange(val);
                }}
                className="h-9 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[0.8125rem] font-mono text-[#1E293B] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
              >
                {availableBlockIds.map((id) => (
                  <option key={id} value={id}>
                    Block #{String(id).padStart(5, "0")}
                  </option>
                ))}
              </select>
            </div>

            {/* Leaf Index */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-mono font-semibold text-[#1E293B]">
                Target Leaf Index *
              </label>
              <input
                type="number"
                min={0}
                required
                value={leafIndex}
                onChange={(e) => setLeafIndex(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-9 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[0.8125rem] font-mono text-[#1E293B] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
              />
            </div>

            {/* Spoofed IP */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-mono font-semibold text-[#1E293B]">
                Spoofed IP Injection *
              </label>
              <input
                type="text"
                required
                placeholder="10.99.99.99"
                value={spoofedIp}
                onChange={(e) => setSpoofedIp(e.target.value)}
                className="h-9 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[0.8125rem] font-mono text-[#1E293B] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[0.6875rem] font-mono text-[#64748B]">
              Submitting requires explicit confirmation modal. Never executes automatically.
            </span>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-[0.8125rem] font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating Drill...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Simulate Tamper Drill</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[0.8125rem] flex items-center gap-2 font-mono">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drill Result Card */}
        {drillResult && (
          <div className="rounded-xl border border-red-300 bg-red-50/40 p-4 flex flex-col gap-4 shadow-sm animate-fade-in">
            {/* Result Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-red-200">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold bg-[#FF5C5C]/20 text-[#FF5C5C] border border-[#FF5C5C]/40 shadow-xs">
                  <ShieldAlert className="w-4 h-4 text-[#FF5C5C]" />
                  TAMPER DETECTED ON SCRATCH COPY
                </span>
                <span className="text-[0.75rem] font-mono text-[#64748B]">
                  Target Block <strong className="text-[#1E293B]">#{String(drillResult.target_block_id).padStart(5, "0")}</strong> •
                  Leaf <strong className="text-[#1E293B]">#{drillResult.target_leaf_index}</strong>
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                Original Evidence: 100% UNMODIFIED
              </div>
            </div>

            {/* Path Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[0.75rem]">
              {/* Source Evidence */}
              <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] flex flex-col gap-1">
                <span className="text-[0.6875rem] font-semibold text-[#10B981] uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Source Evidence (Untouched):
                </span>
                <code className="text-[#1E293B] break-all select-all font-bold">
                  {drillResult.source_evidence_path}
                </code>
              </div>

              {/* Scratch Copy */}
              <div className="p-3 rounded-lg bg-white border border-red-200 flex flex-col gap-1">
                <span className="text-[0.6875rem] font-semibold text-[#FF5C5C] uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Scratch Copy (Corrupted Clone):
                </span>
                <code className="text-red-700 break-all select-all font-bold">
                  {drillResult.scratch_drill_path}
                </code>
              </div>
            </div>

            {/* Tamper Report Breakdown */}
            {drillResult.tamper_report && (
              <div className="p-3 bg-white rounded-lg border border-red-200 flex flex-col gap-2 font-mono text-[0.75rem]">
                <span className="font-semibold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Tamper Report Verification Engine Finding
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#334155]">
                  <div>
                    <span className="text-[#64748B]">Calculated Clone Root: </span>
                    <span className="text-red-700 font-bold break-all">
                      {drillResult.tamper_report.calculated_root}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Ledger Anchored Root: </span>
                    <span className="text-emerald-700 font-bold break-all">
                      {drillResult.tamper_report.ledger_root}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Message & Link to SIEM Alerts */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[0.75rem] font-mono text-[#64748B] italic">
                {drillResult.message}
              </span>

              <Link
                href="/siem-alerting"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1A1D20] hover:bg-[#2E343A] text-white text-[0.75rem] font-mono font-semibold transition-colors shrink-0 shadow-sm"
              >
                <Bell className="w-3.5 h-3.5 text-[#FF5C5C]" />
                <span>View Generated Alarm in SIEM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-red-300 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1E293B]">
                  Confirm Adversarial Tamper Drill
                </h3>
                <p className="text-[0.75rem] text-[#64748B]">
                  Execute simulated log poisoning on an isolated scratch copy.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex flex-col gap-2 text-[0.75rem] font-mono text-[#334155]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Target Block:</span>
                <span className="font-semibold text-[#1E293B]">
                  #{String(blockId).padStart(5, "0")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Target Leaf Index:</span>
                <span className="font-semibold text-[#1E293B]">{leafIndex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Spoofed IP:</span>
                <span className="text-red-600 font-bold">{spoofedIp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Destination:</span>
                <span className="text-[#0284C7]">data/scratch/tamper_drill_block_*.parquet</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-[0.75rem]">
              <strong>Safety Confirmation:</strong> Real Parquet evidence in <code>data/parquet/</code> will remain 100% untouched. Only the scratch copy will be modified, raising an alert in the security feed.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded bg-white hover:bg-slate-100 border border-[#CBD5E1] text-[#475569] text-[0.8125rem] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDrill}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-[0.8125rem] font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Execute Tamper Drill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
