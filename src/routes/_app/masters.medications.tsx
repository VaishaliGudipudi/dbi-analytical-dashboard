import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/masters/medications")({ component: Page });

function Page() {
  const [f, setF] = useState({
    code: "", branded: "", name: "", generic: "", dosage: "", units: "",
    substance: "", route: "", form: "", prereq: "", classification: "", role: "",
    schedule: "", indication: "", contra: "", interaction: "",
  });
  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Medication "${f.name || f.code}" saved`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <form onSubmit={submit} className="bg-card rounded-2xl shadow-soft border border-border p-8">
        <h1 className="text-2xl font-bold text-navy text-center mb-6">Medication Master</h1>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <F label="Medication Code Identifier" value={f.code} onChange={set("code")} />
          <F label="Branded Medication Identifier" value={f.branded} onChange={set("branded")} />
          <F label="Branded Medication Name" value={f.name} onChange={set("name")} />
          <F label="Generic Drug Name" value={f.generic} onChange={set("generic")} />
          <F label="Dosage" value={f.dosage} onChange={set("dosage")} />
          <Sel label="Units" value={f.units} onChange={set("units")} options={["mg","g","ml","mcg","IU","tab"]} placeholder="Select Units"/>
          <Sel label="Substance Internal Identifier" value={f.substance} onChange={set("substance")} options={["Paracetamol","Amoxicillin","Aspirin","Atorvastatin"]} placeholder="Search Substance..."/>
          <Sel label="Route of Administration Internal Identifier" value={f.route} onChange={set("route")} options={["Oral","IV","IM","SC","Topical","Inhalation"]} placeholder="Search and select a route"/>
          <Sel label="Drug Form Internal Identifier" value={f.form} onChange={set("form")} options={["Tablet","Capsule","Syrup","Injection","Cream"]} placeholder="Search Drug Form..."/>
          <F label="Prerequisites" value={f.prereq} onChange={set("prereq")} />
          <F label="Drug Classification" value={f.classification} onChange={set("classification")} />
          <F label="Therapeutic Role" value={f.role} onChange={set("role")} />
          <Sel label="Drug Schedule" value={f.schedule} onChange={set("schedule")} options={["Schedule H","Schedule H1","Schedule X","OTC"]} placeholder="Select drug schedule"/>
        </div>
        <div className="mt-5 space-y-4">
          <TA label="Indication" value={f.indication} onChange={set("indication")} />
          <TA label="Contra Indication" value={f.contra} onChange={set("contra")} />
          <TA label="Interaction with Drugs" value={f.interaction} onChange={set("interaction")} />
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" className="px-6 py-2.5 rounded-md bg-navy text-navy-foreground text-sm font-semibold shadow-soft">Submit</button>
        </div>
      </form>
    </div>
  );
}

function F({ label, ...p }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-navy block mb-1">{label}</label>
      <input {...p} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral" />
    </div>
  );
}
function Sel({ label, options, placeholder, ...p }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-navy block mb-1">{label}</label>
      <select {...p} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral">
        <option value="">{placeholder}</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function TA({ label, ...p }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-navy block mb-1">{label}</label>
      <textarea {...p} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral resize-none" />
    </div>
  );
}