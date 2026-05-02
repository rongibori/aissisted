"use client";

import React from "react";
import { CoverSurface } from "../../components/onboarding/CoverSurface";
import { PhoneFrame } from "../../components/patterns/PhoneFrame";
import "./animations.css";

/*
 * Onboarding — Surface 1 (Cover).
 *
 * Per cowork-briefs/onboarding-cover.md, this is the first surface of the
 * 9-surface flow. Subsequent surfaces (Jeffrey intro, Identity, Data, etc.)
 * land in subsequent briefs; the flow controller will move to a useReducer
 * hook in apps/web/app/onboarding/hooks/useOnboardingFlow.ts at that point.
 *
 * TODO(onboarding-flow): wire onAdvance to a flow-state reducer that swaps
 *   to Surface 2. Until then it's a no-op.
 * TODO(onboarding-auth): the cover surface is pre-authentication; auth gating
 *   should attach to the surfaces that capture identity (Surface 3+).
 */

export default function OnboardingPage() {
  const handleAdvance = (): void => {
    // Stub — see TODO(onboarding-flow) above.
  };

  return (
    <PhoneFrame>
      {/* CoverSurface handles its own StatusBar visibility internally
          (hidden on mobile via md:flex hidden, visible at md+).
          PhoneFrame already renders children twice (once per viewport
          variant); duplicating here would render 4× in DOM. */}
      <CoverSurface onAdvance={handleAdvance} showStatusBar />
    </PhoneFrame>
  );
}
