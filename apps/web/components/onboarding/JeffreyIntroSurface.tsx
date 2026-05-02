"use client";

import React from "react";
import { StatusBar } from "../patterns/StatusBar";
import { JeffreyAvatar } from "../ui/JeffreyAvatar";
import { PreLabel } from "../ui/PreLabel";
import { CodeComment } from "../ui/CodeComment";
import { PillCTA } from "../ui/PillCTA";
import { TextLink } from "../ui/TextLink";

/*
 * JeffreyIntroSurface — Surface 2 of onboarding.
 *
 * Composition per cowork-briefs/jeffrey-intro.md §2.
 * Vertical rhythm per design spec §4.3 — 56px breathing pre-label → avatar,
 * 56px avatar → headline, 32px headline → code-comment.
 *
 * Stagger via app/onboarding/animations.css. Surface 2 introduces the
 * jeffrey-avatar-glow keyframe alongside the pre-existing cover-fade-in
 * and cover-fade-up.
 *
 * Mobile: full-viewport, no status bar (browser/native chrome).
 * Tablet+: rendered inside PhoneFrame; StatusBar is part of the chrome.
 *
 * Canonical voice copy (do not paraphrase):
 *   "I'm Jeffrey. / I learn you, then / I get out of the / way."
 *   // listens. answers. adapts.
 *   // never replaces a clinician.
 */

interface JeffreyIntroSurfaceProps {
  onAdvance?: () => void;
  onSkipVoice?: () => void;
  showStatusBar?: boolean;
}

export function JeffreyIntroSurface({
  onAdvance,
  onSkipVoice,
  showStatusBar = false,
}: JeffreyIntroSurfaceProps) {
  return (
    <div className="flex h-full min-h-[100dvh] md:min-h-0 w-full flex-col bg-surface">
      {showStatusBar ? (
        <div className="hidden md:block">
          <StatusBar />
        </div>
      ) : null}

      {/* Top section — pre-label, avatar block, headline, code-comment. */}
      <div className="flex flex-col items-center px-6 pt-14 md:pt-[56px]">
        {/* Pre-headline label (Aqua, with leading bullet). */}
        <div className="stagger-base stagger-jeffrey-prelabel">
          <PreLabel variant="aqua" bullet>
            VOICE COMPANION · V1.2
          </PreLabel>
        </div>

        {/* 40px gap → avatar + label block. */}
        <div className="stagger-base stagger-jeffrey-avatar mt-10 flex items-center gap-4">
          <JeffreyAvatar size="lg" />
          <div className="flex flex-col leading-tight">
            <span className="font-system text-[13px] font-medium uppercase tracking-[0.18em] text-ink">
              JEFFREY
            </span>
            <span className="font-system text-[12px] italic text-soft">
              · speaking
            </span>
          </div>
        </div>

        {/* 56px gap → quoted headline. */}
        <h2
          className="stagger-base stagger-jeffrey-headline mt-14 max-w-[296px] text-center font-display font-bold text-[32px] leading-[1.15] tracking-[-0.02em] text-ink whitespace-pre-line"
        >
          {`“I’m Jeffrey.\nI learn you, then\nI get out of the\nway.”`}
        </h2>

        {/* 32px gap → code-comment subline. Aligned to surface content
            edge (px-8 inside the px-6 wrapper widens slightly so the
            left-aligned comments breathe). */}
        <div className="stagger-base stagger-jeffrey-code mt-8 self-stretch px-2">
          <CodeComment
            lines={[
              "listens. answers. adapts.",
              "never replaces a clinician.",
            ]}
          />
        </div>
      </div>

      {/* Spacer pushes controls to the bottom anchor. */}
      <div className="flex-1" />

      {/* Control bar — Skip voice (text link, left) + Continue pill (flex 1). */}
      <div className="stagger-base stagger-jeffrey-controls px-6 pb-14">
        <div className="flex items-center gap-4">
          <TextLink onClick={onSkipVoice} aria-label="Skip voice introduction">
            Skip voice
          </TextLink>
          <div className="flex-1">
            <PillCTA onClick={onAdvance}>Continue →</PillCTA>
          </div>
        </div>
      </div>
    </div>
  );
}
