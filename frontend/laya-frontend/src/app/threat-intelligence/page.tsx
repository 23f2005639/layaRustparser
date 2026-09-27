"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { HeroMetrics } from "@/components/threat-intel/HeroMetrics";
import { VendorMix } from "@/components/threat-intel/VendorMix";
import { DispositionSplit } from "@/components/threat-intel/DispositionSplit";
import { AttackVectorsTable } from "@/components/threat-intel/AttackVectorsTable";
import { getMetrics, getApiMode } from "@/lib/api";
import { MetricsResponse, AttackVectorItem } from "@/lib/types";
import { mockMetrics, mockAttackVectors } from "@/lib/mock-data";
import { Download, RefreshCw } from "lucide-react";

export default function ThreatIntelligencePage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [vectors] = useState<AttackVectorItem[]>(mockAttackVectors);
  const [isLive, setIsLive] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout | null = null;

    async function loadData() {
      const mode = getApiMode();
      if (mode === "MOCK") {
        setMetrics(mockMetrics);
        setIsLive(false);
        return;
      }
      try {
        const res = await getMetrics();
        if (!active || getApiMode() !== "LIVE") return;
        setMetrics(res.data);
        setIsLive(res.isLive);
      } catch {
        if (!active || getApiMode() !== "LIVE") return;
        setIsLive(false);
        setMetrics(null);
      }
    }

    async function pollLoop() {
      if (!active) return;
      await loadData();
      if (!active) return;
      timerId = setTimeout(pollLoop, 1000);
    }

    pollLoop();

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  // Respond immediately to mode changes (LIVE <-> MOCK toggle)
  useEffect(() => {
    const handleModeChange = () => {
      const mode = getApiMode();
      if (mode === "LIVE") {
        setMetrics(null);
        setIsLive(false);
      } else {
        setMetrics(mockMetrics);
        setIsLive(false);
      }
    };

    window.addEventListener("ulpf_api_mode_change", handleModeChange);
    return () => {
      window.removeEventListener("ulpf_api_mode_change", handleModeChange);
    };
  }, []);

  const handleExport = () => {
    setExporting(true);
    const matrix = {
      exported_at: new Date().toISOString(),
      vendor_mix: metrics?.vendor_mix ?? {},
      disposition_breakdown: metrics?.disposition_breakdown ?? {},
      attack_vectors: vectors,
      attack_vectors_source: "fixture",
    };
    const blob = new Blob([JSON.stringify(matrix, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ulpf-ocsf-matrix-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 800);
  };

  const status: "LIVE" | "MOCK" | "OFFLINE" = isLive
    ? "LIVE"
    : getApiMode() === "MOCK"
      ? "MOCK"
      : "OFFLINE";

  const vectorStatus: "MOCK" | "OFFLINE" =
    status === "OFFLINE" ? "OFFLINE" : "MOCK";

  return (
    <AppShell currentSection="THREAT_INTEL" eps={metrics?.eps}>
      <div className="flex flex-col w-full gap-5">
        {/* Operational Breadcrumb & Live Endpoint Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[#64748B] font-mono text-[0.75rem]">
              <span className="hover:text-[#0284C7] transition-colors cursor-pointer">
                SOC
              </span>
              <span>/</span>
              <span className="hover:text-[#0284C7] transition-colors cursor-pointer">
                Threat Intel
              </span>
              <span>/</span>
              <span className="text-[#1E293B] font-semibold">
                Vendor Mix &amp; Disposition Telemetry
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${isLive
                    ? "bg-[#10B981] animate-ping"
                    : getApiMode() === "MOCK"
                      ? "bg-sky-500"
                      : "bg-amber-500"
                  }`}
              ></span>
              <p className="font-mono text-[0.75rem] text-[#0284C7] font-medium">
                API Sync: GET /metrics (vendor_mix, disposition_breakdown)
              </p>
              <span
                className={`font-mono text-[0.6875rem] px-2 py-0.5 rounded font-medium border ${isLive
                    ? "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                    : getApiMode() === "MOCK"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
              >
                {isLive ? "HTTP 200 OK" : getApiMode() === "MOCK" ? "MOCK FIXTURE" : "DISCONNECTED"}
              </span>
              <span
                className={`font-mono text-[0.6875rem] px-2 py-0.5 rounded font-semibold border ${isLive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : getApiMode() === "MOCK"
                      ? "bg-sky-50 text-sky-700 border-sky-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
              >
                {status}
              </span>
            </div>
          </div>

          {/* Live Polling Utility & Fast Time Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#F0F3FF] border border-[#E2E8F0] px-3 py-1.5 rounded-lg shadow-sm">
              <RefreshCw
                className={`w-4 h-4 ${isLive ? "text-[#10B981] animate-spin" : "text-[#64748B]"
                  }`}
              />
              <span className="font-mono text-[0.75rem] text-[#64748B]">
                Poll Rate: <strong className="text-[#1E293B] font-semibold">1,000ms</strong>
              </span>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1D20] text-white rounded-lg shadow-sm hover:bg-[#2E343A] transition-all font-mono text-[0.75rem] font-semibold cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? "Exporting..." : "Export OCSF Matrix"}</span>
            </button>
          </div>
        </div>

        {/* Top Hero Metrics */}
        <HeroMetrics metrics={metrics} />

        {/* Dual Analytical Panels: Vendor Mix & Action Disposition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <VendorMix metrics={metrics} />
          </div>
          <div className="lg:col-span-5">
            <DispositionSplit metrics={metrics} />
          </div>
        </div>

        {/* Bottom Section: IOC Correlated Attack Vectors Data Table (Fixture) */}
        <AttackVectorsTable
          vectors={vectors}
          isLive={isLive}
          status={status}
        />
      </div>
    </AppShell>
  );
}
