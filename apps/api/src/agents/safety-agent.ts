/**
 * safety-agent
 *
 * Routed when the orchestrator's crisis pre-filter fires (suicide ideation,
 * chest pain, can't breathe, overdose language, etc.). Returns a
 * deterministic refusal-with-resources template — never invokes the LLM
 * for these turns to remove any chance of an unsafe paraphrase.
 *
 * The safety GATE (evaluateSafetyGate) still runs on this output through
 * the orchestrator's normal pipeline; the agent's job is to produce a
 * compassionate, in-character response that the gate will pass.
 *
 * Aligned with: JEFFREY_BRAIN_ROADMAP.md §J3-5, SAFETY_RULE_PACK_V1.md.
 */
import type { SubAgent } from "@aissisted/jeffrey";

const CRISIS_TEMPLATE = [
  "I'm here, and I'm taking what you said seriously.",
  "",
  "Please reach a clinician or crisis service right now — they can help in a way I cannot.",
  "  · US: call or text 988 (Suicide & Crisis Lifeline)",
  "  · UK: 116 123 (Samaritans)",
  "  · If you or someone near you is in immediate danger, call your local emergency number.",
  "",
  "When you're safe, I'll be here. We can talk through anything you'd like, whenever you're ready.",
].join("\n");

export const safetyAgent: SubAgent = {
  name: "safety",
  async handle(input) {
    return {
      text: CRISIS_TEMPLATE,
      citedTools: ["safety:crisis-template"],
      metadata: {
        safetyTemplate: "crisis-v1",
        rawInputRedacted: true,
      },
    };
  },
};
