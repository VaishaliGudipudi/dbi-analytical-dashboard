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
  "w-full rounded-2xl border border-[#c9d8f2] bg-[#fdfefe] px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition focus:border-[#7d98d1] focus:bg-white focus:ring-2 focus:ring-[#d9e6ff] disabled:bg-slate-50 disabled:text-slate-500 placeholder:text-slate-400";
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
const genderOptions = ["Select", "Male", "Female", "Other"];
const bloodGroupOptions = ["Select", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const paymentMethodOptions = ["None", "Insurance", "Cash"];
const triageConditionOptions = ["Alert", "Verbal", "Pain", "Unconsciousness"];
const triageLevelOptions = ["Level I", "Level II", "Level III", "Not Triaged"];
const oxygenModeOptions = ["Room Air", "Nasal Cannula", "Face Mask", "NRBM", "Ventilator", "Other"];
const bodyMarkerStatusOptions = ["Normal", "Observe", "Injury", "Critical"];
const physiologicalIndicatorOptions = ["Stable", "Needs Observation", "Abnormal", "Critical"];
const medicationHistoryOptions = ["Regular medicines", "On antibiotics", "Anticoagulants", "Insulin", "Unknown", "None"];
const allergyHistoryOptions = ["Drug allergy", "Food allergy", "Latex allergy", "No known allergy"];
const familyHistoryOptions = ["Diabetes", "Hypertension", "Heart disease", "Stroke", "Asthma", "None significant"];
const immunizationHistoryOptions = ["Up to date", "Partial", "Unknown", "Not applicable"];
const lifestyleHabitOptions = ["Smoking", "Alcohol", "Tobacco", "Substance use", "Sedentary", "None reported"];
const emotionalStateOptions = ["Calm", "Anxious", "Agitated", "Distressed", "Withdrawn", "Cooperative"];

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
  r?: number;
  rx?: number;
  ry?: number;
};

const frontBodyViewBox = {
  minX: 465.596,
  minY: 99.243,
  width: 135.88,
  height: 301.513,
};

const bodySiteDefinitions: BodySiteDefinition[] = [
  { id: "front-forehead", label: "Forehead", side: "front", x: 82, y: 18, rx: 9, ry: 8 },
  { id: "front-face", label: "Face", side: "front", x: 82, y: 36, rx: 10, ry: 10 },
  { id: "front-neck", label: "Neck", side: "front", x: 82, y: 58, rx: 8, ry: 7 },
  { id: "front-left-clavicle", label: "Left Clavicle", side: "front", x: 62, y: 73, rx: 10, ry: 7 },
  { id: "front-right-clavicle", label: "Right Clavicle", side: "front", x: 102, y: 73, rx: 10, ry: 7 },
  { id: "front-left-chest", label: "Left Chest", side: "front", x: 67, y: 96, rx: 14, ry: 13 },
  { id: "front-right-chest", label: "Right Chest", side: "front", x: 97, y: 96, rx: 14, ry: 13 },
  { id: "front-sternum", label: "Sternum", side: "front", x: 82, y: 100, rx: 8, ry: 11 },
  { id: "front-left-shoulder", label: "Left Shoulder", side: "front", x: 46, y: 95, rx: 10, ry: 9 },
  { id: "front-right-shoulder", label: "Right Shoulder", side: "front", x: 118, y: 95, rx: 10, ry: 9 },
  { id: "front-left-upper-arm", label: "Left Upper Arm", side: "front", x: 34, y: 128, rx: 9, ry: 14 },
  { id: "front-right-upper-arm", label: "Right Upper Arm", side: "front", x: 130, y: 128, rx: 9, ry: 14 },
  { id: "front-left-elbow", label: "Left Elbow", side: "front", x: 29, y: 164, rx: 8, ry: 8 },
  { id: "front-right-elbow", label: "Right Elbow", side: "front", x: 135, y: 164, rx: 8, ry: 8 },
  { id: "front-left-forearm", label: "Left Forearm", side: "front", x: 28, y: 203, rx: 8, ry: 15 },
  { id: "front-right-forearm", label: "Right Forearm", side: "front", x: 136, y: 203, rx: 8, ry: 15 },
  { id: "front-left-hand", label: "Left Hand", side: "front", x: 34, y: 246, rx: 10, ry: 11 },
  { id: "front-right-hand", label: "Right Hand", side: "front", x: 130, y: 246, rx: 10, ry: 11 },
  { id: "front-upper-abdomen", label: "Upper Abdomen", side: "front", x: 82, y: 136, rx: 13, ry: 11 },
  { id: "front-lower-abdomen", label: "Lower Abdomen", side: "front", x: 82, y: 165, rx: 13, ry: 11 },
  { id: "front-pelvis", label: "Pelvis", side: "front", x: 82, y: 206, rx: 13, ry: 10 },
  { id: "front-left-groin", label: "Left Groin", side: "front", x: 69, y: 225, rx: 8, ry: 8 },
  { id: "front-right-groin", label: "Right Groin", side: "front", x: 95, y: 225, rx: 8, ry: 8 },
  { id: "front-left-thigh", label: "Left Thigh", side: "front", x: 68, y: 273, rx: 10, ry: 18 },
  { id: "front-right-thigh", label: "Right Thigh", side: "front", x: 96, y: 273, rx: 10, ry: 18 },
  { id: "front-left-knee", label: "Left Knee", side: "front", x: 68, y: 331, rx: 9, ry: 9 },
  { id: "front-right-knee", label: "Right Knee", side: "front", x: 96, y: 331, rx: 9, ry: 9 },
  { id: "front-left-shin", label: "Left Shin", side: "front", x: 67, y: 382, rx: 9, ry: 18 },
  { id: "front-right-shin", label: "Right Shin", side: "front", x: 97, y: 382, rx: 9, ry: 18 },
  { id: "front-left-ankle", label: "Left Ankle", side: "front", x: 66, y: 429, rx: 8, ry: 8 },
  { id: "front-right-ankle", label: "Right Ankle", side: "front", x: 98, y: 429, rx: 8, ry: 8 },
  { id: "front-left-foot", label: "Left Foot", side: "front", x: 62, y: 458, rx: 10, ry: 8 },
  { id: "front-right-foot", label: "Right Foot", side: "front", x: 102, y: 458, rx: 10, ry: 8 },
  { id: "back-scalp", label: "Scalp", side: "back", x: 82, y: 18, rx: 9, ry: 8 },
  { id: "back-neck", label: "Neck", side: "back", x: 82, y: 52, rx: 8, ry: 7 },
  { id: "back-left-shoulder", label: "Left Shoulder", side: "back", x: 58, y: 78, rx: 10, ry: 9 },
  { id: "back-right-shoulder", label: "Right Shoulder", side: "back", x: 106, y: 78, rx: 10, ry: 9 },
  { id: "back-upper-back", label: "Upper Back", side: "back", x: 82, y: 102, rx: 14, ry: 12 },
  { id: "back-left-scapula", label: "Left Scapula", side: "back", x: 65, y: 108, rx: 10, ry: 10 },
  { id: "back-right-scapula", label: "Right Scapula", side: "back", x: 99, y: 108, rx: 10, ry: 10 },
  { id: "back-left-upper-arm", label: "Left Upper Arm", side: "back", x: 38, y: 126, rx: 9, ry: 14 },
  { id: "back-right-upper-arm", label: "Right Upper Arm", side: "back", x: 126, y: 126, rx: 9, ry: 14 },
  { id: "back-left-elbow", label: "Left Elbow", side: "back", x: 30, y: 164, rx: 8, ry: 8 },
  { id: "back-right-elbow", label: "Right Elbow", side: "back", x: 134, y: 164, rx: 8, ry: 8 },
  { id: "back-left-forearm", label: "Left Forearm", side: "back", x: 28, y: 202, rx: 8, ry: 15 },
  { id: "back-right-forearm", label: "Right Forearm", side: "back", x: 136, y: 202, rx: 8, ry: 15 },
  { id: "back-left-hand", label: "Left Hand", side: "back", x: 34, y: 245, rx: 10, ry: 11 },
  { id: "back-right-hand", label: "Right Hand", side: "back", x: 130, y: 245, rx: 10, ry: 11 },
  { id: "back-mid-back", label: "Mid Back", side: "back", x: 82, y: 146, rx: 13, ry: 10 },
  { id: "back-lower-back", label: "Lower Back", side: "back", x: 82, y: 183, rx: 13, ry: 10 },
  { id: "back-sacrum", label: "Sacrum", side: "back", x: 82, y: 214, rx: 10, ry: 9 },
  { id: "back-left-glute", label: "Left Glute", side: "back", x: 69, y: 226, rx: 8, ry: 8 },
  { id: "back-right-glute", label: "Right Glute", side: "back", x: 95, y: 226, rx: 8, ry: 8 },
  { id: "back-left-thigh", label: "Left Thigh", side: "back", x: 68, y: 273, rx: 10, ry: 18 },
  { id: "back-right-thigh", label: "Right Thigh", side: "back", x: 96, y: 273, rx: 10, ry: 18 },
  { id: "back-left-knee", label: "Left Knee", side: "back", x: 68, y: 331, rx: 9, ry: 9 },
  { id: "back-right-knee", label: "Right Knee", side: "back", x: 96, y: 331, rx: 9, ry: 9 },
  { id: "back-left-calf", label: "Left Calf", side: "back", x: 67, y: 382, rx: 9, ry: 18 },
  { id: "back-right-calf", label: "Right Calf", side: "back", x: 97, y: 382, rx: 9, ry: 18 },
  { id: "back-left-ankle", label: "Left Ankle", side: "back", x: 66, y: 429, rx: 8, ry: 8 },
  { id: "back-right-ankle", label: "Right Ankle", side: "back", x: 98, y: 429, rx: 8, ry: 8 },
  { id: "back-left-foot", label: "Left Foot", side: "back", x: 62, y: 458, rx: 10, ry: 8 },
  { id: "back-right-foot", label: "Right Foot", side: "back", x: 102, y: 458, rx: 10, ry: 8 },
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
    registrationSource: "Pull from HIS",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    birthYear: "",
    birthMonth: "",
    umrNumber: "",
    gender: "Select",
    bloodGroup: "Select",
    addressLine: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    phoneNumber: "",
    emailAddress: "",
    emergencyContactNumber: "",
    paymentMethod: "None",
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
    physiologicalIndicators: physiologicalIndicatorOptions[0],
    nutritionalAssessment: "",
    bedSoreGrade: "",
    investigationsChart: [],
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
      investigationsChart: [],
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
          Complete bedside documentation covering focused risk flags, pain, head-to-toe assessment, quick secondary assessment, medications, and IV fluids.
        </div>
      </div>

      <div className="space-y-7 px-6 py-6">
        <DigitalSection title="1. Initial Assessment" description="Focused bedside assessment without registration or duplicate vitals entry.">
          <div className="grid items-stretch gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.68fr)]">
            <div>
              <div className="h-full rounded-2xl border border-[#8aa0cc] bg-white p-4 shadow-[0_8px_24px_rgba(31,76,150,0.05)]">
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

            <div className="h-full rounded-2xl border border-[#8aa0cc] bg-white p-4 shadow-[0_8px_24px_rgba(31,76,150,0.06)]">
              <div className="text-lg font-bold text-[#1f4c96]">Pain Assessment</div>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {painFaces.map((item) => {
                  const active = String(item.score) === draft.painScore;
                  return (
                    <button
                      key={item.score}
                      type="button"
                      onClick={() => canEdit && setDraft({ ...draft, painScore: String(item.score) })}
                      disabled={!canEdit}
                      className={`rounded-2xl border-2 px-3 py-2.5 text-center transition ${
                        active ? "border-[#1f4c96] bg-[#e9f0ff]" : "border-[#cdd8ee] bg-white hover:bg-[#f5f8ff]"
                      } ${!canEdit ? "cursor-default" : ""}`}
                    >
                      <div className="text-xs font-bold text-slate-500">{item.score}</div>
                      <div className="mt-1 text-[1.65rem] leading-none">{item.emoji}</div>
                      <div className="mt-1.5 text-[10px] font-bold uppercase leading-tight text-[#1f4c96]">{item.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-7 pt-1">
            <div className="rounded-2xl border border-[#cdd8ee] bg-white p-4 shadow-[0_6px_18px_rgba(31,76,150,0.05)]">
              <div className="mb-3 text-sm font-bold text-navy">Head-to-Toe Initial Assessment</div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <DigitalArea label="Head and Face" value={draft.headAssessment} onChange={(value) => setDraft({ ...draft, headAssessment: value })} disabled={!canEdit} compact />
                <DigitalArea label="Neck and Chest" value={draft.neckChestAssessment} onChange={(value) => setDraft({ ...draft, neckChestAssessment: value })} disabled={!canEdit} compact />
                <DigitalArea label="Upper Limbs" value={draft.upperLimbsAssessment} onChange={(value) => setDraft({ ...draft, upperLimbsAssessment: value })} disabled={!canEdit} compact />
                <DigitalArea label="Lower Limbs" value={draft.lowerLimbsAssessment} onChange={(value) => setDraft({ ...draft, lowerLimbsAssessment: value })} disabled={!canEdit} compact />
                <DigitalArea label="Abdomen" value={draft.abdomenAssessment} onChange={(value) => setDraft({ ...draft, abdomenAssessment: value })} disabled={!canEdit} compact />
                <DigitalArea label="Back" value={draft.backAssessment} onChange={(value) => setDraft({ ...draft, backAssessment: value })} disabled={!canEdit} compact />
                <DigitalArea label="Pelvis and Genitourinary" value={draft.pelvisGenitourinaryAssessment} onChange={(value) => setDraft({ ...draft, pelvisGenitourinaryAssessment: value })} disabled={!canEdit} compact />
                <DigitalArea label="Skin and Pressure Areas" value={draft.skinAssessment} onChange={(value) => setDraft({ ...draft, skinAssessment: value })} disabled={!canEdit} compact />
                <DigitalArea label="Additional Findings" value={draft.othersAssessment} onChange={(value) => setDraft({ ...draft, othersAssessment: value })} disabled={!canEdit} compact />
              </div>
            </div>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.7fr)]">
              <div className="rounded-2xl border border-[#cdd8ee] bg-white p-4 shadow-[0_6px_18px_rgba(31,76,150,0.05)]">
                <div className="mb-3 text-sm font-bold text-navy">Initial Findings Summary</div>
                <DigitalArea label="Observed Findings" value={draft.mainComplaintsAndFindings} onChange={(value) => setDraft({ ...draft, mainComplaintsAndFindings: value })} disabled={!canEdit} compact rows={3} />
              </div>
              <div className="rounded-2xl border border-[#cdd8ee] bg-white p-4 shadow-[0_6px_18px_rgba(31,76,150,0.05)]">
                <div className="mb-3 text-sm font-bold text-navy">Neurological</div>
                <div className="grid gap-4 md:grid-cols-3">
                  <DigitalField label="GCS Eye" value={draft.gcsEye} onChange={(value) => setDraft({ ...draft, gcsEye: value })} disabled={!canEdit} />
                  <DigitalField label="GCS Verbal" value={draft.gcsVerbal} onChange={(value) => setDraft({ ...draft, gcsVerbal: value })} disabled={!canEdit} />
                  <DigitalField label="GCS Motor" value={draft.gcsMotor} onChange={(value) => setDraft({ ...draft, gcsMotor: value })} disabled={!canEdit} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <BodyMarkingCard title="Body Surface Map" value={draft.bodyMarkingsFront} onChange={(value) => setDraft({ ...draft, bodyMarkingsFront: value })} disabled={!canEdit} />
          </div>
        </DigitalSection>

        <DigitalSection title="2. Patient History (Secondary Assessment)" description="Quick-select secondary assessment with compact notes only where needed.">
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <OptionChecklistCard
              label="Medication History"
              value={draft.pastMedicalHistory}
              onChange={(value) => setDraft({ ...draft, pastMedicalHistory: value })}
              options={medicationHistoryOptions}
              disabled={!canEdit}
            />
            <OptionChecklistCard
              label="Family History"
              value={draft.familyHistory}
              onChange={(value) => setDraft({ ...draft, familyHistory: value })}
              options={familyHistoryOptions}
              disabled={!canEdit}
            />
            <OptionChecklistCard
              label="Allergic History"
              value={draft.allergicHistory}
              onChange={(value) => setDraft({ ...draft, allergicHistory: value })}
              options={allergyHistoryOptions}
              disabled={!canEdit}
            />
            <QuickSelectCard
              label="Immunization History"
              value={draft.immunizationHistory}
              onChange={(value) => setDraft({ ...draft, immunizationHistory: value })}
              options={immunizationHistoryOptions}
              disabled={!canEdit}
            />
            <OptionChecklistCard
              label="Lifestyle Habits"
              value={draft.lifestyleHabits}
              onChange={(value) => setDraft({ ...draft, lifestyleHabits: value })}
              options={lifestyleHabitOptions}
              disabled={!canEdit}
            />
            <QuickSelectCard
              label="Emotional State"
              value={draft.emotionalState}
              onChange={(value) => setDraft({ ...draft, emotionalState: value })}
              options={emotionalStateOptions}
              disabled={!canEdit}
            />
            <QuickSelectCard
              label="Physiological Indicators"
              value={draft.physiologicalIndicators || physiologicalIndicatorOptions[0]}
              onChange={(value) => setDraft({ ...draft, physiologicalIndicators: value })}
              options={physiologicalIndicatorOptions}
              disabled={!canEdit}
            />
            <CompactNotesCard
              label="Secondary Assessment Notes"
              value={draft.focusedHistorySample}
              onChange={(value) => setDraft({ ...draft, focusedHistorySample: value })}
              disabled={!canEdit}
              placeholder="Only add brief notes if needed"
            />
          </div>
        </DigitalSection>

        <DigitalSection
          title="3. Medications Chart"
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <DigitalField label="Date & Time" value={item.dateTime} onChange={(value) => updateMedicationRow(draft, setDraft, index, "dateTime", value)} disabled={!canEdit} type="datetime-local" />
                  <DigitalField label="Drug Name" value={item.drugName} onChange={(value) => updateMedicationRow(draft, setDraft, index, "drugName", value)} disabled={!canEdit} />
                  <DigitalField label="Dose" value={item.dose} onChange={(value) => updateMedicationRow(draft, setDraft, index, "dose", value)} disabled={!canEdit} />
                  <DigitalField label="Route" value={item.route} onChange={(value) => updateMedicationRow(draft, setDraft, index, "route", value)} disabled={!canEdit} />
                  <DigitalField label="Frequency" value={item.frequency} onChange={(value) => updateMedicationRow(draft, setDraft, index, "frequency", value)} disabled={!canEdit} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          title="4. Intravenous Fluid"
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

        <DigitalSection title="5. Nurse Name and Sign Off" description="Complete notes and sign-off for the recorded assessment.">
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <DigitalArea label="Nurse Notes" value={draft.nurseNotes} onChange={(value) => setDraft({ ...draft, nurseNotes: value })} disabled={!canEdit} compact />
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#cdd8ee] bg-slate-50 px-4 py-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value || "-"}</div>
    </div>
  );
}

function SubSectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#cdd8ee] bg-white p-4">
      <div className="mb-3 text-sm font-bold text-[#1f4c96]">{title}</div>
      {children}
    </div>
  );
}

