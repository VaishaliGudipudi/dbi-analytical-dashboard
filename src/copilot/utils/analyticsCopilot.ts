import { buildPatientOverview } from "@/lib/careOverview";
import type { Patient } from "@/lib/edTypes";
import type { AnalyticsBindings, CopilotChartSpec } from "@/copilot/types/copilot";

type AnalyticsPatientRow = {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  triage: string;
  disposition: string;
  arrivalMode: "Ambulance" | "Walk In";
  physician: string;
  pathway: string;
  ageBucket: string;
  medications: string[];
  medicationTerms: string[];
  eventDate: Date;
  monthLabel: string;
};

type FilterDefinition = {
  label: string;
  test: (row: AnalyticsPatientRow) => boolean;
};

const COLORS = {
  navy: "var(--navy)",
  coral: "var(--coral)",
  amber: "var(--amber-emerg)",
  green: "var(--urgent-safe)",
  blue: "#3b82f6",
  red: "var(--urgent-critical)",
  muted: "var(--muted-foreground)",
};

const MEDICATION_ALIASES: Record<string, string[]> = {
  "dolo 650": ["paracetamol 650", "paracetamol"],
  dolo: ["paracetamol"],
  paracetamol: ["paracetamol"],
  aspirin: ["aspirin"],
  ondansetron: ["ondansetron"],
  ceftriaxone: ["ceftriaxone"],
  "normal saline": ["normal saline"],
  insulin: ["insulin"],
  heparin: ["heparin"],
};

export function createAnalyticsCopilotBindings(patients: Patient[]): AnalyticsBindings {
  const rows = patients.map(enrichPatient);

  return {
    promptHint:
      "Ask for any graph, for example: show male patients under 50 who took Dolo 650 in the last three months.",
    buildChart: async (prompt) => buildAnalyticsChart(rows, prompt),
  };
}

function buildAnalyticsChart(
  rows: AnalyticsPatientRow[],
  prompt: string,
): { chart: CopilotChartSpec; responseText: string } {
  const normalized = normalize(prompt);
  const filters = inferFilters(normalized);
  const filteredRows = rows.filter((row) => filters.every((filter) => filter.test(row)));
  const chart = inferChart(filteredRows, normalized);
  const filterSummary = filters.length ? filters.map((filter) => filter.label).join(", ") : "no additional filters";
  const responseText = filteredRows.length
    ? `Built ${chart.title.toLowerCase()} for ${filteredRows.length} matching patients with ${filterSummary}.`
    : `I could not find matching patients for ${filterSummary}, so the chart is empty.`;

  return { chart, responseText };
}

function inferChart(rows: AnalyticsPatientRow[], normalizedPrompt: string): CopilotChartSpec {
  if (looksLikeTimeSeries(normalizedPrompt)) {
    return buildMonthlyTrendChart(rows);
  }

  if (normalizedPrompt.includes("pie") || normalizedPrompt.includes("donut")) {
    return buildPieChart(rows, inferDimension(normalizedPrompt, "disposition"));
  }

  return buildBarChart(rows, inferDimension(normalizedPrompt, "pathway"));
}

function buildMonthlyTrendChart(rows: AnalyticsPatientRow[]): CopilotChartSpec {
  const buckets = new Map<string, number>();
  rows
    .slice()
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
    .forEach((row) => {
      buckets.set(row.monthLabel, (buckets.get(row.monthLabel) ?? 0) + 1);
    });

  return {
    title: "Patient Trend Over Time",
    description: "Monthly view of the filtered patient cohort.",
    type: "line",
    xKey: "label",
    data: Array.from(buckets.entries()).map(([label, count]) => ({ label, patients: count })),
    series: [{ key: "patients", label: "Patients", color: COLORS.coral }],
  };
}

function buildBarChart(rows: AnalyticsPatientRow[], dimension: GroupDimension): CopilotChartSpec {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = row[dimension];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const data = Array.from(counts.entries())
    .map(([label, patients]) => ({ label, patients }))
    .sort((a, b) => b.patients - a.patients || a.label.localeCompare(b.label));

  return {
    title: `${titleForDimension(dimension)} Breakdown`,
    description: `Distribution of the filtered cohort by ${titleForDimension(dimension).toLowerCase()}.`,
    type: "bar",
    xKey: "label",
    data,
    series: [{ key: "patients", label: "Patients", color: COLORS.navy }],
  };
}

