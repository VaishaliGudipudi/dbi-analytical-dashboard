import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid, Legend as RLegend,
} from "recharts";
import {
  Clock, Activity, Skull, ShieldCheck, Repeat, RotateCcw, AlertTriangle,
  TrendingUp, Bed, UserCheck, FileText, Pill, FlaskConical, Truck, Users,
  Building2, HeartPulse, ChevronRight, X, Calendar,
} from "lucide-react";
import { wards, patients as roster } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/analytics")({ component: Analytics });

/* ───────────────────────────── Types & helpers ───────────────────────────── */

type GroupId = "operational" | "clinical" | "quality";
type RangeId = "7d" | "30d" | "90d" | "custom";

function dateRangeDays(range: RangeId, custom: { from: string; to: string }): string[] {
  const out: string[] = [];
  const today = new Date();
  if (range === "custom" && custom.from && custom.to) {
    const a = new Date(custom.from);
    const b = new Date(custom.to);
    for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }
  const n = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function fmtShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Stable pseudo-random (date+seed) so series are consistent across renders.
function seedRand(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (((h >>> 0) % 10000) / 10000);
}

/* ───────────────────────────── Metric registry ───────────────────────────── */

type MetricKind = "rate" | "duration" | "count";
interface Metric {
  id: string;
  label: string;
  kind: MetricKind;
  unit?: string;
  target?: string;
  Icon: any;
  tone: "navy" | "coral" | "amber" | "green";
  group: GroupId;
  // 0..1 baseline used for synthesizing trend
  baseline: number;
  // formatter for one daily value
  fmt: (v: number) => string;
}

const METRICS: Metric[] = [
  // Operational — TATs / rates as KPI cards
  { id: "iaTat", label: "Initial Assessment TAT", kind: "duration", unit: "min", target: "≤ 10 min", Icon: Clock, tone: "green", group: "operational", baseline: 6.5, fmt: v => `${v.toFixed(1)} min` },
  { id: "erTat", label: "ER TAT", kind: "duration", unit: "min", target: "≤ 180 min", Icon: Activity, tone: "navy", group: "operational", baseline: 138, fmt: v => `${Math.round(v)} min` },
  { id: "bedOcc", label: "Bed Occupancy Rate", kind: "rate", unit: "%", target: "≤ 85%", Icon: Bed, tone: "amber", group: "operational", baseline: 0.84, fmt: v => `${Math.round(v * 100)}%` },
  { id: "ppd", label: "Patients per Doctor", kind: "count", target: "Shift avg", Icon: UserCheck, tone: "navy", group: "operational", baseline: 14, fmt: v => v.toFixed(1) },
  // Clinical
  { id: "carePlan", label: "Care Plan Compliance", kind: "rate", unit: "%", target: "≥ 90%", Icon: ShieldCheck, tone: "navy", group: "clinical", baseline: 0.92, fmt: v => `${(v * 100).toFixed(1)}%` },
  { id: "doorThromb", label: "Door to Thrombolysis", kind: "duration", unit: "min", target: "≤ 60 min", Icon: Clock, tone: "green", group: "clinical", baseline: 44, fmt: v => `${Math.round(v)} min` },
  { id: "doorBalloon", label: "Door to Balloon", kind: "duration", unit: "min", target: "≤ 90 min", Icon: HeartPulse, tone: "coral", group: "clinical", baseline: 78, fmt: v => `${Math.round(v)} min` },
  // Quality & safety
  { id: "mortality", label: "ER Mortality Rate", kind: "rate", unit: "%", target: "≤ 2%", Icon: Skull, tone: "coral", group: "quality", baseline: 0.018, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "readmit72", label: "72-Hour Readmission", kind: "rate", unit: "%", target: "≤ 5%", Icon: Repeat, tone: "amber", group: "quality", baseline: 0.034, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "returnRate", label: "Return After Discharge", kind: "rate", unit: "%", target: "≤ 6%", Icon: RotateCcw, tone: "amber", group: "quality", baseline: 0.051, fmt: v => `${(v * 100).toFixed(2)}%` },
  { id: "lamaRate", label: "LAMA Rate", kind: "rate", unit: "%", target: "≤ 5%", Icon: AlertTriangle, tone: "coral", group: "quality", baseline: 0.048, fmt: v => `${(v * 100).toFixed(2)}%` },
];

/* Build a stable per-metric daily series */
function buildSeries(m: Metric, days: string[]) {
  return days.map(d => {
    const r = seedRand(`${m.id}-${d}`);
    const noise = (r - 0.5) * 0.3 * m.baseline;
    let v = m.baseline + noise;
    if (m.kind === "rate") v = Math.max(0, Math.min(1, v));
    return { date: d, value: Number(v.toFixed(4)), patients: Math.max(0, Math.round(4 + r * 14)) };
  });
}

/* Patient list per (metric, date) */
function patientsFor(_metricId: string, date: string) {
  const r = seedRand(date);
  const n = Math.max(2, Math.round(2 + r * 6));
  return roster.slice(0, n).map((p, i) => ({
    ...p,
    key: `${date}-${p.id}-${i}`,
    visitTime: `${String(7 + i).padStart(2, "0")}:${String(Math.floor(r * 59)).padStart(2, "0")}`,
    metricValue: undefined as string | undefined,
  }));
}

/* ───────────────────────────── Page shell ───────────────────────────── */

function Analytics() {
  const { user } = useAuth();
  const [tab, setTab] = useState<GroupId>("operational");
  const [range, setRange] = useState<RangeId>("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [drillId, setDrillId] = useState<string | null>(null);

  const days = useMemo(() => dateRangeDays(range, custom), [range, custom]);

  // Admin lands here too — show holding screen for performance analytics.
  if (user?.role === "admin") {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <h1 className="text-2xl font-bold text-navy mb-2">Performance Analytics</h1>
        <p className="text-sm text-muted-foreground mb-6">Department & staff performance dashboards.</p>
        <div className="bg-card rounded-2xl shadow-soft p-10 text-center">
          <Building2 className="h-10 w-10 text-coral mx-auto mb-3" />
          <h2 className="font-semibold text-navy text-lg">Coming soon</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Performance analytics for Admin will live here. Operational, Clinical and
            Quality dashboards have moved to the Analytics user.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {days.length} days · {fmtShort(days[0])} → {fmtShort(days[days.length - 1])}
          </p>
        </div>
        <DateFilter range={range} setRange={setRange} custom={custom} setCustom={setCustom} />
      </div>

      {/* Group tabs (orange when selected) */}
      <div className="flex gap-1.5 mb-6 bg-secondary/50 p-1.5 rounded-xl w-fit">
        {[
          { id: "operational" as const, label: "Operational" },
          { id: "clinical"    as const, label: "Clinical" },
          { id: "quality"     as const, label: "Quality & Safety" },
        ].map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setDrillId(null); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? "text-white shadow-soft" : "text-muted-foreground hover:text-navy"}`}
              style={active ? { background: "var(--amber-emerg)" } : undefined}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "operational" && <Operational days={days} onDrill={setDrillId} />}
      {tab === "clinical"    && <Clinical    days={days} onDrill={setDrillId} />}
      {tab === "quality"     && <Quality     days={days} onDrill={setDrillId} />}

      {drillId && (
        <DrillPanel
          metric={METRICS.find(m => m.id === drillId)!}
          days={days}
          onClose={() => setDrillId(null)}
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Date filter ───────────────────────────── */

function DateFilter({
  range, setRange, custom, setCustom,
}: {
  range: RangeId;
  setRange: (r: RangeId) => void;
  custom: { from: string; to: string };
  setCustom: (c: { from: string; to: string }) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-card rounded-xl shadow-soft p-1.5">
      <Calendar className="h-4 w-4 text-coral mx-2" />
      {(["7d", "30d", "90d"] as RangeId[]).map(r => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${range === r ? "text-white" : "text-muted-foreground hover:text-navy"}`}
          style={range === r ? { background: "var(--amber-emerg)" } : undefined}
        >
          {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "Last 90 days"}
        </button>
      ))}
      <button
        onClick={() => setRange("custom")}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${range === "custom" ? "text-white" : "text-muted-foreground hover:text-navy"}`}
        style={range === "custom" ? { background: "var(--amber-emerg)" } : undefined}
      >
        Custom
      </button>
      {range === "custom" && (
        <div className="flex items-center gap-1.5 pl-2 border-l border-border ml-1">
          <input
            type="date" value={custom.from}
            onChange={e => setCustom({ ...custom, from: e.target.value })}
            className="text-xs rounded-md border border-border px-2 py-1 bg-background"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <input
            type="date" value={custom.to}
            onChange={e => setCustom({ ...custom, to: e.target.value })}
            className="text-xs rounded-md border border-border px-2 py-1 bg-background"
          />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Operational tab ───────────────────────────── */

const triageDist = [
  { name: "Level I",    value: 16, color: "var(--urgent-critical)" },
  { name: "Level II",   value: 10, color: "var(--urgent-urgent)" },
  { name: "Level III",  value: 2,  color: "var(--urgent-pending)" },
  { name: "Discharged", value: 96, color: "var(--urgent-safe)" },
];
const dispositionDist = [
  { name: "Discharged",   value: 64, color: "var(--urgent-safe)" },
  { name: "Admitted",     value: 38, color: "var(--navy)" },
  { name: "Referred Out", value: 12, color: "var(--coral)" },
  { name: "LAMA",         value: 6,  color: "var(--urgent-pending)" },
  { name: "Expired",      value: 2,  color: "var(--urgent-critical)" },
];
const triageVsDispo = [
  { triage: "Level I",   discharged: 4,  admitted: 9,  referred: 2, lama: 0, expired: 1 },
  { triage: "Level II",  discharged: 18, admitted: 12, referred: 5, lama: 1, expired: 1 },
  { triage: "Level III", discharged: 42, admitted: 17, referred: 5, lama: 5, expired: 0 },
];
const providerDispo = [
  { name: "Dr. Tejaswi", discharged: 22, admitted: 12, referred: 3, lama: 1 },
  { name: "Dr. Mehta",   discharged: 18, admitted: 10, referred: 2, lama: 2 },
  { name: "Dr. Khan",    discharged: 14, admitted: 9,  referred: 4, lama: 1 },
  { name: "Dr. Iyer",    discharged: 10, admitted: 7,  referred: 3, lama: 2 },
];
const ageGenderBuckets = [
  { bucket: "0-18",  M: 12, F: 9  },
  { bucket: "19-35", M: 28, F: 31 },
  { bucket: "36-55", M: 36, F: 29 },
  { bucket: "56-75", M: 41, F: 33 },
  { bucket: "76+",   M: 14, F: 18 },
];
const protocolSets = [
  { name: "Cardiac Set",     n: 18 }, { name: "Sepsis Bundle", n: 14 },
  { name: "Trauma Bay Set",  n: 11 }, { name: "Stroke Set",    n: 9  },
  { name: "Respiratory Set", n: 12 }, { name: "Toxicology Set", n: 6 },
  { name: "Antivenom Set",   n: 7  }, { name: "Pediatric Set", n: 5  },
];

function Operational({ days, onDrill }: { days: string[]; onDrill: (id: string) => void }) {
  const opMetrics = METRICS.filter(m => m.group === "operational");

  // Time series for footfall + ambulance vs walk-in + admissions by sex + MLC
  const footfall = days.map(d => {
    const r = seedRand(`ff-${d}`);
    const total = Math.round(85 + r * 60);
    const amb = Math.round(total * (0.22 + seedRand(`amb-${d}`) * 0.12));
    return { date: d, total, ambulance: amb, walkIn: total - amb,
      M: Math.round(total * 0.55), F: total - Math.round(total * 0.55),
      mlc: Math.round(2 + seedRand(`mlc-${d}`) * 8),
    };
  });
  // Hour/shift distribution (single-day rollup)
  const byHour = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}`,
    patients: Math.round(2 + seedRand(`hr-${h}`) * 14 + (h >= 10 && h <= 22 ? 6 : 0)),
  }));
  const byShift = [
    { shift: "Morning (07-15)",   patients: byHour.slice(7, 15).reduce((s, x) => s + x.patients, 0) },
    { shift: "Evening (15-23)",   patients: byHour.slice(15, 23).reduce((s, x) => s + x.patients, 0) },
    { shift: "Night (23-07)",     patients: byHour.slice(23).concat(byHour.slice(0, 7)).reduce((s, x) => s + x.patients, 0) },
  ];
  const byWeekday = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((wd, i) => ({
    wd, patients: Math.round(80 + seedRand(`wd-${i}`) * 60),
  }));

  return (
    <div className="space-y-6">
      <Group title="Key TATs & Capacity (click any card)">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {opMetrics.map(m => <MetricCard key={m.id} m={m} days={days} onDrill={onDrill} />)}
        </div>
      </Group>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Patient Disposition">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={dispositionDist} dataKey="value" nameKey="name" innerRadius={48} outerRadius={88} paddingAngle={3}>
                {dispositionDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <Legend items={dispositionDist} />
        </ChartCard>

        <ChartCard title="Triage Categories Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={triageDist} dataKey="value" nameKey="name" innerRadius={48} outerRadius={88} paddingAngle={3}>
                {triageDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <Legend items={triageDist} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Triage Levels vs Disposition">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={triageVsDispo}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="triage" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <RLegend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="discharged" stackId="a" fill="var(--urgent-safe)" />
              <Bar dataKey="admitted"   stackId="a" fill="var(--navy)" />
              <Bar dataKey="referred"   stackId="a" fill="var(--coral)" />
              <Bar dataKey="lama"       stackId="a" fill="var(--urgent-pending)" />
              <Bar dataKey="expired"    stackId="a" fill="var(--urgent-critical)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Provider-wise Disposition Breakdown">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={providerDispo}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <RLegend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="discharged" stackId="a" fill="var(--urgent-safe)" />
              <Bar dataKey="admitted"   stackId="a" fill="var(--navy)" />
              <Bar dataKey="referred"   stackId="a" fill="var(--coral)" />
              <Bar dataKey="lama"       stackId="a" fill="var(--urgent-pending)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Male vs Female Admission Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={footfall}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtShort} />
              <RLegend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="M" stroke="var(--navy)" strokeWidth={2.5} dot={false} name="Male" />
              <Line type="monotone" dataKey="F" stroke="var(--coral)" strokeWidth={2.5} dot={false} name="Female" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Age Group with Gender Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ageGenderBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <RLegend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="M" stackId="g" fill="var(--navy)" name="Male" />
              <Bar dataKey="F" stackId="g" fill="var(--coral)" name="Female" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Footfall by Day">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={footfall}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtShort} />
              <Line type="monotone" dataKey="total" stroke="var(--navy)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Footfall by Hour (today)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="patients" fill="var(--coral)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Footfall by Weekday">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byWeekday}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="wd" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="patients" fill="var(--navy)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Footfall by Shift">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byShift} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis dataKey="shift" type="category" width={140} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="patients" fill="var(--coral)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Ambulance vs Walk-In (trend)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={footfall}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtShort} />
              <RLegend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="ambulance" stroke="var(--navy)" strokeWidth={2.5} dot={false} name="Ambulance" />
              <Line type="monotone" dataKey="walkIn"    stroke="var(--coral)" strokeWidth={2.5} dot={false} name="Walk-In" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="MLC Cases by Day">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={footfall}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtShort} />
              <Bar dataKey="mlc" fill="var(--coral)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Protocol Sets Ordered">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={protocolSets} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="n" fill="var(--navy)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ward Bed Utilization">
          <WardTable />
        </ChartCard>
      </div>
    </div>
  );
}

