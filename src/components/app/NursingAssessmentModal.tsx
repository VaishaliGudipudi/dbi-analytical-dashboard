import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Plus, Trash2, X } from "lucide-react";
import type {
  NursingAssessmentRecord,
  NursingInvestigationEntry,
  NursingIvFluidEntry,
  NursingStatMedicationEntry,
} from "@/lib/edTypes";

type Props = {
  assessments: NursingAssessmentRecord[];
  patientName: string;
  umr: string;
  patientAge?: number;
  patientSex?: string;
  bedNumber?: string;
  assignedDoctorName?: string;
  admissionDateTime?: string;
  triageLabel?: string;
  chiefComplaint?: string;
  vitals?: Record<string, string>;
  canEdit?: boolean;
  currentUserName?: string;
  embedded?: boolean;
  onClose: () => void;
  onSave?: (record: NursingAssessmentRecord) => void;
};

type DraftAssessment = Omit<NursingAssessmentRecord, "id" | "createdAt" | "createdBy">;

const paperInput =
  "w-full rounded-xl border border-[#cdd8ee] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#8aa0cc] placeholder:text-slate-400";
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

const arrivalOptions = ["Ambulance", "Walk In", "Wheelchair", "Referral", "Other"];
const informedByOptions = ["Self", "Attendant", "Police", "Paramedic", "Bystander", "Family Member"];
const yesNoOptions = ["Yes", "No"];
const triageConditionOptions = ["Alert", "Verbal", "Pain", "Unconsciousness"];
const triageLevelOptions = ["Level I", "Level II", "Level III", "Not Triaged"];
const oxygenModeOptions = ["Room Air", "Nasal Cannula", "Face Mask", "NRBM", "Ventilator", "Other"];
const assessmentStateOptions = ["Clear / Stable", "Concern / Abnormal", "Not Assessed"];
const bodyMarkerStatusOptions = ["Normal", "Observe", "Injury", "Critical"];

type BodyMarker = {
  id: string;
  site: string;
  side: "front" | "back";
  status: string;
  notes: string;
};

type BodySiteDefinition = {
  id: string;
  label: string;
  side: "front" | "back";
  x: number;
  y: number;
};

