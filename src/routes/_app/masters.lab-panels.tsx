import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/masters/lab-panels")({ component: Page });

type Tab = "param" | "panel" | "edit";

function Page() {
  const [tab, setTab] = useState<Tab>("param");
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-navy mb-4">Lab Panel Master</h1>
      {/* Vertical tabs as requested (top to bottom) */}
      <div className="grid grid-cols-[220px_1fr] gap-5">
        <div className="flex flex-col gap-1.5">
          {[
            { id: "param" as Tab, label: "Add New Lab Parameters" },
            { id: "panel" as Tab, label: "Add New Lab Panels" },
            { id: "edit" as Tab, label: "Edit Lab Panels" },
          ].map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${active ? "text-white shadow-soft" : "bg-card text-navy border border-border hover:bg-secondary/40"}`}
                style={active ? { background: "var(--amber-emerg)" } : undefined}>
                {t.label}
              </button>
            );
          })}
        </div>
        <div>
          {tab === "param" && <Params />}
          {tab === "panel" && <Panels />}
          {tab === "edit" && <EditPanels />}
        </div>
      </div>
    </div>
  );
}

function Params() {
  const [v, setV] = useState({ test: "", loinc: "", code: "", dept: "", method: "", result: "", tat: "", prereq: false, panel: false, intermediate: false, critical: false });
  const sv = (k: keyof typeof v) => (e: any) => setV({ ...v, [k]: e.target.value });
  return (
    <form onSubmit={e => { e.preventDefault(); toast.success(`Parameter "${v.test}" saved`); }}
      className="bg-card rounded-2xl shadow-soft border border-border p-6 space-y-4">
      <p className="text-xs text-muted-foreground">Fields marked with <span className="text-destructive">*</span> are mandatory</p>
      <div className="grid grid-cols-3 gap-4">
        <F label="Test Name" req value={v.test} onChange={sv("test")}/>
        <F label="LOINC Name" req value={v.loinc} onChange={sv("loinc")}/>
        <F label="LOINC Code" req value={v.code} onChange={sv("code")}/>
        <Sel label="Department" req value={v.dept} onChange={sv("dept")} options={["Biochemistry","Hematology","Microbiology","Pathology","Radiology"]} placeholder="Select department"/>
        <Sel label="Method Used" req value={v.method} onChange={sv("method")} options={["Manual","Automated","Spectrophotometry","ELISA","PCR"]} placeholder="Select method used"/>
        <Sel label="Result Type" req value={v.result} onChange={sv("result")} options={["Numeric","Text","Boolean","Enum"]} placeholder="Select result type"/>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CB label="Any prerequisites required" checked={v.prereq} onChange={(c:boolean)=>setV({...v,prereq:c})}/>
        <CB label="Is this lab test part of a panel" checked={v.panel} onChange={(c:boolean)=>setV({...v,panel:c})}/>
        <CB label="Does it require intermediate report?" checked={v.intermediate} onChange={(c:boolean)=>setV({...v,intermediate:c})}/>
        <CB label="Is it a critical test?" checked={v.critical} onChange={(c:boolean)=>setV({...v,critical:c})}/>
      </div>
      <div>
        <label className="text-sm font-semibold text-navy block mb-1">Associated TAT <span className="text-destructive">*</span></label>
        <div className="flex items-center gap-2">
          <input value={v.tat} onChange={sv("tat")} placeholder="80 - 100" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral"/>
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      </div>
      <div className="flex justify-center pt-2">
        <button type="submit" className="px-6 py-2.5 rounded-md bg-navy text-navy-foreground text-sm font-semibold">Save Parameter</button>
      </div>
    </form>
  );
}

const PARAMS_BY_DEPT: Record<string, string[]> = {
  Biochemistry: ["Glucose","Urea","Creatinine","Sodium","Potassium","Bilirubin","ALT","AST"],
  Hematology: ["Hemoglobin","WBC","RBC","Platelet","MCV","MCH"],
  Microbiology: ["Culture","Gram Stain","AFB","Sensitivity"],
  Pathology: ["Biopsy","Cytology","Histopath"],
  Radiology: ["X-Ray","CT","MRI","USG"],
};

function Panels() {
  const [dept, setDept] = useState(""); const [name, setName] = useState(""); const [code, setCode] = useState("");
  const [search, setSearch] = useState(""); const [mapped, setMapped] = useState<string[]>([]);
  const available = (PARAMS_BY_DEPT[dept] || []).filter(p => !mapped.includes(p) && p.toLowerCase().includes(search.toLowerCase()));
  return (
    <form onSubmit={e => { e.preventDefault(); toast.success(`Panel "${name}" saved`); }}
      className="bg-card rounded-2xl shadow-soft border border-border p-6 space-y-4">
      <p className="text-xs text-muted-foreground">Fields marked with <span className="text-destructive">*</span> are mandatory</p>
      <h2 className="text-center font-bold text-navy text-lg">Add New Lab Panel</h2>
      <div className="grid grid-cols-2 gap-4">
        <Sel label="Department" req value={dept} onChange={(e:any)=>{setDept(e.target.value); setMapped([]);}} options={Object.keys(PARAMS_BY_DEPT)} placeholder="Select department"/>
        <F label="Panel Name" req value={name} onChange={(e:any)=>setName(e.target.value)} placeholder="Enter panel name"/>
      </div>
      <F label="Panel Code" req value={code} onChange={(e:any)=>setCode(e.target.value)} placeholder="Enter panel code"/>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-navy">Available Parameters</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search parameters..." className="text-xs rounded-md border border-border px-2 py-1 bg-background w-40"/>
          </div>
          <div className="min-h-[180px] rounded-md border border-border bg-background p-2 space-y-1">
            {available.length===0 ? <div className="text-xs text-muted-foreground p-3">{dept?"No parameters available":"Select a department first"}</div>
              : available.map(p => (
                <button type="button" key={p} onClick={() => setMapped([...mapped, p])}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-navy hover:bg-secondary/40">
                  {p} <ArrowRight className="h-3.5 w-3.5 text-coral"/>
                </button>
              ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-navy block mb-2">Mapped Parameters</label>
          <div className="min-h-[180px] rounded-md border border-border bg-background p-2 space-y-1">
            {mapped.length===0 ? <div className="text-xs text-muted-foreground p-3">No parameters mapped</div>
              : mapped.map(p => (
                <button type="button" key={p} onClick={() => setMapped(mapped.filter(x => x!==p))}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-navy hover:bg-coral/10">
                  <ArrowLeft className="h-3.5 w-3.5 text-coral"/> {p}
                </button>
              ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={!dept||!name||!code||mapped.length===0}
          className="px-6 py-2.5 rounded-md bg-navy text-navy-foreground text-sm font-semibold disabled:opacity-50">Save Panel</button>
      </div>
    </form>
  );
}

function EditPanels() {
  const [dept, setDept] = useState(""); const [panel, setPanel] = useState("");
  const [mapped, setMapped] = useState<string[]>([]); const [search, setSearch] = useState("");
  const available = (PARAMS_BY_DEPT[dept] || []).filter(p => !mapped.includes(p) && p.toLowerCase().includes(search.toLowerCase()));
  return (
    <form onSubmit={e => { e.preventDefault(); toast.success(`Panel "${panel}" updated`); }}
      className="bg-card rounded-2xl shadow-soft border border-border p-6 space-y-4">
      <p className="text-xs text-muted-foreground">Fields marked with <span className="text-destructive">*</span> are mandatory</p>
      <div className="grid grid-cols-2 gap-4">
        <Sel label="Department" req value={dept} onChange={(e:any)=>{setDept(e.target.value); setPanel(""); setMapped([]);}} options={Object.keys(PARAMS_BY_DEPT)} placeholder="Select department"/>
        <Sel label="Panel" req value={panel} onChange={(e:any)=>setPanel(e.target.value)} options={dept?["Renal Panel","Liver Panel","Cardiac Panel"]:[]} placeholder="Select panel"/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-navy">Available Parameters</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search parameters..." className="text-xs rounded-md border border-border px-2 py-1 bg-background w-40"/>
          </div>
          <div className="min-h-[180px] rounded-md border border-border bg-background p-2 space-y-1">
            {available.length===0 ? <div className="text-xs text-destructive p-3">No parameters available</div>
              : available.map(p => (
                <button type="button" key={p} onClick={() => setMapped([...mapped, p])}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-navy hover:bg-secondary/40">
                  {p} <ArrowRight className="h-3.5 w-3.5 text-coral"/>
                </button>
              ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-navy block mb-2">Mapped Parameters</label>
          <div className="min-h-[180px] rounded-md border border-border bg-background p-2 space-y-1">
            {mapped.length===0 ? <div className="text-xs text-muted-foreground p-3">No parameters mapped</div>
              : mapped.map(p => (
                <button type="button" key={p} onClick={() => setMapped(mapped.filter(x => x!==p))}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-navy hover:bg-coral/10">
                  <ArrowLeft className="h-3.5 w-3.5 text-coral"/> {p}
                </button>
              ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={!dept||!panel}
          className="px-6 py-2.5 rounded-md bg-navy text-navy-foreground text-sm font-semibold disabled:opacity-50">Update Panel</button>
      </div>
    </form>
  );
}

function F({ label, req, ...p }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-navy block mb-1">{label} {req && <span className="text-destructive">*</span>}</label>
      <input {...p} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral" />
    </div>
  );
}
function Sel({ label, req, options, placeholder, ...p }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-navy block mb-1">{label} {req && <span className="text-destructive">*</span>}</label>
      <select {...p} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral">
        <option value="">{placeholder}</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function CB({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-navy py-1">
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} className="h-4 w-4 accent-coral"/> {label}
    </label>
  );
}