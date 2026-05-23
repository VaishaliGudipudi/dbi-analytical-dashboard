import type { CopilotCommandResult, CopilotRecommendation, EncounterContext } from "@/copilot/types/copilot";

const COPILOT_API_BASE = (import.meta.env.VITE_COPILOT_API_BASE as string | undefined) ?? "http://127.0.0.1:8000";

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${COPILOT_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Copilot request failed.");
  }

  return data as T;
}

export async function parseCopilotCommand(payload: {
  transcript: string;
  current_route: string;
  current_section?: string;
  available_routes: string[];
  available_patients?: Array<{ id: string; name: string }>;
  available_sections: string[];
  available_tools: string[];
  available_pathways: string[];
}): Promise<CopilotCommandResult> {
  return postJson<CopilotCommandResult>("/api/copilot/command", payload);
}

export async function parseCopilotVoiceCommand(payload: {
  audioBlob: Blob;
  context: {
    current_route: string;
    current_section?: string;
    stop_phrase?: string;
    available_routes: string[];
    available_patients?: Array<{ id: string; name: string }>;
    available_sections: string[];
    available_tools: string[];
    available_pathways: string[];
  };
}): Promise<CopilotCommandResult & { transcript: string }> {
  const response = await fetch(`${COPILOT_API_BASE}/api/copilot/voice-command`, {
    method: "POST",
    headers: {
      "Content-Type": payload.audioBlob.type || "audio/webm",
      "X-Copilot-Context": encodeURIComponent(JSON.stringify(payload.context)),
    },
    body: payload.audioBlob,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Copilot voice command failed.");
  }

  return data as CopilotCommandResult & { transcript: string };
}

export async function generateCopilotSummary(encounterContext: EncounterContext): Promise<{
  success: boolean;
  summary: string;
  missing_items: string[];
}> {
  return postJson("/api/copilot/summary", { encounter_context: encounterContext });
}

export async function generateCopilotRecommendations(encounterContext: EncounterContext): Promise<{
  success: boolean;
  recommendations: CopilotRecommendation[];
}> {
  return postJson("/api/copilot/recommendations", { encounter_context: encounterContext });
}