function buildPieChart(rows: AnalyticsPatientRow[], dimension: GroupDimension): CopilotChartSpec {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = row[dimension];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const palette = [COLORS.green, COLORS.coral, COLORS.navy, COLORS.amber, COLORS.blue, COLORS.red, COLORS.muted];
  const data = Array.from(counts.entries())
    .map(([label, value], index) => ({ label, value, fill: palette[index % palette.length] }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  return {
    title: `${titleForDimension(dimension)} Mix`,
    description: `Share of the filtered cohort by ${titleForDimension(dimension).toLowerCase()}.`,
    type: "pie",
    xKey: "label",
    data,
    series: [{ key: "value", label: "Patients", color: COLORS.coral }],
  };
}

type GroupDimension = "physician" | "pathway" | "disposition" | "triage" | "gender" | "arrivalMode" | "ageBucket";

function inferDimension(normalizedPrompt: string, fallback: GroupDimension): GroupDimension {
  if (normalizedPrompt.includes("doctor") || normalizedPrompt.includes("physician") || normalizedPrompt.includes("provider")) {
    return "physician";
  }
  if (normalizedPrompt.includes("pathway") || normalizedPrompt.includes("protocol")) {
    return "pathway";
  }
  if (normalizedPrompt.includes("disposition") || normalizedPrompt.includes("status") || normalizedPrompt.includes("discharge")) {
    return "disposition";
  }
  if (normalizedPrompt.includes("triage")) {
    return "triage";
  }
  if (normalizedPrompt.includes("gender") || normalizedPrompt.includes("male") || normalizedPrompt.includes("female")) {
    return "gender";
  }
  if (normalizedPrompt.includes("ambulance") || normalizedPrompt.includes("walk in") || normalizedPrompt.includes("arrival")) {
    return "arrivalMode";
  }
  if (normalizedPrompt.includes("age")) {
    return "ageBucket";
  }
  return fallback;
}

function titleForDimension(dimension: GroupDimension) {
  return (
    {
      physician: "Provider",
      pathway: "Care Pathway",
      disposition: "Disposition",
      triage: "Triage",
      gender: "Gender",
      arrivalMode: "Arrival Mode",
      ageBucket: "Age Group",
    } as const
  )[dimension];
}

function looksLikeTimeSeries(normalizedPrompt: string) {
  return (
    normalizedPrompt.includes("trend") ||
    normalizedPrompt.includes("timeline") ||
    normalizedPrompt.includes("over time") ||
    normalizedPrompt.includes("last month") ||
    normalizedPrompt.includes("last three months") ||
    normalizedPrompt.includes("last 3 months") ||
    normalizedPrompt.includes("daily") ||
    normalizedPrompt.includes("monthly")
  );
}

function inferFilters(normalizedPrompt: string): FilterDefinition[] {
  const filters: FilterDefinition[] = [];

  if (normalizedPrompt.includes("male")) {
    filters.push({ label: "gender = male", test: (row) => row.gender === "Male" });
  } else if (normalizedPrompt.includes("female")) {
    filters.push({ label: "gender = female", test: (row) => row.gender === "Female" });
  }

  const underMatch = normalizedPrompt.match(/(?:less than|under|below)\s+(\d{1,3})/);
  if (underMatch) {
    const age = Number(underMatch[1]);
    filters.push({ label: `age < ${age}`, test: (row) => row.age < age });
  }

  const overMatch = normalizedPrompt.match(/(?:more than|over|above)\s+(\d{1,3})/);
  if (overMatch) {
    const age = Number(overMatch[1]);
    filters.push({ label: `age > ${age}`, test: (row) => row.age > age });
  }

  if (normalizedPrompt.includes("ambulance")) {
    filters.push({ label: "arrival = ambulance", test: (row) => row.arrivalMode === "Ambulance" });
  } else if (normalizedPrompt.includes("walk in")) {
    filters.push({ label: "arrival = walk in", test: (row) => row.arrivalMode === "Walk In" });
  }

  const triageMatch = normalizedPrompt.match(/level\s*(i{1,3}|[123])/);
  if (triageMatch) {
    const triage = normalizeTriageLevel(triageMatch[1]);
    filters.push({ label: `triage = ${triage}`, test: (row) => row.triage === triage });
  }

  const dispositionMatch = inferDisposition(normalizedPrompt);
  if (dispositionMatch) {
    filters.push({
      label: `disposition = ${dispositionMatch}`,
      test: (row) => row.disposition === dispositionMatch,
    });
  }

  const medicationMatch = inferMedication(normalizedPrompt);
  if (medicationMatch) {
    filters.push({
      label: `medication includes ${medicationMatch}`,
      test: (row) => row.medicationTerms.some((term) => term.includes(medicationMatch)),
    });
  }

  const monthsBack = inferMonthsBack(normalizedPrompt);
  if (monthsBack) {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - monthsBack);
    filters.push({
      label: `within last ${monthsBack} month${monthsBack > 1 ? "s" : ""}`,
      test: (row) => row.eventDate >= threshold,
    });
  }

  return filters;
}

function inferMonthsBack(normalizedPrompt: string) {
  if (normalizedPrompt.includes("last three months") || normalizedPrompt.includes("last 3 months")) {
    return 3;
  }
  const match = normalizedPrompt.match(/last\s+(\d+)\s+months?/);
  if (match) {
    return Number(match[1]);
  }
  if (normalizedPrompt.includes("last month")) {
    return 1;
  }
  return 0;
}

function inferDisposition(normalizedPrompt: string) {
  if (normalizedPrompt.includes("discharged") || normalizedPrompt.includes("discharge")) return "Discharged";
  if (normalizedPrompt.includes("admitted") || normalizedPrompt.includes("observation") || normalizedPrompt.includes("obs")) return "Admitted";
  if (normalizedPrompt.includes("expired")) return "Expired";
  if (normalizedPrompt.includes("lama")) return "LAMA";
  if (normalizedPrompt.includes("referred")) return "Referred Out";
  return "";
}

function inferMedication(normalizedPrompt: string) {
  for (const [alias, matches] of Object.entries(MEDICATION_ALIASES)) {
    if (normalizedPrompt.includes(alias)) {
      return matches[0];
    }
  }
  return "";
}

function normalizeTriageLevel(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "1" || normalized === "i") return "Level I";
  if (normalized === "2" || normalized === "ii") return "Level II";
  return "Level III";
}

