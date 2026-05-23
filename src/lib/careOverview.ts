import type { Role, User } from "@/lib/auth";
import type { Patient } from "@/lib/edTypes";

export type OverviewInvestigationStatus = "Pending" | "Ready" | "Reviewed";
export type OverviewTaskStatus = "Due now" | "Due soon" | "Completed";

export type VitalsPoint = {
  at: string;
  sbp: number;
  dbp: number;
  hr: number;
  rr: number;
  temp: number;
  spo2: number;
  glucose: number;
  gcs: number;
  pain: number;
  mews: number;
};

export type InvestigationItem = {
  name: string;
  plainLabel: string;
  status: OverviewInvestigationStatus;
  value: string;
  range: string;
  abnormal: boolean;
  tat: string;
  note: string;
};

export type MedicationItem = {
  name: string;
  dose: string;
  route: string;
  at: string;
  purpose: string;
  nextDue?: string;
  protocolNote?: string;
  overdue?: boolean;
};

export type NurseTask = {
  title: string;
  due: string;
  status: OverviewTaskStatus;
  details: string;
  actionLabel: string;
};

export type ProtocolChecklistItem = {
  label: string;
  complete: boolean;
  detail: string;
};

export type JourneyStep = {
  label: string;
  done: boolean;
  active?: boolean;
  eta?: string;
};

export type PatientOverview = {
  patient: Patient;
  assignedNurse: string;
  careTeam: { doctor: string; nurse: string };
  arrivalElapsed: string;
  identity: {
    triageLabel: string;
    pathwayLabel: string;
    mlc: boolean;
    insurance: string;
    attendant: { present: boolean; name: string; phone: string };
    language: string;
  };
  complaints: {
    chiefComplaint: string;
    patientWords: string;
    hpi: string;
    pastHistory: string[];
    currentMedications: string[];
    surgicalHistory: string;
    allergies: string[];
    immunization: string;
    socialHistory: string;
  };
  vitalsTimeline: VitalsPoint[];
  lastVitalsDue: string;
  vitalsAlert: boolean;
  investigations: InvestigationItem[];
  medications: MedicationItem[];
  assessment: {
    initialNote: string;
    workingDiagnosis: string;
    differentials: string[];
    carePlan: string;
    consultations: { specialty: string; requestedAt: string; response: string }[];
    progressNotes: { at: string; author: string; note: string }[];
  };
  disposition: {
    current: string;
    location: string;
    reason?: string;
    estimated: string;
    followUp?: string;
  };
  checklist: ProtocolChecklistItem[];
  nurseTasks: NurseTask[];
  nursingStatus: {
    latestPain: string;
    consciousness: string;
    fallRisk: string;
    pressureRisk: string;
  };
  isolation: {
    flag: string;
    ppe: string;
  };
  journey: JourneyStep[];
  patientFacing: {
    waitTime: string;
    aheadCount: number;
    nextStep: string;
    tests: { label: string; status: string; note: string }[];
    medicineSummary: { label: string; purpose: string; at: string; nextDue?: string }[];
    simpleVitals: { label: string; summary: string }[];
    instructions: string[];
    billing: {
      coverage: string;
      estimate: string;
      covered: string;
      outOfPocket: string;
    };
    discharge: {
      summary: string;
      warningSigns: string[];
    };
  };
};

export type ClinicianSnapshot = {
  title: string;
  subtitle: string;
  assignedPatients: PatientOverview[];
  metrics: { label: string; value: string; note: string; tone?: "critical" | "steady" | "attention" }[];
  statusMix: { label: string; value: number; color: string }[];
  pathwayMix: { label: string; value: number }[];
  attentionList: { patientId: string; patientName: string; bed: string; reason: string; tone: "critical" | "warning" | "steady" }[];
};

const NURSE_ASSIGNMENTS: Record<string, string> = {
  p1: "Nurse Anita",
  p2: "Nurse Farah",
  p3: "Nurse Anita",
  p4: "Nurse Kavya",
  p5: "Nurse Joseph",
  p6: "Nurse Anita",
  p7: "Nurse Farah",
  p8: "Nurse Kavya",
  p9: "Nurse Joseph",
  p10: "Nurse Farah",
  p11: "Nurse Anita",
  p12: "Nurse Joseph",
  p13: "Nurse Kavya",
};

const INSURANCE = ["Ayushman Bharat PM-JAY", "State Scheme", "Corporate Cashless", "Self Pay"];
const LANGUAGES = ["Telugu", "Hindi", "English", "Telugu / Hindi only"];
const ATTENDANT_NAMES = ["Ramesh", "Sowmya", "Farooq", "Latha", "Ajay", "Niharika"];

export function getAssignedNurse(patient: Patient) {
  return NURSE_ASSIGNMENTS[patient.id] ?? "Nurse Anita";
}

