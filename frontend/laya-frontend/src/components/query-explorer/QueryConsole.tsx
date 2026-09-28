"use client";

import React, { useState } from "react";
import { RecordsQueryParams } from "@/lib/types";
import { parseSqlQuery, buildSqlQuery, QUERY_PRESETS } from "@/lib/query-parser";
import {
  Terminal,
  Play,
  RotateCcw,
  Filter,
  X,
  AlertCircle,
  Search,
  Sparkles,
  Shield,
  Tag,
  Network,
  WifiOff,
} from "lucide-react";

interface QueryConsoleProps {
  selectedBlockId: number | null;
  filters: RecordsQueryParams;
  onApplyFilters: (newFilters: RecordsQueryParams) => void;
  onClearFilters: () => void;
  isLoading: boolean;
  filteredCount?: number;
  totalCount?: number;
  availableVendors?: string[];
  isOffline?: boolean;
}

const DEFAULT_BACKEND_VENDORS = [
  "Cisco",
  "Fortinet",
  "Palo Alto Networks",
  "OISF",
  "Netgate",
  "Unknown",
];

const KNOWN_DISPOSITIONS = [
  { label: "All Dispositions", value: "" },
  { label: "Allowed", value: "Allowed" },
  { label: "Blocked", value: "Blocked" },
  { label: "Dropped", value: "Dropped" },
];

