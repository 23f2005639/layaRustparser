"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LedgerViewer } from "@/components/vault/LedgerViewer";
import { ProofViewer } from "@/components/vault/ProofViewer";
import { TamperDrillSection } from "@/components/vault/TamperDrillSection";
import {
  getBlocks,
  getMetrics,
  getApiMode,
  getBackendStatus,
  subscribeBackendStatus,
  ApiError,
  ApiMode,
  BackendStatus,
} from "@/lib/api";
import { BlockItem, MetricsResponse } from "@/lib/types";
import { WifiOff, RefreshCcw } from "lucide-react";

export default function CryptoVaultPage() {
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

  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(1);

  const isMountedRef = useRef(true);
  const activeRequestIdRef = useRef<number>(0);
  const prevModeRef = useRef<ApiMode | null>(null);
  const prevStatusRef = useRef<BackendStatus | null>(null);

  const isOffline = backendStatus === "OFFLINE";
  const isMock = apiMode === "MOCK";

  const fetchBlocks = useCallback(async () => {
    const reqId = ++activeRequestIdRef.current;
    setLoading(true);
    setErrorMessage(null);

    try {
      const [res, metricsRes] = await Promise.all([
        getBlocks(),
        getMetrics().catch((err) => {
          console.warn("Failed to fetch /metrics for crypto vault:", err);
          return null;
        }),
      ]);
      if (!isMountedRef.current || activeRequestIdRef.current !== reqId) return;

      setBlocks(res.data);
      if (metricsRes) {
        setMetrics(metricsRes.data);
      }

      // Keep current selection if valid, else pick first valid block
      if (res.data.length > 0) {
        setSelectedBlockId((prev) => {
          const exists = res.data.some((b) => b.block_id === prev);
          return exists ? prev : res.data[0].block_id;
        });
      }
    } catch (err: unknown) {
      if (!isMountedRef.current || activeRequestIdRef.current !== reqId) return;

      if (err instanceof ApiError) {
        if (err.isOffline) {
          setErrorMessage("Backend Offline: Unable to reach blocks ledger service.");
        } else {
          setErrorMessage(err.message || `Failed to load blocks: HTTP ${err.status}`);
        }
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load blocks");
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

    if (modeChanged || statusChanged || blocks.length === 0) {
      fetchBlocks();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [apiMode, backendStatus, fetchBlocks, blocks.length]);

  const availableBlockIds = blocks.map((b) => b.block_id);

  return (
    <AppShell currentSection="CRYPTO_VAULT" eps={metrics?.eps}>
      <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
        {/* Operational Breadcrumb & Mode Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-1.5 text-[#64748B] font-mono text-[0.75rem]">
            <span className="hover:text-[#1E293B] transition-colors cursor-pointer">SOC</span>
            <span>/</span>
            <span className="hover:text-[#1E293B] transition-colors cursor-pointer">
              Forensic Integrity
            </span>
            <span>/</span>
            <span className="text-[#1E293B] font-semibold">
              Cryptographic Integrity &amp; Isolated Tamper Drill
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
              onClick={fetchBlocks}
              disabled={loading}
              title="Reload blocks ledger"
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
              onClick={fetchBlocks}
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

        {/* 1. Archived Parquet Blocks & Ledger Anchors */}
        <LedgerViewer
          blocks={blocks}
          loading={loading}
          onRefresh={fetchBlocks}
          onSelectBlockForProof={(id) => {
            setSelectedBlockId(id);
            const el = document.getElementById("proof-verifier-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          onSelectBlockForDrill={(id) => {
            setSelectedBlockId(id);
            const el = document.getElementById("tamper-drill-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          isOffline={isOffline}
        />

        {/* 2. Merkle Inclusion Proof Verifier */}
        <div id="proof-verifier-section">
          <ProofViewer
            selectedBlockId={selectedBlockId}
            availableBlockIds={availableBlockIds.length > 0 ? availableBlockIds : [0, 1]}
            onBlockChange={setSelectedBlockId}
            isOffline={isOffline}
          />
        </div>

        {/* 3. Safe Adversarial Simulation (Tamper Drill) */}
        <div id="tamper-drill-section">
          <TamperDrillSection
            selectedBlockId={selectedBlockId}
            availableBlockIds={availableBlockIds.length > 0 ? availableBlockIds : [0, 1]}
            onBlockChange={setSelectedBlockId}
            onDrillSuccess={fetchBlocks}
            isOffline={isOffline}
          />
        </div>
      </div>
    </AppShell>
  );
}
