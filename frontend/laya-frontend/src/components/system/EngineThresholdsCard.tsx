"use client";

import React from "react";
import { SystemResponse } from "@/lib/types";
import {
  Cpu,
  ShieldCheck,
  Layers,
  Clock,
  Archive,
} from "lucide-react";

interface EngineThresholdsCardProps {
  system: SystemResponse;
}

export function EngineThresholdsCard({ system }: EngineThresholdsCardProps) {
  const { batcher } = system;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A1D20] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Cpu className="w-5 h-5 text-[#0284C7]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">
              Engine &amp; Batcher Thresholds
            </h2>
            <p className="text-[0.75rem] text-[#64748B]">
              Deterministic micro-batch flush limits and columnar storage settings.
            </p>
          </div>
        </div>

        <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Air-Gapped: {system.air_gapped ? "TRUE" : "FALSE"}
        </span>
      </div>

      {/* Grid of thresholds */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Service & Version */}
        <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
          <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
            Service Identity
          </span>
          <span className="text-[0.875rem] font-semibold text-[#1E293B]">
            {system.service_name}
          </span>
          <span className="text-[0.75rem] font-mono text-[#0284C7]">
            v{system.version} (Air-Gapped Release)
          </span>
        </div>

        {/* Max Batch Size */}
        <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
              Max Batch Size
            </span>
            <Layers className="w-3.5 h-3.5 text-[#0284C7]" />
          </div>
          <span className="text-[0.875rem] font-mono font-bold text-[#1E293B]">
            {batcher.max_batch_size.toLocaleString()} records / block
          </span>
          <span className="text-[0.6875rem] text-[#64748B]">
            Batch accumulator seals and hashes root upon reaching cap.
          </span>
        </div>

        {/* Flush Timeout */}
        <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
              Flush Duration Timeout
            </span>
            <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
          </div>
          <span className="text-[0.875rem] font-mono font-bold text-[#1E293B]">
            {batcher.max_batch_duration_ms.toLocaleString()} ms (2.0s)
          </span>
          <span className="text-[0.6875rem] text-[#64748B]">
            Partial blocks are flushed periodically to prevent event staleness.
          </span>
        </div>

        {/* Compression */}
        <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
              Storage Compression
            </span>
            <Archive className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <span className="text-[0.875rem] font-semibold text-[#1E293B]">
            {batcher.compression}
          </span>
          <span className="text-[0.6875rem] text-[#64748B]">
            Lossless columnar encoding with zero-copy row decoding.
          </span>
        </div>

        {/* Storage Dir */}
        <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
          <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
            Storage Directory
          </span>
          <code className="text-[0.75rem] font-mono text-[#1E293B] font-semibold">
            {batcher.storage_dir}
          </code>
          <span className="text-[0.6875rem] text-[#64748B]">WORM Parquet partition store</span>
        </div>

        {/* Ledger Path */}
        <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
          <span className="text-[0.6875rem] font-mono font-semibold text-[#64748B] uppercase">
            Cryptographic Ledger File
          </span>
          <code className="text-[0.75rem] font-mono text-[#0284C7] font-semibold">
            {batcher.ledger_path}
          </code>
          <span className="text-[0.6875rem] text-[#64748B]">Append-only fsync-guaranteed JSONL</span>
        </div>
      </div>
    </div>
  );
}
