"use client";

import { useState } from "react";
import { AlertItem } from "@/lib/types";
import {
  Gavel,
  ShieldAlert,
  Lock,
  FileCheck,
  AlertOctagon,
  History,
  Bot,
  User,
  Send,
  Check,
} from "lucide-react";

interface ForensicWorkspaceProps {
  selectedAlert: AlertItem | null;
}

export function ForensicWorkspace({ selectedAlert }: ForensicWorkspaceProps) {
  const [note, setNote] = useState("");
  const [notesList, setNotesList] = useState<string[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!selectedAlert) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#CBD5E1] p-8 text-center text-[#64748B] font-mono text-[0.875rem]">
        Select an incident from the queue above to open the Forensic Workspace.
      </div>
    );
  }

  const isTamper =
    selectedAlert.alert_type === "tamper_alarm" ||
    selectedAlert.title.toLowerCase().includes("tamper");

  const incidentId = isTamper
    ? `INC-TAMPER-${String(selectedAlert.block_id ?? 0).padStart(5, "0")}-09`
    : `INC-DRIFT-${String(selectedAlert.block_id ?? 1).padStart(5, "0")}-14`;

  const handleAction = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setNotesList((prev) => [note.trim(), ...prev]);
    setNote("");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#CBD5E1] p-5 flex flex-col gap-5">
      {/* Action notification toast */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono text-[0.75rem] rounded-lg flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Forensic Header & Playbook Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 bg-[#F0F3FF]/40 p-4 rounded-lg border border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFDAD6] text-[#93000A] flex items-center justify-center shrink-0">
            <Gavel className="w-5 h-5 text-[#BA1A1A]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.6875rem] px-1.5 py-0.5 rounded bg-[#BA1A1A] text-white uppercase font-semibold">
                Live Incident Workspace
              </span>
              <span className="font-mono text-[0.75rem] text-[#BA1A1A] font-semibold">
                {incidentId}
              </span>
            </div>
            <span className="text-[1.25rem] text-[#1E293B] font-semibold leading-tight">
              Incident Forensic Workspace: {selectedAlert.title}
            </span>
          </div>
        </div>

        {/* Playbook Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              handleAction("Playbook Executed: Edge Firewall Drop rule dispatched to Cisco/Fortinet cluster.")
            }
            className="px-3 py-2 rounded bg-[#1A1D20] text-white hover:bg-[#2E343A] font-mono text-[0.75rem] font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-[#FF5C5C]" />
            <span>Execute Edge Firewall Drop</span>
          </button>

          <button
            onClick={() =>
              handleAction(
                `WORM Action: Block #${selectedAlert.block_id ?? 0} quarantined in immutable storage ledger.`
              )
            }
            className="px-3 py-2 rounded bg-[#1A1D20] text-white hover:bg-[#2E343A] font-mono text-[0.75rem] font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4 text-[#5BB8FE]" />
            <span>Quarantine Sealed Parquet Block</span>
          </button>

          <button
            onClick={() =>
              handleAction("Courtroom Certificate RFC 6962 cryptographic proof generated.")
            }
            className="px-3 py-2 rounded bg-white text-[#1E293B] border border-[#CBD5E1] hover:bg-[#F0F3FF] font-mono text-[0.75rem] font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-[#10B981]" />
            <span>Generate Courtroom Certificate</span>
          </button>
        </div>
      </div>

      {/* Telemetry Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Panel: Normalized Payload & Hash Inspection (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.875rem] text-[#0284C7] font-semibold">
                {isTamper ? "Merkle Verification & Tamper Vector" : "Parser Drift & Drain3 Cluster Model"}
              </span>
            </div>
            <span
              className={`font-mono text-[0.75rem] font-medium ${
                isTamper ? "text-[#BA1A1A]" : "text-[#006398]"
              }`}
            >
              {isTamper ? "FAIL: LEAF_HASH_MISMATCH" : "DRIFT: NOVEL_TEMPLATE_CLUSTER"}
            </span>
          </div>

          <div className="bg-[#1A1D20] text-[#E7EEFF] rounded-lg p-4 font-mono text-[0.75rem] overflow-x-auto shadow-inner border border-[#313540]">
            <div className="text-[#828589] mb-2 pb-2 border-b border-[#313540] flex items-center justify-between">
              <span>OCSF Payload Schema v1.3 // Leaf Integrity Engine</span>
              <span>Offset: 0x00000000</span>
            </div>

            {isTamper ? (
              <pre className="leading-relaxed">
                <span className="text-[#5BB8FE]">&quot;block_id&quot;</span>:{" "}
                <span className="text-[#E7EEFF]">&quot;{String(selectedAlert.block_id ?? 0).padStart(5, "0")}&quot;</span>,{"\n"}
                <span className="text-[#5BB8FE]">&quot;timestamp&quot;</span>:{" "}
                <span className="text-[#E7EEFF]">&quot;{new Date(selectedAlert.timestamp).toISOString()}&quot;</span>,{"\n"}
                <span className="text-[#5BB8FE]">&quot;source_ip&quot;</span>:{" "}
                <span className="text-[#E7EEFF]">&quot;172.16.0.25&quot;</span>,{"\n"}
                <span className="text-[#5BB8FE]">&quot;merkle_verification&quot;</span>: {"{\n"}
                {"  "}<span className="text-[#5BB8FE]">&quot;hsm_expected_root&quot;</span>:{" "}
                <span className="text-[#6FFBBE]">&quot;9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08&quot;</span>,{"\n"}
                {"  "}<span className="text-[#5BB8FE]">&quot;calculated_root&quot;</span>:{"   "}
                <span className="text-[#FF5C5C] font-semibold">&quot;e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855&quot;</span>,{"\n"}
                {"  "}<span className="text-[#5BB8FE]">&quot;discrepancy_leaf&quot;</span>: {"{\n"}
                {"    "}<span className="text-[#5BB8FE]">&quot;index&quot;</span>: <span className="text-[#FF5C5C] font-bold">0</span>,{"\n"}
                {"    "}<span className="text-[#5BB8FE]">&quot;expected_hash&quot;</span>: <span className="text-[#6FFBBE]">&quot;a45f92c10b...&quot;</span>,{"\n"}
                {"    "}<span className="text-[#5BB8FE]">&quot;actual_hash&quot;</span>:   <span className="text-[#FF5C5C] font-bold">&quot;c1844bfe89... [TAMPER DETECTED]&quot;</span>,{"\n"}
                {"    "}<span className="text-[#5BB8FE]">&quot;parquet_record_ref&quot;</span>: <span className="text-[#E7EEFF]">&quot;row_offset_0_bytes_4096&quot;</span>{"\n"}
                {"  }"}{"\n"}
                {"}"},{"\n"}
                <span className="text-[#5BB8FE]">&quot;ocsf_class&quot;</span>:{" "}
                <span className="text-[#E7EEFF]">&quot;Security Finding / Merkle Integrity Violation&quot;</span>,{"\n"}
                <span className="text-[#5BB8FE]">&quot;action_taken&quot;</span>:{" "}
                <span className="text-[#E7EEFF]">&quot;DRAIN_BUFFER_HOLD&quot;</span>
              </pre>
            ) : (
              <pre className="leading-relaxed">
                <span className="text-[#5BB8FE]">&quot;block_id&quot;</span>:{" "}
                <span className="text-[#E7EEFF]">&quot;{String(selectedAlert.block_id ?? 1).padStart(5, "0")}&quot;</span>,{"\n"}
                <span className="text-[#5BB8FE]">&quot;timestamp&quot;</span>:{" "}
                <span className="text-[#E7EEFF]">&quot;{new Date(selectedAlert.timestamp).toISOString()}&quot;</span>,{"\n"}
                <span className="text-[#5BB8FE]">&quot;miner_engine&quot;</span>:{" "}
                <span className="text-[#6FFBBE]">&quot;DrainMiner v3.2&quot;</span>,{"\n"}
                <span className="text-[#5BB8FE]">&quot;cluster_id&quot;</span>: <span className="text-[#5BB8FE]">109</span>,{"\n"}
                <span className="text-[#5BB8FE]">&quot;template_discovered&quot;</span>:{" "}
                <span className="text-[#6FFBBE]">&quot;RT_FLOW: session &lt;action&gt; &lt;src_ip&gt;/&lt;src_port&gt;-&gt;&lt;dst_ip&gt;/&lt;dst_port&gt;&quot;</span>,{"\n"}
                <span className="text-[#5BB8FE]">&quot;confidence&quot;</span>: <span className="text-[#6FFBBE]">0.412</span>,{"\n"}
                <span className="text-[#5BB8FE]">&quot;action_taken&quot;</span>:{" "}
                <span className="text-[#E7EEFF]">&quot;FALLBACK_NORMALIZATION_STAGE&quot;</span>
              </pre>
            )}
          </div>

          <div
            className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isTamper
                ? "bg-[#FFDAD6]/30 border-[#FECACA] text-[#93000A]"
                : "bg-[#F0F3FF] border-[#CBD5E1] text-[#00476E]"
            }`}
          >
            <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5 text-[#BA1A1A]" />
            <div className="flex flex-col">
              <span className="text-[0.875rem] font-semibold">
                {isTamper
                  ? "Cryptographic Invalidation Alert"
                  : "Automatic Normalization Diverted"}
              </span>
              <span className="text-[0.75rem] leading-normal">
                {isTamper
                  ? "Cryptographic seal of Block #00000 broken. Parquet row offset indicates an unauthorized payload injection attempt targeting database audit trail. Automated isolation recommended immediately."
                  : "DrainMiner detected unseen template pattern. 1,418 events safely isolated into fallback cluster until parser rule approval."}
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Analyst Triage Log & Automated SOAR Audit Trail (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#0284C7]" />
              <span className="text-[0.875rem] text-[#1E293B] font-semibold">
                SOAR Automation Audit Trail
              </span>
            </div>
            <span className="font-mono text-[0.6875rem] px-2 py-0.5 rounded bg-[#F0F3FF] text-[#0284C7] font-semibold">
              PLAYBOOK #404
            </span>
          </div>

          <div className="bg-[#F8FAFC] rounded-lg p-3.5 border border-[#E2E8F0] flex flex-col gap-3">
            {/* Timeline Item 1 */}
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-[#BA1A1A] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <AlertOctagon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 font-mono text-[0.75rem]">
                  <span className="font-semibold text-[#1E293B]">14:23:09 UTC</span>
                  <span className="px-1 rounded bg-[#FFDAD6] text-[#93000A] text-[0.6875rem]">
                    SOAR Trigger
                  </span>
                </div>
                <span className="text-[0.8125rem] text-[#1E293B] font-semibold mt-0.5">
                  Leaf 0 verification failure logged
                </span>
                <span className="text-[0.75rem] text-[#64748B]">
                  Attestation engine detected hash delta during live block pipeline flush.
                </span>
              </div>
            </div>

            {/* Timeline Item 2 */}
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 font-mono text-[0.75rem]">
                  <span className="font-semibold text-[#1E293B]">14:23:11 UTC</span>
                  <span className="px-1 rounded bg-[#CCE5FF] text-[#004B73] text-[0.6875rem]">
                    Autonomous
                  </span>
                </div>
                <span className="text-[0.8125rem] text-[#1E293B] font-semibold mt-0.5">
                  Playbook #404 executed: Ingest Isolation
                </span>
                <span className="text-[0.75rem] text-[#64748B]">
                  Incoming event stream to node 172.16.0.25 shunted to forensic sandbox.
                </span>
              </div>
            </div>

            {/* Timeline Item 3 */}
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-[#1A1D20] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 font-mono text-[0.75rem]">
                  <span className="font-semibold text-[#1E293B]">14:24:18 UTC</span>
                  <span className="px-1 rounded bg-[#E2E4E8] text-[#1E293B] text-[0.6875rem]">
                    Tier 3 Analyst
                  </span>
                </div>
                <span className="text-[0.8125rem] text-[#1E293B] font-semibold mt-0.5">
                  Assigned to SecOps On-Call Lead
                </span>
                <span className="text-[0.75rem] text-[#64748B]">
                  Awaiting physical HSM token verification review for Block #{selectedAlert.block_id ?? 0}.
                </span>
              </div>
            </div>

            {/* User added notes */}
            {notesList.map((n, i) => (
              <div key={i} className="flex gap-2.5 items-start bg-white p-2 rounded border border-[#E2E8F0]">
                <div className="w-6 h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center shrink-0 text-[0.6875rem] font-bold">
                  ✓
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[0.6875rem] text-[#64748B]">
                    Analyst Note • Just now
                  </span>
                  <span className="text-[0.75rem] text-[#1E293B]">{n}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Rapid Analyst Disposition Note Form */}
          <form onSubmit={handleAddNote} className="flex flex-col gap-1 mt-1">
            <label className="font-mono text-[0.6875rem] text-[#64748B] uppercase tracking-wider">
              Analyst Triage Disposition
            </label>
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add forensic note or quarantine rationale..."
                className="flex-1 h-9 px-3 bg-[#F0F3FF] border border-[#CBD5E1] rounded text-[0.8125rem] text-[#1E293B] placeholder:text-[#64748B] focus:outline-none focus:bg-white shadow-sm"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded bg-[#1A1D20] text-white hover:bg-[#2E343A] font-mono text-[0.75rem] font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
