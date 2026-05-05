/**
 * recall-agent
 *
 * Memory-recall sub-agent. Routed when the input matches recall language
 * ("last week", "previously", "you mentioned", "remember", ...). For
 * Phase D MVP it delegates to the same chat() pipeline as formula-agent
 * — the existing flow already loads conversation history and biomarker
 * context, which covers most "what was X last time" questions correctly.
 *
 * Future (J2-3 / J2-4): swap in a pgvector-backed semantic recall layer
 * with per-turn memory consolidation. The MVP keeps grounding sufficient
 * for the 10-person pilot without that infrastructure.
 *
 * Aligned with: JEFFREY_BRAIN_ROADMAP.md §J3-3.
 */
import type { SubAgent } from "@aissisted/jeffrey";
import { chat } from "../services/jeffrey.service.js";

export const recallAgent: SubAgent = {
  name: "recall",
  async handle(input) {
    // Same pipeline; the orchestrator's `routedTo: recall` is captured in
    // audit telemetry so downstream consumers know this turn was a recall
    // query even though the underlying brain is shared.
    const result = await chat(input.userId, input.input, input.conversationId);
    return {
      text: result.reply,
      citedTools: ["chat", "memory:conversation", `intent:${result.intent}`],
      metadata: {
        intent: result.intent,
        protocolTriggered: result.protocolTriggered,
        conversationId: result.conversationId,
        recallMode: true,
      },
    };
  },
};
