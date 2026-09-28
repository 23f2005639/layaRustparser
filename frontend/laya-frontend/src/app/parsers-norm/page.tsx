"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ParsersTable } from "@/components/parsers/ParsersTable";
import { ParserTester } from "@/components/parsers/ParserTester";
import { OnboardWizard } from "@/components/parsers/OnboardWizard";
import {
  getParsers,
  getMetrics,
  getApiMode,
  getBackendStatus,
  subscribeBackendStatus,
  ApiError,
  ApiMode,
  BackendStatus,
} from "@/lib/api";
import { ParserItem, MetricsResponse } from "@/lib/types";
import { WifiOff, RefreshCcw } from "lucide-react";

export default function ParsersNormPage() {
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

  const [parsers, setParsers] = useState<ParserItem[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedVendorForTest, setSelectedVendorForTest] = useState<string>("cisco_asa");

  const isMountedRef = useRef(true);
  const activeRequestIdRef = useRef<number>(0);
  const prevModeRef = useRef<ApiMode | null>(null);
  const prevStatusRef = useRef<BackendStatus | null>(null);

  const isOffline = backendStatus === "OFFLINE";
  const isMock = apiMode === "MOCK";

  const fetchParsers = useCallback(async () => {
    const reqId = ++activeRequestIdRef.current;
    setLoading(true);
    setErrorMessage(null);

    try {
      const [res, metricsRes] = await Promise.all([
        getParsers(),
        getMetrics().catch((err) => {
          console.warn("Failed to fetch /metrics for parsers:", err);
          return null;
        }),
      ]);
      if (!isMountedRef.current || activeRequestIdRef.current !== reqId) return;

      setParsers(res.data);
      if (metricsRes) {
        setMetrics(metricsRes.data);
      }
    } catch (err: unknown) {
      if (!isMountedRef.current || activeRequestIdRef.current !== reqId) return;

      if (err instanceof ApiError) {
        if (err.isOffline) {
          setErrorMessage("Backend Offline: Unable to reach parser registry service.");
        } else {
          setErrorMessage(err.message || `Failed to load parsers: HTTP ${err.status}`);
        }
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load parsers");
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

    if (modeChanged || statusChanged || parsers.length === 0) {
      fetchParsers();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [apiMode, backendStatus, fetchParsers, parsers.length]);

  return (
    <AppShell currentSection="PARSERS_REGISTRY" eps={metrics?.eps}>
      <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
        {/* Operational Breadcrumb & Mode Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-1.5 text-[#64748B] font-mono text-[0.75rem]">
            <span className="hover:text-[#1E293B] transition-colors cursor-pointer">SOC</span>
            <span>/</span>
            <span className="hover:text-[#1E293B] transition-colors cursor-pointer">
              Normalization Engine
            </span>
            <span>/</span>
            <span className="text-[#1E293B] font-semibold">
              Dynamic Parser Registry &amp; Onboarding Wizard
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
              onClick={fetchParsers}
              disabled={loading}
              title="Reload parsers list"
              className="p-1.5 rounded hover:bg-slate-100 text-[#64748B] hover:text-[#1E293B] transition-colors border border-transparent hover:border-[#CBD5E1]"
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
              onClick={fetchParsers}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-semibold shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-mono flex items-center justify-between shadow-sm">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900 font-bold ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* 1. Active Parsers Table */}
        <ParsersTable
          parsers={parsers}
          loading={loading}
          onRefresh={fetchParsers}
          onSelectVendorForTest={(vendor) => {
            setSelectedVendorForTest(vendor);
            // Smooth scroll to tester
            const el = document.getElementById("parser-tester-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* 2. Parser Dry-Run Tester */}
        <div id="parser-tester-section">
          <ParserTester
            availableVendors={parsers.map((p) => p.vendor)}
            selectedVendor={selectedVendorForTest}
            onVendorChange={setSelectedVendorForTest}
            isOffline={isOffline}
          />
        </div>

        {/* 3. Parser Onboarding Wizard */}
        <OnboardWizard onSuccess={fetchParsers} isOffline={isOffline} />
      </div>
    </AppShell>
  );
}
