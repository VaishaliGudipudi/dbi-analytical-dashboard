import { useRouterState } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Brain, ChevronLeft, Download, MessageSquarePlus, Mic, Save, Send, Sparkles, Stethoscope, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { useCopilot } from "@/copilot/hooks/useCopilot";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { downloadChartCsv, downloadChartPng, downloadChartSvg, saveChartSnapshot } from "@/lib/chartExports";

export function EncounterCopilotDock({ floating = true }: { floating?: boolean }) {
  const copilot = useCopilot();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const visibleMessages = copilot.messages.filter((message) => message.id !== "copilot-welcome");
  const statusBanner =
    copilot.status && copilot.status !== "Copilot ready." && !path.startsWith("/analytics") ? copilot.status : "";
  const headerSubtitle = path.startsWith("/analytics")
    ? copilot.analyticsBindings?.promptHint ?? "Ask for a graph and I will build it here."
    : "Text, voice, and multi-step workflow actions.";

  if (floating && !copilot.open) {
    return null;
  }

  return (
    <div
      className={`max-w-[calc(100vw-1rem)] ${
        floating
          ? `fixed bottom-5 right-5 z-50 w-[540px] max-w-[calc(100vw-2rem)]`
          : `${copilot.open ? "w-[460px] xl:w-[520px] 2xl:w-[560px]" : "w-[72px]"} shrink-0 border-l border-border/70 bg-[#fffaf3] transition-all duration-300`
      }`}
    >
      <div className={`overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_18px_60px_rgba(16,36,61,0.18)] ${floating ? "flex h-[min(82vh,760px)] flex-col" : "flex h-[calc(100vh-5rem)] flex-col rounded-none border-y-0 border-r-0 shadow-none"}`}>
        <button
          type="button"
          onClick={() => copilot.setOpen(!copilot.open)}
          className="flex w-full shrink-0 items-center justify-between gap-3 bg-navy px-5 py-4 text-left text-white"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className={copilot.open || floating ? "" : "hidden"}>
              <div className="text-sm font-bold">Ambient Clinical Co-pilot</div>
              <div className="line-clamp-2 max-w-[360px] text-xs text-white/70">{headerSubtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {copilot.open ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  copilot.startNewChat();
                }}
                className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Start a new chat"
                title="Start a new chat"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </button>
            ) : null}
            {copilot.open ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  copilot.clearHistory();
                }}
                className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Clear chat history"
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
            <ChevronLeft className={`h-5 w-5 transition ${copilot.open ? "" : "rotate-180"}`} />
          </div>
        </button>

        {copilot.open ? (
          <div className="flex min-h-0 flex-1 flex-col bg-[#fffaf3]">
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="flex min-h-full flex-col justify-end gap-3">
                <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
                  {path.startsWith("/analytics")
                    ? copilot.analyticsBindings?.promptHint ?? "Ask what graph you want to see."
                    : "Type or dictate one request. Copilot can chain multiple actions in a single command."}
                </div>

                {statusBanner ? (
                  <div className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-navy">
                    {statusBanner}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {visibleMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[94%] rounded-2xl px-4 py-3 shadow-soft ${message.role === "user" ? "bg-navy text-white" : "border border-border bg-white text-navy"}`}>
                        <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                        {message.chart ? (
                          <div className="mt-3 rounded-2xl border border-border bg-card p-3">
                            <div className="text-sm font-bold text-navy">{message.chart.title}</div>
                            {message.chart.description ? <div className="mt-1 text-xs text-muted-foreground">{message.chart.description}</div> : null}
                            <CopilotChartRenderer chart={message.chart} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            <div className="shrink-0 border-t border-border/70 bg-[#fffaf3] p-4">
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <div className="mt-2 flex items-end gap-3">
                <textarea
                  value={copilot.input}
                  onChange={(event) => copilot.setInput(event.target.value)}
                  placeholder={path.startsWith("/analytics")
                    ? "Try: show male patients under 50 who took Dolo 650 in the last three months"
                    : "Try: open patient Priya and enter her latest vitals bp 120/80 hr 90 spo2 90 temp 98"}
                  rows={3}
                  className="min-h-[68px] flex-1 resize-none rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm leading-6 text-navy outline-none focus:ring-2 focus:ring-coral/30"
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => void copilot.runCommand()}
                    disabled={copilot.busy}
                    className="grid h-10 w-10 place-items-center rounded-2xl bg-coral text-white disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void (copilot.listening ? copilot.stopVoiceCapture() : copilot.startVoiceCapture("copilot command"))}
                    disabled={!copilot.voiceSupported || copilot.busy}
                    className={`grid h-10 w-10 place-items-center rounded-2xl text-white disabled:opacity-50 ${
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
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
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
                    {copilot.voicePermissionState !== "granted" ? (
                      <button
                        type="button"
                        onClick={() => void copilot.requestMicrophonePermission()}
                        className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-secondary/40"
                      >
                        Grant Microphone Access
                      </button>
                    ) : null}
                  {copilot.voiceLastError ? <div className="text-xs text-destructive">{copilot.voiceLastError}</div> : null}
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void copilot.requestSummary()}
                disabled={copilot.busy}
                className="rounded-2xl border border-border bg-white px-3 py-2 text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-navy">
                  <Brain className="h-4 w-4 text-coral" />
                  Encounter Summary
                </div>
              </button>
              <button
                type="button"
                onClick={() => void copilot.requestRecommendations()}
                disabled={copilot.busy}
                className="rounded-2xl border border-border bg-white px-3 py-2 text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-navy">
                  <Sparkles className="h-4 w-4 text-coral" />
                  Nudges and Suggestions
                </div>
              </button>
            </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CopilotChartRenderer({ chart }: { chart: NonNullable<ReturnType<typeof useCopilot>["messages"][number]["chart"]> }) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [actionStatus, setActionStatus] = useState("");
  const config = chart.series.reduce<Record<string, { label: string; color: string }>>((acc, series) => {
    acc[series.key] = { label: series.label, color: series.color };
    return acc;
  }, {});

  const updateStatus = (message: string) => {
    setActionStatus(message);
    window.setTimeout(() => setActionStatus(""), 2200);
  };

  const runExport = async (action: "save" | "csv" | "svg" | "png") => {
    const container = chartRef.current;
    if (!container) return;

    try {
      if (action === "save") {
        saveChartSnapshot(chart);
        updateStatus("Chart saved in this browser.");
        return;
      }
      if (action === "csv") {
        downloadChartCsv(chart);
        updateStatus("CSV downloaded.");
        return;
      }
      if (action === "svg") {
        downloadChartSvg(chart, container);
        updateStatus("SVG downloaded.");
        return;
      }
      await downloadChartPng(chart, container);
      updateStatus("PNG downloaded.");
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : "Chart export failed.");
    }
  };

  return (
    <div className="mt-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void runExport("save")} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-bold text-navy hover:bg-secondary/40">
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
        <button type="button" onClick={() => void runExport("png")} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-bold text-navy hover:bg-secondary/40">
          <Download className="h-3.5 w-3.5" />
          PNG
        </button>
        <button type="button" onClick={() => void runExport("svg")} className="rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-bold text-navy hover:bg-secondary/40">
          SVG
        </button>
        <button type="button" onClick={() => void runExport("csv")} className="rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-bold text-navy hover:bg-secondary/40">
          CSV
        </button>
        {actionStatus ? <div className="text-[11px] font-semibold text-muted-foreground">{actionStatus}</div> : null}
      </div>

      <div ref={chartRef}>
        <ChartContainer config={config} className="h-[220px] w-full">
          {chart.type === "pie" ? (
            <PieChart>
              <Pie data={chart.data} dataKey={chart.series[0]?.key ?? "value"} nameKey={chart.xKey ?? "label"} innerRadius={42} outerRadius={76} paddingAngle={4}>
                {chart.data.map((row, index) => (
                  <Cell key={`${chart.title}-${index}`} fill={String(row.fill ?? chart.series[index]?.color ?? chart.series[0]?.color ?? "var(--navy)")} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          ) : chart.type === "line" ? (
            <LineChart data={chart.data} margin={{ top: 10, right: 12, left: 0, bottom: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={chart.xKey} tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {chart.series.map((series) => (
                <Line key={series.key} type="monotone" dataKey={series.key} stroke={`var(--color-${series.key})`} strokeWidth={3} dot={{ r: 3 }} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chart.data} margin={{ top: 10, right: 12, left: 0, bottom: 24 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={chart.xKey} tickLine={false} axisLine={false} angle={chart.data.length > 4 ? -16 : 0} textAnchor={chart.data.length > 4 ? "end" : "middle"} height={chart.data.length > 4 ? 50 : undefined} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {chart.series.map((series) => (
                <Bar key={series.key} dataKey={series.key} fill={`var(--color-${series.key})`} radius={[8, 8, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ChartContainer>
      </div>
    </div>
  );
}
