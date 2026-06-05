import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, Plus, Search } from "lucide-react";
import { getEdSnapshot } from "@/lib/edApi";
import { TriageBadge } from "@/components/app/TriageBadge";

export const Route = createFileRoute("/_app/patients")({
  loader: async () => getEdSnapshot(),
  component: Page,
});

function Page() {
  const { patients, wards } = Route.useLoaderData();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [doc, setDoc] = useState("all");
  const [ward, setWard] = useState("all");
  const [status, setStatus] = useState("all");

  const docs = Array.from(new Set(patients.map((p) => p.physician))).filter((d) => d !== "-");

  const filtered = patients.filter((p) => {
    if (appliedQ && !`${p.name} ${p.umr}`.toLowerCase().includes(appliedQ.toLowerCase())) return false;
    if (doc !== "all" && p.physician !== doc) return false;
    if (status !== "all" && p.status !== status) return false;
    if (ward !== "all") {
      if (ward === "Emergency" && !p.bed.startsWith("ER-")) return false;
      if (ward === "Observation" && !p.bed.startsWith("OBS-")) return false;
      if (ward === "ICU" && !p.bed.startsWith("ICU-")) return false;
      if (ward === "Trauma Bay" && !p.bed.startsWith("TR-")) return false;
      if (ward === "Pediatric ED" && !p.bed.startsWith("PED-")) return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Patient Monitoring</h1>
          <p className="text-sm text-muted-foreground">Quick lookup across all ED and discharged patients</p>
        </div>
        <button onClick={() => navigate({ to: "/register" })}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-navy text-navy-foreground px-4 py-2.5 text-sm font-semibold shadow-soft">
          <Plus className="h-4 w-4"/> New Registration
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-soft p-4 mb-4 grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") setAppliedQ(q); }} placeholder="Search by name or UMR..." className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-coral"/>
        </div>
        <select value={doc} onChange={e=>setDoc(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          <option value="all">All Doctors</option>
          {docs.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={ward} onChange={e=>setWard(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          <option value="all">All Wards</option>
          {wards.map(w => <option key={w.name}>{w.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => setAppliedQ(q)} className="flex-1 rounded-lg bg-navy px-3 py-2.5 text-sm font-semibold text-white">Search</button>
          <button onClick={() => { setQ(""); setAppliedQ(""); setDoc("all"); setWard("all"); setStatus("all"); }} className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold text-navy">Clear</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[{id:"all",label:"All"},{id:"ed",label:"ED Active"},{id:"obs",label:"Observation"},{id:"discharged",label:"Discharged"}].map(s => (
          <button key={s.id} onClick={()=>setStatus(s.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${status===s.id?"bg-navy text-navy-foreground":"bg-card text-navy border border-border hover:bg-secondary/50"}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
        <div className="lg:hidden divide-y divide-border">
          {filtered.map((p) => (
            <div key={p.id} className="p-4 space-y-3 hover:bg-secondary/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-navy text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.age > 0 ? `${p.age}y` : "-"} - {p.sex} - {p.umr}</div>
                </div>
                <TriageBadge level={p.triage} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <InfoPair label="Bed" value={p.bed} />
                <InfoPair label="Check-in" value={p.checkIn} />
                <InfoPair label="Physician" value={p.physician} />
                <InfoPair label="Pathway" value={p.pathway} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.status==="discharged"?"bg-secondary text-muted-foreground":"bg-mint text-navy"}`}>{p.status}</span>
                <div className="flex gap-2">
                  <Link to="/patient/$id/dashboard" params={{id:p.id}} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-navy hover:bg-secondary/50">
                    <LayoutDashboard className="h-3.5 w-3.5" /> Overview
                  </Link>
                  <Link to="/patient/$id/workspace" params={{id:p.id}} className="rounded-lg bg-coral text-coral-foreground text-xs font-semibold px-3 py-1.5">Open</Link>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="p-10 text-center text-sm text-muted-foreground">No patients match your filters.</div>}
        </div>

        <div className="hidden lg:block">
          <div className="grid grid-cols-[1.6fr_0.9fr_0.6fr_0.8fr_0.9fr_1fr_0.9fr_1fr] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border bg-secondary/30">
            <div>Name</div><div>Triage</div><div>Bed</div><div>Check-in</div><div>Physician</div><div>Pathway</div><div>Status</div><div className="text-right">Action</div>
          </div>
          {filtered.map(p => (
            <div key={p.id} className="grid grid-cols-[1.6fr_0.9fr_0.6fr_0.8fr_0.9fr_1fr_0.9fr_1fr] gap-4 px-5 py-3 items-center border-b border-border last:border-0 hover:bg-secondary/30">
              <div>
                <div className="font-semibold text-navy text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.age>0?`${p.age}y`:"-"} - {p.sex} - {p.umr}</div>
              </div>
              <TriageBadge level={p.triage}/>
              <div className="text-sm text-navy">{p.bed}</div>
              <div className="text-sm text-muted-foreground">{p.checkIn}</div>
              <div className="text-sm text-navy">{p.physician}</div>
              <div className="text-sm">{p.pathway}</div>
              <div className="text-xs">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${p.status==="discharged"?"bg-secondary text-muted-foreground":"bg-mint text-navy"}`}>{p.status}</span>
              </div>
              <div className="text-right">
                <div className="flex justify-end gap-2">
                  <Link to="/patient/$id/dashboard" params={{id:p.id}} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-navy hover:bg-secondary/50">
                    <LayoutDashboard className="h-3.5 w-3.5" /> Overview
                  </Link>
                  <Link to="/patient/$id/workspace" params={{id:p.id}} className="rounded-lg bg-coral text-coral-foreground text-xs font-semibold px-3 py-1.5">Open</Link>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="p-10 text-center text-sm text-muted-foreground">No patients match your filters.</div>}
        </div>
      </div>
    </div>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-navy">{value}</div>
    </div>
  );
}
