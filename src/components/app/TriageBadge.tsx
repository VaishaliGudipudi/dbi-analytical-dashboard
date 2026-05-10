import { triageMeta } from "@/lib/mockData";

export function TriageBadge({ level, size = "md" }: { level: 0 | 1 | 2 | 3; size?: "sm" | "md" | "lg" }) {
  const m = triageMeta[level];
  const sz = size === "lg" ? "h-10 w-10 text-base" : size === "sm" ? "h-6 w-6 text-[11px]" : "h-8 w-8 text-sm";
  return (
    <div className="inline-flex items-center gap-2">
      <div className={`${sz} rounded-full grid place-items-center font-bold text-white shadow-soft`} style={{ background: m.color }}>
        {level === 0 ? "—" : level === 1 ? "I" : level === 2 ? "II" : "III"}
      </div>
      {size !== "sm" && <span className="text-sm font-medium text-navy">{m.label}</span>}
    </div>
  );
}

export function triageBorderColor(level: number) {
  if (level === 1) return "var(--urgent-critical)";
  if (level === 2) return "var(--urgent-urgent)";
  if (level === 3) return "var(--urgent-pending)";
  return "var(--muted-foreground)";
}
