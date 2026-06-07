import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Plus, Trash2, X } from "lucide-react";
import type {
  NursingAssessmentRecord,
  NursingIvFluidEntry,
  NursingStatMedicationEntry,
} from "@/lib/edTypes";

type Props = {
  assessments: NursingAssessmentRecord[];
  patientName: string;
  umr: string;
  assignedDoctorName?: string;
  canEdit?: boolean;
  currentUserName?: string;
  embedded?: boolean;
  onClose: () => void;
  onSave?: (record: NursingAssessmentRecord) => void;
};

type DraftAssessment = Omit<NursingAssessmentRecord, "id" | "createdAt" | "createdBy">;

const paperInput =
  "w-full border-0 border-b border-[#7d90b8] bg-transparent px-1 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400";
const checkboxClass =
  "h-4 w-4 rounded-sm border border-[#7d90b8] text-[#1f4c96] focus:ring-[#1f4c96]";
const painFaces = [
  { score: 0, label: "NO HURT", emoji: "\u{1F60A}" },
  { score: 2, label: "HURTS LITTLE BIT", emoji: "\u{1F642}" },
  { score: 4, label: "HURTS LITTLE MORE", emoji: "\u{1F610}" },
  { score: 6, label: "HURTS EVEN MORE", emoji: "\u{1F615}" },
  { score: 8, label: "HURTS WHOLE LOT", emoji: "\u{1F623}" },
  { score: 10, label: "HURTS WORST", emoji: "\u{1F62D}" },
];

function getNowForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function createMedicationRow(assignedDoctorName?: string, nurseName?: string): NursingStatMedicationEntry {
  const now = getNowForInput();
  return {
    id: `stat-${Math.random().toString(36).slice(2, 9)}`,
    dateTime: now,
    drugName: "",
    dose: "",
    route: "",
    frequency: "",
    counterSignByDoctor: assignedDoctorName ?? "",
    sign1By: nurseName ?? "",
    sign1Time: now,
    sign2By: nurseName ?? "",
    sign2Time: now,
  };
}

function createFluidRow(nurseName?: string): NursingIvFluidEntry {
  const now = getNowForInput();
  return {
    id: `iv-${Math.random().toString(36).slice(2, 9)}`,
    fluidName: "",
    serialNumber: "",
    timeStarted: now,
    timeStopped: "",
    signWithName: nurseName ?? "",
  };
}

function createDraft(userName?: string, assignedDoctorName?: string): DraftAssessment {
  const now = getNowForInput();
  return {
    dateTime: now,
    vulnerablePatient: false,
    restraints: false,
    drugAllergy: false,
    fallRisk: false,
    bedSore: false,
    dvt: false,
    yesDetails: "",
    mainComplaintsAndFindings: "",
    pulseRate: "",
    bloodPressure: "",
    temperature: "",
    respiratoryRate: "",
    weightKg: "",
    rbs: "",
    oxygenSaturation: "",
    painScore: "",
    bedSoreGrade: "",
    investigationSent: "",
    statMedications: [createMedicationRow(assignedDoctorName, userName)],
    intravenousFluids: [createFluidRow(userName)],
    nurseNotes: "",
    nurseName: userName ?? "",
    nurseSignature: userName ?? "",
    signedAt: now,
  };
}

