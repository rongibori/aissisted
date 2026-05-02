"use client";

import React, { useState } from "react";
import { CoverSurface } from "../../components/onboarding/CoverSurface";
import { JeffreyIntroSurface } from "../../components/onboarding/JeffreyIntroSurface";
import { PhoneFrame } from "../../components/patterns/PhoneFrame";
import "./animations.css";

/*
 * Onboarding — Surfaces 1 (Cover) + 2 (Jeffrey introduction).
 *
 * Per cowork-briefs/onboarding-cover.md and cowork-briefs/jeffrey-intro.md.
 * Surfaces 3-9 land via subsequent briefs; the placeholder below renders
 * for any future-step transition until those briefs ship.
 *
 * State controller: minimal useState<OnboardingStep> machine. Captures
 * voicePreference at the Jeffrey intro surface. Will migrate to a
 * useReducer hook (apps/web/app/onboarding/hooks/useOnboardingFlow.ts)
 * once Surface 3 (Identity + Goals) lands and we begin capturing real
 * user data.
 *
 * TODO(onboarding-flow): replace OnboardingStep + voicePreference state
 *   with a reducer once Surface 3 ships. The reducer will hold the
 *   accumulating onboarding payload (identity, goals, connections,
 *   labFile, baseline, protocol).
 * TODO(onboarding-auth): cover + jeffrey-intro are pre-authentication;
 *   auth gating attaches at Surface 3 (Identity capture).
 */

type OnboardingStep = "cover" | "jeffrey-intro" | "identity-goals";
type VoicePreference = "continue" | "skipped";

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("cover");
  const [voicePreference, setVoicePreference] = useState<VoicePreference | null>(
    null,
  );

  const handleAdvanceFromCover = (): void => {
    setStep("jeffrey-intro");
  };

  const handleContinueFromJeffrey = (): void => {
    if (voicePreference === null) setVoicePreference("continue");
    setStep("identity-goals");
  };

  const handleSkipVoice = (): void => {
    setVoicePreference("skipped");
    setStep("identity-goals");
  };

  return (
    <PhoneFrame>
      {step === "cover" && (
        <CoverSurface onAdvance={handleAdvanceFromCover} showStatusBar />
      )}
      {step === "jeffrey-intro" && (
        <JeffreyIntroSurface
          onAdvance={handleContinueFromJeffrey}
          onSkipVoice={handleSkipVoice}
          showStatusBar
        />
      )}
      {step === "identity-goals" && (
        <div className="flex h-full min-h-[100dvh] md:min-h-0 w-full items-center justify-center bg-surface px-8">
          <div className="max-w-[280px] text-center">
            <p className="font-system text-[11px] uppercase tracking-[0.18em] text-soft">
              STEP 02 / 06 · IDENTITY
            </p>
            <p className="mt-4 font-display text-[20px] text-ink">
              Surface 3 lands in the next brief.
            </p>
            <p className="mt-2 font-system text-[12px] text-soft">
              Voice preference captured: {voicePreference ?? "—"}
            </p>
          </div>
        </div>
      )}
    </PhoneFrame>
  );
}