export function buildPatientOverview(patient: Patient): PatientOverview {
  const seed = seedFrom(patient.id);
  const triageLabel = patient.triage === 0 ? "Pending triage" : `Level ${patient.triage}`;
  const pathwayKind = getPathwayKind(patient.pathway);
  const vitalsTimeline = buildVitalsTimeline(patient, seed);
  const latestVitals = vitalsTimeline[vitalsTimeline.length - 1];
  const investigations = buildInvestigations(pathwayKind, seed);
  const medications = buildMedications(pathwayKind, seed);
  const complaints = buildComplaints(patient, pathwayKind, seed);
  const checklist = buildChecklist(pathwayKind, investigations, medications);
  const assignedNurse = getAssignedNurse(patient);
  const journey = buildJourney(patient, investigations);
  const lastVitalsDue = patient.triage === 1 ? "Due in 8 min" : patient.triage === 2 ? "Due in 18 min" : "Due in 28 min";
  const vitalsAlert = patient.triage === 1 || latestVitals.spo2 < 92;

  return {
    patient,
    assignedNurse,
    careTeam: {
      doctor: patient.physician === "-" ? "Duty Doctor Pending" : patient.physician,
      nurse: assignedNurse,
    },
    arrivalElapsed: formatElapsed(patient.checkIn),
    identity: {
      triageLabel,
      pathwayLabel: patient.pathway,
      mlc: patient.department === "Trauma" || pathwayKind === "trauma" || pathwayKind === "poisoning",
      insurance: INSURANCE[seed % INSURANCE.length],
      attendant: {
        present: patient.status !== "discharged",
        name: `${ATTENDANT_NAMES[seed % ATTENDANT_NAMES.length]} ${patient.sex === "F" ? "Rao" : "Kumar"}`,
        phone: `+91 9${String(100000000 + seed * 7919).slice(0, 9)}`,
      },
      language: LANGUAGES[seed % LANGUAGES.length],
    },
    complaints,
    vitalsTimeline,
    lastVitalsDue,
    vitalsAlert,
    investigations,
    medications,
    assessment: {
      initialNote: buildInitialNote(patient, complaints.patientWords),
      workingDiagnosis: workingDiagnosisFor(pathwayKind),
      differentials: differentialsFor(pathwayKind),
      carePlan: carePlanFor(pathwayKind),
      consultations: consultsFor(pathwayKind),
      progressNotes: [
        { at: "10:58", author: patient.physician === "-" ? "Duty Doctor" : patient.physician, note: "Initial ER review completed. Working diagnosis established and pathway activated." },
        { at: "11:18", author: assignedNurse, note: "Vitals repeated, medications administered, family updated about next steps." },
      ],
    },
    disposition: buildDisposition(patient, pathwayKind),
    checklist,
    nurseTasks: buildNurseTasks(patient, pathwayKind, latestVitals),
    nursingStatus: {
      latestPain: `${latestVitals.pain}/10`,
      consciousness: latestVitals.gcs < 14 ? "Confused / drowsy" : "Alert and responsive",
      fallRisk: patient.age > 60 ? "High" : "Moderate",
      pressureRisk: patient.status === "obs" ? "Moderate" : "Low",
    },
    isolation: {
      flag: pathwayKind === "respiratory" ? "Droplet precaution" : pathwayKind === "sepsis" ? "Contact precaution" : "Standard precaution",
      ppe: pathwayKind === "respiratory" ? "N95, face shield, gloves" : "Gloves and standard PPE",
    },
    journey,
    patientFacing: {
      waitTime: formatElapsed(patient.checkIn),
      aheadCount: seed % 4,
      nextStep: investigations.some((item) => item.status === "Pending") ? "Results review by doctor" : "Treatment update by doctor",
      tests: investigations.map((item) => ({
        label: item.plainLabel,
        status: item.status,
        note: item.status === "Pending" ? "Your team is waiting for this result." : item.status === "Ready" ? "Your result is ready and will be reviewed shortly." : "The doctor has already reviewed this result.",
      })),
      medicineSummary: medications.slice(0, 3).map((item) => ({
        label: `${item.name} ${item.dose}`,
        purpose: item.purpose,
        at: item.at,
        nextDue: item.nextDue,
      })),
      simpleVitals: [
        { label: "Blood pressure", summary: `Currently ${latestVitals.sbp}/${latestVitals.dbp}. ${latestVitals.sbp > 150 ? "Slightly high and being monitored." : "Stable for now."}` },
        { label: "Oxygen levels", summary: `${latestVitals.spo2}% ${latestVitals.spo2 < 92 ? "which is low, so the team is watching closely." : "which is in the safe range."}` },
        { label: "Pain score", summary: `You rated your pain ${latestVitals.pain}/10.` },
      ],
      instructions: buildPatientInstructions(pathwayKind),
      billing: {
        coverage: INSURANCE[seed % INSURANCE.length],
        estimate: `₹${(seed % 8 + 2) * 1850}`,
        covered: INSURANCE[seed % INSURANCE.length] === "Self Pay" ? "₹0" : `₹${(seed % 6 + 1) * 1200}`,
        outOfPocket: INSURANCE[seed % INSURANCE.length] === "Self Pay" ? `₹${(seed % 8 + 2) * 1850}` : `₹${(seed % 3 + 1) * 850}`,
      },
      discharge: {
        summary: dischargeSummaryFor(pathwayKind),
        warningSigns: warningSignsFor(pathwayKind),
      },
    },
  };
}

