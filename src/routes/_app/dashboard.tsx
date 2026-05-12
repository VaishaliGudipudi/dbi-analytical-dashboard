import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
<<<<<<< HEAD
import { Activity, Bed, Download, MoreHorizontal, Plus, Search, TrendingUp, Users, X, Zap } from "lucide-react";
import { patients, triageMeta, wards, type Patient, type Triage } from "@/lib/mockData";
import { TriageBadge, triageBorderColor } from "@/components/app/TriageBadge";
import { downloadCsv } from "@/lib/exports";
=======
import { Plus, Zap, Search, X, MoreHorizontal } from "lucide-react";
import { patients, wards, triageMeta } from "@/lib/mockData";
import { TriageBadge, triageBorderColor } from "@/components/app/TriageBadge";
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const [tab, setTab] = useState<"list" | "perf">("list");
  const [statusFilter, setStatusFilter] = useState("all");
<<<<<<< HEAD
  const [drill, setDrill] = useState<string | null>(null);
  const [selectedWard, setSelectedWard] = useState<(typeof wards)[number] | null>(null);
  const navigate = useNavigate();

const display = { 1: 16, 2: 10, 3: 2, 0: 1 };
  const sexCounts = [
    { label: "Male", key: "M", value: patients.filter(p => p.sex === "M").length, color: "var(--navy)" },
    { label: "Female", key: "F", value: patients.filter(p => p.sex === "F").length, color: "var(--coral)" },
    { label: "Other", key: "Other", value: patients.filter(p => p.sex === "Other").length, color: "var(--amber-emerg)" },
  ];
  const totalBeds = wards.reduce((sum, w) => sum + w.total, 0);
  const occupiedBeds = wards.reduce((sum, w) => sum + w.occupied, 0);
  const occupancyPct = Math.round((occupiedBeds / totalBeds) * 100);
  const activePatients = patients.filter(p => p.status !== "discharged").length;
  const criticalWards = wards.filter(w => w.occupied / w.total >= 0.9).length;

  const exportDashboard = () => downloadCsv("ed-dashboard-patients.csv", patients.map(p => ({
    UMR: p.umr,
    Name: p.name,
    Age: p.age,
    Sex: p.sex,
    Triage: p.triage === 0 ? "Not Triaged" : `Level ${p.triage}`,
    Bed: p.bed,
    CheckIn: p.checkIn,
    Physician: p.physician,
    Pathway: p.pathway,
    Status: p.status,
  })));
=======
  const navigate = useNavigate();

  const counts = {
    1: patients.filter(p => p.triage === 1).length,
    2: patients.filter(p => p.triage === 2).length,
    3: patients.filter(p => p.triage === 3).length,
    0: patients.filter(p => p.triage === 0).length,
  };
  // demo numbers per spec
  const display = { 1: 16, 2: 10, 3: 2, 0: 1 };
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25

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
<<<<<<< HEAD
          <button onClick={exportDashboard}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card text-navy px-4 py-2.5 text-sm font-medium shadow-soft hover:bg-secondary/40">
            <Download className="h-4 w-4" /> Export Excel
          </button>
=======
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
          <button onClick={() => navigate({ to: "/rapid" })}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white shadow-soft-lg hover:scale-[1.02] transition-transform"
            style={{ background: "var(--amber-emerg)" }}>
            <Zap className="h-5 w-5 fill-white" /> Rapid Emergency
          </button>
        </div>
      </div>

