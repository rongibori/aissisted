import type { Metadata } from "next";
import { FormulaPage, type FormulaContent } from "../_formula-page";

/**
 * /morning — Morning Formula deep dive. M3 Phase 2.
 *
 * Sibling of /day and /night — same section rhythm, same component
 * vocabulary, only the content varies. Structural ownership lives in
 * _formula-page.tsx; this file owns words and dosing only.
 *
 * Compliance posture: every ingredient rationale stays inside
 * "supports / associated with / studied for". No verb stronger than that.
 * Forbidden-words audit: 0 hits against lib/brand-rules.ts → FORBIDDEN_WORDS.
 */

export const metadata: Metadata = {
  title: { absolute: "Morning Formula — aissisted" },
  description:
    "The wake formula, refined to your circadian biology and last night's recovery.",
};

const CONTENT: FormulaContent = {
  slug: "morning",
  eyebrow: "Morning · 6–10 AM",
  h1: "Morning.",
  promise: "Wake into clarity.",
  heroSub:
    "The first hours decide the day. We lift you out of inertia gently, sharpen what's already there, and meet your body where it actually is — not where the protocol thinks it should be. Every dose answers to last night's sleep and this week's data.",
  biology: {
    heading: "Built for circadian wake biology.",
    paragraphs: [
      "The body emerges from sleep in a particular order. Cortisol rises before you do. Melatonin clears as light reaches the retina. Core temperature climbs, blood pressure follows, and the prefrontal cortex comes online last.",
      "A morning formula either respects that sequence or interferes with it. We dose for momentum without forcing it: caffeine paired against your afternoon slump, B-vitamins to help mitochondria turn over, adaptogens chosen for the cortisol curve we measured — not the one a textbook averaged.",
      "If your data says you're already wired by 7 AM, we pull back. If it says you're flat until 10, we lean in. The formula reads the morning before it touches it.",
    ],
    spotlight: {
      title: "Cortisol awakening response.",
      body: "A 50% rise within thirty minutes of waking is a healthy floor. Below that, the formula leans more activating. Above, it leans more anchoring. Either way, the dose answers to your curve, not an average.",
    },
  },
  ingredients: [
    {
      name: "Caffeine (anhydrous)",
      dose: "50–100 mg",
      rationale:
        "Calibrated to your tolerance and the strain you're carrying. Dosed low when sleep was thin, held back when HRV is suppressed, lifted when the day asks for it.",
    },
    {
      name: "L-theanine",
      dose: "100–200 mg",
      rationale:
        "Pairs with caffeine to soften the edge. Associated with smoother focus and a quieter sympathetic response in the morning hours.",
    },
    {
      name: "B-complex (methylated)",
      dose: "1× DRI",
      rationale:
        "Supports mitochondrial energy turnover. Methylated forms when MTHFR variants are flagged on your panel; standard forms when they aren't.",
    },
    {
      name: "Rhodiola rosea",
      dose: "200 mg",
      rationale:
        "Adaptogen studied for cognitive performance under stress. Dose adjusted to your weekly cortisol pattern and the load on your calendar.",
    },
    {
      name: "Vitamin D3 + K2",
      dose: "2,000 IU + 100 mcg",
      rationale:
        "Tuned to your last serum 25-OH-D reading. Skipped entirely when you're already inside the reference band.",
    },
    {
      name: "Tyrosine",
      dose: "300–500 mg",
      rationale:
        "Precursor to dopamine and norepinephrine. Studied for sustained focus through cognitive load; held back on quieter days.",
    },
  ],
  builtFor: [
    "Early risers chasing focus.",
    "Shift starters with thin sleep.",
    "Anyone whose afternoon currently steals the morning.",
  ],
  pair: [
    {
      href: "/day",
      label: "Day",
      oneLiner: "What the morning began, the day must hold.",
    },
    {
      href: "/night",
      label: "Night",
      oneLiner: "The morning is paid for the night before.",
    },
  ],
};

export default function MorningPage() {
  return <FormulaPage content={CONTENT} />;
}
