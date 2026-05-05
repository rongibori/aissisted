/**
 * formula-agent
 *
 * Default sub-agent. Owns protocol read/write, dose math, biomarker
 * interpretation. For Phase D MVP it wraps the existing canonical
 * `chat()` pipeline in services/jeffrey.service.ts so the production
 * brain (intent → protocol gen → biomarker context → conversation
 * memory) is preserved unchanged. The orchestrator + safety gate run
 * around it; the agent itself is a thin boundary.
 *
 * Aligned with: JEFFREY_BRAIN_ROADMAP.md §J3-2.
 */
import type { SubAgent } from "@aissisted/jeffrey";
import { chat } from "../services/jeffrey.service.js";

export const formulaAgent: SubAgent = {
  name: "formula",
  async handle(input) {
    const result = await chat(input.userId, input.input, input.conversationId);
    return {
      text: result.reply,
      citedTools: ["chat", `intent:${result.intent}`],
      metadata: {
        intent: result.intent,
        protocolTriggered: result.protocolTriggered,
        conversationId: result.conversationId,
      },
    };
  },
};
