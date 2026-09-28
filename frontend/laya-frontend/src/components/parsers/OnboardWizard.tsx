"use client";

import React, { useState } from "react";
import { OnboardRequest, OnboardResponse } from "@/lib/types";
import { onboardParser, ApiError } from "@/lib/api";
import {
  Wand2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  FileCode,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Info,
  Layers,
} from "lucide-react";

interface OnboardWizardProps {
  onSuccess?: () => void;
  isOffline?: boolean;
}

const JUNIPER_SAMPLE_PRESET = {
  vendor: "juniper_srx",
  device_model: "srx-340",
  samples: [
    "RT_FLOW: RT_FLOW_SESSION_CREATE: session created 192.168.10.55/49152->10.0.0.1/443 None None 6 sample-policy trust untrust 12345 N/A(N/A) ge-0/0/0.0",
    "RT_FLOW: RT_FLOW_SESSION_CLOSE: session closed TCP FIN: 192.168.10.55/49152->10.0.0.1/443 None None 6 sample-policy trust untrust 12345 540(3200) 12(8) 15 UNKNOWN N/A(N/A) ge-0/0/0.0",
    "RT_FLOW: RT_FLOW_SESSION_DENY: session denied 192.168.20.100/53211->172.16.0.5/22 None None 6 block-ssh untrust dmz 12346 N/A(N/A) ge-0/0/1.0",
  ],
};

