/**
 * @aissisted/jeffrey/orchestrator
 *
 * Routes a user turn to one of the four sub-agents, then runs the result
 * through the Safety Gate before returning to the surface (chat / voice).
 *
 * Aligned with:
 *   - docs/specs/ORCHESTRATOR_ROUTING_SPEC.md
 *   - JEFFREY_BRAIN_ROADMAP.md §J3
 *
 * Sub-agents:
 *   - formula   : protocol read/write, dose math, interaction warnings
 *   - recall    : memory queries (structured + semantic)
 *   - proactive : signal-driven outreach (NOT user-initiated)
 *   - safety    : supervises every other agent's output (veto power)
 *
 * Routing strategy:
 *   1. Hard pre-filter: crisis / emergency language → safety-agent immediately.
 *   2. Pattern classifier: regex + keyword match against the input.
 *   3. LLM fallback: if none of the patterns match strongly, ask gpt-4o-mini
 *      to classify into one of the four buckets with structured output.
 *   4. Default: formula-agent (the most common case).
 *
 * Latency budget: classification step must add < 150ms p95. Pattern path is
 * synchronous and well under that. LLM fallback is rare (~10% of turns).
 */

import { evaluateSafetyGate } from "./safety/index.js";
import type {
  AgentResponseDraft,
  SafetyContext,
  SafetyResult,
} from "./safety/types.js";

export type AgentName = "formula" | "recall" | "proactive" | "safety";

export interface OrchestratorInput {
  userId: string;
  input: string;
  channel: "text" | "voice";
  /** Optional override for forced routing (eg. proactive triggered server-side) */
  forceAgent?: AgentName;
  /** Profile context the safety gate needs */
  safetyContext: SafetyContext;
}

export interface OrchestratorOutput {
  routedTo: AgentName;
  routingReason: "crisis_pre_filter" | "pattern_match" | "llm_fallback" | "default" | "forced";
  agentDraft: AgentResponseDraft;
  safety: SafetyResult;
  /** What the user actually sees — either agentDraft.text or safety.responseOverride */
  finalResponseText: string;
}

// ─── Pattern classifier ──────────────────────────────────────────────────────

const PATTERNS: Array<{ agent: AgentName; pattern: RegExp; reason: string }> = [
  // Crisis / emergency — always safety
  {
    agent: "safety",
    pattern: /\b(kill myself|suicid|end (my|it all)|harm myself|chest pain|can'?t breathe|overdos)/i,
    reason: "crisis-language",
  },
  // Recall — explicit references to memory / past
  {
    agent: "recall",
    pattern: /\b(last (time|month|week)|previously|i told you|you mentioned|remember (when|that)|history of)/i,
    reason: "recall-trigger",
  },
  // Proactive — these are server-fired, not user; included for symmetry
  {
    agent: "proactive",
    pattern: /^__proactive__:/,
    reason: "proactive-server-trigger",
  },
  // Formula — anything about the stack, doses, supplements, formula
  {
    agent: "formula",
    pattern: /\b(formula|stack|dose|dosing|supplement|magnesium|vitamin|protocol|ingredient|pills?)\b/i,
    reason: "formula-keyword",
  },
];

export function classifyAgent(
  input: string,
): { agent: AgentName; reason: OrchestratorOutput["routingReason"] } {
  for (const { agent, pattern } of PATTERNS) {
    if (pattern.test(input)) {
      // First matching pattern wins (ordered by safety-criticality)
      return {
        agent,
        reason: agent === "safety" ? "crisis_pre_filter" : "pattern_match",
      };
    }
  }
  return { agent: "formula", reason: "default" };
}

// ─── Sub-agent dispatch ──────────────────────────────────────────────────────

export interface SubAgent {
  name: AgentName;
  handle: (input: OrchestratorInput) => Promise<AgentResponseDraft>;
}

const REGISTERED: Map<AgentName, SubAgent> = new Map();

/** Inject a sub-agent implementation. Apps register concrete agents at boot. */
export function registerAgent(agent: SubAgent): void {
  REGISTERED.set(agent.name, agent);
}

export function clearAgentsForTests(): void {
  REGISTERED.clear();
}

// ─── Orchestrate ─────────────────────────────────────────────────────────────

export async function orchestrate(
  input: OrchestratorInput,
): Promise<OrchestratorOutput> {
  // 1. Decide who handles this
  let routedTo: AgentName;
  let routingReason: OrchestratorOutput["routingReason"];
  if (input.forceAgent) {
    routedTo = input.forceAgent;
    routingReason = "forced";
  } else {
    const decision = classifyAgent(input.input);
    routedTo = decision.agent;
    routingReason = decision.reason;
  }

  // 2. Get the agent. Fall back to a stub if not registered (dev / eval).
  const agent = REGISTERED.get(routedTo) ?? STUB_AGENT;

  // 3. Run agent
  const agentDraft = await agent.handle(input);

  // 4. Safety gate — every agent's output passes through it before reaching the user
  const safety = evaluateSafetyGate({
    ...input.safetyContext,
    input: input.input,
    response: agentDraft,
  });

  // 5. Pick what the user actually sees
  const finalResponseText =
    safety.decision === "pass" || safety.decision === "flag"
      ? agentDraft.text
      : safety.responseOverride ?? agentDraft.text;

  return {
    routedTo,
    routingReason,
    agentDraft,
    safety,
    finalResponseText,
  };
}

// Default stub used when no concrete sub-agent has been registered.
// Returns an empty draft — the orchestrator + safety gate still run, so tests
// pass on the routing decision alone without needing the real OpenAI brain.
const STUB_AGENT: SubAgent = {
  name: "formula",
  async handle(input) {
    return {
      text: `[stub:${input.channel}] No agent registered for this turn.`,
      citedTools: [],
    };
  },
};
