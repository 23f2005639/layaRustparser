"use client";

import { Hand } from "lucide-react";
import { MetricsResponse } from "@/lib/types";

interface DispositionSplitProps {
  metrics: MetricsResponse | null;
}

export function DispositionSplit({ metrics }: DispositionSplitProps) {
  const isAvailable = !!metrics;
  const breakdown = metrics?.disposition_breakdown || {};

  const allowedCount = breakdown.Allowed || 0;
  const blockedCount = breakdown.Blocked || 0;
  const droppedCount = breakdown.Dropped || 0;
  const total = allowedCount + blockedCount + droppedCount || 1;

  const allowedPct = (allowedCount / total) * 100;
  const blockedPct = (blockedCount / total) * 100;
  const droppedPct = (droppedCount / total) * 100;

  // Circumference for r=48 is 2 * PI * 48 = 301.59
  const circumference = 301.59;
  const allowedDash = (allowedPct / 100) * circumference;
  const blockedDash = (blockedPct / 100) * circumference;
  const droppedDash = (droppedPct / 100) * circumference;

  const blockedOffset = -allowedDash;
  const droppedOffset = -(allowedDash + blockedDash);

  return (
    <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF5C5C]/10 text-[#FF5C5C]">
              <Hand className="w-5 h-5 text-[#FF5C5C]" />
            </span>
            <div>
              <h2 className="text-[1.125rem] font-semibold text-[#1E293B]">
                Action Disposition Split
              </h2>
              <span className="font-mono text-[0.75rem] text-[#64748B]">
                GET /metrics → disposition_breakdown
              </span>
            </div>
          </div>
          <span className="font-mono text-[0.6875rem] px-2 py-0.5 rounded bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] font-medium">
            OCSF Class 4001
          </span>
        </div>

        {/* Donut & Analytical Breakdown Matrix */}
        {!isAvailable ? (
          <div className="p-8 text-center text-[#64748B] font-mono text-[0.875rem] bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1] my-4">
            <p className="text-amber-800 font-semibold mb-1">Breakdown unavailable</p>
            <p className="text-[#64748B] text-[0.75rem]">Metrics data is unavailable</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-2">
          {/* Inline Donut Visualization */}
          <div className="flex flex-col items-center justify-center relative">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background Ring */}
              <circle
                cx="60"
                cy="60"
                fill="transparent"
                r="48"
                stroke="#F1F5F9"
                strokeWidth="14"
              ></circle>
              {/* Allowed: Soft Emerald #10B981 */}
              <circle
                cx="60"
                cy="60"
                fill="transparent"
                r="48"
                stroke="#10B981"
                strokeDasharray={`${allowedDash} ${circumference}`}
                strokeLinecap="round"
                strokeWidth="14"
              ></circle>
              {/* Blocked: Muted Coral/Red #FF5C5C */}
              <circle
                cx="60"
                cy="60"
                fill="transparent"
                r="48"
                stroke="#FF5C5C"
                strokeDasharray={`${blockedDash} ${circumference}`}
                strokeDashoffset={blockedOffset}
                strokeWidth="14"
              ></circle>
              {/* Dropped: Slate #64748B */}
              <circle
                cx="60"
                cy="60"
                fill="transparent"
                r="48"
                stroke="#64748B"
                strokeDasharray={`${droppedDash} ${circumference}`}
                strokeDashoffset={droppedOffset}
                strokeWidth="14"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="font-mono text-[0.6875rem] text-[#64748B] uppercase font-medium">
                Evaluated
              </span>
              <span className="text-[1.25rem] font-bold text-[#1E293B]">
                {(total / 1000).toFixed(1)}K
              </span>
            </div>
          </div>

          {/* Badges & Exact counts */}
          <div className="flex flex-col gap-2">
            {/* Allowed */}
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[0.75rem] text-[#1E293B] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]"></span>
                  Allowed
                </span>
                <span className="font-mono text-[0.6875rem] px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] font-semibold border border-[#10B981]/30">
                  {allowedPct.toFixed(1)}%
                </span>
              </div>
              <span className="font-mono text-[0.6875rem] text-[#64748B] mt-0.5">
                {allowedCount.toLocaleString("en-US")} records (OCSF ID 1)
              </span>
            </div>

            {/* Blocked */}
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[0.75rem] text-[#1E293B] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FF5C5C]"></span>
                  Blocked
                </span>
                <span className="font-mono text-[0.6875rem] px-1.5 py-0.5 rounded bg-[#FF5C5C]/10 text-[#FF5C5C] font-semibold border border-[#FF5C5C]/30">
                  {blockedPct.toFixed(1)}%
                </span>
              </div>
              <span className="font-mono text-[0.6875rem] text-[#64748B] mt-0.5">
                {blockedCount.toLocaleString("en-US")} records (OCSF ID 2)
              </span>
            </div>

            {/* Dropped */}
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[0.75rem] text-[#1E293B] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#64748B]"></span>
                  Dropped / Reset
                </span>
                <span className="font-mono text-[0.6875rem] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-semibold border border-[#E2E8F0]">
                  {droppedPct.toFixed(1)}%
                </span>
              </div>
              <span className="font-mono text-[0.6875rem] text-[#64748B] mt-0.5">
                {droppedCount.toLocaleString("en-US")} records (OCSF ID 3)
              </span>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Enforcement Note Banner */}
      <div className="mt-4 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
        <p className="font-mono text-[0.75rem] text-[#1E293B] leading-relaxed">
          <strong className="font-semibold text-[#0284C7]">
            Strict Inviolability Policy Enforced:
          </strong>{" "}
          Zero unclassified actions allowed. All records mapped strictly to OCSF Action ID values (allow, deny, drop).
        </p>
      </div>
    </div>
  );
}
