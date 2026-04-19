/**
 * Onboarding surface.
 *
 * Jeffrey as the guide through Aissisted's onboarding — connecting data
 * sources, building the first profile, producing the first adaptive formula.
 *
 * Tone is direct, simple, actionable. "Press. Mix. Go." not a lecture.
 */

import { integrations } from "./data/integrations.js";
import type { JeffreySurface, JeffreyToneMode } from "./types.js";

export const onboardingSurface = {
  surface: "onboarding" as JeffreySurface,
  tone: "product" as JeffreyToneMode,
  temperature: 0.3,
  maxTokens: 500,
} as const;

/**
 * The canonical order of onboarding steps. The UI drives navigation; Jeffrey
 * narrates and adapts language to where the person is in the flow.
 */
export const onboardingSteps = [
  {
    id: "welcome",
    title: "Welcome",
    goal: "Tell them what's about to happen — short, confident, no preamble.",
  },
  {
    id: "intent",
    title: "What you want",
    goal: "Surface the top 1–2 priorities (sleep, energy, recovery, focus).",
  },
  {
    id: "connect-mychart",
    title: "MyChart",
    goal: "Pull labs + history via SMART on FHIR. Explain the value in one sentence.",
  },
  {
    id: "connect-wearables",
    title: "Wearables",
    goal: "Connect WHOOP / Apple Watch / Oura. Any one is enough to start.",
  },
  {
    id: "connect-labs-upload",
    title: "Lab uploads",
    goal: "Fallback path if MyChart isn't connected. Accept PDFs + photos.",
  },
  {
    id: "first-formula",
    title: "Your first formula",
    goal: "Explain the first recommendation in plain terms. Name the why.",
  },
  {
    id: "confirm",
    title: "Ship it",
    goal: "Single clear action. No decisions.",
  },
] as const;

export type OnboardingStepId = (typeof onboardingSteps)[number]["id"];

export function getOnboardingStep(id: OnboardingStepId) {
  const step = onboardingSteps.find((s) => s.id === id);
  if (!step) throw new Error(`Unknown onboarding step: ${id}`);
  return step;
}

/**
 * Integration-specific narration prompt. The UI renders the button; Jeffrey
 * speaks the one sentence that explains why the person is tapping it.
 */
export function integrationNarration(
  source: keyof typeof integrations,
): string {
  return integrations[source].narration;
}
