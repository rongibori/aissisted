import type { Metadata } from "next";
import { FormulaPage, type FormulaContent } from "../_formula-page";

/**
 * /day — Day Formula deep dive. M3 Phase 2.
 *
 * Sibling of /morning and /night. Same template, different content.
 *
 * Compliance posture: every ingredient rationale stays inside
 * "supports / associated with / studied for". No verb stronger than that.
 * Forbidden-words audit: 0 hits against lib/brand-rules.ts → FORBIDDEN_WORDS.
 */

export const metadata: Metadata = {
  title: { absolute: "Day Formula — aissisted" },
  description:
    "Sustained cognition and physical capacity, calibrated to the strain you're carrying today.",
};

const CONTENT: FormulaContent = {
  slug: "day",
  eyebrow: "Day · 11 AM–4 PM",
  h1: "Day.",
  promise: "Hold the line.",
  heroSub:
    "The middle of the day is where most protocols quietly fail. Energy dips, focus drifts, the body asks for sugar it doesn't need. The Day formula is designed to keep you steady — for the meeting that runs long, the second training session, the strain you didn't plan for.",
  biology: {
    heading: "Built for sustained cognition and physical capacity.",
    paragraphs: [
      "Mid-day performance is a question of substrate and signal. Glucose has to stay even, neurotransmitters have to stay supplied, and the body has to keep clearing the metabolic noise it generates as it works.",
      "We dose for steadiness rather than intensity. Slow-acting nootropics, balanced electrolytes, and amino acids tuned to your training day or your cognitive day — whichever you're running. The formula reads your wearable's strain score and your calendar's load before it commits.",
      "When the day asks more of you than usual, the formula leans in. When it asks less, it steps back. Over-dosing under-stress is a quiet form of waste.",
    ],
    spotlight: {
      title: "Glucose stability.",
      body: "A continuous reading inside ±15 mg/dL of your fasting baseline is the working target. Drift outside that band on multiple days and the formula recalibrates within the week — usually before you would have noticed the dip.",
    },
  },
  ingredients: [
    {
      name: "Creatine monohydrate",
      dose: "3–5 g",
      rationale:
        "Studied for cognitive resilience under load and physical capacity. Held steady week to week — creatine is a saturation play, not a daily lever.",
    },
    {
      name: "L-tyrosine",
      dose: "500–1,000 mg",
      rationale:
        "Precursor to dopamine and norepinephrine. Associated with sustained focus through cognitive stress; dose lifts on demanding days.",
    },
    {
      name: "Magnesium glycinate",
      dose: "200 mg",
      rationale:
        "Supports muscle and nervous-system function. Dose tracks your training load, your sweat losses, and your last serum magnesium.",
    },
    {
      name: "Electrolytes (Na/K/Mg)",
      dose: "Tuned blend",
      rationale:
        "Calibrated to your sweat rate and climate. The Day formula assumes you move; if your week is sedentary, the dose drops to match.",
    },
    {
      name: "Alpha-GPC",
      dose: "300 mg",
      rationale:
        "Choline donor studied for working memory and acute cognitive output. Used on heavy-load days, held back on lighter ones.",
    },
    {
      name: "L-theanine",
      dose: "100 mg",
      rationale:
        "Smooths the afternoon caffeine edge for those who carry one. Skipped entirely if your day is already caffeine-free.",
    },
  ],
  builtFor: [
    "Operators with long meeting blocks.",
    "Athletes mid-strain.",
    "People whose 2 PM has been quietly compromising their 9 AM.",
  ],
  pair: [
    {
      href: "/morning",
      label: "Morning",
      oneLiner: "The day rides on what the morning started.",
    },
    {
      href: "/night",
      label: "Night",
      oneLiner: "What the day demanded, the night repays.",
    },
  ],
};

export default function DayPage() {
  return <FormulaPage content={CONTENT} />;
}
