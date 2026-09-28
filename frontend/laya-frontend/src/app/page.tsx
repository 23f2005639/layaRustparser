"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CommandRibbon } from "@/components/dashboard/CommandRibbon";
import { KpiTelemetryCards } from "@/components/dashboard/KpiTelemetryCards";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RestContractInspector } from "@/components/dashboard/RestContractInspector";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { OcsfStreamTable } from "@/components/dashboard/OcsfStreamTable";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import { getMetrics, getAlerts, getBlockRecords, getApiMode } from "@/lib/api";
import {
  MetricsResponse,
  AlertItem,
  StoredRecordItem,
  TimeSeriesPoint,
} from "@/lib/types";
import { mockMetrics, mockAlerts, mockRecords } from "@/lib/mock-data";

export type DashboardStatus = "LIVE" | "MOCK" | "OFFLINE" | "STALE";

export default function AnalystDashboardPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);
  const [records, setRecords] = useState<StoredRecordItem[]>([]);
  const [status, setStatus] = useState<DashboardStatus>("OFFLINE");
  const [isPolling] = useState<boolean>(true);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(true);

  // Time series buffer for live SVG performance chart
  const [history, setHistory] = useState<TimeSeriesPoint[]>([]);

  const inFlightRef = useRef<boolean>(false);
  const latestPollIdRef = useRef<number>(0);

  const pollData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const pollId = ++latestPollIdRef.current;
    const mode = getApiMode();

    if (mode === "MOCK") {
      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      setRecords(mockRecords);
      setStatus("MOCK");
      setHistory((prev) =>
        prev.length >= 2
          ? prev
          : [
              { time: "-60s", eps: 141000, latency_p50: 1.35 },
              { time: "-50s", eps: 141500, latency_p50: 1.3 },
              { time: "-40s", eps: 142000, latency_p50: 1.34 },
              { time: "-30s", eps: 141800, latency_p50: 1.28 },
              { time: "-20s", eps: 142200, latency_p50: 1.26 },
              { time: "-10s", eps: 142400, latency_p50: 1.29 },
              { time: "0s", eps: 142500, latency_p50: 1.28 },
            ]
      );
      inFlightRef.current = false;
      return;
    }

    // LIVE mode: serialized poll across all endpoints
    try {
      const metricsRes = await getMetrics();
      const [alertsRes, recordsRes] = await Promise.allSettled([
        getAlerts(),
        getBlockRecords(1, { limit: 10 }),
      ]);

      // If a newer poll was initiated, do not overwrite state with stale results
      if (pollId !== latestPollIdRef.current) return;

      setMetrics(metricsRes.data);
      if (alertsRes.status === "fulfilled") {
        setAlerts(alertsRes.value.data);
      }
      if (
        recordsRes.status === "fulfilled" &&
        recordsRes.value.data &&
        recordsRes.value.data.length > 0
      ) {
        setRecords(recordsRes.value.data);
      }
      setStatus("LIVE");

      // Append new time series point from actual response
      const newPoint: TimeSeriesPoint = {
        time: new Date().toLocaleTimeString().slice(-5),
        eps: metricsRes.data.eps,
        latency_p50: metricsRes.data.latency_p50_micros,
      };

      setHistory((prev) => {
        const next = [...prev.slice(-15), newPoint];
        return next;
      });
    } catch {
      // Backend failed or unreachable in LIVE mode
      if (pollId !== latestPollIdRef.current) return;

      // Do NOT fall back to mock fixtures!
      // Clear displayed metrics, alerts, and records when LIVE request fails
      setStatus("OFFLINE");
      setMetrics(null);
      setAlerts(null);
      setRecords([]);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Serialized polling requirement:
  // poll -> await all required requests -> update state -> wait 1 second -> poll again
  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout | null = null;

    async function pollLoop() {
      if (!active) return;
      await pollData();
      if (!active) return;
      if (isPolling) {
        timerId = setTimeout(pollLoop, 1000);
      }
    }

    pollLoop();

    return () => {
      active = false;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [pollData, isPolling]);

  // Respond immediately to mode changes (LIVE <-> MOCK toggle)
  useEffect(() => {
    const handleModeChange = () => {
      latestPollIdRef.current += 1;
      const mode = getApiMode();
      if (mode === "LIVE") {
        // When switching to LIVE, clear state immediately until next successful poll
        setMetrics(null);
        setAlerts(null);
        setRecords([]);
        setHistory([]);
        setStatus("OFFLINE");
      } else {
        setMetrics(mockMetrics);
        setAlerts(mockAlerts);
        setRecords(mockRecords);
        setStatus("MOCK");
        setHistory((prev) =>
          prev.length >= 2
            ? prev
            : [
                { time: "-60s", eps: 141000, latency_p50: 1.35 },
                { time: "-50s", eps: 141500, latency_p50: 1.3 },
                { time: "-40s", eps: 142000, latency_p50: 1.34 },
                { time: "-30s", eps: 141800, latency_p50: 1.28 },
                { time: "-20s", eps: 142200, latency_p50: 1.26 },
                { time: "-10s", eps: 142400, latency_p50: 1.29 },
                { time: "0s", eps: 142500, latency_p50: 1.28 },
              ]
        );
      }
      pollData();
    };

    window.addEventListener("ulpf_api_mode_change", handleModeChange);
    return () => {
      window.removeEventListener("ulpf_api_mode_change", handleModeChange);
    };
  }, [pollData]);

  const isLive = status === "LIVE";
  const epsHistory = history.map((h) => h.eps);

  return (
    <AppShell currentSection="LIVE_STREAM" eps={metrics?.eps}>
      <div className="flex flex-col w-full gap-5">
        {/* Top Command & Telemetry Ribbon */}
        <CommandRibbon
          onSync={pollData}
          isPolling={isPolling}
          isLive={isLive}
          status={status}
        />

        {/* 4 KPI Telemetry Cards */}
        <KpiTelemetryCards
          metrics={metrics}
          epsHistory={epsHistory}
          status={status}
        />

        {/* Primary Visual Panel: Live Stream Latency & Throughput Profile + REST Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={showJsonInspector ? "lg:col-span-8" : "lg:col-span-12"}>
            <PerformanceChart
              history={history}
              onToggleJson={() => setShowJsonInspector((prev) => !prev)}
              showJson={showJsonInspector}
              status={status}
            />
          </div>

          {showJsonInspector && (
            <div className="lg:col-span-4">
              <RestContractInspector metrics={metrics} status={status} />
            </div>
          )}
        </div>

        {/* Active Security Alerts Feed (GET /alerts) */}
        <AlertFeed alerts={alerts} onRefresh={pollData} status={status} />

        {/* Real-Time Ingested Events Stream Table (OCSF Canonical) */}
        <OcsfStreamTable records={records} status={status} />

        {/* Interactive Guided UI Tutorial */}
        <TutorialOverlay />
      </div>
    </AppShell>
  );
}
