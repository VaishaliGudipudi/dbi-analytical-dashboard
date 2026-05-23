import { useMemo, useState } from "react";
import { X, Download, FileText } from "lucide-react";
import type { Patient, Ward } from "@/lib/edTypes";
import { exportReportDocument } from "@/lib/exports";

type Range = "7d" | "30d" | "custom";

export function ReportsModal({ patients, wards, onClose }: { patients: Patient[]; wards: Ward[]; onClose: () => void }) {
  const [range, setRange] = useState<Range>("7d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
  const report = useMemo(() => buildReport(days, patients, wards), [days, patients, wards]);

  const reportHtml = `
    <h1>Emergency Summary Report</h1>
    <p>Range: ${range === "custom" ? `${custom.from || "start"} to ${custom.to || "end"}` : `Last ${days} days`}</p>
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      ${report.kpis.map(k => `<tr><td>${k.label}</td><td>${k.value}</td></tr>`).join("")}
    </table>`;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-soft-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
          <div>
            <h2 className="font-bold text-navy text-lg">Reports</h2>
            <p className="text-xs text-muted-foreground">Operational summary, exportable</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary/40 rounded-xl p-1">
              {(["7d","30d","custom"] as Range[]).map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${range===r?"bg-card text-navy shadow-soft":"text-muted-foreground"}`}>
                  {r==="7d"?"Last 7 days":r==="30d"?"Last 30 days":"Custom"}
                </button>
              ))}
            </div>
            {range==="custom" && (
              <div className="flex items-center gap-1">
                <input type="date" value={custom.from} onChange={e=>setCustom({...custom,from:e.target.value})} className="text-xs rounded-md border border-border px-2 py-1 bg-background"/>
                <input type="date" value={custom.to} onChange={e=>setCustom({...custom,to:e.target.value})} className="text-xs rounded-md border border-border px-2 py-1 bg-background"/>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={() => exportReportDocument("Emergency Summary Report", reportHtml, "pdf")}
                className="inline-flex items-center gap-2 rounded-lg bg-navy text-navy-foreground px-3 py-2 text-xs font-semibold">
                <Download className="h-3.5 w-3.5"/> PDF
              </button>
              <button onClick={() => exportReportDocument("Emergency Summary Report", reportHtml, "word")}
                className="inline-flex items-center gap-2 rounded-lg border border-border text-navy px-3 py-2 text-xs font-semibold">
                <FileText className="h-3.5 w-3.5"/> Word
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {report.kpis.map(k => (
              <div key={k.label} className="bg-secondary/30 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className="text-2xl font-bold text-navy mt-1">{k.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{k.note}</div>
              </div>
            ))}
          </div>
          <table className="w-full text-sm">
            <tbody>
              {report.rows.map(r => (
                <tr key={r.label} className="border-t border-border">
                  <td className="py-2 text-muted-foreground">{r.label}</td>
                  <td className="py-2 text-right font-semibold text-navy">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function buildReport(days: number, patients: Patient[], wards: Ward[]) {
  const totalVisits = patients.length * days;
  return {
    kpis: [
      { label: "Total visits", value: totalVisits, note: "Seeded database rollup" },
      { label: "Active now", value: patients.filter((p) => p.status !== "discharged").length, note: "ED + observation" },
      { label: "Discharges", value: patients.filter((p) => p.status === "discharged").length, note: "Completed" },
      { label: "Critical wards", value: wards.filter(w=>w.occupied/w.total>=0.9).length, note: ">=90% occupancy" },
    ],
    rows: [
      { label: "Male patients", value: patients.filter(p=>p.sex==="M").length },
      { label: "Female patients", value: patients.filter(p=>p.sex==="F").length },
      { label: "Level I triage", value: patients.filter(p=>p.triage===1).length },
      { label: "Level II triage", value: patients.filter(p=>p.triage===2).length },
      { label: "Avg bed occupancy", value: `${Math.round(wards.reduce((s,w)=>s+w.occupied/w.total,0)/wards.length*100)}%` },
    ],
  };
}
