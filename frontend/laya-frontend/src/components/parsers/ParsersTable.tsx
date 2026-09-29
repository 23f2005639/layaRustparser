"use client";

import React, { useState } from "react";
import { ParserItem } from "@/lib/types";
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  XCircle,
  Search,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ParsersTableProps {
  parsers: ParserItem[];
  loading: boolean;
  onRefresh: () => void;
  onSelectVendorForTest?: (vendor: string) => void;
}

export function ParsersTable({
  parsers,
  loading,
  onRefresh,
  onSelectVendorForTest,
}: ParsersTableProps) {
  const [search, setSearch] = useState("");

  const filtered = parsers.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.vendor.toLowerCase().includes(q) ||
      p.device_model.toLowerCase().includes(q) ||
      p.parser_type.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  });

  const nativeCount = parsers.filter((p) => p.parser_type === "native_extractor").length;
  const dynamicCount = parsers.filter((p) => p.parser_type === "dynamic_onboarded").length;

  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case "invalid":
      case "malformed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold bg-[#FF5C5C]/10 text-[#FF5C5C] border border-[#FF5C5C]/30">
            <XCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case "unreadable":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.75rem] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Unreadable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.75rem] font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <FileQuestion className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Header ribbon */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A1D20] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sliders className="w-5 h-5 text-[#0284C7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1E293B]">Active Parsers Registry</h2>
              <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-[#F0F3FF] border border-[#C5C6CA]/40 text-[#0284C7] font-semibold">
                {parsers.length} Registered
              </span>
            </div>
            <p className="text-[0.75rem] text-[#64748B]">
              Compiled zero-copy native extractors and hot-loaded dynamic regex specifications.
            </p>
          </div>
        </div>

        {/* Counts & Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-[0.75rem] font-mono text-[#64748B] mr-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
              <Cpu className="w-3.5 h-3.5 text-[#0284C7]" /> Native: {nativeCount}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
              <Layers className="w-3.5 h-3.5 text-[#10B981]" /> Dynamic: {dynamicCount}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search parsers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[0.75rem] text-[#1E293B] placeholder:text-[#64748B]/70 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh parsers list from backend"
            className="h-8 px-2.5 rounded bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#475569] hover:text-[#1E293B] text-[0.75rem] flex items-center gap-1.5 transition-colors font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0284C7]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[0.8125rem]">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-mono text-[0.6875rem] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Vendor Slug</th>
              <th className="py-3 px-4 font-semibold">Device Model</th>
              <th className="py-3 px-4 font-semibold">Parser Type</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Confidence</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading && parsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#64748B]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0284C7]" />
                  Loading parser registry...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#64748B]">
                  No matching parsers found.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const confidencePct =
                  item.confidence_score != null
                    ? `${Math.round(item.confidence_score * 100)}%`
                    : "—";

                return (
                  <tr
                    key={`${item.vendor}-${item.device_model}-${idx}`}
                    className="hover:bg-[#F8FAFC] transition-colors group"
                  >
                    {/* Vendor */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#1E293B]">
                          {item.vendor}
                        </span>
                        {item.parser_type === "native_extractor" ? (
                          <span className="text-[0.625rem] font-mono px-1.5 py-0.2 rounded bg-sky-50 text-[#0284C7] border border-sky-200">
                            core
                          </span>
                        ) : (
                          <span className="text-[0.625rem] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            dynamic
                          </span>
                        )}
                      </div>
                      {item.source_path && (
                        <span
                          className="block text-[0.6875rem] font-mono text-[#64748B] truncate max-w-xs"
                          title={item.source_path}
                        >
                          {item.source_path}
                        </span>
                      )}
                    </td>

                    {/* Device Model */}
                    <td className="py-3 px-4 text-[#334155] font-medium">
                      {item.device_model}
                    </td>

                    {/* Parser Type */}
                    <td className="py-3 px-4 font-mono text-[0.75rem] text-[#64748B]">
                      {item.parser_type}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{renderStatusBadge(item.status)}</td>

                    {/* Confidence */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-[#10B981] rounded-full"
                            style={{
                              width:
                                item.confidence_score != null
                                  ? `${Math.min(100, Math.max(0, item.confidence_score * 100))}%`
                                  : "0%",
                            }}
                          />
                        </div>
                        <span className="font-mono text-[0.75rem] text-[#1E293B] font-semibold">
                          {confidencePct}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {onSelectVendorForTest && (
                        <button
                          onClick={() => onSelectVendorForTest(item.vendor)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[0.6875rem] font-medium bg-[#1A1D20] text-white hover:bg-[#2E343A] transition-colors shadow-sm"
                        >
                          <span>Test Log</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info note */}
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[0.6875rem] text-[#64748B] font-mono">
        <span>Parser status is governed authoritatively by the engine binary and disk registry.</span>
        <span>RFC 5424 / OCSF v1.3</span>
      </div>
    </div>
  );
}