/* ───────────────────────────── Clinical tab ───────────────────────────── */

const pathwayCases = [
  { name: "STEMI", n: 14 }, { name: "Stroke", n: 11 },
  { name: "Trauma", n: 22 }, { name: "Sepsis Bundle", n: 9 },
  { name: "Antivenom", n: 7 }, { name: "Toxicology", n: 6 },
  { name: "Anaphylaxis", n: 4 }, { name: "Respiratory", n: 12 },
  { name: "General", n: 18 },
];
const topMeds = [
  ["Paracetamol IV", 64], ["Aspirin 325mg", 42], ["Atorvastatin", 38],
  ["Clopidogrel", 35], ["Heparin", 31], ["Ondansetron", 28],
  ["Pantoprazole", 27], ["Tramadol", 24], ["Adrenaline", 21],
  ["Metoprolol", 19], ["Amoxiclav", 18], ["Diclofenac", 17],
  ["Furosemide", 16], ["Salbutamol Neb", 15], ["Hydrocortisone", 12],
] as const;
const topInvestigations = [
  ["CBC", 88], ["Troponin I", 71], ["RBS", 65], ["ECG 12-lead", 62],
  ["Chest X-Ray", 54], ["Serum Electrolytes", 49], ["RFT", 44],
  ["LFT", 38], ["ABG", 33], ["CT Brain", 26], ["D-Dimer", 22],
  ["CT Chest", 18], ["USG Abdomen", 17], ["Coag Profile", 15], ["Lactate", 13],
] as const;

