import { useState } from "react";
import { X, FlaskConical, Pill, Droplet, Stethoscope, Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type Tab = "invest" | "stat" | "infusion" | "proc";

const PROTOCOLS: Record<string, string[]> = {
  "General": ["ABC Assessment","Vital Stabilization"],
  "Chest Pain": ["STEMI Protocol","NSTEMI Protocol","ACS Workup"],
  "Stroke": ["Thrombolysis Protocol","Stroke Workup"],
  "Sepsis": ["Sepsis Bundle","Septic Shock Protocol"],
  "Shortness of Breath": ["Respiratory Distress","Asthma Protocol"],
  "Poisoning": ["Toxicology Protocol","OP Poisoning"],
  "Polytrauma": ["Trauma Bay Activation","Massive Transfusion"],
  "Snakebite": ["Antivenom Protocol"],
  "Pneumonia": ["CAP Protocol","HAP Protocol"],
};

export function AddOrdersModal({ pathway, onClose }: { pathway: string; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("invest");
  const protocols = PROTOCOLS[pathway] || PROTOCOLS["General"];
  const [protocol, setProtocol] = useState(protocols[0]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-soft-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-xl font-bold text-navy">Clinical Actions</h2>
            <p className="text-xs text-muted-foreground">Add medications, investigations, infusions, and procedures for the selected protocol.</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary"><X className="h-4 w-4"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
            <div className="text-xs font-semibold text-blue-700 mb-1">Select Protocol / Circumstance</div>
            <div className="relative">
              <select value={protocol} onChange={e=>setProtocol(e.target.value)}
                className="w-full appearance-none bg-card rounded-md border border-border px-4 py-3 text-sm font-semibold text-navy pr-10">
                {protocols.map(p => <option key={p}>{p}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-secondary/30 rounded-lg p-1">
            {([
              { id: "invest" as Tab, label: "Investigations", Icon: FlaskConical },
              { id: "stat" as Tab, label: "STAT Medications", Icon: Pill },
              { id: "infusion" as Tab, label: "Infusions", Icon: Droplet },
              { id: "proc" as Tab, label: "Procedures", Icon: Stethoscope },
            ]).map(t => {
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`inline-flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${active?"bg-card text-navy shadow-soft":"text-muted-foreground"}`}>
                  <t.Icon className="h-4 w-4"/> {t.label}
                </button>
              );
            })}
          </div>

          {tab === "invest" && <InvestigationForm/>}
          {tab === "stat" && <StatMedForm/>}
          {tab === "infusion" && <InfusionForm/>}
          {tab === "proc" && <ProcedureForm/>}
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral";
function Lbl({ label, req, children }: any) {
  return <div><label className="text-sm font-semibold text-navy block mb-1.5">{label} {req && <span className="text-destructive">*</span>}</label>{children}</div>;
}
function CB({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center gap-2 text-sm text-navy bg-secondary/30 rounded-md px-3 py-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} className="h-4 w-4 accent-coral"/>{label}
    </label>
  );
}
function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button onClick={onClick} className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700">
        <Plus className="h-4 w-4"/> {label}
      </button>
    </div>
  );
}

function InvestigationForm() {
  const [panel, setPanel] = useState(""); const [notes, setNotes] = useState(""); const [ordered, setOrdered] = useState(false);
  return (
    <div className="space-y-4">
      <Lbl label="Select Lab Panel" req><select value={panel} onChange={e=>setPanel(e.target.value)} className={inp}><option value="">Choose lab panel...</option><option>CBC</option><option>Renal Panel</option><option>Liver Panel</option><option>Cardiac Panel (Troponin, CKMB)</option><option>ABG</option></select></Lbl>
      <Lbl label="Comments / Rationale"><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} className={inp} placeholder="Clinical indication, expected abnormality..."/></Lbl>
      <CB label="Mark as Ordered" checked={ordered} onChange={setOrdered}/>
      <AddBtn label="Add Investigation" onClick={() => { if(!panel)return toast.error("Select a panel"); toast.success("Investigation added"); }}/>
    </div>
  );
}
function StatMedForm() {
  const [med, setMed] = useState(""); const [type, setType] = useState("TAB"); const [req, setReq] = useState("Essential");
  const [dose, setDose] = useState(""); const [units, setUnits] = useState("MG"); const [route, setRoute] = useState("ORAL");
  const [comments, setComments] = useState(""); const [admin, setAdmin] = useState(false);
  return (
    <div className="space-y-4">
      <Lbl label="Select Medication" req><select value={med} onChange={e=>setMed(e.target.value)} className={inp}><option value="">Choose medication...</option><option>Aspirin</option><option>Atorvastatin</option><option>Clopidogrel</option><option>Heparin</option><option>Adrenaline</option></select></Lbl>
      <div className="grid grid-cols-2 gap-4">
        <Lbl label="Type" req><select value={type} onChange={e=>setType(e.target.value)} className={inp}>{["TAB","CAP","INJ","SYRUP"].map(o=><option key={o}>{o}</option>)}</select></Lbl>
        <Lbl label="Requirement" req><select value={req} onChange={e=>setReq(e.target.value)} className={inp}>{["Essential","Optional","PRN"].map(o=><option key={o}>{o}</option>)}</select></Lbl>
        <Lbl label="Dosage" req><input value={dose} onChange={e=>setDose(e.target.value)} placeholder="Enter dosage" className={inp}/></Lbl>
        <Lbl label="Units"><select value={units} onChange={e=>setUnits(e.target.value)} className={inp}>{["MG","G","ML","MCG","IU"].map(o=><option key={o}>{o}</option>)}</select></Lbl>
        <Lbl label="Route" req><select value={route} onChange={e=>setRoute(e.target.value)} className={inp}>{["ORAL","IV","IM","SC","INHALATION"].map(o=><option key={o}>{o}</option>)}</select></Lbl>
      </div>
      <Lbl label="Comments"><textarea value={comments} onChange={e=>setComments(e.target.value)} rows={2} className={inp} placeholder="Additional notes..."/></Lbl>
      <CB label="Mark as Administered" checked={admin} onChange={setAdmin}/>
      <AddBtn label="Add Medication" onClick={() => { if(!med||!dose)return toast.error("Medication & dosage required"); toast.success("Medication added"); }}/>
    </div>
  );
}
function InfusionForm() {
  const [drug, setDrug] = useState(""); const [dose, setDose] = useState(""); const [units, setUnits] = useState("ML");
  const [method, setMethod] = useState("IV"); const [rate, setRate] = useState(""); const [instr, setInstr] = useState(""); const [started, setStarted] = useState(false);
  return (
    <div className="space-y-4">
      <Lbl label="Select Drug/Fluid" req><select value={drug} onChange={e=>setDrug(e.target.value)} className={inp}><option value="">Choose drug/fluid...</option><option>Normal Saline 0.9%</option><option>Ringer's Lactate</option><option>Dextrose 5%</option><option>Noradrenaline</option><option>Insulin Infusion</option></select></Lbl>
      <div className="grid grid-cols-2 gap-4">
        <Lbl label="Dosage" req><input value={dose} onChange={e=>setDose(e.target.value)} placeholder="Enter dosage" className={inp}/></Lbl>
        <Lbl label="Units"><select value={units} onChange={e=>setUnits(e.target.value)} className={inp}>{["ML","L","MG/HR","UNITS/HR"].map(o=><option key={o}>{o}</option>)}</select></Lbl>
        <Lbl label="Method" req><select value={method} onChange={e=>setMethod(e.target.value)} className={inp}>{["IV","Central Line","Pump"].map(o=><option key={o}>{o}</option>)}</select></Lbl>
        <Lbl label="Infusion Rate"><input value={rate} onChange={e=>setRate(e.target.value)} placeholder="e.g., 100 ml/hr" className={inp}/></Lbl>
      </div>
      <Lbl label="Instructions"><textarea value={instr} onChange={e=>setInstr(e.target.value)} rows={2} className={inp} placeholder="Infusion instructions..."/></Lbl>
      <CB label="Mark as Started" checked={started} onChange={setStarted}/>
      <AddBtn label="Add Infusion" onClick={() => { if(!drug||!dose)return toast.error("Drug & dosage required"); toast.success("Infusion added"); }}/>
    </div>
  );
}
function ProcedureForm() {
  const [proc, setProc] = useState(""); const [details, setDetails] = useState(""); const [done, setDone] = useState(false);
  return (
    <div className="space-y-4">
      <Lbl label="Select Procedure" req><select value={proc} onChange={e=>setProc(e.target.value)} className={inp}><option value="">Choose procedure...</option><option>Intubation</option><option>Central Line</option><option>Chest Tube</option><option>Defibrillation</option><option>Foley Catheterization</option></select></Lbl>
      <Lbl label="Procedure Details"><textarea value={details} onChange={e=>setDetails(e.target.value)} rows={3} className={inp} placeholder="Enter procedure details, findings, complications..."/></Lbl>
      <CB label="Mark as Completed" checked={done} onChange={setDone}/>
      <AddBtn label="Add Procedure" onClick={() => { if(!proc)return toast.error("Select a procedure"); toast.success("Procedure added"); }}/>
    </div>
  );
}