function parseChoiceValue(value: string) {
  const [choices] = value.split("||");
  return choices
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeChoiceValue(items: string[]) {
  return items.filter(Boolean).join(" | ");
}

function extractChoiceNotes(value: string) {
  const [, notes] = value.split("||");
  return notes?.trim() ?? "";
}

function toggleChoiceValue(value: string, option: string) {
  const current = parseChoiceValue(value);
  return current.includes(option)
    ? serializeChoiceValue(current.filter((item) => item !== option))
    : serializeChoiceValue([...current, option]);
}

function OptionChecklistCard({
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
  const selected = parseChoiceValue(value);
  const notes = extractChoiceNotes(value);
  return (
    <div className="rounded-2xl border border-[#c9d8f2] bg-white p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => !disabled && onChange(toggleChoiceValue(value, option))}
              disabled={disabled}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active ? "border-[#1f4c96] bg-[#e9f0ff] text-[#1f4c96]" : "border-[#cdd8ee] bg-white text-slate-700 hover:bg-[#f5f8ff]"
              } ${disabled ? "cursor-default" : ""}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <div className="mt-3">
        <CompactNotesCard label="Notes" value={notes} onChange={(nextNotes) => onChange(`${serializeChoiceValue(selected)}${nextNotes ? ` || ${nextNotes}` : ""}`)} disabled={disabled} placeholder="Optional" hideLabel />
      </div>
    </div>
  );
}

function QuickSelectCard({
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
    <div className="rounded-2xl border border-[#c9d8f2] bg-white p-3">
      <DigitalRadioGroup label={label} value={value} onChange={onChange} options={options} disabled={disabled} compact />
    </div>
  );
}

function CompactNotesCard({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hideLabel?: boolean;
}) {
  return (
    <label className="block">
      {hideLabel ? null : <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>}
      <textarea
        className="min-h-14 w-full rounded-xl border border-[#c9d8f2] bg-[#fdfefe] px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#7d98d1] focus:ring-2 focus:ring-[#d9e6ff] disabled:bg-slate-50 disabled:text-slate-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </label>
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
    <div className="rounded-[1.65rem] border border-[#cdd8ee] bg-white p-6 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
      <div className="mb-4 text-sm font-bold text-navy">{title}</div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(280px,0.88fr)_minmax(0,1.12fr)]">
        <div className="rounded-[1.5rem] border border-dashed border-[#8aa0cc] bg-[#f8fbff] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <BodySvg
            back={back}
            markers={markers}
            onSelectSite={upsertMarker}
            disabled={disabled}
          />
          <div className="mt-4 text-[11px] leading-5 text-slate-500">
            Select a body point to mark the affected area, then update its status and notes on the right.
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-[1.35rem] border border-[#cdd8ee] bg-slate-50 px-4 py-3.5">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Marked Sites</div>
            <div className="mt-1 text-sm text-slate-700">
              {markers.length ? `${markers.length} marked ${markers.length === 1 ? "site" : "sites"}` : "No marked sites yet"}
            </div>
          </div>

          {markers.length ? (
            markers.map((marker, index) => (
              <div key={marker.id} className="rounded-[1.35rem] border border-[#cdd8ee] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
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
            <div className="rounded-[1.35rem] border border-dashed border-[#cdd8ee] bg-white px-4 py-6 text-sm text-slate-500">
              No marked sites yet. Select an area on the body map to start documenting findings.
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

  const mapFrontX = (x: number) => frontBodyViewBox.minX + (x / 164) * frontBodyViewBox.width;
  const mapFrontY = (y: number) => frontBodyViewBox.minY + (y / 480) * frontBodyViewBox.height;
  const mapFrontRX = (value: number) => (value / 164) * frontBodyViewBox.width;
  const mapFrontRY = (value: number) => (value / 480) * frontBodyViewBox.height;

  if (!back) {
    return (
      <svg
        viewBox={`${frontBodyViewBox.minX} ${frontBodyViewBox.minY} ${frontBodyViewBox.width} ${frontBodyViewBox.height}`}
        className="mx-auto h-[22rem] w-auto max-w-full"
        fill="none"
      >
        <rect
          x={frontBodyViewBox.minX + 3}
          y={frontBodyViewBox.minY + 4}
          width={frontBodyViewBox.width - 6}
          height={frontBodyViewBox.height - 8}
          rx="12"
          fill="#eef4ff"
          stroke="none"
        />
        <g fill="#ffd457" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M 392.859 180.682 C 395.161 182.428 397.937 183.437 400.823 183.578 C 403.364 183.724 405.889 183.093 408.062 181.768 C 408.714 181.334 412.152 179.162 413.13 175.253 C 414.107 171.126 411.139 170.366 411.682 164.756 C 411.931 162.712 411.931 160.646 411.682 158.602 C 411.557 157.564 411.185 156.57 410.596 155.706 C 410.187 155.155 409.699 154.667 409.148 154.258 C 407.447 152.991 403.429 152.666 398.651 153.896 C 396.515 154.403 391.411 155.706 388.154 160.412 C 386.659 162.41 385.779 164.799 385.62 167.289 C 385.439 171.162 387.321 174.094 388.516 175.977 C 389.641 177.815 391.117 179.414 392.859 180.682 Z M 434.703 180.682 C 432.401 182.428 429.625 183.437 426.74 183.578 C 424.199 183.724 421.673 183.093 419.5 181.768 C 418.849 181.334 415.41 179.162 414.433 175.253 C 413.455 171.126 416.424 170.366 415.881 164.756 C 415.631 162.712 415.631 160.646 415.881 158.602 C 416.005 157.564 416.377 156.57 416.967 155.706 C 417.375 155.155 417.863 154.667 418.414 154.258 C 420.116 152.991 424.134 152.666 428.912 153.896 C 431.047 154.403 436.151 155.706 439.409 160.412 C 440.903 162.41 441.783 164.799 441.942 167.289 C 442.123 171.162 440.241 174.094 439.047 175.977 C 437.922 177.815 436.446 179.414 434.703 180.682 Z"
            transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)"
          />
          <path
            d="M 388.878 187.922 L 389.602 190.817 L 390.687 194.799 C 391.411 197.333 391.303 198.419 392.135 201.315 C 392.895 203.957 393.366 204.355 393.692 204.572 C 394.416 205.043 395.248 205.151 396.95 205.296 C 397.549 205.389 398.16 205.389 398.759 205.296 C 399.121 205.224 400.316 205.007 400.931 204.21 C 401.655 203.342 401.112 202.437 400.931 199.505 C 400.823 197.622 401.04 198.057 400.931 195.523 C 400.859 193.786 400.714 192.772 400.931 191.179 C 401.014 190.569 401.135 189.965 401.293 189.37 C 401.371 188.641 401.309 187.904 401.112 187.198 C 401.034 186.949 400.937 186.707 400.823 186.474 C 399.809 184.374 395.936 184.012 392.859 182.13 C 389.602 180.103 388.95 177.461 388.154 177.786 C 387.502 178.004 387.176 179.958 388.878 187.922 Z M 393.33 211.848 C 393.294 212.463 393.221 213.477 392.968 215.468 C 392.353 220.716 392.244 220.463 392.244 221.259 C 392.244 222.598 392.533 223.974 399.121 233.204 C 401.366 236.389 401.872 236.969 402.379 236.824 C 404.044 236.462 403.682 229.186 403.465 224.155 C 403.393 221.728 403.152 219.309 402.741 216.915 C 402.198 213.766 401.836 213.658 401.655 211.486 C 401.438 208.663 401.909 207.323 400.931 206.418 C 400.316 205.839 399.447 205.767 397.673 205.694 C 395.683 205.55 394.669 205.477 394.054 206.056 C 393.221 206.78 393.619 207.83 393.33 211.848 Z M 412.406 182.13 C 411.501 181.479 409.872 182.383 406.614 184.302 C 404.298 185.569 403.139 186.257 402.632 187.198 C 402.126 188.139 402.271 188.392 401.909 192.627 C 401.655 195.704 401.51 196.283 401.909 196.609 C 402.632 197.079 403.899 195.668 407.338 193.713 C 411.247 191.433 412.406 191.614 413.13 190.093 C 413.492 189.152 413.383 187.777 413.13 185.026 C 412.876 182.492 412.587 182.202 412.406 182.13 Z M 410.596 194.075 C 407.483 194.944 404.153 195.885 402.632 199.143 C 401.655 201.134 401.402 204.066 402.632 204.934 C 403.393 205.441 404.08 204.572 406.614 204.21 C 410.161 203.595 411.718 204.717 413.13 203.486 C 413.781 202.871 413.962 202.111 414.216 201.315 C 414.324 200.88 414.469 200.229 414.216 197.333 C 413.962 194.618 413.781 194.292 413.492 194.075 C 412.876 193.568 411.971 193.641 410.596 194.075 Z M 413.492 204.934 C 412.768 204.21 411.428 205.513 408.424 206.02 C 407.082 206.171 405.752 206.413 404.442 206.744 C 403.791 206.889 403.356 207.034 402.994 207.468 C 402.632 207.902 402.524 208.264 402.632 210.364 C 402.813 213.658 403.356 214.563 403.718 215.069 C 403.912 215.354 404.157 215.6 404.442 215.793 C 405.311 216.336 406.071 215.938 408.062 215.793 C 410.342 215.576 410.813 215.974 411.682 215.431 C 412.008 215.178 412.225 214.925 413.13 214.345 L 414.216 213.622 C 414.831 212.898 414.36 212.174 414.216 209.278 C 414.176 208.184 414.055 207.096 413.854 206.02 C 413.673 205.151 413.6 205.007 413.492 204.934 Z M 403.972 216.698 C 403.248 217.06 403.718 219.087 403.972 221.911 C 404.153 223.901 404.153 224.119 404.261 224.662 C 404.461 225.894 404.727 227.114 405.058 228.318 C 406.144 232.625 405.999 233.023 406.687 234.761 L 406.759 234.978 L 407.012 235.412 C 407.461 236.551 407.812 237.725 408.062 238.923 C 408.151 239.295 408.273 239.658 408.424 240.009 C 408.822 240.842 409.22 241.204 409.872 242.181 L 410.777 243.629 C 411.609 245.113 411.682 245.692 412.406 246.163 C 412.731 246.38 413.13 246.633 413.492 246.525 C 414.433 246.163 413.745 242.724 413.13 235.666 C 412.867 233.262 412.746 230.844 412.768 228.426 C 412.876 225.53 413.13 223.359 413.13 223.359 C 413.238 222.273 413.311 221.187 413.492 220.101 C 413.781 218.291 414.143 217.133 413.492 216.481 C 413.284 216.303 413.035 216.178 412.768 216.119 C 411.939 215.887 411.063 215.887 410.234 216.119 L 408.062 216.409 C 406.904 216.59 406.795 216.698 406.144 216.698 L 405.13 216.698 C 404.744 216.675 404.358 216.675 403.972 216.698 Z M 415.157 182.13 C 416.062 181.479 417.69 182.383 420.948 184.302 C 423.265 185.569 424.423 186.257 424.93 187.198 C 425.437 188.139 425.292 188.392 425.654 192.627 C 425.943 195.704 426.088 196.283 425.654 196.609 C 424.93 197.079 423.663 195.668 420.224 193.713 C 416.351 191.433 415.157 191.614 414.433 190.093 C 414.071 189.152 414.179 187.777 414.433 185.026 C 414.686 182.492 414.976 182.202 415.157 182.13 Z M 416.967 194.075 C 420.079 194.944 423.41 195.885 424.93 199.143 C 425.907 201.134 426.161 204.066 424.93 204.934 C 424.206 205.441 423.482 204.572 420.948 204.21 C 417.401 203.595 415.844 204.717 414.433 203.486 C 413.817 202.871 413.6 202.111 413.347 201.315 C 413.109 199.998 413.109 198.649 413.347 197.333 C 413.6 194.618 413.781 194.292 414.071 194.075 C 414.686 193.568 415.591 193.641 416.967 194.075 Z M 414.071 204.934 C 414.831 204.21 416.134 205.513 419.138 206.02 C 420.48 206.171 421.811 206.413 423.12 206.744 C 423.808 206.889 424.206 207.034 424.568 207.468 C 424.93 207.902 425.075 208.264 424.93 210.364 C 424.749 213.658 424.206 214.563 423.844 215.069 C 423.651 215.354 423.405 215.6 423.12 215.793 C 422.251 216.336 421.527 215.938 419.5 215.793 C 417.22 215.576 416.749 215.974 415.881 215.431 C 415.591 215.178 415.338 214.925 414.433 214.345 L 413.347 213.622 C 412.731 212.898 413.202 212.174 413.347 209.278 C 413.386 208.184 413.507 207.096 413.709 206.02 C 413.89 205.151 413.962 205.007 414.071 204.934 Z M 423.591 216.698 C 424.315 217.06 423.844 219.087 423.591 221.911 L 423.337 224.662 C 423.129 225.895 422.851 227.116 422.505 228.318 C 421.419 232.625 421.564 233.023 420.876 234.761 L 420.803 234.978 L 420.55 235.412 C 420.103 236.551 419.751 237.726 419.5 238.923 C 419.411 239.295 419.29 239.658 419.138 240.009 C 418.776 240.842 418.342 241.204 417.69 242.181 C 417.256 242.833 416.967 243.339 416.822 243.629 C 415.953 245.113 415.881 245.692 415.157 246.163 C 414.831 246.38 414.433 246.633 414.071 246.525 C 413.13 246.163 413.817 242.724 414.433 235.666 C 414.901 231.577 414.901 227.448 414.433 223.359 C 414.324 222.273 414.252 221.187 414.071 220.101 C 413.781 218.291 413.419 217.133 414.071 216.481 C 414.279 216.303 414.527 216.178 414.795 216.119 C 415.623 215.887 416.5 215.887 417.328 216.119 L 419.5 216.409 C 420.586 216.59 420.767 216.698 421.419 216.698 L 422.432 216.698 C 422.818 216.675 423.205 216.675 423.591 216.698 Z M 438.685 187.922 C 438.54 188.537 438.323 189.55 437.961 190.817 L 436.875 194.799 C 436.151 197.333 436.26 198.419 435.427 201.315 C 434.703 203.957 434.196 204.355 433.871 204.572 C 433.147 205.043 432.314 205.151 430.613 205.296 C 430.013 205.389 429.403 205.389 428.803 205.296 C 428.441 205.224 427.246 205.007 426.631 204.21 C 425.907 203.342 426.45 202.437 426.631 199.505 C 426.74 197.622 426.523 198.057 426.631 195.523 C 426.704 193.786 426.848 192.772 426.631 191.179 C 426.548 190.569 426.427 189.965 426.269 189.37 C 426.203 188.638 426.277 187.901 426.486 187.198 C 426.553 186.95 426.638 186.709 426.74 186.474 C 427.753 184.374 431.626 184.012 434.703 182.13 C 437.961 180.103 438.612 177.461 439.409 177.786 C 440.06 178.004 440.386 179.958 438.685 187.922 Z M 434.233 211.848 L 434.594 215.468 C 435.21 220.716 435.318 220.463 435.318 221.259 C 435.318 222.598 435.029 223.974 428.441 233.204 C 426.197 236.389 425.69 236.969 425.183 236.824 C 423.518 236.462 423.88 229.186 424.097 224.155 C 424.171 221.728 424.413 219.309 424.821 216.915 C 425.4 213.766 425.762 213.658 425.907 211.486 C 426.124 208.663 425.654 207.323 426.631 206.418 C 427.246 205.839 428.115 205.767 429.889 205.694 C 431.88 205.55 432.893 205.477 433.509 206.056 C 434.377 206.78 433.979 207.83 434.233 211.848 Z"
            transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)"
          />
          <path d="M 517.321 153.172 C 517.321 152.449 513.194 151.58 510.081 151.363 C 508.761 151.169 507.42 151.169 506.1 151.363 C 504.108 151.744 502.242 152.615 500.67 153.896 C 498.281 155.706 497.123 157.769 496.327 159.326 C 494.901 162.149 494.04 165.223 493.793 168.375 C 493.503 170.945 493.431 171.343 493.684 171.633 C 495.132 173.262 501.756 171.488 504.29 167.289 C 505.484 165.226 504.688 164.43 506.462 161.498 C 507.509 159.712 508.856 158.12 510.443 156.792 C 511.431 155.93 512.526 155.2 513.701 154.62 C 515.945 153.498 517.321 153.534 517.321 153.172 Z M 504.399 168.701 C 503.964 168.556 503.747 169.316 502.227 170.511 C 501.237 171.273 500.139 171.883 498.969 172.321 C 497.376 172.936 496.435 173.298 495.349 173.045 C 494.263 172.791 493.901 172.104 493.539 172.321 C 492.996 172.61 493.467 174.131 493.539 176.302 C 493.576 177.316 493.467 178.438 493.177 180.646 C 492.779 183.904 492.49 186.22 491.73 188.609 C 491.289 189.717 491.044 190.893 491.006 192.084 C 491.055 192.614 491.055 193.147 491.006 193.677 C 490.825 194.908 490.39 195.342 490.644 195.849 C 490.861 196.211 491.295 196.175 492.092 196.573 C 492.888 196.971 493.25 197.405 493.901 198.021 C 495.174 199.135 496.648 199.996 498.245 200.554 C 499.548 200.989 499.693 200.735 501.141 201.278 C 502.48 201.785 502.842 202.183 503.313 202.002 C 504 201.749 504.037 200.663 504.399 198.383 C 504.941 195.016 505.122 195.451 505.484 192.591 C 505.689 191.151 505.81 189.701 505.846 188.247 C 505.919 184.664 505.267 184.085 505.122 179.922 L 505.122 174.854 C 505.122 170.221 504.978 168.846 504.399 168.701 Z" />
          <path d="M 392.461 308.168 C 391.592 308.458 393.04 311.064 393.8 315.987 L 394.054 317.76 L 394.126 318.846 C 394.343 321.272 394.85 321.67 394.778 323.335 C 394.778 324.566 394.488 324.964 394.778 325.724 C 395.026 326.222 395.4 326.646 395.864 326.955 C 396.612 327.529 397.526 327.846 398.47 327.859 C 399.013 327.859 398.94 327.751 399.845 327.678 L 403.465 327.678 C 404.075 327.764 404.679 327.885 405.275 328.04 C 405.985 328.231 406.713 328.352 407.447 328.402 C 407.881 328.402 408.858 328.33 409.51 327.606 C 409.617 327.503 409.703 327.38 409.763 327.244 C 409.98 326.81 409.691 326.231 409.836 325 C 410.017 323.878 410.306 323.95 410.849 322.14 C 411.162 321.062 411.392 319.96 411.537 318.846 C 411.682 317.905 411.718 317.254 411.863 315.987 C 412.333 311.281 411.863 312.259 412.225 311.028 C 412.369 310.268 412.587 309.833 412.225 309.58 C 411.573 309.182 410.234 309.942 407.881 310.304 C 406.868 310.485 406.831 310.376 401.836 310.304 C 397.746 310.268 397.384 310.304 396.479 310.087 C 393.837 309.363 393.113 307.951 392.497 308.168 L 392.461 308.168 Z M 408.171 373.033 C 407.809 372.599 407.085 372.671 405.275 373.033 C 401.691 373.685 401.51 373.866 400.569 373.757 C 399.99 373.685 399.701 373.54 399.483 373.757 C 399.049 374.192 399.99 375.35 400.569 377.739 C 400.859 378.825 401.04 379.621 400.931 380.635 C 400.823 381.721 400.461 382.01 400.207 383.531 C 400.062 384.399 399.809 385.847 400.207 386.064 C 400.714 386.281 401.474 384.363 403.827 382.807 C 404.889 382.02 406.136 381.522 407.447 381.359 C 409.076 381.214 410.089 381.757 410.342 381.359 C 410.596 380.961 409.474 380.273 408.895 378.463 C 408.615 377.649 408.492 376.789 408.533 375.929 C 408.617 375.329 408.617 374.72 408.533 374.119 C 408.46 373.576 408.388 373.251 408.171 373.033 Z M 394.886 327.28 C 394.307 327.534 394.38 328.728 394.235 331.986 C 394.126 335.316 394.018 334.52 393.945 337.415 C 393.909 338.501 393.837 341.325 393.945 343.569 C 394.162 347.768 394.995 348.202 396.153 354.428 C 397.058 359.134 396.877 360.328 397.782 364.925 C 398.687 369.522 399.121 369.486 399.049 371.079 C 398.981 371.585 399.097 372.098 399.375 372.527 C 399.628 372.816 400.099 373.033 401.909 372.889 C 402.663 372.814 403.413 372.693 404.153 372.527 C 405.524 372.198 406.914 371.956 408.315 371.803 C 407.905 368.316 407.905 364.793 408.315 361.306 C 408.605 358.772 408.858 358.518 409.257 355.152 C 409.51 352.908 409.474 352.691 409.908 346.103 C 410.198 342.121 410.27 341.651 410.234 340.311 C 410.234 337.162 409.872 337.126 409.908 334.52 C 409.944 330.972 410.56 328.656 409.908 328.366 C 409.691 328.221 409.546 328.402 408.967 328.728 C 408.043 329.111 407.067 329.355 406.071 329.452 C 404.479 329.633 404.37 328.909 402.234 328.728 C 399.664 328.402 399.158 329.38 397.456 328.728 C 395.9 328.077 395.502 326.955 394.923 327.28 L 394.886 327.28 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
          <path d="M 409.98 382.988 C 409.619 382.372 408.677 382.264 408.171 382.264 C 407.429 382.226 406.688 382.349 405.999 382.626 C 405.229 382.887 404.498 383.252 403.827 383.711 C 403.178 384.134 402.572 384.619 402.017 385.159 C 401.26 385.74 400.642 386.482 400.207 387.331 C 400.042 387.802 399.921 388.286 399.845 388.779 C 399.556 390.155 399.664 390.336 399.483 390.951 C 399.302 391.566 399.194 391.53 398.035 393.123 C 396.588 395.114 396.805 395.15 396.226 395.657 C 395.465 396.344 394.923 396.453 394.778 397.104 C 394.669 397.575 394.886 398.009 395.14 398.552 C 395.48 399.257 395.975 399.875 396.588 400.362 C 397.891 401.267 398.94 400.326 402.379 400.362 C 403.972 400.362 404.985 400.688 406.723 400.362 C 407.371 400.255 407.989 400.008 408.533 399.638 C 409.181 399.189 409.684 398.56 409.98 397.828 C 410.334 396.895 410.334 395.866 409.98 394.933 C 409.407 392.553 409.407 390.072 409.98 387.693 L 409.98 386.245 L 409.98 384.435 C 410.017 383.35 410.125 383.241 409.98 382.988 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
          <path d="M 392.28 226.761 C 391.81 226.833 391.556 227.702 391.194 229.621 C 390.674 232.251 390.311 234.91 390.108 237.584 C 389.276 244.823 388.914 245.294 389.384 247.357 C 389.696 249.075 390.375 250.704 391.375 252.135 C 392.823 254.126 394.669 255.14 398.397 257.13 C 400.166 258.111 402.005 258.958 403.899 259.664 C 406.252 260.533 406.976 260.533 408.822 261.51 C 410.198 262.27 410.632 262.741 411.066 262.56 C 412.152 262.017 411.573 258.216 410.704 255.683 C 408.771 250.903 406.215 246.4 403.103 242.29 C 401.257 240.154 399.809 238.308 398.759 236.86 C 397.927 235.666 396.624 233.892 395.14 231.43 C 393.402 228.535 392.968 226.652 392.244 226.725 L 392.28 226.761 Z M 388.624 264.587 L 388.624 265.094 L 388.479 272.333 L 388.479 273.781 C 388.479 275.301 388.479 278.016 389.421 287.246 C 390.072 293.581 390.506 297.237 391.629 301.58 C 392.425 304.621 393.185 306.757 394.814 308.096 C 395.972 309.037 397.058 309.182 399.302 309.363 C 403.139 309.544 409.401 310.485 410.741 307.698 C 411.392 306.467 410.922 304.621 410.741 303.788 C 410.56 303.137 410.017 302.521 409.655 301.255 C 409.505 300.78 409.384 300.296 409.293 299.807 C 408.822 297.562 407.229 292.314 406.035 288.224 C 403.791 280.695 404.334 282.07 403.139 278.088 C 402.017 274.469 401.076 270.813 399.881 267.229 C 398.977 264.696 397.71 261.293 399.158 259.99 C 399.773 259.375 400.967 259.266 400.967 258.904 C 400.967 258.651 400.461 258.542 399.52 258.18 C 399.52 258.18 398.289 257.746 396.986 257.094 C 396.111 256.666 395.265 256.183 394.452 255.646 L 393.366 254.922 C 392.724 254.491 392.118 254.006 391.556 253.474 C 390.979 252.953 390.491 252.342 390.108 251.665 C 389.312 250.181 389.493 248.769 389.384 248.769 C 389.167 248.769 389.022 251.665 389.022 251.665 C 388.878 255.972 388.697 260.28 388.66 264.587 L 388.624 264.587 Z M 402.379 273.057 C 405.165 281.381 407.629 289.809 409.763 298.323 C 409.872 298.902 410.487 301.653 410.741 301.58 C 410.922 301.58 410.741 300.458 410.849 299.264 C 411.03 297.382 411.356 295.97 411.718 293.4 C 412.08 290.576 412.297 287.464 412.333 281.129 L 412.333 278.631 C 412.333 276.387 412.261 274.758 412.152 272.659 C 412.032 269.514 411.791 266.374 411.428 263.248 C 411.356 263.087 411.227 262.958 411.066 262.886 C 410.948 262.849 410.822 262.849 410.704 262.886 C 410.704 262.886 410.342 262.958 408.895 262.162 L 407.447 261.438 L 405.637 260.714 C 405.347 260.569 403.212 259.7 402.379 259.628 L 401.8 259.628 C 401.166 259.627 400.543 259.789 399.99 260.099 C 398.18 261.365 400.569 267.664 402.379 273.057 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
          <path d="M 490.282 196.573 C 489.377 197.079 489.775 199.324 489.92 200.192 C 490.171 201.524 490.757 202.769 491.621 203.812 C 492.128 204.464 492.852 205.115 495.965 206.708 C 499.765 208.663 501.684 209.604 502.589 208.88 C 502.987 208.518 503.095 207.794 503.313 206.346 C 503.566 204.681 503.675 203.812 503.313 203.088 C 502.625 201.713 500.779 202.002 498.245 201.278 C 493.358 199.758 491.549 195.849 490.282 196.573 Z M 489.449 202.4 C 488.146 202.437 487.35 206.635 486.553 211.088 C 485.938 214.345 485.612 217.169 485.467 219.051 C 485.106 223.141 485.431 222.671 485.106 224.843 C 484.309 230.2 482.318 232.697 483.658 234.254 C 484.128 234.761 485.033 235.159 486.191 235.702 C 486.88 236.039 487.61 236.282 488.363 236.426 C 490.39 236.679 492.128 235.34 492.707 234.978 C 494.698 233.458 495.096 231.72 496.689 228.1 C 498.498 223.938 498.498 224.951 500.67 220.137 C 504.109 212.427 503.494 211.16 503.204 210.726 C 502.697 209.929 502.335 210.219 497.413 208.192 C 493.684 206.599 492.815 206.056 491.983 205.296 C 490.245 203.631 490.173 202.328 489.449 202.4 Z M 482.934 234.978 C 481.667 235.448 482.644 237.982 480.762 241.493 C 480.038 242.76 479.386 243.376 479.676 244.027 C 480.002 244.751 481.124 244.425 483.658 245.113 C 486.191 245.801 486.662 246.488 488.001 246.199 C 488.854 245.944 489.61 245.44 490.173 244.751 C 490.496 244.313 490.74 243.824 490.897 243.303 C 491.476 241.638 491.331 240.878 491.621 239.683 C 492.164 237.258 493.431 236.534 493.069 236.064 C 492.526 235.267 489.992 237.475 486.915 236.788 C 484.599 236.208 483.983 234.543 482.934 234.978 Z" />
          <path d="M 360.861 245.403 C 360.308 245.33 359.749 245.33 359.196 245.403 C 358.038 245.62 357.278 246.344 355.793 247.755 C 354.744 248.769 354.744 248.95 353.766 249.782 L 352.101 251.122 C 350.654 252.28 350.762 252.352 350.074 252.823 C 348.988 253.547 348.482 253.909 347.722 254.162 C 346.817 254.452 346.31 254.379 346.02 254.85 C 345.781 255.264 345.781 255.775 346.02 256.189 C 346.527 257.058 348.011 257.13 349.061 256.877 C 350.509 256.515 351.595 255.357 352.101 254.85 C 352.789 254.126 353.296 253.366 353.766 253.511 C 353.927 253.565 354.058 253.683 354.128 253.836 C 354.527 254.597 354.02 255.646 353.766 256.189 C 352.825 258.289 353.513 257.854 352.427 260.243 C 351.884 261.474 351.522 261.872 350.798 263.031 C 350.397 263.66 350.035 264.312 349.712 264.985 C 349.097 266.288 348.771 267.012 349.097 267.555 C 349.394 268.062 349.962 268.345 350.545 268.279 C 351.124 268.207 351.45 267.7 351.993 266.831 C 352.677 265.679 353.282 264.482 353.803 263.248 C 354.165 262.415 354.599 261.583 355.504 259.881 C 355.757 259.375 356.192 258.542 356.698 258.578 C 356.89 258.6 357.063 258.706 357.169 258.868 C 357.257 259.076 357.257 259.311 357.169 259.519 C 356.795 260.563 356.348 261.579 355.83 262.56 L 355.142 263.935 L 353.803 266.976 L 353.079 268.641 C 352.644 269.98 352.355 270.74 352.717 271.175 C 353.079 271.609 354.201 271.609 354.889 271.175 C 355.504 270.813 355.504 270.342 356.336 268.279 L 357.531 265.601 L 358.544 262.922 C 359.087 261.112 359.268 259.954 359.884 259.881 C 360.147 259.887 360.391 260.022 360.535 260.243 C 360.897 260.605 360.716 261.184 360.535 261.908 C 360.282 262.994 360.101 264.153 359.884 265.275 L 359.522 267.302 C 359.337 268.097 359.24 268.91 359.232 269.727 C 359.268 270.451 359.305 270.813 359.594 271.175 C 359.953 271.587 360.531 271.732 361.042 271.537 C 361.466 271.337 361.744 270.919 361.766 270.451 C 361.929 269.735 362.05 269.009 362.128 268.279 L 362.237 266.976 C 362.309 266.071 362.418 264.913 362.599 263.573 C 362.732 262.662 362.95 261.765 363.25 260.895 C 363.395 260.424 363.54 259.99 363.938 259.881 C 364.319 259.753 364.738 259.903 364.951 260.243 C 364.982 260.459 364.982 260.679 364.951 260.895 C 364.739 261.773 364.618 262.671 364.589 263.573 L 364.589 264.261 C 364.589 266.433 364.372 266.795 364.662 267.193 C 365.114 267.708 365.856 267.856 366.472 267.555 C 366.942 267.266 366.942 266.65 366.978 264.587 L 366.978 261.546 C 367.018 259.973 367.138 258.402 367.34 256.841 C 367.594 254.307 367.702 253.04 367.992 251.773 C 368.462 249.493 368.933 248.515 368.354 247.719 C 368.064 247.357 367.485 247.176 366.291 246.706 C 365.627 246.442 364.95 246.213 364.264 246.018 C 363.157 245.674 362.016 245.456 360.861 245.366 L 360.861 245.403 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
          <path d="M 428.767 117.048 C 428.188 116.686 427.536 117.193 426.957 116.686 C 426.523 116.324 426.595 115.6 426.595 114.152 L 426.595 111.256 C 426.667 107.999 424.532 105.284 424.061 104.741 C 423.12 103.546 422.106 102.859 420.079 101.483 C 417.546 99.746 416.243 99.42 415.374 99.311 C 414.786 99.236 414.191 99.224 413.6 99.275 C 413.009 99.223 412.415 99.235 411.827 99.311 C 410.994 99.42 409.655 99.746 407.121 101.483 C 405.094 102.859 404.117 103.546 403.139 104.741 C 401.6 106.574 400.709 108.865 400.605 111.256 L 400.605 114.152 C 400.642 115.6 400.714 116.324 400.243 116.686 C 399.701 117.193 399.049 116.686 398.434 117.048 C 397.275 117.844 398.144 121.102 398.796 122.839 C 399.049 123.418 400.243 126.495 401.691 126.459 C 402.271 126.459 402.415 125.988 402.777 126.097 C 403.682 126.387 402.596 129.355 403.863 132.251 C 404.732 134.169 406.361 135.363 407.483 136.232 C 408.242 136.85 409.098 137.34 410.017 137.68 C 411.176 138.091 412.413 138.239 413.636 138.114 C 414.836 138.228 416.047 138.08 417.184 137.68 C 418.101 137.338 418.957 136.849 419.717 136.232 C 420.876 135.363 422.505 134.169 423.337 132.251 C 424.64 129.355 423.554 126.387 424.423 126.097 C 424.785 125.988 424.966 126.459 425.509 126.459 C 426.993 126.495 428.188 123.418 428.405 122.839 C 429.093 121.102 429.961 117.844 428.767 117.048 Z M 403.718 140.865 C 402.886 140.286 401.112 142.675 397.565 145.209 C 392.859 148.503 388.66 149.553 388.878 150.277 C 388.986 150.639 390.072 150.277 392.497 150.639 C 394.742 150.892 395.031 151.29 397.203 151.725 C 398.94 152.014 402.886 152.738 403.718 151.363 C 404.189 150.53 403.212 149.806 403.356 147.381 C 403.393 146.512 403.537 146.512 403.718 145.209 C 404.08 142.82 404.298 141.227 403.718 140.865 Z M 403.718 133.626 C 403.212 133.843 404.153 135.906 404.442 139.78 C 404.521 141.226 404.521 142.676 404.442 144.123 C 404.298 148.937 403.791 150.494 404.804 151.363 C 405.166 151.616 405.347 151.507 407.338 151.725 C 410.596 151.978 411.682 152.702 412.406 152.087 C 412.731 151.725 412.731 151.363 412.768 150.277 C 412.912 146.223 413.202 147.019 413.13 144.847 C 413.057 141.988 412.985 140.576 412.406 139.78 C 411.32 138.332 410.161 138.838 407.7 137.246 C 405.058 135.436 404.225 133.336 403.718 133.626 Z M 423.844 133.626 C 424.351 133.843 423.41 135.906 423.12 139.78 C 423.041 141.226 423.041 142.676 423.12 144.123 C 423.301 148.937 423.772 150.494 422.758 151.363 C 422.396 151.616 422.251 151.507 420.224 151.725 C 416.967 151.978 415.881 152.702 415.157 152.087 C 414.831 151.725 414.867 151.363 414.795 150.277 C 414.65 146.223 414.397 147.019 414.433 144.847 C 414.541 141.988 414.578 140.576 415.157 139.78 C 416.243 138.332 417.437 138.838 419.862 137.246 C 422.505 135.436 423.337 133.336 423.844 133.626 Z M 423.844 140.865 C 424.676 140.286 426.486 142.675 429.997 145.209 C 434.703 148.503 438.902 149.553 438.685 150.277 C 438.576 150.639 437.49 150.277 435.065 150.639 C 432.857 150.892 432.531 151.29 430.359 151.725 C 428.622 152.014 424.676 152.738 423.844 151.363 C 423.373 150.53 424.351 149.806 424.206 147.381 C 424.17 146.512 424.061 146.512 423.844 145.209 C 423.518 142.82 423.301 141.227 423.844 140.865 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
          <path d="M 549.753 153.172 C 549.753 152.449 553.916 151.58 556.993 151.363 C 558.803 151.182 559.708 151.109 560.975 151.363 C 562.966 151.744 564.832 152.615 566.404 153.896 C 568.793 155.706 569.951 157.769 570.748 159.326 C 572.174 162.148 573.035 165.222 573.282 168.375 C 573.571 170.945 573.644 171.343 573.39 171.633 C 571.942 173.262 565.354 171.488 562.784 167.289 C 561.59 165.226 562.386 164.43 560.613 161.498 C 559.565 159.712 558.218 158.12 556.631 156.792 C 555.644 155.929 554.549 155.199 553.373 154.62 C 551.129 153.498 549.753 153.534 549.753 153.172 Z M 562.676 168.701 C 563.11 168.556 563.327 169.316 564.848 170.511 C 565.837 171.273 566.935 171.883 568.105 172.321 C 569.698 172.936 570.639 173.298 571.725 173.045 C 572.811 172.791 573.173 172.104 573.535 172.321 C 574.114 172.61 573.644 174.131 573.535 176.302 C 573.499 177.316 573.644 178.438 573.897 180.646 C 574.295 183.904 574.585 186.22 575.345 188.609 C 575.785 189.717 576.03 190.893 576.069 192.084 C 576.019 192.614 576.019 193.147 576.069 193.677 C 576.25 194.908 576.684 195.342 576.431 195.849 C 576.213 196.211 575.779 196.175 574.983 196.573 C 574.186 196.971 573.824 197.405 573.173 198.021 C 571.901 199.135 570.426 199.996 568.829 200.554 C 567.526 200.989 567.381 200.735 565.934 201.278 C 564.63 201.785 564.232 202.183 563.762 202.002 C 563.074 201.749 563.038 200.663 562.676 198.383 C 562.133 195.016 561.952 195.451 561.59 192.591 C 561.385 191.151 561.264 189.701 561.228 188.247 C 561.156 184.664 561.807 184.085 561.952 179.922 L 561.952 174.854 C 561.952 170.221 562.133 168.846 562.676 168.701 Z" />
          <path d="M 435.101 308.168 C 435.97 308.458 434.522 311.064 433.762 315.987 L 433.545 317.76 L 433.436 318.846 C 433.219 321.272 432.748 321.67 432.785 323.335 C 432.785 324.566 433.11 324.964 432.785 325.724 C 432.536 326.222 432.162 326.646 431.699 326.955 C 430.95 327.529 430.036 327.846 429.093 327.859 C 428.586 327.859 428.658 327.751 427.717 327.715 C 427.138 327.642 426.993 327.715 425.907 327.715 C 424.532 327.715 424.604 327.642 424.097 327.715 C 423.488 327.8 422.883 327.921 422.287 328.077 C 421.577 328.267 420.85 328.389 420.116 328.439 C 419.717 328.402 418.74 328.33 418.052 327.606 C 417.949 327.514 417.863 327.403 417.799 327.28 C 417.582 326.81 417.908 326.231 417.727 325 C 417.582 323.914 417.256 323.986 416.713 322.176 C 416.41 321.085 416.192 319.972 416.062 318.846 C 415.913 317.897 415.793 316.943 415.7 315.987 C 415.265 311.281 415.7 312.259 415.41 311.028 C 415.229 310.268 415.048 309.833 415.41 309.58 C 416.025 309.182 417.365 309.942 419.754 310.304 C 420.731 310.485 420.731 310.376 425.762 310.304 C 429.853 310.268 430.178 310.304 431.12 310.087 C 433.726 309.363 434.45 307.951 435.101 308.168 Z M 432.712 327.28 C 433.255 327.534 433.183 328.728 433.328 331.986 C 433.472 335.316 433.545 334.52 433.653 337.415 C 433.653 338.501 433.762 341.325 433.653 343.569 C 433.436 347.768 432.567 348.202 431.409 354.428 C 430.504 359.134 430.685 360.328 429.816 364.925 C 428.948 369.522 428.441 369.486 428.513 371.079 C 428.581 371.585 428.466 372.098 428.188 372.527 C 427.934 372.816 427.464 373.033 425.654 372.889 C 424.899 372.814 424.15 372.693 423.41 372.527 C 422.039 372.198 420.648 371.956 419.247 371.803 C 419.657 368.316 419.657 364.793 419.247 361.306 C 418.957 358.772 418.704 358.518 418.306 355.152 C 418.052 352.908 418.125 352.691 417.654 346.103 C 417.401 342.121 417.328 341.651 417.328 340.311 C 417.365 337.162 417.69 337.126 417.69 334.52 C 417.618 330.972 416.967 328.656 417.69 328.366 C 417.871 328.221 418.052 328.402 418.632 328.728 C 419.556 329.111 420.532 329.355 421.527 329.452 C 423.084 329.633 423.192 328.909 425.328 328.728 C 427.898 328.402 428.441 329.38 430.106 328.728 C 431.663 328.077 432.097 326.955 432.676 327.28 L 432.712 327.28 Z M 419.392 373.033 C 419.754 372.599 420.478 372.671 422.287 373.033 C 425.871 373.685 426.052 373.866 426.993 373.757 C 427.572 373.685 427.898 373.54 428.079 373.757 C 428.513 374.192 427.572 375.35 426.993 377.739 C 426.704 378.825 426.523 379.621 426.631 380.635 C 426.74 381.721 427.102 382.01 427.355 383.531 C 427.5 384.399 427.789 385.847 427.355 386.064 C 426.848 386.281 426.124 384.363 423.735 382.807 C 422.674 382.02 421.427 381.522 420.116 381.359 C 418.523 381.214 417.473 381.757 417.22 381.359 C 416.967 380.961 418.125 380.273 418.668 378.463 C 418.948 377.649 419.07 376.789 419.03 375.929 C 418.946 375.329 418.946 374.72 419.03 374.119 C 419.138 373.576 419.175 373.251 419.392 373.033 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
          <path d="M 417.582 382.988 C 417.944 382.372 418.885 382.264 419.392 382.264 C 420.133 382.226 420.874 382.349 421.564 382.626 C 422.334 382.887 423.064 383.252 423.735 383.711 C 424.384 384.134 424.991 384.619 425.545 385.159 C 426.523 386.064 427.029 386.535 427.355 387.331 C 427.52 387.802 427.641 388.286 427.717 388.779 C 428.007 390.155 427.898 390.336 428.079 390.951 C 428.26 391.566 428.405 391.53 429.527 393.123 C 430.975 395.114 430.794 395.15 431.337 395.657 C 432.097 396.344 432.64 396.453 432.785 397.104 C 432.893 397.575 432.676 398.009 432.423 398.552 C 432.082 399.257 431.587 399.875 430.975 400.362 C 429.672 401.267 428.622 400.326 425.183 400.362 C 423.591 400.362 422.577 400.688 420.84 400.362 C 420.191 400.255 419.573 400.008 419.03 399.638 C 418.381 399.189 417.878 398.56 417.582 397.828 C 417.229 396.895 417.229 395.866 417.582 394.933 C 418.155 392.553 418.155 390.072 417.582 387.693 L 417.582 386.245 L 417.582 384.435 C 417.546 383.35 417.437 383.241 417.582 382.988 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
          <path d="M 435.282 226.761 C 435.753 226.833 436.006 227.702 436.404 229.621 C 436.925 232.251 437.287 234.91 437.49 237.584 C 438.287 244.823 438.649 245.294 438.214 247.357 C 437.891 249.077 437.2 250.707 436.187 252.135 C 434.739 254.126 432.893 255.14 429.165 257.13 C 427.397 258.111 425.558 258.958 423.663 259.664 C 421.346 260.533 420.586 260.533 418.776 261.51 C 417.365 262.27 416.967 262.741 416.496 262.56 C 415.41 262.017 416.025 258.216 416.858 255.683 C 418.792 250.903 421.347 246.4 424.459 242.29 C 426.342 240.154 427.789 238.308 428.803 236.86 C 429.672 235.666 430.975 233.892 432.423 231.43 C 434.16 228.535 434.594 226.652 435.318 226.725 L 435.282 226.761 Z M 425.183 273.057 C 422.421 281.382 419.982 289.81 417.871 298.323 C 417.727 298.902 417.147 301.653 416.858 301.58 C 416.677 301.58 416.858 300.458 416.749 299.264 C 416.568 297.382 416.243 295.97 415.881 293.4 C 415.519 290.576 415.301 287.464 415.265 281.129 L 415.265 278.631 C 415.265 276.387 415.374 274.758 415.446 272.659 C 415.566 269.514 415.808 266.374 416.17 263.248 C 416.243 263.087 416.371 262.958 416.532 262.886 C 416.65 262.849 416.776 262.849 416.894 262.886 C 416.894 262.886 417.256 262.958 418.704 262.162 L 420.152 261.438 L 421.962 260.714 C 422.287 260.569 424.387 259.7 425.219 259.628 L 425.799 259.628 C 426.432 259.627 427.056 259.789 427.608 260.099 C 429.418 261.365 427.029 267.664 425.219 273.057 L 425.183 273.057 Z M 438.938 264.587 L 438.938 265.094 L 439.083 272.333 L 439.083 273.781 C 439.083 275.301 439.083 278.016 438.142 287.246 C 437.526 293.617 437.056 297.237 435.934 301.58 C 435.137 304.621 434.377 306.793 432.748 308.096 C 431.626 309.037 430.504 309.182 428.296 309.363 C 424.459 309.58 418.161 310.485 416.822 307.734 C 416.206 306.467 416.641 304.621 416.858 303.788 C 417.039 303.137 417.546 302.558 417.944 301.255 C 418.093 300.78 418.214 300.296 418.306 299.807 C 418.74 297.562 420.369 292.314 421.564 288.224 C 423.808 280.695 423.229 282.106 424.459 278.088 C 425.545 274.469 426.486 270.813 427.717 267.229 C 428.586 264.696 429.853 261.293 428.441 259.99 C 427.789 259.411 426.631 259.302 426.631 258.904 C 426.631 258.651 427.102 258.542 428.079 258.18 C 428.079 258.18 429.274 257.746 430.613 257.094 C 431.488 256.667 432.334 256.184 433.147 255.646 L 434.233 254.922 C 434.875 254.491 435.48 254.006 436.042 253.474 C 436.621 252.955 437.11 252.343 437.49 251.665 C 438.287 250.217 438.106 248.769 438.214 248.769 C 438.431 248.769 438.576 251.665 438.576 251.665 C 438.685 255.972 438.866 260.28 438.938 264.587 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
          <path d="M 576.793 196.573 C 577.698 197.079 577.299 199.324 577.155 200.192 C 576.903 201.524 576.318 202.769 575.453 203.812 C 574.947 204.464 574.223 205.115 571.11 206.708 C 567.309 208.663 565.391 209.604 564.486 208.88 C 564.087 208.518 563.979 207.794 563.762 206.346 C 563.545 204.681 563.4 203.812 563.762 203.088 C 564.449 201.713 566.295 202.002 568.829 201.278 C 573.752 199.758 575.526 195.849 576.793 196.573 Z M 577.625 202.4 C 578.928 202.437 579.725 206.635 580.521 211.088 C 581.136 214.345 581.462 217.169 581.607 219.051 C 581.969 223.141 581.679 222.671 581.969 224.843 C 582.765 230.2 584.756 232.697 583.417 234.254 C 582.946 234.761 582.077 235.159 580.883 235.702 C 580.194 236.039 579.464 236.282 578.711 236.426 C 576.684 236.679 574.947 235.34 574.367 234.978 C 572.377 233.458 571.978 231.72 570.386 228.1 C 568.576 223.938 568.576 224.951 566.404 220.137 C 562.965 212.427 563.581 211.16 563.87 210.726 C 564.377 209.929 564.739 210.219 569.662 208.192 C 573.39 206.599 574.259 206.056 575.091 205.296 C 576.829 203.631 576.901 202.328 577.625 202.4 Z M 584.141 234.978 C 585.444 235.448 584.43 237.982 586.312 241.493 C 587.036 242.76 587.688 243.376 587.398 244.027 C 587.073 244.751 585.951 244.425 583.417 245.113 C 580.883 245.801 580.412 246.488 579.073 246.199 C 578.221 245.944 577.464 245.44 576.901 244.751 C 576.579 244.313 576.334 243.824 576.177 243.303 C 575.634 241.638 575.743 240.878 575.453 239.683 C 574.947 237.258 573.644 236.534 574.005 236.064 C 574.548 235.267 577.082 237.475 580.159 236.788 C 582.512 236.208 583.127 234.543 584.141 234.978 Z" />
          <path d="M 466.701 245.403 C 467.266 245.327 467.838 245.327 468.403 245.403 C 469.525 245.62 470.285 246.344 471.769 247.755 C 472.819 248.769 472.819 248.95 473.796 249.782 L 475.461 251.122 C 476.909 252.28 476.8 252.352 477.488 252.823 C 478.574 253.547 479.081 253.909 479.877 254.162 C 480.746 254.452 481.252 254.379 481.542 254.85 C 481.781 255.264 481.781 255.775 481.542 256.189 C 481.071 257.058 479.551 257.13 478.501 256.877 C 477.054 256.515 475.968 255.357 475.461 254.85 C 474.809 254.126 474.266 253.366 473.796 253.511 C 473.636 253.565 473.505 253.683 473.434 253.836 C 473.036 254.597 473.543 255.646 473.796 256.189 C 474.737 258.289 474.049 257.854 475.135 260.243 C 475.678 261.474 476.04 261.872 476.764 263.031 C 477.163 263.661 477.526 264.313 477.85 264.985 C 478.465 266.288 478.791 267.012 478.501 267.591 C 478.205 268.098 477.637 268.382 477.054 268.315 C 476.474 268.243 476.112 267.736 475.606 266.867 C 474.921 265.716 474.317 264.518 473.796 263.284 C 473.434 262.451 473 261.619 472.095 259.918 C 471.841 259.411 471.407 258.578 470.9 258.614 C 470.708 258.636 470.536 258.742 470.43 258.904 C 470.341 259.112 470.341 259.347 470.43 259.556 C 470.803 260.6 471.251 261.616 471.769 262.596 L 472.457 263.972 L 473.796 267.012 L 474.52 268.677 C 474.954 270.017 475.244 270.777 474.882 271.211 C 474.52 271.645 473.398 271.645 472.71 271.211 C 472.095 270.849 472.095 270.379 471.262 268.315 L 470.068 265.637 L 469.054 262.958 C 468.511 261.148 468.33 259.99 467.715 259.918 C 467.451 259.923 467.207 260.058 467.063 260.28 C 466.701 260.642 466.882 261.221 467.063 261.945 C 467.317 263.031 467.498 264.189 467.715 265.311 L 468.077 267.338 C 468.262 268.133 468.359 268.947 468.366 269.763 C 468.33 270.487 468.294 270.849 468.004 271.211 C 467.645 271.623 467.067 271.768 466.556 271.573 C 466.133 271.373 465.854 270.955 465.833 270.487 C 465.67 269.771 465.549 269.046 465.471 268.315 L 465.362 267.012 C 465.29 266.107 465.181 264.949 465 263.61 C 464.867 262.698 464.649 261.802 464.348 260.931 C 464.204 260.461 464.059 260.026 463.661 259.918 C 463.28 259.789 462.861 259.939 462.647 260.28 C 462.617 260.496 462.617 260.715 462.647 260.931 C 462.859 261.809 462.98 262.707 463.009 263.61 L 463.009 264.297 C 463.009 266.469 463.226 266.831 462.937 267.229 C 462.484 267.744 461.743 267.893 461.127 267.591 C 460.656 267.302 460.656 266.686 460.62 264.623 L 460.62 261.583 C 460.581 260.009 460.46 258.438 460.258 256.877 C 460.005 254.343 459.896 253.076 459.607 251.809 C 459.136 249.529 458.666 248.552 459.245 247.755 C 459.534 247.393 460.113 247.212 461.308 246.742 C 461.972 246.479 462.648 246.249 463.335 246.054 C 464.43 245.713 465.559 245.495 466.701 245.403 L 466.701 245.403 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
        </g>
        {sites.map((site) => {
          const marker = markers.find((item) => item.site === site.label);
          const cx = mapFrontX(site.x);
          const cy = mapFrontY(site.y);
          const rx = site.rx ? mapFrontRX(site.rx) : undefined;
          const ry = site.ry ? mapFrontRY(site.ry) : undefined;
          const radius = site.r ? Math.max(4.5, mapFrontRX(site.r)) : 5.5;
          const clickable = rx && ry ? (
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={marker ? markerToneFill(marker.status) : "rgba(255,255,255,0.5)"}
              stroke={marker ? markerToneStroke(marker.status) : "#34a853"}
              strokeWidth="1.5"
              className={disabled || marker ? "" : "cursor-pointer"}
              onClick={() => onSelectSite(site)}
            />
          ) : (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill={marker ? markerToneFill(marker.status) : "rgba(255,255,255,0.5)"}
              stroke={marker ? markerToneStroke(marker.status) : "#34a853"}
              strokeWidth="1.5"
              className={disabled || marker ? "" : "cursor-pointer"}
              onClick={() => onSelectSite(site)}
            />
          );
          return (
            <g key={site.id}>
              {clickable}
              {marker ? (
                <text x={cx} y={cy + 2.6} textAnchor="middle" fontSize="7.5" fill="#ffffff" stroke="none" fontWeight="700">
                  {markers.findIndex((item) => item.id === marker.id) + 1}
                </text>
              ) : (
                <circle cx={cx} cy={cy} r="2.1" fill="#34a853" stroke="none" />
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <svg
      viewBox={`${frontBodyViewBox.minX} ${frontBodyViewBox.minY} ${frontBodyViewBox.width} ${frontBodyViewBox.height}`}
      className="mx-auto h-[22rem] w-auto max-w-full"
      fill="none"
    >
      <rect
        x={frontBodyViewBox.minX + 3}
        y={frontBodyViewBox.minY + 4}
        width={frontBodyViewBox.width - 6}
        height={frontBodyViewBox.height - 8}
        rx="12"
        fill="#eef4ff"
        stroke="none"
      />
      <g fill="#ffd457" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <path d="M 428.767 117.048 C 428.188 116.686 427.536 117.193 426.957 116.686 C 426.523 116.324 426.595 115.6 426.595 114.152 L 426.595 111.256 C 426.667 107.999 424.532 105.284 424.061 104.741 C 423.12 103.546 422.106 102.859 420.079 101.483 C 417.546 99.746 416.243 99.42 415.374 99.311 C 414.786 99.236 414.191 99.224 413.6 99.275 C 413.009 99.223 412.415 99.235 411.827 99.311 C 410.994 99.42 409.655 99.746 407.121 101.483 C 405.094 102.859 404.117 103.546 403.139 104.741 C 401.6 106.574 400.709 108.865 400.605 111.256 L 400.605 114.152 C 400.642 115.6 400.714 116.324 400.243 116.686 C 399.701 117.193 399.049 116.686 398.434 117.048 C 397.275 117.844 398.144 121.102 398.796 122.839 C 399.049 123.418 400.243 126.495 401.691 126.459 C 402.271 126.459 402.415 125.988 402.777 126.097 C 403.682 126.387 402.596 129.355 403.863 132.251 C 404.732 134.169 406.361 135.363 407.483 136.232 C 408.242 136.85 409.098 137.34 410.017 137.68 C 411.176 138.091 412.413 138.239 413.636 138.114 C 414.836 138.228 416.047 138.08 417.184 137.68 C 418.101 137.338 418.957 136.849 419.717 136.232 C 420.876 135.363 422.505 134.169 423.337 132.251 C 424.64 129.355 423.554 126.387 424.423 126.097 C 424.785 125.988 424.966 126.459 425.509 126.459 C 426.993 126.495 428.188 123.418 428.405 122.839 C 429.093 121.102 429.961 117.844 428.767 117.048 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
        <path d="M 517.321 153.172 C 517.321 152.449 513.194 151.58 510.081 151.363 C 508.761 151.169 507.42 151.169 506.1 151.363 C 504.108 151.744 502.242 152.615 500.67 153.896 C 498.281 155.706 497.123 157.769 496.327 159.326 C 494.901 162.149 494.04 165.223 493.793 168.375 C 493.503 170.945 493.431 171.343 493.684 171.633 C 495.132 173.262 501.756 171.488 504.29 167.289 C 505.484 165.226 504.688 164.43 506.462 161.498 C 507.509 159.712 508.856 158.12 510.443 156.792 C 511.431 155.93 512.526 155.2 513.701 154.62 C 515.945 153.498 517.321 153.534 517.321 153.172 Z M 504.399 168.701 C 503.964 168.556 503.747 169.316 502.227 170.511 C 501.237 171.273 500.139 171.883 498.969 172.321 C 497.376 172.936 496.435 173.298 495.349 173.045 C 494.263 172.791 493.901 172.104 493.539 172.321 C 492.996 172.61 493.467 174.131 493.539 176.302 C 493.576 177.316 493.467 178.438 493.177 180.646 C 492.779 183.904 492.49 186.22 491.73 188.609 C 491.289 189.717 491.044 190.893 491.006 192.084 C 491.055 192.614 491.055 193.147 491.006 193.677 C 490.825 194.908 490.39 195.342 490.644 195.849 C 490.861 196.211 491.295 196.175 492.092 196.573 C 492.888 196.971 493.25 197.405 493.901 198.021 C 495.174 199.135 496.648 199.996 498.245 200.554 C 499.548 200.989 499.693 200.735 501.141 201.278 C 502.48 201.785 502.842 202.183 503.313 202.002 C 504 201.749 504.037 200.663 504.399 198.383 C 504.941 195.016 505.122 195.451 505.484 192.591 C 505.689 191.151 505.81 189.701 505.846 188.247 C 505.919 184.664 505.267 184.085 505.122 179.922 L 505.122 174.854 C 505.122 170.221 504.978 168.846 504.399 168.701 Z" />
        <path d="M 549.753 153.172 C 549.753 152.449 553.916 151.58 556.993 151.363 C 558.803 151.182 559.708 151.109 560.975 151.363 C 562.966 151.744 564.832 152.615 566.404 153.896 C 568.793 155.706 569.951 157.769 570.748 159.326 C 572.174 162.148 573.035 165.222 573.282 168.375 C 573.571 170.945 573.644 171.343 573.39 171.633 C 571.942 173.262 565.354 171.488 562.784 167.289 C 561.59 165.226 562.386 164.43 560.613 161.498 C 559.565 159.712 558.218 158.12 556.631 156.792 C 555.644 155.929 554.549 155.199 553.373 154.62 C 551.129 153.498 549.753 153.534 549.753 153.172 Z M 562.676 168.701 C 563.11 168.556 563.327 169.316 564.848 170.511 C 565.837 171.273 566.935 171.883 568.105 172.321 C 569.698 172.936 570.639 173.298 571.725 173.045 C 572.811 172.791 573.173 172.104 573.535 172.321 C 574.114 172.61 573.644 174.131 573.535 176.302 C 573.499 177.316 573.644 178.438 573.897 180.646 C 574.295 183.904 574.585 186.22 575.345 188.609 C 575.785 189.717 576.03 190.893 576.069 192.084 C 576.019 192.614 576.019 193.147 576.069 193.677 C 576.25 194.908 576.684 195.342 576.431 195.849 C 576.213 196.211 575.779 196.175 574.983 196.573 C 574.186 196.971 573.824 197.405 573.173 198.021 C 571.901 199.135 570.426 199.996 568.829 200.554 C 567.526 200.989 567.381 200.735 565.934 201.278 C 564.63 201.785 564.232 202.183 563.762 202.002 C 563.074 201.749 563.038 200.663 562.676 198.383 C 562.133 195.016 561.952 195.451 561.59 192.591 C 561.385 191.151 561.264 189.701 561.228 188.247 C 561.156 184.664 561.807 184.085 561.952 179.922 L 561.952 174.854 C 561.952 170.221 562.133 168.846 562.676 168.701 Z" />
        <path d="M 490.282 196.573 C 489.377 197.079 489.775 199.324 489.92 200.192 C 490.171 201.524 490.757 202.769 491.621 203.812 C 492.128 204.464 492.852 205.115 495.965 206.708 C 499.765 208.663 501.684 209.604 502.589 208.88 C 502.987 208.518 503.095 207.794 503.313 206.346 C 503.566 204.681 503.675 203.812 503.313 203.088 C 502.625 201.713 500.779 202.002 498.245 201.278 C 493.358 199.758 491.549 195.849 490.282 196.573 Z M 489.449 202.4 C 488.146 202.437 487.35 206.635 486.553 211.088 C 485.938 214.345 485.612 217.169 485.467 219.051 C 485.106 223.141 485.431 222.671 485.106 224.843 C 484.309 230.2 482.318 232.697 483.658 234.254 C 484.128 234.761 485.033 235.159 486.191 235.702 C 486.88 236.039 487.61 236.282 488.363 236.426 C 490.39 236.679 492.128 235.34 492.707 234.978 C 494.698 233.458 495.096 231.72 496.689 228.1 C 498.498 223.938 498.498 224.951 500.67 220.137 C 504.109 212.427 503.494 211.16 503.204 210.726 C 502.697 209.929 502.335 210.219 497.413 208.192 C 493.684 206.599 492.815 206.056 491.983 205.296 C 490.245 203.631 490.173 202.328 489.449 202.4 Z M 482.934 234.978 C 481.667 235.448 482.644 237.982 480.762 241.493 C 480.038 242.76 479.386 243.376 479.676 244.027 C 480.002 244.751 481.124 244.425 483.658 245.113 C 486.191 245.801 486.662 246.488 488.001 246.199 C 488.854 245.944 489.61 245.44 490.173 244.751 C 490.496 244.313 490.74 243.824 490.897 243.303 C 491.476 241.638 491.331 240.878 491.621 239.683 C 492.164 237.258 493.431 236.534 493.069 236.064 C 492.526 235.267 489.992 237.475 486.915 236.788 C 484.599 236.208 483.983 234.543 482.934 234.978 Z" />
        <path d="M 576.793 196.573 C 577.698 197.079 577.299 199.324 577.155 200.192 C 576.903 201.524 576.318 202.769 575.453 203.812 C 574.947 204.464 574.223 205.115 571.11 206.708 C 567.309 208.663 565.391 209.604 564.486 208.88 C 564.087 208.518 563.979 207.794 563.762 206.346 C 563.545 204.681 563.4 203.812 563.762 203.088 C 564.449 201.713 566.295 202.002 568.829 201.278 C 573.752 199.758 575.526 195.849 576.793 196.573 Z M 577.625 202.4 C 578.928 202.437 579.725 206.635 580.521 211.088 C 581.136 214.345 581.462 217.169 581.607 219.051 C 581.969 223.141 581.679 222.671 581.969 224.843 C 582.765 230.2 584.756 232.697 583.417 234.254 C 582.946 234.761 582.077 235.159 580.883 235.702 C 580.194 236.039 579.464 236.282 578.711 236.426 C 576.684 236.679 574.947 235.34 574.367 234.978 C 572.377 233.458 571.978 231.72 570.386 228.1 C 568.576 223.938 568.576 224.951 566.404 220.137 C 562.965 212.427 563.581 211.16 563.87 210.726 C 564.377 209.929 564.739 210.219 569.662 208.192 C 573.39 206.599 574.259 206.056 575.091 205.296 C 576.829 203.631 576.901 202.328 577.625 202.4 Z M 584.141 234.978 C 585.444 235.448 584.43 237.982 586.312 241.493 C 587.036 242.76 587.688 243.376 587.398 244.027 C 587.073 244.751 585.951 244.425 583.417 245.113 C 580.883 245.801 580.412 246.488 579.073 246.199 C 578.221 245.944 577.464 245.44 576.901 244.751 C 576.579 244.313 576.334 243.824 576.177 243.303 C 575.634 241.638 575.743 240.878 575.453 239.683 C 574.947 237.258 573.644 236.534 574.005 236.064 C 574.548 235.267 577.082 237.475 580.159 236.788 C 582.512 236.208 583.127 234.543 584.141 234.978 Z" />
        <path d="M 360.861 245.403 C 360.308 245.33 359.749 245.33 359.196 245.403 C 358.038 245.62 357.278 246.344 355.793 247.755 C 354.744 248.769 354.744 248.95 353.766 249.782 L 352.101 251.122 C 350.654 252.28 350.762 252.352 350.074 252.823 C 348.988 253.547 348.482 253.909 347.722 254.162 C 346.817 254.452 346.31 254.379 346.02 254.85 C 345.781 255.264 345.781 255.775 346.02 256.189 C 346.527 257.058 348.011 257.13 349.061 256.877 C 350.509 256.515 351.595 255.357 352.101 254.85 C 352.789 254.126 353.296 253.366 353.766 253.511 C 353.927 253.565 354.058 253.683 354.128 253.836 C 354.527 254.597 354.02 255.646 353.766 256.189 C 352.825 258.289 353.513 257.854 352.427 260.243 C 351.884 261.474 351.522 261.872 350.798 263.031 C 350.397 263.66 350.035 264.312 349.712 264.985 C 349.097 266.288 348.771 267.012 349.097 267.555 C 349.394 268.062 349.962 268.345 350.545 268.279 C 351.124 268.207 351.45 267.7 351.993 266.831 C 352.677 265.679 353.282 264.482 353.803 263.248 C 354.165 262.415 354.599 261.583 355.504 259.881 C 355.757 259.375 356.192 258.542 356.698 258.578 C 356.89 258.6 357.063 258.706 357.169 258.868 C 357.257 259.076 357.257 259.311 357.169 259.519 C 356.795 260.563 356.348 261.579 355.83 262.56 L 355.142 263.935 L 353.803 266.976 L 353.079 268.641 C 352.644 269.98 352.355 270.74 352.717 271.175 C 353.079 271.609 354.201 271.609 354.889 271.175 C 355.504 270.813 355.504 270.342 356.336 268.279 L 357.531 265.601 L 358.544 262.922 C 359.087 261.112 359.268 259.954 359.884 259.881 C 360.147 259.887 360.391 260.022 360.535 260.243 C 360.897 260.605 360.716 261.184 360.535 261.908 C 360.282 262.994 360.101 264.153 359.884 265.275 L 359.522 267.302 C 359.337 268.097 359.24 268.91 359.232 269.727 C 359.268 270.451 359.305 270.813 359.594 271.175 C 359.953 271.587 360.531 271.732 361.042 271.537 C 361.466 271.337 361.744 270.919 361.766 270.451 C 361.929 269.735 362.05 269.009 362.128 268.279 L 362.237 266.976 C 362.309 266.071 362.418 264.913 362.599 263.573 C 362.732 262.662 362.95 261.765 363.25 260.895 C 363.395 260.424 363.54 259.99 363.938 259.881 C 364.319 259.753 364.738 259.903 364.951 260.243 C 364.982 260.459 364.982 260.679 364.951 260.895 C 364.739 261.773 364.618 262.671 364.589 263.573 L 364.589 264.261 C 364.589 266.433 364.372 266.795 364.662 267.193 C 365.114 267.708 365.856 267.856 366.472 267.555 C 366.942 267.266 366.942 266.65 366.978 264.587 L 366.978 261.546 C 367.018 259.973 367.138 258.402 367.34 256.841 C 367.594 254.307 367.702 253.04 367.992 251.773 C 368.462 249.493 368.933 248.515 368.354 247.719 C 368.064 247.357 367.485 247.176 366.291 246.706 C 365.627 246.442 364.95 246.213 364.264 246.018 C 363.157 245.674 362.016 245.456 360.861 245.366 L 360.861 245.403 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
        <path d="M 466.701 245.403 C 467.266 245.327 467.838 245.327 468.403 245.403 C 469.525 245.62 470.285 246.344 471.769 247.755 C 472.819 248.769 472.819 248.95 473.796 249.782 L 475.461 251.122 C 476.909 252.28 476.8 252.352 477.488 252.823 C 478.574 253.547 479.081 253.909 479.877 254.162 C 480.746 254.452 481.252 254.379 481.542 254.85 C 481.781 255.264 481.781 255.775 481.542 256.189 C 481.071 257.058 479.551 257.13 478.501 256.877 C 477.054 256.515 475.968 255.357 475.461 254.85 C 474.809 254.126 474.266 253.366 473.796 253.511 C 473.636 253.565 473.505 253.683 473.434 253.836 C 473.036 254.597 473.543 255.646 473.796 256.189 C 474.737 258.289 474.049 257.854 475.135 260.243 C 475.678 261.474 476.04 261.872 476.764 263.031 C 477.163 263.661 477.526 264.313 477.85 264.985 C 478.465 266.288 478.791 267.012 478.501 267.591 C 478.205 268.098 477.637 268.382 477.054 268.315 C 476.474 268.243 476.112 267.736 475.606 266.867 C 474.921 265.716 474.317 264.518 473.796 263.284 C 473.434 262.451 473 261.619 472.095 259.918 C 471.841 259.411 471.407 258.578 470.9 258.614 C 470.708 258.636 470.536 258.742 470.43 258.904 C 470.341 259.112 470.341 259.347 470.43 259.556 C 470.803 260.6 471.251 261.616 471.769 262.596 L 472.457 263.972 L 473.796 267.012 L 474.52 268.677 C 474.954 270.017 475.244 270.777 474.882 271.211 C 474.52 271.645 473.398 271.645 472.71 271.211 C 472.095 270.849 472.095 270.379 471.262 268.315 L 470.068 265.637 L 469.054 262.958 C 468.511 261.148 468.33 259.99 467.715 259.918 C 467.451 259.923 467.207 260.058 467.063 260.28 C 466.701 260.642 466.882 261.221 467.063 261.945 C 467.317 263.031 467.498 264.189 467.715 265.311 L 468.077 267.338 C 468.262 268.133 468.359 268.947 468.366 269.763 C 468.33 270.487 468.294 270.849 468.004 271.211 C 467.645 271.623 467.067 271.768 466.556 271.573 C 466.133 271.373 465.854 270.955 465.833 270.487 C 465.67 269.771 465.549 269.046 465.471 268.315 L 465.362 267.012 C 465.29 266.107 465.181 264.949 465 263.61 C 464.867 262.698 464.649 261.802 464.348 260.931 C 464.204 260.461 464.059 260.026 463.661 259.918 C 463.28 259.789 462.861 259.939 462.647 260.28 C 462.617 260.496 462.617 260.715 462.647 260.931 C 462.859 261.809 462.98 262.707 463.009 263.61 L 463.009 264.297 C 463.009 266.469 463.226 266.831 462.937 267.229 C 462.484 267.744 461.743 267.893 461.127 267.591 C 460.656 267.302 460.656 266.686 460.62 264.623 L 460.62 261.583 C 460.581 260.009 460.46 258.438 460.258 256.877 C 460.005 254.343 459.896 253.076 459.607 251.809 C 459.136 249.529 458.666 248.552 459.245 247.755 C 459.534 247.393 460.113 247.212 461.308 246.742 C 461.972 246.479 462.648 246.249 463.335 246.054 C 464.43 245.713 465.559 245.495 466.701 245.403 L 466.701 245.403 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
        <path d="M 531 150 C 525 154 521 160 520 168 C 519 176 522 184 528 190 C 532 194 536 197 542 198 C 548 197 552 194 556 190 C 562 184 565 176 564 168 C 563 160 559 154 553 150 C 549 148 546 147 542 147 C 538 147 535 148 531 150 Z" fill="#ff8b1e" stroke="#ffffff" />
        <path d="M 520 192 C 515 198 512 206 512 215 C 512 228 518 239 527 247 C 531 251 536 254 542 255 C 548 254 553 251 557 247 C 566 239 572 228 572 215 C 572 206 569 198 564 192 L 553 197 C 549 200 546 203 542 208 C 538 203 535 200 531 197 L 520 192 Z" fill="#ff8b1e" stroke="#ffffff" />
        <path d="M 522 248 C 516 255 513 264 513 273 C 513 283 517 291 523 299 C 528 306 534 311 542 313 C 550 311 556 306 561 299 C 567 291 571 283 571 273 C 571 264 568 255 562 248 L 552 254 C 548 258 545 263 542 269 C 539 263 536 258 532 254 L 522 248 Z" fill="#ff8b1e" stroke="#ffffff" />
        <path d="M 528 314 C 523 320 520 327 520 336 C 520 347 524 357 530 366 C 533 370 537 373 542 375 C 547 373 551 370 554 366 C 560 357 564 347 564 336 C 564 327 561 320 556 314 L 550 318 C 546 322 544 327 542 333 C 540 327 538 322 534 318 L 528 314 Z" fill="#ff8b1e" stroke="#ffffff" />
        <path d="M 526 204 C 529 210 534 214 542 216 C 550 214 555 210 558 204" fill="none" stroke="#ffffff" />
        <path d="M 526 260 C 530 266 535 270 542 272 C 549 270 554 266 558 260" fill="none" stroke="#ffffff" />
        <path d="M 531 325 C 534 331 537 336 542 339 C 547 336 550 331 553 325" fill="none" stroke="#ffffff" />
        <path d="M 542 147 L 542 376" fill="none" stroke="#ffffff" />
        <path d="M 541 131 L 541 141" stroke="#ffffff" fill="none" />
        <path d="M 542 188 L 542 379" stroke="#ffffff" fill="none" />
        <path d="M 522 199 C 528 204 534 207 542 207 C 550 207 556 204 562 199" stroke="#ffffff" fill="none" />
        <path d="M 526 253 C 531 258 536 260 542 260 C 548 260 553 258 558 253" stroke="#ffffff" fill="none" />
        <path d="M 527 309 C 532 313 537 315 542 315 C 547 315 552 313 557 309" stroke="#ffffff" fill="none" />
        <path d="M 392.461 308.168 C 391.592 308.458 393.04 311.064 393.8 315.987 L 394.054 317.76 L 394.126 318.846 C 394.343 321.272 394.85 321.67 394.778 323.335 C 394.778 324.566 394.488 324.964 394.778 325.724 C 395.026 326.222 395.4 326.646 395.864 326.955 C 396.612 327.529 397.526 327.846 398.47 327.859 C 399.013 327.859 398.94 327.751 399.845 327.678 L 403.465 327.678 C 404.075 327.764 404.679 327.885 405.275 328.04 C 405.985 328.231 406.713 328.352 407.447 328.402 C 407.881 328.402 408.858 328.33 409.51 327.606 C 409.617 327.503 409.703 327.38 409.763 327.244 C 409.98 326.81 409.691 326.231 409.836 325 C 410.017 323.878 410.306 323.95 410.849 322.14 C 411.162 321.062 411.392 319.96 411.537 318.846 C 411.682 317.905 411.718 317.254 411.863 315.987 C 412.333 311.281 411.863 312.259 412.225 311.028 C 412.369 310.268 412.587 309.833 412.225 309.58 C 411.573 309.182 410.234 309.942 407.881 310.304 C 406.868 310.485 406.831 310.376 401.836 310.304 C 397.746 310.268 397.384 310.304 396.479 310.087 C 393.837 309.363 393.113 307.951 392.497 308.168 L 392.461 308.168 Z M 408.171 373.033 C 407.809 372.599 407.085 372.671 405.275 373.033 C 401.691 373.685 401.51 373.866 400.569 373.757 C 399.99 373.685 399.701 373.54 399.483 373.757 C 399.049 374.192 399.99 375.35 400.569 377.739 C 400.859 378.825 401.04 379.621 400.931 380.635 C 400.823 381.721 400.461 382.01 400.207 383.531 C 400.062 384.399 399.809 385.847 400.207 386.064 C 400.714 386.281 401.474 384.363 403.827 382.807 C 404.889 382.02 406.136 381.522 407.447 381.359 C 409.076 381.214 410.089 381.757 410.342 381.359 C 410.596 380.961 409.474 380.273 408.895 378.463 C 408.615 377.649 408.492 376.789 408.533 375.929 C 408.617 375.329 408.617 374.72 408.533 374.119 C 408.46 373.576 408.388 373.251 408.171 373.033 Z M 394.886 327.28 C 394.307 327.534 394.38 328.728 394.235 331.986 C 394.126 335.316 394.018 334.52 393.945 337.415 C 393.909 338.501 393.837 341.325 393.945 343.569 C 394.162 347.768 394.995 348.202 396.153 354.428 C 397.058 359.134 396.877 360.328 397.782 364.925 C 398.687 369.522 399.121 369.486 399.049 371.079 C 398.981 371.585 399.097 372.098 399.375 372.527 C 399.628 372.816 400.099 373.033 401.909 372.889 C 402.663 372.814 403.413 372.693 404.153 372.527 C 405.524 372.198 406.914 371.956 408.315 371.803 C 407.905 368.316 407.905 364.793 408.315 361.306 C 408.605 358.772 408.858 358.518 409.257 355.152 C 409.51 352.908 409.474 352.691 409.908 346.103 C 410.198 342.121 410.27 341.651 410.234 340.311 C 410.234 337.162 409.872 337.126 409.908 334.52 C 409.944 330.972 410.56 328.656 409.908 328.366 C 409.691 328.221 409.546 328.402 408.967 328.728 C 408.043 329.111 407.067 329.355 406.071 329.452 C 404.479 329.633 404.37 328.909 402.234 328.728 C 399.664 328.402 399.158 329.38 397.456 328.728 C 395.9 328.077 395.502 326.955 394.923 327.28 L 394.886 327.28 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
        <path d="M 435.101 308.168 C 435.97 308.458 434.522 311.064 433.762 315.987 L 433.545 317.76 L 433.436 318.846 C 433.219 321.272 432.748 321.67 432.785 323.335 C 432.785 324.566 433.11 324.964 432.785 325.724 C 432.536 326.222 432.162 326.646 431.699 326.955 C 430.95 327.529 430.036 327.846 429.093 327.859 C 428.586 327.859 428.658 327.751 427.717 327.715 C 427.138 327.642 426.993 327.715 425.907 327.715 C 424.532 327.715 424.604 327.642 424.097 327.715 C 423.488 327.8 422.883 327.921 422.287 328.077 C 421.577 328.267 420.85 328.389 420.116 328.439 C 419.717 328.402 418.74 328.33 418.052 327.606 C 417.949 327.514 417.863 327.403 417.799 327.28 C 417.582 326.81 417.908 326.231 417.727 325 C 417.582 323.914 417.256 323.986 416.713 322.176 C 416.41 321.085 416.192 319.972 416.062 318.846 C 415.913 317.897 415.793 316.943 415.7 315.987 C 415.265 311.281 415.7 312.259 415.41 311.028 C 415.229 310.268 415.048 309.833 415.41 309.58 C 416.025 309.182 417.365 309.942 419.754 310.304 C 420.731 310.485 420.731 310.376 425.762 310.304 C 429.853 310.268 430.178 310.304 431.12 310.087 C 433.726 309.363 434.45 307.951 435.101 308.168 Z M 432.712 327.28 C 433.255 327.534 433.183 328.728 433.328 331.986 C 433.472 335.316 433.545 334.52 433.653 337.415 C 433.653 338.501 433.762 341.325 433.653 343.569 C 433.436 347.768 432.567 348.202 431.409 354.428 C 430.504 359.134 430.685 360.328 429.816 364.925 C 428.948 369.522 428.441 369.486 428.513 371.079 C 428.581 371.585 428.466 372.098 428.188 372.527 C 427.934 372.816 427.464 373.033 425.654 372.889 C 424.899 372.814 424.15 372.693 423.41 372.527 C 422.039 372.198 420.648 371.956 419.247 371.803 C 419.657 368.316 419.657 364.793 419.247 361.306 C 418.957 358.772 418.704 358.518 418.306 355.152 C 418.052 352.908 418.125 352.691 417.654 346.103 C 417.401 342.121 417.328 341.651 417.328 340.311 C 417.365 337.162 417.69 337.126 417.69 334.52 C 417.618 330.972 416.967 328.656 417.69 328.366 C 417.871 328.221 418.052 328.402 418.632 328.728 C 419.556 329.111 420.532 329.355 421.527 329.452 C 423.084 329.633 423.192 328.909 425.328 328.728 C 427.898 328.402 428.441 329.38 430.106 328.728 C 431.663 328.077 432.097 326.955 432.676 327.28 L 432.712 327.28 Z M 419.392 373.033 C 419.754 372.599 420.478 372.671 422.287 373.033 C 425.871 373.685 426.052 373.866 426.993 373.757 C 427.572 373.685 427.898 373.54 428.079 373.757 C 428.513 374.192 427.572 375.35 426.993 377.739 C 426.704 378.825 426.523 379.621 426.631 380.635 C 426.74 381.721 427.102 382.01 427.355 383.531 C 427.5 384.399 427.789 385.847 427.355 386.064 C 426.848 386.281 426.124 384.363 423.735 382.807 C 422.674 382.02 421.427 381.522 420.116 381.359 C 418.523 381.214 417.473 381.757 417.22 381.359 C 416.967 380.961 418.125 380.273 418.668 378.463 C 418.948 377.649 419.07 376.789 419.03 375.929 C 418.946 375.329 418.946 374.72 419.03 374.119 C 419.138 373.576 419.175 373.251 419.392 373.033 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
        <path d="M 409.98 382.988 C 409.619 382.372 408.677 382.264 408.171 382.264 C 407.429 382.226 406.688 382.349 405.999 382.626 C 405.229 382.887 404.498 383.252 403.827 383.711 C 403.178 384.134 402.572 384.619 402.017 385.159 C 401.26 385.74 400.642 386.482 400.207 387.331 C 400.042 387.802 399.921 388.286 399.845 388.779 C 399.556 390.155 399.664 390.336 399.483 390.951 C 399.302 391.566 399.194 391.53 398.035 393.123 C 396.588 395.114 396.805 395.15 396.226 395.657 C 395.465 396.344 394.923 396.453 394.778 397.104 C 394.669 397.575 394.886 398.009 395.14 398.552 C 395.48 399.257 395.975 399.875 396.588 400.362 C 397.891 401.267 398.94 400.326 402.379 400.362 C 403.972 400.362 404.985 400.688 406.723 400.362 C 407.371 400.255 407.989 400.008 408.533 399.638 C 409.181 399.189 409.684 398.56 409.98 397.828 C 410.334 396.895 410.334 395.866 409.98 394.933 C 409.407 392.553 409.407 390.072 409.98 387.693 L 409.98 386.245 L 409.98 384.435 C 410.017 383.35 410.125 383.241 409.98 382.988 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
        <path d="M 417.582 382.988 C 417.944 382.372 418.885 382.264 419.392 382.264 C 420.133 382.226 420.874 382.349 421.564 382.626 C 422.334 382.887 423.064 383.252 423.735 383.711 C 424.384 384.134 424.991 384.619 425.545 385.159 C 426.523 386.064 427.029 386.535 427.355 387.331 C 427.52 387.802 427.641 388.286 427.717 388.779 C 428.007 390.155 427.898 390.336 428.079 390.951 C 428.26 391.566 428.405 391.53 429.527 393.123 C 430.975 395.114 430.794 395.15 431.337 395.657 C 432.097 396.344 432.64 396.453 432.785 397.104 C 432.893 397.575 432.676 398.009 432.423 398.552 C 432.082 399.257 431.587 399.875 430.975 400.362 C 429.672 401.267 428.622 400.326 425.183 400.362 C 423.591 400.362 422.577 400.688 420.84 400.362 C 420.191 400.255 419.573 400.008 419.03 399.638 C 418.381 399.189 417.878 398.56 417.582 397.828 C 417.229 396.895 417.229 395.866 417.582 394.933 C 418.155 392.553 418.155 390.072 417.582 387.693 L 417.582 386.245 L 417.582 384.435 C 417.546 383.35 417.437 383.241 417.582 382.988 Z" transform="matrix(1, 0, 0, 1, 119.755565, 0.000182)" />
      </g>
      {sites.map((site) => {
        const marker = markers.find((item) => item.site === site.label);
        const cx = mapFrontX(site.x);
        const cy = mapFrontY(site.y);
        const rx = site.rx ? mapFrontRX(site.rx) : undefined;
        const ry = site.ry ? mapFrontRY(site.ry) : undefined;
        const radius = site.r ? Math.max(4.5, mapFrontRX(site.r)) : 5.5;
        const clickable = rx && ry ? (
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill={marker ? markerToneFill(marker.status) : "rgba(255,255,255,0.5)"}
            stroke={marker ? markerToneStroke(marker.status) : "#34a853"}
            strokeWidth="1.5"
            className={disabled || marker ? "" : "cursor-pointer"}
            onClick={() => onSelectSite(site)}
          />
        ) : (
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill={marker ? markerToneFill(marker.status) : "rgba(255,255,255,0.5)"}
            stroke={marker ? markerToneStroke(marker.status) : "#34a853"}
            strokeWidth="1.5"
            className={disabled || marker ? "" : "cursor-pointer"}
            onClick={() => onSelectSite(site)}
          />
        );
        return (
          <g key={site.id}>
            {clickable}
            {marker ? (
              <text x={cx} y={cy + 2.6} textAnchor="middle" fontSize="7.5" fill="#ffffff" stroke="none" fontWeight="700">
                {markers.findIndex((item) => item.id === marker.id) + 1}
              </text>
            ) : (
              <circle cx={cx} cy={cy} r="2.1" fill="#34a853" stroke="none" />
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
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
        placeholder={placeholder}
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
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <PaperField label={label}>
      <div className={`grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
        {options.map((option) => (
          <label key={option} className={`inline-flex items-center gap-2 text-slate-700 ${compact ? "text-xs" : "text-sm"}`}>
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
  compact = false,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
  rows?: number;
}) {
  return (
    <label className={`block rounded-2xl border border-[#c9d8f2] bg-[#fdfefe] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] ${compact ? "p-3" : "p-4"}`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <textarea
        className={`w-full resize-y bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 ${compact ? "min-h-20" : "min-h-28"}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={rows}
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