function enrichPatient(patient: Patient): AnalyticsPatientRow {
  const overview = buildPatientOverview(patient);
  const eventDate = buildSyntheticEncounterDate(patient);
  const medications = overview.medications.map((item) => `${item.name} ${item.dose}`.trim());
  const medicationTerms = medications.flatMap((item) => {
    const normalized = normalize(item);
    const aliasTerms = Object.entries(MEDICATION_ALIASES)
      .filter(([, aliases]) => aliases.some((alias) => normalized.includes(alias)))
      .map(([alias]) => alias);
    return [normalized, ...aliasTerms];
  });

  return {
    id: patient.id,
    name: patient.name,
    age: patient.age,
    gender: patient.sex === "F" ? "Female" : patient.sex === "Other" ? "Other" : "Male",
    triage: triageLabelFor(patient.triage),
    disposition: patientDispositionLabel(patient.status),
    arrivalMode: patientArrivalMode(patient),
    physician: patient.physician === "-" ? "Unassigned" : patient.physician,
    pathway: pathwayBucketFor(patient.pathway),
    ageBucket: ageBucketFor(patient.age),
    medications,
    medicationTerms,
    eventDate,
    monthLabel: eventDate.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
  };
}

function patientDispositionLabel(status: Patient["status"]) {
  if (status === "discharged") return "Discharged";
  if (status === "obs") return "Admitted";
  return "Admitted";
}

function triageLabelFor(triage: Patient["triage"]) {
  if (triage === 1) return "Level I";
  if (triage === 2) return "Level II";
  if (triage === 3) return "Level III";
  return "Not Triaged";
}

function ageBucketFor(age: number) {
  if (age <= 18) return "0-18";
  if (age <= 35) return "19-35";
  if (age <= 55) return "36-55";
  if (age <= 75) return "56-75";
  return "76+";
}

function pathwayBucketFor(pathway: string) {
  const value = pathway.toLowerCase();
  if (value.includes("stemi") || value.includes("chest")) return "Chest Pain";
  if (value.includes("stroke")) return "Stroke";
  if (value.includes("sepsis")) return "Sepsis";
  if (value.includes("trauma")) return "Trauma";
  if (value.includes("snake") || value.includes("antivenom")) return "Snakebite";
  if (value.includes("respiratory")) return "Respiratory";
  if (value.includes("toxic") || value.includes("poison")) return "Poisoning";
  return "General";
}

function patientArrivalMode(patient: Patient): "Ambulance" | "Walk In" {
  const pathway = patient.pathway.toLowerCase();
  if (
    patient.bed.startsWith("TR-") ||
    patient.triage === 1 ||
    pathway.includes("trauma") ||
    pathway.includes("stemi") ||
    pathway.includes("stroke") ||
    pathway.includes("sepsis") ||
    pathway.includes("anaphylaxis")
  ) {
    return "Ambulance";
  }
  return "Walk In";
}

function buildSyntheticEncounterDate(patient: Patient) {
  const seed = Array.from(patient.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const daysBack = seed % 90;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysBack);
  return date;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
