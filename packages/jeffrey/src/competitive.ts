/**
 * Competitive positioning.
 *
 * Jeffrey's reference model for how Aissisted compares to adjacent
 * categories. The comparables live in `data/competitors.ts`; this module
 * exposes the narrative posture and the quick-lookup helpers.
 *
 * Rule of thumb: never attack a competitor. Name the category, name the
 * shape of the difference, move on.
 */

import { competitors, type CompetitorId } from "./data/competitors.js";
import type { JeffreySurface, JeffreyToneMode } from "./types.js";

export const competitiveSurface = {
  surface: "investor" as JeffreySurface, // shares investor tone
  tone: "strategy" as JeffreyToneMode,
  temperature: 0.25,
  maxTokens: 550,
} as const;

/**
 * The three shapes most competitors fall into. Jeffrey uses these to frame
 * comparisons quickly without a catalogue.
 */
export const competitorShapes = {
  "catalog-with-quiz":
    "A catalogue of products with a quiz that narrows the list. No lab inputs, no adaptation, no ongoing signal.",
  "subscription-telehealth":
    "Telehealth-gated subscriptions with a small SKU set. Often opinionated, rarely adaptive.",
  "d2c-personalized-cpg":
    "Direct-to-consumer personalised consumer-packaged-goods. Personalisation stops after sign-up.",
  "closed-loop-health":
    "Closed-loop health platform combining labs, wearables, and continuous adaptation. This is Aissisted.",
} as const;

export type CompetitorShape = keyof typeof competitorShapes;

/**
 * The short difference statement Jeffrey uses when a competitor is raised.
 * Crisp, not dismissive.
 */
export function differenceAgainst(id: CompetitorId): string {
  const c = competitors[id];
  if (!c) return "";
  return `${c.name} is a ${c.shape}. Aissisted is a ${competitorShapes["closed-loop-health"]}`;
}

export function listKnownCompetitors(): CompetitorId[] {
  return Object.keys(competitors) as CompetitorId[];
}
