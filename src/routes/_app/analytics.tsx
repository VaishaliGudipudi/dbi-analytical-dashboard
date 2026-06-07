import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend as RLegend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Activity,
  AlertTriangle,
  Bed,
  Calendar,
  ChevronRight,
  Clock,
  Eraser,
  FlaskConical,
  HeartPulse,
  Pill,
  Repeat,
  RotateCcw,
  ShieldCheck,
  Skull,
  Sparkles,
  Stethoscope,
  TimerReset,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useCopilot } from "@/copilot/hooks/useCopilot";
import { createAnalyticsCopilotBindings } from "@/copilot/utils/analyticsCopilot";
import { getEdSnapshot } from "@/lib/edApi";
import { patients as roster, wards } from "@/lib/mockData";

export const Route = createFileRoute("/_app/analytics")({
  loader: async () => {
    const snapshot = await getEdSnapshot();
    return { patients: snapshot.patients };
  },
  component: Analytics,
});

type GroupId = "operational" | "clinical" | "quality";
export type RangeId = "7d" | "30d" | "90d" | "custom";
type MetricKind = "rate" | "duration" | "count" | "score";
type Tone = "navy" | "coral" | "amber" | "green" | "blue";
type FootfallView = "hour" | "shift" | "day" | "month" | "year";
type MlcView = "day" | "week" | "month";
type ProtocolView = "day" | "week" | "month" | "pathway";
type ReferralView = "hour" | "weekday" | "month" | "reason";
type LamaView = "reason" | "pincode";
type ComplaintView = "hour" | "shift" | "day";

export interface Metric {
  id: string;
  label: string;
  group: GroupId;
  kind: MetricKind;
  baseline: number;
  target: string;
  unit?: string;
  tone: Tone;
  Icon: typeof Clock;
  isNew?: boolean;
  fmt: (v: number) => string;
}

export interface DashboardFilter {
  source: string;
  label: string;
}

const COLORS = {
  navy: "var(--navy)",
  coral: "var(--coral)",
  amber: "var(--amber-emerg)",
  green: "var(--urgent-safe)",
  blue: "#3b82f6",
  red: "var(--urgent-critical)",
  muted: "var(--muted-foreground)",
};

const BAR_RADIUS: [number, number, number, number] = [10, 10, 0, 0];
const HORIZONTAL_BAR_RADIUS: [number, number, number, number] = [0, 10, 10, 0];
const ENTITY_COLORS = {
  Male: COLORS.navy,
  Female: COLORS.coral,
  Other: COLORS.amber,
  Discharged: COLORS.green,
  Admitted: COLORS.navy,
  Admission: COLORS.navy,
  Observation: COLORS.amber,
  "ED Active": COLORS.blue,
  Referred: COLORS.coral,
  "Referred Out": COLORS.coral,
  LAMA: COLORS.amber,
  Expired: COLORS.red,
  Ambulance: COLORS.blue,
  "Walk In": COLORS.navy,
  Infusions: COLORS.amber,
  Investigations: COLORS.blue,
  Medications: COLORS.coral,
  Procedures: COLORS.navy,
  Registration: COLORS.blue,
  Triage: COLORS.amber,
  Consult: COLORS.coral,
  Disposition: COLORS.navy,
  Cases: COLORS.navy,
  Total: COLORS.navy,
  Value: COLORS.coral,
  AdmissionMEWS: COLORS.navy,
  DischargeMEWS: COLORS.green,
} as const;

const METRICS: Metric[] = [
  { id: "iaTat", label: "Initial Assessment TAT", group: "operational", kind: "duration", baseline: 7.4, target: "<= 10 min", unit: "min", tone: "navy", Icon: Clock, fmt: v => `${v.toFixed(1)} min` },
  { id: "erTat", label: "ER TAT", group: "operational", kind: "duration", baseline: 142, target: "<= 180 min", unit: "min", tone: "navy", Icon: Activity, fmt: v => `${Math.round(v)} min` },
  { id: "avgLos", label: "Average LOS", group: "operational", kind: "duration", baseline: 3.8, target: "ER stay", unit: "hr", tone: "blue", Icon: TimerReset, isNew: true, fmt: v => `${v.toFixed(1)} hr` },
  { id: "dispositionTat", label: "Disposition Processing", group: "operational", kind: "duration", baseline: 34, target: "Decision to exit", unit: "min", tone: "coral", Icon: Clock, isNew: true, fmt: v => `${Math.round(v)} min` },
  { id: "bedOcc", label: "Bed Occupancy", group: "operational", kind: "rate", baseline: 0.84, target: "<= 85%", unit: "%", tone: "blue", Icon: Bed, fmt: v => `${Math.round(v * 100)}%` },
  { id: "ppd", label: "Patients / Doctor", group: "operational", kind: "count", baseline: 14.2, target: "Shift load", tone: "navy", Icon: UserCheck, fmt: v => v.toFixed(1) },
  { id: "ppn", label: "Patients / Nurse", group: "operational", kind: "count", baseline: 8.6, target: "Shift load", tone: "blue", Icon: Users, isNew: true, fmt: v => v.toFixed(1) },
  { id: "mlcCases", label: "MLC Cases", group: "operational", kind: "count", baseline: 5.4, target: "Daily avg", tone: "coral", Icon: AlertTriangle, fmt: v => `${Math.round(v)}` },
  { id: "carePlan", label: "Care Plan Compliance", group: "clinical", kind: "rate", baseline: 0.912, target: ">= 90%", unit: "%", tone: "blue", Icon: ShieldCheck, fmt: v => `${(v * 100).toFixed(1)}%` },
  { id: "doorThromb", label: "Door to Thrombolysis", group: "clinical", kind: "duration", baseline: 43, target: "<= 60 min", unit: "min", tone: "coral", Icon: Clock, fmt: v => `${Math.round(v)} min` },
  { id: "doorBalloon", label: "Door to Balloon", group: "clinical", kind: "duration", baseline: 78, target: "<= 90 min", unit: "min", tone: "coral", Icon: HeartPulse, fmt: v => `${Math.round(v)} min` },
  { id: "investigationTat", label: "Investigation TAT", group: "clinical", kind: "duration", baseline: 39, target: "Result turnaround", unit: "min", tone: "navy", Icon: FlaskConical, isNew: true, fmt: v => `${Math.round(v)} min` },
  { id: "mortality", label: "ER Mortality", group: "quality", kind: "rate", baseline: 0.018, target: "<= 2%", unit: "%", tone: "coral", Icon: Skull, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "lamaRate", label: "LAMA Rate", group: "quality", kind: "rate", baseline: 0.048, target: "<= 5%", unit: "%", tone: "coral", Icon: AlertTriangle, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "lwbsRate", label: "LWBS Rate", group: "quality", kind: "rate", baseline: 0.026, target: "<= 3%", unit: "%", tone: "coral", Icon: Eraser, isNew: true, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "readmit72", label: "72-Hour Readmission", group: "quality", kind: "rate", baseline: 0.034, target: "<= 5%", unit: "%", tone: "coral", Icon: Repeat, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "returnRate", label: "Return After Discharge", group: "quality", kind: "rate", baseline: 0.051, target: "<= 6%", unit: "%", tone: "coral", Icon: RotateCcw, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "satisfaction", label: "Patient Satisfaction", group: "quality", kind: "rate", baseline: 0.884, target: "Experience score", unit: "%", tone: "navy", Icon: Sparkles, isNew: true, fmt: v => `${Math.round(v * 100)}%` },
  { id: "bedCleaning", label: "Bed Cleaning Compliance", group: "quality", kind: "rate", baseline: 0.91, target: "Protocol adherence", unit: "%", tone: "blue", Icon: Bed, isNew: true, fmt: v => `${Math.round(v * 100)}%` },
  { id: "bedCleaningTat", label: "Bed Cleaning TAT", group: "quality", kind: "duration", baseline: 18, target: "Ready for next patient", unit: "min", tone: "blue", Icon: TimerReset, isNew: true, fmt: v => `${Math.round(v)} min` },
];

const triageDist = [
  { name: "Level I", value: 16, color: COLORS.red },
  { name: "Level II", value: 37, color: "var(--urgent-urgent)" },
  { name: "Level III", value: 68, color: "var(--urgent-pending)" },
  { name: "Not Triaged", value: 9, color: COLORS.muted },
];

const dispositionDist = [
  { name: "Discharged", value: 64, color: getEntityColor("Discharged", COLORS.green) },
  { name: "Admitted", value: 38, color: getEntityColor("Admitted", COLORS.navy) },
  { name: "Referred Out", value: 12, color: getEntityColor("Referred Out", COLORS.coral) },
  { name: "LAMA", value: 6, color: getEntityColor("LAMA", COLORS.amber) },
  { name: "Expired", value: 2, color: getEntityColor("Expired", COLORS.red) },
];

const triageVsDispoBase = [
  { name: "Level I", Discharged: 4, Admitted: 9, Referred: 2, LAMA: 0, Expired: 1 },
  { name: "Level II", Discharged: 18, Admitted: 12, Referred: 5, LAMA: 1, Expired: 1 },
  { name: "Level III", Discharged: 42, Admitted: 17, Referred: 5, LAMA: 5, Expired: 0 },
  { name: "Pending", Discharged: 0, Admitted: 0, Referred: 0, LAMA: 0, Expired: 0 },
];

