"use client";

import React, { useState, useMemo } from "react";
import { BlockItem } from "@/lib/types";
import {
  Database,
  CheckCircle2,
  AlertOctagon,
  FileQuestion,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  HardDrive,
  Hash,
  Layers,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface BlockSelectorProps {
  blocks: BlockItem[];
  selectedBlockId: number | null;
  onSelectBlock: (blockId: number) => void;
  isLoading: boolean;
  onRefresh: () => void;
  isLive: boolean;
  isOffline?: boolean;
}

export function BlockSelector({
  blocks,
  selectedBlockId,
  onSelectBlock,
  isLoading,
  onRefresh,
  isLive,
  isOffline = false,
}: BlockSelectorProps) {
  const [copiedRoot, setCopiedRoot] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [jumpInput, setJumpInput] = useState<string>("");

  const selectedBlock = blocks.find((b) => b.block_id === selectedBlockId) || null;

  // Filter blocks by status tab
  const filteredBlocks = useMemo(() => {
    if (statusFilter === "ALL") return blocks;
    return blocks.filter((b) => b.status === statusFilter);
  }, [blocks, statusFilter]);

  // Counts by status
  const counts = useMemo(() => {
    const c = { ALL: blocks.length, PASS: 0, FAIL: 0, FILE_MISSING: 0, UNAUDITED: 0 };
    for (const b of blocks) {
      if (b.status === "PASS") c.PASS++;
      else if (b.status === "FAIL") c.FAIL++;
      else if (b.status === "FILE_MISSING") c.FILE_MISSING++;
      else c.UNAUDITED++;
    }
    return c;
  }, [blocks]);

  // Navigation handlers
  const handlePrevBlock = () => {
    if (selectedBlockId === null || blocks.length === 0) return;
    const currentIndex = blocks.findIndex((b) => b.block_id === selectedBlockId);
    if (currentIndex > 0) {
      onSelectBlock(blocks[currentIndex - 1].block_id);
    }
  };

  const handleNextBlock = () => {
    if (selectedBlockId === null || blocks.length === 0) return;
    const currentIndex = blocks.findIndex((b) => b.block_id === selectedBlockId);
    if (currentIndex >= 0 && currentIndex < blocks.length - 1) {
      onSelectBlock(blocks[currentIndex + 1].block_id);
    }
  };

  const handleJumpToGo = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(jumpInput.trim(), 10);
    if (!isNaN(id)) {
      onSelectBlock(id);
      setJumpInput("");
    }
  };

  const handleCopyRoot = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRoot(true);
    setTimeout(() => setCopiedRoot(false), 2000);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getStatusBadge = (status: BlockItem["status"]) => {
    switch (status) {
      case "PASS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS (Ledger Match)
          </span>
        );
      case "FAIL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FF5C5C]/10 text-[#FF5C5C] border border-[#FF5C5C]/30">
            <AlertOctagon className="w-3.5 h-3.5" />
            FAIL (Tampered)
          </span>
        );
      case "FILE_MISSING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/30">
            <FileQuestion className="w-3.5 h-3.5" />
            FILE MISSING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-[#64748B] border border-slate-300">
            <HelpCircle className="w-3.5 h-3.5" />
            UNAUDITED
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col gap-4 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A1D20] text-white flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1E293B]">Parquet Block Ledger</h2>
              <span
                className={`text-[0.6875rem] font-mono font-medium px-2 py-0.5 rounded border ${
                  isOffline
                    ? "bg-amber-500/10 text-amber-700 border-amber-500/30 font-semibold"
                    : isLive
                    ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 font-semibold"
                    : "bg-slate-100 text-[#64748B] border-[#CBD5E1]"
                }`}
              >
                {isOffline ? "OFFLINE (CACHED LEDGER)" : isLive ? "LIVE LEDGER" : "MOCK FIXTURE"}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              {isOffline
                ? `Showing cached ledger (${blocks.length} blocks) — Backend disconnected`
                : isLive
                ? `Dynamically loaded blocks from GET /blocks (${blocks.length} total blocks)`
                : `Loaded blocks from Mock Ledger Fixture (${blocks.length} total blocks)`}
            </p>
          </div>
        </div>

        {/* Right side controls: Jump to block & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Block Jump */}
          <form onSubmit={handleJumpToGo} className="flex items-center gap-1 text-xs">
            <input
              type="number"
              min="0"
              placeholder="Block #..."
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="w-24 px-2 py-1 font-mono text-xs border border-[#CBD5E1] rounded bg-white text-[#1E293B] focus:ring-1 focus:ring-[#0284C7] focus:outline-none"
            />
            <button
              type="submit"
              className="px-2.5 py-1 text-xs font-mono font-semibold bg-[#1A1D20] text-white rounded hover:bg-[#2E343A] transition-colors"
            >
              Go
            </button>
          </form>

          {/* Prev / Next Block Navigation */}
          <div className="flex items-center border border-[#CBD5E1] rounded overflow-hidden">
            <button
              onClick={handlePrevBlock}
              disabled={selectedBlockId === null || blocks.findIndex((b) => b.block_id === selectedBlockId) <= 0}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-[#1E293B] disabled:opacity-40 transition-colors border-r border-[#CBD5E1]"
              title="Previous Block"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextBlock}
              disabled={
                selectedBlockId === null ||
                blocks.findIndex((b) => b.block_id === selectedBlockId) >= blocks.length - 1
              }
              className="px-2 py-1 bg-white hover:bg-slate-100 text-[#1E293B] disabled:opacity-40 transition-colors"
              title="Next Block"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh / Reconnect */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
              isOffline
                ? "bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 font-semibold shadow-sm"
                : "text-[#1E293B] bg-white border border-[#E2E8F0] hover:bg-[#F3F3F3]"
            }`}
            title={isOffline ? "Backend Offline: Click to retry connection" : "Refresh Block Ledger"}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isOffline ? "text-amber-600" : "text-[#64748B]"} ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            {isOffline ? "Retry Connection" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Block Selector Controls: Dropdown & Status Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Full Block Dropdown Selector */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <label className="text-xs font-mono text-[#64748B] uppercase whitespace-nowrap">
            Select Block:
          </label>
          <select
            value={selectedBlockId !== null ? selectedBlockId : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val !== "") onSelectBlock(Number(val));
            }}
            className="w-full text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#1E293B] focus:ring-1 focus:ring-[#0284C7] focus:outline-none"
          >
            {selectedBlockId === null && <option value="">-- Choose a Block --</option>}
            {blocks.map((b) => (
              <option key={b.block_id} value={b.block_id}>
                Block #{String(b.block_id).padStart(5, "0")} ({b.status} - {b.leaf_count.toLocaleString()} leaves - {formatBytes(b.size_bytes)})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 text-[0.6875rem] font-mono">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-2 py-1 rounded transition-colors ${
              statusFilter === "ALL"
                ? "bg-[#1A1D20] text-white font-bold"
                : "bg-slate-100 hover:bg-slate-200 text-[#64748B]"
            }`}
          >
            All ({counts.ALL})
          </button>
          <button
            onClick={() => setStatusFilter("PASS")}
            className={`px-2 py-1 rounded transition-colors ${
              statusFilter === "PASS"
                ? "bg-[#10B981] text-white font-bold"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
            }`}
          >
            PASS ({counts.PASS})
          </button>
          <button
            onClick={() => setStatusFilter("FAIL")}
            className={`px-2 py-1 rounded transition-colors ${
              statusFilter === "FAIL"
                ? "bg-[#FF5C5C] text-white font-bold"
                : "bg-rose-50 hover:bg-rose-100 text-rose-700"
            }`}
          >
            FAIL ({counts.FAIL})
          </button>
          <button
            onClick={() => setStatusFilter("FILE_MISSING")}
            className={`px-2 py-1 rounded transition-colors ${
              statusFilter === "FILE_MISSING"
                ? "bg-amber-500 text-white font-bold"
                : "bg-amber-50 hover:bg-amber-100 text-amber-700"
            }`}
          >
            MISSING ({counts.FILE_MISSING})
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Compact Block Carousel */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-[#64748B] font-mono">
          <span>Quick Block Selector (Showing {filteredBlocks.length} blocks):</span>
          {selectedBlockId !== null && (
            <span className="text-[#0284C7] font-semibold">
              Active: Block #{String(selectedBlockId).padStart(5, "0")}
            </span>
          )}
        </div>

        {blocks.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-[#64748B] bg-[#F3F3F3] rounded-lg border border-dashed border-[#CBD5E1]">
            {isLoading ? "Loading blocks ledger from backend..." : "No blocks found in ledger."}
          </div>
        ) : (
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            {filteredBlocks.map((b) => {
              const isSelected = b.block_id === selectedBlockId;
              return (
                <button
                  key={b.block_id}
                  onClick={() => onSelectBlock(b.block_id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                    isSelected
                      ? "bg-[#0284C7]/10 border-[#0284C7] text-[#0284C7] font-semibold ring-1 ring-[#0284C7]"
                      : "bg-[#F3F3F3] hover:bg-slate-200 border-[#E2E8F0] text-[#1E293B]"
                  }`}
                >
                  <Layers className={`w-3 h-3 ${isSelected ? "text-[#0284C7]" : "text-[#64748B]"}`} />
                  <span>#{String(b.block_id).padStart(5, "0")}</span>
                  <span
                    className={`text-[0.625rem] px-1 py-0.2 rounded font-sans font-bold ${
                      b.status === "PASS"
                        ? "bg-[#10B981]/20 text-[#10B981]"
                        : b.status === "FAIL"
                        ? "bg-[#FF5C5C]/20 text-[#FF5C5C]"
                        : "bg-slate-300 text-[#64748B]"
                    }`}
                  >
                    {b.status}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Block Metadata Card */}
      {selectedBlock ? (
        <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3.5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#1E293B] bg-white px-2 py-1 rounded border border-[#E2E8F0]">
                Block #{String(selectedBlock.block_id).padStart(5, "0")}
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                {selectedBlock.parquet_file}
              </span>
            </div>
            {getStatusBadge(selectedBlock.status)}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E2E8F0] text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[#64748B] flex items-center gap-1 font-mono text-[0.6875rem]">
                <Clock className="w-3 h-3 text-[#64748B]" />
                TIMESTAMP (UTC)
              </span>
              <span className="font-mono text-[#1E293B] truncate" title={new Date(selectedBlock.timestamp).toISOString()}>
                {new Date(selectedBlock.timestamp).toLocaleString("en-US", { timeZone: "UTC" })}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[#64748B] flex items-center gap-1 font-mono text-[0.6875rem]">
                <Layers className="w-3 h-3 text-[#64748B]" />
                LEAF COUNT
              </span>
              <span className="font-mono text-[#1E293B] font-semibold">
                {selectedBlock.leaf_count.toLocaleString()} records
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[#64748B] flex items-center gap-1 font-mono text-[0.6875rem]">
                <HardDrive className="w-3 h-3 text-[#64748B]" />
                PARQUET SIZE
              </span>
              <span className="font-mono text-[#1E293B]">
                {formatBytes(selectedBlock.size_bytes)}
                <span className="ml-1 text-[0.625rem] text-[#64748B]">
                  ({selectedBlock.file_exists ? "On Disk" : "Missing"})
                </span>
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[#64748B] flex items-center gap-1 font-mono text-[0.6875rem]">
                <Hash className="w-3 h-3 text-[#64748B]" />
                MERKLE ROOT
              </span>
              <div className="flex items-center gap-1">
                <span
                  className="font-mono text-[0.6875rem] text-[#0284C7] truncate max-w-[120px]"
                  title={selectedBlock.merkle_root}
                >
                  {selectedBlock.merkle_root}
                </span>
                <button
                  onClick={() => handleCopyRoot(selectedBlock.merkle_root)}
                  className="p-1 hover:bg-slate-200 rounded text-[#64748B] hover:text-[#1E293B] transition-colors"
                  title="Copy Merkle Root"
                >
                  {copiedRoot ? (
                    <Check className="w-3 h-3 text-[#10B981]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-center text-xs text-[#64748B]">
          No Parquet block selected. Choose a block above to examine its records and cryptographic root.
        </div>
      )}
    </div>
  );
}
