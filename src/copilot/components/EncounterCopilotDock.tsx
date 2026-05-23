import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Brain, ChevronDown, Mic, Send, Sparkles, Stethoscope } from "lucide-react";
import { useCopilot } from "@/copilot/hooks/useCopilot";

export function EncounterCopilotDock({ floating = true }: { floating?: boolean }) {
  const copilot = useCopilot();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const isPatientsPage = path === "/patients" || path.startsWith("/patients/");

  useEffect(() => {
    if (floating && isPatientsPage && copilot.open) {
      copilot.setOpen(false);
    }
  }, [copilot.open, copilot.setOpen, floating, isPatientsPage]);

  return (
    <div
      className={`max-w-[calc(100vw-2rem)] ${
        floating
          ? `fixed right-5 z-50 ${isPatientsPage ? "top-20 w-[440px] max-w-[calc(100vw-2.5rem)]" : "bottom-5 w-[380px]"}`
          : "w-[420px] max-w-[calc(100vw-3rem)]"
      }`}
    >
      <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_18px_60px_rgba(16,36,61,0.18)]">
        <button
          type="button"
          onClick={() => copilot.setOpen(!copilot.open)}
          className="flex w-full items-center justify-between gap-3 bg-navy px-5 py-4 text-left text-white"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Ambient Clinical Co-pilot</div>
              <div className="text-xs text-white/70">{copilot.status}</div>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 transition ${copilot.open ? "" : "-rotate-90"}`} />
        </button>

        {copilot.open ? (
          <div className="space-y-4 bg-[#fffaf3] p-4">
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Command</div>
              <div className="mt-3 flex items-end gap-2">
                <textarea
                  value={copilot.input}
                  onChange={(event) => copilot.setInput(event.target.value)}
                  placeholder="Try: go to medication history, next page, open scoring tools, select chest pain pathway..."
                  rows={3}
                  className="min-h-[88px] flex-1 rounded-2xl border border-border bg-background/80 px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-coral/30"
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => void copilot.runCommand()}
                    disabled={copilot.busy}
                    className="grid h-11 w-11 place-items-center rounded-2xl bg-coral text-white disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void (copilot.listening ? copilot.stopVoiceCapture() : copilot.startVoiceCapture("copilot command"))}
                    disabled={!copilot.voiceSupported || copilot.busy}
                    className={`grid h-11 w-11 place-items-center rounded-2xl text-white disabled:opacity-50 ${
                      copilot.listening ? "bg-red-500" : "bg-navy"
                    }`}
                    aria-label={copilot.listening ? "Stop listening" : "Start listening"}
                    title={copilot.listening ? "Stop listening" : "Start listening"}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {!copilot.voiceSupported ? (
                <div className="mt-2 text-xs text-muted-foreground">Browser speech recognition is not available here. Typed commands still work.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-navy">Mic status:</span>
                    <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-bold text-navy">
                      {copilot.listening
                        ? "Listening"
                        : copilot.voicePermissionState === "granted"
                          ? "Permission granted"
                          : copilot.voicePermissionState === "denied"
                            ? "Permission blocked"
                            : copilot.voicePermissionState === "prompt"
                              ? "Permission needed"
                              : "Permission unknown"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {copilot.listening
                      ? 'Recording is active. Say "apply changes" to stop and send the audio.'
                      : copilot.voicePermissionState === "granted"
                        ? "Microphone permission is ready. Press the mic button or Start Listening Now."
                        : "Grant microphone permission first, then start listening."}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {copilot.voicePermissionState !== "granted" ? (
                      <button
                        type="button"
                        onClick={() => void copilot.requestMicrophonePermission()}
                        className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-secondary/40"
                      >
                        Grant Microphone Access
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void (copilot.listening ? copilot.stopVoiceCapture() : copilot.startVoiceCapture("copilot command"))}
                      disabled={!copilot.voiceSupported || copilot.busy}
                      className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-secondary/40"
                    >
                      {copilot.listening ? 'Listening For "Apply Changes"' : "Start Listening Now"}
                    </button>
                  </div>
                  {copilot.voiceLastError ? <div className="text-xs text-destructive">{copilot.voiceLastError}</div> : null}
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => void copilot.requestSummary()}
                disabled={copilot.busy}
                className="rounded-2xl border border-border bg-white px-4 py-3 text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-navy">
                  <Brain className="h-4 w-4 text-coral" />
                  Encounter Summary
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Generate a doctor-review summary of the active encounter.</div>
              </button>
              <button
                type="button"
                onClick={() => void copilot.requestRecommendations()}
                disabled={copilot.busy}
                className="rounded-2xl border border-border bg-white px-4 py-3 text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-navy">
                  <Sparkles className="h-4 w-4 text-coral" />
                  Nudges and Suggestions
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Ask the copilot for workflow nudges, calculators, and caution flags.</div>
              </button>
            </div>

            {copilot.lastCommand ? (
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Parsed Command</div>
                <div className="mt-2 grid gap-2 text-xs text-navy md:grid-cols-2">
                  <div><span className="font-bold">Intent:</span> {copilot.lastCommand.intent}</div>
                  <div><span className="font-bold">Confidence:</span> {copilot.lastCommand.confidence}</div>
                  {copilot.lastCommand.actions?.length ? <div><span className="font-bold">Actions:</span> {copilot.lastCommand.actions.length}</div> : null}
                  {copilot.lastCommand.actions?.length ? (
                    <div className="md:col-span-2">
                      <span className="font-bold">Action chain:</span>{" "}
                      {copilot.lastCommand.actions.map((action) => action.intent).join(" -> ")}
                    </div>
                  ) : null}
                  {copilot.lastCommand.patient_name ? <div><span className="font-bold">Patient:</span> {copilot.lastCommand.patient_name}</div> : null}
                  {copilot.lastCommand.patient_id ? <div><span className="font-bold">Patient ID:</span> {copilot.lastCommand.patient_id}</div> : null}
                  {copilot.lastCommand.route ? <div><span className="font-bold">Route:</span> {copilot.lastCommand.route}</div> : null}
                  {copilot.lastCommand.target ? <div><span className="font-bold">Section:</span> {copilot.lastCommand.target}</div> : null}
                  {copilot.lastCommand.tool ? <div><span className="font-bold">Tool:</span> {copilot.lastCommand.tool}</div> : null}
                  {copilot.lastCommand.pathway ? <div><span className="font-bold">Pathway:</span> {copilot.lastCommand.pathway}</div> : null}
                  {copilot.lastCommand.vitals ? <div className="md:col-span-2"><span className="font-bold">Vitals:</span> {Object.entries(copilot.lastCommand.vitals).map(([key, value]) => `${key}=${value}`).join(", ")}</div> : null}
                </div>
              </div>
            ) : null}

            {copilot.summary ? (
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Summary</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-navy">{copilot.summary}</div>
                {copilot.missingItems.length ? (
                  <div className="mt-3">
                    <div className="text-xs font-bold text-coral">Missing items</div>
                    <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                      {copilot.missingItems.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {copilot.recommendations.length ? (
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Recommendations</div>
                <div className="mt-3 space-y-3">
                  {copilot.recommendations.map((recommendation) => (
                    <div key={`${recommendation.title}-${recommendation.action}`} className="rounded-2xl border border-border bg-[#fffaf3] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-bold text-navy">{recommendation.title}</div>
                        <span className="rounded-full bg-coral/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-coral">
                          {recommendation.severity}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{recommendation.reason}</div>
                      <div className="mt-2 text-xs font-semibold text-navy">{recommendation.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
