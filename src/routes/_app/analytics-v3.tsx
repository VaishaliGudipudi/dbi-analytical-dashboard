import { createFileRoute } from "@tanstack/react-router";
import { Calendar, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCopilot } from "@/copilot/hooks/useCopilot";
import { createAnalyticsCopilotBindings } from "@/copilot/utils/analyticsCopilot";
import { getEdSnapshot } from "@/lib/edApi";
import {
  Clinical,
  FilterPill,
  GraphPatientsPanel,
  MetricDrillPanel,
  Operational,
  Quality,
  dateRangeDays,
  patientArrivalMode,
  patientDispositionLabel,
  patientGenderLabel,
  pathwayBucketFor,
  triageLabelFor,
  type DashboardFilter,
  type CarePathwayFilterValue,
  type Metric,
  type RangeId,
} from "./analytics";

export const Route = createFileRoute("/_app/analytics-v3")({
  loader: async () => {
    const snapshot = await getEdSnapshot();
    return { patients: snapshot.patients };
  },
  component: AnalyticsV3,
});

type GroupId = "operational" | "clinical" | "quality";

function AnalyticsV3() {
  const { patients } = Route.useLoaderData();
  const { setAnalyticsBindings } = useCopilot();
  const [tab, setTab] = useState<GroupId>("operational");
  const [range, setRange] = useState<RangeId>("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [carePathway, setCarePathway] = useState<CarePathwayFilterValue>("all");
  const [triageLevel, setTriageLevel] = useState<TriageFilterValue>("all");
  const [arrivalMode, setArrivalMode] = useState<ArrivalModeFilterValue>("all");
  const [gender, setGender] = useState<GenderFilterValue>("all");
  const [disposition, setDisposition] = useState<DispositionFilterValue>("all");
  const [activeFilter, setActiveFilter] = useState<DashboardFilter | null>(null);
  const [drillMetric, setDrillMetric] = useState<Metric | null>(null);
  const [graphPatientsView, setGraphPatientsView] = useState<{ title: string; patients: typeof patients } | null>(null);
  const days = useMemo(() => dateRangeDays(range, custom), [range, custom]);
  const analyticsBindings = useMemo(() => createAnalyticsCopilotBindings(patients), [patients]);
  const scopedPatients = useMemo(
    () => applyGlobalFilters(patients, carePathway, triageLevel, arrivalMode, gender, disposition),
    [patients, carePathway, triageLevel, arrivalMode, gender, disposition],
  );
  const filteredPatients = useMemo(() => filterPatients(scopedPatients, activeFilter), [scopedPatients, activeFilter]);
  const filterRatio = filterImpactMultiplier(filteredPatients.length, scopedPatients.length);
  const graphTitleSuffix = `Total: ${filteredPatients.length}`;

  const applyFilter = (filter: DashboardFilter) => {
    setActiveFilter((current) => (isSameFilter(current, filter) ? null : filter));
  };

  useEffect(() => {
    setAnalyticsBindings(analyticsBindings);
    return () => setAnalyticsBindings(null);
  }, [analyticsBindings, setAnalyticsBindings]);

  return (
    <div className="mx-auto w-full max-w-none space-y-4 px-3 py-4 font-sans sm:px-4 sm:py-5 2xl:px-6">
      <header className="warm-panel rounded-[1.5rem] p-3 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-navy">Performance Analytics Ver 3</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="text-muted-foreground">Locked to the Ver 3 analytics experience</span>
            </div>
          </div>
        </div>
        <div className="mt-3 grid w-full grid-cols-[repeat(5,minmax(0,1fr))_minmax(300px,1.65fr)] gap-1.5">
            <DashboardSelectFilter
              label="Care pathway"
              value={carePathway}
              onChange={setCarePathway}
              options={[
                ["all", "All pathways"],
                ["Chest Pain", "Chest Pain"],
                ["Stroke", "Stroke"],
                ["Sepsis", "Sepsis"],
                ["Trauma", "Trauma"],
                ["Snakebite", "Snakebite"],
                ["Respiratory", "Respiratory"],
                ["Poisoning", "Poisoning"],
                ["General", "General"],
              ]}
            />
            <DashboardSelectFilter
              label="Triage level"
              value={triageLevel}
              onChange={setTriageLevel}
              options={[["all", "All triage"], ["Level I", "Level I"], ["Level II", "Level II"], ["Level III", "Level III"], ["Not Triaged", "Not Triaged"]]}
            />
            <DashboardSelectFilter
              label="Arrival mode"
              value={arrivalMode}
              onChange={setArrivalMode}
              options={[["all", "All arrival modes"], ["Ambulance", "Ambulance"], ["Walk In", "Walk In"]]}
            />
            <DashboardSelectFilter
              label="Gender"
              value={gender}
              onChange={setGender}
              options={[["all", "All gender"], ["Male", "Male"], ["Female", "Female"]]}
            />
            <DashboardSelectFilter
              label="Disposition"
              value={disposition}
              onChange={setDisposition}
              options={[
                ["all", "All dispositions"],
                ["Discharges", "Discharges"],
                ["ER Observation", "ER Observation"],
                ["Outward Referrals", "Outward Referrals"],
                ["In Patient Ward", "In Patient Ward"],
                ["ICU", "ICU"],
                ["Cathlab", "Cathlab"],
                ["LAMA", "LAMA"],
                ["Other", "Other"],
              ]}
            />
            <DashboardDateFilter range={range} setRange={setRange} custom={custom} setCustom={setCustom} />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-2xl bg-secondary/70 p-1.5">
          {[
            { id: "operational" as const, label: "Operational" },
            { id: "clinical" as const, label: "Clinical" },
            { id: "quality" as const, label: "Quality & Safety" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                tab === item.id ? "bg-coral text-white shadow-soft" : "text-muted-foreground hover:bg-white hover:text-navy"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <FilterPill activeFilter={activeFilter} onClear={() => setActiveFilter(null)} />
      </div>

      {tab === "operational" ? (
        <Operational
          patients={scopedPatients}
          filterRatio={filterRatio}
          days={days}
          activeFilter={activeFilter}
          applyFilter={applyFilter}
          onDrill={setDrillMetric}
          onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
          hideSuggested
          compact
          v3ChartLayout
          graphTitleSuffix={graphTitleSuffix}
        />
      ) : null}

      {tab === "clinical" ? (
        <Clinical
          patients={scopedPatients}
          filterRatio={filterRatio}
          days={days}
          activeFilter={activeFilter}
          applyFilter={applyFilter}
          onDrill={setDrillMetric}
          onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
          hideSuggested
          compact
          v3ChartLayout
          graphTitleSuffix={graphTitleSuffix}
        />
      ) : null}

      {tab === "quality" ? (
        <Quality
          patients={scopedPatients}
          filterRatio={filterRatio}
          days={days}
          activeFilter={activeFilter}
          applyFilter={applyFilter}
          onDrill={setDrillMetric}
          onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
          hideSuggested
          compact
          v3ChartLayout
          graphTitleSuffix={graphTitleSuffix}
        />
      ) : null}

      {drillMetric ? (
        <MetricDrillPanel
          patients={scopedPatients}
          filterRatio={filterRatio}
          metric={drillMetric}
          days={days}
          activeFilter={activeFilter}
          onClose={() => setDrillMetric(null)}
          v3ChartLayout
          graphTitleSuffix={graphTitleSuffix}
        />
      ) : null}

      {graphPatientsView ? (
        <GraphPatientsPanel
          title={graphPatientsView.title}
          patients={graphPatientsView.patients}
          onClose={() => setGraphPatientsView(null)}
          advancedColumns
          hideErDateColumns
        />
      ) : null}
    </div>
  );
}

function filterByCarePathway<T extends { pathway: string }>(patients: T[], carePathway: CarePathwayFilterValue) {
  if (carePathway === "all") return patients;
  return patients.filter((patient) => pathwayBucketFor(patient.pathway) === carePathway);
}

type TriageFilterValue = "all" | "Level I" | "Level II" | "Level III" | "Not Triaged";
type ArrivalModeFilterValue = "all" | "Ambulance" | "Walk In";
type GenderFilterValue = "all" | "Male" | "Female";
type DispositionFilterValue = "all" | "Discharges" | "ER Observation" | "Outward Referrals" | "In Patient Ward" | "ICU" | "Cathlab" | "LAMA" | "Other";

function applyGlobalFilters<T extends { pathway: string; triage: number; bed: string; status: string; department: string; sex: string }>(
  patients: T[],
  carePathway: CarePathwayFilterValue,
  triageLevel: TriageFilterValue,
  arrivalMode: ArrivalModeFilterValue,
  gender: GenderFilterValue,
  disposition: DispositionFilterValue,
) {
  return patients.filter((patient) => {
    if (carePathway !== "all" && pathwayBucketFor(patient.pathway) !== carePathway) {
      return false;
    }
    if (triageLevel !== "all" && triageLabelFor(patient.triage) !== triageLevel) {
      return false;
    }
    if (arrivalMode !== "all" && patientArrivalMode(patient) !== arrivalMode) {
      return false;
    }
    if (gender !== "all" && patientGenderLabel(patient.sex) !== gender) {
      return false;
    }
    if (disposition !== "all" && patientDispositionLabel(patient) !== disposition) {
      return false;
    }
    return true;
  });
}

function DashboardSelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: any) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 rounded-xl border border-border/70 bg-white px-2.5 py-1.5 shadow-soft">
      <span className="whitespace-nowrap text-[9px] font-bold uppercase leading-none tracking-[0.1em] text-coral">{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full appearance-none rounded-lg border border-border bg-secondary/35 px-2.5 pr-7 text-xs font-bold text-navy outline-none transition focus:border-coral focus:bg-white"
        >
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-coral" />
      </span>
    </label>
  );
}

function DashboardDateFilter({
  range,
  setRange,
  custom,
  setCustom,
}: {
  range: RangeId;
  setRange: (r: RangeId) => void;
  custom: { from: string; to: string };
  setCustom: (c: { from: string; to: string }) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border/70 bg-white px-2 py-1.5 shadow-soft">
      <div className="flex min-w-0 items-center justify-between gap-1">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-coral" />
        {(["7d", "30d", "90d"] as RangeId[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRange(value)}
            className={`h-8 rounded-lg px-2 text-xs font-bold transition-all ${
              range === value ? "bg-navy text-white" : "text-muted-foreground hover:bg-secondary/70 hover:text-navy"
            }`}
          >
            {value === "7d" ? "7 days" : value === "30d" ? "30 days" : "90 days"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRange("custom")}
          className={`h-8 rounded-lg px-2 text-xs font-bold transition-all ${
            range === "custom" ? "bg-navy text-white" : "text-muted-foreground hover:bg-secondary/70 hover:text-navy"
          }`}
        >
          Custom
        </button>
      </div>
      {range === "custom" ? (
        <div className="grid grid-cols-2 gap-1 border-t border-border pt-1">
          <input
            type="date"
            value={custom.from}
            onChange={(event) => setCustom({ ...custom, from: event.target.value })}
            className="h-8 min-w-0 rounded-lg border border-border bg-background px-2 text-xs text-navy"
          />
          <input
            type="date"
            value={custom.to}
            onChange={(event) => setCustom({ ...custom, to: event.target.value })}
            className="h-8 min-w-0 rounded-lg border border-border bg-background px-2 text-xs text-navy"
          />
        </div>
      ) : null}
    </div>
  );
}

function filterPatients<T extends { triage: number; status: string }>(patients: T[], activeFilter: DashboardFilter | null) {
  if (!activeFilter) return patients;

  return patients.filter((patient) => {
    const label = activeFilter.label.toLowerCase();
    const source = activeFilter.source.toLowerCase();
    const patientStatus =
      patient.status === "ed" ? "ed active" : patient.status === "obs" ? "observation" : "discharged";

    if (source.includes("triage")) {
      return label.includes("pending") ? patient.triage === 0 : label.includes(String(patient.triage));
    }

    if (source.includes("disposition") || source.includes("status")) {
      return patientStatus.toLowerCase() === label;
    }

    return true;
  });
}

function isSameFilter(current: DashboardFilter | null, next: DashboardFilter) {
  return current?.source === next.source && current?.label === next.label;
}

function filterImpactMultiplier(filteredCount: number, totalCount: number) {
  if (!totalCount) return 1;
  return Math.max(0.2, filteredCount / totalCount);
}