function Clinical({ days, onDrill }: { days: string[]; onDrill: (id: string) => void }) {
  const m = METRICS.filter(x => x.group === "clinical");
  return (
    <div className="space-y-6">
      <Group title="Time-Critical Clinical KPIs (click any card)">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {m.map(x => <MetricCard key={x.id} m={x} days={days} onDrill={onDrill} />)}
        </div>
      </Group>

      <ChartCard title="ER Cases by Care Pathway">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={pathwayCases}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="n" fill="var(--coral)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RankList title="Top 15 Medications Prescribed" Icon={Pill} items={topMeds as any} />
        <RankList title="Top 15 Investigations Ordered" Icon={FlaskConical} items={topInvestigations as any} />
      </div>
    </div>
  );
}

/* ───────────────────────────── Quality & Safety tab ───────────────────────────── */

const lamaReasons = [
  { reason: "Financial",         n: 14 },
  { reason: "Family/Personal",   n: 11 },
  { reason: "Wait time",         n: 8  },
  { reason: "Second opinion",    n: 6  },
  { reason: "Symptom resolved",  n: 5  },
  { reason: "Other",             n: 4  },
];
const lamaPincode = [
  { pin: "500032", n: 9 }, { pin: "500081", n: 7 }, { pin: "500018", n: 6 },
  { pin: "500016", n: 5 }, { pin: "500038", n: 4 }, { pin: "500049", n: 3 }, { pin: "Other", n: 14 },
];
const referralOut = [
  { dest: "Tertiary Cardiac Centre", n: 6 },
  { dest: "Neurosciences",           n: 4 },
  { dest: "Burns Unit",              n: 3 },
  { dest: "Pediatric Surgery",       n: 2 },
  { dest: "Other",                   n: 5 },
];