export function OnboardWizard({ onSuccess }: OnboardWizardProps) {
  const [vendor, setVendor] = useState(JUNIPER_SAMPLE_PRESET.vendor);
  const [deviceModel, setDeviceModel] = useState(JUNIPER_SAMPLE_PRESET.device_model);
  const [samplesText, setSamplesText] = useState(JUNIPER_SAMPLE_PRESET.samples.join("\n"));

  // State
  const [previewLoading, setPreviewLoading] = useState(false);
  const [hotLoadLoading, setHotLoadLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<OnboardResponse | null>(null);
  const [hotLoadResult, setHotLoadResult] = useState<OnboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Copy states
  const [copiedRegex, setCopiedRegex] = useState(false);

  // Parsed lines count
  const sampleLines = samplesText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleLoadPreset = () => {
    setVendor(JUNIPER_SAMPLE_PRESET.vendor);
    setDeviceModel(JUNIPER_SAMPLE_PRESET.device_model);
    setSamplesText(JUNIPER_SAMPLE_PRESET.samples.join("\n"));
    setError(null);
    setPreviewResult(null);
    setHotLoadResult(null);
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendor.trim()) {
      setError("Vendor slug is required.");
      return;
    }
    if (sampleLines.length < 3) {
      setError(`Air-gapped parser synthesis requires at least 3 distinct sample lines (currently ${sampleLines.length}).`);
      return;
    }

    setPreviewLoading(true);
    setError(null);
    setPreviewResult(null);
    setHotLoadResult(null);

    const payload: OnboardRequest = {
      vendor: vendor.trim().toLowerCase(),
      device_model: deviceModel.trim() || "generic",
      sample_lines: sampleLines,
      confirm: false,
    };

    try {
      const res = await onboardParser(payload);
      setPreviewResult(res.data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isOffline) {
          setError("Backend Offline: Unable to reach onboarding synthesis service.");
        } else {
          setError(err.message || `Synthesis failed with status ${err.status}`);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to synthesize parser definition");
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmHotLoad = async () => {
    setShowConfirmModal(false);
    setHotLoadLoading(true);
    setError(null);

    const payload: OnboardRequest = {
      vendor: vendor.trim().toLowerCase(),
      device_model: deviceModel.trim() || "generic",
      sample_lines: sampleLines,
      confirm: true,
    };

    try {
      const res = await onboardParser(payload);
      setHotLoadResult(res.data);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isOffline) {
          setError("Backend Offline: Unable to commit parser to disk.");
        } else {
          setError(err.message || `Hot-load failed with status ${err.status}`);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to hot-load parser to disk");
      }
    } finally {
      setHotLoadLoading(false);
    }
  };

  const copyRegex = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRegex(true);
    setTimeout(() => setCopiedRegex(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A1D20] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Wand2 className="w-5 h-5 text-[#0284C7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1E293B]">
                1-Click Parser Onboarding Wizard
              </h2>
              <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-sky-50 text-[#0284C7] border border-sky-200 font-semibold">
                POST /onboard
              </span>
            </div>
            <p className="text-[0.75rem] text-[#64748B]">
              Drain template discovery &amp; regex synthesizer. Preview without writing; confirm to hot-load into live memory.
            </p>
          </div>
        </div>

        {/* Safety pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#F0F3FF] border border-[#C5C6CA]/40 text-[#0284C7] text-[0.6875rem] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7]" />
          <span>confirm=false Safe Preview Guarantee</span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Preset Button Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
          <div className="flex items-center gap-2 text-[0.75rem] text-[#64748B] font-mono">
            <Info className="w-4 h-4 text-[#0284C7]" />
            <span>Feed 3 to 5 sample log lines from an unparsed vendor firewall or syslog daemon.</span>
          </div>

          <button
            type="button"
            onClick={handleLoadPreset}
            className="text-[0.75rem] font-mono px-3 py-1 rounded bg-white text-[#0284C7] hover:text-[#0369A1] border border-[#CBD5E1] hover:bg-slate-50 transition-colors font-medium self-start sm:self-auto shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Load Juniper SRX Samples</span>
          </button>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handlePreview} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vendor Slug */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-mono font-semibold text-[#1E293B] flex items-center justify-between">
                <span>Vendor Slug (Identifier) *</span>
                <span className="text-[0.6875rem] text-[#64748B]">e.g. juniper_srx</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. juniper_srx"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[0.8125rem] text-[#1E293B] font-mono placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
              />
            </div>

            {/* Device Model */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-mono font-semibold text-[#1E293B] flex items-center justify-between">
                <span>Device Model / Series</span>
                <span className="text-[0.6875rem] text-[#64748B]">e.g. SRX 340 / JunOS</span>
              </label>
              <input
                type="text"
                placeholder="e.g. srx-340"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[0.8125rem] text-[#1E293B] font-mono placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
              />
            </div>
          </div>

          {/* Sample Lines Textarea */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[0.75rem] font-mono font-semibold text-[#1E293B]">
                Sample Raw Log Lines (3–5 lines, 1 per line) *
              </label>
              <span
                className={`text-[0.6875rem] font-mono font-medium px-2 py-0.5 rounded border ${
                  sampleLines.length >= 3
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-amber-50 text-amber-700 border-amber-300"
                }`}
              >
                {sampleLines.length} / 3 minimum samples provided
              </span>
            </div>
            <textarea
              rows={4}
              required
              placeholder="Paste 3 to 5 sample syslog events, one per line..."
              value={samplesText}
              onChange={(e) => setSamplesText(e.target.value)}
              className="w-full p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[0.75rem] font-mono text-[#1E293B] placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] resize-y leading-relaxed"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[0.6875rem] font-mono text-[#64748B]">
              Step 1: Preview parser specification with zero disk changes.
            </span>

            <button
              type="submit"
              disabled={previewLoading || sampleLines.length < 3}
              className="px-4 py-2 rounded bg-[#1A1D20] text-white hover:bg-[#2E343A] disabled:opacity-50 text-[0.8125rem] font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              {previewLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0284C7]" />
                  <span>Synthesizing Parser...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Synthesize &amp; Preview</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[0.8125rem] flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1 Preview Result */}
        {previewResult && (
          <div className="mt-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 flex flex-col gap-4 shadow-sm animate-fade-in">
            {/* Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold bg-sky-50 text-[#0284C7] border border-sky-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7]" />
                  SYNTHESIS PREVIEW (UNPERSISTED)
                </span>
                <span className="text-[0.75rem] font-mono text-[#64748B]">
                  Vendor: <strong className="text-[#1E293B]">{previewResult.vendor}</strong> (
                  {previewResult.device_model})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[0.75rem] font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Match: {previewResult.validation_report.match_percentage}%
                </span>
                <span className="text-[0.75rem] font-mono px-2.5 py-1 rounded bg-white text-[#1E293B] border border-[#CBD5E1]">
                  Validated: {previewResult.validation_report.matched_samples} /{" "}
                  {previewResult.validation_report.total_samples} samples
                </span>
              </div>
            </div>

            {/* Generated Regex */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.75rem] font-mono font-semibold text-[#1E293B] flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-[#0284C7]" /> Synthesized Named-Capture Regex Pattern
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyRegex(previewResult.parser_definition.regex_pattern)
                  }
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.6875rem] font-mono text-[#475569] hover:text-[#1E293B] hover:bg-slate-100 border border-[#CBD5E1]"
                >
                  {copiedRegex ? (
                    <>
                      <Check className="w-3 h-3 text-[#10B981]" />
                      <span>Copied Pattern</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#64748B]" />
                      <span>Copy Pattern</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 bg-white rounded-lg border border-[#E2E8F0] font-mono text-[0.75rem] text-[#0284C7] overflow-x-auto select-all leading-relaxed whitespace-pre-wrap break-all">
                {previewResult.parser_definition.regex_pattern}
              </pre>
            </div>

            {/* Action Mappings */}
            {previewResult.parser_definition.action_mappings &&
              Object.keys(previewResult.parser_definition.action_mappings).length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[0.75rem] font-mono font-semibold text-[#1E293B] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0284C7]" /> Action Verb Mappings
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(previewResult.parser_definition.action_mappings).map(
                      ([verb, mapped]) => (
                        <div
                          key={verb}
                          className="px-2.5 py-1.5 bg-white rounded border border-[#E2E8F0] text-[0.75rem] font-mono flex items-center justify-between"
                        >
                          <span className="text-[#64748B]">{verb}</span>
                          <span className="text-[#10B981] font-semibold">→ {mapped}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Preview Message */}
            <div className="text-[0.6875rem] font-mono text-[#64748B] italic">
              {previewResult.message}
            </div>

            {/* Confirmation CTA button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E2E8F0]">
              <div className="text-[0.75rem] text-[#475569] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Ready to deploy? Explicit confirmation is required to hot-load into live engine memory and persist to disk.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={hotLoadLoading}
                className="px-4 py-2 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white text-[0.8125rem] font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <HardDrive className="w-4 h-4" />
                <span>Confirm &amp; Hot-Load to Disk</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 Hot-Loaded Result */}
        {hotLoadResult && (
          <div className="mt-2 rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 flex flex-col gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              <h3 className="text-sm font-semibold text-emerald-900">
                Parser Successfully Hot-Loaded into Active Memory &amp; Persisted
              </h3>
            </div>

            <p className="text-[0.75rem] text-emerald-800">
              {hotLoadResult.message}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1 font-mono text-[0.75rem]">
              {hotLoadResult.json_path && (
                <div className="px-2.5 py-1 rounded bg-white border border-emerald-200 text-[#1E293B] shadow-xs">
                  <span className="text-[#64748B]">JSON: </span>
                  <strong>{hotLoadResult.json_path}</strong>
                </div>
              )}
              {hotLoadResult.yaml_path && (
                <div className="px-2.5 py-1 rounded bg-white border border-emerald-200 text-[#1E293B] shadow-xs">
                  <span className="text-[#64748B]">YAML: </span>
                  <strong>{hotLoadResult.yaml_path}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-200">
                <HardDrive className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1E293B]">
                  Confirm Parser Deployment &amp; Hot-Load
                </h3>
                <p className="text-[0.75rem] text-[#64748B]">
                  Authorize writing parser pair to disk and active engine registration.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex flex-col gap-2 text-[0.75rem] font-mono text-[#334155]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Target Vendor:</span>
                <span className="font-semibold text-[#1E293B]">{vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Device Model:</span>
                <span className="font-semibold text-[#1E293B]">{deviceModel || "generic"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Persistence Target:</span>
                <span className="text-[#0284C7]">data/parsers/{vendor}.[json|yaml]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Engine Action:</span>
                <span className="text-emerald-700 font-semibold">Immediate Hot-Load (Zero Downtime)</span>
              </div>
            </div>

            <p className="text-[0.8125rem] text-[#475569]">
              Are you sure you want to persist this parser? Future incoming logs matching this vendor will be parsed using the synthesized regex definition.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded bg-white hover:bg-slate-100 border border-[#CBD5E1] text-[#475569] text-[0.8125rem] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHotLoad}
                className="px-4 py-2 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white text-[0.8125rem] font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Hot-Load</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
