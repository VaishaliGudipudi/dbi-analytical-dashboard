import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, Mic, Calculator, ClipboardList, Activity, Plus,
  ChevronDown, ChevronRight, CheckCircle2, Circle, AlertCircle,
  Sparkles, Beaker, HeartPulse, Phone, Save, Send, Clock, Command,
} from "lucide-react";
import { patients, diagnoses, triageMeta, wards } from "@/lib/mockData";
import { DiagnosisGrid } from "@/components/app/DiagnosisGrid";
import { TriageBadge } from "@/components/app/TriageBadge";

export const Route = createFileRoute("/_app/patient/$id/workspace")({ component: Workspace });

function Workspace() {
  const { id } = Route.useParams();
  const patient = patients.find(p => p.id === id) ?? patients[0];

  const [mode, setMode] = useState<"standard" | "rapid">("standard");
  const [diag, setDiag] = useState<string>();
  const [voiceOn, setVoiceOn] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [elapsed, setElapsed] = useState(42);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // command bar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault(); setCmdOpen(true);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60), ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const dx = diagnoses.find(d => d.id === diag);
  const sev = (dx?.severity ?? patient.triage) as 1 | 2 | 3;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Sticky context bar */}
      <div className="sticky top-14 z-30 px-5 py-3 text-navy-foreground shadow-soft" style={{ background: "var(--navy)" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-base">{patient.name}</span>
              <span className="opacity-60">|</span>
              <span><span className="opacity-70">UMR:</span> {patient.umr}</span>
              <span className="opacity-60">|</span>
              <span className="inline-flex items-center gap-2">
                <span className="opacity-70">Triage:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: triageMeta[sev].color }}>
                  Level {sev === 1 ? "I" : sev === 2 ? "II" : "III"}
                </span>
              </span>
              <span className="opacity-60">|</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Arrival: {fmtTime(elapsed)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ToolBtn icon={<Calculator className="h-4 w-4" />}>Scoring Tools</ToolBtn>
            <ToolBtn icon={<ClipboardList className="h-4 w-4" />}>Nurse Assessment</ToolBtn>
            <ToolBtn icon={<HeartPulse className="h-4 w-4" />}>Add Vitals</ToolBtn>
            <ToolBtn icon={<Plus className="h-4 w-4" />}>Add Orders</ToolBtn>
            <button onClick={() => setVoiceOn(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-coral text-coral-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-95">
              <Mic className="h-4 w-4" /> Voice Fill
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[260px_1fr_320px] gap-5 p-5 flex-1 min-h-0">
        {/* LEFT — care pathway */}
        <aside className="bg-card rounded-2xl shadow-soft p-4 h-fit sticky top-32">
          <h3 className="font-bold text-navy text-sm mb-3">Care Pathway</h3>
          <ol className="space-y-2.5">
            {[
              { label: "Patient Registration", state: "done" as const },
              { label: "Arrival and Triage", state: "active" as const },
              { label: "Care Pathway", state: "pending" as const },
              { label: "Bed Assignment", state: "pending" as const },
              { label: "Orders", state: "pending" as const },
              { label: "Discharge", state: "pending" as const },
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                {s.state === "done" ? <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--urgent-safe)" }} />
                  : s.state === "active" ? <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "var(--urgent-urgent)" }} />
                  : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
                <span className={s.state === "done" ? "text-navy" : s.state === "active" ? "font-semibold text-navy" : "text-muted-foreground"}>
                  {s.label}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-5 pt-4 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Nurse Pending Items</div>
            <div className="space-y-1.5">
              <div className="text-xs rounded-md px-2 py-1.5" style={{ background: "color-mix(in oklab, var(--urgent-pending) 15%, white)", color: "var(--navy)" }}>
                ⚠ Medication History
              </div>
              <div className="text-xs rounded-md px-2 py-1.5" style={{ background: "color-mix(in oklab, var(--urgent-pending) 15%, white)", color: "var(--navy)" }}>
                ⚠ Full Clinical Assessment
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER */}
        <section className="space-y-4 min-w-0">
          {/* Mode toggle */}
          <div className="bg-card rounded-2xl shadow-soft p-1.5 flex gap-1.5">
            {(["standard", "rapid"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${
                  mode === m
                    ? m === "rapid"
                      ? "text-white shadow-soft"
                      : "bg-navy text-navy-foreground shadow-soft"
                    : "text-muted-foreground hover:text-navy"
                }`}
                style={mode === m && m === "rapid" ? { background: "var(--amber-emerg)" } : undefined}>
                {m === "standard" ? "Standard Mode" : "Rapid Emergency Mode"}
              </button>
            ))}
          </div>

          {mode === "rapid" ? (
            <RapidPanel diag={diag} setDiag={setDiag} />
          ) : (
            <StandardPanel diag={diag} setDiag={setDiag} />
          )}

          {/* Bottom action bar */}
          <div className="sticky bottom-0 bg-card rounded-2xl shadow-soft-lg p-3 flex items-center justify-between border border-border">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-navy hover:bg-secondary/40">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy text-navy-foreground text-sm font-semibold shadow-soft">
              <Send className="h-4 w-4" /> Complete and Submit
            </button>
          </div>
        </section>

        {/* RIGHT */}
        {voiceOn ? <VoicePanel onClose={() => setVoiceOn(false)} /> : <RightPanel diag={dx} elapsed={elapsed} />}
      </div>

      {cmdOpen && <CommandBar onClose={() => setCmdOpen(false)} setMode={setMode} setDiag={setDiag} />}
    </div>
  );
}

function ToolBtn({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium">
      {icon}{children}
    </button>
  );
}

function RapidPanel({ diag, setDiag }: { diag?: string; setDiag: (s: string) => void }) {
  const dx = diagnoses.find(d => d.id === diag);
  return (
    <div className="bg-card rounded-2xl shadow-soft p-5 space-y-5">
      <div className="rounded-xl p-3 text-white text-sm" style={{ background: "var(--amber-emerg)" }}>
        Fast track mode — fields will be flagged for nurse completion.
      </div>
      <DiagnosisGrid value={diag} onChange={setDiag} />
      {dx && (
        <div className="rounded-xl border border-border bg-mint/40 p-4">
          <div className="font-semibold text-navy text-sm">{dx.pathway}</div>
          <div className="text-xs text-muted-foreground">Auto-selected based on {dx.label}</div>
        </div>
      )}
      <button className="w-full rounded-xl py-4 font-bold text-white shadow-soft-lg" style={{ background: "var(--amber-emerg)" }}>
        ADMIT AND OPEN CARE PATHWAY
      </button>
    </div>
  );
}

function StandardPanel({ diag, setDiag }: { diag?: string; setDiag: (s: string) => void }) {
  const dx = diagnoses.find(d => d.id === diag);
  const cardiacOrResp = dx?.id === "stemi" || dx?.id === "resp";
  const expandMeds = ["stemi", "poison", "anaph"].includes(dx?.id ?? "");
  const [mlc, setMlc] = useState<"yes" | "no" | null>(null);
  const [arrival, setArrival] = useState<string>();
  const sev = (dx?.severity ?? 0) as 0 | 1 | 2 | 3;

  return (
    <div className="space-y-3">
      <Section title="1. Patient Details" defaultOpen>
        <div className="grid grid-cols-4 gap-3">
          <Field label="Name" defaultValue="Rajesh Kumar" />
          <Field label="Age" defaultValue="54" />
          <div>
            <Label>Sex</Label>
            <div className="flex gap-1 mt-1">{["M","F","Other"].map(s => <Chip key={s} active={s==="M"}>{s}</Chip>)}</div>
          </div>
          <Field label="UMR" defaultValue="UMR-2014" />
        </div>
      </Section>

      <Section title="2. Chief Complaint / Primary Diagnosis" defaultOpen>
        <DiagnosisGrid value={diag} onChange={setDiag} />
        <textarea placeholder="Describe presenting complaint…" rows={2}
          className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral" />
      </Section>

      <Section title="3. Arrival Details" defaultOpen={!!dx}>
        <Label>Mode of Arrival</Label>
        <div className="flex gap-2 flex-wrap mt-1 mb-3">
          {["Ambulance", "Walk In", "Referral"].map(a => (
            <Chip key={a} active={arrival === a} onClick={() => setArrival(a)}>{a}</Chip>
          ))}
        </div>
        <Label>Informed By</Label>
        <div className="flex gap-2 flex-wrap mt-1 mb-3">
          {["Self","Police","Attendant","Paramedic","Bystander","Family Member","Employer"].map(a => <Chip key={a}>{a}</Chip>)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Return within 72 hours</Label><div className="flex gap-2 mt-1"><Chip>Yes</Chip><Chip active>No</Chip></div></div>
          <div><Label>MLC Case</Label><div className="flex gap-2 mt-1">
            <Chip active={mlc==="yes"} onClick={() => setMlc("yes")}>Yes</Chip>
            <Chip active={mlc==="no"} onClick={() => setMlc("no")}>No</Chip>
          </div></div>
        </div>
      </Section>

      <Section title="4. Triage Severity" defaultOpen={!!dx}>
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,0].map(l => {
            const m = triageMeta[l];
            const active = sev === l;
            return (
              <button key={l}
                className="rounded-xl px-4 py-3 text-left font-semibold text-sm shadow-soft transition-transform hover:-translate-y-0.5"
                style={{ background: active ? m.color : "white", color: active ? "white" : "var(--navy)", border: active ? "none" : "1px solid var(--border)" }}>
                {l === 0 ? "Not Triaged" : `Level ${l===1?"I":l===2?"II":"III"} — ${m.label}`}
              </button>
            );
          })}
        </div>
        {dx && <p className="text-xs text-muted-foreground mt-2">Auto-suggested based on chief complaint. Click to confirm.</p>}
      </Section>

      <Section title="5. Vitals" defaultOpen={cardiacOrResp}>
        <div className="grid grid-cols-3 gap-3">
          {["BP","Pulse","Temperature","SpO₂","Respiratory Rate","GCS"].map(v => <Field key={v} label={v} />)}
        </div>
      </Section>

      <Section title="6. Medication History" defaultOpen={expandMeds}>
        <Field label="Current medications" />
        <div className="mt-2"><Label>Allergies</Label>
          <input className="mt-1 w-full rounded-lg border border-destructive bg-destructive/5 text-destructive px-3 py-2 text-sm" placeholder="None reported" /></div>
        <Field label="Previous conditions" />
      </Section>

      <Section title="7. Medico Legal Case Details" defaultOpen={mlc === "yes"}>
        <div className="grid grid-cols-3 gap-3">
          <Field label="MLC Number" /><Field label="Police Station" /><Field label="Officer" />
        </div>
      </Section>

      <Section title="8. Clinical Assessment" defaultOpen={false}>
        <div className="text-xs text-muted-foreground mb-2">Pre-checked symptoms based on diagnosis:</div>
        <div className="grid grid-cols-2 gap-1.5">
          {["Chest pain","Shortness of breath","Diaphoresis","Nausea"].map(s => (
            <label key={s} className="inline-flex items-center gap-2 text-sm text-navy">
              <input type="checkbox" defaultChecked={dx?.id === "stemi"} className="h-4 w-4 accent-coral" />{s}
            </label>
          ))}
        </div>
        <textarea rows={3} placeholder="Free text assessment…" className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      </Section>

      <Section title="9. Care Pathway" defaultOpen>
        {dx ? (
          <div className="rounded-xl bg-mint/40 border border-border p-4">
            <div className="font-semibold text-navy">{dx.pathway}</div>
            <div className="text-xs text-muted-foreground">Auto-selected based on {dx.label}</div>
            <button className="text-xs font-semibold text-coral mt-2">Change Pathway →</button>
          </div>
        ) : <div className="text-sm text-muted-foreground">Select a chief complaint to auto-assign a care pathway.</div>}
      </Section>

      <Section title="10. Bed Assignment" defaultOpen>
        <Label>Ward</Label>
        <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          {wards.map(w => <option key={w.name}>{w.name} ({w.total - w.occupied} available)</option>)}
        </select>
        <button className="mt-3 rounded-lg bg-coral text-coral-foreground text-sm font-semibold px-4 py-2 shadow-soft">Assign Bed</button>
      </Section>
    </div>
  );
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  useEffect(() => { setOpen(!!defaultOpen); }, [defaultOpen]);
  return (
    <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30">
        <span className="font-bold text-navy text-sm">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>;
}
function Field({ label, ...props }: any) {
  return (
    <div>
      <Label>{label}</Label>
      <input {...props} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral" />
    </div>
  );
}
function Chip({ active, children, onClick }: any) {
  return (
    <button onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${active ? "bg-coral text-coral-foreground shadow-soft" : "bg-secondary/50 text-navy hover:bg-secondary"}`}>
      {children}
    </button>
  );
}

function RightPanel({ diag, elapsed }: { diag?: any; elapsed: number }) {
  const fmt = (s: number) => `${Math.floor(s/60)}m ${s%60}s`;
  const aiSuggestions: Record<string, string[]> = {
    snake: ["Consider antivenom within 2 hours", "Monitor coagulation profile", "Check for neurotoxic symptoms"],
    stemi: ["ECG within 10 minutes", "Aspirin 325mg loading", "Activate cath lab"],
    stroke: ["Door-to-CT < 25 min", "Check NIHSS score", "Confirm last known well time"],
    trauma: ["Primary survey ABCDE", "Activate trauma team", "FAST scan if unstable"],
    poison: ["Identify substance", "Consider activated charcoal", "Call poison control"],
    anaph: ["Epinephrine IM 0.5mg", "Airway assessment", "IV fluids"],
    sepsis: ["Lactate within 1 hour", "Blood cultures x2", "Broad-spectrum antibiotics"],
    resp: ["SpO₂ continuous", "Consider NIV", "ABG"],
    other: ["Complete primary assessment"],
  };
  return (
    <aside className="space-y-3 sticky top-32 h-fit">
      <Card title="Vitals" icon={<HeartPulse className="h-4 w-4" />}>
        <div className="text-sm text-muted-foreground">No vitals recorded</div>
        <button className="mt-2 text-xs font-semibold text-coral">+ Record vitals</button>
      </Card>
      <Card title="Alerts" tone="critical" icon={<AlertCircle className="h-4 w-4" />}>
        <div className="text-sm" style={{ color: "var(--urgent-critical)" }}>⚠ Allergy: Penicillin</div>
      </Card>
      <Card title="Timers" icon={<Clock className="h-4 w-4" />}>
        <Row label="Since arrival" value={fmt(elapsed)} />
        <Row label="Since triage" value={fmt(Math.max(0, elapsed - 12))} />
        <Row label="Last assessment" value="—" />
      </Card>
      <Card title="AI Suggestions" icon={<Sparkles className="h-4 w-4" />} tone="accent">
        {diag ? (
          <>
            <div className="text-xs font-semibold text-navy mb-1.5">{diag.label} detected:</div>
            <ul className="space-y-1 text-sm text-navy">
              {aiSuggestions[diag.id]?.map(s => <li key={s} className="flex gap-1.5"><span className="text-coral">•</span>{s}</li>)}
            </ul>
          </>
        ) : <div className="text-sm text-muted-foreground">Select a diagnosis to see AI guidance.</div>}
      </Card>
      <Card title="Quick Orders" icon={<Beaker className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-2">
          {["Order CBC","Order ECG","Call Radiology","Call Specialist"].map(o => (
            <button key={o} className="text-xs font-semibold rounded-lg border border-border px-2 py-2 hover:bg-secondary/40 text-navy">{o}</button>
          ))}
        </div>
      </Card>
    </aside>
  );
}

function Card({ title, children, icon, tone }: any) {
  const ring = tone === "critical" ? "ring-1 ring-destructive/30" : "";
  const bg = tone === "accent" ? "bg-cream/40" : "bg-card";
  return (
    <div className={`${bg} ${ring} rounded-2xl shadow-soft p-4`}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-coral">{icon}</span>
        <h4 className="font-bold text-navy text-sm">{title}</h4>
      </div>
      {children}
    </div>
  );
}
function Row({ label, value }: any) {
  return <div className="flex justify-between py-1 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-navy tabular-nums">{value}</span></div>;
}

function VoicePanel({ onClose }: { onClose: () => void }) {
  return (
    <aside className="bg-card rounded-2xl shadow-soft-lg p-4 sticky top-32 h-fit">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
          </span>
          <h4 className="font-bold text-navy text-sm">Listening…</h4>
        </div>
        <span className="text-xs font-semibold text-coral">Fields detected: 4</span>
      </div>
      <div className="rounded-xl bg-secondary/40 p-3 text-sm text-navy h-48 overflow-auto leading-relaxed">
        "Patient is a fifty-four year old male, presenting with crushing chest pain for the last forty-five minutes…"
        <span className="text-muted-foreground"> diaphoretic, BP one-fifty over ninety, pulse one-twelve…</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onClose} className="flex-1 rounded-lg border border-border text-sm py-2 font-medium text-navy">Cancel</button>
        <button onClick={onClose} className="flex-1 rounded-lg bg-coral text-coral-foreground text-sm font-semibold py-2">Review and Confirm</button>
      </div>
    </aside>
  );
}

function CommandBar({ onClose, setMode, setDiag }: any) {
  const [q, setQ] = useState("");
  const all = useMemo(() => [
    { id: "snake", label: "/snake — Set chief complaint to Snake Bite", run: () => setDiag("snake") },
    { id: "cardiac", label: "/cardiac — Set chief complaint to Cardiac/STEMI", run: () => setDiag("stemi") },
    { id: "stroke", label: "/stroke — Activate stroke protocol", run: () => setDiag("stroke") },
    { id: "trauma", label: "/trauma — Set complaint to Trauma", run: () => setDiag("trauma") },
    { id: "rapid", label: "/rapid — Switch to Rapid Emergency Mode", run: () => setMode("rapid") },
    { id: "standard", label: "/standard — Switch to Standard Mode", run: () => setMode("standard") },
    { id: "cbc", label: "/order CBC — Add CBC order", run: () => {} },
    { id: "ecg", label: "/order ECG — Add ECG order", run: () => {} },
    { id: "vitals", label: "/vitals — Jump to vitals section", run: () => {} },
    { id: "save", label: "/save — Save current draft", run: () => {} },
  ], [setDiag, setMode]);
  const filtered = all.filter(c => c.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 bg-navy/30 backdrop-blur-sm flex items-start justify-center pt-32" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-card rounded-2xl shadow-soft-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Command className="h-4 w-4 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a command…"
            className="flex-1 bg-transparent text-sm outline-none text-navy" />
          <kbd className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {filtered.length === 0 && <div className="px-3 py-8 text-center text-sm text-muted-foreground">No matches</div>}
          {filtered.map(c => (
            <button key={c.id} onClick={() => { c.run(); onClose(); }}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-secondary/50 text-sm text-navy">
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