export function QueryConsole({
  selectedBlockId,
  filters,
  onApplyFilters,
  onClearFilters,
  isLoading,
  filteredCount,
  totalCount,
  availableVendors,
  isOffline = false,
}: QueryConsoleProps) {
  const vendorList = Array.from(
    new Set([
      ...DEFAULT_BACKEND_VENDORS,
      ...(availableVendors || []),
    ])
  ).filter(Boolean);

  // SQL text buffer
  const [sqlText, setSqlText] = useState<string>(() => buildSqlQuery(filters));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [prevFilters, setPrevFilters] = useState(filters);

  // Keep SQL text in sync when external filters change (e.g., from pivot clicks or reset)
  if (filters !== prevFilters) {
    setPrevFilters(filters);
    setSqlText(buildSqlQuery(filters));
    setValidationError(null);
  }

  const handleRunQuery = () => {
    const parsed = parseSqlQuery(sqlText);
    if (!parsed.isValid) {
      setValidationError(parsed.error || "Unsupported query syntax.");
      return;
    }

    setValidationError(null);
    onApplyFilters(parsed.params);
  };

  const handleClear = () => {
    setSqlText("SELECT * FROM records");
    setValidationError(null);
    onClearFilters();
  };

  const handleSelectPreset = (presetSql: string) => {
    setSqlText(presetSql);
    const parsed = parseSqlQuery(presetSql);
    if (parsed.isValid) {
      setValidationError(null);
      onApplyFilters(parsed.params);
    }
  };

  // Quick filter updates synchronize with SQL
  const handleQuickVendorChange = (vendor: string) => {
    const next = { ...filters, vendor: vendor || undefined };
    if (!vendor) delete next.vendor;
    onApplyFilters(next);
  };

  const handleQuickDispositionChange = (disposition: string) => {
    const next = { ...filters, disposition: disposition || undefined };
    if (!disposition) delete next.disposition;
    onApplyFilters(next);
  };

  const handleQuickIpChange = (ip: string) => {
    const next = { ...filters, ip: ip.trim() || undefined };
    if (!ip.trim()) delete next.ip;
    onApplyFilters(next);
  };

  const handleQuickSearchChange = (query: string) => {
    const next = { ...filters, query: query.trim() || undefined };
    if (!query.trim()) delete next.query;
    onApplyFilters(next);
  };

  const hasActiveFilters = Boolean(
    filters.vendor || filters.disposition || filters.ip || filters.query
  );

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col gap-4 shadow-sm">
      {/* Console Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A1D20] text-white flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1E293B]">Investigation Query Console</h2>
              {selectedBlockId !== null && (
                <span className="font-mono text-xs text-[#0284C7] bg-[#0284C7]/10 px-2 py-0.5 rounded border border-[#0284C7]/30">
                  Target: Block #{String(selectedBlockId).padStart(5, "0")}
                </span>
              )}
              {isOffline && (
                <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1 font-semibold">
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  OFFLINE
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              {isOffline
                ? "Backend disconnected — Query changes will attempt reconnection when run"
                : "Execute mapped SQL filters against Parquet columnar batches"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalCount !== undefined && (
            <span className="text-xs font-mono text-[#64748B] bg-[#F3F3F3] px-2.5 py-1 rounded border border-[#E2E8F0]">
              Matches: <strong className="text-[#1E293B]">{filteredCount ?? 0}</strong> / {totalCount} records
            </span>
          )}
        </div>
      </div>

      {/* SQL Editor Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#0284C7]" />
            SQL Query (JetBrains Mono)
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[0.6875rem] text-[#64748B] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0284C7]" />
              Presets:
            </span>
            {QUERY_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p.sql)}
                className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-[#F3F3F3] hover:bg-slate-200 border border-[#E2E8F0] text-[#1E293B] transition-colors"
                title={p.description}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={sqlText}
            onChange={(e) => {
              setSqlText(e.target.value);
              setValidationError(null);
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleRunQuery();
              }
            }}
            rows={3}
            spellCheck={false}
            className="w-full font-mono text-xs sm:text-sm bg-[#1A1D20] text-[#0284C7] p-3 rounded-lg border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-transparent resize-y leading-relaxed shadow-inner"
            placeholder="SELECT * FROM records WHERE vendor = 'Cisco'"
          />
        </div>

        {/* Validation Warning */}
        {validationError && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">Unsupported query operation</span>
              <p className="text-amber-700">{validationError}</p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="text-[0.6875rem] font-mono text-[#64748B]">
            Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700">Enter</kbd> to execute
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E293B] bg-white border border-[#E2E8F0] hover:bg-[#F3F3F3] rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
              Clear
            </button>

            <button
              onClick={handleRunQuery}
              disabled={isLoading || selectedBlockId === null}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                isOffline
                  ? "bg-amber-700 hover:bg-amber-800 text-white"
                  : "bg-[#1A1D20] hover:bg-[#2E343A] text-white"
              }`}
              title={isOffline ? "Backend Offline: Click to attempt reconnection and query execution" : "Execute query"}
            >
              {isOffline ? (
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              ) : (
                <Play className={`w-3.5 h-3.5 text-[#0284C7] fill-[#0284C7] ${isLoading ? "animate-pulse" : ""}`} />
              )}
              {isLoading ? "Executing..." : isOffline ? "Retry Query (Offline)" : "Run Query"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Visual Filters & Pivot Bar */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#0284C7]" />
            Structured Filters (Synced with Query)
          </span>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-[#0284C7] hover:underline flex items-center gap-1 font-medium"
            >
              <X className="w-3 h-3" />
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Vendor Quick Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.6875rem] font-mono text-[#64748B] flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#64748B]" />
              VENDOR
            </label>
            <select
              value={filters.vendor || ""}
              onChange={(e) => handleQuickVendorChange(e.target.value)}
              className="w-full text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#1E293B] focus:ring-1 focus:ring-[#0284C7] focus:outline-none"
            >
              <option value="">All Vendors</option>
              {vendorList.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Disposition Quick Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.6875rem] font-mono text-[#64748B] flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#64748B]" />
              DISPOSITION
            </label>
            <select
              value={filters.disposition || ""}
              onChange={(e) => handleQuickDispositionChange(e.target.value)}
              className="w-full text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#1E293B] focus:ring-1 focus:ring-[#0284C7] focus:outline-none"
            >
              {KNOWN_DISPOSITIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* IP Address Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.6875rem] font-mono text-[#64748B] flex items-center gap-1">
              <Network className="w-3 h-3 text-[#64748B]" />
              IP PIVOT
            </label>
            <input
              type="text"
              value={filters.ip || ""}
              onChange={(e) => handleQuickIpChange(e.target.value)}
              placeholder="e.g. 192.168.1.10"
              className="w-full text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#1E293B] focus:ring-1 focus:ring-[#0284C7] focus:outline-none"
            />
          </div>

          {/* Free Text / Query */}
          <div className="flex flex-col gap-1">
            <label className="text-[0.6875rem] font-mono text-[#64748B] flex items-center gap-1">
              <Search className="w-3 h-3 text-[#64748B]" />
              RAW TEXT / HASH / UUID
            </label>
            <input
              type="text"
              value={filters.query || ""}
              onChange={(e) => handleQuickSearchChange(e.target.value)}
              placeholder="Search raw payload or SHA..."
              className="w-full text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#1E293B] focus:ring-1 focus:ring-[#0284C7] focus:outline-none"
            />
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[0.6875rem] font-mono text-[#64748B] uppercase">Active Filters:</span>
            {filters.vendor && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/30">
                Vendor: {filters.vendor}
                <button
                  onClick={() => handleQuickVendorChange("")}
                  className="hover:text-red-500 transition-colors ml-0.5"
                  title="Remove vendor filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.disposition && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/30">
                Disposition: {filters.disposition}
                <button
                  onClick={() => handleQuickDispositionChange("")}
                  className="hover:text-red-500 transition-colors ml-0.5"
                  title="Remove disposition filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.ip && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/30">
                IP: {filters.ip}
                <button
                  onClick={() => handleQuickIpChange("")}
                  className="hover:text-red-500 transition-colors ml-0.5"
                  title="Remove IP filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.query && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/30">
                Search: {filters.query}
                <button
                  onClick={() => handleQuickSearchChange("")}
                  className="hover:text-red-500 transition-colors ml-0.5"
                  title="Remove search query"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
