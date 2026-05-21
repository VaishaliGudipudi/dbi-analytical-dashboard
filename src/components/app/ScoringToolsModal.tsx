import { useMemo, useState } from "react";
import { X, Calculator } from "lucide-react";

// ER scoring tools relevant to pathways. Each tool has items {label, max, scope}.
// Used across: chest pain (HEART, TIMI), stroke (NIHSS, mRS), trauma (RTS, ISS, GCS),
// sepsis (qSOFA, SOFA), respiratory (CURB-65, NEWS2), pneumonia (CURB-65, PSI), general (NEWS2, GCS).

type Tool = {
  id: string; name: string; pathways: string[];
  items: { label: string; max: number; opts?: string[] }[];
  interpret: (score: number) => string;
};

const TOOLS: Tool[] = [
  { id: "nihss", name: "NIHSS — Stroke Scale", pathways: ["Stroke","General"],
    items: [
      {label:"1a. LOC",max:3},{label:"1b. LOC Questions",max:2},{label:"1c. LOC Commands",max:2},
      {label:"2. Best Gaze",max:2},{label:"3. Visual Fields",max:3},{label:"4. Facial Palsy",max:3},
      {label:"5a. Motor Arm Left",max:4},{label:"5b. Motor Arm Right",max:4},
      {label:"6a. Motor Leg Left",max:4},{label:"6b. Motor Leg Right",max:4},
      {label:"7. Limb Ataxia",max:2},{label:"8. Sensory",max:2},{label:"9. Best Language",max:3},
      {label:"10. Dysarthria",max:2},{label:"11. Extinction/Inattention",max:2},
    ],
    interpret: s => s<=4?"Minor stroke":s<=15?"Moderate":s<=20?"Moderate–Severe":"Severe stroke"
  },
  { id: "mrs", name: "Modified Rankin Scale (mRS)", pathways: ["Stroke","General"],
    items: [{label:"mRS Grade (0-6)",max:6}],
    interpret: s => ["No symptoms","No significant disability","Slight","Moderate","Moderately severe","Severe","Dead"][s]||"-"
  },
  { id: "rts", name: "Revised Trauma Score (RTS)", pathways: ["Polytrauma","General"],
    items: [{label:"GCS (1-15) → coded",max:4},{label:"SBP coded (0-4)",max:4},{label:"RR coded (0-4)",max:4}],
    interpret: s => s>=11?"Low mortality risk":s>=7?"Moderate":"High mortality risk"
  },
  { id: "iss", name: "Injury Severity Score (ISS)", pathways: ["Polytrauma"],
    items: [{label:"Head/Neck (0-6)²",max:36},{label:"Face (0-6)²",max:36},{label:"Chest (0-6)²",max:36},
      {label:"Abdomen (0-6)²",max:36},{label:"Extremity (0-6)²",max:36},{label:"External (0-6)²",max:36}],
    interpret: s => s<9?"Minor":s<16?"Moderate":s<25?"Serious":"Severe trauma"
  },
  { id: "qsofa", name: "qSOFA — Sepsis", pathways: ["Sepsis","General"],
    items: [{label:"Altered mental status",max:1},{label:"SBP ≤ 100 mmHg",max:1},{label:"RR ≥ 22/min",max:1}],
    interpret: s => s>=2?"High risk for sepsis — initiate bundle":"Low risk"
  },
  { id: "sofa", name: "SOFA — Sepsis (full)", pathways: ["Sepsis"],
    items: [{label:"Respiration",max:4},{label:"Coagulation",max:4},{label:"Liver",max:4},
      {label:"Cardiovascular",max:4},{label:"CNS",max:4},{label:"Renal",max:4}],
    interpret: s => s<6?"Low mortality":s<10?"Moderate":"High mortality risk"
  },
  { id: "heart", name: "HEART Score — Chest Pain", pathways: ["Chest Pain"],
    items: [{label:"History",max:2},{label:"ECG",max:2},{label:"Age",max:2},{label:"Risk Factors",max:2},{label:"Troponin",max:2}],
    interpret: s => s<=3?"Low risk (1.7% MACE)":s<=6?"Moderate (16.6%)":"High (50%) — admit"
  },
  { id: "timi", name: "TIMI Risk — NSTEMI/UA", pathways: ["Chest Pain"],
    items: [{label:"Age ≥65",max:1},{label:"≥3 CAD risk factors",max:1},{label:"Known CAD",max:1},
      {label:"ASA in last 7d",max:1},{label:"≥2 angina in 24h",max:1},{label:"ST changes",max:1},{label:"+Cardiac markers",max:1}],
    interpret: s => s<=2?"Low":s<=4?"Intermediate":"High"
  },
  { id: "curb65", name: "CURB-65 — Pneumonia", pathways: ["Pneumonia","Shortness of Breath"],
    items: [{label:"Confusion",max:1},{label:"Urea > 7",max:1},{label:"RR ≥ 30",max:1},{label:"BP low",max:1},{label:"Age ≥ 65",max:1}],
    interpret: s => s<=1?"Outpatient":s===2?"Short admission":"Severe — ICU"
  },
  { id: "news2", name: "NEWS2 — Early Warning", pathways: ["General","Shortness of Breath","Sepsis"],
    items: [{label:"Resp Rate",max:3},{label:"SpO₂",max:3},{label:"Air/O₂",max:2},
      {label:"Temp",max:3},{label:"SBP",max:3},{label:"Pulse",max:3},{label:"Consciousness",max:3}],
    interpret: s => s<=4?"Low":s<=6?"Medium":"High — urgent review"
  },
  { id: "gcs", name: "Glasgow Coma Scale (GCS)", pathways: ["Polytrauma","Stroke","General"],
    items: [{label:"Eye (1-4)",max:4},{label:"Verbal (1-5)",max:5},{label:"Motor (1-6)",max:6}],
    interpret: s => s<=8?"Severe":s<=12?"Moderate":"Mild"
  },
  { id: "psi", name: "PSI — Pneumonia Severity Index", pathways: ["Pneumonia"],
    items: [{label:"Demographics",max:30},{label:"Comorbidities",max:30},{label:"Exam findings",max:30},{label:"Labs/Imaging",max:30}],
    interpret: s => s<70?"Class I-II":s<90?"Class III":s<130?"Class IV":"Class V — ICU"
  },
];