const ageGenderBase = [
  { name: "0-18", Male: 12, Female: 9 },
  { name: "19-35", Male: 28, Female: 31 },
  { name: "36-55", Male: 36, Female: 29 },
  { name: "56-75", Male: 41, Female: 33 },
  { name: "76+", Male: 14, Female: 18 },
];

const pathwayCasesBase = [
  { name: "Chest Pain", Total: 64, Day: 12 },
  { name: "Stroke", Total: 31, Day: 5 },
  { name: "Sepsis", Total: 28, Day: 6 },
  { name: "Trauma", Total: 44, Day: 9 },
  { name: "Snakebite", Total: 17, Day: 3 },
  { name: "Respiratory", Total: 52, Day: 10 },
  { name: "Poisoning", Total: 20, Day: 4 },
];

const medicationsBase = [
  ["Aspirin", 48], ["Paracetamol", 44], ["Ceftriaxone", 39], ["Pantoprazole", 34], ["Ondansetron", 31],
  ["Heparin", 27], ["Atorvastatin", 25], ["Salbutamol", 24], ["Normal Saline", 23], ["Metformin", 18],
  ["Insulin", 17], ["Clopidogrel", 16], ["Adrenaline", 14], ["ASV", 12], ["Mannitol", 9],
] as const;

const investigationsBase = [
  ["CBC", 72], ["Troponin", 61], ["ECG", 58], ["RFT", 54], ["LFT", 43],
  ["Chest X-ray", 39], ["ABG", 35], ["CT Brain", 28], ["D-dimer", 21], ["Blood Culture", 20],
  ["Electrolytes", 19], ["Urine Routine", 17], ["HbA1c", 15], ["INR", 14], ["Lactate", 13],
] as const;

const referralBase = [
  { name: "Cardiac Centre", value: 6 },
  { name: "Neurosciences", value: 4 },
  { name: "Burns Unit", value: 3 },
  { name: "Pediatric Surgery", value: 2 },
  { name: "Other", value: 5 },
];

const lamaReasonBase = [
  { name: "Financial", value: 14 },
  { name: "Family", value: 11 },
  { name: "Wait Time", value: 8 },
  { name: "Second Opinion", value: 6 },
  { name: "Improved", value: 5 },
  { name: "Other", value: 4 },
];

const lamaPinBase = [
  { name: "500032", value: 9 },
  { name: "500081", value: 7 },
  { name: "500018", value: 6 },
  { name: "500016", value: 5 },
  { name: "500038", value: 4 },
  { name: "Other", value: 14 },
];

