/**
 * Sub-agent registration entrypoint.
 *
 * Called once at API boot from apps/api/src/index.ts. Registers the four
 * concrete sub-agents (formula, recall, proactive, safety) into the
 * orchestrator's agent map so `orchestrate(input)` can dispatch.
 *
 * Aligned with: JEFFREY_BRAIN_ROADMAP.md §J3.
 */
import { registerAgent } from "@aissisted/jeffrey";
import { formulaAgent } from "./formula-agent.js";
import { recallAgent } from "./recall-agent.js";
import { proactiveAgent } from "./proactive-agent.js";
import { safetyAgent } from "./safety-agent.js";

export function registerAllAgents(): void {
  registerAgent(formulaAgent);
  registerAgent(recallAgent);
  registerAgent(proactiveAgent);
  registerAgent(safetyAgent);
}

export { formulaAgent, recallAgent, proactiveAgent, safetyAgent };
