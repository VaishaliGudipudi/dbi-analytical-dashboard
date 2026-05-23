import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
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
import { patients as roster, wards } from "@/lib/mockData";

export const Route = createFileRoute("/_app/analytics")({ component: Analytics });

type GroupId = "operational" | "clinical" | "quality";
type RangeId = "7d" | "30d" | "90d" | "custom";
type MetricKind = "rate" | "duration" | "count" | "score";
type Tone = "navy" | "coral" | "amber" | "green" | "blue";
type FootfallView = "hour" | "shift" | "day" | "month" | "year";
type MlcView = "day" | "week" | "month";
type ProtocolView = "day" | "week" | "month" | "pathway";
type ReferralView = "hour" | "weekday" | "month" | "reason";
type LamaView = "reason" | "pincode";
type ComplaintView = "hour" | "shift" | "day";

interface Metric {
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

interface DashboardFilter {
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

const METRICS: Metric[] = [
  { id: "iaTat", label: "Initial Assessment TAT", group: "operational", kind: "duration", baseline: 7.4, target: "<= 10 min", unit: "min", tone: "green", Icon: Clock, fmt: v => `${v.toFixed(1)} min` },
  { id: "erTat", label: "ER TAT", group: "operational", kind: "duration", baseline: 142, target: "<= 180 min", unit: "min", tone: "navy", Icon: Activity, fmt: v => `${Math.round(v)} min` },
  { id: "avgLos", label: "Average LOS", group: "operational", kind: "duration", baseline: 3.8, target: "ER stay", unit: "hr", tone: "amber", Icon: TimerReset, isNew: true, fmt: v => `${v.toFixed(1)} hr` },
  { id: "dispositionTat", label: "Disposition Processing", group: "operational", kind: "duration", baseline: 34, target: "Decision to exit", unit: "min", tone: "coral", Icon: Clock, isNew: true, fmt: v => `${Math.round(v)} min` },
  { id: "bedOcc", label: "Bed Occupancy", group: "operational", kind: "rate", baseline: 0.84, target: "<= 85%", unit: "%", tone: "amber", Icon: Bed, fmt: v => `${Math.round(v * 100)}%` },
  { id: "ppd", label: "Patients / Doctor", group: "operational", kind: "count", baseline: 14.2, target: "Shift load", tone: "navy", Icon: UserCheck, fmt: v => v.toFixed(1) },
  { id: "ppn", label: "Patients / Nurse", group: "operational", kind: "count", baseline: 8.6, target: "Shift load", tone: "blue", Icon: Users, isNew: true, fmt: v => v.toFixed(1) },
  { id: "mlcCases", label: "MLC Cases", group: "operational", kind: "count", baseline: 5.4, target: "Daily avg", tone: "coral", Icon: AlertTriangle, fmt: v => `${Math.round(v)}` },
  { id: "carePlan", label: "Care Plan Compliance", group: "clinical", kind: "rate", baseline: 0.912, target: ">= 90%", unit: "%", tone: "navy", Icon: ShieldCheck, fmt: v => `${(v * 100).toFixed(1)}%` },
  { id: "doorThromb", label: "Door to Thrombolysis", group: "clinical", kind: "duration", baseline: 43, target: "<= 60 min", unit: "min", tone: "green", Icon: Clock, fmt: v => `${Math.round(v)} min` },
  { id: "doorBalloon", label: "Door to Balloon", group: "clinical", kind: "duration", baseline: 78, target: "<= 90 min", unit: "min", tone: "coral", Icon: HeartPulse, fmt: v => `${Math.round(v)} min` },
  { id: "investigationTat", label: "Investigation TAT", group: "clinical", kind: "duration", baseline: 39, target: "Result turnaround", unit: "min", tone: "navy", Icon: FlaskConical, isNew: true, fmt: v => `${Math.round(v)} min` },
  { id: "mortality", label: "ER Mortality", group: "quality", kind: "rate", baseline: 0.018, target: "<= 2%", unit: "%", tone: "coral", Icon: Skull, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "lamaRate", label: "LAMA Rate", group: "quality", kind: "rate", baseline: 0.048, target: "<= 5%", unit: "%", tone: "coral", Icon: AlertTriangle, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "lwbsRate", label: "LWBS Rate", group: "quality", kind: "rate", baseline: 0.026, target: "<= 3%", unit: "%", tone: "amber", Icon: Eraser, isNew: true, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "readmit72", label: "72-Hour Readmission", group: "quality", kind: "rate", baseline: 0.034, target: "<= 5%", unit: "%", tone: "amber", Icon: Repeat, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "returnRate", label: "Return After Discharge", group: "quality", kind: "rate", baseline: 0.051, target: "<= 6%", unit: "%", tone: "amber", Icon: RotateCcw, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "satisfaction", label: "Patient Satisfaction", group: "quality", kind: "rate", baseline: 0.884, target: "Experience score", unit: "%", tone: "green", Icon: Sparkles, isNew: true, fmt: v => `${Math.round(v * 100)}%` },
  { id: "bedCleaning", label: "Bed Cleaning Compliance", group: "quality", kind: "rate", baseline: 0.91, target: "Protocol adherence", unit: "%", tone: "green", Icon: Bed, isNew: true, fmt: v => `${Math.round(v * 100)}%` },
  { id: "bedCleaningTat", label: "Bed Cleaning TAT", group: "quality", kind: "duration", baseline: 18, target: "Ready for next patient", unit: "min", tone: "blue", Icon: TimerReset, isNew: true, fmt: v => `${Math.round(v)} min` },
];

const triageDist = [
  { name: "Level I", value: 16, color: COLORS.red },
  { name: "Level II", value: 37, color: "var(--urgent-urgent)" },
  { name: "Level III", value: 68, color: "var(--urgent-pending)" },
  { name: "Not Triaged", value: 9, color: COLORS.muted },
];

const dispositionDist = [
  { name: "Discharged", value: 64, color: COLORS.green },
  { name: "Admitted", value: 38, color: COLORS.navy },
  { name: "Referred Out", value: 12, color: COLORS.coral },
  { name: "LAMA", value: 6, color: COLORS.amber },
  { name: "Expired", value: 2, color: COLORS.red },
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
const protocolSegmentColors = [COLORS.blue, COLORS.green, COLORS.coral, COLORS.amber];

function Analytics() {
  const [tab, setTab] = useState<GroupId>("operational");
  const [range, setRange] = useState<RangeId>("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [activeFilter, setActiveFilter] = useState<DashboardFilter | null>(null);
  const [drillMetric, setDrillMetric] = useState<Metric | null>(null);
  const days = useMemo(() => dateRangeDays(range, custom), [range, custom]);
  const applyFilter = (filter: DashboardFilter) => {
    setActiveFilter(current => isSameFilter(current, filter) ? null : filter);
  };

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 p-5 font-sans lg:p-6">
      <header className="warm-panel rounded-[1.75rem] p-4 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-navy">Performance Analytics</h1>
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
        <Operational days={days} activeFilter={activeFilter} applyFilter={applyFilter} onDrill={setDrillMetric} />
      )}
      {tab === "clinical" && (
        <Clinical days={days} activeFilter={activeFilter} applyFilter={applyFilter} onDrill={setDrillMetric} />
      )}
      {tab === "quality" && (
        <Quality days={days} activeFilter={activeFilter} applyFilter={applyFilter} onDrill={setDrillMetric} />
      )}

      {drillMetric && (
        <MetricDrillPanel metric={drillMetric} days={days} activeFilter={activeFilter} onClose={() => setDrillMetric(null)} />
      )}
    </div>
  );
}

function Operational({
  days,
  activeFilter,
  applyFilter,
  onDrill,
}: {
  days: string[];
  activeFilter: DashboardFilter | null;
  applyFilter: (filter: DashboardFilter) => void;
  onDrill: (metric: Metric) => void;
}) {
  const [footfallView, setFootfallView] = useState<FootfallView>("hour");
  const [protocolView, setProtocolView] = useState<ProtocolView>("day");
  const multiplier = filterMultiplier(activeFilter);
  const existingMetricIds = ["iaTat", "erTat", "bedOcc", "ppd", "mlcCases"];
  const suggestedMetricIds = ["avgLos", "dispositionTat", "ppn"];
  const existingMetrics = existingMetricIds.map(id => METRICS.find(m => m.id === id)!);
  const suggestedMetrics = suggestedMetricIds.map(id => METRICS.find(m => m.id === id)!);
  const footfall = buildFootfall(days, multiplier);
  const footfallRollup = rollupFootfall(footfallView, footfall);
  const highestFootfall = Math.max(...footfallRollup.map(row => row.patients));
  const triageDist = applyFilterToPie(windowSafeTriageDist(), activeFilter);
  const disposition = applyFilterToPie(dispositionDist, activeFilter);
  const triageVsDispo = applyFilterToRows(triageVsDispoBase, activeFilter);
  const protocolRows = buildProtocolStackRows(protocolView, multiplier);
  const stageData = [
    { name: "Registration", value: scale(11, multiplier), color: COLORS.green },
    { name: "Triage", value: scale(16, multiplier), color: COLORS.amber },
    { name: "Consult", value: scale(42, multiplier), color: COLORS.coral },
    { name: "Investigations", value: scale(67, multiplier), color: COLORS.blue },
    { name: "Disposition", value: scale(34, multiplier), color: COLORS.navy },
  ];

  return (
    <div className="space-y-5">
      <Section title="Operational KPIs">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {existingMetrics.map(metric => (
            <MetricCard key={metric.id} metric={metric} days={days} activeFilter={activeFilter} onDrill={onDrill} />
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
          />
          <PieAnalyticsCard
            title="Triage Categories Distribution"
            data={triageDist}
            activeFilter={activeFilter}
            onSelect={label => applyFilter({ source: "Triage", label })}
          />
          <StackedBarCard
            title="Triage Levels vs ER Disposition"
            data={triageVsDispo}
            xKey="name"
            keys={["Discharged", "Admitted", "Referred", "LAMA", "Expired"]}
            activeFilter={activeFilter}
            onSelect={label => applyFilter({ source: "Triage x Disposition", label })}
          />
        </div>
      </Section>

      <Section title="Footfall">
        <div className="grid grid-cols-1 items-stretch gap-4">
          <ChartCard
            title="Footfall"
            action={<Segmented value={footfallView} options={["hour", "shift", "day", "month", "year"]} onChange={setFootfallView} />}
            active={Boolean(activeFilter)}
          >
            <ResponsiveContainer width="100%" height={285}>
              <BarChart data={footfallRollup} margin={{ top: 20, right: 18, left: 8, bottom: 36 }} onClick={event => selectFromChart(event, "Footfall", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" tick={axisTick} height={52} />
                <YAxis tick={axisTick} label={axisLabel("Patients")} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="patients" radius={[8, 8, 0, 0]}>
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
            <MetricCard key={metric.id} metric={metric} days={days} activeFilter={activeFilter} onDrill={onDrill} />
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
          />
          <DonutCard
            title="Time Taken Breakdown by Stage"
            data={stageData}
            activeFilter={activeFilter}
            suggested
            onSelect={label => applyFilter({ source: "Stage Delay", label })}
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
          />
          <StackedBarCard
            title="Age Group with Gender Distribution"
            data={applyFilterToRows(ageGenderBase, activeFilter)}
            xKey="name"
            keys={["Male", "Female"]}
            activeFilter={activeFilter}
            onSelect={label => applyFilter({ source: "Age / Gender", label })}
          />
        </div>
      </Section>

      <Section title="Beds and Protocol Orders">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <BedOccupancyTable activeFilter={activeFilter} />
          <ChartCard
            title="Protocol Set Ordered"
            action={<Segmented value={protocolView} options={["day", "week", "month", "pathway"]} onChange={setProtocolView} />}
            active={Boolean(activeFilter)}
          >
            <ResponsiveContainer width="100%" height={285}>
              <BarChart data={protocolRows} layout="vertical" margin={{ top: 12, right: 34, left: 86, bottom: 12 }} onClick={event => selectFromChart(event, "Protocol Orders", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={axisTick} label={axisLabel("Orders", "insideBottom", 0)} />
                <YAxis dataKey="name" type="category" width={94} tick={axisTick} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <RLegend wrapperStyle={{ fontSize: 12 }} />
                {protocolSegmentKeys.map((key, index) => (
                  <Bar key={key} dataKey={key} stackId="protocol" fill={protocolSegmentColors[index]} radius={index === protocolSegmentKeys.length - 1 ? [0, 8, 8, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </Section>
    </div>
  );
}

function Clinical({
  days,
  activeFilter,
  applyFilter,
  onDrill,
}: {
  days: string[];
  activeFilter: DashboardFilter | null;
  applyFilter: (filter: DashboardFilter) => void;
  onDrill: (metric: Metric) => void;
}) {
  const multiplier = filterMultiplier(activeFilter);
  const kpis = ["carePlan", "doorThromb", "doorBalloon", "investigationTat"].map(id => METRICS.find(m => m.id === id)!);
  const mewsTrend = buildMewsTrend(days, multiplier);

  return (
    <div className="space-y-5">
      <Section title="Clinical Recognition and Pathway Activation">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {kpis.slice(0, 3).map(metric => (
            <MetricCard key={metric.id} metric={metric} days={days} activeFilter={activeFilter} onDrill={onDrill} />
          ))}
          <MewsCard data={mewsTrend} onClick={() => onDrill({ id: "mews", label: "MEWS", group: "clinical", kind: "score", baseline: 0, target: "Risk trajectory", tone: "amber", Icon: HeartPulse, fmt: v => v.toFixed(1) })} />
          <MetricCard metric={kpis[3]} days={days} activeFilter={activeFilter} onDrill={onDrill} />
        </div>
      </Section>

      <Section title="Care Pathways and Daily Case Mix">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <ChartCard title="ER Cases by Care Pathway" active={Boolean(activeFilter)}>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={applyFilterToRows(pathwayCasesBase, activeFilter)} margin={{ top: 20, right: 24, left: 8, bottom: 52 }} onClick={event => selectFromChart(event, "Care Pathway", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" interval={0} angle={-22} textAnchor="end" tick={axisTick} height={66} />
                <YAxis tick={axisTick} label={axisLabel("Cases")} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="Total" fill={COLORS.navy} radius={[8, 8, 0, 0]}>
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
          />
        </div>
      </Section>

      <Section title="Orders and Treatment Utilisation">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <RankList title="Top 15 Medications Prescribed" Icon={Pill} items={scaleRankItems(medicationsBase, multiplier)} onSelect={label => applyFilter({ source: "Medication", label })} />
          <RankList title="Top 15 Investigations Ordered" Icon={FlaskConical} items={scaleRankItems(investigationsBase, multiplier)} onSelect={label => applyFilter({ source: "Investigation", label })} />
        </div>
      </Section>
    </div>
  );
}

function Quality({
  days,
  activeFilter,
  applyFilter,
  onDrill,
}: {
  days: string[];
  activeFilter: DashboardFilter | null;
  applyFilter: (filter: DashboardFilter) => void;
  onDrill: (metric: Metric) => void;
}) {
  const [referralView, setReferralView] = useState<ReferralView>("reason");
  const [lamaView, setLamaView] = useState<LamaView>("reason");
  const [complaintView, setComplaintView] = useState<ComplaintView>("hour");
  const multiplier = filterMultiplier(activeFilter);
  const outcome = ["mortality", "lamaRate", "lwbsRate", "readmit72", "returnRate"].map(id => METRICS.find(m => m.id === id)!);
  const experience = ["satisfaction", "bedCleaning", "bedCleaningTat"].map(id => METRICS.find(m => m.id === id)!);
  const referralRows = buildReferralRows(referralView, multiplier);
  const lamaRows = lamaView === "reason" ? scaleNamedRows(lamaReasonBase, multiplier) : scaleNamedRows(lamaPinBase, multiplier);
  const complaintRows = buildComplaintRows(complaintView, multiplier);

  return (
    <div className="space-y-5">
      <Section title="Safety Outcomes">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {outcome.map(metric => (
            <MetricCard key={metric.id} metric={metric} days={days} activeFilter={activeFilter} onDrill={onDrill} />
          ))}
        </div>
      </Section>

      <Section title="Experience, Readiness, and Bed Turnover">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {experience.map(metric => (
            <MetricCard key={metric.id} metric={metric} days={days} activeFilter={activeFilter} onDrill={onDrill} />
          ))}
        </div>
      </Section>

      <Section title="Referrals, LAMA, and Complaints">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
          <ChartCard
            title="Outward Referral Analysis"
            action={<Segmented value={referralView} options={["hour", "weekday", "month", "reason"]} onChange={setReferralView} />}
            active={Boolean(activeFilter)}
          >
            <ResponsiveContainer width="100%" height={245}>
              <BarChart data={referralRows} margin={{ top: 20, right: 24, left: 8, bottom: 48 }} onClick={event => selectFromChart(event, "Outward Referral", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" tick={axisTick} height={60} />
                <YAxis tick={axisTick} label={axisLabel("Cases")} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={COLORS.navy} radius={[8, 8, 0, 0]}>
                  <LabelList dataKey="value" position="top" fill={COLORS.navy} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="LAMA Analysis"
            action={<Segmented value={lamaView} options={["reason", "pincode"]} onChange={setLamaView} />}
            active={Boolean(activeFilter)}
          >
            <ResponsiveContainer width="100%" height={245}>
              <BarChart data={lamaRows} margin={{ top: 20, right: 24, left: 8, bottom: 48 }} onClick={event => selectFromChart(event, "LAMA", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" tick={axisTick} height={60} />
                <YAxis tick={axisTick} label={axisLabel("Cases")} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={COLORS.coral} radius={[8, 8, 0, 0]}>
                  <LabelList dataKey="value" position="top" fill={COLORS.navy} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Complaints Volume"
            action={<Segmented value={complaintView} options={["hour", "shift", "day"]} onChange={setComplaintView} />}
            active={Boolean(activeFilter)}
            suggested
          >
            <ResponsiveContainer width="100%" height={245}>
              <BarChart data={complaintRows} margin={{ top: 20, right: 24, left: 8, bottom: 48 }} onClick={event => selectFromChart(event, "Complaints", applyFilter)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" tick={axisTick} height={60} />
                <YAxis tick={axisTick} label={axisLabel("Complaints")} />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={COLORS.amber} radius={[8, 8, 0, 0]}>
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

function DateFilter({
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

function FilterPill({ activeFilter, onClear }: { activeFilter: DashboardFilter | null; onClear: () => void }) {
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
  onDrill,
}: {
  metric: Metric;
  days: string[];
  activeFilter: DashboardFilter | null;
  onDrill: (metric: Metric) => void;
}) {
  const series = useMemo(() => buildSeries(metric, days, filterMultiplier(activeFilter)), [metric, days, activeFilter]);
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
      className={`flex h-full min-h-[360px] flex-col rounded-[1.5rem] bg-card p-4 shadow-soft transition-all ${
        suggested ? "border-2 border-dashed border-coral/70" : "border border-border/80"
      } ${active ? "ring-2 ring-coral/10" : ""}`}
    >
      <div className="mb-3 flex min-h-8 flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-navy">{title}</h3>
        {action}
      </div>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </div>
  );
}

function PieAnalyticsCard({
  title,
  data,
  activeFilter,
  onSelect,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  activeFilter: DashboardFilter | null;
  onSelect: (label: string) => void;
}) {
  return (
    <ChartCard title={title} active={Boolean(activeFilter)}>
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
  onSelect,
}: {
  title: string;
  data: Record<string, string | number>[];
  xKey: string;
  keys: string[];
  activeFilter: DashboardFilter | null;
  onSelect: (label: string) => void;
}) {
  return (
    <ChartCard title={title} active={Boolean(activeFilter)}>
      <ResponsiveContainer width="100%" height={265}>
        <BarChart data={data} margin={{ top: 18, right: 18, left: 8, bottom: 48 }} onClick={event => selectFromChart(event, title, (_, payload) => onSelect(String(payload?.name ?? payload?.[xKey] ?? title)))}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} interval={0} angle={-16} textAnchor="end" tick={axisTick} height={58} />
          <YAxis tick={axisTick} label={axisLabel("Patients")} />
          <Tooltip cursor={false} contentStyle={tooltipStyle} />
          <RLegend wrapperStyle={{ fontSize: 12 }} />
          {stackBars(keys)}
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
  onSelect,
}: {
  title: string;
  data: Record<string, string | number>[];
  keys: string[];
  activeFilter: DashboardFilter | null;
  onSelect: (label: string) => void;
}) {
  return (
    <ChartCard title={title} active={Boolean(activeFilter)}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 20, right: 28, left: 8, bottom: 48 }} onClick={event => selectFromChart(event, title, (_, payload) => onSelect(String(payload?.name ?? title)))}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" interval="preserveStartEnd" angle={-16} textAnchor="end" tick={axisTick} height={58} />
          <YAxis tick={axisTick} label={axisLabel("Value")} />
          <Tooltip cursor={false} contentStyle={tooltipStyle} />
          {keys.length > 1 && <RLegend wrapperStyle={{ fontSize: 12 }} />}
          {keys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={index === 0 ? COLORS.coral : COLORS.navy}
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
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  activeFilter: DashboardFilter | null;
  suggested?: boolean;
  onSelect: (label: string) => void;
}) {
  return (
    <ChartCard title={title} active={Boolean(activeFilter)} suggested={suggested}>
      <ResponsiveContainer width="100%" height={245}>
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
}: {
  title: string;
  Icon: typeof Pill;
  items: { name: string; value: number }[];
  onSelect: (label: string) => void;
}) {
  const max = Math.max(...items.map(item => item.value));
  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 shadow-soft">
      <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-navy">
        <Icon className="h-4 w-4 text-coral" />
        {title}
      </h3>
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

function BedOccupancyTable({ activeFilter }: { activeFilter: DashboardFilter | null }) {
  const multiplier = filterMultiplier(activeFilter);
  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-navy">Bed Occupancy by Area</h3>
          <p className="text-xs text-muted-foreground">Capacity view restored as a table</p>
        </div>
        <Bed className="h-5 w-5 text-coral" />
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

function MetricDrillPanel({
  metric,
  days,
  activeFilter,
  onClose,
}: {
  metric: Metric;
  days: string[];
  activeFilter: DashboardFilter | null;
  onClose: () => void;
}) {
  const [mlcView, setMlcView] = useState<MlcView>("day");
  const multiplier = filterMultiplier(activeFilter);
  const series = metric.id === "mews"
    ? buildMewsTrend(days, multiplier).map((row, index) => ({ name: fmtShort(days[index]), Admission: row.admission, Discharge: row.discharge }))
    : metric.id === "mlcCases"
      ? buildMlcTrend(days, mlcView, multiplier).map(row => ({ name: row.name ?? fmtShort(row.date), Value: row.value }))
      : metric.id === "avgLos"
        ? buildLosByPathway(multiplier)
        : buildSeries(metric, days, multiplier).map(row => ({ name: fmtShort(row.date), Value: metric.kind === "rate" ? row.value * 100 : row.value }));
  const patients = patientsFor(metric.id, activeFilter);

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
              <div className="rounded-2xl border border-coral/30 bg-coral/10 p-4 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-coral">Admission</div>
                <div className="mt-1 text-2xl font-bold text-navy">{(series[series.length - 1] as any)?.Admission?.toFixed?.(1) ?? "4.6"}</div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Discharge</div>
                <div className="mt-1 text-2xl font-bold text-emerald-700">{(series[series.length - 1] as any)?.Discharge?.toFixed?.(1) ?? "1.8"}</div>
              </div>
            </div>
          )}
          <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 shadow-soft">
            <ResponsiveContainer width="100%" height={metric.id === "mews" ? 360 : 300}>
              {metric.id === "avgLos" ? (
                <BarChart data={series} margin={{ top: 20, right: 28, left: 8, bottom: 52 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" tick={axisTick} height={64} />
                  <YAxis tick={axisTick} label={axisLabel("Hours")} />
                  <Tooltip cursor={false} contentStyle={tooltipStyle} />
                  <Bar dataKey="Value" fill={COLORS.coral} radius={[8, 8, 0, 0]}>
                    <LabelList dataKey="Value" position="top" fill={COLORS.navy} fontSize={11} formatter={(value: number) => value.toFixed(1)} />
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={series} margin={{ top: 26, right: 34, left: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" interval="preserveStartEnd" angle={-18} textAnchor="end" tick={axisTick} height={58} />
                  <YAxis tick={axisTick} domain={metric.id === "mews" ? [0, 6] : undefined} label={axisLabel(metric.id === "mews" ? "MEWS Score" : metric.kind === "rate" ? "Percent" : metric.unit ?? "Value")} />
                  <Tooltip cursor={false} contentStyle={tooltipStyle} />
                  {metric.id === "mews" && <RLegend wrapperStyle={{ fontSize: 12 }} />}
                  {metric.id === "mews" ? (
                    <>
                      <Line type="monotone" dataKey="Admission" name="Admission MEWS" stroke={COLORS.coral} strokeWidth={3.25} dot={{ r: 4, fill: "white", stroke: COLORS.coral, strokeWidth: 2 }} activeDot={{ r: 7, fill: COLORS.amber, stroke: "white", strokeWidth: 2 }} />
                      <Line type="monotone" dataKey="Discharge" name="Discharge MEWS" stroke={COLORS.green} strokeWidth={3.25} dot={{ r: 4, fill: "white", stroke: COLORS.green, strokeWidth: 2 }} activeDot={{ r: 7, fill: COLORS.amber, stroke: "white", strokeWidth: 2 }} />
                    </>
                  ) : (
                    <Line type="monotone" dataKey="Value" stroke={COLORS.coral} strokeWidth={2.5} dot={{ r: 3, fill: "white" }} activeDot={{ r: 6, fill: COLORS.amber }} />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="text-sm font-bold text-navy">Patient Snapshot</div>
              <div className="text-xs font-semibold text-muted-foreground">{patients.length} records</div>
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
                  </tr>
                </thead>
                <tbody>
                  {patients.map(patient => (
                    <tr key={patient.key} className="border-t border-border">
                      <td className="px-4 py-2 font-bold text-navy">{patient.name}</td>
                      <td className="px-4 py-2 tabular-nums text-muted-foreground">{patient.umr}</td>
                      <td className="px-4 py-2 text-muted-foreground">Level {patient.triage || "Pending"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{patient.pathway}</td>
                      <td className="px-4 py-2 text-muted-foreground">{patient.physician}</td>
                      <td className="px-4 py-2 text-muted-foreground">{patient.status}</td>
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

function stackBars(keys: string[]) {
  const fills = [COLORS.green, COLORS.navy, COLORS.coral, COLORS.amber, COLORS.red, COLORS.blue];
  return keys.map((key, index) => (
    <Bar key={key} dataKey={key} stackId="stack" fill={fills[index % fills.length]} radius={index === keys.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]} />
  ));
}

function Legend({ items }: { items: { name: string; value: number; color: string }[] }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      {items.map(item => (
        <button key={item.name} className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-xs transition-colors hover:bg-secondary/60">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
          <span className="text-navy">{item.name}</span>
          <span className="ml-auto font-bold tabular-nums text-navy">{item.value}</span>
        </button>
      ))}
    </div>
  );
}

function dateRangeDays(range: RangeId, custom: { from: string; to: string }) {
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

function applyFilterToRows<T extends Record<string, string | number>>(rows: T[], activeFilter: DashboardFilter | null) {
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

function patientsFor(metricId: string, activeFilter: DashboardFilter | null) {
  const multiplier = filterMultiplier(activeFilter);
  const count = Math.max(3, Math.min(roster.length, Math.ceil(roster.length * multiplier)));
  return roster.slice(0, count).map((patient, index) => ({
    ...patient,
    key: `${metricId}-${activeFilter?.label ?? "all"}-${patient.id}-${index}`,
  }));
}

function selectFromChart(
  event: any,
  source: string,
  setActiveFilter: ((filter: DashboardFilter) => void) | ((label: string, payload?: any) => void),
) {
  const payload = event?.activePayload?.[0]?.payload;
  if (!payload) return;
  const label = String(payload.name ?? payload.date ?? payload.bucket ?? source);
  if (setActiveFilter.length >= 2) {
    (setActiveFilter as (label: string, payload?: any) => void)(label, payload);
    return;
  }
  (setActiveFilter as (filter: DashboardFilter) => void)({ source, label });
}

const axisTick = { fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 600 };
const tooltipStyle = { borderRadius: 14, border: "1px solid var(--border)", background: "white", boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)" };

function axisLabel(value: string, position: "insideLeft" | "insideBottom" = "insideLeft", offset = -2) {
  return { value, angle: position === "insideLeft" ? -90 : 0, position, offset, style: { fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 700 } };
}

void TrendingUp;
void Stethoscope;