const protocolSegmentKeys = ["Infusions", "Investigations", "Medications", "Procedures"] as const;
function Analytics() {
  const { patients } = Route.useLoaderData();
  const { setAnalyticsBindings } = useCopilot();
  const [tab, setTab] = useState<GroupId>("operational");
  const [range, setRange] = useState<RangeId>("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [activeFilter, setActiveFilter] = useState<DashboardFilter | null>(null);
  const [drillMetric, setDrillMetric] = useState<Metric | null>(null);
  const [graphPatientsView, setGraphPatientsView] = useState<{ title: string; patients: typeof roster } | null>(null);
  const days = useMemo(() => dateRangeDays(range, custom), [range, custom]);
  const analyticsBindings = useMemo(() => createAnalyticsCopilotBindings(patients), [patients]);
  const filteredPatients = useMemo(() => filterPatients(patients, activeFilter), [patients, activeFilter]);
  const filterRatio = activeFilter ? filterImpactMultiplier(filteredPatients.length, patients.length) : 1;
  const applyFilter = (filter: DashboardFilter) => {
    setActiveFilter(current => isSameFilter(current, filter) ? null : filter);
  };

  useEffect(() => {
    setAnalyticsBindings(analyticsBindings);
    return () => setAnalyticsBindings(null);
  }, [analyticsBindings, setAnalyticsBindings]);

  return (
    <div className="mx-auto max-w-[980px] space-y-5 p-4 font-sans sm:p-5 2xl:max-w-[1400px] 2xl:p-6">
      <header className="warm-panel rounded-[1.75rem] p-4 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Performance Analytics</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="text-muted-foreground">Standardized chart view</span>
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
        ].map(item => (
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

      {tab === "operational" && (
        <Operational
          patients={patients}
          filterRatio={filterRatio}
          days={days}
          activeFilter={activeFilter}
          applyFilter={applyFilter}
          onDrill={setDrillMetric}
          onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
        />
      )}
      {tab === "clinical" && (
        <Clinical
          patients={patients}
          filterRatio={filterRatio}
          days={days}
          activeFilter={activeFilter}
          applyFilter={applyFilter}
          onDrill={setDrillMetric}
          onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
        />
      )}
      {tab === "quality" && (
        <Quality
          patients={patients}
          filterRatio={filterRatio}
          days={days}
          activeFilter={activeFilter}
          applyFilter={applyFilter}
          onDrill={setDrillMetric}
          onViewPatients={(title, patientRows) => setGraphPatientsView({ title, patients: patientRows })}
        />
      )}
      {drillMetric && (
        <MetricDrillPanel patients={patients} filterRatio={filterRatio} metric={drillMetric} days={days} activeFilter={activeFilter} onClose={() => setDrillMetric(null)} />
      )}
      {graphPatientsView ? (
        <GraphPatientsPanel
          title={graphPatientsView.title}
          patients={graphPatientsView.patients}
          onClose={() => setGraphPatientsView(null)}
        />
      ) : null}
    </div>
  );
}

export function Operational({
  patients,
  filterRatio,
  days,
  activeFilter,
  applyFilter,
  onDrill,
  onViewPatients,
}: {
  patients: typeof roster;
  filterRatio: number;
  days: string[];
  activeFilter: DashboardFilter | null;
  applyFilter: (filter: DashboardFilter) => void;
  onDrill: (metric: Metric) => void;
  onViewPatients: (title: string, patients: typeof roster) => void;
}) {
  const [footfallView, setFootfallView] = useState<FootfallView>("hour");
  const [protocolView, setProtocolView] = useState<ProtocolView>("day");
  const multiplier = filterRatio;
  const existingMetricIds = ["iaTat", "erTat", "bedOcc", "ppd", "mlcCases"];
  const suggestedMetricIds = ["avgLos", "dispositionTat", "ppn"];
  const existingMetrics = existingMetricIds.map(id => METRICS.find(m => m.id === id)!);
  const suggestedMetrics = suggestedMetricIds.map(id => METRICS.find(m => m.id === id)!);
  const footfall = buildFootfall(days, multiplier);
  const footfallRollup = rollupFootfall(footfallView, footfall);
  const highestFootfall = Math.max(...footfallRollup.map(row => row.patients));
  const sectionPatients = filterPatients(patients, activeFilter);
  const triageDist = buildTriagePieRows(sectionPatients);
  const disposition = buildDispositionPieRows(sectionPatients);
  const triageVsDispo = buildTriageDispositionRows(sectionPatients);
  const protocolRows = buildProtocolStackRows(protocolView, multiplier);
  const stageData = [
    { name: "Registration", value: scale(11, multiplier), color: COLORS.muted },
    { name: "Triage", value: scale(16, multiplier), color: getEntityColor("Triage", COLORS.amber) },
    { name: "Consult", value: scale(42, multiplier), color: getEntityColor("Consult", COLORS.coral) },
    { name: "Investigations", value: scale(67, multiplier), color: getEntityColor("Investigations", COLORS.blue) },
    { name: "Disposition", value: scale(34, multiplier), color: getEntityColor("Disposition", COLORS.navy) },
  ];

  return (
    <div className="space-y-5">
      <Section title="Operational KPIs">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {existingMetrics.map(metric => (
            <MetricCard key={metric.id} metric={metric} days={days} activeFilter={activeFilter} filterRatio={filterRatio} onDrill={onDrill} />
          ))}
        </div>
      </Section>

      <Section title="Triage and Disposition">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
          <PieAnalyticsCard
            title="Patient Disposition"
            data={disposition}
            activeFilter={activeFilter}
            onSelect={label => applyFilter({ source: "Disposition", label })}
            patients={sectionPatients}
            onViewPatients={onViewPatients}
          />
          <PieAnalyticsCard
            title="Triage Categories Distribution"
            data={triageDist}
            activeFilter={activeFilter}
            onSelect={label => applyFilter({ source: "Triage", label })}
            patients={sectionPatients}
            onViewPatients={onViewPatients}
          />
          <StackedBarCard
            title="Triage Levels vs ER Disposition"
            data={triageVsDispo}
            xKey="name"
            keys={["Discharged", "Admitted", "Referred", "LAMA", "Expired"]}
            activeFilter={activeFilter}
            onSelect={(label, payload) => applyFilter({
              source: isDispositionFilterLabel(label) ? "Disposition" : "Triage",
              label: isDispositionFilterLabel(label) ? label : String(payload?.name ?? label),
            })}
            patients={sectionPatients}
            onViewPatients={onViewPatients}
          />
        </div>
      </Section>

      <Section title="Footfall">
        <div className="grid grid-cols-1 items-stretch gap-4">
          <ChartCard
            title="Footfall"
            action={
              <div className="flex items-center gap-2">
                <PatientListLink title="Footfall" patients={sectionPatients} onViewPatients={onViewPatients} />
                <Segmented value={footfallView} options={["hour", "shift", "day", "month", "year"]} onChange={setFootfallView} />
              </div>
            }
            active={Boolean(activeFilter)}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={footfallRollup} margin={{ top: 20, right: 18, left: 8, bottom: 36 }} onClick={event => selectFromChart(event, "Footfall", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" tick={axisTick} height={52} />
                <YAxis tick={axisTick} label={axisLabel("Patients")} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="patients" radius={BAR_RADIUS}>
                  {footfallRollup.map(row => (
                    <Cell key={row.name} fill={row.patients === highestFootfall ? COLORS.coral : COLORS.navy} />
                  ))}
                  <LabelList dataKey="patients" position="top" fill={COLORS.navy} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </Section>

      <Section title="Arrival and Stage Time">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {suggestedMetrics.map(metric => (
            <MetricCard key={metric.id} metric={metric} days={days} activeFilter={activeFilter} filterRatio={filterRatio} onDrill={onDrill} />
          ))}
        </div>
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <StackedBarCard
            title="Ambulance vs Walk In"
            data={footfall.slice(-10).map(row => ({ name: fmtShort(row.date), Ambulance: row.ambulance, "Walk In": row.walkIn }))}
            xKey="name"
            keys={["Ambulance", "Walk In"]}
            activeFilter={activeFilter}
            onSelect={label => applyFilter({ source: "Arrival Mode", label })}
            patients={sectionPatients}
            onViewPatients={onViewPatients}
          />
          <DonutCard
            title="Time Taken Breakdown by Stage"
            data={stageData}
            activeFilter={activeFilter}
            suggested
            onSelect={label => applyFilter({ source: "Stage Delay", label })}
            patients={sectionPatients}
            onViewPatients={onViewPatients}
          />
        </div>
      </Section>

      <Section title="Patient Demographics">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <LineAnalyticsCard
            title="Male vs Female Admission Trends"
            data={footfall.map(row => ({ name: fmtShort(row.date), Male: row.Male, Female: row.Female }))}
            keys={["Male", "Female"]}
            activeFilter={activeFilter}
            onSelect={label => applyFilter({ source: "Admission Trend", label })}
            patients={sectionPatients}
            onViewPatients={onViewPatients}
          />
          <StackedBarCard
            title="Age Group with Gender Distribution"
            data={buildAgeGenderRows(sectionPatients, multiplier)}
            xKey="name"
            keys={["Male", "Female"]}
            activeFilter={activeFilter}
            onSelect={(label, payload) => applyFilter({
              source: isGenderFilterLabel(label) ? "Gender" : "Age Group",
              label: isGenderFilterLabel(label) ? label : String(payload?.name ?? label),
            })}
            patients={sectionPatients}
            onViewPatients={onViewPatients}
          />
        </div>
      </Section>

      <Section title="Beds and Protocol Orders">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <BedOccupancyTable activeFilter={activeFilter} patients={sectionPatients} onViewPatients={onViewPatients} />
          <ChartCard
            title="Protocol Set Ordered"
            action={
              <div className="flex items-center gap-2">
                <Segmented value={protocolView} options={["day", "week", "month", "pathway"]} onChange={setProtocolView} />
                <PatientListLink title="Protocol Set Ordered" patients={sectionPatients} onViewPatients={onViewPatients} />
              </div>
            }
            active={Boolean(activeFilter)}
          >
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={protocolRows} layout="vertical" margin={{ top: 12, right: 34, left: 86, bottom: 12 }} onClick={event => selectFromChart(event, "Protocol Orders", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={axisTick} label={axisLabel("Orders", "insideBottom", 0)} />
                <YAxis dataKey="name" type="category" width={94} tick={axisTick} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <RLegend content={<RawLegendContent />} />
                {protocolSegmentKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="protocol"
                    fill={getEntityColor(key, getSeriesColor(key, index))}
                    radius={index === protocolSegmentKeys.length - 1 ? HORIZONTAL_BAR_RADIUS : [0, 0, 0, 0]}
                  >
                    {index === protocolSegmentKeys.length - 1 ? (
                      <LabelList content={renderHorizontalStackTotalLabel(protocolSegmentKeys)} />
                    ) : null}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </Section>
    </div>
  );
}

export function Clinical({
  patients,
  filterRatio,
  days,
  activeFilter,
  applyFilter,
  onDrill,
  onViewPatients,
}: {
  patients: typeof roster;
  filterRatio: number;
  days: string[];
  activeFilter: DashboardFilter | null;
  applyFilter: (filter: DashboardFilter) => void;
  onDrill: (metric: Metric) => void;
  onViewPatients: (title: string, patients: typeof roster) => void;
}) {
  const multiplier = filterRatio;
  const kpis = ["carePlan", "doorThromb", "doorBalloon", "investigationTat"].map(id => METRICS.find(m => m.id === id)!);
  const mewsTrend = buildMewsTrend(days, multiplier);
  const sectionPatients = filterPatients(patients, activeFilter);

  return (
    <div className="space-y-5">
      <Section title="Clinical Recognition and Pathway Activation">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {kpis.slice(0, 3).map(metric => (
            <MetricCard key={metric.id} metric={metric} days={days} activeFilter={activeFilter} filterRatio={filterRatio} onDrill={onDrill} />
          ))}
          <MewsCard data={mewsTrend} onClick={() => onDrill({ id: "mews", label: "MEWS", group: "clinical", kind: "score", baseline: 0, target: "Risk trajectory", tone: "amber", Icon: HeartPulse, fmt: v => v.toFixed(1) })} />
          <MetricCard metric={kpis[3]} days={days} activeFilter={activeFilter} filterRatio={filterRatio} onDrill={onDrill} />
        </div>
      </Section>

      <Section title="Care Pathways and Daily Case Mix">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <ChartCard
            title="ER Cases by Care Pathway"
            active={Boolean(activeFilter)}
            action={<PatientListLink title="ER Cases by Care Pathway" patients={sectionPatients} onViewPatients={onViewPatients} />}
          >
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={buildPathwayCaseRows(sectionPatients, multiplier)} margin={{ top: 20, right: 24, left: 8, bottom: 52 }} onClick={event => selectFromChart(event, "Care Pathway", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" interval={0} angle={-22} textAnchor="end" tick={axisTick} height={66} />
                <YAxis tick={axisTick} label={axisLabel("Cases")} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="Total" fill={COLORS.navy} radius={BAR_RADIUS}>
                  <LabelList dataKey="Total" position="top" fill={COLORS.navy} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <LineAnalyticsCard
            title="ER Cases by Day"
            data={buildDailyCases(days, multiplier).map(row => ({ name: fmtShort(row.date), Cases: row.cases }))}
            keys={["Cases"]}
            activeFilter={activeFilter}
            onSelect={label => applyFilter({ source: "Daily ER Cases", label })}
            patients={sectionPatients}
            onViewPatients={onViewPatients}
            suggested
          />
        </div>
      </Section>

      <Section title="Orders and Treatment Utilisation">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <RankList
            title="Top 15 Medications Prescribed"
            Icon={Pill}
            items={scaleRankItems(medicationsBase, multiplier)}
            onSelect={label => applyFilter({ source: "Medication", label })}
            patients={sectionPatients}
            onViewPatients={onViewPatients}
          />
          <RankList
            title="Top 15 Investigations Ordered"
            Icon={FlaskConical}
            items={scaleRankItems(investigationsBase, multiplier)}
            onSelect={label => applyFilter({ source: "Investigation", label })}
            patients={sectionPatients}
            onViewPatients={onViewPatients}
          />
        </div>
      </Section>
    </div>
  );
}

export function Quality({
  patients,
  filterRatio,
  days,
  activeFilter,
  applyFilter,
  onDrill,
  onViewPatients,
}: {
  patients: typeof roster;
  filterRatio: number;
  days: string[];
  activeFilter: DashboardFilter | null;
  applyFilter: (filter: DashboardFilter) => void;
  onDrill: (metric: Metric) => void;
  onViewPatients: (title: string, patients: typeof roster) => void;
}) {
  const [referralView, setReferralView] = useState<ReferralView>("reason");
  const [lamaView, setLamaView] = useState<LamaView>("reason");
  const multiplier = filterRatio;
  const sectionPatients = filterPatients(patients, activeFilter);
  const outcome = ["mortality", "lamaRate", "lwbsRate", "readmit72", "returnRate"].map(id => METRICS.find(m => m.id === id)!);
  const experience = ["satisfaction", "bedCleaning", "bedCleaningTat"].map(id => METRICS.find(m => m.id === id)!);
  const referralRows = buildReferralRows(referralView, multiplier);
  const lamaRows = lamaView === "reason" ? scaleNamedRows(lamaReasonBase, multiplier) : scaleNamedRows(lamaPinBase, multiplier);

  return (
    <div className="space-y-5">
      <Section title="Safety Outcomes">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {outcome.map(metric => (
            <MetricCard key={metric.id} metric={metric} days={days} activeFilter={activeFilter} filterRatio={filterRatio} onDrill={onDrill} />
          ))}
        </div>
      </Section>

      <Section title="Experience, Readiness, and Bed Turnover">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {experience.map(metric => (
            <MetricCard key={metric.id} metric={metric} days={days} activeFilter={activeFilter} filterRatio={filterRatio} onDrill={onDrill} />
          ))}
        </div>
      </Section>

      <Section title="Referrals and LAMA">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <ChartCard
            title="Outward Referral Analysis"
            action={
              <div className="flex items-center gap-2">
                <PatientListLink title="Outward Referral Analysis" patients={sectionPatients} onViewPatients={onViewPatients} />
                <Segmented value={referralView} options={["hour", "weekday", "month", "reason"]} onChange={setReferralView} />
              </div>
            }
            active={Boolean(activeFilter)}
          >
            <ResponsiveContainer width="100%" height={245}>
              <BarChart data={referralRows} margin={{ top: 20, right: 24, left: 8, bottom: 48 }} onClick={event => selectFromChart(event, "Outward Referral", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" tick={axisTick} height={60} />
                <YAxis tick={axisTick} label={axisLabel("Cases")} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={COLORS.navy} radius={BAR_RADIUS}>
                  <LabelList dataKey="value" position="top" fill={COLORS.navy} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="LAMA Analysis"
            action={
              <div className="flex items-center gap-2">
                <PatientListLink title="LAMA Analysis" patients={sectionPatients} onViewPatients={onViewPatients} />
                <Segmented value={lamaView} options={["reason", "pincode"]} onChange={setLamaView} />
              </div>
            }
            active={Boolean(activeFilter)}
          >
            <ResponsiveContainer width="100%" height={245}>
              <BarChart data={lamaRows} margin={{ top: 20, right: 24, left: 8, bottom: 48 }} onClick={event => selectFromChart(event, "LAMA", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" tick={axisTick} height={60} />
                <YAxis tick={axisTick} label={axisLabel("Cases")} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={COLORS.coral} radius={BAR_RADIUS}>
                  <LabelList dataKey="value" position="top" fill={COLORS.navy} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </Section>
    </div>
  );
}

export function DateFilter({
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
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-white p-1.5 shadow-soft">
      <Calendar className="mx-2 h-4 w-4 text-coral" />
      {(["7d", "30d", "90d"] as RangeId[]).map(value => (
        <button
          key={value}
          onClick={() => setRange(value)}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${range === value ? "bg-navy text-white" : "text-muted-foreground hover:bg-secondary/70 hover:text-navy"}`}
        >
          {value === "7d" ? "7 days" : value === "30d" ? "30 days" : "90 days"}
        </button>
      ))}
      <button
        onClick={() => setRange("custom")}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${range === "custom" ? "bg-navy text-white" : "text-muted-foreground hover:bg-secondary/70 hover:text-navy"}`}
      >
        Custom
      </button>
      {range === "custom" && (
        <div className="flex items-center gap-1.5 border-l border-border pl-2">
          <input type="date" value={custom.from} onChange={event => setCustom({ ...custom, from: event.target.value })} className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-navy" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={custom.to} onChange={event => setCustom({ ...custom, to: event.target.value })} className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-navy" />
        </div>
      )}
    </div>
  );
}

export function FilterPill({ activeFilter, onClear }: { activeFilter: DashboardFilter | null; onClear: () => void }) {
  if (!activeFilter) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 rounded-full border border-coral/30 bg-coral/10 px-3 py-2 text-xs font-bold text-navy shadow-soft animate-in fade-in slide-in-from-right-2">
      <span className="text-coral">Filtered:</span>
      <span>{activeFilter.source} - {activeFilter.label}</span>
      <button onClick={onClear} className="grid h-6 w-6 place-items-center rounded-full bg-white text-coral hover:bg-coral hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-navy">{title}</h2>
      {children}
    </section>
  );
}

function MetricCard({
  metric,
  days,
  activeFilter,
  filterRatio,
  onDrill,
}: {
  metric: Metric;
  days: string[];
  activeFilter: DashboardFilter | null;
  filterRatio: number;
  onDrill: (metric: Metric) => void;
}) {
  const series = useMemo(() => buildSeries(metric, days, filterRatio), [metric, days, filterRatio]);
  const avg = series.reduce((sum, item) => sum + item.value, 0) / Math.max(series.length, 1);
  const Icon = metric.Icon;

  return (
    <button
      onClick={() => onDrill(metric)}
      className={`group min-h-[92px] rounded-2xl bg-card p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg ${
        metric.isNew ? "border-2 border-dashed border-coral/70" : "border border-border/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-muted-foreground">{metric.label}</span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl text-white" style={{ background: COLORS[metric.tone] }}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-xl font-bold tracking-tight text-navy">{metric.fmt(avg)}</div>
      <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] font-medium text-muted-foreground">
        <span>{metric.target}</span>
        <ChevronRight className="h-3.5 w-3.5 text-coral opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </button>
  );
}

function MewsCard({ data, onClick }: { data: { admission: number; discharge: number }[]; onClick: () => void }) {
  const latest = data[data.length - 1] ?? { admission: 4.6, discharge: 1.8 };
  return (
    <button
      onClick={onClick}
      className="group min-h-[92px] rounded-2xl border border-border/80 bg-card p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-muted-foreground">MEWS</span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-coral text-white">
          <HeartPulse className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2 text-xl font-bold tracking-tight">
        <span className="text-coral">{latest.admission.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">to</span>
        <span className="text-green-600">{latest.discharge.toFixed(1)}</span>
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
        <span>Risk trajectory</span>
        <ChevronRight className="h-3.5 w-3.5 text-coral opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </button>
  );
}

function ChartCard({
  title,
  action,
  active,
  suggested,
  children,
}: {
  title: string;
  action?: ReactNode;
  active?: boolean;
  suggested?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex h-full min-h-[348px] flex-col rounded-[1.5rem] bg-card p-4 shadow-soft transition-all ${
        suggested ? "border-2 border-dashed border-coral/70" : "border border-border/80"
      } ${active ? "ring-2 ring-coral/10" : ""}`}
    >
      <div className="mb-2 flex min-h-8 flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-navy">{title}</h3>
        {action}
      </div>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </div>
  );
}

function PatientListLink({
  title,
  patients,
  onViewPatients,
}: {
  title: string;
  patients: typeof roster;
  onViewPatients: (title: string, patients: typeof roster) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onViewPatients(title, patients)}
      className="shrink-0 rounded-full border border-coral/30 bg-coral/10 px-2 py-0.5 text-[10px] font-semibold text-coral transition-colors hover:bg-coral hover:text-white"
    >
      Show data
    </button>
  );
}

function PieAnalyticsCard({
  title,
  data,
  activeFilter,
  onSelect,
  patients,
  onViewPatients,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  activeFilter: DashboardFilter | null;
  onSelect: (label: string) => void;
  patients: typeof roster;
  onViewPatients: (title: string, patients: typeof roster) => void;
}) {
  return (
    <ChartCard
      title={title}
      active={Boolean(activeFilter)}
      action={<PatientListLink title={title} patients={patients} onViewPatients={onViewPatients} />}
    >
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={82}
            paddingAngle={3}
            label={({ value }) => value}
            labelLine={false}
            onClick={(row: { name: string }) => onSelect(row.name)}
            animationDuration={450}
          >
            {data.map(item => (
              <Cell
                key={item.name}
                fill={item.color}
                stroke={activeFilter?.label === item.name ? COLORS.navy : "white"}
                strokeWidth={activeFilter?.label === item.name ? 4 : 2}
                className="cursor-pointer transition-opacity hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip cursor={false} contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <Legend items={data} />
    </ChartCard>
  );
}

function StackedBarCard({
  title,
  data,
  xKey,
  keys,
  activeFilter,
  suggested,
  onSelect,
  patients,
  onViewPatients,
}: {
  title: string;
  data: Record<string, string | number>[];
  xKey: string;
  keys: string[];
  activeFilter: DashboardFilter | null;
  suggested?: boolean;
  onSelect: (label: string, payload?: Record<string, string | number>) => void;
  patients: typeof roster;
  onViewPatients: (title: string, patients: typeof roster) => void;
}) {
  return (
    <ChartCard
      title={title}
      active={Boolean(activeFilter)}
      suggested={suggested}
      action={<PatientListLink title={title} patients={patients} onViewPatients={onViewPatients} />}
    >
      <ResponsiveContainer width="100%" height={330}>
        <BarChart
          data={data}
          margin={{ top: 24, right: 18, left: 8, bottom: 58 }}
          onClick={event => selectFromChart(event, title, (_, payload, seriesKey) => onSelect(seriesKey ?? String(payload?.name ?? payload?.[xKey] ?? title), payload))}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} interval={0} angle={-16} textAnchor="end" tick={axisTick} height={64} />
          <YAxis tick={axisTick} label={axisLabel("Patients")} />
          <Tooltip cursor={false} contentStyle={tooltipStyle} />
          <RLegend content={<RawLegendContent />} />
          {stackBars(keys, data)}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function LineAnalyticsCard({
  title,
  data,
  keys,
  activeFilter,
  suggested,
  onSelect,
  patients,
  onViewPatients,
}: {
  title: string;
  data: Record<string, string | number>[];
  keys: string[];
  activeFilter: DashboardFilter | null;
  suggested?: boolean;
  onSelect: (label: string) => void;
  patients: typeof roster;
  onViewPatients: (title: string, patients: typeof roster) => void;
}) {
  return (
    <ChartCard
      title={title}
      active={Boolean(activeFilter)}
      suggested={suggested}
      action={<PatientListLink title={title} patients={patients} onViewPatients={onViewPatients} />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 28, left: 8, bottom: 48 }} onClick={event => selectFromChart(event, title, (_, payload) => onSelect(String(payload?.name ?? title)))}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" interval="preserveStartEnd" angle={-16} textAnchor="end" tick={axisTick} height={58} />
          <YAxis tick={axisTick} label={axisLabel("Value")} />
          <Tooltip cursor={false} contentStyle={tooltipStyle} />
          {keys.length > 1 && <RLegend content={<RawLegendContent />} />}
          {keys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={getSeriesColor(key, index)}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 2, fill: "white" }}
              activeDot={{ r: 6, fill: COLORS.amber, stroke: "white", strokeWidth: 2 }}
              animationDuration={450}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function DonutCard({
  title,
  data,
  activeFilter,
  suggested,
  onSelect,
  patients,
  onViewPatients,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  activeFilter: DashboardFilter | null;
  suggested?: boolean;
  onSelect: (label: string) => void;
  patients: typeof roster;
  onViewPatients: (title: string, patients: typeof roster) => void;
}) {
  return (
    <ChartCard
      title={title}
      active={Boolean(activeFilter)}
      suggested={suggested}
      action={<PatientListLink title={title} patients={patients} onViewPatients={onViewPatients} />}
    >
      <ResponsiveContainer width="100%" height={255}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={4} label={({ value }) => `${value}m`} labelLine={false} onClick={(row: { name: string }) => onSelect(row.name)}>
            {data.map(item => <Cell key={item.name} fill={item.color} stroke="white" strokeWidth={2} />)}
          </Pie>
          <Tooltip cursor={false} contentStyle={tooltipStyle} formatter={(value: number) => `${value} min`} />
        </PieChart>
      </ResponsiveContainer>
      <Legend items={data} />
    </ChartCard>
  );
}

function CriticalHoursCard({
  data,
  activeFilter,
  onSelect,
}: {
  data: { name: string; total: number; critical: number; intensity: number }[];
  activeFilter: DashboardFilter | null;
  onSelect: (label: string) => void;
}) {
  return (
    <div className={`rounded-[1.5rem] border-2 border-dashed border-coral/70 bg-card p-4 shadow-soft transition-all ${activeFilter ? "ring-2 ring-coral/10" : ""}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-navy">Critical Hours Identification</h3>
        <span className="text-xs font-semibold text-muted-foreground">Darker cards indicate higher critical volume</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {data.map(item => (
          <button
            key={item.name}
            onClick={() => onSelect(item.name)}
            className={`rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft ${
              activeFilter?.label === item.name ? "border-navy ring-2 ring-coral/20" : "border-border/70"
            }`}
            style={{ background: `rgba(255, 132, 100, ${0.12 + item.intensity * 0.28})` }}
          >
            <div className="text-xs font-bold text-navy">{item.name}</div>
            <div className="mt-1 text-xl font-bold text-navy">{item.critical}</div>
            <div className="text-[11px] text-muted-foreground">{item.total} total</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: readonly T[]; onChange: (value: T) => void }) {
  return (
    <div className="flex rounded-xl bg-secondary/70 p-1">
      {options.map(option => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-all ${
            value === option ? "bg-navy text-white" : "text-muted-foreground hover:bg-white hover:text-navy"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function RankList({
  title,
  Icon,
  items,
  onSelect,
  patients,
  onViewPatients,
}: {
  title: string;
  Icon: typeof Pill;
  items: { name: string; value: number }[];
  onSelect: (label: string) => void;
  patients: typeof roster;
  onViewPatients: (title: string, patients: typeof roster) => void;
}) {
  const max = Math.max(...items.map(item => item.value));
  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-bold text-navy">
          <Icon className="h-4 w-4 text-coral" />
          {title}
        </h3>
        <PatientListLink title={title} patients={patients} onViewPatients={onViewPatients} />
      </div>
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={item.name}>
            <button onClick={() => onSelect(item.name)} className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-all hover:bg-secondary/60">
              <span className="w-5 text-right text-xs font-bold tabular-nums text-muted-foreground">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-navy">{item.name}</span>
              <span className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                <span className="block h-full rounded-full bg-coral" style={{ width: `${(item.value / max) * 100}%` }} />
              </span>
              <span className="w-8 text-right text-sm font-bold tabular-nums text-navy">{item.value}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function BedOccupancyTable({
  activeFilter,
  patients,
  onViewPatients,
}: {
  activeFilter: DashboardFilter | null;
  patients: typeof roster;
  onViewPatients: (title: string, patients: typeof roster) => void;
}) {
  const multiplier = filterMultiplier(activeFilter);
  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-navy">Bed Occupancy by Area</h3>
          <p className="text-xs text-muted-foreground">Capacity view restored as a table</p>
        </div>
        <div className="flex items-center gap-2">
          <PatientListLink title="Bed Occupancy by Area" patients={patients} onViewPatients={onViewPatients} />
          <Bed className="h-5 w-5 text-coral" />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/70">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Area</th>
              <th className="px-3 py-2 text-right">Beds</th>
              <th className="px-3 py-2 text-right">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {wards.map(ward => {
              const occupied = Math.min(ward.total, Math.max(1, Math.round(ward.occupied * multiplier)));
              const pct = Math.round((occupied / ward.total) * 100);
              const tone = pct >= 90 ? COLORS.red : pct >= 75 ? COLORS.amber : COLORS.green;
              return (
                <tr key={ward.name} className="border-t border-border bg-white/70">
                  <td className="px-3 py-2 font-semibold text-navy">{ward.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{occupied}/{ward.total}</td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded-full px-2 py-1 text-xs font-bold text-white" style={{ background: tone }}>
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MetricDrillPanel({
  patients,
  filterRatio,
  metric,
  days,
  activeFilter,
  onClose,
}: {
  patients: typeof roster;
  filterRatio: number;
  metric: Metric;
  days: string[];
  activeFilter: DashboardFilter | null;
  onClose: () => void;
}) {
  const [mlcView, setMlcView] = useState<MlcView>("day");
  const multiplier = filterRatio;
  const providerRows = metric.id === "ppd" ? buildProviderDispositionRows(filterPatients(patients, activeFilter)) : [];
  const losTimeline = metric.id === "avgLos"
    ? buildSeries(metric, days, multiplier).map(row => ({ name: fmtShort(row.date), Value: Number(row.value.toFixed(1)) }))
    : [];
  const series = metric.id === "mews"
    ? buildMewsTrend(days, multiplier).map((row, index) => ({ name: fmtShort(days[index]), Admission: row.admission, Discharge: row.discharge }))
    : metric.id === "mlcCases"
      ? buildMlcTrend(days, mlcView, multiplier).map(row => ({ name: row.name ?? fmtShort(row.date), Value: row.value }))
      : metric.id === "avgLos"
        ? buildLosByPathway(multiplier)
        : buildSeries(metric, days, multiplier).map(row => ({ name: fmtShort(row.date), Value: metric.kind === "rate" ? row.value * 100 : row.value }));
  const patientRows = patientsFor(metric.id, patients, activeFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-background shadow-soft-lg" onClick={event => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background px-5 py-4">
          <div>
            <h3 className="font-bold text-navy">{metric.label}</h3>
            <p className="text-xs font-medium text-muted-foreground">
              Trend detail {activeFilter ? `filtered by ${activeFilter.source}: ${activeFilter.label}` : "for the selected date range"}
            </p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          {metric.id === "mlcCases" && (
            <div className="flex justify-end">
              <Segmented value={mlcView} options={["day", "week", "month"]} onChange={setMlcView} />
            </div>
          )}
          {metric.id === "mews" && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Trend</div>
                <div className="mt-1 text-lg font-bold text-navy">Admission vs Discharge MEWS</div>
              </div>
              <div className="rounded-2xl border border-navy/20 bg-navy/5 p-4 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-navy">Admission</div>
                <div className="mt-1 text-2xl font-bold text-navy">{(series[series.length - 1] as any)?.Admission?.toFixed?.(1) ?? "4.6"}</div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Discharge</div>
                <div className="mt-1 text-2xl font-bold text-emerald-700">{(series[series.length - 1] as any)?.Discharge?.toFixed?.(1) ?? "1.8"}</div>
              </div>
            </div>
          )}
          <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 shadow-soft">
            {metric.id === "mews" ? (
              <ChartContainer
                config={{
                  Admission: { label: "Admission MEWS", color: getEntityColor("AdmissionMEWS", COLORS.navy) },
                  Discharge: { label: "Discharge MEWS", color: getEntityColor("DischargeMEWS", COLORS.green) },
                }}
                className="h-[360px] w-full"
              >
                <LineChart data={series} margin={{ top: 26, right: 34, left: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" interval="preserveStartEnd" angle={-18} textAnchor="end" tick={axisTick} height={58} />
                  <YAxis tick={axisTick} domain={[0, 6]} label={axisLabel("MEWS Score")} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="Admission"
                    stroke="var(--color-Admission)"
                    strokeWidth={3.25}
                    dot={{ r: 4, fill: "white", stroke: "var(--color-Admission)", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: COLORS.amber, stroke: "white", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Discharge"
                    stroke="var(--color-Discharge)"
                    strokeWidth={3.25}
                    dot={{ r: 4, fill: "white", stroke: "var(--color-Discharge)", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: COLORS.amber, stroke: "white", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <ResponsiveContainer width="100%" height={metric.id === "mews" ? 360 : 300}>
                {metric.id === "avgLos" ? (
                <BarChart data={series} margin={{ top: 20, right: 28, left: 8, bottom: 52 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" tick={axisTick} height={64} />
                  <YAxis tick={axisTick} label={axisLabel("Hours")} />
                  <Tooltip cursor={false} contentStyle={tooltipStyle} />
                  <Bar dataKey="Value" fill={COLORS.coral} radius={BAR_RADIUS}>
                    <LabelList dataKey="Value" position="top" fill={COLORS.navy} fontSize={11} formatter={(value: number) => value.toFixed(1)} />
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={series} margin={{ top: 26, right: 34, left: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" interval="preserveStartEnd" angle={-18} textAnchor="end" tick={axisTick} height={58} />
                  <YAxis tick={axisTick} domain={metric.id === "mews" ? [0, 6] : undefined} label={axisLabel(metric.id === "mews" ? "MEWS Score" : metric.kind === "rate" ? "Percent" : metric.unit ?? "Value")} />
                  <Tooltip cursor={false} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="Value" stroke={COLORS.coral} strokeWidth={2.5} dot={{ r: 3, fill: "white" }} activeDot={{ r: 6, fill: COLORS.amber }} />
                </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
          {metric.id === "avgLos" && (
            <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-navy">Average LOS Timeline</div>
                  <div className="text-xs text-muted-foreground">Daily trend across the selected date range</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Latest</div>
                  <div className="text-lg font-bold text-navy">{losTimeline.at(-1)?.Value?.toFixed?.(1) ?? "3.8"} hr</div>
                </div>
              </div>
              <ChartContainer
                config={{
                  Value: { label: "Average LOS", color: COLORS.navy },
                }}
                className="h-[320px] w-full"
              >
                <LineChart data={losTimeline} margin={{ top: 20, right: 28, left: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" interval="preserveStartEnd" angle={-18} textAnchor="end" tick={axisTick} height={58} />
                  <YAxis tick={axisTick} label={axisLabel("Hours")} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="Value"
                    stroke="var(--color-Value)"
                    strokeWidth={3}
                    dot={{ r: 3.5, fill: "white", stroke: "var(--color-Value)", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: COLORS.amber, stroke: "white", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          )}
          {metric.id === "ppd" && (
            <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-navy">Provider-Wise Disposition Breakdown</div>
                  <div className="text-xs text-muted-foreground">Patients handled by each doctor split by current disposition</div>
                </div>
                <div className="text-right text-xs font-semibold text-muted-foreground">
                  {providerRows.length} providers
                </div>
              </div>
              <ChartContainer
                config={{
                  "ED Active": { label: "ED Active", color: getEntityColor("ED Active", COLORS.blue) },
                  Observation: { label: "Observation", color: getEntityColor("Observation", COLORS.amber) },
                  Discharged: { label: "Discharged", color: getEntityColor("Discharged", COLORS.green) },
                }}
                className="h-[320px] w-full"
              >
                <BarChart data={providerRows} margin={{ top: 18, right: 18, left: 8, bottom: 54 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" tick={axisTick} height={60} />
                  <YAxis tick={axisTick} allowDecimals={false} label={axisLabel("Patients")} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="ED Active" stackId="provider" fill="var(--color-ED Active)" radius={BAR_RADIUS} />
                  <Bar dataKey="Observation" stackId="provider" fill="var(--color-Observation)" radius={BAR_RADIUS} />
                  <Bar dataKey="Discharged" stackId="provider" fill="var(--color-Discharged)" radius={BAR_RADIUS}>
                    <LabelList content={renderStackTotalLabel(["ED Active", "Observation", "Discharged"])} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}

          <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-sm font-bold text-navy">Patient Snapshot</div>
                <div className="text-xs text-muted-foreground">Click through to the patient chart from this graph drilldown.</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-muted-foreground">{patientRows.length} records</div>
                <Link to="/patients" className="rounded-full border border-coral/30 bg-coral/10 px-2.5 py-1 text-[11px] font-semibold text-coral transition-colors hover:bg-coral hover:text-white">
                  Click to view patients
                </Link>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Patient</th>
                    <th className="px-4 py-2 text-left">UMR</th>
                    <th className="px-4 py-2 text-left">Triage</th>
                    <th className="px-4 py-2 text-left">Pathway</th>
                    <th className="px-4 py-2 text-left">Physician</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patientRows.map(patient => (
                    <tr key={patient.key} className="border-t border-border">
                      <td className="px-4 py-2 font-bold text-navy">
                        <Link to="/patient/$id/workspace" params={{ id: patient.key }} className="transition-colors hover:text-coral">
                          {patient.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 tabular-nums text-muted-foreground">{patient.umr}</td>
                      <td className="px-4 py-2 text-muted-foreground">Level {patient.triage || "Pending"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{patient.pathway}</td>
                      <td className="px-4 py-2 text-muted-foreground">{patient.physician}</td>
                      <td className="px-4 py-2 text-muted-foreground">{patient.status}</td>
                      <td className="px-4 py-2 text-right">
                        <Link to="/patient/$id/workspace" params={{ id: patient.key }} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-navy transition-colors hover:border-coral hover:text-coral">
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
    </div>
  );
}

function GraphPatientsPanel({
  title,
  patients,
  onClose,
}: {
  title: string;
  patients: typeof roster;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-background shadow-soft-lg" onClick={event => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background px-5 py-4">
          <div>
            <h3 className="font-bold text-navy">{title}</h3>
            <p className="text-xs font-medium text-muted-foreground">Patient list linked from this graph</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-muted-foreground">{patients.length} records</div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-secondary">
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
                {patients.map(patient => (
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
  );
}

function stackBars(keys: string[], data: Record<string, string | number>[]) {
  return keys.map((key, index) => (
    <Bar key={key} dataKey={key} stackId="stack" fill={getSeriesColor(key, index)}>
      {data.map((row, rowIndex) => (
        <Cell
          key={`${key}-${rowIndex}`}
          radius={isTopOfStack(keys, key, row) ? BAR_RADIUS : [0, 0, 0, 0]}
        />
      ))}
      {index === keys.length - 1 ? <LabelList content={renderStackTotalLabel(keys)} /> : null}
    </Bar>
  ));
}

function Legend({ items }: { items: { name: string; value: number; color: string }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map(item => (
        <button key={item.name} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/35 px-2 py-0.5 text-[10px] font-semibold text-navy transition-colors hover:bg-secondary/60">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          <span>{item.name}</span>
          <span className="font-bold tabular-nums text-navy">{item.value}</span>
        </button>
      ))}
    </div>
  );
}

function RawLegendContent(props: ComponentProps<typeof RLegend>) {
  const payload = props.payload?.filter(item => item.type !== "none") ?? [];

  if (!payload.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-4">
      {payload.map(item => (
        <div key={`${item.dataKey ?? item.value}`} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/35 px-2 py-0.5 text-[10px] font-semibold text-navy">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color ?? COLORS.navy }} />
          <span>{String(item.value ?? item.dataKey ?? "")}</span>
        </div>
      ))}
    </div>
  );
}

function getSeriesColor(key: string, index: number) {
  const fills = [COLORS.green, COLORS.navy, COLORS.coral, COLORS.amber, COLORS.red, COLORS.blue];
  return getEntityColor(key, fills[index % fills.length]);
}

function getEntityColor(key: string, fallback: string) {
  if (key in ENTITY_COLORS) {
    return ENTITY_COLORS[key as keyof typeof ENTITY_COLORS];
  }

  return fallback;
}

function isTopOfStack(keys: string[], currentKey: string, row: Record<string, string | number>) {
  const currentIndex = keys.indexOf(currentKey);
  if (currentIndex === -1 || Number(row[currentKey] ?? 0) <= 0) {
    return false;
  }

  return keys.slice(currentIndex + 1).every((key) => Number(row[key] ?? 0) <= 0);
}

function renderStackTotalLabel(keys: string[]) {
  return ({ x, y, width, payload }: { x?: number; y?: number; width?: number; payload?: Record<string, string | number> }) => {
    if (typeof x !== "number" || typeof y !== "number" || typeof width !== "number" || !payload) {
      return null;
    }

    const total = keys.reduce((sum, key) => sum + Number(payload[key] ?? 0), 0);
    if (!total) {
      return null;
    }

    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill={COLORS.navy}
        fontSize={11}
        fontWeight={700}
        textAnchor="middle"
      >
        {total}
      </text>
    );
  };
}

function renderHorizontalStackTotalLabel(keys: readonly string[]) {
  return ({ x, y, width, height, payload }: { x?: number; y?: number; width?: number; height?: number; payload?: Record<string, string | number> }) => {
    if (typeof x !== "number" || typeof y !== "number" || typeof width !== "number" || typeof height !== "number" || !payload) {
      return null;
    }

    const total = keys.reduce((sum, key) => sum + Number(payload[key] ?? 0), 0);
    if (!total) {
      return null;
    }

    return (
      <text
        x={x + width + 8}
        y={y + height / 2}
        fill={COLORS.navy}
        fontSize={11}
        fontWeight={700}
        dominantBaseline="middle"
      >
        {total}
      </text>
    );
  };
}

export function dateRangeDays(range: RangeId, custom: { from: string; to: string }) {
  const out: string[] = [];
  const today = new Date();
  if (range === "custom" && custom.from && custom.to) {
    const start = new Date(custom.from);
    const end = new Date(custom.to);
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      out.push(cursor.toISOString().slice(0, 10));
    }
    return out.length ? out : [today.toISOString().slice(0, 10)];
  }
  const count = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  for (let i = count - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    out.push(day.toISOString().slice(0, 10));
  }
  return out;
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function seedRand(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function buildSeries(metric: Metric, days: string[], multiplier: number) {
  return days.map(date => {
    const noise = (seedRand(`${metric.id}-${date}`) - 0.5) * metric.baseline * 0.26;
    let value = (metric.baseline + noise) * (metric.kind === "rate" ? 1 + (multiplier - 1) * 0.25 : multiplier);
    if (metric.kind === "rate") value = Math.max(0, Math.min(1, value));
    return { date, value: Number(value.toFixed(4)) };
  });
}

function buildFootfall(days: string[], multiplier: number) {
  return days.map(date => {
    const total = scale(92 + seedRand(`ff-${date}`) * 72, multiplier);
    const ambulance = Math.round(total * (0.21 + seedRand(`amb-${date}`) * 0.13));
    const male = Math.round(total * (0.52 + seedRand(`sex-${date}`) * 0.08));
    return {
      date,
      patients: total,
      ambulance,
      walkIn: total - ambulance,
      Male: male,
      Female: total - male,
    };
  });
}

function rollupFootfall(view: FootfallView, footfall: ReturnType<typeof buildFootfall>) {
  if (view === "hour") {
    return Array.from({ length: 24 }, (_, hour) => ({
      name: `${String(hour).padStart(2, "0")}:00`,
      patients: Math.round(4 + seedRand(`hour-${hour}`) * 16 + (hour >= 10 && hour <= 22 ? 7 : 0)),
    }));
  }
  if (view === "shift") {
    return [
      { name: "Morning", patients: 112 },
      { name: "Evening", patients: 138 },
      { name: "Night", patients: 74 },
    ];
  }
  if (view === "month") {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => ({ name: month, patients: Math.round(2400 + seedRand(`month-${index}`) * 520) }));
  }
  if (view === "year") {
    return ["2022", "2023", "2024", "2025", "2026"].map((year, index) => ({ name: year, patients: Math.round(26000 + seedRand(`year-${index}`) * 5200) }));
  }
  return footfall.slice(-14).map(row => ({ name: fmtShort(row.date), patients: row.patients }));
}

function buildMlcTrend(days: string[], view: MlcView, multiplier: number) {
  if (view === "week") {
    return Array.from({ length: 6 }, (_, index) => ({ name: `Week ${index + 1}`, date: days[Math.max(0, days.length - 1 - index * 7)] ?? days[0], value: scale(26 + seedRand(`mlcw-${index}`) * 18, multiplier) })).reverse();
  }
  if (view === "month") {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((name, index) => ({ name, date: days[0], value: scale(88 + seedRand(`mlcm-${index}`) * 38, multiplier) }));
  }
  return days.slice(-14).map(date => ({ date, value: scale(2 + seedRand(`mlc-${date}`) * 8, multiplier) }));
}

function buildMewsTrend(days: string[], multiplier: number) {
  return days.map(date => ({
    admission: Number((4.4 + seedRand(`adm-${date}`) * 1.1 * multiplier).toFixed(1)),
    discharge: Number((1.5 + seedRand(`dis-${date}`) * 0.7 * Math.max(0.7, multiplier)).toFixed(1)),
  }));
}

function buildDailyCases(days: string[], multiplier: number) {
  return days.slice(-21).map(date => ({ date, cases: scale(40 + seedRand(`cases-${date}`) * 36, multiplier) }));
}

function buildCriticalHours(multiplier: number) {
  const slots = ["00-03", "03-06", "06-09", "09-12", "12-15", "15-18", "18-21", "21-24"];
  return slots.map((name, index) => {
    const critical = scale(3 + seedRand(`critical-${index}`) * 15 + (index >= 4 && index <= 6 ? 8 : 0), multiplier);
    const total = scale(22 + seedRand(`total-${index}`) * 42 + (index >= 3 && index <= 6 ? 18 : 0), multiplier);
    return { name, critical, total, intensity: critical / 25 };
  });
}

function buildProtocolStackRows(view: ProtocolView, multiplier: number) {
  const base = view === "pathway"
    ? ["Cardiac", "Sepsis", "Trauma", "Stroke", "Respiratory", "Toxicology", "Snakebite"]
    : view === "month"
      ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
      : view === "week"
        ? ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return base.map((name, index) => ({
    name,
    Infusions: scale(3 + seedRand(`${view}-inf-${index}`) * 9, multiplier),
    Investigations: scale(8 + seedRand(`${view}-inv-${index}`) * 15, multiplier),
    Medications: scale(7 + seedRand(`${view}-med-${index}`) * 14, multiplier),
    Procedures: scale(2 + seedRand(`${view}-proc-${index}`) * 7, multiplier),
  }));
}

function buildReferralRows(view: ReferralView, multiplier: number) {
  if (view === "reason") return scaleNamedRows(referralBase, multiplier);
  if (view === "hour") return ["00-06", "06-12", "12-18", "18-24"].map((name, index) => ({ name, value: scale(2 + seedRand(`refh-${index}`) * 8, multiplier) }));
  if (view === "weekday") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, index) => ({ name, value: scale(3 + seedRand(`refw-${index}`) * 7, multiplier) }));
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((name, index) => ({ name, value: scale(18 + seedRand(`refm-${index}`) * 12, multiplier) }));
}

function buildComplaintRows(view: ComplaintView, multiplier: number) {
  if (view === "shift") return ["Morning", "Evening", "Night"].map((name, index) => ({ name, value: scale(3 + seedRand(`coms-${index}`) * 8, multiplier) }));
  if (view === "day") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, index) => ({ name, value: scale(4 + seedRand(`comd-${index}`) * 9, multiplier) }));
  return ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"].map((name, index) => ({ name, value: scale(1 + seedRand(`comh-${index}`) * 7, multiplier) }));
}

function buildLosByPathway(multiplier: number) {
  return pathwayCasesBase.map((row, index) => ({ name: row.name, Value: Number(((2.1 + seedRand(`los-${index}`) * 4.4) * multiplier).toFixed(1)) }));
}

function scaleRankItems(items: readonly (readonly [string, number])[], multiplier: number) {
  return items.map(([name, value]) => ({ name, value: scale(value, multiplier) }));
}

function scaleNamedRows(rows: { name: string; value: number }[], multiplier: number) {
  return rows.map(row => ({ ...row, value: scale(row.value, multiplier) }));
}

function filterPatients<T extends { triage: number; status: string }>(patients: T[], activeFilter: DashboardFilter | null) {
  if (!activeFilter) return patients;
  return patients.filter(patient => matchesPatientFilter(patient as (typeof roster)[number], activeFilter));
}

function buildDispositionPieRows<T extends { status: string }>(patients: T[]) {
  const counts = new Map<string, number>(dispositionDist.map(item => [item.name, 0]));
  patients.forEach(patient => {
    const label = patientDispositionLabel(patient as (typeof roster)[number]);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return dispositionDist.map(item => ({ ...item, value: counts.get(item.name) ?? 0 }));
}

function buildTriagePieRows<T extends { triage: number }>(patients: T[]) {
  const base = windowSafeTriageDist();
  const counts = new Map<string, number>(base.map(item => [item.name, 0]));
  patients.forEach(patient => {
    const label = triageLabelFor(patient.triage);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return base.map(item => ({ ...item, value: counts.get(item.name) ?? 0 }));
}

function buildTriageDispositionRows<T extends { triage: number; status: string }>(patients: T[]) {
  const rows = [
    { name: "Level I", Discharged: 0, Admitted: 0, Referred: 0, LAMA: 0, Expired: 0 },
    { name: "Level II", Discharged: 0, Admitted: 0, Referred: 0, LAMA: 0, Expired: 0 },
    { name: "Level III", Discharged: 0, Admitted: 0, Referred: 0, LAMA: 0, Expired: 0 },
    { name: "Not Triaged", Discharged: 0, Admitted: 0, Referred: 0, LAMA: 0, Expired: 0 },
  ];

  patients.forEach(patient => {
    const triageLabel = triageLabelFor(patient.triage);
    const dispositionLabel = dispositionSeriesKey(patientDispositionLabel(patient as (typeof roster)[number]));
    const row = rows.find(item => item.name === triageLabel);
    if (!row) return;
    if (dispositionLabel in row) {
      row[dispositionLabel as keyof typeof row] = Number(row[dispositionLabel as keyof typeof row]) + 1 as never;
    }
  });

  return rows;
}

function buildAgeGenderRows<T extends { age: number; sex: string }>(patients: T[], multiplier: number) {
  if (!patients.length) {
    return ageGenderBase.map(row => ({
      ...row,
      Male: scale(row.Male, multiplier),
      Female: scale(row.Female, multiplier),
    }));
  }

  const rows = [
    { name: "0-18", Male: 0, Female: 0 },
    { name: "19-35", Male: 0, Female: 0 },
    { name: "36-55", Male: 0, Female: 0 },
    { name: "56-75", Male: 0, Female: 0 },
    { name: "76+", Male: 0, Female: 0 },
  ];

  patients.forEach(patient => {
    const age = patient.age ?? 0;
    const row =
      age <= 18 ? rows[0] :
      age <= 35 ? rows[1] :
      age <= 55 ? rows[2] :
      age <= 75 ? rows[3] :
      rows[4];
    if (patient.sex === "F") row.Female += 1;
    else row.Male += 1;
  });

  return rows;
}

function buildPathwayCaseRows<T extends { pathway: string }>(patients: T[], multiplier: number) {
  const counts = new Map<string, number>(pathwayCasesBase.map(row => [row.name, 0]));

  patients.forEach(patient => {
    const bucket = pathwayBucketFor(patient.pathway);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  });

  return pathwayCasesBase.map(row => ({
    ...row,
    Total: patients.length ? counts.get(row.name) ?? 0 : scale(row.Total, multiplier),
    Day: patients.length ? Math.round((counts.get(row.name) ?? 0) * 0.18) : scale(row.Day, multiplier),
  }));
}

function applyFilterToRows<T extends Record<string, string | number>>(rows: T[], activeFilter: DashboardFilter | null) {
  if (!rows.length || !activeFilter) return rows;
  const numericKeys = Object.entries(rows[0])
    .filter(([key, value]) => key !== "name" && typeof value === "number")
    .map(([key]) => key);
  const seriesLabel = normalizeSeriesFilterLabel(activeFilter.label);

  if (numericKeys.includes(seriesLabel)) {
    return rows.map(row => {
      const next: Record<string, string | number> = { ...row };
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value === "number" && key !== "name") {
          next[key] = key === seriesLabel ? value : 0;
        }
      });
      return next as T;
    });
  }

  if (rows.some(row => String(row.name) === activeFilter.label)) {
    return rows.map(row => {
      if (String(row.name) !== activeFilter.label) {
        const next: Record<string, string | number> = { ...row };
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === "number" && key !== "name") next[key] = 0;
        });
        return next as T;
      }
      return row;
    });
  }

  const multiplier = filterMultiplier(activeFilter);
  return rows.map(row => {
    const next: Record<string, string | number> = { ...row };
    Object.entries(row).forEach(([key, value]) => {
      if (typeof value === "number") next[key] = scale(value, multiplier);
    });
    return next as T;
  });
}

function applyFilterToPie(rows: { name: string; value: number; color: string }[], activeFilter: DashboardFilter | null) {
  if (activeFilter?.source === "Disposition" || activeFilter?.source === "Triage") {
    return rows.map(row => ({ ...row, value: row.name === activeFilter.label ? row.value : 0 }));
  }
  const multiplier = filterMultiplier(activeFilter);
  return rows.map(row => ({ ...row, value: activeFilter?.label === row.name ? scale(row.value, 1.18) : scale(row.value, multiplier) }));
}

function windowSafeTriageDist() {
  return triageDist;
}

function filterMultiplier(activeFilter: DashboardFilter | null) {
  if (!activeFilter) return 1;
  const key = `${activeFilter.source}-${activeFilter.label}`;
  return 0.42 + seedRand(key) * 0.28;
}

function isSameFilter(current: DashboardFilter | null, next: DashboardFilter) {
  return current?.source === next.source && current.label === next.label;
}

function scale(value: number, multiplier: number) {
  return Math.max(1, Math.round(value * multiplier));
}

function filterImpactMultiplier(filteredCount: number, totalCount: number) {
  if (!totalCount) return 1;
  return Math.max(0.15, filteredCount / totalCount);
}

function buildProviderDispositionRows<T extends { physician: string; status: string }>(patients: T[]) {
  const rows = new Map<string, { name: string; "ED Active": number; Observation: number; Discharged: number; total: number }>();

  patients
    .filter(patient => patient.physician && patient.physician !== "-" && patient.physician !== "—")
    .forEach(patient => {
      const current = rows.get(patient.physician) ?? { name: patient.physician, "ED Active": 0, Observation: 0, Discharged: 0, total: 0 };
      if (patient.status === "discharged") current.Discharged += 1;
      else if (patient.status === "obs") current.Observation += 1;
      else current["ED Active"] += 1;
      current.total += 1;
      rows.set(patient.physician, current);
    });

  return Array.from(rows.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function patientsFor(metricId: string, patients: typeof roster, activeFilter: DashboardFilter | null) {
  const filteredRoster = patients.filter(patient => matchesPatientFilter(patient, activeFilter));
  const multiplier = filterImpactMultiplier(filteredRoster.length, patients.length);
  const count = activeFilter
    ? filteredRoster.length
    : Math.max(3, Math.min(patients.length, Math.ceil(patients.length * multiplier)));
  return filteredRoster.slice(0, count).map((patient, index) => ({
    ...patient,
    key: `${metricId}-${activeFilter?.label ?? "all"}-${patient.id}-${index}`,
  }));
}

function dispositionSeriesKey(label: string) {
  return ({
    Discharged: "Discharged",
    Admitted: "Admitted",
    "Referred Out": "Referred",
    LAMA: "LAMA",
    Expired: "Expired",
  } as Record<string, string>)[label] ?? label;
}

function matchesPatientFilter(patient: (typeof roster)[number], activeFilter: DashboardFilter | null) {
  if (!activeFilter) return true;

  if (activeFilter.source === "Disposition") {
    return patientDispositionLabel(patient) === activeFilter.label;
  }

  if (activeFilter.source === "Triage") {
    return triageLabelFor(patient.triage) === activeFilter.label;
  }

  if (activeFilter.source === "Arrival Mode") {
    return patientArrivalMode(patient) === activeFilter.label;
  }

  if (activeFilter.source === "Gender") {
    return patientGenderLabel(patient.sex) === activeFilter.label;
  }

  if (activeFilter.source === "Age Group") {
    return ageBucketFor(patient.age) === activeFilter.label;
  }

  if (activeFilter.source === "Care Pathway") {
    return pathwayBucketFor(patient.pathway) === activeFilter.label;
  }

  if (activeFilter.source === "Patients / Doctor") {
    return patient.physician === activeFilter.label;
  }

  return true;
}

function patientDispositionLabel(patient: (typeof roster)[number]) {
  if (patient.status === "discharged") return "Discharged";
  if (patient.status === "obs") return "Admitted";
  return "Admitted";
}

function triageLabelFor(triage: number) {
  return ({
    1: "Level I",
    2: "Level II",
    3: "Level III",
    0: "Not Triaged",
  } as Record<number, string>)[triage] ?? "Not Triaged";
}

function patientArrivalMode(patient: (typeof roster)[number]) {
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

function patientGenderLabel(sex: (typeof roster)[number]["sex"]) {
  if (sex === "F") return "Female";
  if (sex === "Other") return "Other";
  return "Male";
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
  return "Chest Pain";
}

function selectFromChart(
  event: any,
  source: string,
  setActiveFilter: ((filter: DashboardFilter) => void) | ((label: string, payload?: any, seriesKey?: string) => void),
) {
  const activePayload = event?.activePayload?.[0];
  const payload = activePayload?.payload;
  if (!payload) return;
  const label = String(payload.name ?? payload.date ?? payload.bucket ?? source);
  const seriesKey = activePayload?.dataKey ? String(activePayload.dataKey) : undefined;
  if (setActiveFilter.length >= 2) {
    (setActiveFilter as (label: string, payload?: any, seriesKey?: string) => void)(label, payload, seriesKey);
    return;
  }
  (setActiveFilter as (filter: DashboardFilter) => void)({ source, label });
}

function normalizeSeriesFilterLabel(label: string) {
  if (label === "Referred Out") return "Referred";
  return label;
}

function isDispositionFilterLabel(label: string) {
  return ["Discharged", "Admitted", "Referred", "Referred Out", "LAMA", "Expired"].includes(label);
}

function isGenderFilterLabel(label: string) {
  return ["Male", "Female", "Other"].includes(label);
}

const axisTick = { fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 600 };
const tooltipStyle = { borderRadius: 14, border: "1px solid var(--border)", background: "white", boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)" };

function axisLabel(value: string, position: "insideLeft" | "insideBottom" = "insideLeft", offset = -2) {
  return { value, angle: position === "insideLeft" ? -90 : 0, position, offset, style: { fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 700 } };
}

void TrendingUp;
void Stethoscope;
