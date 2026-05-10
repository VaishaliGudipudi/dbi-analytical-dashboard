import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import {
  TrendingUp, Users, Bed, CheckCircle2, Stethoscope, HeartPulse, Briefcase,
  Activity, Pill, FlaskConical, Clock, AlertTriangle, ShieldCheck, RotateCcw,
  Skull, Repeat, Truck, FileText, UserCheck, Building2,
} from "lucide-react";
import { wards } from "@/lib/mockData";

export const Route = createFileRoute("/_app/analytics")({ component: Analytics });

type RoleTab = "doctor" | "nurse" | "admin";

function Analytics() {
  const [tab, setTab] = useState<RoleTab>("doctor");

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Role-grouped KPIs · live this shift</p>
        </div>
        <div className="text-xs text-muted-foreground">
          Window: <span className="font-semibold text-navy">Today · 06:00 → now</span>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex gap-1.5 mb-6 bg-secondary/50 p-1.5 rounded-xl w-fit">
        {[
          { id: "doctor" as const, label: "Doctor", Icon: Stethoscope },
          { id: "nurse" as const, label: "Nurse", Icon: HeartPulse },
          { id: "admin" as const, label: "Manager / Admin", Icon: Briefcase },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-card text-navy shadow-soft" : "text-muted-foreground hover:text-navy"
            }`}>
            <t.Icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "doctor" && <DoctorView />}
      {tab === "nurse" && <NurseView />}
      {tab === "admin" && <AdminView />}
    </div>
  );
}

/* ─────────────── DOCTOR ─────────────── */

const triageDist = [
  { name: "Level I",    value: 16, color: "var(--urgent-critical)" },
  { name: "Level II",   value: 10, color: "var(--urgent-urgent)" },
  { name: "Level III",  value: 2,  color: "var(--urgent-pending)" },
  { name: "Discharged", value: 96, color: "var(--urgent-safe)" },
];
const pathwayCases = [
  { name: "STEMI",        n: 14 }, { name: "Stroke",       n: 11 },
  { name: "Trauma",       n: 22 }, { name: "Sepsis Bundle", n: 9 },
  { name: "Antivenom",    n: 7  }, { name: "Toxicology",   n: 6 },
  { name: "Anaphylaxis",  n: 4  }, { name: "Respiratory",  n: 12 },
  { name: "General",      n: 18 },
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

function DoctorView() {
  return (
    <div className="space-y-6">
      {/* Time-critical KPI strip */}
      <Group title="Time-Critical Performance">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Door to Thrombolysis" value="42 min" delta="Target ≤ 60 min" Icon={Clock} tone="green" />
          <Kpi label="Door to Balloon" value="78 min" delta="Target ≤ 90 min" Icon={Activity} tone="green" />
          <Kpi label="ER Mortality Rate" value="1.8%" delta="-0.3% vs week" Icon={Skull} tone="coral" />
          <Kpi label="Care Plan Compliance" value="94%" delta="+2% vs week" Icon={ShieldCheck} tone="navy" />
        </div>
      </Group>

      {/* Outcomes */}
      <Group title="Outcomes & Returns">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="72-Hour Readmission" value="3.4%" delta="-0.6% vs week" Icon={Repeat} tone="amber" />
          <Kpi label="Return After Discharge" value="5.1%" delta="+0.2% vs week" Icon={RotateCcw} tone="amber" />
          <Kpi label="Patients Today" value="125" delta="+12 vs yesterday" Icon={Users} tone="navy" />
          <Kpi label="Discharged" value="96" delta="+18 vs yesterday" Icon={CheckCircle2} tone="green" />
        </div>
      </Group>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Triage Categories Distribution" className="lg:col-span-1">
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

        <ChartCard title="ER Cases by Care Pathway" className="lg:col-span-2">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RankList title="Top 15 Medications Prescribed" Icon={Pill} items={topMeds as any} />
        <RankList title="Top 15 Investigations Ordered" Icon={FlaskConical} items={topInvestigations as any} />
      </div>

      {/* Capacity awareness — doctors need this for admit/discharge calls */}
      <Group title="Bed & Capacity Awareness">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Kpi label="Bed Occupancy Rate" value="87%" delta="+4% vs yesterday" Icon={Bed} tone="amber" />
          <Kpi label="Patients per Doctor" value="14.2" delta="Shift avg" Icon={UserCheck} tone="navy" />
          <Kpi label="ER TAT" value="2h 18m" delta="-12 min vs week" Icon={Clock} tone="green" />
          <Kpi label="Footfall Today" value="125" delta="+12 vs yesterday" Icon={TrendingUp} tone="coral" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WardUtilization />
          <ChartCard title="Footfall Trend (last 14 days)">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={footfall}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="patients" stroke="var(--navy)" strokeWidth={3} dot={{ fill: "var(--coral)", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </Group>
    </div>
  );
}

/* ─────────────── NURSE ─────────────── */

const tatByHour = Array.from({ length: 12 }, (_, i) => ({
  hour: `${String(8 + i).padStart(2, "0")}:00`,
  tat: Math.round(6 + Math.random() * 8 + (i > 8 ? 4 : 0)),
}));
const protocolSets = [
  { name: "Cardiac Set",     n: 18 }, { name: "Sepsis Bundle", n: 14 },
  { name: "Trauma Bay Set",  n: 11 }, { name: "Stroke Set",    n: 9  },
  { name: "Respiratory Set", n: 12 }, { name: "Toxicology Set", n: 6 },
  { name: "Antivenom Set",   n: 7  }, { name: "Pediatric Set", n: 5  },
];

function NurseView() {
  return (
    <div className="space-y-6">
      <Group title="Assessment Performance">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi label="Initial Assessment TAT" value="6.4 min" delta="Target ≤ 10 min" Icon={Clock} tone="green" />
          <Kpi label="Protocol Sets Ordered" value="82" delta="+9 vs yesterday" Icon={FileText} tone="navy" />
          <Kpi label="Pending Assessments" value="4" delta="2 over SLA" Icon={AlertTriangle} tone="amber" />
        </div>
      </Group>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Initial Assessment TAT (last 12 hours)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={tatByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} unit=" m" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="tat" stroke="var(--coral)" strokeWidth={3} dot={{ fill: "var(--coral)", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Protocol Sets Ordered (this shift)">
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
      </div>

      {/* Capacity context — nurses triage and bed-place */}
      <Group title="Bed & Capacity Awareness">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Kpi label="Bed Occupancy Rate" value="87%" delta="+4% vs yesterday" Icon={Bed} tone="amber" />
          <Kpi label="Footfall Today" value="125" delta="+12 vs yesterday" Icon={TrendingUp} tone="coral" />
          <Kpi label="Ambulance Arrivals" value="32" delta="Today" Icon={Truck} tone="navy" />
          <Kpi label="Walk-In Arrivals" value="78" delta="Today" Icon={Users} tone="green" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WardUtilization />
          <ChartCard title="Triage Categories Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={triageDist} dataKey="value" nameKey="name" innerRadius={44} outerRadius={82} paddingAngle={3}>
                  {triageDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <Legend items={triageDist} />
          </ChartCard>
        </div>
      </Group>
    </div>
  );
}

/* ─────────────── ADMIN ─────────────── */

const dispositionDist = [
  { name: "Discharged",      value: 64, color: "var(--urgent-safe)" },
  { name: "Admitted",        value: 38, color: "var(--navy)" },
  { name: "Referred Out",    value: 12, color: "var(--coral)" },
  { name: "LAMA",            value: 6,  color: "var(--urgent-pending)" },
  { name: "Expired",         value: 2,  color: "var(--urgent-critical)" },
];
const providerDispo = [
  { name: "Dr. Tejaswi", discharged: 22, admitted: 12, referred: 3, lama: 1 },
  { name: "Dr. Mehta",   discharged: 18, admitted: 10, referred: 2, lama: 2 },
  { name: "Dr. Khan",    discharged: 14, admitted: 9,  referred: 4, lama: 1 },
  { name: "Dr. Iyer",    discharged: 10, admitted: 7,  referred: 3, lama: 2 },
];
const footfall = Array.from({ length: 14 }, (_, i) => ({
  d: `D-${13 - i}`,
  patients: Math.round(90 + Math.random() * 50 + (i > 9 ? 20 : 0)),
}));
const arrivalMix = [
  { name: "Walk-In",    value: 78, color: "var(--coral)" },
  { name: "Ambulance",  value: 32, color: "var(--navy)" },
  { name: "Referral",   value: 15, color: "var(--urgent-pending)" },
];

function AdminView() {
  return (
    <div className="space-y-6">
      <Group title="Volume & Capacity">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Bed Occupancy Rate" value="87%" delta="+4% vs yesterday" Icon={Bed} tone="amber" />
          <Kpi label="Patients per Doctor" value="14.2" delta="Shift avg" Icon={UserCheck} tone="navy" />
          <Kpi label="ER TAT" value="2h 18m" delta="-12 min vs week" Icon={Clock} tone="green" />
          <Kpi label="MLC Cases" value="9" delta="Today" Icon={ShieldCheck} tone="coral" />
        </div>
      </Group>

      <Group title="Referrals & LAMA">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi label="Outward Referrals" value="12" delta="9.6% of dispositions" Icon={Building2} tone="navy" />
          <Kpi label="LAMA Cases" value="6" delta="4.8% of dispositions" Icon={AlertTriangle} tone="amber" />
          <Kpi label="Avg Door-to-Disposition" value="3h 04m" delta="-8 min vs week" Icon={Activity} tone="green" />
        </div>
      </Group>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

        <ChartCard title="Ambulance vs Walk-In vs Referral" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={arrivalMix} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {arrivalMix.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Footfall Trend (last 14 days)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={footfall}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="patients" stroke="var(--navy)" strokeWidth={3} dot={{ fill: "var(--coral)", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Provider-wise Disposition Breakdown">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={providerDispo}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="discharged" stackId="a" fill="var(--urgent-safe)" />
              <Bar dataKey="admitted"   stackId="a" fill="var(--navy)" />
              <Bar dataKey="referred"   stackId="a" fill="var(--coral)" />
              <Bar dataKey="lama"       stackId="a" fill="var(--urgent-pending)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            <LegendDot color="var(--urgent-safe)" label="Discharged" />
            <LegendDot color="var(--navy)" label="Admitted" />
            <LegendDot color="var(--coral)" label="Referred" />
            <LegendDot color="var(--urgent-pending)" label="LAMA" />
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Ward Bed Utilization">
        <WardTable />
      </ChartCard>
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

function WardUtilization() {
  return (
    <ChartCard title="Ward Bed Utilization">
      <WardTable />
    </ChartCard>
  );
}

/* ─────────────── shared ─────────────── */

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

function Kpi({ label, value, delta, Icon, tone }: any) {
  const colors: Record<string, string> = {
    navy: "var(--navy)", coral: "var(--coral)", amber: "var(--amber-emerg)", green: "var(--urgent-safe)",
  };
  return (
    <div className="bg-card rounded-2xl shadow-soft p-5">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="h-9 w-9 rounded-xl grid place-items-center text-white" style={{ background: colors[tone] }}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-3xl font-bold text-navy tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{delta}</div>
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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-navy">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
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