const bodySiteDefinitions: BodySiteDefinition[] = [
  { id: "front-scalp", label: "Scalp", side: "front", x: 82, y: 28 },
  { id: "front-face", label: "Face", side: "front", x: 82, y: 51 },
  { id: "front-neck", label: "Neck", side: "front", x: 82, y: 84 },
  { id: "front-left-chest", label: "Left Chest", side: "front", x: 60, y: 116 },
  { id: "front-right-chest", label: "Right Chest", side: "front", x: 104, y: 116 },
  { id: "front-abdomen", label: "Abdomen", side: "front", x: 82, y: 160 },
  { id: "front-left-upper-arm", label: "Left Upper Arm", side: "front", x: 35, y: 152 },
  { id: "front-right-upper-arm", label: "Right Upper Arm", side: "front", x: 129, y: 152 },
  { id: "front-left-forearm", label: "Left Forearm", side: "front", x: 28, y: 204 },
  { id: "front-right-forearm", label: "Right Forearm", side: "front", x: 136, y: 204 },
  { id: "front-left-hand", label: "Left Hand", side: "front", x: 23, y: 254 },
  { id: "front-right-hand", label: "Right Hand", side: "front", x: 141, y: 254 },
  { id: "front-pelvis", label: "Pelvis", side: "front", x: 82, y: 210 },
  { id: "front-left-thigh", label: "Left Thigh", side: "front", x: 66, y: 266 },
  { id: "front-right-thigh", label: "Right Thigh", side: "front", x: 98, y: 266 },
  { id: "front-left-knee", label: "Left Knee", side: "front", x: 66, y: 322 },
  { id: "front-right-knee", label: "Right Knee", side: "front", x: 98, y: 322 },
  { id: "front-left-leg", label: "Left Lower Leg", side: "front", x: 66, y: 376 },
  { id: "front-right-leg", label: "Right Lower Leg", side: "front", x: 98, y: 376 },
  { id: "front-left-foot", label: "Left Foot", side: "front", x: 66, y: 434 },
  { id: "front-right-foot", label: "Right Foot", side: "front", x: 98, y: 434 },
  { id: "back-scalp", label: "Scalp", side: "back", x: 82, y: 28 },
  { id: "back-neck", label: "Neck", side: "back", x: 82, y: 84 },
  { id: "back-left-shoulder", label: "Left Shoulder", side: "back", x: 60, y: 114 },
  { id: "back-right-shoulder", label: "Right Shoulder", side: "back", x: 104, y: 114 },
  { id: "back-upper-back", label: "Upper Back", side: "back", x: 82, y: 146 },
  { id: "back-lower-back", label: "Lower Back", side: "back", x: 82, y: 186 },
  { id: "back-left-upper-arm", label: "Left Upper Arm", side: "back", x: 35, y: 152 },
  { id: "back-right-upper-arm", label: "Right Upper Arm", side: "back", x: 129, y: 152 },
  { id: "back-left-forearm", label: "Left Forearm", side: "back", x: 28, y: 204 },
  { id: "back-right-forearm", label: "Right Forearm", side: "back", x: 136, y: 204 },
  { id: "back-left-hand", label: "Left Hand", side: "back", x: 23, y: 254 },
  { id: "back-right-hand", label: "Right Hand", side: "back", x: 141, y: 254 },
  { id: "back-sacrum", label: "Sacrum", side: "back", x: 82, y: 214 },
  { id: "back-left-thigh", label: "Left Thigh", side: "back", x: 66, y: 266 },
  { id: "back-right-thigh", label: "Right Thigh", side: "back", x: 98, y: 266 },
  { id: "back-left-knee", label: "Left Knee", side: "back", x: 66, y: 322 },
  { id: "back-right-knee", label: "Right Knee", side: "back", x: 98, y: 322 },
  { id: "back-left-calf", label: "Left Calf", side: "back", x: 66, y: 376 },
  { id: "back-right-calf", label: "Right Calf", side: "back", x: 98, y: 376 },
  { id: "back-left-foot", label: "Left Foot", side: "back", x: 66, y: 434 },
  { id: "back-right-foot", label: "Right Foot", side: "back", x: 98, y: 434 },
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

function createInvestigationRow(): NursingInvestigationEntry {
  return {
    id: `inv-${Math.random().toString(36).slice(2, 9)}`,
    investigation: "",
    orderedAt: getNowForInput(),
    status: "Pending",
    resultSummary: "",
  };
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
  return String(score);
}

function deriveBloodPressure(vitals?: Record<string, string>) {
  if (!vitals) return "";
  if (vitals.sbp || vitals.dbp) return `${vitals.sbp || ""}${vitals.sbp || vitals.dbp ? "/" : ""}${vitals.dbp || ""}`;
  return "";
}

function formatSexLabel(value?: string) {
  if (value === "M") return "Male";
  if (value === "F") return "Female";
  return value ?? "";
}

function createDraft(args: {
  userName?: string;
  assignedDoctorName?: string;
  patientSex?: string;
  admissionDateTime?: string;
  chiefComplaint?: string;
  vitals?: Record<string, string>;
  triageLabel?: string;
}): DraftAssessment {
  const now = getNowForInput();
  const mewsScore = calculateMews(args.vitals ?? {}, "Alert");
  return {
    dateTime: now,
    abhaId: "",
    dateOfAdmission: args.admissionDateTime ?? now,
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    arrivalMode: "Walk In",
    informedBy: "Self",
    returnToErWithin72Hours: "No",
    broughtBy: "",
    ambulanceOrReferralId: "",
    mlcCase: "No",
    policeStation: "",
    mlcNumber: "",
    inwardReferral: "Not Applicable",
    referralFacility: "",
    referralReason: "Not Applicable",
    triageCondition: "Alert",
    triageLevel: args.triageLabel ?? "Not Triaged",
    mewsScore,
    oxygenMode: "Room Air",
    gcsEye: "",
    gcsVerbal: "",
    gcsMotor: "",
    vulnerablePatient: false,
    restraints: false,
    drugAllergy: false,
    fallRisk: false,
    bedSore: false,
    dvt: false,
    yesDetails: "",
    chiefComplaint: args.chiefComplaint ?? "",
    mainComplaintsAndFindings: "",
    pulseRate: args.vitals?.hr ?? "",
    bloodPressure: deriveBloodPressure(args.vitals),
    temperature: args.vitals?.temp ?? "",
    respiratoryRate: args.vitals?.rr ?? "",
    weightKg: "",
    rbs: args.vitals?.grbs ?? "",
    oxygenSaturation: args.vitals?.spo2 ?? "",
    painScore: "",
    airwayStatus: "Clear / Stable",
    airwayNotes: "",
    breathingStatus: "Clear / Stable",
    breathingNotes: "",
    circulationStatus: "Clear / Stable",
    circulationNotes: "",
    disabilityStatus: "Clear / Stable",
    disabilityNotes: "",
    exposureStatus: "Not Assessed",
    exposureNotes: "",
    headAssessment: "",
    neckChestAssessment: "",
    upperLimbsAssessment: "",
    lowerLimbsAssessment: "",
    abdomenAssessment: "",
    backAssessment: "",
    pelvisGenitourinaryAssessment: "",
    skinAssessment: "",
    othersAssessment: "",
    bodyMarkingsFront: "",
    bodyMarkingsBack: "",
    focusedHistorySample: "",
    pastMedicalHistory: "",
    surgicalHistory: "",
    familyHistory: "",
    allergicHistory: "",
    immunizationHistory: "",
    reasonForEmergencyAdmission: "",
    lifestyleHabits: "",
    emotionalState: "",
    physiologicalIndicators: "",
    nutritionalAssessment: "",
    bedSoreGrade: "",
    investigationsChart: [createInvestigationRow()],
    statMedications: [createMedicationRow(args.assignedDoctorName, args.userName)],
    intravenousFluids: [createFluidRow(args.userName)],
    nurseNotes: "",
    nurseName: args.userName ?? "",
    nurseSignature: args.userName ?? "",
    signedAt: now,
  };
}

export function NursingAssessmentModal({
  assessments,
  patientName,
  umr,
  patientAge,
  patientSex,
  bedNumber,
  assignedDoctorName,
  admissionDateTime,
  triageLabel,
  chiefComplaint,
  vitals,
  canEdit = false,
  currentUserName,
  embedded = false,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<DraftAssessment>(() =>
    createDraft({
      userName: currentUserName,
      assignedDoctorName,
      patientSex,
      admissionDateTime,
      chiefComplaint,
      vitals,
      triageLabel,
    }),
  );
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
      dateOfAdmission: draft.dateOfAdmission || draft.dateTime || now.slice(0, 16),
      signedAt: draft.signedAt || now.slice(0, 16),
      investigationsChart: draft.investigationsChart.filter((item) =>
        [item.investigation, item.orderedAt, item.status, item.resultSummary].some(Boolean),
      ),
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
    setDraft(
      createDraft({
        userName: currentUserName,
        assignedDoctorName,
        patientSex,
        admissionDateTime,
        chiefComplaint,
        vitals,
        triageLabel,
      }),
    );
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
              Emergency Nursing Assessment
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
          <AssessmentForm
            draft={draft}
            setDraft={setDraft}
            patientName={patientName}
            umr={umr}
            patientAge={patientAge}
            patientSex={patientSex}
            bedNumber={bedNumber}
            assignedDoctorName={assignedDoctorName}
            canEdit={canEdit}
            currentUserName={currentUserName}
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

function AssessmentForm({
  draft,
  setDraft,
  patientName,
  umr,
  patientAge,
  patientSex,
  bedNumber,
  assignedDoctorName,
  canEdit,
  currentUserName,
  onSave,
}: {
  draft: DraftAssessment;
  setDraft: (value: DraftAssessment) => void;
  patientName: string;
  umr: string;
  patientAge?: number;
  patientSex?: string;
  bedNumber?: string;
  assignedDoctorName?: string;
  canEdit: boolean;
  currentUserName?: string;
  onSave: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border-2 border-[#8aa0cc] bg-[#fcfdff] shadow-soft">
      <div className="border-b border-[#8aa0cc] bg-white px-6 py-5">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f4c96]">Nursing Assessment</div>
        <div className="mt-1 text-xs text-slate-500">
          Complete bedside documentation covering DBI arrival details, triage, ABCDE, focused history, investigations, medications, and IV fluids.
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <DigitalSection title="1. Patient Details" description="Core patient identity, admission, and contact information.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ReadOnlyField label="Patient Name" value={patientName} />
            <DigitalField label="ABHA ID" value={draft.abhaId} onChange={(value) => setDraft({ ...draft, abhaId: value })} disabled={!canEdit} />
            <DigitalField label="Date & Time of Admission" value={draft.dateOfAdmission} onChange={(value) => setDraft({ ...draft, dateOfAdmission: value })} disabled={!canEdit} type="datetime-local" />
            <ReadOnlyField label="Age / Gender" value={`${patientAge && patientAge > 0 ? `${patientAge}y` : "Age pending"} / ${formatSexLabel(patientSex) || "-"}`} />
            <ReadOnlyField label="Ward / Bed No." value={bedNumber || "-"} />
            <ReadOnlyField label="Assigned Doctor" value={assignedDoctorName || "-"} />
            <DigitalField label="Emergency Contact Name" value={draft.emergencyContactName} onChange={(value) => setDraft({ ...draft, emergencyContactName: value })} disabled={!canEdit} />
            <DigitalField label="Emergency Contact Phone" value={draft.emergencyContactPhone} onChange={(value) => setDraft({ ...draft, emergencyContactPhone: value })} disabled={!canEdit} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <DigitalField label="Emergency Contact Relation" value={draft.emergencyContactRelation} onChange={(value) => setDraft({ ...draft, emergencyContactRelation: value })} disabled={!canEdit} />
            <ReadOnlyField label="UMR No." value={umr} />
          </div>
        </DigitalSection>

        <DigitalSection title="ER Arrival Details" description="Bring the arrival and referral details from the DBI flow into the nursing record.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DigitalField label="Assessment Date & Time" value={draft.dateTime} onChange={(value) => setDraft({ ...draft, dateTime: value })} disabled={!canEdit} type="datetime-local" />
            <DigitalSelect label="Mode of Arrival" value={draft.arrivalMode} onChange={(value) => setDraft({ ...draft, arrivalMode: value })} options={arrivalOptions} disabled={!canEdit} />
            <DigitalSelect label="Informed By" value={draft.informedBy} onChange={(value) => setDraft({ ...draft, informedBy: value })} options={informedByOptions} disabled={!canEdit} />
            <DigitalSelect label="Return to ER within 72 hours" value={draft.returnToErWithin72Hours} onChange={(value) => setDraft({ ...draft, returnToErWithin72Hours: value })} options={yesNoOptions} disabled={!canEdit} />
            <DigitalField label="Brought By" value={draft.broughtBy} onChange={(value) => setDraft({ ...draft, broughtBy: value })} disabled={!canEdit} />
            <DigitalField label="Ambulance / Referral ID" value={draft.ambulanceOrReferralId} onChange={(value) => setDraft({ ...draft, ambulanceOrReferralId: value })} disabled={!canEdit} />
            <DigitalSelect label="MLC Case" value={draft.mlcCase} onChange={(value) => setDraft({ ...draft, mlcCase: value })} options={yesNoOptions} disabled={!canEdit} />
            <DigitalField label="Police Station" value={draft.policeStation} onChange={(value) => setDraft({ ...draft, policeStation: value })} disabled={!canEdit} />
            <DigitalField label="MLC Number" value={draft.mlcNumber} onChange={(value) => setDraft({ ...draft, mlcNumber: value })} disabled={!canEdit} />
            <DigitalField label="Inward Referral" value={draft.inwardReferral} onChange={(value) => setDraft({ ...draft, inwardReferral: value })} disabled={!canEdit} />
            <DigitalField label="Referral Facility" value={draft.referralFacility} onChange={(value) => setDraft({ ...draft, referralFacility: value })} disabled={!canEdit} />
            <DigitalField label="Referral Reason" value={draft.referralReason} onChange={(value) => setDraft({ ...draft, referralReason: value })} disabled={!canEdit} />
          </div>
        </DigitalSection>

        <DigitalSection title="2. Chief Complaint" description="Presenting complaint and initial nursing findings.">
          <div className="grid gap-4 xl:grid-cols-2">
            <DigitalArea label="Chief Complaint" value={draft.chiefComplaint} onChange={(value) => setDraft({ ...draft, chiefComplaint: value })} disabled={!canEdit} />
            <DigitalArea label="Main Complaints and Findings" value={draft.mainComplaintsAndFindings} onChange={(value) => setDraft({ ...draft, mainComplaintsAndFindings: value })} disabled={!canEdit} />
          </div>
        </DigitalSection>

        <DigitalSection title="3. Physical Assessment (Primary Assessment)" description="Vitals, triage, ABCDE assessment, and head-to-toe examination.">
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#8aa0cc] bg-white p-4">
                <div className="mb-3 text-sm font-bold text-[#1f4c96]">Vitals & Triage</div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <DigitalField label="Pulse Rate / Min" value={draft.pulseRate} onChange={(value) => setDraft({ ...draft, pulseRate: value })} disabled={!canEdit} />
                  <DigitalField label="Blood Pressure / mm Hg" value={draft.bloodPressure} onChange={(value) => setDraft({ ...draft, bloodPressure: value })} disabled={!canEdit} />
                  <DigitalField label="Temperature" value={draft.temperature} onChange={(value) => setDraft({ ...draft, temperature: value })} disabled={!canEdit} />
                  <DigitalField label="Respiratory Rate / Min" value={draft.respiratoryRate} onChange={(value) => setDraft({ ...draft, respiratoryRate: value })} disabled={!canEdit} />
                  <DigitalField label="Weight (Kg)" value={draft.weightKg} onChange={(value) => setDraft({ ...draft, weightKg: value })} disabled={!canEdit} />
                  <DigitalField label="RBS / GRBS" value={draft.rbs} onChange={(value) => setDraft({ ...draft, rbs: value })} disabled={!canEdit} />
                  <DigitalField label="Oxygen Saturation" value={draft.oxygenSaturation} onChange={(value) => setDraft({ ...draft, oxygenSaturation: value })} disabled={!canEdit} />
                  <DigitalSelect label="O2 Mode" value={draft.oxygenMode} onChange={(value) => setDraft({ ...draft, oxygenMode: value })} options={oxygenModeOptions} disabled={!canEdit} />
                  <DigitalSelect label="Condition at Arrival" value={draft.triageCondition} onChange={(value) => setDraft({ ...draft, triageCondition: value, mewsScore: calculateMews({ sbp: draft.bloodPressure.split("/")[0] ?? "", hr: draft.pulseRate, rr: draft.respiratoryRate, temp: draft.temperature, spo2: draft.oxygenSaturation }, value) })} options={triageConditionOptions} disabled={!canEdit} />
                  <DigitalSelect label="Triage Level" value={draft.triageLevel} onChange={(value) => setDraft({ ...draft, triageLevel: value })} options={triageLevelOptions} disabled={!canEdit} />
                  <ReadOnlyField label="MEWS Score" value={draft.mewsScore || "-"} />
                  <DigitalField label="If Yes, Please Specify" value={draft.yesDetails} onChange={(value) => setDraft({ ...draft, yesDetails: value })} disabled={!canEdit} />
                </div>
              </div>

              <div className="rounded-2xl border border-[#8aa0cc] bg-white p-4">
                <div className="mb-3 text-sm font-bold text-[#1f4c96]">Focused Risk Flags</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <RiskRow label="Vulnerable Patient" checked={draft.vulnerablePatient} onChange={(value) => setDraft({ ...draft, vulnerablePatient: value })} disabled={!canEdit} />
                  <RiskRow label="Restraints" checked={draft.restraints} onChange={(value) => setDraft({ ...draft, restraints: value })} disabled={!canEdit} />
                  <RiskRow label="Drug Allergy" checked={draft.drugAllergy} onChange={(value) => setDraft({ ...draft, drugAllergy: value })} disabled={!canEdit} />
                  <RiskRow label="Fall Risk" checked={draft.fallRisk} onChange={(value) => setDraft({ ...draft, fallRisk: value })} disabled={!canEdit} />
                  <RiskRow label="Bed Sore" checked={draft.bedSore} onChange={(value) => setDraft({ ...draft, bedSore: value })} disabled={!canEdit} />
                  <RiskRow label="DVT" checked={draft.dvt} onChange={(value) => setDraft({ ...draft, dvt: value })} disabled={!canEdit} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <DigitalRadioGroup label="Bed Sore Grade" value={draft.bedSoreGrade} onChange={(value) => setDraft({ ...draft, bedSoreGrade: value })} options={["Grade I", "Grade II", "Grade III", "Grade IV"]} disabled={!canEdit} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#8aa0cc] bg-white p-5">
              <div className="text-lg font-bold text-[#1f4c96]">Pain Assessment</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {painFaces.map((item) => {
                  const active = String(item.score) === draft.painScore;
                  return (
                    <button
                      key={item.score}
                      type="button"
                      onClick={() => canEdit && setDraft({ ...draft, painScore: String(item.score) })}
                      disabled={!canEdit}
                      className={`rounded-2xl border-2 p-4 text-center transition ${
                        active ? "border-[#1f4c96] bg-[#e9f0ff]" : "border-[#cdd8ee] bg-white hover:bg-[#f5f8ff]"
                      } ${!canEdit ? "cursor-default" : ""}`}
                    >
                      <div className="text-xs font-bold text-slate-500">{item.score}</div>
                      <div className="mt-2 text-4xl">{item.emoji}</div>
                      <div className="mt-2 text-[11px] font-bold uppercase leading-tight text-[#1f4c96]">{item.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AssessmentCard title="A. Airway" status={draft.airwayStatus} notes={draft.airwayNotes} onStatusChange={(value) => setDraft({ ...draft, airwayStatus: value })} onNotesChange={(value) => setDraft({ ...draft, airwayNotes: value })} disabled={!canEdit} />
            <AssessmentCard title="B. Breathing" status={draft.breathingStatus} notes={draft.breathingNotes} onStatusChange={(value) => setDraft({ ...draft, breathingStatus: value })} onNotesChange={(value) => setDraft({ ...draft, breathingNotes: value })} disabled={!canEdit} />
            <AssessmentCard title="C. Circulation" status={draft.circulationStatus} notes={draft.circulationNotes} onStatusChange={(value) => setDraft({ ...draft, circulationStatus: value })} onNotesChange={(value) => setDraft({ ...draft, circulationNotes: value })} disabled={!canEdit} />
            <AssessmentCard title="D. Disability" status={draft.disabilityStatus} notes={draft.disabilityNotes} onStatusChange={(value) => setDraft({ ...draft, disabilityStatus: value })} onNotesChange={(value) => setDraft({ ...draft, disabilityNotes: value })} disabled={!canEdit} />
            <AssessmentCard title="E. Exposure" status={draft.exposureStatus} notes={draft.exposureNotes} onStatusChange={(value) => setDraft({ ...draft, exposureStatus: value })} onNotesChange={(value) => setDraft({ ...draft, exposureNotes: value })} disabled={!canEdit} />
            <div className="rounded-2xl border border-[#cdd8ee] bg-white p-4">
              <div className="mb-3 text-sm font-bold text-navy">Neurological</div>
              <div className="grid gap-4 md:grid-cols-3">
                <DigitalField label="GCS Eye" value={draft.gcsEye} onChange={(value) => setDraft({ ...draft, gcsEye: value })} disabled={!canEdit} />
                <DigitalField label="GCS Verbal" value={draft.gcsVerbal} onChange={(value) => setDraft({ ...draft, gcsVerbal: value })} disabled={!canEdit} />
                <DigitalField label="GCS Motor" value={draft.gcsMotor} onChange={(value) => setDraft({ ...draft, gcsMotor: value })} disabled={!canEdit} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <DigitalArea label="Head" value={draft.headAssessment} onChange={(value) => setDraft({ ...draft, headAssessment: value })} disabled={!canEdit} />
            <DigitalArea label="Neck / Chest" value={draft.neckChestAssessment} onChange={(value) => setDraft({ ...draft, neckChestAssessment: value })} disabled={!canEdit} />
            <DigitalArea label="Upper Limbs" value={draft.upperLimbsAssessment} onChange={(value) => setDraft({ ...draft, upperLimbsAssessment: value })} disabled={!canEdit} />
            <DigitalArea label="Lower Limbs" value={draft.lowerLimbsAssessment} onChange={(value) => setDraft({ ...draft, lowerLimbsAssessment: value })} disabled={!canEdit} />
            <DigitalArea label="Abdomen" value={draft.abdomenAssessment} onChange={(value) => setDraft({ ...draft, abdomenAssessment: value })} disabled={!canEdit} />
            <DigitalArea label="Back" value={draft.backAssessment} onChange={(value) => setDraft({ ...draft, backAssessment: value })} disabled={!canEdit} />
            <DigitalArea label="Pelvis / Genitourinary" value={draft.pelvisGenitourinaryAssessment} onChange={(value) => setDraft({ ...draft, pelvisGenitourinaryAssessment: value })} disabled={!canEdit} />
            <DigitalArea label="Skin" value={draft.skinAssessment} onChange={(value) => setDraft({ ...draft, skinAssessment: value })} disabled={!canEdit} />
            <DigitalArea label="Others" value={draft.othersAssessment} onChange={(value) => setDraft({ ...draft, othersAssessment: value })} disabled={!canEdit} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <BodyMarkingCard title="Human Body Markings - Front" value={draft.bodyMarkingsFront} onChange={(value) => setDraft({ ...draft, bodyMarkingsFront: value })} disabled={!canEdit} />
            <BodyMarkingCard title="Human Body Markings - Back" value={draft.bodyMarkingsBack} onChange={(value) => setDraft({ ...draft, bodyMarkingsBack: value })} disabled={!canEdit} back />
          </div>
        </DigitalSection>

        <DigitalSection title="4. Patient History (Secondary Assessment)" description="Focused history, personal history, and broader nurse assessment indicators.">
          <div className="grid gap-4 xl:grid-cols-2">
            <DigitalArea label="Focused History - SAMPLE" value={draft.focusedHistorySample} onChange={(value) => setDraft({ ...draft, focusedHistorySample: value })} disabled={!canEdit} />
            <DigitalArea label="Past Medical History" value={draft.pastMedicalHistory} onChange={(value) => setDraft({ ...draft, pastMedicalHistory: value })} disabled={!canEdit} />
            <DigitalArea label="Surgical History" value={draft.surgicalHistory} onChange={(value) => setDraft({ ...draft, surgicalHistory: value })} disabled={!canEdit} />
            <DigitalArea label="Family History" value={draft.familyHistory} onChange={(value) => setDraft({ ...draft, familyHistory: value })} disabled={!canEdit} />
            <DigitalArea label="Allergic History" value={draft.allergicHistory} onChange={(value) => setDraft({ ...draft, allergicHistory: value })} disabled={!canEdit} />
            <DigitalArea label="Immunization History" value={draft.immunizationHistory} onChange={(value) => setDraft({ ...draft, immunizationHistory: value })} disabled={!canEdit} />
            <DigitalArea label="Reason for Emergency Admission" value={draft.reasonForEmergencyAdmission} onChange={(value) => setDraft({ ...draft, reasonForEmergencyAdmission: value })} disabled={!canEdit} />
            <DigitalArea label="Lifestyle Habits" value={draft.lifestyleHabits} onChange={(value) => setDraft({ ...draft, lifestyleHabits: value })} disabled={!canEdit} />
            <DigitalArea label="Emotional State" value={draft.emotionalState} onChange={(value) => setDraft({ ...draft, emotionalState: value })} disabled={!canEdit} />
            <DigitalArea label="Physiological Indicators" value={draft.physiologicalIndicators} onChange={(value) => setDraft({ ...draft, physiologicalIndicators: value })} disabled={!canEdit} />
            <DigitalArea label="Nutritional Assessment" value={draft.nutritionalAssessment} onChange={(value) => setDraft({ ...draft, nutritionalAssessment: value })} disabled={!canEdit} />
          </div>
        </DigitalSection>

        <DigitalSection
          title="5. Investigations Chart"
          description="Digital investigation tracker instead of a paper investigation line."
          actionLabel="Add investigation"
          onAction={() => setDraft({ ...draft, investigationsChart: [...draft.investigationsChart, createInvestigationRow()] })}
          canEdit={canEdit}
        >
          <div className="space-y-3">
            {draft.investigationsChart.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-[#cdd8ee] bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-navy">Investigation {index + 1}</div>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => removeInvestigationRow(draft, setDraft, index)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <DigitalField label="Investigation" value={item.investigation} onChange={(value) => updateInvestigationRow(draft, setDraft, index, "investigation", value)} disabled={!canEdit} />
                  <DigitalField label="Ordered At" value={item.orderedAt} onChange={(value) => updateInvestigationRow(draft, setDraft, index, "orderedAt", value)} disabled={!canEdit} type="datetime-local" />
                  <DigitalField label="Status" value={item.status} onChange={(value) => updateInvestigationRow(draft, setDraft, index, "status", value)} disabled={!canEdit} />
                  <DigitalField label="Result Summary" value={item.resultSummary} onChange={(value) => updateInvestigationRow(draft, setDraft, index, "resultSummary", value)} disabled={!canEdit} />
                </div>
              </div>
            ))}
          </div>
        </DigitalSection>

        <DigitalSection
          title="6. Medications Chart"
          description="Digital stat medication administration chart with timestamps and sign fields."
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
                  <DigitalField label="Date & Time" value={item.dateTime} onChange={(value) => updateMedicationRow(draft, setDraft, index, "dateTime", value)} disabled={!canEdit} type="datetime-local" />
                  <DigitalField label="Drug Name" value={item.drugName} onChange={(value) => updateMedicationRow(draft, setDraft, index, "drugName", value)} disabled={!canEdit} />
                  <DigitalField label="Dose" value={item.dose} onChange={(value) => updateMedicationRow(draft, setDraft, index, "dose", value)} disabled={!canEdit} />
                  <DigitalField label="Route" value={item.route} onChange={(value) => updateMedicationRow(draft, setDraft, index, "route", value)} disabled={!canEdit} />
                  <DigitalField label="Frequency" value={item.frequency} onChange={(value) => updateMedicationRow(draft, setDraft, index, "frequency", value)} disabled={!canEdit} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <DigitalField label="Doctor Counter Sign" value={item.counterSignByDoctor} onChange={(value) => updateMedicationRow(draft, setDraft, index, "counterSignByDoctor", value)} disabled={!canEdit} />
                  <DigitalField label="Sign With Name 1" value={item.sign1By} onChange={(value) => updateMedicationRow(draft, setDraft, index, "sign1By", value)} disabled={!canEdit} />
                  <DigitalField label="Time 1" value={item.sign1Time} onChange={(value) => updateMedicationRow(draft, setDraft, index, "sign1Time", value)} disabled={!canEdit} type="datetime-local" />
                  <DigitalField label="Sign With Name 2" value={item.sign2By} onChange={(value) => updateMedicationRow(draft, setDraft, index, "sign2By", value)} disabled={!canEdit} />
                  <DigitalField label="Time 2" value={item.sign2Time} onChange={(value) => updateMedicationRow(draft, setDraft, index, "sign2Time", value)} disabled={!canEdit} type="datetime-local" />
                </div>
              </div>
            ))}
          </div>
        </DigitalSection>

        <DigitalSection
          title="7. Intravenous Fluid"
          description="Digital IV fluid administration chart."
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
                  <DigitalField label="IV Fluid" value={item.fluidName} onChange={(value) => updateFluidRow(draft, setDraft, index, "fluidName", value)} disabled={!canEdit} />
                  <DigitalField label="No." value={item.serialNumber} onChange={(value) => updateFluidRow(draft, setDraft, index, "serialNumber", value)} disabled={!canEdit} />
                  <DigitalField label="Time Started" value={item.timeStarted} onChange={(value) => updateFluidRow(draft, setDraft, index, "timeStarted", value)} disabled={!canEdit} type="datetime-local" />
                  <DigitalField label="Time Stopped" value={item.timeStopped} onChange={(value) => updateFluidRow(draft, setDraft, index, "timeStopped", value)} disabled={!canEdit} type="datetime-local" />
                  <DigitalField label="Sign With Name" value={item.signWithName} onChange={(value) => updateFluidRow(draft, setDraft, index, "signWithName", value)} disabled={!canEdit} />
                </div>
              </div>
            ))}
          </div>
        </DigitalSection>

        <DigitalSection title="8. Nurse Name and Sign Off" description="Complete notes and sign-off for the recorded assessment.">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <DigitalArea label="Nurse Notes" value={draft.nurseNotes} onChange={(value) => setDraft({ ...draft, nurseNotes: value })} disabled={!canEdit} />
            <div className="space-y-4 rounded-2xl border border-[#cdd8ee] bg-white p-4">
              <DigitalField label="Name of Nurse" value={draft.nurseName} onChange={(value) => setDraft({ ...draft, nurseName: value })} disabled={!canEdit} />
              <DigitalField label="Signature" value={draft.nurseSignature} onChange={(value) => setDraft({ ...draft, nurseSignature: value })} disabled={!canEdit} />
              <DigitalField label="Time" value={draft.signedAt} onChange={(value) => setDraft({ ...draft, signedAt: value })} disabled={!canEdit} type="datetime-local" />
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
        className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-[2rem] bg-background shadow-soft-lg"
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
              <div>MEWS {entry.mewsScore || "-"}</div>
              <div>{entry.triageLevel || "-"}</div>
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

          {entry.chiefComplaint ? (
            <div className="mt-3 rounded-2xl bg-secondary/20 p-3 text-xs text-navy">
              <div className="font-semibold">Chief complaint</div>
              <div className="mt-1">{entry.chiefComplaint}</div>
            </div>
          ) : null}

          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
            <span>Arrival {entry.arrivalMode || "-"}</span>
            <span>Condition {entry.triageCondition || "-"}</span>
            <span>Pulse {entry.pulseRate || "-"}/min</span>
            <span>BP {entry.bloodPressure || "-"}</span>
            <span>Resp {entry.respiratoryRate || "-"}/min</span>
            <span>Temp {entry.temperature || "-"}</span>
            <span>SpO2 {entry.oxygenSaturation || "-"}</span>
            <span>RBS {entry.rbs || "-"}</span>
          </div>

          {entry.mainComplaintsAndFindings ? (
            <div className="mt-3 text-xs text-muted-foreground">{entry.mainComplaintsAndFindings}</div>
          ) : null}
          {entry.nurseNotes ? <div className="mt-2 text-xs text-muted-foreground">{entry.nurseNotes}</div> : null}
        </div>
      ))}
    </div>
  );
}

