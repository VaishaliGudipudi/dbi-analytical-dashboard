import type { CopilotCommandResult, CopilotRecommendation, EncounterContext } from "@/copilot/types/copilot";

const COPILOT_API_BASE = (import.meta.env.VITE_COPILOT_API_BASE as string | undefined) ?? "http://127.0.0.1:8000";

function copilotConnectionError() {
  return `Copilot service is not reachable at ${COPILOT_API_BASE}. Start assistant-core/web/server.py first. If the server is up but responses still fail, make sure Ollama is running with \`ollama serve\` and that the configured model exists.`;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  try {
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
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(copilotConnectionError());
    }
    throw error;
  }
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
  try {
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
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(copilotConnectionError());
    }
    throw error;
  }
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
