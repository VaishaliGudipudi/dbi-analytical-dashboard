import type {
  Diagnosis,
  EdSnapshot,
  OutcomeDraft,
  Patient,
  PatientWorkspaceDraft,
  Ward,
} from "./edTypes";

const wardCapacity: Record<string, number> = {
  Emergency: 20,
  Observation: 12,
  ICU: 10,
  "Trauma Bay": 6,
  "Pediatric ED": 8,
};

const patientsTable: Patient[] = [
  { id: "p1", name: "Rajesh Kumar", age: 54, sex: "M", umr: "UMR-2014", triage: 1, bed: "ER-04", checkIn: "10:42", physician: "Dr. Tejaswi", pathway: "STEMI Protocol", department: "Cardiac", status: "ed" },
  { id: "p2", name: "Priya Sharma", age: 31, sex: "F", umr: "UMR-2015", triage: 1, bed: "ER-02", checkIn: "10:51", physician: "Dr. Mehta", pathway: "Snake Bite Protocol", department: "Toxicology", status: "ed" },
  { id: "p3", name: "Anil Verma", age: 67, sex: "M", umr: "UMR-2016", triage: 2, bed: "OBS-01", checkIn: "09:18", physician: "Dr. Tejaswi", pathway: "Stroke Protocol", department: "Neurology", status: "obs" },
  { id: "p4", name: "Lakshmi Iyer", age: 22, sex: "F", umr: "UMR-2017", triage: 2, bed: "TR-01", checkIn: "11:02", physician: "Dr. Khan", pathway: "Trauma Protocol", department: "Trauma", status: "ed" },
  { id: "p5", name: "Sanjay Rao", age: 45, sex: "M", umr: "UMR-2018", triage: 3, bed: "ER-11", checkIn: "11:30", physician: "Dr. Khan", pathway: "General Assessment", department: "General", status: "ed" },
  { id: "p6", name: "Unknown Male", age: 0, sex: "M", umr: "UMR-2019", triage: 0, bed: "-", checkIn: "11:46", physician: "-", pathway: "Pending Clinical Assessment", department: "-", status: "ed" },
  { id: "p7", name: "Meera Joshi", age: 62, sex: "F", umr: "UMR-2020", triage: 2, bed: "ICU-03", checkIn: "08:35", physician: "Dr. Mehta", pathway: "Sepsis Bundle", department: "Medicine", status: "ed" },
  { id: "p8", name: "Vikram Singh", age: 38, sex: "M", umr: "UMR-2021", triage: 1, bed: "TR-03", checkIn: "07:55", physician: "Dr. Khan", pathway: "Trauma Protocol", department: "Trauma", status: "ed" },
  { id: "p9", name: "Fatima Begum", age: 28, sex: "F", umr: "UMR-2022", triage: 2, bed: "ER-08", checkIn: "12:05", physician: "Dr. Iyer", pathway: "Respiratory Protocol", department: "Pulmonology", status: "ed" },
  { id: "p10", name: "Arjun Nair", age: 9, sex: "M", umr: "UMR-2023", triage: 3, bed: "PED-02", checkIn: "12:18", physician: "Dr. Iyer", pathway: "Pediatric Assessment", department: "Pediatric", status: "ed" },
  { id: "p11", name: "Neha Reddy", age: 34, sex: "F", umr: "UMR-2024", triage: 2, bed: "OBS-04", checkIn: "Yesterday 18:20", physician: "Dr. Tejaswi", pathway: "Observation", department: "General", status: "obs" },
  { id: "p12", name: "Rafiq Ahmed", age: 57, sex: "M", umr: "UMR-2025", triage: 1, bed: "-", checkIn: "Yesterday 14:10", physician: "Dr. Mehta", pathway: "Anaphylaxis Protocol", department: "Emergency", status: "discharged" },
  { id: "p13", name: "Kavya Menon", age: 41, sex: "F", umr: "UMR-2026", triage: 3, bed: "-", checkIn: "2 days ago", physician: "Dr. Khan", pathway: "General Assessment", department: "General", status: "discharged" },
];

const diagnosisTable: Diagnosis[] = [
  { id: "snake", label: "Snake Bite", icon: "Snake", severity: 1, pathway: "Snake Bite Protocol", ward: "Emergency" },
  { id: "stemi", label: "Cardiac / STEMI", icon: "Heart", severity: 1, pathway: "STEMI Protocol", ward: "ICU" },
  { id: "stroke", label: "Stroke", icon: "Brain", severity: 1, pathway: "Stroke Protocol", ward: "ICU" },
  { id: "trauma", label: "Trauma", icon: "Trauma", severity: 1, pathway: "Trauma Protocol", ward: "Trauma Bay" },
  { id: "poison", label: "Poisoning", icon: "Toxicology", severity: 1, pathway: "Toxicology Protocol", ward: "Emergency" },
  { id: "anaph", label: "Anaphylaxis", icon: "Injection", severity: 1, pathway: "Anaphylaxis Protocol", ward: "Emergency" },
  { id: "sepsis", label: "Sepsis", icon: "Infection", severity: 2, pathway: "Sepsis Bundle", ward: "ICU" },
  { id: "resp", label: "Respiratory", icon: "Lungs", severity: 2, pathway: "Respiratory Protocol", ward: "Emergency" },
  { id: "other", label: "Other", icon: "General", severity: 3, pathway: "General Assessment", ward: "Observation" },
];

