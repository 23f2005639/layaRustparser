"use client";

import React, { useState } from "react";
import { SystemResponse } from "@/lib/types";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

interface PayloadViewerProps {
  system: SystemResponse;
  isLive: boolean;
}

export function PayloadViewer({ system, isLive }: PayloadViewerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const jsonStr = JSON.stringify(system, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0 border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1E293B]">
                System Status Payload:
              </h3>
              <span className="text-[0.75rem] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                200 OK - Fully Operational
              </span>
            </div>
            <p className="text-[0.6875rem] text-[#64748B] font-mono">
              GET /system ({isLive ? "Live API response" : "Mock fixture payload"})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[0.75rem] font-mono text-[#475569] hover:text-[#1E293B] hover:bg-white border border-[#CBD5E1] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#64748B]" />
          )}
        </div>
      </div>

      {/* JSON Viewer Body */}
      {isOpen && (
        <div className="border-t border-[#E2E8F0] p-4 bg-[#F8FAFC]">
          <pre className="p-3 bg-white rounded-lg border border-[#E2E8F0] font-mono text-[0.75rem] text-[#1E293B] overflow-x-auto max-h-96 select-text leading-relaxed">
            {jsonStr}
          </pre>
        </div>
      )}
    </div>
  );
}
