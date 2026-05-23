import { useEffect, useState } from "react";
import { X, HeartPulse } from "lucide-react";
import { toast } from "sonner";

type VitalsDraft = {
  time: string;
  sbp: string;
  dbp: string;
  hr: string;
  rr: string;
  spo2: string;
  temp: string;
  grbs: string;
  pain: string;
  o2: string;
  notes: string;
};

function buildInitialVitals(initialValues?: Partial<Record<"sbp" | "dbp" | "hr" | "rr" | "spo2" | "temp" | "grbs", string>>): VitalsDraft {
  return {
    time: new Date().toTimeString().slice(0, 5),
    sbp: initialValues?.sbp ?? "",
    dbp: initialValues?.dbp ?? "",
    hr: initialValues?.hr ?? "",
    rr: initialValues?.rr ?? "",
    spo2: initialValues?.spo2 ?? "",
    temp: initialValues?.temp ?? "",
    grbs: initialValues?.grbs ?? "",
    pain: "",
    o2: "Room Air",
    notes: "",
  };
}

export function AddVitalsModal({
  onClose,
  initialValues,
  onSave,
}: {
  onClose: () => void;
  initialValues?: Partial<Record<"sbp" | "dbp" | "hr" | "rr" | "spo2" | "temp" | "grbs", string>>;
  onSave?: (vitals: Record<string, string>) => void;
}) {
  const [v, setV] = useState<VitalsDraft>(() => buildInitialVitals(initialValues));
  useEffect(() => {
    setV((current) => ({
      ...current,
      ...buildInitialVitals(initialValues),
      time: current.time,
      pain: current.pain,
      o2: current.o2,
      notes: current.notes,
    }));
  }, [initialValues]);
  const set = (k: keyof typeof v) => (e: any) => setV({ ...v, [k]: e.target.value });
  const save = () => {
    onSave?.({
      sbp: v.sbp,
      dbp: v.dbp,
      hr: v.hr,
      rr: v.rr,
      spo2: v.spo2,
      temp: v.temp,
      grbs: v.grbs,
    });
    toast.success("Vitals recorded");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-soft-lg" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-coral"/><h2 className="font-bold text-navy">Add Vitals</h2></div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary"><X className="h-4 w-4"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <L label="Time"><input type="time" value={v.time} onChange={set("time")} className={inp}/></L>
            <L label="SBP"><input value={v.sbp} onChange={set("sbp")} className={inp} placeholder="mmHg"/></L>
            <L label="DBP"><input value={v.dbp} onChange={set("dbp")} className={inp} placeholder="mmHg"/></L>
            <L label="HR"><input value={v.hr} onChange={set("hr")} className={inp} placeholder="bpm"/></L>
            <L label="RR"><input value={v.rr} onChange={set("rr")} className={inp} placeholder="/min"/></L>
            <L label="SpO₂"><input value={v.spo2} onChange={set("spo2")} className={inp} placeholder="%"/></L>
            <L label="Temp"><input value={v.temp} onChange={set("temp")} className={inp} placeholder="°F"/></L>
            <L label="GRBS"><input value={v.grbs} onChange={set("grbs")} className={inp} placeholder="mg/dL"/></L>
            <L label="Pain (0-10)"><input value={v.pain} onChange={set("pain")} className={inp}/></L>
            <L label="O₂ Mode"><select value={v.o2} onChange={set("o2")} className={inp}><option>Room Air</option><option>Nasal Cannula</option><option>Mask</option><option>NRBM</option><option>BiPAP</option><option>Vent</option></select></L>
          </div>
          <L label="Notes"><textarea value={v.notes} onChange={set("notes")} rows={2} className={inp} placeholder="Optional notes..."/></L>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md border border-border text-sm font-semibold text-navy">Cancel</button>
            <button onClick={save} className="px-5 py-2 rounded-md bg-navy text-navy-foreground text-sm font-semibold">Save Vitals</button>
          </div>
        </div>
      </div>
    </div>
  );
}
const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral";
function L({ label, children }: any) { return <div><label className="text-xs font-semibold text-navy block mb-1">{label}</label>{children}</div>; }
