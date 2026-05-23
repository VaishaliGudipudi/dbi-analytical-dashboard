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
