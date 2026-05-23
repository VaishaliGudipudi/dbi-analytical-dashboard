import { useCopilotContext } from "@/copilot/context/CopilotProvider";

export function useCopilot() {
  return useCopilotContext();
}