function Quality({ days, onDrill }: { days: string[]; onDrill: (id: string) => void }) {
  const m = METRICS.filter(x => x.group === "quality");

  // LAMA rate trend
  const lamaRateSeries = buildSeries(METRICS.find(x => x.id === "lamaRate")!, days);

  return (
    <div className="space-y-6">
      <Group title="Outcome Rates (click any card)">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {m.map(x => <MetricCard key={x.id} m={x} days={days} onDrill={onDrill} />)}
        </div>
      </Group>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="LAMA Rate Trend">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={lamaRateSeries.map(d => ({ ...d, pct: d.value * 100 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} minTickGap={20} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtShort} formatter={(v: any) => `${Number(v).toFixed(2)}%`} />
              <Line type="monotone" dataKey="pct" stroke="var(--coral)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Outward Referral Analysis">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={referralOut} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis dataKey="dest" type="category" width={150} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="n" fill="var(--navy)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="LAMA by Reason">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={lamaReasons}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="reason" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="n" fill="var(--coral)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="LAMA by Pincode">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={lamaPincode}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="pin" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="n" fill="var(--navy)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

/* ───────────────────────────── KPI card + drill panel ───────────────────────────── */

function MetricCard({ m, days, onDrill }: { m: Metric; days: string[]; onDrill: (id: string) => void }) {
  const series = useMemo(() => buildSeries(m, days), [m, days]);
  const avg = series.reduce((s, x) => s + x.value, 0) / series.length;
  const recent = series.slice(-7).reduce((s, x) => s + x.value, 0) / Math.min(7, series.length);
  const delta = recent - avg;
  const colors: Record<string, string> = {
    navy: "var(--navy)", coral: "var(--coral)", amber: "var(--amber-emerg)", green: "var(--urgent-safe)",
  };
  return (
    <button
      onClick={() => onDrill(m.id)}
      className="text-left bg-card rounded-2xl shadow-soft p-5 hover:shadow-soft-lg hover:-translate-y-0.5 transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{m.label}</span>
        <span className="h-9 w-9 rounded-xl grid place-items-center text-white" style={{ background: colors[m.tone] }}>
          <m.Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-3xl font-bold text-navy tracking-tight">{m.fmt(avg)}</div>
      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
        <span>
          {m.target}{" · "}
          <span style={{ color: delta < 0 ? "var(--urgent-safe)" : "var(--coral)" }}>
            {delta >= 0 ? "+" : ""}{m.fmt(Math.abs(delta))} vs avg
          </span>
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-coral opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function DrillPanel({ metric, days, onClose }: { metric: Metric; days: string[]; onClose: () => void }) {
  const series = useMemo(() => buildSeries(metric, days), [metric, days]);
  const [selDate, setSelDate] = useState<string>(series[series.length - 1]?.date ?? days[days.length - 1]);
  const list = useMemo(() => patientsFor(metric.id, selDate), [metric, selDate]);
  const point = series.find(s => s.date === selDate) ?? series[series.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-soft-lg max-w-5xl w-full max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl grid place-items-center text-white" style={{ background: "var(--navy)" }}>
              <metric.Icon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-bold text-navy">{metric.label}</h3>
              <div className="text-xs text-muted-foreground">{metric.target} · click any point on the trend to load patients</div>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-card rounded-2xl shadow-soft p-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={series.map(s => ({ ...s, display: metric.kind === "rate" ? s.value * 100 : s.value }))}
                onClick={(e: any) => {
                  const d = e?.activePayload?.[0]?.payload?.date;
                  if (d) setSelDate(d);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} minTickGap={20} />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  unit={metric.kind === "rate" ? "%" : metric.unit ? ` ${metric.unit}` : ""}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={fmtShort}
                  formatter={(v: any) => metric.kind === "rate" ? `${Number(v).toFixed(2)}%` : `${Number(v).toFixed(1)} ${metric.unit ?? ""}`}
                />
                <Line
                  type="monotone" dataKey="display" stroke="var(--coral)" strokeWidth={2.5}
                  dot={(props: any) => {
                    const active = props.payload.date === selDate;
                    return (
                      <circle
                        key={props.payload.date}
                        cx={props.cx} cy={props.cy}
                        r={active ? 6 : 3}
                        fill={active ? "var(--amber-emerg)" : "var(--coral)"}
                        stroke="white" strokeWidth={active ? 2 : 1}
                      />
                    );
                  }}
                  activeDot={{ r: 7, fill: "var(--amber-emerg)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl shadow-soft">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Patients on</div>
                <div className="font-bold text-navy">{fmtShort(selDate)} · {metric.fmt(point.value)}</div>
              </div>
              <div className="text-xs text-muted-foreground">{list.length} patients</div>
            </div>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2">Patient</th>
                  <th className="text-left px-4 py-2">UMR</th>
                  <th className="text-left px-4 py-2">Pathway</th>
                  <th className="text-left px-4 py-2">Physician</th>
                  <th className="text-left px-4 py-2">Visit</th>
                </tr>
              </thead>
              <tbody>
                {list.map(p => (
                  <tr key={p.key} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium text-navy">{p.name}</td>
                    <td className="px-4 py-2 text-muted-foreground tabular-nums">{p.umr}</td>
                    <td className="px-4 py-2 text-muted-foreground">{p.pathway}</td>
                    <td className="px-4 py-2 text-muted-foreground">{p.physician}</td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">{p.visitTime}</td>
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

/* ───────────────────────────── Shared bits ───────────────────────────── */

const tooltipStyle = { borderRadius: 12, border: "1px solid var(--border)", background: "white" };

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">{title}</h2>
      {children}
    </section>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl shadow-soft p-5 ${className}`}>
      <h3 className="font-bold text-navy mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Legend({ items }: { items: { name: string; value: number; color: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 mt-2">
      {items.map(d => (
        <div key={d.name} className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
          <span className="text-navy">{d.name}</span>
          <span className="ml-auto font-semibold">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function RankList({ title, Icon, items }: { title: string; Icon: any; items: readonly (readonly [string, number])[] }) {
  const max = Math.max(...items.map(([, n]) => n));
  return (
    <div className="bg-card rounded-2xl shadow-soft p-5">
      <h3 className="font-bold text-navy mb-3 inline-flex items-center gap-2"><Icon className="h-4 w-4 text-coral" />{title}</h3>
      <ol className="space-y-2">
        {items.map(([name, n], i) => (
          <li key={name} className="flex items-center gap-3 text-sm">
            <span className="w-5 text-right text-xs font-bold text-muted-foreground tabular-nums">{i + 1}</span>
            <span className="flex-1 truncate text-navy font-medium">{name}</span>
            <div className="w-32 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: "var(--coral)" }} />
            </div>
            <span className="w-8 text-right tabular-nums text-navy font-semibold">{n}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function WardTable() {
  return (
    <table className="w-full text-sm">
      <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
        <tr><th className="text-left pb-2">Ward</th><th className="text-right pb-2">Beds</th><th className="text-right pb-2">Util</th></tr>
      </thead>
      <tbody>
        {wards.map(w => {
          const pct = Math.round((w.occupied / w.total) * 100);
          const tone = pct >= 90 ? "var(--urgent-critical)" : pct >= 75 ? "var(--urgent-urgent)" : "var(--urgent-safe)";
          return (
            <tr key={w.name} className="border-t border-border">
              <td className="py-2 text-navy font-medium">{w.name}</td>
              <td className="py-2 text-right tabular-nums text-muted-foreground">{w.occupied}/{w.total}</td>
              <td className="py-2 text-right"><span className="font-bold" style={{ color: tone }}>{pct}%</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ─ silence "imported but unused" guard for icons we keep available ─ */
void TrendingUp; void Truck; void Users; void FileText;