import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, AlertTriangle, RotateCcw } from "lucide-react";
import { DiagnosisGrid } from "@/components/app/DiagnosisGrid";
import { useCopilot } from "@/copilot/hooks/useCopilot";
import { diagnoses, triageMeta } from "@/lib/mockData";
import { FormAssistActions } from "@/components/app/FormAssistActions";

export const Route = createFileRoute("/_app/rapid")({ component: Rapid });

function Rapid() {
  const navigate = useNavigate();
  const copilot = useCopilot();
  const [unknown, setUnknown] = useState(false);
  const [sex, setSex] = useState<"M" | "F" | "Other">("M");
  const [diag, setDiag] = useState<string>();
  const [sevOverride, setSevOverride] = useState<1 | 2 | 3 | null>(null);
  const [pathwayOverride, setPathwayOverride] = useState<string | null>(null);
  const [vitals, setVitals] = useState({ bp: "", pulse: "", spo2: "", rr: "", temp: "", gcs: "" });

  const dx = diagnoses.find(d => d.id === diag);
  const autoSev = (dx?.severity ?? 1) as 1 | 2 | 3;
  const sev: 1 | 2 | 3 = sevOverride ?? autoSev;
  const sevIsOverride = sevOverride !== null && sevOverride !== autoSev;

  const autoPathway = dx?.pathway ?? "";
  const pathway = pathwayOverride ?? autoPathway;
  const pathwayIsOverride = pathwayOverride !== null && pathwayOverride !== autoPathway;
  const pathwayOptions = Array.from(new Set(diagnoses.map(d => d.pathway)));
  const vitalsComplete = Object.values(vitals).every(Boolean);
  const canSubmit = Boolean(diag) && vitalsComplete;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-navy font-medium hover:text-coral">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-xl font-bold text-navy">Rapid Emergency Admission</h1>
        <div className="w-20" />
      </div>

      <div className="rounded-xl p-3.5 mb-5 flex items-start gap-3 text-white shadow-soft" style={{ background: "var(--amber-emerg)" }}>
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Fast track mode</strong> — complete in under 60 seconds. Remaining documentation will be flagged for nurse completion.
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-soft p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-mint/30 p-3">
          <div>
            <div className="font-semibold text-navy text-sm">Smart emergency entry</div>
            <div className="text-xs text-muted-foreground">Voice fill and scan photo can populate identity, vitals, and triage notes.</div>
          </div>
          <FormAssistActions compact onVoiceFill={() => void copilot.startVoiceCapture("rapid emergency entry")} />
        </div>

        {/* Identity */}
        <div>
          <SectionLabel>1. Patient Identity</SectionLabel>
          <div className="flex flex-wrap items-end gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-navy">
              <input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} className="h-4 w-4 accent-coral" />
              Unknown
            </label>
            <Field label="First" disabled={unknown} placeholder={unknown ? "Unknown" : ""} />
            <Field label="Last" disabled={unknown} placeholder={unknown ? "Unknown" : ""} />
            <Field label="Age" type="number" />
            <Field label="UMR Number" placeholder="optional" />
            <Field label="HMIS Number" placeholder="optional" />
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Sex</label>
              <div className="flex gap-1">
                {(["M", "F", "Other"] as const).map(s => (
                  <button key={s} onClick={() => setSex(s)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium ${sex === s ? "bg-coral text-coral-foreground" : "bg-secondary/50 text-navy"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div>
          <SectionLabel>2. Mandatory Triage Vitals</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="BP" required value={vitals.bp} onChange={(v: string) => setVitals({ ...vitals, bp: v })} placeholder="120/80" />
            <Field label="Pulse" required value={vitals.pulse} onChange={(v: string) => setVitals({ ...vitals, pulse: v })} placeholder="bpm" />
            <Field label="SpO2" required value={vitals.spo2} onChange={(v: string) => setVitals({ ...vitals, spo2: v })} placeholder="%" />
            <Field label="Resp. Rate" required value={vitals.rr} onChange={(v: string) => setVitals({ ...vitals, rr: v })} placeholder="/min" />
            <Field label="Temp" required value={vitals.temp} onChange={(v: string) => setVitals({ ...vitals, temp: v })} placeholder="F" />
            <Field label="GCS" required value={vitals.gcs} onChange={(v: string) => setVitals({ ...vitals, gcs: v })} placeholder="/15" />
          </div>
          {!vitalsComplete && <div className="text-xs text-destructive mt-2">Vitals are mandatory before rapid registration can be submitted.</div>}
        </div>

        {/* Diagnosis */}
        <div>
          <SectionLabel>3. Select Primary Diagnosis</SectionLabel>
          <DiagnosisGrid value={diag} onChange={setDiag} />
        </div>

        {/* Severity */}
        <div>
          <SectionLabel>4. Severity {sevIsOverride ? "(manual override)" : "(auto-suggested)"}</SectionLabel>
          <div className="flex flex-wrap items-center gap-2">
            {([1, 2, 3] as const).map(lvl => {
              const active = sev === lvl;
              const isAuto = lvl === autoSev;
              return (
                <button key={lvl} type="button" onClick={() => setSevOverride(lvl === autoSev ? null : lvl)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-soft transition-all ${active ? "text-white -translate-y-0.5" : "bg-secondary/60 text-navy hover:bg-secondary"}`}
                  style={active ? { background: triageMeta[lvl].color } : undefined}>
                  Level {lvl === 1 ? "I" : lvl === 2 ? "II" : "III"} — {triageMeta[lvl].label}
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${active ? "bg-white/20" : "bg-white/60"}`}>
                    {isAuto ? "AUTO" : active ? "OVERRIDE" : ""}
                  </span>
                </button>
              );
            })}
            {sevIsOverride && (
              <button type="button" onClick={() => setSevOverride(null)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-coral">
                <RotateCcw className="h-3 w-3" /> Reset to auto
              </button>
            )}
          </div>
        </div>

        {/* Pathway */}
        {dx && (
          <div>
            <SectionLabel>5. Care Pathway {pathwayIsOverride ? "(manual override)" : "(auto-selected)"}</SectionLabel>
            <div className="rounded-xl border border-border p-4 bg-mint/40 space-y-2">
              <select value={pathway}
                onChange={(e) => setPathwayOverride(e.target.value === autoPathway ? null : e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-coral">
                {pathwayOptions.map(p => (
                  <option key={p} value={p}>{p}{p === autoPathway ? "  (auto)" : ""}</option>
                ))}
              </select>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {pathwayIsOverride ? `Auto suggestion was "${autoPathway}" based on ${dx.label}` : `Auto-selected based on ${dx.label}`}
                </div>
                {pathwayIsOverride && (
                  <button type="button" onClick={() => setPathwayOverride(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-coral">
                    <RotateCcw className="h-3 w-3" /> Reset to auto
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bed */}
        <div>
          <SectionLabel>6. Bed Assignment</SectionLabel>
          <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
            <option>{dx ? `${dx.ward} Ward — Bed 4 (available)` : "Select after diagnosis"}</option>
            <option>Emergency Ward — Bed 7 (available)</option>
            <option>Trauma Bay — Bed 2 (available)</option>
          </select>
        </div>

        <div>
          <button onClick={() => navigate({ to: "/patient/$id/workspace", params: { id: "p1" } })}
            disabled={!canSubmit}
            className="w-full rounded-xl py-4 text-base font-bold text-white shadow-soft-lg disabled:opacity-50"
            style={{ background: "var(--amber-emerg)" }}>
            {canSubmit ? "ADMIT AND OPEN CARE PATHWAY" : "COMPLETE DIAGNOSIS AND MANDATORY VITALS"}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Vitals, medication history and full assessment will be flagged for nurse completion
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-bold text-navy mb-3">{children}</div>;
}

function Field({ label, required, ...props }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label} {required && <span className="text-destructive">*</span>}</label>
      <input {...props}
        onChange={(e) => props.onChange?.(e.target.value)}
        className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral disabled:bg-secondary/40 disabled:text-muted-foreground" />
    </div>
  );
}
