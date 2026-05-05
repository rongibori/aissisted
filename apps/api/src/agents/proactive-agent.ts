/**
 * proactive-agent
 *
 * Server-fired only. Routed when the input begins with the sentinel
 * `__proactive__:` prefix that the scheduler (or signals.ts consumer)
 * uses to surface a proactive nudge through the same orchestrator
 * pipeline. Never user-callable — the chat route strips the prefix
 * before reaching this point on user inputs, so the regex match is a
 * dead branch for end-users.
 *
 * For Phase D MVP returns a deterministic templated response derived
 * from the sentinel payload. Future (J3-4) swaps in adaptive-tuning
 * results and refill triggers driven by signals.ts.
 *
 * Aligned with: JEFFREY_BRAIN_ROADMAP.md §J3-4.
 */
import type { SubAgent } from "@aissisted/jeffrey";

export const proactiveAgent: SubAgent = {
  name: "proactive",
  async handle(input) {
    // Strip the sentinel and use whatever follows as the nudge body.
    const body = input.input.replace(/^__proactive__:\s*/i, "").trim();
    const text = body.length > 0
      ? body
      : "A check-in from Jeffrey. Open the dashboard when you have a moment.";
    return {
      text,
      citedTools: ["proactive"],
      metadata: { proactive: true },
    };
  },
};
