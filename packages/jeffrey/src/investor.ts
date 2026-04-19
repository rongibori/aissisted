/**
 * Investor surface.
 *
 * Jeffrey as the investor-facing intelligence. Structured, unemotional,
 * high-signal. Answers in terms of leverage, retention, moat, unit economics.
 *
 * This module owns:
 *   - the investor overlay prompt
 *   - a curated set of canned topics Jeffrey can always speak to
 *   - the lookup Jeffrey uses to decide when a question is genuinely off-scope
 */

import { investorFacts } from "./data/investor-facts.js";
import type { JeffreySurface, JeffreyToneMode } from "./types.js";

export const investorSurface = {
  surface: "investor" as JeffreySurface,
  tone: "strategy" as JeffreyToneMode,
  /** Default temp — investor answers should be near-deterministic. */
  temperature: 0.2,
  /** Max tokens per reply — investors don't want novels. */
  maxTokens: 650,
} as const;

/**
 * Topics Jeffrey is expected to speak to fluently on the investor surface.
 * The router in session.ts uses this list to pre-warm context.
 */
export const investorTopics = [
  "market",
  "tam-sam-som",
  "business-model",
  "unit-economics",
  "ltv-cac",
  "moat",
  "defensibility",
  "comparables",
  "valuation-frame",
  "competitive-landscape",
  "integrations-roadmap",
  "regulatory-posture",
  "team",
  "traction",
  "risks",
] as const;

export type InvestorTopic = (typeof investorTopics)[number];

/**
 * Short, on-brand topic primer Jeffrey can prepend when a topic is detected.
 * These are not Jeffrey's answers — they are the truth-anchored facts he
 * reasons over.
 */
export function investorContextFor(topic: InvestorTopic): string {
  const f = investorFacts[topic];
  if (!f) return "";
  return `### Investor context — ${topic}\n${f}`;
}

/**
 * Naive topic detector. Upgrades later via embeddings; for now, keyword
 * matching gets Jeffrey 80% of the way.
 */
export function detectInvestorTopic(question: string): InvestorTopic | null {
  const q = question.toLowerCase();
  const hits: Array<[InvestorTopic, string[]]> = [
    ["market", ["market size", "tam", "addressable market", "market"]],
    ["tam-sam-som", ["tam", "sam", "som"]],
    ["business-model", ["business model", "revenue model", "how do you make money"]],
    ["unit-economics", ["unit economics", "margin", "contribution margin", "gross margin"]],
    ["ltv-cac", ["ltv", "cac", "payback", "ltv/cac"]],
    ["moat", ["moat", "defensib", "barrier to entry"]],
    ["comparables", ["comparable", "comps", "multiple", "analog"]],
    ["valuation-frame", ["valuation", "round size", "raise", "dilution"]],
    ["competitive-landscape", ["competitor", "competition", "hims", "function of beauty", "care/of"]],
    ["integrations-roadmap", ["integration", "mychart", "epic", "whoop", "oura", "apple"]],
    ["regulatory-posture", ["hipaa", "fda", "regulat", "compliance"]],
    ["team", ["team", "founders", "who is on"]],
    ["traction", ["traction", "waitlist", "early access", "signups"]],
    ["risks", ["risk", "what could go wrong", "what keeps you up"]],
  ];
  for (const [topic, kws] of hits) {
    if (kws.some((k) => q.includes(k))) return topic;
  }
  return null;
}
