import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calculator,
  ChevronDown,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Stethoscope,
} from "lucide-react";
import { AddOrdersModal } from "@/components/app/AddOrdersModal";
import { AddVitalsModal } from "@/components/app/AddVitalsModal";
import { ScoringToolsModal } from "@/components/app/ScoringToolsModal";
import { useCopilot } from "@/copilot/hooks/useCopilot";
import type { CopilotRecommendation, EncounterOrderItem } from "@/copilot/types/copilot";
import { getEdSnapshot } from "@/lib/edApi";
import { triageMeta } from "@/lib/edTypes";

export const Route = createFileRoute("/_app/patient/$id/workspace")({
  loader: async ({ params }) => {
    const snapshot = await getEdSnapshot();
    return {
      patient: snapshot.patients.find((item) => item.id === params.id) ?? snapshot.patients[0],
      patients: snapshot.patients,
    };
  },
  component: Workspace,
});

type StepId = "arrival" | "triage" | "medhist" | "clinical" | "orders" | "outcome";
type OrderedItem = EncounterOrderItem;

const STEPS: { id: StepId; label: string; Icon: any }[] = [
  { id: "arrival", label: "ER Arrival", Icon: ClipboardList },
  { id: "triage", label: "Triage Details", Icon: HeartPulse },
  { id: "medhist", label: "Medication History", Icon: FileText },
  { id: "clinical", label: "Clinical Assessment", Icon: Activity },
  { id: "orders", label: "Order Set", Icon: Pill },
  { id: "outcome", label: "ER Outcome", Icon: Stethoscope },
];

const CARE_PATHWAYS = [
  "Generic",
  "Chest Pain",
  "Stroke",
  "Sepsis",
  "Shortness of Breath",
  "Poisoning",
  "Polytrauma",
  "Snakebite",
  "Pneumonia",
];

const PATHWAY_PICKER = [
  { pathway: "Generic", label: "Generic", severity: 3 as const },
  { pathway: "Chest Pain", label: "Cardiac / STEMI", severity: 1 as const },
  { pathway: "Stroke", label: "Stroke", severity: 1 as const },
  { pathway: "Sepsis", label: "Sepsis", severity: 2 as const },
  { pathway: "Shortness of Breath", label: "Respiratory", severity: 2 as const },
  { pathway: "Poisoning", label: "Poisoning", severity: 1 as const },
  { pathway: "Polytrauma", label: "Trauma", severity: 1 as const },
  { pathway: "Snakebite", label: "Snake Bite", severity: 1 as const },
  { pathway: "Pneumonia", label: "Pneumonia", severity: 2 as const },
];

const CHIEF_COMPLAINT_OPTIONS = [
  "Abdominal pain",
  "Abdominal pain / flank pain",
  "Abdomen - Abnormal cytological findings",
  "Abdomen - Abnormal histological findings",
  "Abdomen - Abnormal immunological findings",
  "Abdomen - Abnormal level of hormones",
  "Abdomen - Abnormal level of substances chiefly nonmedicinal as to source",
  "Abdomen - Abnormal microbiological findings",
  "Abscess",
  "Abnormal heart rate",
  "Allergic reaction",
  "Altered mental status",
  "Animal bite / rabies exposure",
  "Ankle injury",
  "Back pain",
  "Bleeding",
  "Blunt force injury to arm or shoulder",
  "Blunt force injury to ankle or foot",
  "Blunt force injury to head or neck",
  "Blunt force injury to leg or hip",
  "Blunt force injury to trunk",
  "Burn",
  "Chest pain",
  "Chest pain / rib cage pain",
  "Cough",
  "Dental pain",
  "Depression",
  "Dizziness",
  "Drug overdose",
  "Dyspnea",
  "Ear pain",
  "Epistaxis",
  "Extremity pain",
  "Eye complaint",
  "Facial droop",
  "Fall",
  "Fatigue",
  "Fever",
  "Foot pain",
  "Foreign body",
  "Gastrointestinal bleeding",
  "General muscle or joint pain",
  "Gunshot wound",
  "Hardware problem",
  "Head injury",
  "Headache or migraine",
  "Hip pain",
  "Insect bite or sting",
  "Knee pain",
  "Laceration to face or scalp",
  "Laceration to lower extremity",
  "Laceration to upper extremity",
  "Low-speed collision",
  "Medication refill",
  "Nausea / vomiting / diarrhoea / constipation",
  "Neck pain",
  "Neurological loss / TIA",
  "Non-specific infection",
  "Non-specific illness",
  "Palpitations",
  "Pharyngitis symptoms",
  "Poisoning",
  "Pregnancy-related complaint",
  "Puncture wound",
  "Rash",
  "Rectal bleeding",
  "Respiratory distress",
  "Respiratory infection symptoms",
  "Seizure",
  "Snake bite",
  "Shortness of breath",
  "Stroke symptoms",
  "Suicidal ideation / attempt",
  "Syncope",
  "Trauma",
  "Urinary complications",
  "Urinary tract infection or gynaecological symptoms",
  "Vertigo",
  "Weakness",
  "Wound or incision complication",
  "Wound or infection follow-up",
];

const shellCard = "warm-panel rounded-2xl shadow-soft";
const sectionCard = "bg-card rounded-2xl shadow-soft border border-border/70";
const inputClass =
  "w-full rounded-xl border border-border bg-background/90 px-3 py-2 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-coral/30";
const selectClass = `${inputClass} appearance-none pr-8`;

