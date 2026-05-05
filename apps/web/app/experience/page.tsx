/**
 * /experience
 *
 * The user-facing surface. NOT a debug screen, NOT a dashboard.
 *
 * One central system. Subtle modules. One interaction. States expressed
 * through motion, never through labels or text. Brand-strict, white-first,
 * mobile-first, calm.
 *
 * The orchestrator drives everything — mode, active modules, primary focus,
 * confidence — but the user never sees those words. They feel them.
 */

import { ExperienceSurface } from "./experience-surface";

export default function ExperiencePage() {
  return <ExperienceSurface />;
}