<<<<<<< HEAD
=======
      {/* Tabs */}
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
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
<<<<<<< HEAD
          Performance analytics coming soon - visit the Admin Analytics view.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
            <div className="xl:col-span-2 self-start space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([1, 2, 3, 0] as const).map(level => {
                  const m = triageMeta[level];
                  return (
                    <div key={level} className="h-[7.5rem] rounded-2xl p-3.5 text-white shadow-soft" style={{ background: m.color }}>
                      <div className="text-[2.15rem] font-bold leading-none tracking-tight">{display[level]}</div>
                      <div className="text-sm font-semibold mt-2 leading-tight">{m.label}</div>
                      <div className="text-xs opacity-90">{m.sub}</div>
                    </div>
                  );
                })}
              </div>

              <GraphCard title="Male / Female Distribution" onClick={() => setDrill("Male / Female distribution")}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sexCounts.map(s => (
                    <div key={s.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-navy">{s.label}</span>
                        <span className="font-bold text-navy">{s.value}</span>
                      </div>
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${patients.length ? (s.value / patients.length) * 100 : 0}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </GraphCard>

              <AutoSummary
                activePatients={activePatients}
                occupancyPct={occupancyPct}
                occupiedBeds={occupiedBeds}
                totalBeds={totalBeds}
                criticalWards={criticalWards}
              />
            </div>

            <div className="bg-card rounded-2xl shadow-soft p-4">
              <h3 className="font-semibold text-navy mb-2.5">Bed Status by Ward</h3>
              <div className="space-y-2.5">
=======
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
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
                {wards.map(w => {
                  const pct = Math.round((w.occupied / w.total) * 100);
                  const critical = pct >= 90;
                  return (
<<<<<<< HEAD
                    <button
                      key={w.name}
                      type="button"
                      onClick={() => setSelectedWard(w)}
                      className={`block w-full rounded-xl p-2.5 text-left transition-shadow hover:shadow-soft ${critical ? "bg-destructive/10 ring-1 ring-destructive/30" : "hover:bg-secondary/30"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
=======
                    <div key={w.name} className={`rounded-xl p-3 ${critical ? "bg-destructive/10 ring-1 ring-destructive/30" : ""}`}>
                      <div className="flex items-center justify-between mb-1.5">
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
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
<<<<<<< HEAD
                    </button>
=======
                    </div>
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
                  );
                })}
              </div>
            </div>
          </div>

<<<<<<< HEAD
=======
          {/* Filter bar */}
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
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

<<<<<<< HEAD
=======
          {/* Status pills */}
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
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

<<<<<<< HEAD
=======
          {/* Patient table */}
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
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
<<<<<<< HEAD
                    {p.age > 0 ? `${p.age}y` : "-"} - {p.sex} - <span className="bg-secondary px-1.5 py-0.5 rounded">{p.department}</span>
=======
                    {p.age > 0 ? `${p.age}y` : "—"} · {p.sex} · <span className="bg-secondary px-1.5 py-0.5 rounded">{p.department}</span>
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
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
<<<<<<< HEAD
      {drill && <PatientDrill title={drill} onClose={() => setDrill(null)} />}
      {selectedWard && <WardBedLayout ward={selectedWard} onClose={() => setSelectedWard(null)} />}
=======
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
    </div>
  );
}

<<<<<<< HEAD
function buildWardBeds(ward: (typeof wards)[number]) {
  const assigned = patients.filter(patient => patientBelongsToWard(patient, ward.name));
  const syntheticTriage: Triage[] = [1, 2, 2, 3, 1, 2, 3, 0, 2, 1, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2];
  const syntheticSex: Patient["sex"][] = ["M", "F", "M", "F", "Other", "M", "F", "M", "F", "M"];

  return Array.from({ length: ward.total }, (_, index) => {
    const bedNumber = index + 1;
    const patient = assigned[index] ?? (
      index < ward.occupied
        ? makePlaceholderPatient(ward.name, bedNumber, syntheticTriage[index % syntheticTriage.length], syntheticSex[index % syntheticSex.length])
        : null
    );

    return {
      bed: `${wardPrefix(ward.name)}-${String(bedNumber).padStart(2, "0")}`,
      patient,
    };
  });
}

function patientBelongsToWard(patient: Patient, wardName: string) {
  if (wardName === "Emergency") return patient.bed.startsWith("ER-") && patient.pathway !== "Trauma";
  if (wardName === "Observation") return patient.bed.startsWith("OBS-") || patient.pathway === "Observation";
  if (wardName === "Trauma Bay") return patient.pathway === "Trauma";
  if (wardName === "ICU") return patient.pathway.includes("STEMI") || patient.pathway.includes("Stroke");
  return patient.department === "Pediatric";
}

function wardPrefix(wardName: string) {
  if (wardName === "Emergency") return "ER";
  if (wardName === "Observation") return "OBS";
  if (wardName === "ICU") return "ICU";
  if (wardName === "Trauma Bay") return "TR";
  return "PED";
}

function makePlaceholderPatient(wardName: string, bedNumber: number, triage: Triage, sex: Patient["sex"]): Patient {
  return {
    id: `${wardPrefix(wardName).toLowerCase()}-${bedNumber}`,
    name: "Assigned patient",
    age: 0,
    sex,
    umr: "Pending",
    triage,
    bed: `${wardPrefix(wardName)}-${String(bedNumber).padStart(2, "0")}`,
    checkIn: "--",
    physician: "--",
    pathway: "Bed assigned",
    department: wardName,
    status: "ed",
  };
}

function WardBedLayout({ ward, onClose }: { ward: (typeof wards)[number]; onClose: () => void }) {
  const [selectedBed, setSelectedBed] = useState<ReturnType<typeof buildWardBeds>[number] | null>(null);
  const beds = buildWardBeds(ward);
  const occupancyPct = Math.round((ward.occupied / ward.total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-background shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-3">
          <div>
            <h3 className="text-lg font-bold text-navy">{ward.name} Room Layout</h3>
            <p className="text-xs text-muted-foreground">
              {ward.occupied}/{ward.total} occupied - {occupancyPct}% utilization
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary" aria-label="Close ward layout">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {([1, 2, 3, 0] as Triage[]).map(level => (
              <span key={level} className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-navy shadow-soft">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: triageMeta[level].color }} />
                {triageMeta[level].label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-navy shadow-soft">
              <span className="h-2.5 w-2.5 rounded-full bg-mint ring-1 ring-border" />
              Available
            </span>
          </div>

          <WardFloorPlan beds={beds} onSelectBed={setSelectedBed} />
        </div>

        {selectedBed && <BedDetails bed={selectedBed} onClose={() => setSelectedBed(null)} />}
      </div>
    </div>
  );
}

type WardBed = ReturnType<typeof buildWardBeds>[number];

function WardFloorPlan({ beds, onSelectBed }: { beds: WardBed[]; onSelectBed: (bed: WardBed) => void }) {
  const topBeds = beds.slice(0, 5);
  const rightBeds = beds.slice(5, 10);
  const bottomBeds = beds.slice(10, 15);
  const leftBeds = beds.slice(15);

  return (
    <div className="relative min-h-[350px] rounded-2xl border-[3px] border-slate-500 bg-[#f8f5ef] p-4 shadow-soft">
      <FloorPlanDetails />

      <div className="grid h-full min-h-[315px] grid-cols-[1fr_1.25fr_1fr] grid-rows-[auto_1fr_auto] gap-3">
        <div className="col-span-3 grid grid-cols-5 gap-2 pr-44">
          {topBeds.map(bed => <BedTile key={bed.bed} bed={bed} onSelect={onSelectBed} />)}
        </div>

        <div className="grid content-center gap-2">
          {leftBeds.map(bed => <BedTile key={bed.bed} bed={bed} onSelect={onSelectBed} />)}
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-40 rounded-lg border-2 border-slate-400 bg-card px-4 py-2.5 text-center shadow-soft">
            <div className="text-xs font-bold uppercase text-muted-foreground">Nurse Station</div>
            <div className="mt-1 h-2 rounded-full bg-secondary" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-8 w-9 rounded border border-slate-400 bg-white shadow-soft" />
            ))}
          </div>
          <div className="w-48 border-t-2 border-slate-400 pt-2 text-center text-xs font-semibold uppercase text-muted-foreground">
            Central Corridor
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 w-20 rounded border-2 border-slate-300 bg-card/70 text-center text-[10px] font-semibold uppercase leading-[3rem] text-muted-foreground">
              Utility
            </div>
            <div className="h-12 w-20 rounded border-2 border-slate-300 bg-card/70 text-center text-[10px] font-semibold uppercase leading-[3rem] text-muted-foreground">
              Supply
            </div>
          </div>
        </div>

        <div className="grid content-center gap-2">
          {rightBeds.map(bed => <BedTile key={bed.bed} bed={bed} onSelect={onSelectBed} />)}
        </div>

        <div className="col-span-3 grid grid-cols-5 gap-2 pl-28">
          {bottomBeds.map(bed => <BedTile key={bed.bed} bed={bed} onSelect={onSelectBed} />)}
        </div>
      </div>
    </div>
  );
}

function FloorPlanDetails() {
  return (
    <>
      <div className="absolute -top-[3px] left-12 h-1.5 w-16 bg-background" />
      <div className="absolute -top-7 left-11 text-[10px] font-semibold uppercase text-muted-foreground">Lab / Imaging</div>
      <div className="absolute -bottom-[3px] left-1/2 h-1.5 w-28 -translate-x-1/2 bg-background" />
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase text-muted-foreground">Ambulatory Entrance</div>

      <Door className="left-12 top-0 rotate-180" />
      <Door className="bottom-0 left-1/2 -translate-x-1/2" />
      <Door className="right-0 top-28 rotate-90" />
      <Door className="left-0 top-48 -rotate-90" />

      <Window className="bottom-0 left-20 w-56" />
      <Window className="top-0 right-40 w-32" />
      <Window className="right-0 bottom-28 w-28 rotate-90" />

      <Curtain className="left-[17%] top-16 h-24" />
      <Curtain className="left-[17%] top-48 h-24" />
      <Curtain className="right-[30%] top-16 h-24" />
      <Curtain className="right-[30%] bottom-14 h-24" />
      <Curtain className="right-36 top-16 h-24" />

      <div className="absolute left-5 top-24 h-24 border-l-2 border-slate-400" />
      <div className="absolute left-5 bottom-16 h-20 border-l-2 border-slate-400" />
      <div className="absolute right-48 top-5 h-28 border-l-2 border-slate-400" />
      <div className="absolute right-48 bottom-5 h-28 border-l-2 border-slate-400" />
      <div className="absolute right-5 top-40 h-px w-44 border-t-2 border-slate-400" />
      <div className="absolute left-24 top-5 h-24 w-20 border-2 border-slate-400 bg-card/80 p-2 text-center text-[10px] font-semibold uppercase text-muted-foreground">
        Storage
      </div>
      <div className="absolute left-24 top-32 h-20 w-20 border-2 border-slate-400 bg-card/80 p-2 text-center text-[10px] font-semibold uppercase text-muted-foreground">
        Staff TLT
      </div>
      <div className="absolute bottom-10 left-8 h-12 w-36 rounded border-2 border-slate-400 bg-card/70 text-center text-[10px] font-semibold uppercase leading-[3rem] text-muted-foreground">
        Waiting
      </div>
      <div className="absolute bottom-10 right-28 h-16 w-28 rounded border-2 border-coral bg-coral/15 text-center text-[10px] font-semibold uppercase leading-[4rem] text-navy">
        Triage
      </div>
      <div className="absolute right-8 top-5 h-24 w-28 border-2 border-slate-400 bg-card/80 p-2 text-center text-[10px] font-semibold uppercase text-muted-foreground">
        Med Storage
      </div>
    </>
  );
}

function Door({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute h-12 w-12 ${className}`}>
      <div className="absolute left-0 top-0 h-12 border-l-2 border-slate-600" />
      <div className="absolute left-0 top-0 h-12 w-12 rounded-br-full border-b-2 border-r-2 border-slate-500" />
    </div>
  );
}

function Window({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute h-2 rounded-full bg-sky-200 ring-1 ring-sky-400 ${className}`}>
      <div className="mx-2 mt-0.5 border-t border-white/80" />
    </div>
  );
}

function Curtain({ className = "" }: { className?: string }) {
  return <div className={`absolute border-l-2 border-dashed border-slate-400 ${className}`} />;
}

function BedTile({ bed, onSelect }: { bed: WardBed; onSelect: (bed: WardBed) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(bed)}
      className="rounded-lg border bg-background p-1.5 text-left shadow-soft transition-transform hover:-translate-y-0.5 hover:shadow-soft-lg focus:outline-none focus:ring-2 focus:ring-coral"
      style={{ borderColor: bed.patient ? triageMeta[bed.patient.triage].color : "var(--border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold text-navy">{bed.bed}</div>
        {bed.patient ? (
          <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: triageMeta[bed.patient.triage].color }}>
            {bed.patient.triage === 0 ? "P" : `L${bed.patient.triage}`}
          </span>
        ) : (
          <span className="rounded-full bg-mint px-1.5 py-0.5 text-[9px] font-bold text-navy">OPEN</span>
        )}
      </div>
      <BedShape patient={bed.patient} />
      <div className="mt-1 flex items-center gap-1">
        {bed.patient ? (
          <>
            <SexFlag sex={bed.patient.sex} />
            <span className="truncate text-[10px] font-semibold text-navy">{bed.patient.name}</span>
          </>
        ) : (
          <span className="text-[10px] font-medium text-muted-foreground">Available</span>
        )}
      </div>
    </button>
  );
}

function BedShape({ patient }: { patient: Patient | null }) {
  const color = patient ? triageMeta[patient.triage].color : "var(--mint)";
  const railColor = patient ? triageMeta[patient.triage].color : "var(--border)";

  return (
    <div className="mt-1 rounded-md border bg-card p-1" style={{ borderColor: railColor }}>
      <div className="relative h-7 rounded" style={{ background: patient ? `${color}` : "var(--accent)" }}>
        <div className="absolute left-1 top-1 h-5 w-3.5 rounded bg-white/85" />
        <div className="absolute left-5 right-1.5 top-1.5 h-4 rounded bg-white/55" />
        <div className="absolute bottom-1 left-1 right-1 h-1 rounded bg-black/10" />
      </div>
    </div>
  );
}

function BedDetails({ bed, onClose }: { bed: ReturnType<typeof buildWardBeds>[number]; onClose: () => void }) {
  return (
    <div className="absolute bottom-5 right-5 w-80 rounded-xl border border-border bg-card p-4 shadow-soft-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase text-muted-foreground">Selected bed</div>
          <h4 className="text-lg font-bold text-navy">{bed.bed}</h4>
        </div>
        <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded-lg hover:bg-secondary" aria-label="Close bed details">
          <X className="h-4 w-4" />
        </button>
      </div>

      {bed.patient ? (
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <SexFlag sex={bed.patient.sex} />
            <span className="font-bold text-navy">{bed.patient.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Triage</span>
            <span className="font-semibold text-navy">{triageMeta[bed.patient.triage].label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">UMR</span>
            <span className="font-semibold text-navy">{bed.patient.umr}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Physician</span>
            <span className="font-semibold text-navy">{bed.patient.physician}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Pathway</span>
            <div className="font-semibold text-navy">{bed.patient.pathway}</div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg bg-mint/50 p-3 text-sm font-medium text-navy">
          This bed is available for assignment.
        </div>
      )}
    </div>
  );
}

function SexFlag({ sex }: { sex: Patient["sex"] }) {
  const styles = sex === "M" ? "bg-navy text-white" : sex === "F" ? "bg-coral text-white" : "bg-amber-emerg text-white";
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${styles}`}>{sex}</span>;
}

function AutoSummary({
  activePatients,
  occupancyPct,
  occupiedBeds,
  totalBeds,
  criticalWards,
}: {
  activePatients: number;
  occupancyPct: number;
  occupiedBeds: number;
  totalBeds: number;
  criticalWards: number;
}) {
  return (
    <div className="bg-card rounded-2xl shadow-soft p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-coral" />
        <h3 className="font-semibold text-navy">Auto Summary</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryMetric icon={<TrendingUp className="h-4 w-4" />} label="Current footfall" value={`${activePatients} active`} note="ED + observation cases" />
        <SummaryMetric icon={<Bed className="h-4 w-4" />} label="Bed occupancy" value={`${occupancyPct}%`} note={`${occupiedBeds}/${totalBeds} beds occupied`} />
        <SummaryMetric icon={<Activity className="h-4 w-4" />} label="Capacity alert" value={`${criticalWards} wards`} note="At or above 90%" tone="critical" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Footfall is steady with {activePatients} active patients. Bed utilization is {occupancyPct}%, with {criticalWards} ward{criticalWards === 1 ? "" : "s"} needing close monitoring.
      </p>
    </div>
  );
}

function SummaryMetric({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone?: "critical" }) {
  return (
    <div className={`rounded-xl p-2.5 ${tone === "critical" ? "bg-destructive/10 ring-1 ring-destructive/30" : "bg-secondary/35"}`}>
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
        <span className={tone === "critical" ? "text-destructive" : "text-coral"}>{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-bold text-navy mt-1.5">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{note}</div>
    </div>
  );
}

function GraphCard({ title, children, onClick }: { title: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="block w-full bg-card rounded-2xl shadow-soft p-4 text-left hover:shadow-soft-lg transition-shadow">
      <div className="flex items-center gap-2 mb-2.5">
        <Users className="h-4 w-4 text-coral" />
        <h3 className="font-semibold text-navy">{title}</h3>
      </div>
      {children}
      <div className="text-[11px] text-muted-foreground mt-2.5">Click graph to reveal patient details.</div>
    </button>
  );
}

function PatientDrill({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-soft-lg w-full max-w-4xl max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-navy">{title}</h3>
            <p className="text-xs text-muted-foreground">Patient details linked to this graph</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2">Patient</th><th className="text-left py-2">UMR</th><th className="text-left py-2">Sex</th><th className="text-left py-2">Triage</th><th className="text-left py-2">Pathway</th><th className="text-left py-2">Physician</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-2 font-semibold text-navy">{p.name}</td>
                  <td className="py-2 text-muted-foreground">{p.umr}</td>
                  <td className="py-2 text-muted-foreground">{p.sex}</td>
                  <td className="py-2"><TriageBadge level={p.triage as any} /></td>
                  <td className="py-2 text-muted-foreground">{p.pathway}</td>
                  <td className="py-2 text-muted-foreground">{p.physician}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
=======
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
>>>>>>> 2f8bf1375f9aacc63ac08f477715a9a3a0b66b25
  );
}
