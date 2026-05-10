import { diagnoses } from "@/lib/mockData";

export function DiagnosisGrid({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {diagnoses.map(d => {
        const active = value === d.id;
        const critical = d.severity === 1;
        return (
          <button key={d.id} onClick={() => onChange(d.id)}
            className={`rounded-2xl bg-card p-4 text-left transition-all shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 ${active ? "ring-2" : "ring-1 ring-transparent"}`}
            style={active ? {
              borderColor: critical ? "var(--urgent-critical)" : "var(--urgent-urgent)",
              boxShadow: `inset 0 0 0 2px ${critical ? "var(--urgent-critical)" : "var(--urgent-urgent)"}`,
              background: critical ? "color-mix(in oklab, var(--urgent-critical) 8%, white)" : "color-mix(in oklab, var(--urgent-urgent) 8%, white)",
            } : undefined}>
            <div className="text-3xl mb-2">{d.icon}</div>
            <div className="font-semibold text-navy text-sm">{d.label}</div>
          </button>
        );
      })}
    </div>
  );
}
