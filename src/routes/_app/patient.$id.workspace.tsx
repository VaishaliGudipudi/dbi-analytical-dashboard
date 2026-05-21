import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Calculator, ClipboardList, HeartPulse, Plus, CheckCircle2,
  Activity, AlertCircle, FileText, X, Printer, Send, RotateCcw,
} from "lucide-react";
import { patients, diagnoses, triageMeta } from "@/lib/mockData";
import { AddOrdersModal } from "@/components/app/AddOrdersModal";
import { ScoringToolsModal } from "@/components/app/ScoringToolsModal";
import { AddVitalsModal } from "@/components/app/AddVitalsModal";

export const Route = createFileRoute("/_app/patient/$id/workspace")({ component: Workspace });

type StepId = "arrival" | "triage" | "medhist" | "clinical";

const STEPS: { id: StepId; label: string; Icon: any }[] = [
  { id: "arrival",  label: "ER Arrival",          Icon: ClipboardList },
  { id: "triage",   label: "Triage Details",      Icon: HeartPulse },
  { id: "medhist",  label: "Medication History",  Icon: FileText },
  { id: "clinical", label: "Clinical Assessment", Icon: Activity },
];

const CARE_PATHWAYS = [
  "General","Chest Pain","Stroke","Sepsis","Shortness of Breath",
  "Poisoning","Polytrauma","Snakebite","Pneumonia",
];

