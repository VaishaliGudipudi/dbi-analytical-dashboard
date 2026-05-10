import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { DiagnosisGrid } from "@/components/app/DiagnosisGrid";
import { diagnoses, triageMeta } from "@/lib/mockData";

export const Route = createFileRoute("/_app/rapid")({ component: Rapid });

function Rapid() {
  const navigate = useNavigate();
  const [unknown, setUnknown] = useState(false);
  const [sex, setSex] = useState<"M" | "F" | "Other">("M");
  const [diag, setDiag] = useState<string>();

  const dx = diagnoses.find(d => d.id === diag);
  const sev = dx?.severity ?? 1;

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
          <SectionLabel>2. Select Primary Diagnosis</SectionLabel>
          <DiagnosisGrid value={diag} onChange={setDiag} />
        </div>

        {/* Severity */}
        <div>
          <SectionLabel>3. Severity (auto-suggested)</SectionLabel>
          <div className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-white shadow-soft text-sm font-semibold"
            style={{ background: triageMeta[sev as 1|2|3].color }}>
            Level {sev === 1 ? "I" : sev === 2 ? "II" : "III"} — {triageMeta[sev as 1|2|3].label} (auto)
          </div>
        </div>

        {/* Pathway */}
        {dx && (
          <div>
            <SectionLabel>4. Care Pathway</SectionLabel>
            <div className="rounded-xl border border-border p-4 bg-mint/40">
              <div className="font-semibold text-navy text-sm">{dx.pathway}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Auto-selected based on {dx.label}</div>
              <button className="text-xs font-semibold text-coral mt-2">Change pathway →</button>
            </div>
          </div>
        )}

        {/* Bed */}
        <div>
          <SectionLabel>5. Bed Assignment</SectionLabel>
          <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
            <option>{dx ? `${dx.ward} Ward — Bed 4 (available)` : "Select after diagnosis"}</option>
            <option>Emergency Ward — Bed 7 (available)</option>
            <option>Trauma Bay — Bed 2 (available)</option>
          </select>
        </div>

        <div>
          <button onClick={() => navigate({ to: "/patient/$id/workspace", params: { id: "p1" } })}
            disabled={!diag}
            className="w-full rounded-xl py-4 text-base font-bold text-white shadow-soft-lg disabled:opacity-50"
            style={{ background: "var(--amber-emerg)" }}>
            ADMIT AND OPEN CARE PATHWAY
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

function Field({ label, ...props }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <input {...props} className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral disabled:bg-secondary/40 disabled:text-muted-foreground" />
    </div>
  );
}
