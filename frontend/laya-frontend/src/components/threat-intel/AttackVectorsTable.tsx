
"use client";

import { useState } from "react";
import { Radar, Filter, ShieldCheck } from "lucide-react";
import { AttackVectorItem } from "@/lib/types";

interface AttackVectorsTableProps {
  vectors: AttackVectorItem[];
  isLive?: boolean;
  status?: "LIVE" | "MOCK" | "OFFLINE";
}

export function AttackVectorsTable({
  vectors,
  isLive = false,
  status = "OFFLINE",
}: AttackVectorsTableProps) {
  const [filterActive, setFilterActive] = useState(false);

  const currentStatus = status ?? (isLive ? "LIVE" : "OFFLINE");
  const isActuallyLive = isLive && currentStatus === "LIVE";
  const isOffline = currentStatus === "OFFLINE";
  const isMock = currentStatus === "MOCK";

  const displayed = filterActive
    ? vectors.filter(
      (v) => v.severity === "CRITICAL" || v.severity === "HIGH"
    )
    : vectors;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-2 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0284C7]/10 text-[#0284C7]">
            <Radar className="w-5 h-5 text-[#0284C7]" />
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[1.125rem] font-semibold text-[#1E293B]">
                {isActuallyLive
                  ? "Live IOC Correlated Attack Vectors"
                  : "IOC Correlated Attack Vectors"}
              </h2>


            </div>

            <span className="font-mono text-[0.75rem] text-[#64748B]">
              {isActuallyLive
                ? "Real-time enrichment via MISP + ThreatConnect indicators"
                : isMock
                  ? "Simulated enrichment via MISP + ThreatConnect indicators"
                  : "Enrichment paused — backend offline"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[0.75rem] text-[#64748B]">
            <span
              className={`w-2 h-2 rounded-full ${isActuallyLive
                ? "bg-[#10B981] animate-ping"
                : isMock
                  ? "bg-sky-500"
                  : "bg-amber-500"
                }`}
            />

            <span>
              {isActuallyLive ? (
                <>
                  Ingesting Live Stream:{" "}
                  <strong className="text-[#1E293B] font-semibold">
                    Suricata + Cisco
                  </strong>
                </>
              ) : isMock ? (
                <>
                  Sample Feed:{" "}
                  <strong className="text-[#1E293B] font-semibold">
                    Suricata + Cisco (Mock)
                  </strong>
                </>
              ) : (
                <>
                  Stream Offline:{" "}
                  <strong className="text-amber-800 font-semibold">
                    Suricata + Cisco (Disconnected)
                  </strong>
                </>
              )}
            </span>
          </div>

          {!isOffline && (
            <button
              onClick={() => setFilterActive((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-mono text-[0.75rem] font-semibold transition-colors cursor-pointer border ${filterActive
                ? "bg-[#0284C7] text-white border-[#0284C7]"
                : "bg-[#0284C7]/10 text-[#0284C7] border-[#0284C7]/30 hover:bg-[#0284C7]/20"
                }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {filterActive ? "Show All Vectors" : "Filter Critical/High"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* OFFLINE empty state */}
      {isOffline ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 border border-amber-200 mb-3">
            <Radar className="w-6 h-6 text-amber-600" />
          </div>

          <h3 className="font-mono text-sm font-semibold text-[#1E293B]">
            IOC data unavailable
          </h3>

          <p className="font-mono text-xs text-[#64748B] mt-1">
            Backend offline — trying to reconnect...
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[0.875rem]">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] border-y border-[#E2E8F0] font-mono text-[0.75rem] uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">
                    Timestamp (UTC)
                  </th>
                  <th className="py-2.5 px-3 font-semibold">
                    Indicator IP (IOC)
                  </th>
                  <th className="py-2.5 px-3 font-semibold">
                    Target Service
                  </th>
                  <th className="py-2.5 px-3 font-semibold">
                    MITRE ATT&CK
                  </th>
                  <th className="py-2.5 px-3 font-semibold">Severity</th>
                  <th className="py-2.5 px-3 font-semibold">
                    Autonomous Playbook Executed
                  </th>
                  <th className="py-2.5 px-3 text-right font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="text-[#1E293B] font-mono text-[0.75rem] divide-y divide-[#E2E8F0]">
                {displayed.map((item) => {
                  const isCrit = item.severity === "CRITICAL";
                  const isHigh = item.severity === "HIGH";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="py-3 px-3 text-[#64748B] whitespace-nowrap">
                        {item.timestamp}
                      </td>

                      <td className="py-3 px-3 font-semibold text-[#0284C7] whitespace-nowrap">
                        {item.ip}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0]">
                          {item.targetService}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-medium text-[#1E293B]">
                          {item.mitreAttack}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[0.6875rem] ${isCrit
                            ? "bg-[#BA1A1A] text-white"
                            : isHigh
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-blue-100 text-blue-900 border border-blue-300"
                            }`}
                        >
                          {item.severity}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[#44474A] whitespace-nowrap">
                        {item.playbook}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[0.6875rem] ${item.status === "BLOCKED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                            : item.status === "CONTAINED"
                              ? "bg-sky-50 text-sky-700 border border-sky-300"
                              : "bg-amber-50 text-amber-700 border border-amber-300"
                            }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
