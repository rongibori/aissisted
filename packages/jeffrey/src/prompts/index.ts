/**
 * Prompt barrel.
 *
 * The canonical Jeffrey system prompt lives in `../system-prompt.md` so it
 * can be edited as prose. We load it via Node fs at module init — this is a
 * server-only package, so that is acceptable.
 *
 * Surface-specific overlays (investor/onboarding/health/competitive) are
 * short additions to the canonical prompt; they are co-located here.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function loadPrompt(relativeFromPromptsDir: string): string {
  // Resolve against the package's `src` directory so layout stays obvious.
  return readFileSync(resolve(here, relativeFromPromptsDir), "utf8");
}

export const systemPrompt = loadPrompt("../system-prompt.md");

export const investorOverlay = loadPrompt("./investor.md");
export const onboardingOverlay = loadPrompt("./onboarding.md");
export const healthOverlay = loadPrompt("./health.md");
export const competitiveOverlay = loadPrompt("./competitive.md");

export const overlays = {
  investor: investorOverlay,
  onboarding: onboardingOverlay,
  "product-walkthrough": onboardingOverlay,
  health: healthOverlay,
  brand: "", // brand surface relies on the canonical prompt alone
  concierge: onboardingOverlay,
} as const;
