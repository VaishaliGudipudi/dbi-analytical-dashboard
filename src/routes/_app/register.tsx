import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Camera, Upload, ChevronDown, ChevronRight, Mic, Zap } from "lucide-react";

export const Route = createFileRoute("/_app/register")({ component: Register });

function Register() {
  const navigate = useNavigate();
  const [unknown, setUnknown] = useState(false);
  const [source, setSource] = useState<"manual" | "his">("manual");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [emergOpen, setEmergOpen] = useState(false);
  const [insOpen, setInsOpen] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-navy font-medium hover:text-coral">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-xl font-bold text-navy">New Patient Registration</h1>
        <button onClick={() => navigate({ to: "/rapid" })} className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: "var(--amber-emerg)" }}>
          <Zap className="h-4 w-4" /> Critical case? Switch to Rapid Emergency →
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-soft p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-mint/30 p-3">
          <div>
            <div className="font-semibold text-navy text-sm">Smart form fill</div>
            <div className="text-xs text-muted-foreground">Use voice to populate registration fields.</div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-coral text-coral-foreground px-2.5 py-1.5 text-xs font-semibold shadow-soft hover:opacity-95"
          >
            <Mic className="h-4 w-4" /> Voice Fill
          </button>
        </div>

        {/* Unknown toggle */}
        <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
          <div>
            <div className="font-semibold text-navy text-sm">Unknown Patient</div>
            <div className="text-xs text-muted-foreground">Auto-fills name fields when patient identity is unavailable</div>
          </div>
          <Toggle checked={unknown} onChange={(v) => { setUnknown(v); if (v) { setFirst("Unknown"); setLast("Unknown"); } }} />
        </div>

        {/* Source */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Registration Source</label>
          <div className="flex gap-2 mt-2">
            {(["manual", "his"] as const).map(s => (
              <button key={s} onClick={() => setSource(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${source === s ? "bg-navy text-navy-foreground" : "bg-secondary/40 text-navy hover:bg-secondary"}`}>
                {s === "manual" ? "Manual Entry" : "Import from HIS"}
              </button>
            ))}
          </div>
        </div>

        {/* Scan ID */}
        <div className="rounded-xl border border-dashed border-border p-4 bg-cream/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-coral/15 grid place-items-center">
              <Camera className="h-5 w-5 text-coral" />
            </div>
            <div>
              <div className="font-semibold text-navy text-sm">Scan ID Card</div>
              <div className="text-xs text-muted-foreground">Take a photo or upload to extract fields automatically</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-navy text-navy-foreground text-sm font-medium py-2"><Camera className="h-4 w-4" /> Take Photo</button>
            <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border text-navy text-sm font-medium py-2"><Upload className="h-4 w-4" /> Upload</button>
          </div>
        </div>

        <Field label="Check-in Date & Time" defaultValue={new Date().toLocaleString()} />

        <SectionTitle>Personal Information</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" value={first} onChange={setFirst} disabled={unknown} />
          <Field label="Last Name" value={last} onChange={setLast} disabled={unknown} />
          <Field label="UMR" required placeholder="UMR-2020" />
          <Field label="ABHA ID" placeholder="optional" />
          <Field label="Date of Birth" type="date" />
          <Field label="Age" placeholder="auto" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Gender</label>
          <div className="flex gap-2 mt-2">
            {(["Male", "Female", "Other"] as const).map(g => (
              <button key={g} onClick={() => setGender(g)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${gender === g ? "bg-coral text-coral-foreground shadow-soft" : "bg-secondary/40 text-navy hover:bg-secondary"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" placeholder="+91" />
          <Field label="Address" />
        </div>

        <Collapsible title="Emergency Contact" open={emergOpen} onToggle={() => setEmergOpen(o => !o)}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Name" /><Field label="Relationship" /><Field label="Phone" />
          </div>
        </Collapsible>

        <Collapsible title="Insurance" open={insOpen} onToggle={() => setInsOpen(o => !o)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Provider" /><Field label="Policy Number" />
          </div>
        </Collapsible>

        <button onClick={() => navigate({ to: "/patient/$id/workspace", params: { id: "p1" } })}
          className="w-full rounded-xl bg-navy text-navy-foreground py-3.5 font-semibold shadow-soft hover:opacity-95">
          Proceed to Triage
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-coral" : "bg-border"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-navy text-base pt-2 border-t border-border">{children}</h3>;
}

function Field({ label, required, ...props }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input {...props}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral disabled:bg-secondary/40 disabled:text-muted-foreground"
        onChange={(e) => props.onChange?.(e.target.value)} value={props.value ?? props.defaultValue ?? undefined} />
    </div>
  );
}

function Collapsible({ title, open, onToggle, children }: any) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30">
        <span className="font-semibold text-navy text-sm">{title}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <div className="p-4 border-t border-border">{children}</div>}
    </div>
  );
}
