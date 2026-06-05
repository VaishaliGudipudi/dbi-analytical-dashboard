import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, ChevronRight, ShieldCheck, Stethoscope, X } from "lucide-react";
import { getEdSnapshot } from "@/lib/edApi";
import type { Patient } from "@/lib/edTypes";
import {
  Clinical,
  DateFilter,
  FilterPill,
  MetricDrillPanel,
  Operational,
  Quality,
  dateRangeDays,
  type DashboardFilter,
  type Metric,
  type RangeId,
} from "./analytics";

export const Route = createFileRoute("/_app/analytics-v2")({
  loader: async () => {
    const snapshot = await getEdSnapshot();
    return { patients: snapshot.patients };
  },
  component: AnalyticsV2,
});

type GroupId = "operational" | "clinical" | "quality";

function AnalyticsV2() {
  const { patients } = Route.useLoaderData();
  const [activeGroup, setActiveGroup] = useState<GroupId | null>(null);
  const [range, setRange] = useState<RangeId>("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [activeFilter, setActiveFilter] = useState<DashboardFilter | null>(null);
  const [drillMetric, setDrillMetric] = useState<Metric | null>(null);
  const [graphPatientsView, setGraphPatientsView] = useState<{ title: string; patients: typeof patients } | null>(null);

  const days = useMemo(() => dateRangeDays(range, custom), [range, custom]);
  const filteredPatients = useMemo(() => filterPatients(patients, activeFilter), [patients, activeFilter]);
  const filterRatio = activeFilter ? filterImpactMultiplier(filteredPatients.length, patients.length) : 1;

  const summaries = useMemo(() => buildSummaries(patients), [patients]);

  const applyFilter = (filter: DashboardFilter) => {
    setActiveFilter((current) => (isSameFilter(current, filter) ? null : filter));
  };

  return (
    <div className="mx-auto max-w-[980px] space-y-5 p-4 sm:p-5 2xl:max-w-[1400px] 2xl:p-6">
      <header className="warm-panel rounded-[1.75rem] p-4 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-coral">Same Graphs, Grouped Better</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">Analytics Ver 2</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Summary cards on top. Click one card to reveal the exact graph group from the first analytics page below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/patients"
              className="rounded-full border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral transition-colors hover:bg-coral hover:text-white"
            >
              Click to view patients
            </Link>
            <Link
              to="/analytics"
              className="rounded-full border border-border/70 bg-white px-3 py-2 text-sm font-semibold text-navy transition-colors hover:border-coral/40 hover:text-coral"
            >
              Back to Analytics
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-3">
        {summaries.map((summary) => (
          <button
            key={summary.id}
            type="button"
            onClick={() => setActiveGroup(summary.id)}
            className={`group rounded-[1.5rem] border bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg ${
              activeGroup === summary.id ? "border-coral ring-2 ring-coral/15" : "border-border/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-bold text-navy">{summary.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{summary.description}</div>
              </div>
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${activeGroup === summary.id ? "bg-coral text-white" : "bg-navy text-white"}`}>
                <summary.Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-4 text-3xl font-bold tracking-tight text-navy">{summary.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{summary.note}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {summary.chips.map((chip) => (
                <span key={chip} className="rounded-full border border-border/70 bg-secondary/35 px-2.5 py-1 text-[11px] font-semibold text-navy">
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold">
              <span className="text-muted-foreground">Click to reveal this graph group.</span>
              <ChevronRight className="h-4 w-4 text-coral" />
            </div>
          </button>
        ))}
      </div>

      <section className="rounded-[1.75rem] border border-dashed border-border/80 bg-card/70 p-6 text-center shadow-soft">
        <div className="text-sm font-semibold text-navy">Click any KPI summary card to open its graph section in a popup.</div>
        <div className="mt-1 text-xs text-muted-foreground">
          The dashboard stays collapsed until a card is selected.
        </div>
      </section>

      {activeGroup ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setActiveGroup(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-[2rem] bg-background shadow-soft-lg 2xl:max-w-[1500px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-coral">Popup Graph View</div>
                <h2 className="mt-1 text-lg font-bold text-navy">
                  {summaries.find((item) => item.id === activeGroup)?.title} graphs from Version 1
                </h2>
                <div className="mt-1 text-sm text-muted-foreground">
                  Same graph group, opened in a focused popup.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveGroup(null)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-white text-navy transition-colors hover:border-coral/40 hover:text-coral"
                aria-label="Close analytics popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-border px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <FilterPill activeFilter={activeFilter} onClear={() => setActiveFilter(null)} />
                <DateFilter range={range} setRange={setRange} custom={custom} setCustom={setCustom} />
              </div>
            </div>

            <div className="overflow-auto px-5 py-5">
              {activeGroup === "operational" ? (
                <Operational
                  patients={patients}
                  filterRatio={filterRatio}
                  days={days}
                  activeFilter={activeFilter}
                  applyFilter={applyFilter}
                  onDrill={setDrillMetric}
                  onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
                />
              ) : null}

              {activeGroup === "clinical" ? (
                <Clinical
                  patients={patients}
                  filterRatio={filterRatio}
                  days={days}
                  activeFilter={activeFilter}
                  applyFilter={applyFilter}
                  onDrill={setDrillMetric}
                  onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
                />
              ) : null}

              {activeGroup === "quality" ? (
                <Quality
                  patients={patients}
                  filterRatio={filterRatio}
                  days={days}
                  activeFilter={activeFilter}
                  applyFilter={applyFilter}
                  onDrill={setDrillMetric}
                  onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {drillMetric ? (
        <MetricDrillPanel
          patients={patients}
          filterRatio={filterRatio}
          metric={drillMetric}
          days={days}
          activeFilter={activeFilter}
          onClose={() => setDrillMetric(null)}
        />
      ) : null}
      {graphPatientsView ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 p-3 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setGraphPatientsView(null)}>
          <div className="max-h-[88vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-background shadow-soft-lg" onClick={event => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background px-5 py-4">
              <div>
                <h3 className="font-bold text-navy">{graphPatientsView.title}</h3>
                <p className="text-xs font-medium text-muted-foreground">Patient list linked from this graph</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-muted-foreground">{graphPatientsView.patients.length} records</div>
                <button onClick={() => setGraphPatientsView(null)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-secondary">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto p-5">
              <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card shadow-soft">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Patient</th>
                      <th className="px-4 py-2 text-left">UMR</th>
                      <th className="px-4 py-2 text-left">Triage</th>
                      <th className="px-4 py-2 text-left">Bed</th>
                      <th className="px-4 py-2 text-left">Pathway</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graphPatientsView.patients.map((patient) => (
                      <tr key={patient.id} className="border-t border-border">
                        <td className="px-4 py-2 font-bold text-navy">
                          <Link to="/patient/$id/workspace" params={{ id: patient.id }} className="transition-colors hover:text-coral">
                            {patient.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">{patient.umr}</td>
                        <td className="px-4 py-2 text-muted-foreground">Level {patient.triage || "Pending"}</td>
                        <td className="px-4 py-2 text-muted-foreground">{patient.bed}</td>
                        <td className="px-4 py-2 text-muted-foreground">{patient.pathway}</td>
                        <td className="px-4 py-2 text-muted-foreground">{patient.status}</td>
                        <td className="px-4 py-2 text-right">
                          <Link to="/patient/$id/workspace" params={{ id: patient.id }} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-navy transition-colors hover:border-coral hover:text-coral">
                            Open chart
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildSummaries(patients: Patient[]) {
  const active = patients.filter((patient) => patient.status !== "discharged").length;
  const critical = patients.filter((patient) => patient.triage <= 2).length;
  const observation = patients.filter((patient) => patient.status === "obs").length;
  const busiestPathway = Array.from(groupByCount(patients, (patient) => patient.pathway).entries()).sort((a, b) => b[1] - a[1])[0];

  return [
    {
      id: "operational" as const,
      title: "Operational",
      description: "Throughput, footfall, stage timing, beds, and protocol ordering.",
      value: String(active),
      note: "active patients currently moving through ER operations",
      chips: [`Total ${patients.length}`, `Discharged ${patients.length - active}`, "Footfall + beds + TAT"],
      Icon: Activity,
    },
    {
      id: "clinical" as const,
      title: "Clinical",
      description: "Clinical recognition, pathway mix, medication, and investigation usage.",
      value: String(critical),
      note: "triage I and II patients across current clinical load",
      chips: [`Top pathway ${busiestPathway?.[0] ?? "-"}`, `Critical ${critical}`, "Pathways + utilisation"],
      Icon: Stethoscope,
    },
    {
      id: "quality" as const,
      title: "Quality & Safety",
      description: "Safety outcomes, patient experience, referrals, LAMA, and complaints.",
      value: String(observation),
      note: "patients under observation and quality-watch flow",
      chips: [`Pending triage ${patients.filter((patient) => patient.triage === 0).length}`, `Observation ${observation}`, "Outcomes + complaints"],
      Icon: ShieldCheck,
    },
  ];
}

function groupByCount<T>(rows: T[], getKey: (row: T) => string) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = getKey(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
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