type PersistedEdDatabase = {
  patients: Patient[];
  diagnoses: Diagnosis[];
  workspaceDrafts: Record<string, PatientWorkspaceDraft>;
};

const defaultOutcomeDraft = (): OutcomeDraft => ({
  shiftedTo: "Discharge",
  patientStatus: "Alive",
  provisionalDiagnosis: "",
  course:
    "The patient's provisional diagnosis was x. Documented comorbidities included none. The patient's last documented feed time was 2026-05-21 at 00:00. Personal history included smoking.",
  carePlan: "",
  summary: "",
});

function createEmptyWorkspaceDraft(): PatientWorkspaceDraft {
  return {
    formValues: {},
    chiefComplaint: "",
    vitals: {
      sbp: "",
      dbp: "",
      hr: "",
      rr: "",
      spo2: "",
      temp: "",
      grbs: "",
    },
    orderedItems: [],
    pathwayOverride: null,
    outcome: defaultOutcomeDraft(),
  };
}

function cloneWorkspaceDraft(draft?: Partial<PatientWorkspaceDraft> | null): PatientWorkspaceDraft {
  const empty = createEmptyWorkspaceDraft();
  return {
    formValues: { ...empty.formValues, ...(draft?.formValues ?? {}) },
    chiefComplaint: draft?.chiefComplaint ?? empty.chiefComplaint,
    vitals: { ...empty.vitals, ...(draft?.vitals ?? {}) },
    orderedItems: (draft?.orderedItems ?? empty.orderedItems).map((item) => ({ ...item })),
    pathwayOverride: draft?.pathwayOverride ?? empty.pathwayOverride,
    outcome: { ...empty.outcome, ...(draft?.outcome ?? {}) },
  };
}

function createSeedDatabase(): PersistedEdDatabase {
  return {
    patients: patientsTable.map((patient) => ({ ...patient })),
    diagnoses: diagnosisTable.map((diagnosis) => ({ ...diagnosis })),
    workspaceDrafts: {},
  };
}

// In-memory store. The serverless runtime has no writable filesystem,
// so drafts live in module scope for the lifetime of the isolate.
let memoryDb: PersistedEdDatabase | null = null;

async function readDatabase(): Promise<PersistedEdDatabase> {
  if (!memoryDb) memoryDb = createSeedDatabase();
  return memoryDb;
}

async function writeDatabase(database: PersistedEdDatabase) {
  memoryDb = database;
}

function wardForPatient(patient: Patient) {
  if (patient.status === "discharged" || patient.bed === "-") return null;
  if (patient.bed.startsWith("OBS-")) return "Observation";
  if (patient.bed.startsWith("ICU-")) return "ICU";
  if (patient.bed.startsWith("TR-")) return "Trauma Bay";
  if (patient.bed.startsWith("PED-")) return "Pediatric ED";
  return "Emergency";
}

function getWardSnapshot(patients: Patient[]): Ward[] {
  return Object.entries(wardCapacity).map(([name, total]) => ({
    name,
    total,
    occupied: patients.filter((patient) => wardForPatient(patient) === name).length,
  }));
}

export async function getEdSnapshotFromDb(): Promise<EdSnapshot> {
  const database = await readDatabase();
  return {
    patients: database.patients.map((patient) => ({ ...patient })),
    wards: getWardSnapshot(database.patients),
    diagnoses: database.diagnoses.map((diagnosis) => ({ ...diagnosis })),
  };
}

export async function getPatientWorkspaceDraftFromDb(patientId: string): Promise<PatientWorkspaceDraft> {
  const database = await readDatabase();
  return cloneWorkspaceDraft(database.workspaceDrafts[patientId]);
}

export async function savePatientWorkspaceDraftToDb(
  patientId: string,
  draftPatch: Partial<PatientWorkspaceDraft>,
): Promise<PatientWorkspaceDraft> {
  const database = await readDatabase();
  const current = cloneWorkspaceDraft(database.workspaceDrafts[patientId]);
  const merged = cloneWorkspaceDraft({
    ...current,
    ...draftPatch,
    formValues: { ...current.formValues, ...(draftPatch.formValues ?? {}) },
    vitals: { ...current.vitals, ...(draftPatch.vitals ?? {}) },
    orderedItems: draftPatch.orderedItems ?? current.orderedItems,
    outcome: { ...current.outcome, ...(draftPatch.outcome ?? {}) },
  });

  database.workspaceDrafts[patientId] = merged;
  await writeDatabase(database);
  return cloneWorkspaceDraft(merged);
}

export async function getPatientFromDb(id: string) {
  const database = await readDatabase();
  return database.patients.find((patient) => patient.id === id) ?? null;
}