export function ScoringToolsModal({ pathway, onClose }: { pathway: string; onClose: () => void }) {
  const relevant = TOOLS.filter(t => t.pathways.includes(pathway));
  const initialId = relevant[0]?.id ?? TOOLS[0].id;
  const [activeId, setActiveId] = useState(initialId);
  const tool = TOOLS.find(t => t.id === activeId)!;
  const [vals, setVals] = useState<number[]>(Array(tool.items.length).fill(0));
  const total = useMemo(() => vals.reduce((a, b) => a + b, 0), [vals]);

  const onTool = (id: string) => {
    const t = TOOLS.find(x => x.id === id)!;
    setActiveId(id);
    setVals(Array(t.items.length).fill(0));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-soft-lg" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-coral"/>
            <div>
              <h2 className="text-xl font-bold text-navy">Scoring Tools</h2>
              <p className="text-xs text-muted-foreground">ER scoring relevant to <strong>{pathway}</strong> pathway</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary"><X className="h-4 w-4"/></button>
        </div>
        <div className="grid grid-cols-[260px_1fr] gap-5 p-5">
          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 mb-1">Relevant to {pathway}</div>
            {relevant.map(t => (
              <button key={t.id} onClick={() => onTool(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium ${activeId===t.id?"bg-navy text-navy-foreground":"bg-secondary/30 text-navy hover:bg-secondary/50"}`}>{t.name}</button>
            ))}
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 mt-3 mb-1">All ER Scores</div>
            {TOOLS.filter(t=>!relevant.includes(t)).map(t => (
              <button key={t.id} onClick={() => onTool(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium ${activeId===t.id?"bg-navy text-navy-foreground":"bg-card text-muted-foreground hover:bg-secondary/30"}`}>{t.name}</button>
            ))}
          </div>
          <div className="bg-secondary/20 rounded-xl p-5">
            <h3 className="font-bold text-navy text-lg mb-4">{tool.name}</h3>
            <div className="space-y-3">
              {tool.items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_140px] gap-3 items-center">
                  <label className="text-sm text-navy">{it.label}</label>
                  <input type="number" min={0} max={it.max} value={vals[i]}
                    onChange={e => { const v=Math.max(0,Math.min(it.max,Number(e.target.value)||0)); const nv=[...vals]; nv[i]=v; setVals(nv); }}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral"/>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-card border border-border p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Total Score</div>
                <div className="text-3xl font-bold text-navy">{total}</div>
              </div>
              <div className="text-right max-w-[60%]">
                <div className="text-xs text-muted-foreground">Interpretation</div>
                <div className="text-sm font-semibold text-navy mt-0.5">{tool.interpret(total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}