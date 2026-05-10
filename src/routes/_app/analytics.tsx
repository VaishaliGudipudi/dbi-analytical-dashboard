import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Users, Bed, CheckCircle2 } from "lucide-react";
import { wards } from "@/lib/mockData";

export const Route = createFileRoute("/_app/analytics")({ component: Analytics });

const hourly = Array.from({ length: 24 }, (_, h) => ({
  hour: `${String(h).padStart(2,"0")}:00`,
  patients: Math.round(8 + 14 * Math.sin((h - 6) / 4) + Math.random() * 4 + (h>=18&&h<=23?6:0)),
}));
const triageDist = [
  { name: "Level I", value: 16, color: "var(--urgent-critical)" },
  { name: "Level II", value: 10, color: "var(--urgent-urgent)" },
  { name: "Level III", value: 2, color: "var(--urgent-pending)" },
  { name: "Discharged", value: 96, color: "var(--urgent-safe)" },
];
const complaints = [
  { name: "Cardiac", n: 28 },{ name: "Trauma", n: 22 },{ name: "Respiratory", n: 19 },
  { name: "Snake Bite", n: 14 },{ name: "Stroke", n: 12 },{ name: "Sepsis", n: 11 },
  { name: "Poisoning", n: 9 },{ name: "GI", n: 8 },{ name: "Anaphylaxis", n: 5 },{ name: "Other", n: 4 },
];

function Analytics() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold text-navy tracking-tight">Analytics Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Department performance and trends</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Kpi label="Total Patients Today" value="125" delta="+12%" Icon={Users} tone="navy" />
        <Kpi label="Avg Triage Time" value="8 min" delta="-1.2 min" Icon={TrendingUp} tone="coral" />
        <Kpi label="Bed Occupancy" value="87%" delta="+4%" Icon={Bed} tone="amber" />
        <Kpi label="Discharged" value="96" delta="+18" Icon={CheckCircle2} tone="green" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-card rounded-2xl shadow-soft p-5">
          <h3 className="font-bold text-navy mb-3">Patient Volume by Hour</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "white" }} />
              <Line type="monotone" dataKey="patients" stroke="var(--coral)" strokeWidth={3} dot={{ fill: "var(--coral)", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-2xl shadow-soft p-5">
          <h3 className="font-bold text-navy mb-3">Triage Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={triageDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                {triageDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {triageDist.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-navy">{d.name}</span>
                <span className="ml-auto font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-card rounded-2xl shadow-soft p-5">
          <h3 className="font-bold text-navy mb-3">Top 10 Chief Complaints (this week)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={complaints}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
              <Bar dataKey="n" fill="var(--navy)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl shadow-soft p-5">
          <h3 className="font-bold text-navy mb-3">Ward Bed Utilization</h3>
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
                    <td className="py-2 text-right">
                      <span className="font-bold" style={{ color: tone }}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
      <div className="text-xs text-muted-foreground mt-1">{delta} vs yesterday</div>
    </div>
  );
}
