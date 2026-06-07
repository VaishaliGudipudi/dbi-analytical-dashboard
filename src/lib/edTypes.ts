export type Triage = 1 | 2 | 3 | 0;

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: "M" | "F" | "Other";
  umr: string;
  triage: Triage;
  bed: string;
  checkIn: string;
  physician: string;
  pathway: string;
  department: string;
  status: "ed" | "obs" | "discharged";
}

export interface Ward {
  name: string;
  total: number;
  occupied: number;
}

export interface Diagnosis {
  id: string;
  label: string;
  icon: string;
  severity: 1 | 2 | 3;
  pathway: string;
  ward: string;
}

export interface WorkspaceOrderItem {
  category: "investigation" | "medication";
  name: string;
  requirement: string;
  notes: string;
}

export interface NursingStatMedicationEntry {
  id: string;
  dateTime: string;
  drugName: string;
  dose: string;
  route: string;
  frequency: string;
  counterSignByDoctor: string;
  sign1By: string;
  sign1Time: string;
  sign2By: string;
  sign2Time: string;
}

export interface NursingIvFluidEntry {
  id: string;
  fluidName: string;
  serialNumber: string;
  timeStarted: string;
  timeStopped: string;
  signWithName: string;
}

export interface NursingInvestigationEntry {
  id: string;
  investigation: string;
  orderedAt: string;
  status: string;
  resultSummary: string;
}

export interface NursingAssessmentRecord {
  id: string;
  createdAt: string;
  createdBy: string;
  dateTime: string;
  abhaId: string;
  dateOfAdmission: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  arrivalMode: string;
  informedBy: string;
  returnToErWithin72Hours: string;
  broughtBy: string;
  ambulanceOrReferralId: string;
  mlcCase: string;
  policeStation: string;
  mlcNumber: string;
  inwardReferral: string;
  referralFacility: string;
  referralReason: string;
  triageCondition: string;
  triageLevel: string;
  mewsScore: string;
  oxygenMode: string;
  gcsEye: string;
  gcsVerbal: string;
  gcsMotor: string;
  vulnerablePatient: boolean;
  restraints: boolean;
  drugAllergy: boolean;
  fallRisk: boolean;
  bedSore: boolean;
  dvt: boolean;
  yesDetails: string;
  chiefComplaint: string;
  mainComplaintsAndFindings: string;
  pulseRate: string;
  bloodPressure: string;
  temperature: string;
  respiratoryRate: string;
  weightKg: string;
  rbs: string;
  oxygenSaturation: string;
  painScore: string;
  airwayStatus: string;
  airwayNotes: string;
  breathingStatus: string;
  breathingNotes: string;
  circulationStatus: string;
  circulationNotes: string;
  disabilityStatus: string;
  disabilityNotes: string;
  exposureStatus: string;
  exposureNotes: string;
  headAssessment: string;
  neckChestAssessment: string;
  upperLimbsAssessment: string;
  lowerLimbsAssessment: string;
  abdomenAssessment: string;
  backAssessment: string;
  pelvisGenitourinaryAssessment: string;
  skinAssessment: string;
  othersAssessment: string;
  bodyMarkingsFront: string;
  bodyMarkingsBack: string;
  focusedHistorySample: string;
  pastMedicalHistory: string;
  surgicalHistory: string;
  familyHistory: string;
  allergicHistory: string;
  immunizationHistory: string;
  reasonForEmergencyAdmission: string;
  lifestyleHabits: string;
  emotionalState: string;
  physiologicalIndicators: string;
  nutritionalAssessment: string;
  bedSoreGrade: string;
  investigationsChart: NursingInvestigationEntry[];
  statMedications: NursingStatMedicationEntry[];
  intravenousFluids: NursingIvFluidEntry[];
  nurseNotes: string;
  nurseName: string;
  nurseSignature: string;
  signedAt: string;
}

export interface OutcomeDraft {
  shiftedTo: string;
  patientStatus: string;
  provisionalDiagnosis: string;
  course: string;
  carePlan: string;
  summary: string;
}

export interface PatientWorkspaceDraft {
  formValues: Record<string, string>;
  chiefComplaint: string;
  vitals: Record<string, string>;
  orderedItems: WorkspaceOrderItem[];
  nursingAssessments: NursingAssessmentRecord[];
  pathwayOverride: string | null;
  outcome: OutcomeDraft;
}

export interface EdSnapshot {
  patients: Patient[];
  wards: Ward[];
  diagnoses: Diagnosis[];
}

export const triageMeta: Record<Triage, { label: string; sub: string; color: string }> = {
  1: { label: "Life Threatening", sub: "Triage Level I", color: "var(--urgent-critical)" },
  2: { label: "Urgent", sub: "Triage Level II", color: "var(--urgent-urgent)" },
  3: { label: "Non Urgent", sub: "Triage Level III", color: "var(--urgent-pending)" },
  0: { label: "Not Triaged", sub: "Pending", color: "var(--muted-foreground)" },
};
