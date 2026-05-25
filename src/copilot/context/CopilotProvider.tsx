import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  generateCopilotRecommendations,
  generateCopilotSummary,
  parseCopilotCommand,
  parseCopilotVoiceCommand,
} from "@/copilot/services/copilotApi";
import { useVoiceSession } from "@/copilot/hooks/useVoiceSession";
import type {
  AnalyticsBindings,
  CopilotAction,
  CopilotChatMessage,
  CopilotCommandResult,
  CopilotRecommendation,
  EncounterBindings,
  EncounterContext,
  RouteBindings,
} from "@/copilot/types/copilot";

type CopilotContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  input: string;
  setInput: (value: string) => void;
  status: string;
  lastCommand?: CopilotCommandResult | null;
  summary: string;
  missingItems: string[];
  recommendations: CopilotRecommendation[];
  busy: boolean;
  listening: boolean;
  voiceSupported: boolean;
  voicePermissionState: "unknown" | "granted" | "denied" | "prompt";
  voiceLastError: string;
  messages: CopilotChatMessage[];
  clearHistory: () => void;
  startNewChat: () => void;
  analyticsBindings: AnalyticsBindings | null;
  routeBindings: RouteBindings | null;
  encounterBindings: EncounterBindings | null;
  setAnalyticsBindings: (bindings: AnalyticsBindings | null) => void;
  setRouteBindings: (bindings: RouteBindings | null) => void;
  setEncounterBindings: (bindings: EncounterBindings | null) => void;
  runCommand: (transcript?: string) => Promise<void>;
  requestSummary: () => Promise<void>;
  requestRecommendations: () => Promise<void>;
  requestMicrophonePermission: () => Promise<void>;
  startVoiceCapture: (label?: string) => Promise<void>;
  stopVoiceCapture: () => void;
};

const CopilotContext = createContext<CopilotContextValue | null>(null);
const COPILOT_PENDING_PATCH_KEY = "bioinsights-copilot-pending";
const COPILOT_CHAT_HISTORY_KEY = "bioinsights-copilot-history";
const WELCOME_MESSAGE: CopilotChatMessage = {
  id: "copilot-welcome",
  role: "assistant",
  text: "Copilot is ready. Use text or voice. I can chain actions like opening a patient, moving sections, and applying vitals in one request.",
  timestamp: new Date().toISOString(),
};