function Workspace() {
  const { id } = Route.useParams();
  const patient = patients.find(p => p.id === id) ?? patients[0];

  const [step, setStep] = useState<StepId>("arrival");
  const [done, setDone] = useState<Record<StepId, boolean>>({ arrival: true, triage: false, medhist: true, clinical: false });
  const [showOrders, setShowOrders] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [showVitals, setShowVitals] = useState(false);

  // Triage state for auto-suggestion
  const [chiefComplaint, setChiefComplaint] = useState<string>("");
  const [vitals, setVitals] = useState({ sbp: "120", dbp: "60", hr: "90", rr: "90", spo2: "90", temp: "98", grbs: "90" });
  const [pathwayOverride, setPathwayOverride] = useState<string | null>(null);

  // Auto-pathway logic from chief complaint
  const autoPathway = useMemo(() => {
    const cc = chiefComplaint.toLowerCase();
    if (cc.includes("chest")) return "Chest Pain";
    if (cc.includes("stroke") || cc.includes("facial droop") || cc.includes("weakness")) return "Stroke";
    if (cc.includes("fever") || cc.includes("sepsis")) return "Sepsis";
    if (cc.includes("breath") || cc.includes("dyspnea")) return "Shortness of Breath";
    if (cc.includes("trauma") || cc.includes("accident")) return "Polytrauma";
    if (cc.includes("snake")) return "Snakebite";
    if (cc.includes("poison")) return "Poisoning";
    if (cc.includes("pneumonia") || cc.includes("cough")) return "Pneumonia";
    return "General";
  }, [chiefComplaint]);
  const pathway = pathwayOverride ?? autoPathway;
  const isOverride = pathwayOverride !== null && pathwayOverride !== autoPathway;

  const goNext = () => {
    setDone({ ...done, [step]: true });
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Sticky context bar */}
      <div className="sticky top-0 z-30 px-5 py-3 text-navy-foreground shadow-soft" style={{ background: "var(--navy)" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/10"><ArrowLeft className="h-4 w-4"/></Link>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-base">{patient.name}</span>
              <span className="opacity-60">|</span>
              <span><span className="opacity-70">UMR:</span> {patient.umr}</span>
              <span className="opacity-60">|</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="opacity-70">Triage:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: triageMeta[patient.triage].color }}>
                  {patient.triage === 0 ? "Pending" : `Level ${patient.triage===1?"I":patient.triage===2?"II":"III"}`}
                </span>
              </span>
              <span className="opacity-60">|</span>
              <span className="opacity-70">Pathway:</span> <span className="font-semibold">{pathway}</span>
              {isOverride && <span className="text-[10px] px-1.5 py-0.5 rounded bg-coral text-coral-foreground font-bold uppercase">Override</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ToolBtn onClick={() => setShowScoring(true)} icon={<Calculator className="h-4 w-4"/>}>Scoring Tools</ToolBtn>
            <ToolBtn onClick={() => setShowVitals(true)} icon={<HeartPulse className="h-4 w-4"/>}>Add Vitals</ToolBtn>
            <ToolBtn onClick={() => setShowOrders(true)} icon={<Plus className="h-4 w-4"/>}>Add Orders</ToolBtn>
          </div>
        </div>
      </div>

      {/* TAB STRIP — top to bottom workflow (matches ICMR guideline order) */}
      <div className="px-5 pt-5">
        <div className="grid grid-cols-4 gap-2 bg-card rounded-2xl shadow-soft p-1.5">
          {STEPS.map(s => {
            const active = step === s.id;
            const isDone = done[s.id];
            return (
              <button key={s.id} onClick={() => setStep(s.id)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${active ? "bg-navy text-navy-foreground shadow-soft" : "text-navy hover:bg-secondary/40"}`}>
                <s.Icon className="h-4 w-4"/>
                <span>{s.label}</span>
                {isDone ? <CheckCircle2 className="h-4 w-4 text-amber-emerg" style={{color: active?"#fff":"var(--urgent-safe)"}}/>
                  : <AlertCircle className="h-4 w-4" style={{color:"var(--urgent-pending)"}}/>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {step === "arrival" && <ArrivalForm/>}
        {step === "triage" && <TriageForm vitals={vitals} setVitals={setVitals}/>}
        {step === "medhist" && <MedHistoryForm/>}
        {step === "clinical" && (
          <ClinicalForm
            chiefComplaint={chiefComplaint} setChiefComplaint={setChiefComplaint}
            pathway={pathway} autoPathway={autoPathway} setPathwayOverride={setPathwayOverride} isOverride={isOverride}
          />
        )}

        <div className="sticky bottom-0 bg-card rounded-2xl shadow-soft-lg p-3 flex items-center justify-between border border-border">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-navy hover:bg-secondary/40">
            <Printer className="h-4 w-4"/> Print Consent
          </button>
          <button onClick={goNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy text-navy-foreground text-sm font-semibold shadow-soft">
            {step === "clinical" ? <><Send className="h-4 w-4"/> Submit</> : "Next →"}
          </button>
        </div>
      </div>

      {showOrders && <AddOrdersModal pathway={pathway} onClose={() => setShowOrders(false)}/>}
      {showScoring && <ScoringToolsModal pathway={pathway} onClose={() => setShowScoring(false)}/>}
      {showVitals && <AddVitalsModal onClose={() => setShowVitals(false)}/>}
    </div>
  );
}

function ToolBtn({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium">
      {icon}{children}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl shadow-soft p-5">
      <h3 className="font-bold text-navy text-base mb-4">{title}</h3>
      {children}
    </div>
  );
}
function L({ label, req, children }: any) {
  return (
    <div>
      <label className="text-xs font-semibold text-navy block mb-1">{label} {req && <span className="text-destructive">*</span>}</label>
      {children}
    </div>
  );
}
const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral";

function ArrivalForm() {
  return (
    <Card title="ER Arrival">
      <div className="grid grid-cols-3 gap-4">
        <L label="Mode of Arrival" req><select className={inp}><option>Walk In</option><option>Ambulance</option><option>Referral</option></select></L>
        <L label="Informed By" req><select className={inp}><option>Self</option><option>Family</option><option>Police</option><option>Paramedic</option></select></L>
        <L label="Arrival Time" req><input type="time" className={inp} defaultValue="10:42"/></L>
        <L label="MLC Case"><select className={inp}><option>No</option><option>Yes</option></select></L>
        <L label="Return within 72h"><select className={inp}><option>No</option><option>Yes</option></select></L>
        <L label="Brought By"><input className={inp} placeholder="Name / Contact"/></L>
      </div>
    </Card>
  );
}

function TriageForm({ vitals, setVitals }: any) {
  const [cond, setCond] = useState("Alert");
  const [score, setScore] = useState(0);
  return (
    <>
      <Card title="Scan Vitals">
        <div className="grid grid-cols-2 gap-3">
          <button className="rounded-md border border-border text-navy py-2.5 text-sm font-semibold hover:bg-secondary/40">📷 Take Photo</button>
          <button className="rounded-md border border-border text-navy py-2.5 text-sm font-semibold hover:bg-secondary/40">⬆ Upload</button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 bg-secondary/30 rounded-md px-3 py-2">Point camera at the monitor or upload an image to auto-extract vital signs.</p>
      </Card>

      <Card title="Vitals & Condition">
        <div className="mb-3">
          <L label="Patient Condition at Arrival" req>
            <div className="flex gap-2 flex-wrap">
              {["Alert","Verbal","Pain","Unconsciousness"].map(c => (
                <button key={c} onClick={() => setCond(c)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border ${cond===c?"border-navy text-navy":"border-border text-muted-foreground"}`}>{c}</button>
              ))}
            </div>
          </L>
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
          {(["sbp","dbp","hr","rr","spo2","temp","grbs"] as const).map(k => (
            <L key={k} label={k.toUpperCase()} req>
              <input value={vitals[k]} onChange={e=>setVitals({...vitals,[k]:e.target.value})} className={inp}/>
            </L>
          ))}
          <L label="O₂ Mode"><select className={inp}><option>Room Air</option><option>Nasal</option><option>Mask</option></select></L>
        </div>
      </Card>

      <Card title="Neurological">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <L label="Eye 1-4"><select className={inp}>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></L>
          <L label="Verbal 1-5/T"><select className={inp}>{[1,2,3,4,5,"T"].map(n=><option key={n}>{n}</option>)}</select></L>
          <L label="Motor 1-6"><select className={inp}>{[1,2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></L>
        </div>
        <L label="Pain Score (0-10)">
          <div className="grid grid-cols-11 gap-1">
            {Array.from({length:11}).map((_,i)=>(
              <button key={i} onClick={()=>setScore(i)} className={`py-2 rounded text-sm font-semibold border ${score===i?"bg-coral text-coral-foreground border-coral":"border-border text-navy hover:bg-secondary/40"}`}>{i}</button>
            ))}
          </div>
        </L>
      </Card>

      <Card title="Triage Level Detection">
        <div className="grid grid-cols-[200px_1fr] gap-4">
          <div className="rounded-md border border-border p-3">
            <div className="text-xs font-semibold text-navy mb-2">Stratification</div>
            <div className="text-xs text-muted-foreground"><b>≥5</b> Level 1</div>
            <div className="text-xs text-muted-foreground"><b>2-4</b> Level 2</div>
            <div className="text-xs text-muted-foreground"><b>0-1</b> Level 3</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(l=>(
              <button key={l} className="rounded-md border border-border py-3 text-sm font-semibold text-navy hover:bg-secondary/40">
                Level {l===1?"I":l===2?"II":"III"} — {triageMeta[l].label}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

function MedHistoryForm() {
  return (
    <Card title="Medication History">
      <div className="grid grid-cols-2 gap-4">
        <L label="Current Medications"><textarea rows={3} className={inp} placeholder="List medications, dose, frequency..."/></L>
        <L label="Known Allergies"><textarea rows={3} className={`${inp} border-destructive bg-destructive/5`} placeholder="None reported"/></L>
        <L label="Past Medical History"><textarea rows={3} className={inp} placeholder="HTN, DM, CAD..."/></L>
        <L label="Surgical History"><textarea rows={3} className={inp} placeholder="Past procedures"/></L>
        <L label="Family History"><input className={inp}/></L>
        <L label="Social History"><input className={inp} placeholder="Smoking, alcohol, occupation"/></L>
      </div>
    </Card>
  );
}

function ClinicalForm({ chiefComplaint, setChiefComplaint, pathway, autoPathway, setPathwayOverride, isOverride }: any) {
  // ABCD assessment + pathway selection with override
  return (
    <>
      <Card title="ABCD Assessment">
        <div className="grid grid-cols-2 gap-4">
          <ABC letter="A" name="Airway" options={["Patent & Protected","Compromised","ETT","Crico"]} statuses={["Patent & Protected"]}/>
          <ABC letter="B" name="Breathing" options={["Spontaneous","Abnormal","Stable","Apnea"]} statuses={["Stable"]}/>
          <ABC letter="C" name="Circulation" options={["Adequate","Inadequate","Stable","Poor IV","Poor Fluid"]} statuses={["Stable"]}/>
          <ABC letter="D" name="Disability" options={["Clear","Concern"]} statuses={["Clear"]}/>
        </div>
      </Card>

      <Card title="History">
        <L label="History of Present Illness" req><textarea rows={3} className={inp} placeholder="none"/></L>
        <div className="mt-3"><L label="Known Allergies" req><textarea rows={2} className={inp} placeholder="none"/></L></div>
      </Card>

      <Card title="Symptoms & Chief Complaint">
        <L label="Chief Complaint" req>
          <input value={chiefComplaint} onChange={e=>setChiefComplaint(e.target.value)} placeholder="e.g. chest pain, fever, breathlessness, stroke symptoms..." className={inp}/>
        </L>
      </Card>

      <Card title="Care Pathway">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            Auto-selected based on triage + chief complaint. Doctor can override based on expert evaluation.
          </p>
          {isOverride && (
            <button onClick={() => setPathwayOverride(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-coral">
              <RotateCcw className="h-3 w-3"/> Reset to auto ({autoPathway})
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CARE_PATHWAYS.map(p => {
            const active = pathway === p;
            const isAuto = autoPathway === p;
            return (
              <button key={p} onClick={() => setPathwayOverride(p === autoPathway ? null : p)}
                className={`relative rounded-md border py-3 text-sm font-semibold transition-colors ${active ? "text-white border-transparent" : "border-border text-navy hover:bg-secondary/40"}`}
                style={active ? { background: isAuto ? "var(--urgent-safe)" : "var(--amber-emerg)" } : undefined}>
                {p}
                {isAuto && <span className={`absolute top-1 right-1 text-[9px] font-bold px-1 rounded ${active?"bg-white/25":"bg-secondary"}`}>AUTO</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-4 rounded-md bg-mint/40 border border-border p-3 text-sm text-navy">
          <strong>{pathway}</strong> pathway selected. Click <strong>Add Orders</strong> to start protocol-specific investigations, medications, infusions and procedures.
          <span className="block text-xs text-muted-foreground mt-1">Pathway-specific assessment forms will open in a future update.</span>
        </div>
      </Card>

      <Card title="Bed Assignment">
        <L label="Bed Number" req>
          <select className={inp}><option>Select bed number</option><option>ER-04</option><option>ER-07</option><option>OBS-01</option></select>
        </L>
      </Card>
    </>
  );
}

function ABC({ letter, name, options, statuses }: { letter: string; name: string; options: string[]; statuses: string[] }) {
  const [status, setStatus] = useState(statuses[0]);
  const [detail, setDetail] = useState(options[0]);
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-navy text-sm">{letter} – {name}</span>
        <div className="flex gap-1">
          {statuses.map(s => (
            <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded bg-urgent-safe/20" style={{color:"var(--urgent-safe)"}}>{s}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <L label="Status"><input value={status} onChange={e=>setStatus(e.target.value)} className={inp}/></L>
        <L label="Details"><select value={detail} onChange={e=>setDetail(e.target.value)} className={inp}>{options.map(o=><option key={o}>{o}</option>)}</select></L>
      </div>
    </div>
  );
}