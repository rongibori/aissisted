import type { Metadata } from "next";
import { FormulaPage, type FormulaContent } from "../_formula-page";

/**
 * /night — Night Formula deep dive. M3 Phase 2.
 *
 * Sibling of /morning and /day. Same template, different content.
 *
 * Compliance posture: every ingredient rationale stays inside
 * "supports / associated with / studied for". No verb stronger than that.
 * Forbidden-words audit: 0 hits against lib/brand-rules.ts → FORBIDDEN_WORDS.
 */

export const metadata: Metadata = {
  title: { absolute: "Night Formula — aissisted" },
  description:
    "Repair the day. Prepare the next. Built from your data, refined every night.",
};

const CONTENT: FormulaContent = {
  slug: "night",
  eyebrow: "Night · 9 PM–11 PM",
  h1: "Night.",
  promise: "Repair what the day spent.",
  heroSub:
    "Sleep is where the work of the day is actually banked. Repair, consolidation, hormonal reset — none of it happens if you slip into shallow sleep and never sink. The Night formula is designed to ease the descent and protect the depth.",
  biology: {
    heading: "Built for overnight recovery.",
    paragraphs: [
      "The parasympathetic system has to take over before sleep is worth anything. Heart rate has to fall, core temperature has to drop, cortisol has to clear, and the brain has to dim its own arousal. Most people miss one of those steps and pay for it the next morning.",
      "We dose for the descent first, then for the depth. Magnesium and glycine to soften the autonomic switch. Selective amino acids for sleep architecture. Carefully chosen botanicals only when your data argues for them — never by default.",
      "Sleep latency, time in deep, and morning HRV are the scoreboard. If any of those drift, the formula moves before you have to ask.",
    ],
    spotlight: {
      title: "Morning HRV.",
      body: "Your personal band, established over four weeks of baseline readings. The formula's success is measured here, not by how the night felt in the moment. Felt-sense is a useful signal; data is the verdict.",
    },
  },
  ingredients: [
    {
      name: "Magnesium glycinate",
      dose: "200–400 mg",
      rationale:
        "Supports parasympathetic tone and sleep onset. Dose tuned to your training day, your sweat losses, and your last serum reading.",
    },
    {
      name: "Glycine",
      dose: "3 g",
      rationale:
        "Studied for core-temperature drop and sleep depth. Held back if you already run cool at night or your sleep latency is already short.",
    },
    {
      name: "L-theanine",
      dose: "200 mg",
      rationale:
        "Associated with calmer pre-sleep arousal. Useful on high-cortisol days, skipped when your evening is already quiet.",
    },
    {
      name: "Apigenin",
      dose: "50 mg",
      rationale:
        "Studied for GABAergic activity. Used selectively, not as a default — your data argues for it or it's out of the formula that week.",
    },
    {
      name: "Zinc + Boron",
      dose: "Micro-dose",
      rationale:
        "Supports endocrine recovery overnight. Skipped if your panel already places you inside the reference band.",
    },
    {
      name: "Tart cherry (Montmorency)",
      dose: "500 mg",
      rationale:
        "Studied for natural melatonin support and inflammatory clearance after high-strain days. Held back on quiet weeks.",
    },
  ],
  builtFor: [
    "People who keep waking at 3 AM.",
    "Athletes whose deep sleep is the bottleneck.",
    "Quiet sleepers whose mornings still feel borrowed.",
  ],
  pair: [
    {
      href: "/morning",
      label: "Morning",
      oneLiner: "The morning is built the night before.",
    },
    {
      href: "/day",
      label: "Day",
      oneLiner: "Tomorrow's day is paid for tonight.",
    },
  ],
};

export default function NightPage() {
  return <FormulaPage content={CONTENT} />;
}
