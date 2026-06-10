import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Camera, ChevronDown, ChevronRight, Mic, Upload, Zap } from "lucide-react";
import { useCopilot } from "@/copilot/hooks/useCopilot";

export const Route = createFileRoute("/_app/register")({ component: Register });

const panel = "warm-panel rounded-2xl shadow-soft";
const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-background/90 px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/30 disabled:bg-secondary/35 disabled:text-muted-foreground";

function Register() {
  const navigate = useNavigate();
  const copilot = useCopilot();
  const [unknown, setUnknown] = useState(false);
  const [source, setSource] = useState<"manual" | "his">("manual");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [emergOpen, setEmergOpen] = useState(false);
  const [insOpen, setInsOpen] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");

  return (
    <div className="px-5 pb-8 pt-4">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] bg-navy px-5 py-4 text-white shadow-soft-lg">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="text-2xl font-bold">Patient Registration</div>
              <div className="text-sm text-white/70">Keep the content, bring back the softer bedside flow.</div>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/rapid" })}
            className="inline-flex items-center gap-2 rounded-full bg-[#f6901e] px-5 py-3 text-sm font-semibold text-white shadow-soft"
          >
            <Zap className="h-4 w-4" />
            Switch to Rapid Emergency
          </button>
        </div>

        <div className="grid gap-5">
          <section className={`${panel} p-6`}>
            <div className="mb-5">
              <div className="rounded-2xl bg-mint/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-navy">Smart form fill</div>
                    <div className="mt-1 text-sm text-muted-foreground">Voice-assisted capture keeps the flow light without changing the data you already added.</div>
                  </div>
                  <button type="button" onClick={() => void copilot.startVoiceCapture("patient registration")} className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white shadow-soft">
                    <Mic className="h-4 w-4" />
                    Voice Fill
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl bg-background/70 p-5">
                <SectionTitle>Capture Method</SectionTitle>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Registration Source</label>
                <select value={source} onChange={(e) => setSource(e.target.value as "manual" | "his")} className={inputClass}>
                  <option value="manual">Manual Entry</option>
                  <option value="his">Import from HIS</option>
                </select>
              </div>

              <div className="rounded-2xl border border-dashed border-border bg-cream/40 p-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-coral/15">
                    <Camera className="h-5 w-5 text-coral" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-navy">Scan ID Card</div>
                    <div className="mt-1 text-sm text-muted-foreground">Take a photo or upload an ID to extract fields automatically.</div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white">
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-navy">
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                  <input
                    ref={(el) => (fileInputRef.current = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) console.log("file chosen", file.name);
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-background/70 p-5">
                <SectionTitle>Personal Information</SectionTitle>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Check-in Date & Time" defaultValue={new Date().toLocaleString()} />
                  <div />
                  <Field label="First Name" value={first} onChange={setFirst} disabled={unknown} />
                  <Field label="Last Name" value={last} onChange={setLast} disabled={unknown} />
                  <Field label="UMR" required placeholder="UMR-2020" />
                  <Field label="ABHA ID" placeholder="optional" />
                  <Field label="Date of Birth" type="date" />
                  <Field label="Age" placeholder="auto" />
                  <div>
                    <label className="text-sm font-semibold text-navy">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value as "Male" | "Female" | "Other")} className={inputClass}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <Field label="Phone" placeholder="+91" />
                  <Field label="Address" className="md:col-span-2" />
                </div>
              </div>

              <Collapsible title="Emergency Contact" open={emergOpen} onToggle={() => setEmergOpen((value) => !value)}>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Name" />
                  <Field label="Relationship" />
                  <Field label="Phone" />
                </div>
              </Collapsible>

              <Collapsible title="Insurance" open={insOpen} onToggle={() => setInsOpen((value) => !value)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Provider" />
                  <Field label="Policy Number" />
                </div>
              </Collapsible>

              <button
                onClick={() => navigate({ to: "/patient/$id/workspace", params: { id: "p1" } })}
                className="w-full rounded-full bg-navy px-5 py-4 text-base font-semibold text-white shadow-soft-lg hover:opacity-95"
              >
                Proceed to Triage
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-lg font-bold text-navy">{children}</h2>;
}

function Field({ label, required, className = "", ...props }: any) {
  return (
    <div className={className}>
      <label className="text-sm font-semibold text-navy">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </label>
      <input
        {...props}
        className={inputClass}
        onChange={(e) => props.onChange?.(e.target.value)}
        value={props.value ?? props.defaultValue ?? undefined}
      />
    </div>
  );
}

function Collapsible({ title, open, onToggle, children }: any) {
  return (
    <div className={`${panel} overflow-hidden p-0`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="text-lg font-bold text-navy">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open ? <div className="border-t border-border/70 px-5 pb-5">{children}</div> : null}
    </div>
  );
}

