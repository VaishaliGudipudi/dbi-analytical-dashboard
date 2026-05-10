export type Triage = 1 | 2 | 3 | 0; // 0 = not triaged
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

export const patients: Patient[] = [
  { id: "p1", name: "Rajesh Kumar", age: 54, sex: "M", umr: "UMR-2014", triage: 1, bed: "ER-04", checkIn: "10:42", physician: "Dr. Tejaswi", pathway: "STEMI Protocol", department: "Cardiac", status: "ed" },
  { id: "p2", name: "Priya Sharma", age: 31, sex: "F", umr: "UMR-2015", triage: 1, bed: "ER-02", checkIn: "10:51", physician: "Dr. Mehta", pathway: "Antivenom", department: "Toxicology", status: "ed" },
  { id: "p3", name: "Anil Verma", age: 67, sex: "M", umr: "UMR-2016", triage: 2, bed: "OBS-01", checkIn: "09:18", physician: "Dr. Tejaswi", pathway: "Stroke Protocol", department: "Neurology", status: "obs" },
  { id: "p4", name: "Lakshmi Iyer", age: 22, sex: "F", umr: "UMR-2017", triage: 2, bed: "ER-07", checkIn: "11:02", physician: "Dr. Khan", pathway: "Trauma", department: "Trauma", status: "ed" },
  { id: "p5", name: "Sanjay Rao", age: 45, sex: "M", umr: "UMR-2018", triage: 3, bed: "ER-11", checkIn: "11:30", physician: "Dr. Khan", pathway: "Observation", department: "General", status: "ed" },
  { id: "p6", name: "Unknown", age: 0, sex: "M", umr: "UMR-2019", triage: 0, bed: "—", checkIn: "11:46", physician: "—", pathway: "Pending", department: "—", status: "ed" },
];

export const wards = [
  { name: "Emergency", total: 20, occupied: 19 },
  { name: "Observation", total: 12, occupied: 8 },
  { name: "ICU", total: 10, occupied: 9 },
  { name: "Trauma Bay", total: 6, occupied: 3 },
  { name: "Pediatric ED", total: 8, occupied: 4 },
];

export const diagnoses = [
  { id: "snake", label: "Snake Bite", icon: "🐍", severity: 1, pathway: "Antivenom Protocol", ward: "Emergency" },
  { id: "stemi", label: "Cardiac / STEMI", icon: "❤️", severity: 1, pathway: "STEMI Protocol", ward: "ICU" },
  { id: "stroke", label: "Stroke", icon: "🧠", severity: 1, pathway: "Stroke Protocol", ward: "ICU" },
  { id: "trauma", label: "Trauma", icon: "🚨", severity: 1, pathway: "Trauma Protocol", ward: "Trauma Bay" },
  { id: "poison", label: "Poisoning", icon: "☠️", severity: 1, pathway: "Toxicology Protocol", ward: "Emergency" },
  { id: "anaph", label: "Anaphylaxis", icon: "💉", severity: 1, pathway: "Anaphylaxis Protocol", ward: "Emergency" },
  { id: "sepsis", label: "Sepsis", icon: "🦠", severity: 2, pathway: "Sepsis Bundle", ward: "ICU" },
  { id: "resp", label: "Respiratory", icon: "🫁", severity: 2, pathway: "Respiratory Protocol", ward: "Emergency" },
  { id: "other", label: "Other", icon: "➕", severity: 3, pathway: "General Assessment", ward: "Observation" },
];

export const triageMeta: Record<number, { label: string; sub: string; color: string }> = {
  1: { label: "Life Threatening", sub: "Triage Level I", color: "var(--urgent-critical)" },
  2: { label: "Urgent", sub: "Triage Level II", color: "var(--urgent-urgent)" },
  3: { label: "Non Urgent", sub: "Triage Level III", color: "var(--urgent-pending)" },
  0: { label: "Not Triaged", sub: "Pending", color: "var(--muted-foreground)" },
};