export function buildClinicianSnapshot(patients: Patient[], user: User): ClinicianSnapshot {
  const filteredPatients =
    user.role === "doctor"
      ? patients.filter((patient) => patient.physician === user.name)
      : user.role === "nurse"
        ? patients.filter((patient) => getAssignedNurse(patient) === user.name)
        : patients;

  const assignedPatients = filteredPatients.map(buildPatientOverview);
  const critical = assignedPatients.filter((item) => item.patient.triage === 1).length;
  const obs = assignedPatients.filter((item) => item.patient.status === "obs").length;
  const pendingResults = assignedPatients.reduce(
    (sum, item) => sum + item.investigations.filter((investigation) => investigation.status === "Pending").length,
    0,
  );
  const overdueTasks = assignedPatients.reduce(
    (sum, item) => sum + item.nurseTasks.filter((task) => task.status === "Due now").length,
    0,
  );
  const attentionList = assignedPatients
    .map((item) => {
      const latestVitals = item.vitalsTimeline[item.vitalsTimeline.length - 1];
      if (latestVitals.spo2 < 92) {
        return { patientId: item.patient.id, patientName: item.patient.name, bed: item.patient.bed, reason: `SpO₂ ${latestVitals.spo2}% requires reassessment`, tone: "critical" as const };
      }
      if (item.investigations.some((investigation) => investigation.status === "Pending")) {
        return { patientId: item.patient.id, patientName: item.patient.name, bed: item.patient.bed, reason: "Investigation results pending review", tone: "warning" as const };
      }
      return { patientId: item.patient.id, patientName: item.patient.name, bed: item.patient.bed, reason: "Stable trajectory, continue current plan", tone: "steady" as const };
    })
    .slice(0, 5);

  const pathwayMix = Object.entries(
    assignedPatients.reduce<Record<string, number>>((acc, item) => {
      const key = item.patient.pathway.replace(" Protocol", "").replace(" Bundle", "");
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return {
    title:
      user.role === "doctor"
        ? "My Clinical Snapshot"
        : user.role === "nurse"
          ? "My Nursing Snapshot"
          : "Department Snapshot",
    subtitle:
      user.role === "doctor"
        ? "Assigned patients, pending decisions, and acuity trends for your shift."
        : user.role === "nurse"
          ? "Task-heavy view of your assigned patients, due observations, and nursing actions."
          : "Whole-ED operational summary.",
    assignedPatients,
    metrics:
      user.role === "doctor"
        ? [
            { label: "Assigned Patients", value: String(assignedPatients.length), note: "currently under your care", tone: "steady" },
            { label: "Critical Cases", value: String(critical), note: "triage level I patients", tone: critical ? "critical" : "steady" },
            { label: "Pending Results", value: String(pendingResults), note: "labs and imaging awaiting review", tone: pendingResults ? "attention" : "steady" },
            { label: "Observation Load", value: String(obs), note: "patients still under ER observation", tone: "steady" },
          ]
        : user.role === "nurse"
          ? [
              { label: "Assigned Patients", value: String(assignedPatients.length), note: "current nursing load", tone: "steady" },
              { label: "Vitals Due Now", value: String(overdueTasks), note: "immediate nursing tasks", tone: overdueTasks ? "critical" : "steady" },
              { label: "Pending Results", value: String(pendingResults), note: "sample/result follow-up items", tone: pendingResults ? "attention" : "steady" },
              { label: "High Acuity", value: String(critical), note: "level I patients to watch closely", tone: critical ? "critical" : "steady" },
            ]
          : [
              { label: "Active Patients", value: String(assignedPatients.length), note: "across current snapshot", tone: "steady" },
              { label: "Critical Cases", value: String(critical), note: "triage level I", tone: critical ? "critical" : "steady" },
              { label: "Pending Results", value: String(pendingResults), note: "awaiting review", tone: pendingResults ? "attention" : "steady" },
              { label: "Observation Load", value: String(obs), note: "patients in observation", tone: "steady" },
            ],
    statusMix: [
      { label: "ED", value: assignedPatients.filter((item) => item.patient.status === "ed").length, color: "var(--navy)" },
      { label: "Observation", value: assignedPatients.filter((item) => item.patient.status === "obs").length, color: "var(--amber-emerg)" },
      { label: "Discharged", value: assignedPatients.filter((item) => item.patient.status === "discharged").length, color: "var(--coral)" },
    ],
    pathwayMix,
    attentionList,
  };
}

function buildVitalsTimeline(patient: Patient, seed: number): VitalsPoint[] {
  const baseSbp = patient.triage === 1 ? 154 : patient.triage === 2 ? 138 : 124;
  const baseDbp = patient.triage === 1 ? 94 : patient.triage === 2 ? 84 : 78;
  const baseHr = patient.triage === 1 ? 116 : patient.triage === 2 ? 98 : 86;
  const baseSpo2 = patient.pathway.toLowerCase().includes("respiratory") ? 90 : patient.triage === 1 ? 93 : 97;
  const points = ["Arrival", "15 min", "45 min", "Now"];

  return points.map((label, index) => {
    const sbp = baseSbp - index * (patient.triage === 1 ? 4 : 2) + (seed % 3);
    const dbp = baseDbp - index + (seed % 2);
    const hr = baseHr - index * 4 + (seed % 4);
    const rr = (patient.triage === 1 ? 26 : patient.triage === 2 ? 22 : 18) - Math.min(index, 2);
    const temp = Number((37.9 - index * 0.2 + (seed % 3) * 0.1).toFixed(1));
    const spo2 = baseSpo2 + Math.min(index, 2);
    const glucose = 114 + (seed % 50) - index * 3;
    const gcs = patient.triage === 1 && index === 0 ? 13 : 15;
    const pain = Math.max(2, patient.triage === 1 ? 8 - index : patient.triage === 2 ? 6 - index : 4 - Math.floor(index / 2));
    return { at: label, sbp, dbp, hr, rr, temp, spo2, glucose, gcs, pain, mews: computeMews({ sbp, hr, rr, temp, spo2, gcs }) };
  });
}

function buildComplaints(patient: Patient, pathwayKind: string, seed: number) {
  const genericHistory = ["Hypertension", "Type 2 Diabetes", "No known CAD", "Asthma", "CKD stage 2"];
  const history = pathwayKind === "cardiac" ? ["Hypertension", "Dyslipidaemia"] : pathwayKind === "stroke" ? ["Hypertension", "Previous TIA"] : [genericHistory[seed % genericHistory.length]];
  const meds = pathwayKind === "cardiac" ? ["Amlodipine 5 mg OD", "Metformin 500 mg BD"] : pathwayKind === "stroke" ? ["Telmisartan 40 mg OD", "Ecosprin 75 mg OD"] : ["Paracetamol as needed"];
  const allergies = seed % 3 === 0 ? ["Penicillin"] : seed % 5 === 0 ? ["Peanut allergy"] : [];
  const complaintMap: Record<string, { chief: string; words: string; hpi: string; social: string }> = {
    cardiac: {
      chief: "Chest discomfort",
      words: "Heaviness in the chest since morning with sweating and mild shortness of breath.",
      hpi: "Acute retrosternal chest discomfort radiating to the left arm, associated with diaphoresis. No syncope. Pain began at rest and persisted for more than 30 minutes.",
      social: "Works as a shop owner. Smokes occasionally. No alcohol dependence reported.",
    },
    stroke: {
      chief: "Sudden weakness",
      words: "Sudden right-sided weakness and slurring of speech since morning.",
      hpi: "Acute focal neurological deficit with facial droop and speech disturbance. Last known well documented by attendant. No seizure reported.",
      social: "Retired teacher. Non-smoker. Lives with spouse.",
    },
    trauma: {
      chief: "Road traffic injury",
      words: "Pain in the leg and chest after a bike skid, unable to bear weight.",
      hpi: "Blunt trauma following road traffic incident with suspected extremity injury and chest wall tenderness. No loss of consciousness reported.",
      social: "Daily wage worker. Tobacco chewing history present.",
    },
    respiratory: {
      chief: "Shortness of breath",
      words: "Breathlessness since last night with cough and low oxygen.",
      hpi: "Progressive breathlessness with cough and hypoxia requiring supplemental oxygen. No hemoptysis. Fever reported at home.",
      social: "Lives in a crowded household. No smoking currently.",
    },
    sepsis: {
      chief: "Fever with weakness",
      words: "High fever, weakness, and confusion since yesterday.",
      hpi: "Febrile illness with tachycardia and hypotension concerning for systemic infection. Sepsis bundle initiated.",
      social: "Dependent on family for care. No substance use history.",
    },
    snakebite: {
      chief: "Snake bite",
      words: "Snake bit my foot about an hour ago and now I feel weakness.",
      hpi: "Poisonous snakebite with progressive local swelling and concern for neurotoxic features. Bite time and first aid documented.",
      social: "Field worker. Exposure occurred while farming.",
    },
    poisoning: {
      chief: "Poison ingestion",
      words: "Consumed tablets and now feeling drowsy and vomiting.",
      hpi: "Reported ingestion with vomiting and drowsiness. Airway and toxicology review prioritized.",
      social: "Lives with family. Psychosocial review advised.",
    },
    default: {
      chief: patient.pathway.replace(" Protocol", "").replace(" Bundle", ""),
      words: "Fever, weakness, and general discomfort brought the patient to the ER.",
      hpi: "General ER presentation requiring further work-up and serial assessment.",
      social: "No high-risk social history documented.",
    },
  };
  const entry = complaintMap[pathwayKind] ?? complaintMap.default;

  return {
    chiefComplaint: entry.chief,
    patientWords: entry.words,
    hpi: entry.hpi,
    pastHistory: history,
    currentMedications: meds,
    surgicalHistory: patient.age > 50 ? "No major surgery documented. Previous minor procedure reported." : "No significant surgical history recorded.",
    allergies,
    immunization: pathwayKind === "trauma" || pathwayKind === "snakebite" ? "Tetanus status pending confirmation" : "Not clinically relevant for this encounter",
    socialHistory: entry.social,
  };
}

function buildInvestigations(pathwayKind: string, seed: number): InvestigationItem[] {
  const common: InvestigationItem[] = [
    { name: "CBC", plainLabel: "Blood count", status: "Reviewed", value: `WBC ${(7.8 + (seed % 8) / 10).toFixed(1)} K/uL`, range: "4.0 - 11.0", abnormal: seed % 4 === 0, tat: "24 min", note: "Basic hematology panel completed." },
    { name: "RFT", plainLabel: "Kidney function blood test", status: "Ready", value: `Creatinine ${(0.9 + (seed % 5) / 10).toFixed(1)} mg/dL`, range: "0.6 - 1.3", abnormal: seed % 6 === 0, tat: "32 min", note: "Useful for medication planning." },
  ];
  const pathwaySpecific: Record<string, InvestigationItem[]> = {
    cardiac: [
      { name: "Troponin I", plainLabel: "Heart injury blood test", status: "Pending", value: "Awaited", range: "< 0.04", abnormal: false, tat: "38 min", note: "Repeat sample due if clinically indicated." },
      { name: "ECG", plainLabel: "Heart tracing", status: "Reviewed", value: "ST changes in anterior leads", range: "Normal sinus rhythm", abnormal: true, tat: "8 min", note: "Reviewed by ER physician." },
    ],
    stroke: [
      { name: "CT Brain", plainLabel: "Brain scan", status: "Ready", value: "No bleed seen", range: "No acute bleed", abnormal: false, tat: "29 min", note: "Radiology report available for review." },
      { name: "Blood Sugar", plainLabel: "Blood glucose", status: "Reviewed", value: "146 mg/dL", range: "70 - 140", abnormal: true, tat: "9 min", note: "Point-of-care result." },
    ],
    trauma: [
      { name: "X-Ray Limb", plainLabel: "Injury X-ray", status: "Pending", value: "Awaited", range: "No fracture", abnormal: false, tat: "41 min", note: "Transport to imaging in progress." },
      { name: "FAST", plainLabel: "Internal bleeding scan", status: "Reviewed", value: "Negative", range: "Negative", abnormal: false, tat: "6 min", note: "Done bedside in trauma bay." },
    ],
    respiratory: [
      { name: "ABG", plainLabel: "Arterial blood gas", status: "Ready", value: "pO₂ 58 mmHg", range: "80 - 100", abnormal: true, tat: "16 min", note: "Hypoxia consistent with respiratory compromise." },
      { name: "Chest X-Ray", plainLabel: "Chest X-ray", status: "Pending", value: "Awaited", range: "No infiltrate", abnormal: false, tat: "36 min", note: "Imaging queue active." },
    ],
    sepsis: [
      { name: "Lactate", plainLabel: "Sepsis blood test", status: "Reviewed", value: "3.2 mmol/L", range: "0.5 - 2.0", abnormal: true, tat: "15 min", note: "Supports sepsis bundle escalation." },
      { name: "Blood Culture", plainLabel: "Infection culture", status: "Pending", value: "Incubating", range: "No growth", abnormal: false, tat: "45 min", note: "Sample sent before antibiotics." },
    ],
    snakebite: [
      { name: "20WBCT", plainLabel: "Clotting bedside test", status: "Reviewed", value: "Prolonged", range: "Normal clotting", abnormal: true, tat: "20 min", note: "Suggests haemotoxic involvement." },
      { name: "Coagulation Profile", plainLabel: "Clotting blood tests", status: "Pending", value: "Awaited", range: "Within range", abnormal: false, tat: "39 min", note: "Needed before repeat ASV decision." },
    ],
    poisoning: [
      { name: "Toxicology Screen", plainLabel: "Poison screen", status: "Pending", value: "Awaited", range: "Negative", abnormal: false, tat: "48 min", note: "Poison identification in progress." },
      { name: "ECG", plainLabel: "Heart tracing", status: "Reviewed", value: "QT mildly prolonged", range: "Normal QT", abnormal: true, tat: "7 min", note: "Repeat tracing advised." },
    ],
    default: [
      { name: "Chest X-Ray", plainLabel: "X-ray", status: "Ready", value: "No acute finding", range: "Normal", abnormal: false, tat: "26 min", note: "Preliminary report ready." },
    ],
  };

  return [...common, ...(pathwaySpecific[pathwayKind] ?? pathwaySpecific.default)];
}

function buildMedications(pathwayKind: string, seed: number): MedicationItem[] {
  const common = [
    { name: "Normal Saline", dose: "500 mL", route: "IV", at: "11:05", purpose: "Fluid support", nextDue: "Running now" },
  ];

  const specific: Record<string, MedicationItem[]> = {
    cardiac: [
      { name: "Aspirin", dose: "325 mg", route: "PO", at: "10:58", purpose: "Antiplatelet loading", nextDue: "Not scheduled", protocolNote: "ACS bundle", overdue: false },
      { name: "Atorvastatin", dose: "80 mg", route: "PO", at: "11:00", purpose: "High-intensity statin", nextDue: "Tonight 22:00", protocolNote: "ACS bundle", overdue: false },
    ],
    stroke: [
      { name: "Labetalol", dose: "10 mg", route: "IV", at: "10:46", purpose: "BP control", nextDue: "Review before repeat", protocolNote: "Stroke BP protocol", overdue: false },
      { name: "Aspirin", dose: "150 mg", route: "PO", at: "11:18", purpose: "Antiplatelet therapy", nextDue: "Tomorrow 08:00", protocolNote: "Post-imaging plan", overdue: false },
    ],
    trauma: [
      { name: "Paracetamol", dose: "1 g", route: "IV", at: "11:12", purpose: "Pain relief", nextDue: "17:12", overdue: false },
      { name: "TT", dose: "0.5 mL", route: "IM", at: "11:20", purpose: "Tetanus prophylaxis", nextDue: "Single dose", overdue: false },
    ],
    respiratory: [
      { name: "Nebulisation", dose: "Salbutamol + Ipratropium", route: "Neb", at: "12:12", purpose: "Relieve bronchospasm", nextDue: "13:00", overdue: true },
      { name: "Oxygen", dose: "4 L/min", route: "NC", at: "12:08", purpose: "Support oxygenation", nextDue: "Continuous", overdue: false },
    ],
    sepsis: [
      { name: "Piperacillin-Tazobactam", dose: "4.5 g", route: "IV", at: "08:52", purpose: "Broad-spectrum antibiotic", nextDue: "14:52", overdue: false },
      { name: "Noradrenaline", dose: "0.08 mcg/kg/min", route: "IV", at: "09:10", purpose: "Maintain perfusion", nextDue: "Continuous", overdue: false },
    ],
    snakebite: [
      { name: "ASV", dose: "10 vials", route: "IV", at: "10:15", purpose: "Antivenom therapy", nextDue: "Reassess after clotting test", protocolNote: "Snake bite protocol", overdue: false },
      { name: "Hydrocortisone", dose: "100 mg", route: "IV", at: "10:14", purpose: "Premedication / reaction cover", nextDue: "PRN", overdue: false },
    ],
    poisoning: [
      { name: "Activated Charcoal", dose: "50 g", route: "PO / NG", at: "10:24", purpose: "Reduce toxin absorption", nextDue: "Single dose", overdue: false },
      { name: "Ondansetron", dose: "4 mg", route: "IV", at: "10:26", purpose: "Control vomiting", nextDue: "16:26", overdue: false },
    ],
    default: [
      { name: "Paracetamol", dose: "650 mg", route: "PO", at: "11:08", purpose: "Symptom relief", nextDue: "17:08", overdue: false },
    ],
  };

  return [...specific[pathwayKind] ?? specific.default, ...common].map((item, index) => ({
    ...item,
    overdue: item.overdue ?? (seed + index) % 5 === 0,
  }));
}

function buildChecklist(pathwayKind: string, investigations: InvestigationItem[], medications: MedicationItem[]): ProtocolChecklistItem[] {
  const has = (name: string) => investigations.some((item) => item.name.includes(name)) || medications.some((item) => item.name.includes(name));
  const templates: Record<string, ProtocolChecklistItem[]> = {
    cardiac: [
      { label: "ECG within 10 minutes", complete: has("ECG"), detail: "Initial ECG captured and reviewed." },
      { label: "Troponin ordered", complete: has("Troponin"), detail: "Serial markers pending / underway." },
      { label: "Aspirin administered", complete: has("Aspirin"), detail: "Loading dose documented." },
    ],
    stroke: [
      { label: "Door-to-CT documented", complete: has("CT Brain"), detail: "Imaging initiated for stroke exclusion." },
      { label: "NIHSS recorded", complete: true, detail: "Neurology assessment captured." },
      { label: "Thrombolysis eligibility reviewed", complete: true, detail: "Decision support note pending final sign-off." },
    ],
    snakebite: [
      { label: "Bite time documented", complete: true, detail: "History entered by ER team." },
      { label: "20WBCT completed", complete: has("20WBCT"), detail: "Clotting bedside test logged." },
      { label: "ASV administered", complete: has("ASV"), detail: "Antivenom order and administration captured." },
    ],
    poisoning: [
      { label: "Poison identified", complete: false, detail: "Toxicology screening still pending." },
      { label: "Antidote / decontamination started", complete: has("Activated Charcoal"), detail: "Immediate poisoning management initiated." },
      { label: "Toxicology consulted", complete: true, detail: "Specialist review requested." },
    ],
    default: [
      { label: "Primary assessment completed", complete: true, detail: "Arrival and triage details documented." },
      { label: "Investigations ordered", complete: investigations.length > 0, detail: "Diagnostic work-up underway." },
      { label: "Treatment plan activated", complete: medications.length > 0, detail: "Current interventions logged." },
    ],
  };

  return templates[pathwayKind] ?? templates.default;
}

function buildNurseTasks(patient: Patient, pathwayKind: string, latestVitals: VitalsPoint): NurseTask[] {
  const base: NurseTask[] = [
    {
      title: "Repeat vitals",
      due: patient.triage === 1 ? "8 min" : patient.triage === 2 ? "18 min" : "28 min",
      status: patient.triage === 1 ? "Due now" : "Due soon",
      details: `Last BP ${latestVitals.sbp}/${latestVitals.dbp}, SpO₂ ${latestVitals.spo2}%`,
      actionLabel: "Record vitals",
    },
    {
      title: "IV line and fluid check",
      due: "15 min",
      status: "Due soon",
      details: "Confirm patency, rate, and remaining volume.",
      actionLabel: "Update IV status",
    },
  ];

  if (pathwayKind === "respiratory") {
    base.unshift({
      title: "Repeat nebulisation",
      due: "Now",
      status: "Due now",
      details: "Bronchodilator dose due based on current respiratory status.",
      actionLabel: "Mark as given",
    });
  }

  if (pathwayKind === "trauma") {
    base.push({
      title: "Wound / dressing care",
      due: "35 min",
      status: "Due soon",
      details: "Check dressing soakage and distal perfusion.",
      actionLabel: "Document wound care",
    });
  }

  return base;
}

function buildJourney(patient: Patient, investigations: InvestigationItem[]): JourneyStep[] {
  const allReady = investigations.every((item) => item.status !== "Pending");
  const discharged = patient.status === "discharged";
  return [
    { label: "Registered", done: true },
    { label: "Triaged", done: patient.triage !== 0 },
    { label: "Seen by Doctor", done: patient.physician !== "-" },
    { label: "Tests in Progress", done: true, active: !allReady, eta: allReady ? undefined : "30 min" },
    { label: "Results Review", done: allReady, active: allReady && !discharged },
    { label: "Treatment", done: true, active: !discharged && patient.status !== "obs" },
    { label: "Disposition Decision", done: discharged, active: !discharged },
  ];
}

function buildDisposition(patient: Patient, pathwayKind: string) {
  if (patient.status === "discharged") {
    return {
      current: "For discharge",
      location: "Home with follow-up",
      estimated: "Within 45 min",
      followUp: pathwayKind === "cardiac" ? "Cardiology OP review in 48 hours" : "Review in ER / OPD in 2-3 days",
    };
  }
  if (patient.status === "obs") {
    return {
      current: "Under observation",
      location: patient.bed,
      estimated: "Reassess in 2 hours",
    };
  }
  return {
    current: patient.triage === 1 ? "For admission" : "Under active treatment",
    location: patient.bed,
    reason: pathwayKind === "trauma" ? "Possible surgical / ortho admission" : "ER stabilization and result review ongoing",
    estimated: patient.triage === 1 ? "Likely within 60 min" : "Likely within 2-3 hours",
  };
}

function buildInitialNote(patient: Patient, patientWords: string) {
  return `${patient.name} arrived via ${patient.bed.startsWith("TR-") ? "trauma bay transfer" : "ER intake"} with ${patientWords.toLowerCase()}. Initial examination prioritised based on triage ${patient.triage === 0 ? "pending" : patient.triage}.`;
}

function getPathwayKind(pathway: string) {
  const lower = pathway.toLowerCase();
  if (lower.includes("stemi") || lower.includes("chest")) return "cardiac";
  if (lower.includes("stroke")) return "stroke";
  if (lower.includes("snake")) return "snakebite";
  if (lower.includes("poison")) return "poisoning";
  if (lower.includes("respiratory")) return "respiratory";
  if (lower.includes("sepsis")) return "sepsis";
  if (lower.includes("trauma")) return "trauma";
  return "default";
}

function workingDiagnosisFor(kind: string) {
  return (
    {
      cardiac: "Acute coronary syndrome / STEMI under active pathway management",
      stroke: "Acute cerebrovascular event under stroke pathway",
      snakebite: "Suspected venomous snake bite with protocol-based monitoring",
      poisoning: "Toxic ingestion requiring decontamination and toxicology input",
      respiratory: "Hypoxic respiratory distress, likely infective / reactive airway component",
      sepsis: "Sepsis with early organ dysfunction concern",
      trauma: "Polytrauma / blunt injury requiring serial reassessment",
      default: "Acute undifferentiated ER presentation under structured work-up",
    } satisfies Record<string, string>
  )[kind];
}

function differentialsFor(kind: string) {
  return (
    {
      cardiac: ["Unstable angina", "Aortic syndrome", "Severe gastritis / reflux"],
      stroke: ["Hypoglycaemia mimic", "Seizure with post-ictal weakness", "Intracranial bleed"],
      snakebite: ["Non-venomous bite", "Local cellulitis", "Coagulopathy"],
      poisoning: ["Mixed drug overdose", "Alcohol co-ingestion", "Metabolic encephalopathy"],
      respiratory: ["Pneumonia", "Acute asthma / COPD exacerbation", "Pulmonary oedema"],
      sepsis: ["Urinary sepsis", "Pneumonia", "Abdominal source"],
      trauma: ["Fracture", "Internal bleeding", "Head injury"],
      default: ["Viral syndrome", "Pain crisis", "Need for further ER observation"],
    } satisfies Record<string, string[]>
  )[kind];
}

function carePlanFor(kind: string) {
  return (
    {
      cardiac: "Continue ACS bundle, serial ECG/troponin review, haemodynamic monitoring, and cardiology input.",
      stroke: "Maintain stroke pathway timings, BP monitoring, imaging review, and neurology escalation.",
      snakebite: "Repeat clotting surveillance, monitor for neurotoxicity, and reassess ASV requirement.",
      poisoning: "Airway vigilance, toxicology review, serial ECG / observation, and supportive care.",
      respiratory: "Oxygen titration, bronchodilator / antibiotic pathway, and reassess escalation need.",
      sepsis: "Continue bundle care with fluids, antibiotics, lactate follow-up, and source control planning.",
      trauma: "Analgesia, imaging completion, wound / fracture management, and disposition planning.",
      default: "Continue observation, serial assessment, and review investigations before final disposition.",
    } satisfies Record<string, string>
  )[kind];
}

function consultsFor(kind: string) {
  return (
    {
      cardiac: [{ specialty: "Cardiology", requestedAt: "11:04", response: "Acknowledged - cath lab decision pending repeat review" }],
      stroke: [{ specialty: "Neurology", requestedAt: "10:36", response: "Seen - NIHSS documented, stroke plan active" }],
      trauma: [{ specialty: "Orthopaedics", requestedAt: "11:25", response: "Awaiting imaging before final call" }],
      respiratory: [{ specialty: "Pulmonology", requestedAt: "12:22", response: "Phone review completed, continue current support" }],
      sepsis: [{ specialty: "Medicine / ICU", requestedAt: "08:58", response: "ICU aware, admission likely if no improvement" }],
      snakebite: [{ specialty: "Medicine", requestedAt: "10:22", response: "Continue ASV monitoring and coagulation review" }],
      poisoning: [{ specialty: "Toxicology", requestedAt: "10:30", response: "Await poison identification, supportive care advised" }],
      default: [{ specialty: "General Medicine", requestedAt: "11:12", response: "Review after pending results" }],
    } satisfies Record<string, { specialty: string; requestedAt: string; response: string }[]>
  )[kind];
}

function buildPatientInstructions(kind: string) {
  const base = ["Please stay in your assigned area unless a nurse tells you otherwise.", "If you feel worse, tell the nurse immediately or use the call bell."];
  if (kind === "cardiac" || kind === "stroke") {
    return ["Do not eat or drink until the doctor confirms it is safe.", ...base];
  }
  if (kind === "trauma") {
    return ["Do not put weight on the injured area until review is complete.", ...base];
  }
  return base;
}

function dischargeSummaryFor(kind: string) {
  return (
    {
      cardiac: "You were treated for a heart-related emergency and need close follow-up.",
      stroke: "You were assessed for stroke symptoms and need ongoing neurological follow-up.",
      trauma: "You were treated for an injury and should protect the affected area.",
      respiratory: "You were treated for breathing difficulty and should follow inhaler / medicine advice carefully.",
      default: "Your ER visit is being completed with treatment advice and follow-up instructions.",
    } satisfies Record<string, string>
  )[kind] ?? "Your ER visit summary will be explained before discharge.";
}

function warningSignsFor(kind: string) {
  return (
    {
      cardiac: ["New chest pain", "Fainting", "Severe shortness of breath"],
      stroke: ["New weakness", "Speech difficulty", "Confusion or seizure"],
      trauma: ["Bleeding", "Worsening pain / swelling", "Breathing difficulty"],
      respiratory: ["Breathing gets harder", "Blue lips / fingers", "Unable to speak full sentences"],
      default: ["Persistent fever", "Worsening pain", "Any sudden deterioration"],
    } satisfies Record<string, string[]>
  )[kind] ?? ["Any sudden worsening", "Persistent symptoms", "New severe pain"];
}

function computeMews({
  sbp,
  hr,
  rr,
  temp,
  spo2,
  gcs,
}: {
  sbp: number;
  hr: number;
  rr: number;
  temp: number;
  spo2: number;
  gcs: number;
}) {
  let score = 0;
  if (sbp <= 90 || sbp >= 180) score += 2;
  else if (sbp <= 100 || sbp >= 160) score += 1;
  if (hr >= 130 || hr <= 40) score += 3;
  else if (hr >= 111 || hr <= 50) score += 2;
  else if (hr >= 101) score += 1;
  if (rr >= 30 || rr <= 8) score += 3;
  else if (rr >= 21) score += 2;
  if (temp >= 38.5 || temp <= 35) score += 2;
  else if (temp >= 38) score += 1;
  if (spo2 <= 91) score += 3;
  else if (spo2 <= 93) score += 2;
  else if (spo2 <= 95) score += 1;
  if (gcs < 15) score += 2;
  return score;
}

function seedFrom(value: string) {
  return Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function formatElapsed(label: string) {
  const now = new Date();
  const timeOnly = label.match(/^(\d{1,2}):(\d{2})$/);
  if (timeOnly) {
    const date = new Date(now);
    date.setHours(Number(timeOnly[1]), Number(timeOnly[2]), 0, 0);
    if (date > now) date.setDate(date.getDate() - 1);
    return humanizeDuration(now.getTime() - date.getTime());
  }
  const yesterday = label.match(/^Yesterday (\d{1,2}):(\d{2})$/i);
  if (yesterday) {
    const date = new Date(now);
    date.setDate(date.getDate() - 1);
    date.setHours(Number(yesterday[1]), Number(yesterday[2]), 0, 0);
    return humanizeDuration(now.getTime() - date.getTime());
  }
  const daysAgo = label.match(/^(\d+) days ago$/i);
  if (daysAgo) {
    return `${daysAgo[1]}d`;
  }
  return label;
}

function humanizeDuration(ms: number) {
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function defaultOverviewTabFor(role: Role): "doctor" | "nurse" | "patient" {
  if (role === "nurse") return "nurse";
  if (role === "doctor" || role === "admin") return "doctor";
  return "patient";
}
