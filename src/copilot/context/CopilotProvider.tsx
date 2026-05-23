import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  generateCopilotRecommendations,
  generateCopilotSummary,
  parseCopilotCommand,
  parseCopilotVoiceCommand,
} from "@/copilot/services/copilotApi";
import { useVoiceSession } from "@/copilot/hooks/useVoiceSession";
import type {
  CopilotAction,
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
  routeBindings: RouteBindings | null;
  encounterBindings: EncounterBindings | null;
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

function normalizeTranscript(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractVitalsFromTranscript(normalized: string): Record<string, string> {
  const vitals: Record<string, string> = {};

  const bpMatch = normalized.match(/(?:bp|blood pressure)\s*(?:is\s*)?(\d{2,3})\s*(?:by|over|\/)\s*(\d{2,3})/);
  if (bpMatch) {
    vitals.sbp = bpMatch[1];
    vitals.dbp = bpMatch[2];
  }

  const spo2Match = normalized.match(/(?:oxygen(?: levels?)?|spo2|saturation)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)/);
  if (spo2Match) {
    vitals.spo2 = spo2Match[1];
  }

  const tempMatch = normalized.match(/(?:temperature|temp)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)/);
  if (tempMatch) {
    vitals.temp = tempMatch[1];
  }

  const hrMatch = normalized.match(/(?:heart rate|pulse|hr)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)/);
  if (hrMatch) {
    vitals.hr = hrMatch[1];
  }

  const rrMatch = normalized.match(/(?:respiratory rate|resp rate|rr)\s*(?:is\s*)?(\d{1,2}(?:\.\d+)?)/);
  if (rrMatch) {
    vitals.rr = rrMatch[1];
  }

  const grbsMatch = normalized.match(/(?:grbs|blood sugar|glucose)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)/);
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

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const stopPhrase = "apply changes";
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Copilot ready.");
  const [lastCommand, setLastCommand] = useState<CopilotCommandResult | null>(null);
  const [summary, setSummary] = useState("");
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<CopilotRecommendation[]>([]);
  const [busy, setBusy] = useState(false);
  const [pendingActions, setPendingActions] = useState<NonNullable<CopilotCommandResult["actions"]>>([]);
  const [routeBindings, setRouteBindings] = useState<RouteBindings | null>(null);
  const [encounterBindings, setEncounterBindings] = useState<EncounterBindings | null>(null);
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
        : extractVitalsFromTranscript(normalized);

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
      const responseParts = [result.response_text];
      if (dedupedActions.length > 1) {
        if (dedupedActions.some((action) => action.intent === "open_tool" && action.tool?.toLowerCase().includes("vitals"))) {
          responseParts.push("Preparing vitals entry.");
        }
        if (dedupedActions.some((action) => action.intent === "apply_vitals")) {
          responseParts.push("Applying recognized vitals.");
        }
        const selectedPathway = dedupedActions.find((action) => action.intent === "select_pathway")?.pathway;
        if (selectedPathway) {
          responseParts.push(`Selecting ${selectedPathway} pathway.`);
        }
      }

      return {
        ...result,
        intent: primary.intent,
        target: primary.target ?? result.target,
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
    [],
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
        await executeCommand(enrichedResult);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Voice command failed.");
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
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not generate summary.");
    } finally {
      setBusy(false);
    }
  }, [encounterBindings]);

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
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not generate recommendations.");
    } finally {
      setBusy(false);
    }
  }, [encounterBindings]);

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
    const didExecute = await executeAction(firstAction);

    if (!didExecute) {
      setPendingActions([]);
      return;
    }

    setPendingActions(restActions);
  }, [executeAction]);

  const runCommand = useCallback(async (transcript?: string) => {
    const text = (transcript ?? input).trim();
    if (!text || !routeBindings) return;

    setBusy(true);
    setStatus("Understanding command...");
    try {
      const encounterContext = encounterBindings?.getContext();
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
      setInput("");
      await executeCommand(enrichedResult);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not process command.");
    } finally {
      setBusy(false);
    }
  }, [encounterBindings, enrichCommandResult, executeCommand, input, routeBindings]);

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
      nextAction.intent === "select_pathway";

    if (needsEncounter && !encounterBindings) {
      return;
    }

    if ((nextAction.intent === "navigate_route" || nextAction.intent === "open_patient") && !routeBindings) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const didExecute = await executeAction(nextAction);
      if (didExecute) {
        setPendingActions((current) => current.slice(1));
      } else {
        setPendingActions([]);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [encounterBindings, executeAction, pendingActions, routeBindings]);

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
      busy,
      listening: voice.listening,
      voiceSupported: voice.supported,
      voicePermissionState: voice.permissionState,
      voiceLastError: voice.lastError,
      routeBindings,
      encounterBindings,
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
      busy,
      voice.listening,
      voice.supported,
      voice.permissionState,
      voice.lastError,
      routeBindings,
      encounterBindings,
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
