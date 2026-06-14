import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCopilot } from "@/copilot/hooks/useCopilot";
import { createAnalyticsCopilotBindings } from "@/copilot/utils/analyticsCopilot";
import { getEdSnapshot } from "@/lib/edApi";
import {
  Clinical,
  DateFilter,
  FilterPill,
  GraphPatientsPanel,
  MetricDrillPanel,
  Operational,
  Quality,
  dateRangeDays,
  type DashboardFilter,
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
  const [activeFilter, setActiveFilter] = useState<DashboardFilter | null>(null);
  const [drillMetric, setDrillMetric] = useState<Metric | null>(null);
  const [graphPatientsView, setGraphPatientsView] = useState<{ title: string; patients: typeof patients } | null>(null);
  const days = useMemo(() => dateRangeDays(range, custom), [range, custom]);
  const analyticsBindings = useMemo(() => createAnalyticsCopilotBindings(patients), [patients]);
  const filteredPatients = useMemo(() => filterPatients(patients, activeFilter), [patients, activeFilter]);
  const filterRatio = activeFilter ? filterImpactMultiplier(filteredPatients.length, patients.length) : 1;

  const applyFilter = (filter: DashboardFilter) => {
    setActiveFilter((current) => (isSameFilter(current, filter) ? null : filter));
  };

  useEffect(() => {
    setAnalyticsBindings(analyticsBindings);
    return () => setAnalyticsBindings(null);
  }, [analyticsBindings, setAnalyticsBindings]);

  return (
    <div className="mx-auto w-full max-w-none space-y-4 px-3 py-4 font-sans sm:px-4 sm:py-5 2xl:px-6">
      <header className="warm-panel rounded-[1.75rem] p-4 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Performance Analytics Ver 3</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="text-muted-foreground">Version 1 layout with only existing metrics</span>
              <Link to="/analytics" className="rounded-full border border-border/70 bg-white px-2.5 py-1 text-navy transition-colors hover:border-coral/40 hover:text-coral">
                Back to Analytics
              </Link>
              <Link to="/analytics-v2" className="rounded-full border border-coral/30 bg-coral/10 px-2.5 py-1 text-coral transition-colors hover:bg-coral hover:text-white">
                Open Analytics Ver 2
              </Link>
            </div>
          </div>
          <DateFilter range={range} setRange={setRange} custom={custom} setCustom={setCustom} />
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
          patients={patients}
          filterRatio={filterRatio}
          days={days}
          activeFilter={activeFilter}
          applyFilter={applyFilter}
          onDrill={setDrillMetric}
          onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
          hideSuggested
          compact
          v3ChartLayout
        />
      ) : null}

      {tab === "clinical" ? (
        <Clinical
          patients={patients}
          filterRatio={filterRatio}
          days={days}
          activeFilter={activeFilter}
          applyFilter={applyFilter}
          onDrill={setDrillMetric}
          onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
          hideSuggested
          compact
          v3ChartLayout
        />
      ) : null}

      {tab === "quality" ? (
        <Quality
          patients={patients}
          filterRatio={filterRatio}
          days={days}
          activeFilter={activeFilter}
          applyFilter={applyFilter}
          onDrill={setDrillMetric}
          onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
          hideSuggested
          compact
        />
      ) : null}

      {drillMetric ? (
        <MetricDrillPanel
          patients={patients}
          filterRatio={filterRatio}
          metric={drillMetric}
          days={days}
          activeFilter={activeFilter}
          onClose={() => setDrillMetric(null)}
          v3ChartLayout
        />
      ) : null}

      {graphPatientsView ? (
        <GraphPatientsPanel
          title={graphPatientsView.title}
          patients={graphPatientsView.patients}
          onClose={() => setGraphPatientsView(null)}
          advancedColumns
        />
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
