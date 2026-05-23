import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { getEdSnapshot } from "@/lib/edApi";
import type { Patient, Ward } from "@/lib/edTypes";
import { exportReportDocument } from "@/lib/exports";

export const Route = createFileRoute("/_app/reports")({
  loader: async () => getEdSnapshot(),
  component: Page,
});

type Range = "7d" | "30d" | "custom";

function Page() {
  const { patients, wards } = Route.useLoaderData();
  const [range, setRange] = useState<Range>("7d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const days = range === "7d" ? 7 : range === "30d" ? 30 : Math.max(1, daysBetween(custom.from, custom.to));
  const report = useMemo(() => buildReport(days, patients, wards), [days, patients, wards]);

  const reportHtml = `
    <h1>Emergency Summary Report</h1>
    <p class="note">Range: ${range === "custom" ? `${custom.from || "start"} to ${custom.to || "end"}` : `Last ${days} days`}</p>
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      ${report.kpis.map(k => `<tr><td>${k.label}</td><td>${k.value}</td></tr>`).join("")}
    </table>
  `;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Reports</h1>
          <p className="text-sm text-muted-foreground">Operational summary and exportable report</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RangeFilter range={range} setRange={setRange} custom={custom} setCustom={setCustom} />
          <button onClick={() => exportReportDocument("Emergency Summary Report", reportHtml, "pdf")}
            className="inline-flex items-center gap-2 rounded-xl bg-navy text-navy-foreground px-4 py-2.5 text-sm font-semibold shadow-soft">
            <Download className="h-4 w-4" /> Export PDF
          </button>
          <button onClick={() => exportReportDocument("Emergency Summary Report", reportHtml, "word")}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card text-navy px-4 py-2.5 text-sm font-semibold shadow-soft hover:bg-secondary/40">
            <FileText className="h-4 w-4" /> Export Word
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {report.kpis.map(k => (
          <div key={k.label} className="bg-card rounded-2xl shadow-soft p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
            <div className="text-3xl font-bold text-navy mt-2">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.note}</div>
          </div>
        ))}
      </div>

      <section className="bg-card rounded-2xl shadow-soft p-5">
        <h2 className="font-bold text-navy mb-3">Summary Report</h2>
        <table className="w-full text-sm">
          <tbody>
            {report.rows.map(r => (
              <tr key={r.label} className="border-t border-border">
                <td className="py-3 text-muted-foreground">{r.label}</td>
                <td className="py-3 text-right font-semibold text-navy">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function RangeFilter({ range, setRange, custom, setCustom }: any) {
  return (
    <div className="flex items-center gap-1 bg-card rounded-xl shadow-soft p-1.5">
      {(["7d", "30d", "custom"] as Range[]).map(r => (
        <button key={r} onClick={() => setRange(r)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${range === r ? "bg-coral text-coral-foreground" : "text-muted-foreground hover:text-navy"}`}>
          {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "Custom"}
        </button>
      ))}
      {range === "custom" && (
        <div className="flex items-center gap-1 pl-2">
          <input type="date" value={custom.from} onChange={e => setCustom({ ...custom, from: e.target.value })} className="text-xs rounded-md border border-border px-2 py-1 bg-background" />
          <input type="date" value={custom.to} onChange={e => setCustom({ ...custom, to: e.target.value })} className="text-xs rounded-md border border-border px-2 py-1 bg-background" />
        </div>
      )}
    </div>
  );
}

function buildReport(days: number, patients: Patient[], wards: Ward[]) {
  const totalVisits = patients.length * days;
  return {
    kpis: [
      { label: "Total visits", value: totalVisits, note: "Backend database rollup" },
      { label: "Active now", value: patients.filter((p) => p.status !== "discharged").length, note: "ED + observation" },
      { label: "Discharges", value: patients.filter((p) => p.status === "discharged").length, note: "Completed ED visits" },
      { label: "Critical wards", value: wards.filter(w => w.occupied / w.total >= 0.9).length, note: "At or above 90% occupancy" },
    ],
    rows: [
      { label: "Male patients", value: patients.filter(p => p.sex === "M").length },
      { label: "Female patients", value: patients.filter(p => p.sex === "F").length },
      { label: "Level I triage", value: patients.filter(p => p.triage === 1).length },
      { label: "Level II triage", value: patients.filter(p => p.triage === 2).length },
      { label: "Pending triage", value: patients.filter(p => p.triage === 0).length },
      { label: "Average bed occupancy", value: `${Math.round(wards.reduce((s, w) => s + w.occupied / w.total, 0) / wards.length * 100)}%` },
    ],
  };
}

function daysBetween(from: string, to: string) {
  if (!from || !to) return 1;
  return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;
}