function updateInvestigationRow(
  draft: DraftAssessment,
  setDraft: (value: DraftAssessment) => void,
  index: number,
  key: keyof NursingInvestigationEntry,
  value: string,
) {
  const next = draft.investigationsChart.map((item, itemIndex) =>
    itemIndex === index ? { ...item, [key]: value } : item,
  );
  setDraft({ ...draft, investigationsChart: next });
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

function removeInvestigationRow(draft: DraftAssessment, setDraft: (value: DraftAssessment) => void, index: number) {
  const next = draft.investigationsChart.filter((_, itemIndex) => itemIndex !== index);
  setDraft({
    ...draft,
    investigationsChart: next.length ? next : [createInvestigationRow()],
  });
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#cdd8ee] bg-slate-50 px-4 py-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value || "-"}</div>
    </div>
  );
}

function AssessmentCard({
  title,
  status,
  notes,
  onStatusChange,
  onNotesChange,
  disabled = false,
}: {
  title: string;
  status: string;
  notes: string;
  onStatusChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#cdd8ee] bg-white p-4">
      <div className="mb-3 text-sm font-bold text-navy">{title}</div>
      <DigitalSelect label="Status" value={status} onChange={onStatusChange} options={assessmentStateOptions} disabled={disabled} />
      <div className="mt-3">
        <DigitalArea label="Notes" value={notes} onChange={onNotesChange} disabled={disabled} />
      </div>
    </div>
  );
}

