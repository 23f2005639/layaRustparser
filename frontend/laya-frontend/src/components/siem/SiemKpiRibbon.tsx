"use client";

import { AlertTriangle, Timer, ShieldCheck, Lock } from "lucide-react";
import { AlertItem } from "@/lib/types";

interface SiemKpiRibbonProps {
  alerts: AlertItem[] | null;
}

export function SiemKpiRibbon({ alerts }: SiemKpiRibbonProps) {
  const isAvailable = !!alerts;
  const alertList = alerts ?? [];
  const criticalCount = alertList.filter(
    (a) => a.severity === "Critical" || a.severity === "High"
  ).length;
  const mediumCount = alertList.filter((a) => a.severity === "Medium").length;
  const tamperCount = alertList.filter((a) => a.alert_type === "tamper_alarm").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Incidents */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-red-500/5 rounded-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[0.75rem] text-[#64748B] tracking-wider uppercase">
            Active Incidents
          </span>
          <AlertTriangle className="w-5 h-5 text-[#BA1A1A]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[2.25rem] text-[#1E293B] font-semibold leading-tight">
            {isAvailable ? alerts.length : "—"}
          </span>
          {isAvailable ? (
            <span className="font-mono text-[0.6875rem] px-2 py-0.5 rounded bg-[#FFDAD6] text-[#93000A] font-semibold">
              {criticalCount} Critical, {mediumCount} Med
            </span>
          ) : (
            <span className="font-mono text-[0.6875rem] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-300">
              OFFLINE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[#64748B] font-mono text-[0.75rem]">
          <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-[#BA1A1A]" : "bg-amber-500"}`}></span>
          <span>{isAvailable ? "Priority queue requires action" : "Alerts unavailable — backend offline"}</span>
        </div>
      </div>

      {/* Mean Time to Acknowledge (MTTA) */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/5 rounded-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[0.75rem] text-[#64748B] tracking-wider uppercase">
            MTTA (Current Cycle)
          </span>
          <Timer className="w-5 h-5 text-[#006398]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[2.25rem] text-[#1E293B] font-semibold leading-tight">
            1.1
          </span>
          <span className="text-[0.875rem] text-[#64748B]">mins</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[#009768] font-mono text-[0.75rem]">
          <span>↓ -0.4m below SLA baseline</span>
        </div>
      </div>

      {/* Autonomous Containment */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/5 rounded-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[0.75rem] text-[#64748B] tracking-wider uppercase">
            Autonomous Containment
          </span>
          <ShieldCheck className="w-5 h-5 text-[#009768]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[2.25rem] text-[#1E293B] font-semibold leading-tight">
            94%
          </span>
          <span className="font-mono text-[0.6875rem] px-2 py-0.5 rounded bg-[#F0F3FF] text-[#006398] font-semibold">
            SOAR L1/L2
          </span>
        </div>
        <div className="w-full bg-[#F0F3FF] h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-[#5BB8FE] h-full rounded-full" style={{ width: "94%" }}></div>
        </div>
      </div>

      {/* Block Validation */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-red-500/5 rounded-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[0.75rem] text-[#64748B] tracking-wider uppercase">
            Block Attestation
          </span>
          <Lock className="w-5 h-5 text-[#BA1A1A]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[1.75rem] text-[#BA1A1A] font-semibold leading-tight">
            {tamperCount > 0 ? `${tamperCount} Alert` : "Clean"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[#BA1A1A] font-mono text-[0.75rem]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="font-semibold">Block #00000 compromised</span>
        </div>
      </div>
    </div>
  );
}
