import { Camera, Mic, Upload } from "lucide-react";

export function FormAssistActions({ compact = false, onVoiceFill }: { compact?: boolean; onVoiceFill?: () => void }) {
  const base = compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onVoiceFill}
        className={`inline-flex items-center gap-1.5 rounded-lg bg-coral text-coral-foreground font-semibold shadow-soft hover:opacity-95 ${base}`}
      >
        <Mic className="h-4 w-4" /> Voice Fill
      </button>
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-lg bg-navy text-navy-foreground font-semibold shadow-soft hover:opacity-95 ${base}`}
      >
        <Camera className="h-4 w-4" /> Scan Photo
      </button>
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-white text-navy font-semibold hover:bg-secondary/40 ${base}`}
      >
        <Upload className="h-4 w-4" /> Upload
      </button>
    </div>
  );
}