function BodyMarkingCard({
  title,
  value,
  onChange,
  disabled = false,
  back = false,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  back?: boolean;
}) {
  const side: "front" | "back" = back ? "back" : "front";
  const markers = parseBodyMarkers(value, side);
  const sites = bodySiteDefinitions.filter((item) => item.side === side);
  const selectedMarker = markers[0] ?? null;

  const upsertMarker = (site: BodySiteDefinition) => {
    const existing = markers.find((item) => item.site === site.label);
    if (existing || disabled) return;
    onChange(
      serializeBodyMarkers([
        ...markers,
        {
          id: `marker-${Math.random().toString(36).slice(2, 9)}`,
          site: site.label,
          side,
          status: "Observe",
          notes: "",
        },
      ]),
    );
  };

  const updateMarker = (markerId: string, patch: Partial<BodyMarker>) => {
    onChange(
      serializeBodyMarkers(
        markers.map((item) => (item.id === markerId ? { ...item, ...patch } : item)),
      ),
    );
  };

  const removeMarker = (markerId: string) => {
    onChange(serializeBodyMarkers(markers.filter((item) => item.id !== markerId)));
  };

  return (
    <div className="rounded-2xl border border-[#cdd8ee] bg-white p-4">
      <div className="mb-3 text-sm font-bold text-navy">{title}</div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="rounded-2xl border border-dashed border-[#8aa0cc] bg-[#f8fbff] p-4">
          <BodySvg
            back={back}
            markers={markers}
            onSelectSite={upsertMarker}
            disabled={disabled}
          />
          <div className="mt-3 text-[11px] text-slate-500">
            Tap a body segment to add a marked site. Then set its status and notes from the list on the right.
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-[#cdd8ee] bg-slate-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Marked Sites</div>
            <div className="mt-1 text-sm text-slate-700">
              {markers.length ? `${markers.length} marked ${markers.length === 1 ? "site" : "sites"}` : "No marked sites yet"}
            </div>
          </div>

          {markers.length ? (
            markers.map((marker, index) => (
              <div key={marker.id} className="rounded-2xl border border-[#cdd8ee] bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white ${markerToneClass(marker.status)}`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-navy">{marker.site}</div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{side}</div>
                    </div>
                  </div>
                  {disabled ? null : (
                    <button
                      type="button"
                      onClick={() => removeMarker(marker.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-[160px_1fr]">
                  <DigitalSelect
                    label="Status"
                    value={marker.status}
                    onChange={(next) => updateMarker(marker.id, { status: next })}
                    options={bodyMarkerStatusOptions}
                    disabled={disabled}
                  />
                  <DigitalArea
                    label="Notes"
                    value={marker.notes}
                    onChange={(next) => updateMarker(marker.id, { notes: next })}
                    disabled={disabled}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#cdd8ee] bg-white px-4 py-6 text-sm text-slate-500">
              No marked sites yet. Select a scalp, chest, limb, abdomen, pelvis, back, or lower-limb point on the diagram.
            </div>
          )}

          <DigitalArea label="Additional Marking Notes" value={selectedMarker ? "" : value && !looksLikeSerializedMarkers(value) ? value : ""} onChange={onChange} disabled={disabled || looksLikeSerializedMarkers(value)} />
          {looksLikeSerializedMarkers(value) ? (
            <div className="text-[11px] text-slate-500">
              Marker data is being stored structurally from the interactive site list above.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BodySvg({
  back = false,
  markers,
  onSelectSite,
  disabled = false,
}: {
  back?: boolean;
  markers: BodyMarker[];
  onSelectSite: (site: BodySiteDefinition) => void;
  disabled?: boolean;
}) {
  const side: "front" | "back" = back ? "back" : "front";
  const sites = bodySiteDefinitions.filter((item) => item.side === side);
  return (
    <svg viewBox="0 0 164 452" className="mx-auto h-[29rem] w-auto text-[#7d90b8]" fill="none" stroke="currentColor" strokeWidth="3">
      <rect x="18" y="8" width="128" height="436" rx="28" fill="#eef4ff" stroke="none" />

      <g fill="#efc2a7" stroke="#ffffff" strokeWidth="2.2" strokeLinejoin="round">
        <ellipse cx="82" cy="31" rx="20" ry="23" />
        <path d="M68 53c4 7 24 7 28 0v16c0 6-4 11-10 13l-4 1-4-1c-6-2-10-7-10-13V53Z" />
        <path d="M60 82c6-9 16-14 22-14s16 5 22 14l6 20c2 7-1 14-8 18l-7 3-5-16-8 10-8-10-5 16-7-3c-7-4-10-11-8-18l6-20Z" />
        {back ? (
          <>
            <path d="M61 116c7-4 14-6 21-6s14 2 21 6l5 33c1 8-2 15-9 20l-7 5H72l-7-5c-7-5-10-12-9-20l5-33Z" />
            <path d="M67 176c4-3 11-4 15-4s11 1 15 4l3 31c1 13-3 25-11 36l-7 9-7-9c-8-11-12-23-11-36l3-31Z" />
          </>
        ) : (
          <>
            <path d="M58 116c7-4 15-6 24-6s17 2 24 6l4 17c2 9-1 18-8 24l-7 5-6-17-7 20h-1l-7-20-6 17-7-5c-7-6-10-15-8-24l4-17Z" />
            <path d="M61 166c5-4 14-6 21-6s16 2 21 6l3 33c1 12-4 24-12 32l-12 11-12-11c-8-8-13-20-12-32l3-33Z" />
          </>
        )}

        <path d="M52 91c-6 7-10 14-12 24l-6 24c-2 9 2 18 9 23l10 7c4 3 10 1 13-4l4-8-5-28-13-38Z" />
        <path d="M112 91c6 7 10 14 12 24l6 24c2 9-2 18-9 23l-10 7c-4 3-10 1-13-4l-4-8 5-28 13-38Z" />
        <path d="M35 164c3-3 9-4 13-1l6 31c1 9-2 18-8 25l-7 8c-3 4-8 4-11 0l-2-4 9-59Z" />
        <path d="M129 164c-3-3-9-4-13-1l-6 31c-1 9 2 18 8 25l7 8c3 4 8 4 11 0l2-4-9-59Z" />
        <path d="M27 228c3-2 8-2 11 1l2 12-2 20c0 4-3 7-6 8l-4 1c-4 1-7-2-7-6v-18l6-18Z" />
        <path d="M137 228c-3-2-8-2-11 1l-2 12 2 20c0 4 3 7 6 8l4 1c4 1 7-2 7-6v-18l-6-18Z" />

        <path d="M62 242c5-4 13-6 20-6s15 2 20 6l4 54c1 15-4 29-14 40l-10 11-10-11c-10-11-15-25-14-40l4-54Z" />
        <path d="M57 347c3-2 9-3 12-1l2 44c1 12-3 25-10 34l-4 5c-3 4-8 4-11 0l-2-4 3-78Z" />
        <path d="M107 347c-3-2-9-3-12-1l-2 44c-1 12 3 25 10 34l4 5c3 4 8 4 11 0l2-4-3-78Z" />
        <path d="M49 426c4-3 12-3 16 0l4 11c1 4-2 7-6 7H50c-5 0-8-5-5-9l4-9Z" />
        <path d="M115 426c-4-3-12-3-16 0l-4 11c-1 4 2 7 6 7h13c5 0 8-5 5-9l-4-9Z" />
      </g>

      <g stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {back ? (
          <>
            <path d="M82 83v22" />
            <path d="M60 118c7 5 15 7 22 7s15-2 22-7" />
            <path d="M65 146c6 3 11 4 17 4s11-1 17-4" />
            <path d="M64 193c6 4 12 6 18 6s12-2 18-6" />
            <path d="M64 248c7 4 12 5 18 5s11-1 18-5" />
          </>
        ) : (
          <>
            <path d="M82 82v24" />
            <path d="M64 121c4 7 9 11 18 11s14-4 18-11" />
            <path d="M72 166c3 9 3 19 0 31" />
            <path d="M92 166c-3 9-3 19 0 31" />
            <path d="M69 205c4 3 8 4 13 4s9-1 13-4" />
            <path d="M65 247c5-3 11-4 17-4s12 1 17 4" />
          </>
        )}
      </g>
      {sites.map((site) => {
        const marker = markers.find((item) => item.site === site.label);
        return (
          <g key={site.id}>
            <circle
              cx={site.x}
              cy={site.y}
              r="8.5"
              fill={marker ? markerToneFill(marker.status) : "#ffffff"}
              stroke={marker ? markerToneStroke(marker.status) : "#34a853"}
              className={disabled || marker ? "" : "cursor-pointer"}
              onClick={() => onSelectSite(site)}
            />
            {marker ? (
              <text x={site.x} y={site.y + 3} textAnchor="middle" fontSize="8" fill="#ffffff" stroke="none" fontWeight="700">
                {markers.findIndex((item) => item.id === marker.id) + 1}
              </text>
            ) : (
              <circle cx={site.x} cy={site.y} r="2.75" fill="#34a853" stroke="none" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function parseBodyMarkers(raw: string, side: "front" | "back"): BodyMarker[] {
  if (!looksLikeSerializedMarkers(raw)) return [];
  try {
    const parsed = JSON.parse(raw) as BodyMarker[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.side === side && typeof item.site === "string");
  } catch {
    return [];
  }
}

function serializeBodyMarkers(markers: BodyMarker[]) {
  return JSON.stringify(markers);
}

function looksLikeSerializedMarkers(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("[") && trimmed.endsWith("]");
}

function markerToneClass(status: string) {
  if (status === "Critical") return "bg-red-500";
  if (status === "Injury") return "bg-orange-500";
  if (status === "Observe") return "bg-amber-500";
  return "bg-emerald-500";
}

function markerToneFill(status: string) {
  if (status === "Critical") return "#ef4444";
  if (status === "Injury") return "#f97316";
  if (status === "Observe") return "#f59e0b";
  return "#22c55e";
}

function markerToneStroke(status: string) {
  if (status === "Critical") return "#b91c1c";
  if (status === "Injury") return "#c2410c";
  if (status === "Observe") return "#b45309";
  return "#15803d";
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
    <div className="rounded-2xl border border-[#cdd8ee] bg-white px-4 py-3">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      <div className="flex items-center gap-4 text-sm text-slate-700">
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
    </div>
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <input
        type={type}
        className={paperInput}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

function DigitalSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <select className={paperInput} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DigitalRadioGroup({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <PaperField label={label}>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => (
          <label key={option} className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              className={checkboxClass}
              checked={value === option}
              onChange={() => onChange(option)}
              disabled={disabled}
            />
            {option}
          </label>
        ))}
      </div>
    </PaperField>
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
