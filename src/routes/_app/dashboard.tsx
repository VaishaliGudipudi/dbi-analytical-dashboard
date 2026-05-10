import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Zap, Search, X, MoreHorizontal } from "lucide-react";
import { patients, wards, triageMeta } from "@/lib/mockData";
import { TriageBadge, triageBorderColor } from "@/components/app/TriageBadge";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const [tab, setTab] = useState<"list" | "perf">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const counts = {
    1: patients.filter(p => p.triage === 1).length,
    2: patients.filter(p => p.triage === 2).length,
    3: patients.filter(p => p.triage === 3).length,
    0: patients.filter(p => p.triage === 0).length,
  };
  // demo numbers per spec
  const display = { 1: 16, 2: 10, 3: 2, 0: 1 };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">ED Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live view across the Emergency Department</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/register" })}
            className="inline-flex items-center gap-2 rounded-xl bg-navy text-navy-foreground px-4 py-2.5 text-sm font-medium shadow-soft hover:opacity-95">
            <Plus className="h-4 w-4" /> New Patient
          </button>
          <button onClick={() => navigate({ to: "/rapid" })}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white shadow-soft-lg hover:scale-[1.02] transition-transform"
            style={{ background: "var(--amber-emerg)" }}>
            <Zap className="h-5 w-5 fill-white" /> Rapid Emergency
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-secondary/50 p-1 rounded-xl w-fit">
        {[
          { id: "list", label: "Patient List" },
          { id: "perf", label: "Performance Analytics" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? "bg-card text-navy shadow-soft" : "text-muted-foreground hover:text-navy"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "perf" ? (
        <div className="bg-card rounded-2xl shadow-soft p-12 text-center text-muted-foreground">
          Performance analytics coming soon — visit the Admin Analytics view.
        </div>
      ) : (
        <>
          {/* Triage + Bed status row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
            <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              {([1, 2, 3, 0] as const).map(level => {
                const m = triageMeta[level];
                return (
                  <div key={level} className="rounded-2xl p-5 text-white shadow-soft" style={{ background: m.color }}>
                    <div className="text-5xl font-bold tracking-tight">{display[level]}</div>
                    <div className="text-sm font-semibold mt-2">{m.label}</div>
                    <div className="text-xs opacity-90">{m.sub}</div>
                  </div>
                );
              })}
              <div className="md:col-span-4 bg-card rounded-2xl shadow-soft p-4 flex items-center gap-5">
                <DonutMini active={29} completed={96} />
                <div>
                  <div className="text-xs text-muted-foreground">Today</div>
                  <div className="font-semibold text-navy">29 active · 96 completed</div>
                </div>
              </div>
            </div>

            {/* Bed status */}
            <div className="bg-card rounded-2xl shadow-soft p-5">
              <h3 className="font-semibold text-navy mb-3">Bed Status by Ward</h3>
              <div className="space-y-3">
                {wards.map(w => {
                  const pct = Math.round((w.occupied / w.total) * 100);
                  const critical = pct >= 90;
                  return (
                    <div key={w.name} className={`rounded-xl p-3 ${critical ? "bg-destructive/10 ring-1 ring-destructive/30" : ""}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="font-medium text-navy text-sm">{w.name}</div>
                        <div className="flex items-center gap-2">
                          {critical && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive text-white pulse-critical">
                              {pct >= 100 ? "WARD FULL" : "CRITICAL CAPACITY"}
                            </span>
                          )}
                          <span className={`text-xs font-bold ${critical ? "text-destructive" : "text-muted-foreground"}`}>{pct}%</span>
                        </div>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-mint">
                        <div style={{ width: `${pct}%`, background: "var(--urgent-critical)" }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                        <span>Occupied {w.occupied}/{w.total}</span>
                        <span style={{ color: "var(--urgent-safe)" }}>{w.total - w.occupied} available</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="bg-card rounded-2xl shadow-soft p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 rounded accent-coral" />
                <span className="text-navy">Patients assigned to me</span>
              </label>
              <button className="text-sm rounded-full border border-border px-3 py-1.5 text-navy hover:bg-secondary/50">Age Range</button>
              <span className="inline-flex items-center gap-1 text-xs bg-secondary text-navy px-2.5 py-1 rounded-full">
                Doctor: Dr. Tejaswi <X className="h-3 w-3 cursor-pointer" />
              </span>
              <button className="text-xs text-coral font-medium ml-auto">Clear All Filters</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input placeholder="Search by Name" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-coral" />
              </div>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input placeholder="Search by UMR" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-coral" />
              </div>
              <button className="rounded-lg bg-navy text-navy-foreground text-sm font-medium px-4">Open</button>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex gap-2 mb-4">
            {[
              { id: "all", label: "All Active" },
              { id: "ed", label: "ED Active" },
              { id: "obs", label: "Observation Active" },
              { id: "discharged", label: "Discharged" },
            ].map(s => (
              <button key={s.id} onClick={() => setStatusFilter(s.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s.id ? "bg-navy text-navy-foreground" : "bg-card text-navy border border-border hover:bg-secondary/50"}`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Patient table */}
          <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
            <div className="grid grid-cols-[1.6fr_0.9fr_0.6fr_0.6fr_0.9fr_1fr_0.7fr] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border bg-secondary/30">
              <div>Name</div><div>Triage</div><div>Bed</div><div>Check-in</div><div>ER Physician</div><div>Care Pathway</div><div className="text-right">Action</div>
            </div>
            {patients.map(p => (
              <div key={p.id}
                className="grid grid-cols-[1.6fr_0.9fr_0.6fr_0.6fr_0.9fr_1fr_0.7fr] gap-4 px-5 py-4 items-center border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                style={{ borderLeft: `4px solid ${triageBorderColor(p.triage)}` }}>
                <div>
                  <div className="font-bold text-navy text-base">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.age > 0 ? `${p.age}y` : "—"} · {p.sex} · <span className="bg-secondary px-1.5 py-0.5 rounded">{p.department}</span>
                  </div>
                </div>
                <TriageBadge level={p.triage as any} />
                <div className="text-sm text-navy font-medium">{p.bed}</div>
                <div className="text-sm text-muted-foreground">{p.checkIn}</div>
                <div className="text-sm text-navy">{p.physician}</div>
                <div className="text-sm">{p.pathway}</div>
                <div className="flex justify-end gap-2">
                  <Link to="/patient/$id/workspace" params={{ id: p.id }}
                    className="rounded-lg bg-coral text-coral-foreground text-xs font-semibold px-3 py-2 shadow-soft hover:opacity-95">
                    Select
                  </Link>
                  <button className="h-8 w-8 grid place-items-center rounded-lg border border-border hover:bg-secondary">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DonutMini({ active, completed }: { active: number; completed: number }) {
  const total = active + completed;
  const pct = active / total;
  const r = 28, c = 2 * Math.PI * r;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} stroke="var(--mint)" strokeWidth="10" fill="none" />
      <circle cx="40" cy="40" r={r} stroke="var(--coral)" strokeWidth="10" fill="none"
        strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round" transform="rotate(-90 40 40)" />
      <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--navy)">{active}</text>
    </svg>
  );
}