function normalizeTranscript(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeClinicalTranscript(value: string): string {
  return value
    .toLowerCase()
    .replace(/['â€™]s\b/g, "")
    .replace(/[,:;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractVitalsFromTranscript(transcript: string): Record<string, string> {
  const normalized = normalizeClinicalTranscript(transcript);
  const vitals: Record<string, string> = {};

  const bpMatch = normalized.match(/(?:bp|blood pressure)(?:\s*(?:is|of|at))?\s*(\d{2,3})\s*(?:by|over|\/)\s*(\d{2,3})/);
  if (bpMatch) {
    vitals.sbp = bpMatch[1];
    vitals.dbp = bpMatch[2];
  }

  const spo2Match = normalized.match(/(?:oxygen(?: levels?| saturation)?|o2 sat|spo2|saturation)(?:\s*(?:is|of|at))?\s*(\d{2,3}(?:\.\d+)?)/);
  if (spo2Match) {
    vitals.spo2 = spo2Match[1];
  }

  const tempMatch = normalized.match(/(?:temperature|temp)(?:\s*(?:is|of|at))?\s*(\d{2,3}(?:\.\d+)?)/);
  if (tempMatch) {
    vitals.temp = tempMatch[1];
  }

  const hrMatch = normalized.match(/(?:heart rate|pulse rate|pulse|pr|hr)(?:\s*(?:is|of|at))?\s*(\d{2,3}(?:\.\d+)?)/);
  if (hrMatch) {
    vitals.hr = hrMatch[1];
  }

  const rrMatch = normalized.match(/(?:respiratory rate|resp rate|resp|breaths per minute|rr)(?:\s*(?:is|of|at))?\s*(\d{1,2}(?:\.\d+)?)/);
  if (rrMatch) {
    vitals.rr = rrMatch[1];
  }

  const grbsMatch = normalized.match(/(?:grbs|blood sugar|random blood sugar|glucose)(?:\s*(?:is|of|at))?\s*(\d{2,3}(?:\.\d+)?)/);
  if (grbsMatch) {
    vitals.grbs = grbsMatch[1];
  }

  return vitals;
}

function dedupeActions(actions: CopilotAction[]): CopilotAction[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = JSON.stringify({
      intent: action.intent,
      target: action.target,
      tool: action.tool,
      pathway: action.pathway,
      route: action.route,
      patient_id: action.patient_id,
      vitals: action.vitals,
    });
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function inferPatientAction(
  transcript: string,
  patients: RouteBindings["availablePatients"] | EncounterContext["availablePatients"] | undefined,
): CopilotAction | null {
  if (!patients?.length) return null;
  const normalizedTranscript = normalizeTranscript(transcript);
  if (!/\b(open|show|take me to|go to|patient|file|chart|workspace|record)\b/.test(normalizedTranscript)) {
    return null;
  }

  const matches = patients
    .map((patient) => {
      const normalizedName = normalizeTranscript(patient.name);
      const tokens = normalizedName.split(" ");
      const hits = tokens.filter((token) => normalizedTranscript.includes(token)).length;
      const firstName = tokens[0] ?? "";
      const score = normalizedTranscript.includes(normalizedName)
        ? 100
        : hits * 10 + (firstName && normalizedTranscript.includes(firstName) ? 5 : 0);
      return { patient, score, hits };
    })
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.score - a.score || a.patient.name.localeCompare(b.patient.name));

  const best = matches[0];
  if (!best || best.score < 10) return null;

  return {
    intent: "open_patient",
    patient_id: best.patient.id,
    patient_name: best.patient.name,
  };
}

function trimChiefComplaintTail(value: string): string {
  return value
    .replace(
      /\s+(?:and\s+)?(?:vitals?|bp|blood pressure|hr|heart rate|pulse|rr|respiratory rate|resp rate|spo2|saturation|temp|temperature|grbs|glucose|blood sugar)\b[\s\S]*$/i,
      "",
    )
    .trim();
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function sanitizeChiefComplaint(value: string) {
  return toTitleCase(
    value
      .replace(/^(?:of|for|as|is)\s+/i, "")
      .replace(/\s+(?:please|now|today)$/i, "")
      .trim(),
  );
}

function extractChiefComplaintFromTranscript(transcript: string): string {
  const normalized = normalizeClinicalTranscript(transcript);
  const explicitMatch = normalized.match(
    /(?:chief complaint|complaint|presenting with|presenting complaint|symptoms?)(?:\s+(?:is|as|of))?\s+(.+)$/,
  );
  if (explicitMatch?.[1]) {
    return sanitizeChiefComplaint(trimChiefComplaintTail(explicitMatch[1]));
  }

  const fallbackPatterns = [
    { test: /\bchest pain\b/, value: "Chest pain" },
    { test: /\bshortness of breath\b|\bbreathlessness\b|\bdyspnea\b/, value: "Shortness of breath" },
    { test: /\bstroke\b|\bfacial droop\b|\bone sided weakness\b|\bslurred speech\b/, value: "Stroke symptoms" },
    { test: /\bsnake bite\b|\bsnakebite\b/, value: "Snake bite" },
    { test: /\bpoisoning\b|\boverdose\b/, value: "Poisoning" },
    { test: /\btrauma\b|\baccident\b/, value: "Trauma" },
    { test: /\bfever\b/, value: "Fever" },
    { test: /\bcough\b/, value: "Cough" },
    { test: /\bheadache\b/, value: "Headache or migraine" },
    { test: /\bdizziness\b/, value: "Dizziness" },
    { test: /\bweakness\b/, value: "Weakness" },
  ];

  const fallbackPhraseMatch = normalized.match(
    /(?:open|show|go to|take me to)?\s*patient\s+[a-z\s]+?\s+and\s+(?:enter|record|add|update|fill)?\s*(?:the\s+)?chief complaint(?:\s+(?:is|as|of))?\s+(.+)$/,
  );
  if (fallbackPhraseMatch?.[1]) {
    return sanitizeChiefComplaint(trimChiefComplaintTail(fallbackPhraseMatch[1]));
  }

  return fallbackPatterns.find((pattern) => pattern.test.test(normalized))?.value ?? "";
}

function loadPersistedMessages() {
  if (typeof window === "undefined") {
    return [WELCOME_MESSAGE];
  }

  try {
    const raw = window.localStorage.getItem(COPILOT_CHAT_HISTORY_KEY);
    if (!raw) {
      return [WELCOME_MESSAGE];
    }

    const parsed = JSON.parse(raw) as CopilotChatMessage[];
    const cleaned = parsed.filter(
      (message) =>
        message &&
        typeof message.id === "string" &&
        typeof message.role === "string" &&
        typeof message.text === "string" &&
        typeof message.timestamp === "string",
    );

    return cleaned.length ? cleaned : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

function buildDeterministicCommand(
  transcript: string,
  availablePatients: RouteBindings["availablePatients"] | EncounterContext["availablePatients"] | undefined,
): CopilotCommandResult | null {
  const normalizedTranscript = normalizeTranscript(transcript);
  const patientAction = inferPatientAction(transcript, availablePatients);
  const vitals = extractVitalsFromTranscript(transcript);
  const chiefComplaint = extractChiefComplaintFromTranscript(transcript);

  if (!patientAction && !Object.keys(vitals).length && !chiefComplaint) {
    return null;
  }

  const actions: CopilotAction[] = [];
  if (patientAction) {
    actions.push(patientAction);
  }
  if (chiefComplaint) {
    actions.push({ intent: "navigate_section", target: "Clinical Assessment" });
    actions.push({ intent: "apply_chief_complaint", target: chiefComplaint });
  }
  if (Object.keys(vitals).length) {
    actions.push({ intent: "open_tool", tool: "Add Vitals" });
    actions.push({ intent: "apply_vitals", vitals });
  }

  const primary = actions[0] ?? { intent: "unknown" as const };
  const responseParts: string[] = [];
  if (patientAction?.patient_name) {
    responseParts.push(`Opening ${patientAction.patient_name}'s file.`);
  }
  if (chiefComplaint) {
    responseParts.push(`Recording chief complaint as ${chiefComplaint}.`);
  }
  if (Object.keys(vitals).length) {
    responseParts.push("Preparing vitals entry.");
    responseParts.push("Applying recognized vitals.");
  }

  return {
    success: true,
    intent: primary.intent,
    patient_id: patientAction?.patient_id,
    patient_name: patientAction?.patient_name,
    tool: actions.find((action) => action.intent === "open_tool")?.tool,
    target: chiefComplaint,
    vitals: Object.keys(vitals).length ? vitals : undefined,
    actions,
    response_text: responseParts.join(" "),
    confidence: 0.99,
  };
}

function persistPendingEncounterPatch(
  patientId: string,
  actions: NonNullable<CopilotCommandResult["actions"]>,
) {
  if (typeof window === "undefined") return;

  const vitals = actions.find((action) => action.intent === "apply_vitals")?.vitals;
  const chiefComplaint = actions.find((action) => action.intent === "apply_chief_complaint")?.target;

  if (!vitals && !chiefComplaint) return;

  window.sessionStorage.setItem(
    `${COPILOT_PENDING_PATCH_KEY}:${patientId}`,
    JSON.stringify({
      vitals,
      chiefComplaint,
    }),
  );
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const stopPhrase = "apply changes";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Copilot ready.");
  const [lastCommand, setLastCommand] = useState<CopilotCommandResult | null>(null);
  const [summary, setSummary] = useState("");
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<CopilotRecommendation[]>([]);
  const [messages, setMessages] = useState<CopilotChatMessage[]>(() => loadPersistedMessages());
  const [busy, setBusy] = useState(false);
  const [pendingActions, setPendingActions] = useState<NonNullable<CopilotCommandResult["actions"]>>([]);
  const [pendingEncounterPatientId, setPendingEncounterPatientId] = useState<string | null>(null);
  const [routeBindings, setRouteBindings] = useState<RouteBindings | null>(null);
  const [encounterBindings, setEncounterBindings] = useState<EncounterBindings | null>(null);
  const [analyticsBindings, setAnalyticsBindings] = useState<AnalyticsBindings | null>(null);

  const pushMessage = useCallback((message: Omit<CopilotChatMessage, "id" | "timestamp">) => {
    setMessages((current) => [
      ...current,
      {
        id: `${message.role}-${Date.now()}-${current.length}`,
        timestamp: new Date().toISOString(),
        ...message,
      },
    ]);
  }, []);
  const clearHistory = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(COPILOT_CHAT_HISTORY_KEY);
    }
  }, []);
  const startNewChat = useCallback(() => {
    setInput("");
    setStatus("Copilot ready.");
    setLastCommand(null);
    setSummary("");
    setMissingItems([]);
    setRecommendations([]);
    setPendingActions([]);
    setPendingEncounterPatientId(null);
    setMessages([
      {
        ...WELCOME_MESSAGE,
        id: `copilot-welcome-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);
  const enrichCommandResult = useCallback(
    (result: CopilotCommandResult, transcriptText: string, encounterContext?: EncounterContext): CopilotCommandResult => {
      const normalized = normalizeTranscript(transcriptText);
      const actions: CopilotAction[] = result.actions?.length
        ? [...result.actions]
        : [
            {
              intent: result.intent,
              target: result.target,
              tool: result.tool,
              pathway: result.pathway,
              route: result.route,
              patient_id: result.patient_id,
              patient_name: result.patient_name,
              vitals: result.vitals,
              response_text: result.response_text,
              confidence: result.confidence,
            },
          ];

      const extractedVitals = Object.keys(result.vitals ?? {}).length
        ? result.vitals ?? {}
        : extractVitalsFromTranscript(transcriptText);

      const extractedChiefComplaint = result.target ||
        actions.find((action) => action.intent === "apply_chief_complaint")?.target ||
        extractChiefComplaintFromTranscript(transcriptText);

      const inferredPatient = !actions.some((action) => action.intent === "open_patient")
        ? inferPatientAction(transcriptText, encounterContext?.availablePatients ?? routeBindings?.availablePatients)
        : null;

      if (inferredPatient) {
        actions.unshift(inferredPatient);
      }

      if (Object.keys(extractedVitals).length) {
        const hasOpenVitalsTool = actions.some(
          (action) => action.intent === "open_tool" && action.tool?.toLowerCase().includes("vitals"),
        );
        const hasApplyVitals = actions.some((action) => action.intent === "apply_vitals");

        if (!hasOpenVitalsTool) {
          actions.push({ intent: "open_tool", tool: "Add Vitals" });
        }

        if (!hasApplyVitals) {
          actions.push({ intent: "apply_vitals", vitals: extractedVitals });
        }
      }

      if (extractedChiefComplaint) {
        const hasApplyChiefComplaint = actions.some((action) => action.intent === "apply_chief_complaint");

        if (!hasApplyChiefComplaint) {
          actions.push({ intent: "apply_chief_complaint", target: extractedChiefComplaint });
        }
      }

      if (
        !actions.some((action) => action.intent === "select_pathway") &&
        encounterContext?.availablePathways?.length
      ) {
        const symptomPathwayMatches: Array<{ pathway: string; aliases: string[] }> = [
          { pathway: "Chest Pain", aliases: ["chest pain", "chest discomfort", "chest tightness", "chest pressure"] },
          { pathway: "Shortness of Breath", aliases: ["shortness of breath", "breathlessness", "difficulty breathing"] },
          { pathway: "Stroke", aliases: ["stroke", "slurred speech", "facial droop", "one sided weakness"] },
          { pathway: "Sepsis", aliases: ["sepsis", "septic", "fever with low bp"] },
        ];

        const inferredPathway = symptomPathwayMatches.find((entry) =>
          entry.aliases.some((alias) => normalized.includes(alias)),
        )?.pathway;

        if (
          inferredPathway &&
          encounterContext.availablePathways.some(
            (pathway) => pathway.toLowerCase() === inferredPathway.toLowerCase(),
          )
        ) {
          actions.push({ intent: "select_pathway", pathway: inferredPathway });
        }
      }

      const dedupedActions = dedupeActions(actions);
      const primary = dedupedActions[0];
      const responseParts: string[] = [];
      if (primary?.intent === "open_patient" && primary.patient_name) {
        responseParts.push(`Opening ${primary.patient_name}'s file.`);
      } else if (result.response_text) {
        responseParts.push(result.response_text);
      }
      if (dedupedActions.length > 1) {
        if (
          dedupedActions.some((action) => action.intent === "open_tool" && action.tool?.toLowerCase().includes("vitals")) &&
          !responseParts.some((part) => part.includes("Preparing vitals entry"))
        ) {
          responseParts.push("Preparing vitals entry.");
        }
        if (
          dedupedActions.some((action) => action.intent === "apply_vitals") &&
          !responseParts.some((part) => part.includes("Applying recognized vitals"))
        ) {
          responseParts.push("Applying recognized vitals.");
        }
        const chiefComplaintAction = dedupedActions.find((action) => action.intent === "apply_chief_complaint");
        if (
          chiefComplaintAction?.target &&
          !responseParts.some((part) => part.includes("Recording chief complaint"))
        ) {
          responseParts.push(`Recording chief complaint as ${chiefComplaintAction.target}.`);
        }
        const selectedPathway = dedupedActions.find((action) => action.intent === "select_pathway")?.pathway;
        if (selectedPathway && !responseParts.some((part) => part.includes(`Selecting ${selectedPathway} pathway`))) {
          responseParts.push(`Selecting ${selectedPathway} pathway.`);
        }
      }

      return {
        ...result,
        intent: primary.intent,
        target: primary.target ?? result.target ?? extractedChiefComplaint,
        tool: primary.tool ?? result.tool,
        pathway: primary.pathway ?? result.pathway,
        route: primary.route ?? result.route,
        patient_id: primary.patient_id ?? result.patient_id,
        patient_name: primary.patient_name ?? result.patient_name,
        vitals: Object.keys(extractedVitals).length ? extractedVitals : result.vitals,
        actions: dedupedActions,
        response_text: responseParts.filter(Boolean).join(" ").trim(),
      };
    },
    [routeBindings],
  );
  const voice = useVoiceSession({
    onAudioCaptured: async (audioBlob) => {
      if (!routeBindings) {
        setStatus("Copilot route bindings are not ready yet.");
        return;
      }

      setBusy(true);
      setStatus("Transcribing and understanding your voice command...");
      try {
        const encounterContext = encounterBindings?.getContext();
        const result = await parseCopilotVoiceCommand({
          audioBlob,
          context: {
            current_route: routeBindings.currentRoute,
            current_section: encounterContext?.currentSection,
            stop_phrase: stopPhrase,
            available_routes: routeBindings.availableRoutes,
            available_patients: encounterContext?.availablePatients ?? routeBindings.availablePatients ?? [],
            available_sections: encounterContext?.availableSections ?? [],
            available_tools: encounterContext?.availableTools ?? [],
            available_pathways: encounterContext?.availablePathways ?? [],
          },
        });
        const enrichedResult = enrichCommandResult(result, result.transcript || "", encounterContext);
        setInput(result.transcript || "");
        setLastCommand(enrichedResult);
        setStatus(enrichedResult.response_text);
        pushMessage({ role: "user", text: result.transcript || "Voice command captured." });
        pushMessage({ role: "assistant", text: enrichedResult.response_text });
        await executeCommand(enrichedResult);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Voice command failed.";
        setStatus(message);
        pushMessage({ role: "assistant", text: message });
      } finally {
        setBusy(false);
      }
    },
  });

  const requestSummary = useCallback(async () => {
    if (!encounterBindings) {
      setStatus("Open a patient encounter to generate a summary.");
      return;
    }

    setBusy(true);
    setStatus("Generating encounter summary...");
    try {
      const data = await generateCopilotSummary(encounterBindings.getContext());
      setSummary(data.summary);
      setMissingItems(data.missing_items);
      setStatus("Encounter summary updated.");
      pushMessage({ role: "assistant", text: data.summary });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate summary.";
      setStatus(message);
      pushMessage({ role: "assistant", text: message });
    } finally {
      setBusy(false);
    }
  }, [encounterBindings, pushMessage]);

  const requestRecommendations = useCallback(async () => {
    if (!encounterBindings) {
      setStatus("Open a patient encounter to review recommendations.");
      return;
    }

    setBusy(true);
    setStatus("Reviewing workflow recommendations...");
    try {
      const data = await generateCopilotRecommendations(encounterBindings.getContext());
      setRecommendations(data.recommendations);
      setStatus("Recommendations ready for review.");
      pushMessage({
        role: "assistant",
        text: data.recommendations.length
          ? `Recommendations ready: ${data.recommendations.map((item) => item.title).join(", ")}.`
          : "No recommendations were generated.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate recommendations.";
      setStatus(message);
      pushMessage({ role: "assistant", text: message });
    } finally {
      setBusy(false);
    }
  }, [encounterBindings, pushMessage]);

  const executeAction = useCallback(async (result: CopilotCommandResult | NonNullable<CopilotCommandResult["actions"]>[number]) => {
    if (result.intent === "navigate_route" && result.route && routeBindings) {
      routeBindings.navigateRoute(result.route);
      if (result.response_text) {
        setStatus(result.response_text);
      }
      return true;
    }

    if (result.intent === "open_patient" && result.patient_id && routeBindings?.openPatient) {
      routeBindings.openPatient(result.patient_id);
      if (result.response_text) {
        setStatus(result.response_text);
      }
      return true;
    }

    if (result.intent === "navigate_section" && result.target && encounterBindings?.goToSection) {
      encounterBindings.goToSection(result.target);
      if (result.response_text) {
        setStatus(result.response_text);
      }
      return true;
    }

    if (result.intent === "next_step") {
      if (!encounterBindings?.nextStep) {
        setStatus("Open a patient workspace before moving to the next encounter section.");
        return false;
      }
      encounterBindings.nextStep();
      if (result.response_text) {
        setStatus(result.response_text);
      }
      return true;
    }

    if (result.intent === "previous_step") {
      if (!encounterBindings?.previousStep) {
        setStatus("Open a patient workspace before going back to a previous encounter section.");
        return false;
      }
      encounterBindings.previousStep();
      if (result.response_text) {
        setStatus(result.response_text);
      }
      return true;
    }

    if (result.intent === "open_tool" && result.tool) {
      if (!encounterBindings?.openTool) {
        setStatus("Open a patient workspace before using copilot tools like vitals, orders, or scoring.");
        return false;
      }
      encounterBindings.openTool(result.tool);
      if (result.response_text) {
        setStatus(result.response_text);
      }
      return true;
    }

    if (result.intent === "apply_vitals" && result.vitals) {
      if (!encounterBindings?.applyVitals) {
        setStatus("Open a patient workspace before applying recognized vitals.");
        return false;
      }
      encounterBindings.applyVitals(result.vitals);
      if (result.response_text) {
        setStatus(result.response_text);
      }
      return true;
    }

    if (result.intent === "apply_chief_complaint" && result.target) {
      if (!encounterBindings?.applyChiefComplaint) {
        setStatus("Open a patient workspace before applying the chief complaint.");
        return false;
      }
      encounterBindings.applyChiefComplaint(result.target);
      if (result.response_text) {
        setStatus(result.response_text);
      }
      return true;
    }

    if (result.intent === "select_pathway" && result.pathway) {
      if (!encounterBindings?.selectPathway) {
        setStatus("Open a patient workspace before selecting a care pathway.");
        return false;
      }
      encounterBindings.selectPathway(result.pathway);
      if (result.response_text) {
        setStatus(result.response_text);
      }
      return true;
    }

    if (result.intent === "generate_summary") {
      await requestSummary();
      return true;
    }

    if (result.intent === "get_recommendations") {
      await requestRecommendations();
      return true;
    }
    if (result.intent === "open_patient" && !routeBindings?.openPatient) {
      setStatus("Copilot could identify the patient, but patient navigation is not available on this screen.");
      return false;
    }

    if (result.intent === "unknown") {
      setStatus(result.response_text || "I understood the audio, but I could not map it to a local app action.");
      return false;
    }

    return false;
  }, [encounterBindings, requestRecommendations, requestSummary, routeBindings]);

  const executeCommand = useCallback(async (result: CopilotCommandResult) => {
    const actions = result.actions?.length ? result.actions : [result];
    const [firstAction, ...restActions] = actions;

    if (firstAction.intent === "open_patient" && firstAction.patient_id && restActions.length) {
      persistPendingEncounterPatch(firstAction.patient_id, actions);
    }

    const didExecute = await executeAction(firstAction);

    if (!didExecute) {
      setPendingActions([]);
      setPendingEncounterPatientId(null);
      return;
    }

    setPendingEncounterPatientId(firstAction.intent === "open_patient" ? firstAction.patient_id ?? null : null);
    setPendingActions(restActions);
  }, [executeAction]);

  const runCommand = useCallback(async (transcript?: string) => {
    const text = (transcript ?? input).trim();
    if (!text || !routeBindings) return;

    setBusy(true);
    setStatus("Understanding command...");
    pushMessage({ role: "user", text });
    try {
      if (routeBindings.currentRoute.startsWith("/analytics") && analyticsBindings) {
        const chartResult = await analyticsBindings.buildChart(text);
        if (chartResult) {
          setStatus(chartResult.responseText);
          pushMessage({
            role: "assistant",
            text: chartResult.responseText,
            chart: chartResult.chart,
          });
          setInput("");
          setBusy(false);
          return;
        }
      }

      const encounterContext = encounterBindings?.getContext();
      const deterministicCommand = !routeBindings.currentRoute.startsWith("/analytics")
        ? buildDeterministicCommand(text, encounterContext?.availablePatients ?? routeBindings.availablePatients)
        : null;

      if (deterministicCommand) {
        setLastCommand(deterministicCommand);
        setStatus(deterministicCommand.response_text);
        pushMessage({ role: "assistant", text: deterministicCommand.response_text });
        setInput("");
        await executeCommand(deterministicCommand);
        return;
      }

      const result = await parseCopilotCommand({
        transcript: text,
        current_route: routeBindings.currentRoute,
        current_section: encounterContext?.currentSection,
        available_routes: routeBindings.availableRoutes,
        available_patients: encounterContext?.availablePatients ?? routeBindings.availablePatients ?? [],
        available_sections: encounterContext?.availableSections ?? [],
        available_tools: encounterContext?.availableTools ?? [],
        available_pathways: encounterContext?.availablePathways ?? [],
      });
      const enrichedResult = enrichCommandResult(result, text, encounterContext);
      setLastCommand(enrichedResult);
      setStatus(enrichedResult.response_text);
      pushMessage({ role: "assistant", text: enrichedResult.response_text });
      setInput("");
      await executeCommand(enrichedResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not process command.";
      setStatus(message);
      pushMessage({ role: "assistant", text: message });
    } finally {
      setBusy(false);
    }
  }, [analyticsBindings, encounterBindings, enrichCommandResult, executeCommand, input, pushMessage, routeBindings]);

  const requestMicrophonePermission = useCallback(async () => {
    setStatus("Requesting microphone permission...");
    try {
      await voice.requestPermission();
      setStatus("Microphone permission granted.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Microphone permission failed.");
    }
  }, [voice]);

  const startVoiceCapture = useCallback(async (label?: string) => {
    setOpen(true);
    setStatus(label ? `Recording for ${label}...` : "Recording voice command...");
    try {
      await voice.startListening();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start listening.");
    }
  }, [voice]);

  const stopVoiceCapture = useCallback(() => {
    voice.stopListening();
    setStatus("Voice capture stopped.");
  }, [voice]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COPILOT_CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-50)));
  }, [messages]);

  useEffect(() => {
    if (voice.listening) {
      setStatus(`Recording now. Say "${stopPhrase}" when you want me to apply it.`);
      return;
    }

    if (voice.lastError) {
      setStatus(`Voice error: ${voice.lastError}`);
      return;
    }

    if (voice.permissionState === "granted") {
      setStatus((current) =>
        current.startsWith("Recording") || current.startsWith("Requesting microphone")
          ? "Microphone ready."
          : current,
      );
    }
  }, [voice.listening, voice.lastError, voice.permissionState]);

  useEffect(() => {
    if (!pendingActions.length) {
      return;
    }

    const nextAction = pendingActions[0];
    const needsEncounter =
      nextAction.intent === "navigate_section" ||
      nextAction.intent === "next_step" ||
      nextAction.intent === "previous_step" ||
      nextAction.intent === "open_tool" ||
      nextAction.intent === "apply_vitals" ||
      nextAction.intent === "apply_chief_complaint" ||
      nextAction.intent === "select_pathway";

    if (needsEncounter && !encounterBindings) {
      return;
    }

    if ((nextAction.intent === "navigate_route" || nextAction.intent === "open_patient") && !routeBindings) {
      return;
    }

    if (pendingEncounterPatientId) {
      const activePatientId = encounterBindings?.getContext().patientId;
      const isEncounterAction =
        nextAction.intent === "navigate_section" ||
        nextAction.intent === "next_step" ||
        nextAction.intent === "previous_step" ||
        nextAction.intent === "open_tool" ||
        nextAction.intent === "apply_vitals" ||
        nextAction.intent === "apply_chief_complaint" ||
        nextAction.intent === "select_pathway";

      if (isEncounterAction && activePatientId !== pendingEncounterPatientId) {
        return;
      }
    }

    const timer = window.setTimeout(async () => {
      const didExecute = await executeAction(nextAction);
      if (didExecute) {
        if (pendingEncounterPatientId && encounterBindings?.getContext().patientId === pendingEncounterPatientId) {
          setPendingEncounterPatientId(null);
        }
        setPendingActions((current) => current.slice(1));
      } else {
        setPendingActions([]);
        setPendingEncounterPatientId(null);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [encounterBindings, executeAction, pendingActions, pendingEncounterPatientId, routeBindings]);

  const value = useMemo<CopilotContextValue>(
    () => ({
      open,
      setOpen,
      input,
      setInput,
      status,
      lastCommand,
      summary,
      missingItems,
      recommendations,
      messages,
      clearHistory,
      startNewChat,
      busy,
      listening: voice.listening,
      voiceSupported: voice.supported,
      voicePermissionState: voice.permissionState,
      voiceLastError: voice.lastError,
      analyticsBindings,
      routeBindings,
      encounterBindings,
      setAnalyticsBindings,
      setRouteBindings,
      setEncounterBindings,
      runCommand,
      requestSummary,
      requestRecommendations,
      requestMicrophonePermission,
      startVoiceCapture,
      stopVoiceCapture,
    }),
    [
      open,
      input,
      status,
      lastCommand,
      summary,
      missingItems,
      recommendations,
      messages,
      clearHistory,
      startNewChat,
      busy,
      voice.listening,
      voice.supported,
      voice.permissionState,
      voice.lastError,
      analyticsBindings,
      routeBindings,
      encounterBindings,
      setAnalyticsBindings,
      runCommand,
      requestSummary,
      requestRecommendations,
      requestMicrophonePermission,
      startVoiceCapture,
      stopVoiceCapture,
    ],
  );

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
}

export function useCopilotContext() {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error("useCopilotContext must be used inside CopilotProvider.");
  }
  return context;
}
