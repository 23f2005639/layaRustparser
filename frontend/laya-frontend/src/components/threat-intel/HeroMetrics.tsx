"use client";

import { Database, ShieldCheck, ShieldAlert, ArrowUp } from "lucide-react";
import { MetricsResponse } from "@/lib/types";

interface HeroMetricsProps {
  metrics: MetricsResponse | null;
}

export function HeroMetrics({ metrics }: HeroMetricsProps) {
  const isAvailable = !!metrics;
  const totalDisplay = isAvailable && metrics.total_ingested > 0
    ? metrics.total_ingested.toLocaleString("en-US")
    : isAvailable
    ? "0"
    : "—";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Metric 1: Total Ingestion */}
      <div className="relative overflow-hidden bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#0284C7]/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[0.75rem] uppercase tracking-wider text-[#64748B]">
            Total Ingested (24h)
          </span>
          <Database className="w-5 h-5 text-[#0284C7]" />
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span
            className="text-[2.25rem] font-bold text-[#1E293B] tracking-tight leading-tight"
            suppressHydrationWarning
          >
            {totalDisplay}
          </span>
          <span className="font-mono text-[0.75rem] text-[#10B981] font-semibold flex items-center">
            <ArrowUp className="w-3.5 h-3.5" /> +14.8%
          </span>
        </div>
        <div className="flex items-center justify-between text-[#64748B] font-mono text-[0.6875rem] pt-1 border-t border-[#F1F5F9]">
          <span>RATE: ~{isAvailable ? (metrics.eps > 0 ? (metrics.eps / 1000).toFixed(1) : "0.0") : "—"}k EPS STABLE</span>
          <span className="text-[#0284C7] font-semibold">PARQUET SYNC ACTIVE</span>
        </div>
      </div>

      {/* Metric 2: Policy Compliance */}
      <div className="relative overflow-hidden bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[0.75rem] uppercase tracking-wider text-[#64748B]">
            Inviolability Policy
          </span>
          <ShieldCheck className="w-5 h-5 text-[#10B981]" />
        </div>
        <div className="flex flex-col my-1">
          <span className="text-[1.25rem] font-bold tracking-tight uppercase text-[#10B981]">
            STRICT ZERO-TRUST
          </span>
          <span className="font-mono text-[0.75rem] text-[#64748B] font-medium">
            100% Normalized schema enforcement
          </span>
        </div>
        <div className="flex items-center justify-between font-mono text-[0.6875rem] pt-1 border-t border-[#F1F5F9]">
          <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#0284C7] font-semibold border border-[#E2E8F0]">
            OCSF v1.3 STRICT
          </span>
          <span className="text-[#10B981] font-semibold">0 UNMAPPED EVENT IDS</span>
        </div>
      </div>

      {/* Metric 3: Mitigation Efficiency */}
      <div className="relative overflow-hidden bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[0.75rem] uppercase tracking-wider text-[#64748B]">
            Attack Mitigation Efficiency
          </span>
          <ShieldAlert className="w-5 h-5 text-[#0284C7]" />
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-[2.25rem] font-bold text-[#1E293B] tracking-tight leading-tight">
            99.4%
          </span>
          <span className="font-mono text-[0.75rem] text-[#10B981] font-semibold">
            Autonomous SLA
          </span>
        </div>
        <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden my-1">
          <div className="bg-[#0284C7] h-full rounded-full" style={{ width: "99.4%" }}></div>
        </div>
        <div className="flex items-center justify-between text-[#64748B] font-mono text-[0.6875rem] pt-1 border-t border-[#F1F5F9]">
          <span>MEAN RESPONSE: 18ms</span>
          <span className="text-[#FF5C5C] font-medium">6 UNMITIGATED ESCALATED</span>
        </div>
      </div>
    </div>
  );
}