function Workspace() {
  const { patient, patients } = Route.useLoaderData();
  const navigate = useNavigate();
  const { recommendations, requestRecommendations, setEncounterBindings, startVoiceCapture } = useCopilot();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<StepId>("arrival");
  const [done, setDone] = useState<Record<StepId, boolean>>({
    arrival: true,
    triage: false,
    medhist: true,
    clinical: false,
    orders: false,
    outcome: false,
  });
  const [showOrders, setShowOrders] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [rapidMode, setRapidMode] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [orderedItems, setOrderedItems] = useState<OrderedItem[]>([
    { category: "investigation", name: "CBC", requirement: "Essential", notes: "Initial ER panel" },
    { category: "medication", name: "Paracetamol", requirement: "PRN", notes: "Symptomatic care if febrile/pain" },
  ]);
    const [vitals, setVitals] = useState({
      sbp: "",
      dbp: "",
      hr: "",
      rr: "",
      spo2: "",
      temp: "",
      grbs: "",
    });
  const [pathwayOverride, setPathwayOverride] = useState<string | null>(null);

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
    return "Generic";
  }, [chiefComplaint]);

  const pathway = pathwayOverride ?? autoPathway;
  const isOverride = pathwayOverride !== null && pathwayOverride !== autoPathway;

  const goNext = () => {
    setDone({ ...done, [step]: true });
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  const goPrevious = () => {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  const addOrderedItem = (item: OrderedItem) => {
    setOrderedItems((current) => {
      const duplicate = current.some(
        (existing) =>
          existing.category === item.category &&
          existing.name.toLowerCase() === item.name.toLowerCase() &&
          existing.notes.toLowerCase() === item.notes.toLowerCase(),
      );
      if (duplicate) {
        return current;
      }
      return [...current, item];
    });
    setStep("orders");
  };

  const runClinicalBundle = (bundleId: string) => {
    const normalized = bundleId.toLowerCase();
    if (normalized === "stemi") {
      setChiefComplaint((current) => current || "Chest pain");
      setPathwayOverride("Chest Pain");
      setStep("orders");
      setShowOrders(true);
      addOrderedItem({
        category: "investigation",
        name: "ECG",
        requirement: "Essential",
        notes: "12-lead ECG immediately",
      });
      addOrderedItem({
        category: "investigation",
        name: "Troponin I",
        requirement: "Essential",
        notes: "Cardiac biomarker panel",
      });
      addOrderedItem({
        category: "medication",
        name: "Aspirin",
        requirement: "Essential",
        notes: "325 mg PO stat",
      });
      addOrderedItem({
        category: "medication",
        name: "Atorvastatin",
        requirement: "Essential",
        notes: "80 mg PO stat",
      });
      setNotice("STEMI bundle queued. Review orders, pathway, and scoring tools before confirming.");
    }
  };

  useEffect(() => {
    const availableSections = STEPS.map((item) => item.label);
    const availableTools = ["Scoring Tools", "Add Vitals", "Add Orders", "Voice Fill", "Nurse Assessment"];
    const availablePathways = CARE_PATHWAYS;

    setEncounterBindings({
      getContext: () => ({
        patientName: patient.name,
        patientId: patient.id,
        route: `/patient/${patient.id}/workspace`,
        currentSection: STEPS.find((item) => item.id === step)?.label,
        pathway,
        chiefComplaint,
        vitals,
        availablePatients: patients.map((item) => ({ id: item.id, name: item.name })),
        availableSections,
        availableTools,
        availablePathways,
        notes: orderedItems.map((item) => `${item.category}: ${item.name} (${item.requirement}) ${item.notes}`.trim()),
      }),
      goToSection: (section) => {
        const match = STEPS.find((item) => item.label.toLowerCase() === section.toLowerCase());
        if (match) setStep(match.id);
      },
      nextStep: goNext,
      previousStep: goPrevious,
      openTool: (tool) => {
        const normalized = tool.toLowerCase();
        if (normalized.includes("scoring")) setShowScoring(true);
        if (normalized.includes("vitals")) setShowVitals(true);
        if (normalized.includes("order")) setShowOrders(true);
        if (normalized.includes("nurse")) setNotice("Nurse Assessment placeholder: handoff checklist and nursing assessment will open here.");
        if (normalized.includes("voice")) void startVoiceCapture(STEPS.find((item) => item.id === step)?.label ?? "active section");
      },
      applyVitals: (nextVitals) => {
        setStep("triage");
        setVitals((current) => ({
          ...current,
          ...nextVitals,
        }));
        setShowVitals(true);
        setNotice("Copilot applied recognized vitals to the triage context. Please review and confirm.");
      },
      selectPathway: (nextPathway) => {
        const match = CARE_PATHWAYS.find((item) => item.toLowerCase() === nextPathway.toLowerCase());
        if (match) {
          setPathwayOverride(match === autoPathway ? null : match);
          setStep("clinical");
        }
      },
      addOrder: (item) => {
        addOrderedItem(item);
        setShowOrders(true);
        setNotice(`${item.name} added to the clinical order set. Review and confirm before finalizing.`);
      },
      runBundle: (bundleId) => {
        runClinicalBundle(bundleId);
      },
    });

    return () => setEncounterBindings(null);
  }, [addOrderedItem, autoPathway, chiefComplaint, orderedItems, pathway, patient.id, patient.name, runClinicalBundle, setEncounterBindings, startVoiceCapture, step, vitals]);

  useEffect(() => {
    if (!chiefComplaint && !pathway) {
      return;
    }

    const timer = window.setTimeout(() => {
      void requestRecommendations();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [chiefComplaint, pathway, requestRecommendations, vitals]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-5 pb-6 pt-4">
      <div className="mb-5 rounded-[1.75rem] bg-navy px-5 py-4 text-navy-foreground shadow-soft-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/dashboard" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-base font-bold">{patient.name}</span>
              <span className="text-white/40">|</span>
              <span>UMR: {patient.umr}</span>
              <span className="text-white/40">|</span>
              <span className="inline-flex items-center gap-2">
                <span className="text-white/70">Triage</span>
                <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: triageMeta[patient.triage].color }}>
                  {patient.triage === 0 ? "Pending" : `Level ${patient.triage === 1 ? "I" : patient.triage === 2 ? "II" : "III"}`}
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToolBtn onClick={() => setShowScoring(true)} icon={<Calculator className="h-4 w-4" />}>
              Scoring Tools
            </ToolBtn>
            <ToolBtn onClick={() => setShowVitals(true)} icon={<HeartPulse className="h-4 w-4" />}>
              Add Vitals
            </ToolBtn>
            <ToolBtn onClick={() => setNotice("Nurse Assessment placeholder: handoff checklist and nursing assessment will open here.")} icon={<ClipboardList className="h-4 w-4" />}>
              Nurse Assessment
            </ToolBtn>
            <ToolBtn onClick={() => setShowOrders(true)} icon={<Plus className="h-4 w-4" />}>
              Add Orders
            </ToolBtn>
            <ToolBtn onClick={() => void startVoiceCapture(STEPS.find((item) => item.id === step)?.label ?? "active section")} icon={<Activity className="h-4 w-4" />}>
              Voice Fill
            </ToolBtn>
            <ToolBtn onClick={() => fileInputRef.current?.click()} icon={<FileText className="h-4 w-4" />}>
              Scan Photo
            </ToolBtn>
            <input
              ref={(el) => (fileInputRef.current = el)}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) console.log("workspace upload", file.name);
              }}
            />
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_260px] 2xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside>
          <CarePathwayRail step={step} setStep={setStep} />
        </aside>

        <main className="space-y-4">
          <div className={`${shellCard} flex items-center gap-2 p-2`}>
            <button
              type="button"
              onClick={() => setRapidMode(false)}
              className={`flex-1 rounded-2xl px-4 py-3 text-center text-sm font-bold ${rapidMode ? "text-muted-foreground" : "bg-navy text-white shadow-soft"}`}
            >
              STANDARD MODE
            </button>
            <button
              type="button"
              onClick={() => {
                setRapidMode(true);
                navigate({ to: "/rapid" });
              }}
              className={`flex-1 rounded-2xl px-4 py-3 text-center text-sm font-bold ${rapidMode ? "bg-coral text-white shadow-soft" : "text-muted-foreground"}`}
            >
              RAPID EMERGENCY MODE
            </button>
          </div>

          <Collapsible title="1. ER Arrival" open={step === "arrival"} onToggle={() => setStep("arrival")}>
            <ArrivalForm />
          </Collapsible>
          <Collapsible title="2. Triage Details" open={step === "triage"} onToggle={() => setStep("triage")}>
            <TriageForm vitals={vitals} setVitals={setVitals} />
          </Collapsible>
          <Collapsible title="3. Medication History" open={step === "medhist"} onToggle={() => setStep("medhist")}>
            <MedHistoryForm />
          </Collapsible>
          <Collapsible title="4. Clinical Assessment" open={step === "clinical"} onToggle={() => setStep("clinical")}>
            <ClinicalForm
              chiefComplaint={chiefComplaint}
              setChiefComplaint={setChiefComplaint}
              pathway={pathway}
              autoPathway={autoPathway}
              setPathwayOverride={setPathwayOverride}
              isOverride={isOverride}
            />
          </Collapsible>
          <Collapsible
            title={`5. ${pathway === "Generic" ? "Generic Medication Order Set" : `${pathway} Order Set`}`}
            open={step === "orders"}
            onToggle={() => setStep("orders")}
          >
            <MedicationOrderSet pathway={pathway} onOrder={(item) => setOrderedItems((current) => [...current, item])} />
          </Collapsible>
          <Collapsible title="6. ER Outcome" open={step === "outcome"} onToggle={() => setStep("outcome")}>
            <EROutcomeFlow patientName={patient.name} pathway={pathway} orderedItems={orderedItems} chiefComplaint={chiefComplaint} />
          </Collapsible>

          <div className={`${shellCard} sticky bottom-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4`}>
            <button
              type="button"
              onClick={() => setShowConsent(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white/75 px-4 py-2 text-sm font-medium text-navy hover:bg-white"
            >
              <Printer className="h-4 w-4" />
              Print Consent
            </button>
            <button
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white shadow-soft hover:opacity-95"
            >
              {step === "clinical" ? (
                <>
                  <Send className="h-4 w-4" />
                  Submit
                </>
              ) : (
                "Next Step"
              )}
            </button>
          </div>
        </main>

        <aside>
          <RightSummaryRail
            vitals={vitals}
            recommendations={recommendations}
            onAddVitals={() => setShowVitals(true)}
            onQuickOrder={() => setShowOrders(true)}
          />
        </aside>
      </div>

      {showOrders && <AddOrdersModal pathway={pathway} onClose={() => setShowOrders(false)} />}
      {showScoring && <ScoringToolsModal pathway={pathway} onClose={() => setShowScoring(false)} />}
        {showVitals && (
          <AddVitalsModal
            initialValues={vitals}
            onSave={(nextVitals) => {
              setVitals((current) => ({
                ...current,
                ...nextVitals,
              }));
            }}
            onClose={() => setShowVitals(false)}
          />
        )}
      {showConsent && <ConsentModal patientName={patient.name} umr={patient.umr} pathway={pathway} onClose={() => setShowConsent(false)} />}
      {notice && <NoticeModal message={notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

function ToolBtn({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="nav-chip inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
      {icon}
      {children}
    </button>
  );
}

function CarePathwayRail({ step, setStep }: { step: StepId; setStep: (step: StepId) => void }) {
  const railItems: { label: string; target: StepId; state: "done" | "active" | "idle" }[] = [
    { label: "Patient Registration", target: "arrival", state: "done" },
    { label: "Arrival and Triage", target: step === "arrival" || step === "triage" ? step : "triage", state: step === "arrival" || step === "triage" ? "active" : "done" },
    { label: "Care Pathway", target: "clinical", state: step === "clinical" ? "active" : step === "orders" || step === "outcome" ? "done" : "idle" },
    { label: "Bed Assignment", target: "outcome", state: "idle" },
    { label: "Orders", target: "orders", state: step === "orders" ? "active" : step === "outcome" ? "done" : "idle" },
    { label: "Discharge", target: "outcome", state: step === "outcome" ? "active" : "idle" },
  ];

  return (
    <div className="rounded-[28px] bg-white p-5 shadow-soft">
      <div className="text-sm font-bold text-navy">Care Pathway</div>
      <ol className="mt-4 space-y-3">
        {railItems.map((item) => (
          <li key={item.label}>
            <button type="button" onClick={() => setStep(item.target)} className="flex w-full items-center gap-3 text-left">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[11px] font-bold ${
                  item.state === "done"
                    ? "border-urgent-safe text-urgent-safe"
                    : item.state === "active"
                      ? "border-coral text-coral"
                      : "border-slate-500 text-transparent"
                }`}
              >
                {item.state === "done" ? "✓" : item.state === "active" ? "!" : ""}
              </span>
              <span className={`text-sm ${item.state === "active" ? "font-bold text-navy" : "text-muted-foreground"}`}>{item.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-7 border-t border-[#dfd1bd] pt-5">
        <div className="text-xs font-bold uppercase text-muted-foreground">Nurse Pending Items</div>
        <div className="mt-3 space-y-2">
          <PendingPill text="Medication History" />
          <PendingPill text="Full Clinical Assessment" />
        </div>
      </div>
    </div>
  );
}

function RightSummaryRail({
  vitals,
  recommendations,
  onAddVitals,
  onQuickOrder,
}: {
  vitals: Record<string, string>;
  recommendations: CopilotRecommendation[];
  onAddVitals: () => void;
  onQuickOrder: () => void;
}) {
  const hasVitals = Object.values(vitals).some(Boolean);
  return (
    <div className="space-y-4">
      <RailCard icon={<HeartPulse className="h-4 w-4" />} title="Vitals" tone="coral">
        {hasVitals ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <MetricRow label="BP" value={`${vitals.sbp}/${vitals.dbp}`} />
            <MetricRow label="HR" value={vitals.hr} />
            <MetricRow label="SpO2" value={vitals.spo2} />
            <MetricRow label="Temp" value={vitals.temp} />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No vitals recorded</div>
        )}
        <button type="button" onClick={onAddVitals} className="mt-3 text-xs font-bold text-coral">
          + Record vitals
        </button>
      </RailCard>

      <RailCard icon={<AlertCircle className="h-4 w-4" />} title="Alerts" tone="coral">
        <div className="text-sm text-destructive">Warning: Allergy: Penicillin</div>
      </RailCard>

      <RailCard icon={<Activity className="h-4 w-4" />} title="Timers" tone="coral">
        <MetricRow label="Since arrival" value="1m 25s" />
        <MetricRow label="Since triage" value="1m 13s" />
        <MetricRow label="Last assessment" value="—" />
      </RailCard>

      <div className="rounded-[24px] bg-[#fff6e7] p-5 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
          <span className="text-coral">✣</span>
          AI Suggestions
        </div>
        {recommendations.length ? (
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((recommendation) => (
              <div
                key={`${recommendation.title}-${recommendation.action}`}
                className="rounded-2xl border border-border bg-white/80 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-navy">{recommendation.title}</div>
                  <span className="rounded-full bg-coral/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-coral">
                    {recommendation.severity}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{recommendation.reason}</div>
                <div className="mt-2 text-xs font-semibold text-navy">{recommendation.action}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select a diagnosis to see AI guidance.</div>
        )}
      </div>

      <RailCard icon={<ClipboardList className="h-4 w-4" />} title="Quick Orders" tone="coral">
        <QuickOrders onOrder={onQuickOrder} />
      </RailCard>
    </div>
  );
}

function RailCard({ icon, title, tone, children }: { icon: ReactNode; title: string; tone: "coral" | "navy"; children: ReactNode }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
        <span className={tone === "coral" ? "text-coral" : "text-navy"}>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function PendingPill({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-[#fbf3e8] px-3 py-2 text-sm text-navy">
      <AlertCircle className="h-4 w-4 text-amber-emerg" />
      <span>{text}</span>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 text-xs last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-navy">{value}</span>
    </div>
  );
}

function QuickOrders({ onOrder }: { onOrder: () => void }) {
  const orders = ["Order CBC", "Order ECG", "Troponin I", "ABG", "Chest X-ray", "IV Cannula"];
  return (
    <div className="grid grid-cols-2 gap-2">
      {orders.map((order) => (
        <button
          key={order}
          type="button"
          onClick={onOrder}
          className="rounded-full border border-border bg-background px-3 py-2 text-[11px] font-semibold text-navy hover:bg-secondary/40"
        >
          {order}
        </button>
      ))}
    </div>
  );
}

function NoticeModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-soft-lg" onClick={(event) => event.stopPropagation()}>
        <div className="text-sm font-bold text-navy">Action ready</div>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ConsentModal({
  patientName,
  umr,
  pathway,
  onClose,
}: {
  patientName: string;
  umr: string;
  pathway: string;
  onClose: () => void;
}) {
  const today = new Date().toLocaleDateString("en-GB");
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/45 p-4" onClick={onClose}>
      <div className="mx-auto my-6 w-full max-w-4xl rounded-2xl bg-white shadow-soft-lg" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 print:hidden">
          <div>
            <div className="text-sm font-bold text-navy">Consent Form</div>
            <div className="text-xs text-muted-foreground">Preview, print, or close.</div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.print()} className="rounded-full bg-navy px-4 py-2 text-xs font-bold text-white">
              Print
            </button>
            <button type="button" onClick={onClose} className="rounded-full border border-border px-4 py-2 text-xs font-bold text-navy">
              Close
            </button>
          </div>
        </div>

        <div className="space-y-5 p-8 text-navy">
          <div className="text-center">
            <div className="text-lg font-black uppercase">Telangana Vaidya Vidhana Parishad</div>
            <div className="mt-1 text-sm font-semibold">Area Hospital, Bhadrachalam</div>
            <div className="mt-4 text-base font-black uppercase tracking-[0.16em]">Consent</div>
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-[#fffdf9] p-4 text-sm md:grid-cols-3">
            <ReadOnly label="Patient" value={patientName} />
            <ReadOnly label="UMR" value={umr} />
            <ReadOnly label="Care Pathway" value={pathway} />
          </div>

          <p className="text-sm leading-7">
            I/We _______________________ have been explained by the attending doctors about the nature of the patient{" "}
            <strong>{patientName}</strong>, the present condition of the patient, the nature of operation/procedure/treatment to be performed,
            the risks involved with regard to the patient's life and the possible disabilities that may result.
          </p>
          <p className="text-sm leading-7">
            I/We have fully understood the implications of the treatment and give consent for operation, anaesthesia, transfusion, medication,
            investigations, procedures, transfer, observation, admission, or other emergency care as may be deemed necessary by the treating team.
          </p>

          <div className="grid gap-6 pt-8 text-sm md:grid-cols-3">
            <div>
              <div className="border-b border-navy pb-8" />
              <div className="mt-2 font-semibold">Patient / Attendant Signature</div>
            </div>
            <div>
              <div className="border-b border-navy pb-8" />
              <div className="mt-2 font-semibold">Relationship</div>
            </div>
            <div>
              <div className="border-b border-navy pb-8">{today}</div>
              <div className="mt-2 font-semibold">Date</div>
            </div>
          </div>

          <div className="grid gap-6 pt-6 text-sm md:grid-cols-2">
            <div>
              <div className="border-b border-navy pb-8" />
              <div className="mt-2 font-semibold">Doctor Signature</div>
            </div>
            <div>
              <div className="border-b border-navy pb-8" />
              <div className="mt-2 font-semibold">Witness Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`${sectionCard} p-5`}>
      <h3 className="mb-4 text-sm font-bold text-navy">{title}</h3>
      {children}
    </div>
  );
}

function L({ label, req, children }: { label: string; req?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-navy">
        {label} {req ? <span className="text-destructive">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="border-b border-border pb-2 text-sm font-bold text-navy">{title}</div>
      {children}
    </section>
  );
}

function SegmentedControl({ options, defaultValue }: { options: string[]; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="inline-flex flex-wrap overflow-hidden rounded-xl border border-border bg-background">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setValue(option)}
            className={`border-r border-border px-3 py-2 text-xs font-semibold last:border-r-0 ${
              active ? "bg-navy text-white" : "text-navy hover:bg-secondary/40"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function Collapsible({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const [locallyCollapsed, setLocallyCollapsed] = useState(false);
  useEffect(() => {
    if (!open) setLocallyCollapsed(false);
  }, [open]);

  const visible = open && !locallyCollapsed;

  return (
    <div className={`${shellCard} overflow-hidden`}>
      <button
        type="button"
        onClick={() => {
          if (open) setLocallyCollapsed((value) => !value);
          else onToggle();
        }}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <span className="text-sm font-bold text-navy">{title}</span>
        <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-muted-foreground">{visible ? "Collapse" : "Expand"}</span>
      </button>
      {visible ? <div className="border-t border-border/70 px-5 pb-5 pt-5">{children}</div> : null}
    </div>
  );
}

function ArrivalForm() {
  return (
    <Card title="ER Arrival">
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <L label="Initial Triage Time" req>
              <input className={inputClass} defaultValue="21/05/2026 10:36" />
            </L>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Future dates and times are disabled in the picker.</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormGroup title="Patient Details">
            <div className="grid gap-3 md:grid-cols-2">
              <L label="Height (cm)">
                <input className={inputClass} placeholder="Enter height" />
              </L>
              <L label="Weight (kg)">
                <input className={inputClass} placeholder="Enter weight" />
              </L>
            </div>
          </FormGroup>

          <FormGroup title="Arrival Details">
            <div className="space-y-3">
              <L label="Mode of arrival to ER" req>
                <SegmentedControl options={["Ambulance", "Walk In"]} defaultValue="Walk In" />
              </L>
              <L label="Informed by" req>
                <select className={selectClass} defaultValue="Self">
                  {["Self", "Police", "Attendant", "Paramedic", "Bystander", "Family Member", "Employer"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </L>
              <L label="Return to ER within 72 hours?">
                <SegmentedControl options={["Yes", "No"]} defaultValue="No" />
              </L>
              <div className="grid gap-3 md:grid-cols-2">
                <L label="Brought By">
                  <input className={inputClass} placeholder="Name / Contact" />
                </L>
                <L label="Ambulance / Referral ID">
                  <input className={inputClass} placeholder="Optional" />
                </L>
              </div>
            </div>
          </FormGroup>
        </div>

        <FormGroup title="Medico-Legal Case (MLC) Details">
          <div className="grid gap-3 md:grid-cols-3">
            <L label="Is this an MLC Case?">
              <SegmentedControl options={["Yes", "No"]} defaultValue="No" />
            </L>
            <L label="Police Station">
              <input className={inputClass} placeholder="If applicable" />
            </L>
            <L label="MLC Number">
              <input className={inputClass} placeholder="If applicable" />
            </L>
          </div>
        </FormGroup>

        <FormGroup title="Referral Information">
          <div className="grid gap-3 md:grid-cols-3">
            <L label="Inward Referral">
              <select className={selectClass}>
                {["Not Applicable", "Primary Care", "Clinic", "Other Hospital", "Police", "EMS"].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </L>
            <L label="Referral Facility">
              <input className={inputClass} placeholder="Facility / doctor" />
            </L>
            <L label="Referral Reason">
              <select className={selectClass}>
                {["Not Applicable", "Higher care", "Imaging", "Specialist opinion", "Bed availability", "Patient request"].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </L>
          </div>
        </FormGroup>
      </div>
    </Card>
  );
}

function TriageForm({
  vitals,
  setVitals,
}: {
  vitals: Record<string, string>;
  setVitals: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const [cond, setCond] = useState("Alert");
  const [score, setScore] = useState(0);
  const [manualTriage, setManualTriage] = useState<number | null>(null);
  const mews = useMemo(() => calculateMews(vitals, cond), [vitals, cond]);
  const autoTriage = mews >= 5 ? 1 : mews >= 2 ? 2 : 3;
  const finalTriage = manualTriage ?? autoTriage;

  return (
    <div className="space-y-4">
      <Card title="Scan Vitals">
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) console.log("triage photo", file.name);
              };
              input.click();
            }}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-navy hover:bg-secondary/40"
          >
            Take Photo
          </button>
          <button
            type="button"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) console.log("triage upload", file.name);
              };
              input.click();
            }}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-navy hover:bg-secondary/40"
          >
            Upload
          </button>
        </div>
        <p className="mt-4 rounded-xl bg-secondary/35 px-4 py-3 text-sm text-muted-foreground">
          Point the camera at the monitor or upload an image to auto-extract vital signs.
        </p>
      </Card>

      <Card title="Vitals and Condition">
        <div className="mb-4">
          <L label="Patient Condition at Arrival" req>
            <div className="flex flex-wrap gap-2">
              {["Alert", "Verbal", "Pain", "Unconsciousness"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCond(c)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    cond === c ? "border-transparent bg-coral text-white shadow-soft" : "border-border bg-background text-navy hover:bg-secondary/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </L>
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {(["sbp", "dbp", "hr", "rr", "spo2", "temp", "grbs"] as const).map((k) => (
            <L key={k} label={k.toUpperCase()} req>
              <input value={vitals[k]} onChange={(e) => setVitals({ ...vitals, [k]: e.target.value })} className={inputClass} />
            </L>
          ))}
          <L label="O2 Mode">
            <select className={inputClass}>
              <option>Room Air</option>
              <option>Nasal</option>
              <option>Mask</option>
            </select>
          </L>
        </div>
      </Card>

      <Card title="Neurological">
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <L label="Eye 1-4">
            <select className={inputClass}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select>
          </L>
          <L label="Verbal 1-5/T">
            <select className={inputClass}>{[1, 2, 3, 4, 5, "T"].map((n) => <option key={n}>{n}</option>)}</select>
          </L>
          <L label="Motor 1-6">
            <select className={inputClass}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>
          </L>
        </div>
        <L label="Pain Score (0-10)">
          <div className="grid grid-cols-6 gap-2 md:grid-cols-11">
            {Array.from({ length: 11 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setScore(i)}
                className={`rounded-xl border py-2 text-sm font-semibold transition ${
                  score === i ? "border-coral bg-coral text-white" : "border-border bg-background text-navy hover:bg-secondary/40"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </L>
      </Card>

      <Card title="Triage Level Detection">
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-2xl bg-secondary/35 p-4">
            <div className="mb-2 text-sm font-bold text-navy">Stratification</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="font-semibold text-navy">MEWS: {mews}</div>
              <div>{">=5"} - Level 1</div>
              <div>2-4 - Level 2</div>
              <div>0-1 - Level 3</div>
              <div className="pt-2 text-xs">
                {manualTriage ? `Doctor override active: Level ${manualTriage}` : `AI assigned: Level ${autoTriage}`}
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setManualTriage(manualTriage === l ? null : l)}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${
                  finalTriage === l ? "border-transparent text-white shadow-soft" : "border-border bg-background text-navy hover:bg-secondary/40"
                }`}
                style={finalTriage === l ? { background: triageMeta[l].color } : undefined}
              >
                <span className="block">Level {l === 1 ? "I" : l === 2 ? "II" : "III"}</span>
                <span className={`mt-1 block text-xs ${finalTriage === l ? "text-white/85" : "text-muted-foreground"}`}>
                  {triageMeta[l].label}
                  {autoTriage === l ? " · AI" : ""}
                  {manualTriage === l ? " · Doctor override" : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
        {manualTriage ? (
          <button type="button" onClick={() => setManualTriage(null)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-coral">
            <RotateCcw className="h-4 w-4" />
            Reset to MEWS AI level
          </button>
        ) : null}
      </Card>
    </div>
  );
}

function calculateMews(vitals: Record<string, string>, condition: string) {
  const sbp = Number(vitals.sbp);
  const hr = Number(vitals.hr);
  const rr = Number(vitals.rr);
  const temp = Number(vitals.temp);
  const spo2 = Number(vitals.spo2);

  let score = 0;
  if (rr <= 8) score += 2;
  else if (rr >= 30) score += 3;
  else if (rr >= 21) score += 2;
  else if (rr >= 15) score += 1;

  if (hr <= 40 || hr >= 130) score += 3;
  else if (hr >= 111) score += 2;
  else if ((hr >= 41 && hr <= 50) || (hr >= 101 && hr <= 110)) score += 1;

  if (sbp <= 70 || sbp >= 200) score += 3;
  else if (sbp <= 80) score += 2;
  else if (sbp <= 100) score += 1;

  if (temp < 35 || temp >= 38.5) score += 2;
  if (spo2 && spo2 < 90) score += 3;
  else if (spo2 && spo2 < 94) score += 1;

  if (condition === "Verbal") score += 1;
  if (condition === "Pain") score += 2;
  if (condition === "Unconsciousness") score += 3;
  return score;
}

function MedHistoryForm() {
  return (
    <Card title="Medication History">
      <div className="grid gap-4 md:grid-cols-2">
        <L label="Current Medications">
          <textarea rows={3} className={inputClass} placeholder="List medications, dose, frequency..." />
        </L>
        <L label="Known Allergies">
          <textarea rows={3} className={`${inputClass} border-destructive bg-destructive/5`} placeholder="None reported" />
        </L>
        <L label="Past Medical History">
          <textarea rows={3} className={inputClass} placeholder="HTN, DM, CAD..." />
        </L>
        <L label="Surgical History">
          <textarea rows={3} className={inputClass} placeholder="Past procedures" />
        </L>
        <L label="Family History">
          <input className={inputClass} />
        </L>
        <L label="Social History">
          <input className={inputClass} placeholder="Smoking, alcohol, occupation" />
        </L>
      </div>
    </Card>
  );
}

function ClinicalForm({
  chiefComplaint,
  setChiefComplaint,
  pathway,
  autoPathway,
  setPathwayOverride,
  isOverride,
}: {
  chiefComplaint: string;
  setChiefComplaint: (value: string) => void;
  pathway: string;
  autoPathway: string;
  setPathwayOverride: (value: string | null) => void;
  isOverride: boolean;
}) {
  const selectedPathway = pathway;

  return (
    <div className="space-y-4">
      <Card title="ABCD Assessment">
        <div className="grid gap-4 lg:grid-cols-2">
          <ABC letter="A" name="Airway" clearLabel="Patent & Protected" concernLabel="Compromised" badges={["Patent", "ETT", "Cric"]} />
          <ABC letter="B" name="Breathing" clearLabel="Spontaneous" concernLabel="Abnormal" badges={["Stable", "Apnea"]} />
          <ABC letter="C" name="Circulation" clearLabel="Adequate" concernLabel="Inadequate" badges={["Stable", "Poor-IV", "Poor-fluid"]} />
          <ABC letter="D" name="Disability" clearLabel="Clear" concernLabel="Concern" badges={["GCS 0/15 - U - Unresponsive"]} />
        </div>
      </Card>

      <Card title="History">
        <L label="History of Present Illness" req>
          <textarea rows={3} className={inputClass} placeholder="none" />
        </L>
        <div className="mt-4">
          <L label="Known Allergies" req>
            <textarea rows={2} className={inputClass} placeholder="none" />
          </L>
        </div>
      </Card>

      <Card title="Symptoms and Chief Complaint">
        <ChiefComplaintSearch value={chiefComplaint} onChange={setChiefComplaint} />
      </Card>

      <Card title="Care Pathway">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-2xl text-xs text-muted-foreground">
            Auto-selected based on triage and chief complaint. Doctors can still override the pathway based on bedside evaluation.
          </p>
          {isOverride ? (
            <button type="button" onClick={() => setPathwayOverride(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-coral">
              <RotateCcw className="h-4 w-4" />
              Reset to auto ({autoPathway})
            </button>
          ) : null}
        </div>
        <PathwayPicker
          value={selectedPathway}
          autoPathway={autoPathway}
          onChange={(nextPathway) => setPathwayOverride(nextPathway === autoPathway ? null : nextPathway)}
        />
        <div className="mt-4 rounded-2xl bg-mint/40 p-4 text-sm text-navy">
          <strong>{pathway}</strong> pathway selected. Use <strong>Add Orders</strong> to trigger pathway-specific investigations, medications, infusions, and procedures.
          <span className="mt-1 block text-xs text-muted-foreground">Pathway-specific assessment forms can be layered in later without changing this content model.</span>
        </div>
      </Card>

      <PathwayAssessmentForm pathway={selectedPathway} />

      <Card title="Bed Assignment">
        <L label="Bed Number" req>
          <select className={inputClass}>
            <option>Select bed number</option>
            <option>ER-04</option>
            <option>ER-07</option>
            <option>OBS-01</option>
          </select>
        </L>
      </Card>
    </div>
  );
}

function GenericPathwayTabs() {
  const [tab, setTab] = useState("personal");
  const tabs = [
    { id: "personal", label: "Personal History" },
    { id: "systemic", label: "Systemic Assessment" },
    { id: "diagnosis", label: "Referral and Diagnosis" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-xl bg-secondary/35 p-1 md:grid-cols-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === item.id ? "bg-card text-navy shadow-soft" : "text-muted-foreground hover:text-navy"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "personal" ? <GenericPersonalHistory /> : null}
      {tab === "systemic" ? <SystemicAssessmentForm /> : null}

      {tab === "diagnosis" ? (
        <GenericReferralDiagnosis />
      ) : null}
    </div>
  );
}

function GenericPersonalHistory() {
  const [surgeries, setSurgeries] = useState([{ procedure: "", doneBy: "", findings: "", date: "" }]);
  const [lastRemovedSurgery, setLastRemovedSurgery] = useState<{ procedure: string; doneBy: string; findings: string; date: string } | null>(null);

  return (
    <div className="space-y-4">
      <SystemicGroup title="Medical History & Comorbidities">
        <L label="Comorbidities" req>
          <SearchableMultiSelect
            placeholder="Select comorbidities..."
            options={[
              "Diabetes Mellitus",
              "Hypertension",
              "Coronary Artery Disease",
              "Previous Stroke/TIA",
              "Asthma",
              "COPD",
              "Chronic Kidney Disease",
              "Chronic Liver Disease",
              "Epilepsy",
              "Pregnancy",
              "Immunosuppression",
              "Cancer",
              "None",
            ]}
          />
        </L>
        <L label="Medical History Details">
          <textarea rows={3} className={inputClass} placeholder="Medical History Details" />
        </L>
      </SystemicGroup>

      <SystemicGroup title="Surgical History">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-navy">Surgical History</div>
          <span className="rounded-full bg-secondary/45 px-3 py-1 text-[11px] text-muted-foreground">All fields optional</span>
        </div>
        <div className="grid gap-2 md:grid-cols-[1.25fr_0.9fr_1.25fr_0.7fr_32px]">
          <div className="text-xs font-bold text-muted-foreground">Procedure Name</div>
          <div className="text-xs font-bold text-muted-foreground">Done By</div>
          <div className="text-xs font-bold text-muted-foreground">Key Findings</div>
          <div className="text-xs font-bold text-muted-foreground">Date</div>
          <div />
          {surgeries.map((surgery, index) => (
            <div key={index} className="contents">
              <input
                value={surgery.procedure}
                onChange={(event) => setSurgeries((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, procedure: event.target.value } : item)))}
                className={inputClass}
                placeholder="Procedure name"
              />
              <input
                value={surgery.doneBy}
                onChange={(event) => setSurgeries((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, doneBy: event.target.value } : item)))}
                className={inputClass}
                placeholder="Done by"
              />
              <input
                value={surgery.findings}
                onChange={(event) => setSurgeries((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, findings: event.target.value } : item)))}
                className={inputClass}
                placeholder="Key findings"
              />
              <input
                type="date"
                value={surgery.date}
                onChange={(event) => setSurgeries((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, date: event.target.value } : item)))}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  setLastRemovedSurgery(surgery);
                  setSurgeries((current) => current.filter((_, itemIndex) => itemIndex !== index));
                }}
                className="grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50"
                aria-label="Remove surgery"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {surgeries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white px-3 py-4 text-sm text-muted-foreground">No surgical history added yet</div>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={!lastRemovedSurgery}
            onClick={() => {
              if (lastRemovedSurgery) {
                setSurgeries((current) => [...current, lastRemovedSurgery]);
                setLastRemovedSurgery(null);
              }
            }}
            className="rounded-lg border border-border bg-white px-4 py-2 text-xs font-bold text-navy disabled:cursor-not-allowed disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => setSurgeries((current) => [...current, { procedure: "", doneBy: "", findings: "", date: "" }])}
            className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-soft hover:bg-blue-700"
          >
            + Add Surgery
          </button>
        </div>
      </SystemicGroup>

      <SystemicGroup title="Personal History">
        <L label="Habits" req>
          <FastChecklist options={["Smoking", "Tobacco", "Alcohol", "Gutka", "BMI > 30", "None"]} />
        </L>
        <L label="Details">
          <textarea rows={3} className={inputClass} placeholder="Details" />
        </L>
        <div className="grid gap-3 md:grid-cols-2">
          <L label="Family History">
            <textarea rows={2} className={inputClass} placeholder="Family History" />
          </L>
          <L label="Last Feed Time" req>
            <input className={inputClass} placeholder="Last Feed Time" />
          </L>
        </div>
      </SystemicGroup>
    </div>
  );
}

function GenericReferralDiagnosis() {
  return (
    <div className="space-y-4">
      <SystemicGroup title="Referral and Diagnosis">
        <L label="Provisional Diagnosis" req>
          <textarea rows={3} className={inputClass} placeholder="Provisional Diagnosis" />
        </L>
        <L label="Speciality Referrals">
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Optional</div>
            <button type="button" className="rounded-full border border-coral px-4 py-2 text-xs font-bold text-coral hover:bg-coral/10">
              Add Referral
            </button>
          </div>
        </L>
        <L label="Initial Assessment Completion Time">
          <input className={inputClass} placeholder="Initial Assessment Completion Time" />
        </L>
      </SystemicGroup>
    </div>
  );
}

function SearchableMultiSelect({ options, placeholder }: { options: string[]; placeholder: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const matches = options.filter((option) => option.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  return (
    <div className="space-y-2">
      <input value={query} onChange={(event) => setQuery(event.target.value)} className={inputClass} placeholder={placeholder} />
      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSelected((current) => current.filter((value) => value !== item))}
            className="rounded-full bg-navy px-3 py-1.5 text-[11px] font-semibold text-white"
          >
            {item} Remove
          </button>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {matches.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              if (!selected.includes(option)) setSelected((current) => [...current, option]);
              setQuery("");
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-left text-xs font-semibold text-navy hover:bg-secondary/40"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChiefComplaintSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const normalizedValue = value.trim().toLowerCase();
  const filtered = useMemo(() => {
    const matches = CHIEF_COMPLAINT_OPTIONS.filter((option) => option.toLowerCase().includes(normalizedValue));
    return (normalizedValue ? matches : CHIEF_COMPLAINT_OPTIONS).slice(0, 18);
  }, [normalizedValue]);

  return (
    <L label="Chief Complaint" req>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder="Search chief complaint or type custom..."
          className={`${inputClass} pr-10`}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {open ? (
          <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-border bg-white p-2 shadow-soft-lg">
            {filtered.length ? (
              filtered.map((option) => (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-navy hover:bg-secondary/45"
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="rounded-xl px-3 py-2 text-xs text-muted-foreground">No match. Keep typing to use a custom chief complaint.</div>
            )}
          </div>
        ) : null}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">Search list is seeded from the clinical assessment reference and ED chief-complaint categories; custom entries are allowed.</div>
    </L>
  );
}

function PathwayPicker({
  value,
  autoPathway,
  onChange,
}: {
  value: string;
  autoPathway: string;
  onChange: (pathway: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {PATHWAY_PICKER.map((item) => {
          const active = value === item.pathway;
          const isAuto = autoPathway === item.pathway;
          const triage = triageMeta[item.severity];
          return (
            <button
              key={item.pathway}
              type="button"
              onClick={() => onChange(item.pathway)}
              className={`rounded-xl border bg-card p-3 text-left transition-all hover:bg-secondary/25 ${
                active ? "border-transparent ring-2 shadow-soft" : "border-border"
              }`}
              style={active ? { boxShadow: `inset 0 0 0 2px ${triage.color}` } : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary/45 text-navy">{pathwayIcon(item.pathway)}</span>
                {isAuto ? <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-bold text-coral">AUTO</span> : null}
              </div>
              <div className="mt-2 text-xs font-bold text-navy">{item.label}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">{item.pathway}</div>
            </button>
          );
        })}
      </div>
      <div className="text-[11px] text-muted-foreground">
        Auto-selected: <span className="font-semibold text-navy">{autoPathway}</span>. Doctor can override by tapping any pathway.
      </div>
    </div>
  );
}

function pathwayIcon(pathway: string) {
  if (pathway === "Generic") return <Plus className="h-4 w-4" />;
  if (pathway === "Chest Pain") return <HeartPulse className="h-4 w-4" />;
  if (pathway === "Stroke") return <Activity className="h-4 w-4" />;
  if (pathway === "Sepsis") return <FlaskConical className="h-4 w-4" />;
  if (pathway === "Shortness of Breath") return <Stethoscope className="h-4 w-4" />;
  if (pathway === "Poisoning") return <AlertCircle className="h-4 w-4" />;
  if (pathway === "Polytrauma") return <ClipboardList className="h-4 w-4" />;
  if (pathway === "Snakebite") return <Pill className="h-4 w-4" />;
  if (pathway === "Pneumonia") return <HeartPulse className="h-4 w-4" />;
  return <Plus className="h-4 w-4" />;
}

const PATHWAY_TREES: Record<string, { title: string; nodes: { title: string; questions: string[] }[] }> = {
  "Chest Pain": {
    title: "Chest Pain Assessment",
    nodes: [
      { title: "ECG Findings", questions: ["STEMI assessment", "Raised ST elevation present", "New T wave inversion", "Presence of Q waves", "Presence of left bundle branch block", "NSTEMI Assessment", "ST Elevation high", "ST Depression low", "T inversion/Non Diagnostic", "Arrhythmias/ Heart Failure", "No STEMI and NSTEMI Findings", "No findings of STEMI and NSTEMI", "Other ECG Findings", "Seen by", "Date and Time"] },
      { title: "Chief Complaint", questions: ["Chest pain onset", "Pain character", "Radiation", "Associated sweating", "Breathlessness"] },
      { title: "Personal History", questions: ["Known CAD", "Diabetes", "Hypertension", "Smoking", "Prior intervention"] },
      { title: "Systemic Assessment", questions: ["General Assessment", "Cardiovascular System Assessment", "Per Abdomen Assessment", "Respiratory System Assessment", "Central Nervous System"] },
      { title: "Referral and Diagnosis", questions: ["Provisional Diagnosis", "Speciality Referrals", "Seen by", "Date and Time"] },
    ],
  },
  Stroke: {
    title: "Stroke Assessment",
    nodes: [
      { title: "Stroke Assessment", questions: ["Findings from CT Scan or MRI", "Ischemic Stroke", "IC Bleed", "No findings in the CT Scan or MRI", "Location of Clot/Bleed"] },
      { title: "Chief Complaint", questions: ["Weakness", "Facial deviation", "Speech disturbance", "Seizure", "Headache"] },
      { title: "Patient History", questions: ["Prior stroke", "Anticoagulant use", "Diabetes", "Hypertension"] },
      { title: "Examination", questions: ["GCS", "Pupils", "Motor power", "Cranial nerves"] },
      { title: "Neurological", questions: ["NIHSS estimate", "Dysphagia screen", "Cerebellar signs", "Sensory deficit"] },
      { title: "Referral and Diagnosis", questions: ["Provisional Diagnosis", "Neurology Referral", "CT/MRI advice", "Seen by"] },
    ],
  },
  Sepsis: {
    title: "Sepsis Assessment",
    nodes: [
      { title: "Lab Results", questions: ["Scan / upload lab report", "Take Photo", "Upload", "Blood gas", "pH", "PaCO2, mmHg", "PaO2, mmHg", "FiO2, fraction", "PaO2/FiO2 (computed)", "Electrolytes & metabolites", "Potassium", "Sodium", "Calcium", "Chloride", "Lactate", "Haematocrit", "Haematology & other", "WBC", "Bands", "Platelets", "Creatinine", "Total bilirubin", "INR", "aPTT sec"] },
      { title: "Sepsis Assessment", questions: ["Suspected source", "qSOFA", "Fluid response", "Vasopressor need"] },
      { title: "Patient History", questions: ["Fever duration", "Recent antibiotics", "Immunosuppression", "Comorbidities"] },
      { title: "Systemic Assessment", questions: ["General Assessment", "Cardiovascular System Assessment", "Per Abdomen Assessment", "Respiratory System Assessment", "Central Nervous System"] },
      { title: "Referral and Diagnosis", questions: ["Provisional Diagnosis", "Speciality Referrals", "Seen by", "Date and Time"] },
    ],
  },
  "Shortness of Breath": {
    title: "Respiratory Assessment",
    nodes: [
      { title: "Pathway Protocols", questions: ["Respiratory Distress", "Asthma Protocol", "COPD Protocol", "Oxygen escalation"] },
      { title: "Patient History", questions: ["Dyspnea duration", "Cough", "Fever", "Chest pain", "Prior lung disease"] },
      { title: "Systemic Assessment", questions: ["General Assessment", "Cardiovascular System Assessment", "Per Abdomen Assessment", "Respiratory System Assessment", "Central Nervous System"] },
      { title: "Referral and Diagnosis", questions: ["Provisional Diagnosis", "Speciality Referrals", "Seen by", "Date and Time"] },
    ],
  },
  Poisoning: {
    title: "Poisoning Assessment",
    nodes: [
      { title: "Pathway Protocols", questions: ["Toxicology Protocol", "OP Poisoning", "Antidote requirement", "Decontamination need"] },
      { title: "Patient History", questions: ["Substance", "Time of ingestion", "Quantity", "Intentional / accidental"] },
      { title: "Systemic Assessment", questions: ["General Assessment", "Cardiovascular System Assessment", "Per Abdomen Assessment", "Respiratory System Assessment", "Central Nervous System"] },
      { title: "Referral and Diagnosis", questions: ["Provisional Diagnosis", "Speciality Referrals", "Seen by", "Date and Time"] },
    ],
  },
  Polytrauma: {
    title: "Trauma Assessment",
    nodes: [
      { title: "Initial Trauma", questions: ["Type of Injury", "Additional Details", "High-Risk Medications", "Last Meal/Drink", "Trauma Categorisation"] },
      { title: "Examination", questions: ["Interactive Body Map", "TBSA %", "Add injury", "Burns 100%", "Additional findings", "Door-to-CT (mins)"] },
      { title: "Personal History", questions: ["Medical History & Comorbidities", "Surgical History", "Personal History", "Allergies"] },
      { title: "Systemic Assessment", questions: ["General Assessment", "Cardiovascular System Assessment", "Per Abdomen Assessment", "Respiratory System Assessment", "Central Nervous System"] },
      { title: "Referral and Diagnosis", questions: ["Provisional Diagnosis", "Speciality Referrals", "Seen by", "Date and Time"] },
    ],
  },
  Snakebite: {
    title: "Snakebite Assessment",
    nodes: [
      { title: "Bite Assessment", questions: ["Hours Since Bite", "Suspected Species", "Evidentiary Signs", "Local Severity", "Neurotoxic Signs", "Hemotoxic Signs", "20 Min WBCT"] },
      { title: "Personal History", questions: ["Medical History & Comorbidities", "Comorbidities", "Medical History Details", "Surgical History", "Personal History", "Habits"] },
      { title: "Systemic Assessment", questions: ["General Assessment", "Cardiovascular System Assessment", "Per Abdomen Assessment", "Respiratory System Assessment", "Central Nervous System"] },
      { title: "Referral and Diagnosis", questions: ["Provisional Diagnosis", "Speciality Referrals", "Seen by", "Date and Time"] },
    ],
  },
  Pneumonia: {
    title: "Pneumonia Assessment",
    nodes: [
      { title: "Pathway Protocols", questions: ["CAP Protocol", "HAP Protocol", "Aspiration risk", "Antibiotic timing"] },
      { title: "Patient History", questions: ["Cough/fever duration", "Sputum", "Breathlessness", "Comorbidities"] },
      { title: "Systemic Assessment", questions: ["General Assessment", "Cardiovascular System Assessment", "Per Abdomen Assessment", "Respiratory System Assessment", "Central Nervous System"] },
      { title: "Referral and Diagnosis", questions: ["Provisional Diagnosis", "Speciality Referrals", "Seen by", "Date and Time"] },
    ],
  },
};

function PathwayAssessmentForm({ pathway }: { pathway: string }) {
  if (pathway === "Generic") {
    return (
      <Card title="Generic Pathway">
        <GenericPathwayTabs />
      </Card>
    );
  }

  const config = PATHWAY_TREES[pathway] ?? PATHWAY_TREES["Chest Pain"];
  return (
    <Card title={config.title}>
      <PathwayNodeTabs nodes={config.nodes} />
    </Card>
  );
}

function PathwayNodeTabs({ nodes }: { nodes: { title: string; questions: string[] }[] }) {
  const [active, setActive] = useState(nodes[0]?.title ?? "");
  const node = nodes.find((item) => item.title === active) ?? nodes[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm" style={{ gridTemplateColumns: `repeat(${Math.min(nodes.length, 6)}, minmax(0, 1fr))` }}>
        {nodes.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActive(item.title)}
            className={`rounded-md px-2 py-2 text-[11px] font-semibold ${active === item.title ? "bg-slate-800 text-white" : "text-slate-700 hover:bg-slate-100"}`}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-bold text-navy">{node.title}</div>
        {node.title === "Bite Assessment" ? <SnakebiteBiteAssessment /> : null}
        {node.title === "Examination" && node.questions.includes("Interactive Body Map") ? <TraumaBodyMap /> : null}
        {node.title === "Systemic Assessment" ? <SystemicAssessmentForm /> : null}
        {!["Bite Assessment", "Systemic Assessment"].includes(node.title) && !(node.title === "Examination" && node.questions.includes("Interactive Body Map")) ? (
          <div className="grid gap-3 md:grid-cols-2">
            {node.questions.map((question) => (
              <FastQuestion key={question} question={question} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FastQuestion({ question }: { question: string }) {
  const lower = question.toLowerCase();
  if (lower.includes("diagnosis") || lower.includes("notes") || lower.includes("findings")) {
    return (
      <L label={question}>
        <textarea rows={3} className={inputClass} placeholder={question} />
      </L>
    );
  }

  return (
    <L label={question}>
      <FastChoice options={["Yes", "No", "N/A"]} />
    </L>
  );
}

function FastChoice({ options, color = "navy" }: { options: string[]; color?: "navy" | "critical" | "urgent" }) {
  const [value, setValue] = useState(options[0]);
  const activeClass =
    color === "critical" ? "bg-urgent-critical text-white" : color === "urgent" ? "bg-coral text-white" : "bg-navy text-white";

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setValue(option)}
          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${value === option ? activeClass : "border-border bg-background text-navy hover:bg-secondary/40"}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function FastSignGrid({ questions, tone }: { questions: string[]; tone: "critical" | "urgent" }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {questions.map((question) => (
        <L key={question} label={question}>
          <FastChoice options={["Present", "Absent", "Unknown"]} color={tone} />
        </L>
      ))}
    </div>
  );
}

function SystemicAssessmentForm() {
  return (
    <div className="space-y-4">
      <SystemicGroup title="General Assessment" optional>
        <FastChecklist options={["Pallor", "Icterus", "Cyanosis", "Clubbing", "Koilonychia", "Lymphadenopathy", "Edema"]} />
        <L label="Notes (Optional)">
          <textarea rows={2} className={inputClass} placeholder="Notes (Optional)" />
        </L>
      </SystemicGroup>

      <SystemicGroup title="Cardiovascular System Assessment" optional>
        <L label="Pulse Assessment">
          <div className="grid gap-3 md:grid-cols-3">
            <FastChoice options={["Regular", "Irregular", "Sinus Arrhythmia", "Other"]} />
            <FastChoice options={["Weak", "Normal", "Strong"]} />
            <FastChoice options={["Smooth Upstroke", "Gradual Downstroke"]} />
          </div>
        </L>
        <L label="Heart Sounds">
          <FastChecklist options={["S1", "S2", "S3", "S4", "MURMURS"]} />
        </L>
        <L label="Cardiovascular Clinical Signs">
          <div className="grid gap-3 md:grid-cols-2">
            <FastChoice options={["JVP Normal", "JVP Distended"]} />
            <FastChoice options={["Edema 0", "+", "++", "+++"]} />
            <FastChoice options={["Diaphoresis Present", "Diaphoresis Absent"]} color="urgent" />
            <FastChoice options={["Anxiety Yes", "Anxiety No"]} />
            <FastChoice options={["All Peripheral Pulses Normal", "Abnormal"]} />
            <FastChoice options={["Carotid Bruit Present", "Nil"]} />
          </div>
        </L>
        <L label="Notes (Optional)">
          <textarea rows={2} className={inputClass} placeholder="Cardiovascular notes" />
        </L>
      </SystemicGroup>

      <SystemicGroup title="Per Abdomen Assessment" optional>
        <div className="grid gap-3 md:grid-cols-2">
          <L label="Abdomen">
            <FastChoice options={["Soft and Non-Tender", "Soft and Tender", "Hard and Tender", "Soft and Distended", "Hard and Distended"]} />
          </L>
          <L label="Bowel Sounds">
            <FastChoice options={["Present", "Absent"]} />
          </L>
          <L label="Organomegaly">
            <FastChoice options={["Yes", "No"]} />
          </L>
          <L label="Notes (Optional)">
            <textarea rows={2} className={inputClass} placeholder="Abdominal notes" />
          </L>
        </div>
      </SystemicGroup>

      <SystemicGroup title="Respiratory System Assessment" optional>
        <div className="grid gap-3 md:grid-cols-2">
          <L label="Air Entry">
            <FastChoice options={["Normal", "Decreased", "Absent"]} />
          </L>
          <L label="Breath Sound Laterality">
            <FastChoice options={["Bilateral", "Unilateral"]} />
          </L>
          <L label="Left Lung">
            <FastChoice options={["Clear", "Wheezes", "Other"]} />
          </L>
          <L label="Right Lung">
            <FastChoice options={["Clear", "Wheezes", "Other"]} />
          </L>
          <L label="Notes (Optional)">
            <textarea rows={2} className={inputClass} placeholder="Respiratory notes" />
          </L>
        </div>
      </SystemicGroup>

      <SystemicGroup title="Central Nervous System">
        <div className="grid gap-3 md:grid-cols-2">
          <L label="Neurocognitive Function">
            <FastChoice options={["Alert", "Confused", "Drowsy", "Unresponsive"]} color="urgent" />
          </L>
          <L label="Notes (Optional)">
            <textarea rows={2} className={inputClass} placeholder="CNS notes" />
          </L>
        </div>
      </SystemicGroup>
    </div>
  );
}

function SystemicGroup({ title, optional, children }: { title: string; optional?: boolean; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-[#fffdf9] p-4">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-2">
        <div className="text-sm font-bold text-navy">{title}</div>
        {optional ? <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Optional</span> : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function FastChecklist({ options }: { options: string[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => setSelected((current) => (active ? current.filter((item) => item !== option) : [...current, option]))}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
              active ? "border-coral bg-coral text-white" : "border-border bg-background text-navy hover:bg-secondary/40"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function TraumaBodyMap() {
  const [activeSites, setActiveSites] = useState<string[]>(["Chest"]);
  const bodySites = ["Scalp", "Face", "Neck", "Chest", "Abdomen", "Pelvis", "L shoulder", "R shoulder", "L upper arm", "R upper arm", "L forearm", "R forearm", "L thigh", "R thigh", "L knee", "R knee", "L foot", "R foot"];
  const toggleSite = (site: string) => {
    setActiveSites((current) => (current.includes(site) ? current.filter((item) => item !== site) : [...current, site]));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-[#fbfaf6] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-navy">Interactive Body Map</div>
            <div className="text-[11px] text-muted-foreground">Tap a body segment to add an injury marker. Injuries are captured anterior by default.</div>
          </div>
          <div className="flex items-center gap-2">
            <L label="TBSA %">
              <input className={inputClass} defaultValue="100%" />
            </L>
            <button type="button" className="rounded-full bg-coral px-4 py-2 text-xs font-bold text-white">
              Add injury
            </button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="mb-2 text-center text-xs font-bold text-muted-foreground">Patient anatomy · Anterior</div>
            <div className="mx-auto grid max-w-[210px] grid-cols-3 gap-2 text-[10px] font-bold">
              <BodyCell site="Scalp" activeSites={activeSites} toggleSite={toggleSite} className="col-start-2 rounded-full" />
              <BodyCell site="L shoulder" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="Chest" activeSites={activeSites} toggleSite={toggleSite} className="row-span-2" />
              <BodyCell site="R shoulder" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="L upper arm" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="R upper arm" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="Abdomen" activeSites={activeSites} toggleSite={toggleSite} className="col-start-2" />
              <BodyCell site="L thigh" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="Pelvis" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="R thigh" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="L knee" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="Neck" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="R knee" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="L foot" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="Face" activeSites={activeSites} toggleSite={toggleSite} />
              <BodyCell site="R foot" activeSites={activeSites} toggleSite={toggleSite} />
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-bold text-navy">Injuries</div>
            <div className="grid gap-2 md:grid-cols-2">
              {bodySites.map((site, index) => (
                <button
                  key={site}
                  type="button"
                  onClick={() => toggleSite(site)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold ${
                    activeSites.includes(site) ? "border-coral bg-[#fff2ea] text-navy" : "border-border bg-white text-muted-foreground"
                  }`}
                >
                  {index + 1} {site} ANT
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <L label="Burn sites">
                <FastChoice options={["Base / unmarked", "Superficial", "Partial thickness", "Full thickness"]} color="urgent" />
              </L>
              <L label="Additional findings">
                <textarea rows={3} className={inputClass} placeholder="Free-text examination notes" />
              </L>
              <L label="Door-to-CT (mins)">
                <input className={inputClass} placeholder="Door-to-CT (mins)" />
              </L>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BodyCell({
  site,
  activeSites,
  toggleSite,
  className = "",
}: {
  site: string;
  activeSites: string[];
  toggleSite: (site: string) => void;
  className?: string;
}) {
  const active = activeSites.includes(site);
  return (
    <button
      type="button"
      onClick={() => toggleSite(site)}
      className={`min-h-12 rounded-2xl border px-2 py-3 transition ${
        active ? "border-coral bg-coral text-white shadow-soft" : "border-border bg-[#f5f1e8] text-navy hover:bg-secondary/50"
      } ${className}`}
    >
      {site}
    </button>
  );
}

function SnakebiteBiteAssessment() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <L label="Hours Since Bite" req>
          <FastChoice options={["<1 hr", "1-4 hrs", "4-12 hrs", ">12 hrs", "Unknown"]} color="urgent" />
        </L>
        <L label="Suspected Species" req>
          <FastChoice options={["Unknown", "Viper", "Elapid", "Sea Snake"]} color="critical" />
        </L>
        <L label="Evidentiary Signs" req>
          <FastChoice options={["Fang Marks", "Local Pain"]} />
        </L>
        <L label="Local Severity" req>
          <FastChoice options={["Mild", "Moderate", "Severe", "Necrosis", "Compartment Syn."]} color="urgent" />
        </L>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="mb-3 text-sm font-bold text-navy">Neurotoxic Signs</div>
          <FastSignGrid questions={["Ptosis", "Paralysis", "Diplopia", "Dysphagia", "Resp. Failure"]} tone="critical" />
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="mb-3 text-sm font-bold text-navy">Hemotoxic Signs</div>
          <FastSignGrid questions={["Spont. Bleeding", "Hematuria", "Epistaxis", "Ecchymosis"]} tone="urgent" />
        </div>
      </div>
      <L label="20 Min WBCT" req>
        <FastChoice options={["GLASS TUBE USED", "Clotted (Normal)", "Non-Clotted (Coagulopathy)", "Not Done"]} color="critical" />
      </L>
    </div>
  );
}

function MedicationOrderSet({ pathway, onOrder }: { pathway: string; onOrder: (item: OrderedItem) => void }) {
  const [tab, setTab] = useState("investigations");
  const [override, setOverride] = useState(false);
  const recommendation =
    pathway === "Chest Pain"
      ? "AI recommendation: ECG, Troponin I, Aspirin 325 mg stat, Atorvastatin 80 mg, Cardiology review."
      : pathway === "Sepsis"
        ? "AI recommendation: CBC, lactate, blood cultures, IV crystalloid, broad-spectrum antibiotic per policy."
        : pathway === "Generic"
          ? "AI recommendation: CBC, RFT, LFT, ECG if indicated, analgesic/antiemetic as clinically appropriate."
          : `AI recommendation: ${pathway} protocol investigations, first-line medications, and specialist review based on entered assessment.`;
  const tabs = [
    { id: "investigations", label: "Investigations", Icon: FlaskConical },
    { id: "medications", label: "Medications", Icon: Pill },
    { id: "infusions", label: "Infusions", Icon: Activity },
    { id: "procedures", label: "Procedures", Icon: Stethoscope },
  ];

  return (
    <Card title={pathway === "Generic" ? "Generic Medication Order Set" : `${pathway} Order Set`}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-mint/35 p-4 text-xs text-navy">
          <div className="font-bold">AI Recommendations</div>
          <p className="mt-1 text-muted-foreground">{recommendation}</p>
          <label className="mt-3 flex items-center gap-2 font-semibold">
            <input type="checkbox" checked={override} onChange={(event) => setOverride(event.target.checked)} className="h-4 w-4 accent-coral" />
            Doctor override: ignore recommendation and enter custom orders
          </label>
        </div>

        <div className="grid gap-2 rounded-xl bg-secondary/35 p-1 md:grid-cols-4">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                tab === id ? "bg-card text-navy shadow-soft" : "text-muted-foreground hover:text-navy"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "investigations" ? (
          <OrderFields
            primaryLabel="Select Lab Panel"
            primaryOptions={["CBC", "Renal Panel", "Liver Panel", "Cardiac Panel", "ABG", "Urine Routine"]}
            notesLabel="Comments / Rationale"
            custom={override}
            category="investigation"
            onOrder={onOrder}
          />
        ) : null}
        {tab === "medications" ? (
          <OrderFields
            primaryLabel="Select Medication"
            primaryOptions={["Aspirin", "Atorvastatin", "Clopidogrel", "Heparin", "Adrenaline", "Paracetamol", "Ondansetron"]}
            notesLabel="Dose / route / frequency / comments"
            custom={override}
            category="medication"
            onOrder={onOrder}
          />
        ) : null}
        {tab === "infusions" ? (
          <OrderFields
            primaryLabel="Select Drug / Fluid"
            primaryOptions={["Normal Saline 0.9%", "Ringer's Lactate", "Dextrose 5%", "Noradrenaline", "Insulin Infusion"]}
            notesLabel="Rate / method / instructions"
            custom={override}
            category="medication"
            onOrder={onOrder}
          />
        ) : null}
        {tab === "procedures" ? (
          <OrderFields
            primaryLabel="Select Procedure"
            primaryOptions={["Intubation", "Central Line", "Chest Tube", "Defibrillation", "Foley Catheterization"]}
            notesLabel="Procedure details"
            custom={override}
            category="investigation"
            onOrder={onOrder}
          />
        ) : null}
      </div>
    </Card>
  );
}

function OrderFields({
  primaryLabel,
  primaryOptions,
  notesLabel,
  custom,
  category,
  onOrder,
}: {
  primaryLabel: string;
  primaryOptions: string[];
  notesLabel: string;
  custom: boolean;
  category: "investigation" | "medication";
  onOrder: (item: OrderedItem) => void;
}) {
  const [name, setName] = useState("");
  const [requirement, setRequirement] = useState("Essential");
  const [notes, setNotes] = useState("");

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <L label={custom ? "Custom Order" : primaryLabel} req>
        {custom ? (
          <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Doctor-entered custom order" />
        ) : (
          <select value={name} onChange={(event) => setName(event.target.value)} className={selectClass}>
            <option value="">Choose...</option>
            {primaryOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        )}
      </L>
      <L label="Requirement">
        <select value={requirement} onChange={(event) => setRequirement(event.target.value)} className={selectClass}>
          {["Essential", "Optional", "PRN", "STAT"].map((option) => <option key={option}>{option}</option>)}
        </select>
      </L>
      <div className="md:col-span-2">
        <L label={notesLabel}>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={inputClass} placeholder="Clinical notes..." />
        </L>
      </div>
      <button
        type="button"
        onClick={() => {
          const trimmedName = name.trim();
          if (!trimmedName) return;
          onOrder({ category, name: trimmedName, requirement, notes });
          setName("");
          setNotes("");
        }}
        className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-soft"
      >
        Mark as ordered / administered
      </button>
    </div>
  );
}

function EROutcomeFlow({
  patientName,
  pathway,
  orderedItems,
  chiefComplaint,
}: {
  patientName: string;
  pathway: string;
  orderedItems: OrderedItem[];
  chiefComplaint: string;
}) {
  const [shiftedTo, setShiftedTo] = useState("Discharge");
  const [patientStatus, setPatientStatus] = useState("Alive");
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("");
  const [course, setCourse] = useState(
    "The patient's provisional diagnosis was x. Documented comorbidities included none. The patient's last documented feed time was 2026-05-21 at 00:00. Personal history included smoking.",
  );
  const [carePlan, setCarePlan] = useState("");
  const [summary, setSummary] = useState("");
  const investigations = orderedItems.filter((item) => item.category === "investigation");
  const medications = orderedItems.filter((item) => item.category === "medication");
  const reportText = buildDischargeSummaryText({
    patientName,
    pathway,
    chiefComplaint,
    patientStatus,
    shiftedTo,
    provisionalDiagnosis,
    course,
    carePlan,
    investigations,
    medications,
  });
  const reportHtml = buildDischargeSummaryHtml({
    patientName,
    pathway,
    chiefComplaint,
    patientStatus,
    shiftedTo,
    provisionalDiagnosis,
    course,
    carePlan,
    investigations,
    medications,
  });

  const generateSummary = () => {
    setSummary(reportText);
  };

  return (
    <Card title="ER Outcome">
      <div className="space-y-4">
        <OutcomeAccordion title="Patient Info">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
            <ReadOnly label="Patient" value={patientName} />
            <ReadOnly label="UMR" value="UMR-2014" />
              <ReadOnly label="Care Pathway" value={pathway} />
            </div>
            <L label="Provisional Diagnosis" req>
              <textarea value={provisionalDiagnosis} onChange={(event) => setProvisionalDiagnosis(event.target.value)} rows={2} className={inputClass} placeholder="Provisional Diagnosis" />
            </L>
            <L label="Course in ER" req>
              <textarea value={course} onChange={(event) => setCourse(event.target.value)} rows={4} className={inputClass} placeholder="Course in ER" />
            </L>
            <button type="button" onClick={() => setCourse(`The patient's provisional diagnosis was ${provisionalDiagnosis || "not documented"}. Chief complaint: ${chiefComplaint || "not documented"}. ${investigations.length} investigation(s) and ${medications.length} medication order(s) were documented in ER.`)} className="rounded-full border border-coral px-4 py-2 text-xs font-bold text-coral hover:bg-coral/10">
              Regenerate Course in ER
            </button>
          </div>
        </OutcomeAccordion>

        <OutcomeAccordion title="Specialist">
          <div className="grid gap-3 md:grid-cols-3">
            <L label="Specialist">
              <select className={selectClass}>
                {["None", "Cardiology", "Neurology", "Medicine", "Surgery", "Orthopedics", "ICU"].map((option) => <option key={option}>{option}</option>)}
              </select>
            </L>
            <L label="Referral Status">
              <select className={selectClass}>
                {["Not required", "Requested", "Seen", "Pending"].map((option) => <option key={option}>{option}</option>)}
              </select>
            </L>
            <L label="Referral Notes">
              <input className={inputClass} placeholder="Notes" />
            </L>
          </div>
        </OutcomeAccordion>

        <OutcomeAccordion title="Investigations">
          <OrderedItemList items={investigations} empty="No investigations ordered for this patient yet." />
        </OutcomeAccordion>

        <OutcomeAccordion title="Medications">
          <OrderedItemList items={medications} empty="No medications ordered/administered for this patient yet." />
        </OutcomeAccordion>

        <OutcomeAccordion title="ER Discharge Options">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <L label="Care Plan Given by ER Physician" req>
              <textarea value={carePlan} onChange={(event) => setCarePlan(event.target.value)} rows={3} className={inputClass} placeholder="Care Plan Given by ER Physician" />
            </L>
            <L label="ER Physician" req>
              <input className={inputClass} placeholder="Search ER Physicians..." defaultValue="Dr. Tejaswi" />
            </L>
            <L label="Patient Status" req>
              <select value={patientStatus} onChange={(event) => setPatientStatus(event.target.value)} className={selectClass}>
                <option>Alive</option>
                <option>Dead</option>
              </select>
            </L>
            <L label="Shifted from ER to" req>
              <select value={shiftedTo} onChange={(event) => setShiftedTo(event.target.value)} className={selectClass}>
                {["ICU", "Cathlab", "OT", "Observation", "In Patient Ward", "Discharge", "LAMA", "Outside Referral"].map((option) => <option key={option}>{option}</option>)}
              </select>
            </L>
            <L label="ER discharge date and time" req>
              <input type="datetime-local" className={inputClass} />
            </L>
            <L label="Checklist" req>
              <FastChecklist options={["Pending Investigations", "Pending Referrals", "Critical Results", "High Risk Medication Given in ER", "Known HIV/HBV/HCV", "None"]} />
            </L>
            <L label="Further Plan Documented" req>
              <SegmentedControl options={["Yes", "No"]} defaultValue="Yes" />
            </L>
          </div>
        </OutcomeAccordion>

        <button type="button" onClick={generateSummary} className="rounded-full bg-navy px-5 py-3 text-xs font-bold text-white shadow-soft">
          Generate Discharge Summary
        </button>

        {summary ? (
          <OutcomeAccordion title="Generated Case Report">
            <div className="space-y-4">
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => printHtmlDocument(reportHtml)} className="rounded-full bg-navy px-4 py-2 text-xs font-bold text-white">
                  Print Report
                </button>
                <button type="button" onClick={() => downloadTextFile("discharge-summary.html", reportHtml, "text/html")} className="rounded-full border border-coral px-4 py-2 text-xs font-bold text-coral hover:bg-coral/10">
                  Download
                </button>
              </div>
              <DischargeSummaryPreview
                patientName={patientName}
                pathway={pathway}
                chiefComplaint={chiefComplaint}
                patientStatus={patientStatus}
                shiftedTo={shiftedTo}
                provisionalDiagnosis={provisionalDiagnosis}
                course={course}
                carePlan={carePlan}
                investigations={investigations}
                medications={medications}
              />
              <L label="Editable plain text copy">
                <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={12} className={`${inputClass} font-mono`} />
              </L>
            </div>
          </OutcomeAccordion>
        ) : null}

        {shiftedTo === "Observation" ? (
          <div className="space-y-3 rounded-2xl bg-mint/35 p-4">
            <OutcomeAccordion title="Observation">
              <div className="grid gap-3 md:grid-cols-3">
                <L label="Observation Reason">
                  <select className={selectClass}>
                    {["Serial vitals", "Pending reports", "Pain control", "Specialist review", "Clinical monitoring"].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </L>
                <L label="Observation Bed">
                  <input className={inputClass} placeholder="OBS-01" />
                </L>
                <L label="Review Frequency">
                  <select className={selectClass}>
                    {["Every 15 min", "Every 30 min", "Hourly", "Every 2 hours"].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </L>
              </div>
            </OutcomeAccordion>
            <OutcomeAccordion title="Observation Outcome">
              <div className="grid gap-3 md:grid-cols-3">
                <L label="Observation Outcome">
                  <select className={selectClass}>
                    {["Discharge", "Admission", "Transfer", "Continue observation"].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </L>
                <L label="Final Condition">
                  <select className={selectClass}>
                    {["Stable", "Improved", "Needs admission", "Critical"].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </L>
                <L label="Outcome Notes">
                  <input className={inputClass} placeholder="Notes" />
                </L>
              </div>
            </OutcomeAccordion>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function OrderedItemList({ items, empty }: { items: OrderedItem[]; empty: string }) {
  if (!items.length) {
    return <div className="rounded-xl border border-dashed border-border bg-white px-3 py-4 text-sm text-muted-foreground">{empty}</div>;
  }
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${item.category}-${item.name}-${index}`} className="rounded-xl border border-border bg-white p-3">
          <div className="text-sm font-bold text-navy">{item.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">{item.requirement}</div>
          {item.notes ? <div className="mt-2 text-xs text-navy">{item.notes}</div> : null}
        </div>
      ))}
    </div>
  );
}

function DischargeSummaryPreview({
  patientName,
  pathway,
  chiefComplaint,
  patientStatus,
  shiftedTo,
  provisionalDiagnosis,
  course,
  carePlan,
  investigations,
  medications,
}: {
  patientName: string;
  pathway: string;
  chiefComplaint: string;
  patientStatus: string;
  shiftedTo: string;
  provisionalDiagnosis: string;
  course: string;
  carePlan: string;
  investigations: OrderedItem[];
  medications: OrderedItem[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 text-navy shadow-soft">
      <div className="border-b-4 border-double border-navy pb-4 text-center">
        <div className="text-base font-black uppercase">Telangana Vaidya Vidhana Parishad</div>
        <div className="mt-1 text-sm font-semibold">Area Hospital, Bhadrachalam</div>
        <div className="mt-4 text-lg font-black uppercase tracking-[0.18em]">Discharge Summary</div>
      </div>

      <div className="mt-5 grid gap-3 text-xs md:grid-cols-3">
        <ReadOnly label="Patient Name" value={patientName} />
        <ReadOnly label="UMR" value="UMR-2014" />
        <ReadOnly label="Date" value={new Date().toLocaleString("en-IN")} />
        <ReadOnly label="Care Pathway" value={pathway} />
        <ReadOnly label="Chief Complaint" value={chiefComplaint || "Not documented"} />
        <ReadOnly label="Disposition" value={shiftedTo} />
      </div>

      <ReportSection title="Provisional Diagnosis">{provisionalDiagnosis || "Not documented"}</ReportSection>
      <ReportSection title="Course in ER">{course || "Not documented"}</ReportSection>
      <ReportSection title="Investigations Ordered / Reviewed">
        <ReportOrderedItems items={investigations} />
      </ReportSection>
      <ReportSection title="Medications / Treatment Given">
        <ReportOrderedItems items={medications} />
      </ReportSection>
      <ReportSection title="Patient Status and Disposition">
        {patientStatus}. Shifted from ER to {shiftedTo}.
      </ReportSection>
      <ReportSection title="Discharge Advice / Care Plan">{carePlan || "Not documented"}</ReportSection>
      <ReportSection title="Follow Up and Warning Signs">
        Return immediately for worsening symptoms, breathing difficulty, chest pain, altered sensorium, persistent fever, bleeding, seizure, or any new emergency concern. Follow up as advised by ER physician/specialist.
      </ReportSection>

      <div className="mt-10 grid gap-8 text-xs md:grid-cols-3">
        <div>
          <div className="border-b border-navy pb-8" />
          <div className="mt-2 font-bold">ER Physician</div>
        </div>
        <div>
          <div className="border-b border-navy pb-8" />
          <div className="mt-2 font-bold">Patient / Attendant</div>
        </div>
        <div>
          <div className="border-b border-navy pb-8" />
          <div className="mt-2 font-bold">Nurse / Witness</div>
        </div>
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <div className="border-b border-border pb-1 text-sm font-black uppercase tracking-[0.08em] text-navy">{title}</div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-navy">{children}</div>
    </section>
  );
}

function ReportOrderedItems({ items }: { items: OrderedItem[] }) {
  if (!items.length) return <>None documented</>;
  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li key={`${item.name}-${index}`}>
          {index + 1}. {item.name} ({item.requirement}){item.notes ? ` - ${item.notes}` : ""}
        </li>
      ))}
    </ul>
  );
}

function buildDischargeSummaryText({
  patientName,
  pathway,
  chiefComplaint,
  patientStatus,
  shiftedTo,
  provisionalDiagnosis,
  course,
  carePlan,
  investigations,
  medications,
}: {
  patientName: string;
  pathway: string;
  chiefComplaint: string;
  patientStatus: string;
  shiftedTo: string;
  provisionalDiagnosis: string;
  course: string;
  carePlan: string;
  investigations: OrderedItem[];
  medications: OrderedItem[];
}) {
  return [
    "TELANGANA VAIDYA VIDHANA PARISHAD",
    "Area Hospital, Bhadrachalam",
    "DISCHARGE SUMMARY",
    "",
    `Patient Name: ${patientName}`,
    "UMR: UMR-2014",
    `Date: ${new Date().toLocaleString("en-IN")}`,
    `Care Pathway: ${pathway}`,
    `Chief Complaint: ${chiefComplaint || "Not documented"}`,
    `Patient Status: ${patientStatus}`,
    `Disposition: ${shiftedTo}`,
    "",
    "PROVISIONAL DIAGNOSIS",
    provisionalDiagnosis || "Not documented",
    "",
    "COURSE IN ER",
    course || "Not documented",
    "",
    "INVESTIGATIONS ORDERED / REVIEWED",
    formatOrderedItems(investigations),
    "",
    "MEDICATIONS / TREATMENT GIVEN",
    formatOrderedItems(medications),
    "",
    "DISCHARGE ADVICE / CARE PLAN",
    carePlan || "Not documented",
    "",
    "FOLLOW UP AND WARNING SIGNS",
    "Return immediately for worsening symptoms, breathing difficulty, chest pain, altered sensorium, persistent fever, bleeding, seizure, or any new emergency concern. Follow up as advised by ER physician/specialist.",
    "",
    "ER Physician: ____________________",
    "Patient / Attendant: ____________________",
    "Nurse / Witness: ____________________",
  ].join("\n");
}

function buildDischargeSummaryHtml(args: Parameters<typeof buildDischargeSummaryText>[0]) {
  const investigations = formatOrderedItems(args.investigations);
  const medications = formatOrderedItems(args.medications);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Discharge Summary</title>
  <style>
    body { font-family: Arial, sans-serif; color: #10243d; margin: 32px; }
    .header { text-align: center; border-bottom: 4px double #10243d; padding-bottom: 14px; margin-bottom: 20px; }
    .hospital { font-weight: 800; text-transform: uppercase; font-size: 18px; }
    .title { font-weight: 900; letter-spacing: 3px; margin-top: 18px; font-size: 20px; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
    .box { border: 1px solid #d7c7b5; border-radius: 10px; padding: 10px; background: #fffdf9; }
    .label { font-size: 10px; color: #697586; text-transform: uppercase; letter-spacing: .08em; }
    .value { font-size: 13px; font-weight: 700; margin-top: 4px; }
    h2 { border-bottom: 1px solid #d7c7b5; font-size: 13px; text-transform: uppercase; letter-spacing: .08em; padding-bottom: 5px; margin-top: 22px; }
    p, pre { font-size: 13px; line-height: 1.55; white-space: pre-wrap; font-family: inherit; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 56px; }
    .sig { border-top: 1px solid #10243d; padding-top: 8px; font-weight: 700; font-size: 12px; }
    @media print { body { margin: 18mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="hospital">Telangana Vaidya Vidhana Parishad</div>
    <div>Area Hospital, Bhadrachalam</div>
    <div class="title">Discharge Summary</div>
  </div>
  <div class="grid">
    <div class="box"><div class="label">Patient Name</div><div class="value">${escapeHtml(args.patientName)}</div></div>
    <div class="box"><div class="label">UMR</div><div class="value">UMR-2014</div></div>
    <div class="box"><div class="label">Date</div><div class="value">${escapeHtml(new Date().toLocaleString("en-IN"))}</div></div>
    <div class="box"><div class="label">Care Pathway</div><div class="value">${escapeHtml(args.pathway)}</div></div>
    <div class="box"><div class="label">Chief Complaint</div><div class="value">${escapeHtml(args.chiefComplaint || "Not documented")}</div></div>
    <div class="box"><div class="label">Disposition</div><div class="value">${escapeHtml(args.shiftedTo)}</div></div>
  </div>
  <h2>Provisional Diagnosis</h2><p>${escapeHtml(args.provisionalDiagnosis || "Not documented")}</p>
  <h2>Course in ER</h2><p>${escapeHtml(args.course || "Not documented")}</p>
  <h2>Investigations Ordered / Reviewed</h2><pre>${escapeHtml(investigations)}</pre>
  <h2>Medications / Treatment Given</h2><pre>${escapeHtml(medications)}</pre>
  <h2>Patient Status and Disposition</h2><p>${escapeHtml(`${args.patientStatus}. Shifted from ER to ${args.shiftedTo}.`)}</p>
  <h2>Discharge Advice / Care Plan</h2><p>${escapeHtml(args.carePlan || "Not documented")}</p>
  <h2>Follow Up and Warning Signs</h2><p>Return immediately for worsening symptoms, breathing difficulty, chest pain, altered sensorium, persistent fever, bleeding, seizure, or any new emergency concern. Follow up as advised by ER physician/specialist.</p>
  <div class="signatures">
    <div class="sig">ER Physician</div>
    <div class="sig">Patient / Attendant</div>
    <div class="sig">Nurse / Witness</div>
  </div>
</body>
</html>`;
}

function formatOrderedItems(items: OrderedItem[]) {
  return items.length ? items.map((item, index) => `${index + 1}. ${item.name} (${item.requirement})${item.notes ? ` - ${item.notes}` : ""}`).join("\n") : "None documented";
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function printHtmlDocument(html: string) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function downloadTextFile(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function OutcomeAccordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background/70">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold text-navy">
        {title}
        <ChevronDown className={`h-4 w-4 transition ${open ? "" : "-rotate-90"}`} />
      </button>
      {open ? <div className="border-t border-border p-4">{children}</div> : null}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-xs font-semibold text-navy">{value}</div>
    </div>
  );
}

function ABC({
  letter,
  name,
  clearLabel,
  concernLabel,
  badges,
}: {
  letter: string;
  name: string;
  clearLabel: string;
  concernLabel: string;
  badges: string[];
}) {
  const [status, setStatus] = useState(clearLabel);
  const concerning = status === concernLabel;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-300 bg-slate-200 px-3 py-2">
        <span className="text-xs font-black uppercase text-navy">
          {letter} - {name}
        </span>
        <div className="flex flex-wrap justify-end gap-1">
          {badges.map((badge, index) => (
            <span
              key={badge}
              className={`rounded-md border px-2 py-1 text-[10px] font-bold ${
                index === 0 && letter !== "D"
                  ? "border-urgent-safe bg-mint text-urgent-safe"
                  : badge.includes("Apnea") || badge.includes("Cric") || badge.includes("fluid")
                    ? "border-red-300 bg-red-100 text-red-700"
                    : "border-amber-300 bg-amber-100 text-amber-800"
              }`}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-3 p-3">
        <L label="Status" req>
          <div className="grid gap-1 sm:grid-cols-2">
            {[clearLabel, concernLabel].map((option) => {
              const active = status === option;
              const isClear = option === clearLabel;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatus(option)}
                  className={`border px-3 py-2 text-left text-xs font-semibold ${
                    active && isClear
                      ? "border-urgent-safe bg-mint text-urgent-safe"
                      : active
                        ? "border-red-500 bg-red-100 text-red-700"
                        : "border-border bg-background text-navy hover:bg-secondary/40"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </L>
        {concerning ? <ABCDetail letter={letter} /> : <div className="rounded-lg border border-mint bg-mint/40 px-3 py-2 text-xs font-semibold text-urgent-safe">Clear. Continue to next ABCD section.</div>}
      </div>
    </div>
  );
}

function ABCDetail({ letter }: { letter: string }) {
  if (letter === "A") {
    return (
      <div className="space-y-3">
        <select className={selectClass} defaultValue="Compromised">
          <option>Compromised</option>
          <option>Patent but at risk</option>
          <option>Obstructed</option>
        </select>
        <div className="rounded-lg border border-border bg-slate-50 p-3">
          <L label="C-Spine immobilized">
            <SegmentedControl options={["Yes", "No"]} defaultValue="Yes" />
          </L>
        </div>
        <L label="Obstruction Material (select all that apply)">
          <FastChecklist options={["Saliva", "Vomit", "Blood", "Dentures / dental", "Tongue", "Foreign body", "Oedema / swelling", "Others"]} />
        </L>
        <L label="Management A" req>
          <FastChecklist options={["NPA", "OPA", "Intubation (ETT)", "LMA", "NIV", "Cricothyrotomy", "None"]} />
        </L>
        <L label="Notes (optional)">
          <textarea rows={3} className={inputClass} placeholder="Additional notes..." />
        </L>
      </div>
    );
  }

  if (letter === "B") {
    return (
      <div className="space-y-3">
        <select className={selectClass} defaultValue="Abnormal">
          <option>Abnormal</option>
          <option>Apnea</option>
          <option>Laboured</option>
        </select>
        <div className="grid gap-3 md:grid-cols-2">
          <L label="RR (triage)">
            <input className={inputClass} defaultValue="92" />
          </L>
          <L label="SpO2 (triage)">
            <input className={inputClass} defaultValue="92" />
          </L>
          <L label="SpO2 RA %">
            <input className={inputClass} defaultValue="98" />
          </L>
          <L label="SpO2 O2 %">
            <input className={inputClass} defaultValue="96" />
          </L>
        </div>
        <L label="Trachea midline">
          <SegmentedControl options={["Yes", "No"]} defaultValue="Yes" />
        </L>
        <L label="Management B" req>
          <FastChecklist options={["Positioning", "Oxygen Management", "Ventilation", "Chest Interventions", "Pursed-lip breathing", "Diaphragmatic breathing", "None"]} />
        </L>
        <L label="Notes (optional)">
          <textarea rows={3} className={inputClass} placeholder="Additional notes..." />
        </L>
      </div>
    );
  }

  if (letter === "C") {
    return (
      <div className="space-y-3">
        <select className={selectClass} defaultValue="Inadequate">
          <option>Inadequate</option>
          <option>Shock suspected</option>
          <option>Active bleeding</option>
        </select>
        <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-navy">Exam & Haemodynamics <span className="float-right font-semibold">BP 110/60 mmHg · HR 78/min</span></div>
        <div className="grid gap-3 md:grid-cols-2">
          <L label="Cap refill">
            <input className={inputClass} />
          </L>
          <L label="Radial">
            <select className={selectClass}><option>not assessable</option><option>Present</option><option>Absent</option></select>
          </L>
          <L label="Heart">
            <select className={selectClass}><option>not assessable</option><option>Normal</option><option>Abnormal</option></select>
          </L>
          <L label="Pelvis">
            <select className={selectClass}><option>not assessable</option><option>Stable</option><option>Unstable</option></select>
          </L>
        </div>
        <L label="Management C" req>
          <FastChecklist options={["IV Access", "CPR", "Fluid Management", "Haemorrhage Control", "Medications", "None"]} />
        </L>
        <L label="Notes (optional)">
          <textarea rows={3} className={inputClass} placeholder="Additional notes..." />
        </L>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <L label="Eye">
          <select className={selectClass}><option>—</option><option>4</option><option>3</option><option>2</option><option>1</option></select>
        </L>
        <L label="Verbal">
          <select className={selectClass}><option>—</option><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option><option>T</option></select>
        </L>
        <L label="Motor">
          <select className={selectClass}><option>—</option><option>6</option><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select>
        </L>
      </div>
      <div className="text-[11px] font-semibold text-navy">Total 0/15 · U - Unresponsive</div>
      <div className="grid gap-3 md:grid-cols-2">
        <L label="Right pupil">
          <div className="grid grid-cols-2 gap-2"><input className={inputClass} placeholder="Size mm" /><select className={selectClass}><option>—</option><option>Reactive</option><option>Fixed</option></select></div>
        </L>
        <L label="Left pupil">
          <div className="grid grid-cols-2 gap-2"><input className={inputClass} placeholder="Size mm" /><select className={selectClass}><option>—</option><option>Reactive</option><option>Fixed</option></select></div>
        </L>
      </div>
      <L label="Basal Skull Signs">
        <FastChecklist options={["Otorrhoea / ear R", "Otorrhoea / ear L", "Rhinorrhoea / nose R", "Rhinorrhoea / nose L", "Raccoon eyes R", "Raccoon eyes L", "Battle's sign R", "Battle's sign L"]} />
      </L>
      <L label="Focal Deficit">
        <textarea rows={3} className={inputClass} placeholder="Focal neuro deficits..." />
      </L>
    </div>
  );
}
