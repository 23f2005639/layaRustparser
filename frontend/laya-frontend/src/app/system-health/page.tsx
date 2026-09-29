"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EngineThresholdsCard } from "@/components/system/EngineThresholdsCard";
import { QueueStatusCard } from "@/components/system/QueueStatusCard";
import { BenchmarkScorecard } from "@/components/system/BenchmarkScorecard";
import { PayloadViewer } from "@/components/system/PayloadViewer";
import {
  getSystem,
  getMetrics,
  getApiMode,
  getBackendStatus,
  subscribeBackendStatus,
  ApiError,
  ApiMode,
  BackendStatus,
} from "@/lib/api";
import { SystemResponse, MetricsResponse } from "@/lib/types";
import { WifiOff, RefreshCcw } from "lucide-react";

export default function SystemHealthPage() {
  const backendStatus = useSyncExternalStore<BackendStatus>(
    subscribeBackendStatus,
    () => getBackendStatus(),
    () => "LIVE"
  );
  const apiMode = useSyncExternalStore<ApiMode>(
    subscribeBackendStatus,
    () => getApiMode(),
    () => "LIVE"
  );

  const [system, setSystem] = useState<SystemResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const activeRequestIdRef = useRef<number>(0);
  const prevModeRef = useRef<ApiMode | null>(null);
  const prevStatusRef = useRef<BackendStatus | null>(null);

  const isOffline = backendStatus === "OFFLINE";
  const isMock = apiMode === "MOCK";

  const fetchSystem = useCallback(async () => {
    const reqId = ++activeRequestIdRef.current;
    setLoading(true);
    setErrorMessage(null);

    try {
      const [sysRes, metricsRes] = await Promise.all([
        getSystem(),
        getMetrics().catch((err) => {
          console.warn("Failed to fetch /metrics for system health:", err);
          return null;
        }),
      ]);
      if (!isMountedRef.current || activeRequestIdRef.current !== reqId) return;

      setSystem(sysRes.data);
      if (metricsRes) {
        setMetrics(metricsRes.data);
      }
      setIsLive(sysRes.isLive);
    } catch (err: unknown) {
      if (!isMountedRef.current || activeRequestIdRef.current !== reqId) return;

      if (err instanceof ApiError) {
        if (err.isOffline) {
          setErrorMessage("Backend Offline: Unable to reach system diagnostics service.");
        } else {
          setErrorMessage(err.message || `Failed to load system diagnostics: HTTP ${err.status}`);
        }
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load system scorecard");
      }
    } finally {
      if (isMountedRef.current && activeRequestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, []);

  // Handle mode transitions (LIVE -> MOCK, MOCK -> LIVE, OFFLINE recovery)
  useEffect(() => {
    isMountedRef.current = true;

    const modeChanged = prevModeRef.current !== null && prevModeRef.current !== apiMode;
    const statusChanged =
      prevStatusRef.current !== null && prevStatusRef.current !== backendStatus;

    prevModeRef.current = apiMode;
    prevStatusRef.current = backendStatus;

    if (modeChanged || statusChanged || system === null) {
      fetchSystem();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [apiMode, backendStatus, fetchSystem, system]);

  return (
    <AppShell currentSection="SYSTEM_HEALTH" eps={metrics?.eps}>
      <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
        {/* Operational Breadcrumbs & Mode Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-1.5 text-[#64748B] font-mono text-[0.75rem]">
            <span className="hover:text-[#1E293B] transition-colors cursor-pointer">SOC</span>
            <span>/</span>
            <span className="hover:text-[#1E293B] transition-colors cursor-pointer">
              System Operations
            </span>
            <span>/</span>
            <span className="text-[#1E293B] font-semibold">
              System Settings &amp; Diagnostics Scorecard
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isOffline && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[0.75rem] font-mono font-medium">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>BACKEND OFFLINE</span>
              </div>
            )}
            {isMock && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-300 text-sky-800 text-[0.75rem] font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>MOCK FIXTURE AUTHORITATIVE</span>
              </div>
            )}
            {!isOffline && !isMock && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[0.75rem] font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE BACKEND CONNECTED</span>
              </div>
            )}

            <button
              onClick={fetchSystem}
              disabled={loading}
              title="Reload system metrics"
              className="p-1.5 rounded hover:bg-slate-100 text-[#64748B] hover:text-[#1E293B] transition-colors border border-transparent hover:border-[#CBD5E1] cursor-pointer"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin text-[#0284C7]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Offline Banner if offline */}
        {isOffline && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 flex items-center justify-between gap-4 text-amber-900 shadow-sm">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-amber-700 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Backend Server Offline (Port 8080)</span>
                <span className="text-xs text-amber-700">
                  Run <code>./target/release/ulpf serve --port 8080</code> from the repository root to connect live. Switch to MOCK in the top bar to inspect mock fixtures.
                </span>
              </div>
            </div>
            <button
              onClick={fetchSystem}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-semibold shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && !system && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-2 shadow-sm">
            <RefreshCcw className="w-8 h-8 animate-spin text-[#0284C7]" />
            <span className="text-sm font-semibold text-[#1E293B]">Loading System Diagnostics Scorecard...</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && !system && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-mono flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Content when system data is available */}
        {system && (
          <>
            {/* 1. Engine & Batcher Thresholds Card */}
            <EngineThresholdsCard system={system} />

            {/* 2. RingBuffer Queue & Status Telemetry Card */}
            <QueueStatusCard system={system} eps={metrics?.eps} />

            {/* 3. Forensic Benchmark Scorecard */}
            <BenchmarkScorecard summary={system.benchmark_summary} />

            {/* 4. Full Diagnostics Payload Inspector */}
            <PayloadViewer system={system} isLive={isLive} />
          </>
        )}
      </div>
    </AppShell>
  );
}