export function NursingAssessmentModal({
  assessments,
  patientName,
  umr,
  assignedDoctorName,
  canEdit = false,
  currentUserName,
  embedded = false,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<DraftAssessment>(() => createDraft(currentUserName, assignedDoctorName));
  const [showForm, setShowForm] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const orderedAssessments = useMemo(
    () => [...assessments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [assessments],
  );

  const saveRecord = () => {
    if (!canEdit || !onSave) return;
    const now = new Date().toISOString();
    onSave({
      id: `na-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: now,
      createdBy: currentUserName ?? draft.nurseName ?? "Nurse",
      ...draft,
      dateTime: draft.dateTime || now.slice(0, 16),
      signedAt: draft.signedAt || now.slice(0, 16),
      statMedications: draft.statMedications.filter((item) =>
        [
          item.dateTime,
          item.drugName,
          item.dose,
          item.route,
          item.frequency,
          item.counterSignByDoctor,
          item.sign1By,
          item.sign1Time,
          item.sign2By,
          item.sign2Time,
        ].some(Boolean),
      ),
      intravenousFluids: draft.intravenousFluids.filter((item) =>
        [item.fluidName, item.serialNumber, item.timeStarted, item.timeStopped, item.signWithName].some(Boolean),
      ),
    });
    setDraft(createDraft(currentUserName, assignedDoctorName));
  };

  if (!embedded) {
    return (
      <ModalFrame
        title="Nursing Assessment Timeline"
        patientName={patientName}
        subtitle={`UMR ${umr} - review of recorded nursing assessments`}
        onClose={onClose}
      >
        <TimelineBody assessments={orderedAssessments} />
      </ModalFrame>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-coral">
              Emergency Nursing Initial Assessment
            </div>
            <h3 className="mt-1 text-lg font-bold text-navy">{patientName}</h3>
            <p className="text-xs text-muted-foreground">UMR {umr} - nurse-only bedside documentation form</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTimeline(true)}
              className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/5 px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Assessment Timeline
            </button>
            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              className="rounded-full border border-coral/30 bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral transition-colors hover:bg-coral hover:text-white"
            >
              {showForm ? "Hide form" : "Show form"}
            </button>
          </div>
        </div>

        {showForm ? (
          <PaperAssessmentForm
            draft={draft}
            setDraft={setDraft}
            patientName={patientName}
            umr={umr}
            assignedDoctorName={assignedDoctorName}
            currentUserName={currentUserName}
            canEdit={canEdit}
            onSave={saveRecord}
          />
        ) : (
          <div className="rounded-[1.5rem] border border-border/80 bg-card p-6 shadow-soft">
            <div className="text-sm font-bold text-navy">Assessment form hidden</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Use `Show form` to continue nurse documentation, or open `Assessment Timeline` to review previous entries.
            </div>
          </div>
        )}
      </div>
      {showTimeline ? (
        <ModalFrame
          title="Assessment Timeline"
          patientName={patientName}
          subtitle={`UMR ${umr} - chronological nursing assessment track`}
          onClose={() => setShowTimeline(false)}
        >
          <TimelineBody assessments={orderedAssessments} />
        </ModalFrame>
      ) : null}
    </>
  );
}

function PaperAssessmentForm({
  draft,
  setDraft,
  patientName,
  umr,
  assignedDoctorName,
  currentUserName,
  canEdit,
  onSave,
}: {
  draft: DraftAssessment;
  setDraft: (value: DraftAssessment) => void;
  patientName: string;
  umr: string;
  assignedDoctorName?: string;
  currentUserName?: string;
  canEdit: boolean;
  onSave: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border-2 border-[#8aa0cc] bg-[#fcfdff] shadow-soft">
      <div className="border-b border-[#8aa0cc] bg-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f4c96]">
              Emergency Nursing Initial Assessment
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Nursing assessment record
            </div>
          </div>
          <div className="grid min-w-[320px] gap-2 text-xs text-slate-700 sm:grid-cols-2">
            <PaperLine label="Name" value={patientName} />
            <PaperLine label="Sex" value="" />
            <PaperLine label="Ward" value="" />
            <PaperLine label="Age" value="" />
            <PaperLine label="UMR No." value={umr} />
            <PaperLine label="Date" value="" />
            <PaperLine label="Bed" value="" />
            <PaperLine label="IP No." value="" />
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <PaperField label="Date & Time">
              <input
                className={paperInput}
                type="datetime-local"
                value={draft.dateTime}
                onChange={(event) => setDraft({ ...draft, dateTime: event.target.value })}
                disabled={!canEdit}
              />
            </PaperField>

            <RiskRow
              label="Vulnerable Patient"
              checked={draft.vulnerablePatient}
              onChange={(value) => setDraft({ ...draft, vulnerablePatient: value })}
              disabled={!canEdit}
            />
            <RiskRow
              label="Restraints"
              checked={draft.restraints}
              onChange={(value) => setDraft({ ...draft, restraints: value })}
              disabled={!canEdit}
            />
            <RiskRow
              label="Drug Allergy"
              checked={draft.drugAllergy}
              onChange={(value) => setDraft({ ...draft, drugAllergy: value })}
              disabled={!canEdit}
            />
            <RiskRow
              label="Fall Risk"
              checked={draft.fallRisk}
              onChange={(value) => setDraft({ ...draft, fallRisk: value })}
              disabled={!canEdit}
            />
            <RiskRow
              label="Bed Sore"
              checked={draft.bedSore}
              onChange={(value) => setDraft({ ...draft, bedSore: value })}
              disabled={!canEdit}
            />
            <RiskRow
              label="DVT"
              checked={draft.dvt}
              onChange={(value) => setDraft({ ...draft, dvt: value })}
              disabled={!canEdit}
            />

            <PaperField label="If Yes Please Specify">
              <input
                className={paperInput}
                value={draft.yesDetails}
                onChange={(event) => setDraft({ ...draft, yesDetails: event.target.value })}
                disabled={!canEdit}
              />
            </PaperField>

            <PaperField label="Main Complaints and Findings">
              <textarea
                className={`${paperInput} min-h-28 resize-none`}
                value={draft.mainComplaintsAndFindings}
                onChange={(event) => setDraft({ ...draft, mainComplaintsAndFindings: event.target.value })}
                disabled={!canEdit}
              />
            </PaperField>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-[#8aa0cc]">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <VitalsRow
                    label="Pulse Rate / Min"
                    value={draft.pulseRate}
                    onChange={(value) => setDraft({ ...draft, pulseRate: value })}
                    disabled={!canEdit}
                  />
                  <VitalsRow
                    label="Blood Pressure / mm Hg"
                    value={draft.bloodPressure}
                    onChange={(value) => setDraft({ ...draft, bloodPressure: value })}
                    disabled={!canEdit}
                  />
                  <VitalsRow
                    label="Temperature / F / C"
                    value={draft.temperature}
                    onChange={(value) => setDraft({ ...draft, temperature: value })}
                    disabled={!canEdit}
                  />
                  <VitalsRow
                    label="Resp. Rate / Min"
                    value={draft.respiratoryRate}
                    onChange={(value) => setDraft({ ...draft, respiratoryRate: value })}
                    disabled={!canEdit}
                  />
                  <VitalsRow
                    label="Weight (Kg)"
                    value={draft.weightKg}
                    onChange={(value) => setDraft({ ...draft, weightKg: value })}
                    disabled={!canEdit}
                  />
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#8aa0cc]">
              <div className="border-b border-[#8aa0cc] px-3 py-2 text-sm font-semibold text-[#1f4c96]">
                When Indicated
              </div>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <VitalsRow
                    label="RBS"
                    value={draft.rbs}
                    onChange={(value) => setDraft({ ...draft, rbs: value })}
                    disabled={!canEdit}
                  />
                  <VitalsRow
                    label="O-Saturation"
                    value={draft.oxygenSaturation}
                    onChange={(value) => setDraft({ ...draft, oxygenSaturation: value })}
                    disabled={!canEdit}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#8aa0cc] px-5 py-5">
          <div className="text-lg font-bold text-[#1f4c96]">Pain Assessment</div>
          <div className="mt-4 grid gap-4 xl:grid-cols-6">
            {painFaces.map((item) => {
              const active = String(item.score) === draft.painScore;
              return (
                <div key={item.score} className="text-center">
                  <div className="min-h-[48px] text-[11px] font-bold uppercase leading-tight text-[#1f4c96]">
                    <div className="text-sm text-slate-500">{item.score}</div>
                    <div>{item.label}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => canEdit && setDraft({ ...draft, painScore: String(item.score) })}
                    disabled={!canEdit}
                    className={`mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-full border-2 text-4xl transition ${
                      active ? "border-[#1f4c96] bg-[#e9f0ff]" : "border-[#8aa0cc] bg-white hover:bg-[#f5f8ff]"
                    } ${!canEdit ? "cursor-default" : ""}`}
                    aria-label={`Pain score ${item.score}`}
                  >
                    <span>{item.emoji}</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 px-2">
            <div className="relative h-10 border-b-2 border-[#8aa0cc]">
              <div className="absolute inset-x-0 bottom-0 grid grid-cols-11">
                {Array.from({ length: 11 }, (_, value) => (
                  <div key={value} className="relative text-center text-xs text-slate-600">
                    <div className="absolute bottom-0 left-1/2 h-4 w-px -translate-x-1/2 bg-[#8aa0cc]" />
                    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <PaperField label="Bed Sore Grade">
            <div className="grid gap-2 sm:grid-cols-4">
              {["Grade - I", "Grade - II", "Grade - III", "Grade - IV"].map((grade) => (
                <label key={grade} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    className={checkboxClass}
                    checked={draft.bedSoreGrade === grade}
                    onChange={() => setDraft({ ...draft, bedSoreGrade: grade })}
                    disabled={!canEdit}
                  />
                  {grade}
                </label>
              ))}
            </div>
          </PaperField>

          <PaperField label="Investigation sent">
            <input
              className={paperInput}
              value={draft.investigationSent}
              onChange={(event) => setDraft({ ...draft, investigationSent: event.target.value })}
              disabled={!canEdit}
            />
          </PaperField>
        </div>

        <DigitalSection
          title="Stat Medication"
          description="Capture medication administration in a cleaner digital layout."
          actionLabel="Add medication"
          onAction={() =>
            setDraft({
              ...draft,
              statMedications: [...draft.statMedications, createMedicationRow(assignedDoctorName, currentUserName)],
            })
          }
          canEdit={canEdit}
        >
          <div className="space-y-3">
            {draft.statMedications.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-[#cdd8ee] bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-navy">Medication {index + 1}</div>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => removeMedicationRow(draft, setDraft, index, assignedDoctorName, currentUserName)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <DigitalField
                    label="Date & Time"
                    value={item.dateTime}
                    onChange={(value) => updateMedicationRow(draft, setDraft, index, "dateTime", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Drug Name"
                    value={item.drugName}
                    onChange={(value) => updateMedicationRow(draft, setDraft, index, "drugName", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Dose"
                    value={item.dose}
                    onChange={(value) => updateMedicationRow(draft, setDraft, index, "dose", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Route"
                    value={item.route}
                    onChange={(value) => updateMedicationRow(draft, setDraft, index, "route", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Frequency"
                    value={item.frequency}
                    onChange={(value) => updateMedicationRow(draft, setDraft, index, "frequency", value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <DigitalField
                    label="Doctor Counter Sign"
                    value={item.counterSignByDoctor}
                    onChange={(value) => updateMedicationRow(draft, setDraft, index, "counterSignByDoctor", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Sign With Name 1"
                    value={item.sign1By}
                    onChange={(value) => updateMedicationRow(draft, setDraft, index, "sign1By", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Time 1"
                    value={item.sign1Time}
                    onChange={(value) => updateMedicationRow(draft, setDraft, index, "sign1Time", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Sign With Name 2"
                    value={item.sign2By}
                    onChange={(value) => updateMedicationRow(draft, setDraft, index, "sign2By", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Time 2"
                    value={item.sign2Time}
                    onChange={(value) => updateMedicationRow(draft, setDraft, index, "sign2Time", value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            ))}
          </div>
        </DigitalSection>

        <DigitalSection
          title="Intravenous Fluids"
          description="Track IV fluid administration as editable digital entries."
          actionLabel="Add IV fluid"
          onAction={() =>
            setDraft({
              ...draft,
              intravenousFluids: [...draft.intravenousFluids, createFluidRow(currentUserName)],
            })
          }
          canEdit={canEdit}
        >
          <div className="space-y-3">
            {draft.intravenousFluids.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-[#cdd8ee] bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-navy">IV Fluid {index + 1}</div>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => removeFluidRow(draft, setDraft, index, currentUserName)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <DigitalField
                    label="IV Fluid"
                    value={item.fluidName}
                    onChange={(value) => updateFluidRow(draft, setDraft, index, "fluidName", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="No."
                    value={item.serialNumber}
                    onChange={(value) => updateFluidRow(draft, setDraft, index, "serialNumber", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Time Started"
                    value={item.timeStarted}
                    onChange={(value) => updateFluidRow(draft, setDraft, index, "timeStarted", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Time Stopped"
                    value={item.timeStopped}
                    onChange={(value) => updateFluidRow(draft, setDraft, index, "timeStopped", value)}
                    disabled={!canEdit}
                  />
                  <DigitalField
                    label="Sign With Name"
                    value={item.signWithName}
                    onChange={(value) => updateFluidRow(draft, setDraft, index, "signWithName", value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            ))}
          </div>
        </DigitalSection>

        <DigitalSection title="Nurse Notes & Sign-Off" description="Document notes and who completed the assessment.">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <DigitalArea
              label="Nurse Notes"
              value={draft.nurseNotes}
              onChange={(value) => setDraft({ ...draft, nurseNotes: value })}
              disabled={!canEdit}
            />
            <div className="space-y-4 rounded-2xl border border-[#cdd8ee] bg-white p-4">
              <DigitalField
                label="Name of Nurse"
                value={draft.nurseName}
                onChange={(value) => setDraft({ ...draft, nurseName: value })}
                disabled={!canEdit}
              />
              <DigitalField
                label="Signature"
                value={draft.nurseSignature}
                onChange={(value) => setDraft({ ...draft, nurseSignature: value })}
                disabled={!canEdit}
              />
              <DigitalField
                label="Time"
                value={draft.signedAt}
                onChange={(value) => setDraft({ ...draft, signedAt: value })}
                disabled={!canEdit}
              />
            </div>
          </div>
        </DigitalSection>

        {canEdit ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSave}
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:opacity-95"
            >
              Save Nursing Assessment
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModalFrame({
  title,
  patientName,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  patientName: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-background shadow-soft-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-background px-5 py-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-coral">{title}</div>
            <h3 className="mt-1 text-lg font-bold text-navy">{patientName}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function TimelineBody({ assessments }: { assessments: NursingAssessmentRecord[] }) {
  if (!assessments.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/10 p-5 text-sm text-muted-foreground">
        No nursing assessments recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assessments.map((entry) => (
        <div key={entry.id} className="rounded-2xl border border-border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-navy">{formatDateTime(entry.dateTime || entry.createdAt)}</div>
              <div className="mt-1 text-xs text-muted-foreground">Recorded by {entry.nurseName || entry.createdBy}</div>
            </div>
            <div className="grid gap-1 text-right text-xs text-muted-foreground">
              <div>Pain {entry.painScore || "-"}/10</div>
              <div>Pulse {entry.pulseRate || "-"}/min</div>
              <div>BP {entry.bloodPressure || "-"}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
            {entry.vulnerablePatient ? <RiskPill label="Vulnerable" /> : null}
            {entry.restraints ? <RiskPill label="Restraints" /> : null}
            {entry.drugAllergy ? <RiskPill label="Drug allergy" /> : null}
            {entry.fallRisk ? <RiskPill label="Fall risk" /> : null}
            {entry.bedSore ? <RiskPill label={`Bed sore ${entry.bedSoreGrade || ""}`.trim()} /> : null}
            {entry.dvt ? <RiskPill label="DVT" /> : null}
          </div>

          {entry.mainComplaintsAndFindings ? (
            <div className="mt-3 rounded-2xl bg-secondary/20 p-3 text-xs text-navy">
              {entry.mainComplaintsAndFindings}
            </div>
          ) : null}

          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <span>Resp {entry.respiratoryRate || "-"}/min</span>
            <span>Temp {entry.temperature || "-"}</span>
            <span>SpO2 {entry.oxygenSaturation || "-"}</span>
            <span>RBS {entry.rbs || "-"}</span>
            <span>Weight {entry.weightKg || "-"} kg</span>
            <span>Investigation sent {entry.investigationSent || "-"}</span>
          </div>

          {entry.nurseNotes ? <div className="mt-3 text-xs text-muted-foreground">{entry.nurseNotes}</div> : null}
        </div>
      ))}
    </div>
  );
}

function updateMedicationRow(
  draft: DraftAssessment,
  setDraft: (value: DraftAssessment) => void,
  index: number,
  key: keyof NursingStatMedicationEntry,
  value: string,
) {
  const next = draft.statMedications.map((item, itemIndex) =>
    itemIndex === index ? { ...item, [key]: value } : item,
  );
  setDraft({ ...draft, statMedications: next });
}

function updateFluidRow(
  draft: DraftAssessment,
  setDraft: (value: DraftAssessment) => void,
  index: number,
  key: keyof NursingIvFluidEntry,
  value: string,
) {
  const next = draft.intravenousFluids.map((item, itemIndex) =>
    itemIndex === index ? { ...item, [key]: value } : item,
  );
  setDraft({ ...draft, intravenousFluids: next });
}

function removeMedicationRow(
  draft: DraftAssessment,
  setDraft: (value: DraftAssessment) => void,
  index: number,
  assignedDoctorName?: string,
  currentUserName?: string,
) {
  const next = draft.statMedications.filter((_, itemIndex) => itemIndex !== index);
  setDraft({
    ...draft,
    statMedications: next.length ? next : [createMedicationRow(assignedDoctorName, currentUserName)],
  });
}

function removeFluidRow(
  draft: DraftAssessment,
  setDraft: (value: DraftAssessment) => void,
  index: number,
  currentUserName?: string,
) {
  const next = draft.intravenousFluids.filter((_, itemIndex) => itemIndex !== index);
  setDraft({
    ...draft,
    intravenousFluids: next.length ? next : [createFluidRow(currentUserName)],
  });
}

function PaperLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-end gap-2">
      <span className="whitespace-nowrap font-medium">{label}:</span>
      <span className="min-w-0 flex-1 border-b border-[#7d90b8] pb-0.5">{value}</span>
    </div>
  );
}

function PaperField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-[#244c8d]">{label}</div>
      {children}
    </label>
  );
}

function RiskRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 text-sm text-slate-700">
      <span>{label}</span>
      <label className="inline-flex items-center gap-2">
        <span>Yes</span>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={checked}
          onChange={() => onChange(true)}
          disabled={disabled}
        />
      </label>
      <label className="inline-flex items-center gap-2">
        <span>No</span>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={!checked}
          onChange={() => onChange(false)}
          disabled={disabled}
        />
      </label>
    </div>
  );
}

function VitalsRow({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <tr>
      <td className="border border-[#8aa0cc] px-3 py-2 text-sm text-slate-700">{label}</td>
      <td className="border border-[#8aa0cc] px-2 py-1">
        <input
          className="w-full bg-transparent text-sm outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
      </td>
    </tr>
  );
}

function DigitalSection({
  title,
  description,
  actionLabel,
  onAction,
  canEdit = false,
  children,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  canEdit?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#8aa0cc] bg-[#f8fbff] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-bold text-[#1f4c96]">{title}</div>
          <div className="mt-1 text-sm text-slate-500">{description}</div>
        </div>
        {canEdit && actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-full border border-[#8aa0cc] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f4c96] hover:bg-[#eef4ff]"
          >
            <Plus className="h-3.5 w-3.5" />
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function DigitalField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <input
        className="w-full rounded-xl border border-[#cdd8ee] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#8aa0cc]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

function DigitalArea({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block rounded-2xl border border-[#cdd8ee] bg-white p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <textarea
        className="min-h-32 w-full resize-none bg-transparent text-sm text-slate-900 outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

function RiskPill({ label }: { label: string }) {
  return <span className="rounded-full bg-coral/10 px-2.5 py-1 text-coral">{label}</span>;
}

function formatDateTime(value: string) {
  if (!value) return "Pending date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
