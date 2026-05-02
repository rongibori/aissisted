"use client";

import React from "react";
import Image from "next/image";
import { StatusBar } from "../patterns/StatusBar";
import { PillCTA } from "../ui/PillCTA";

/*
 * CoverSurface — Surface 1 of onboarding.
 *
 * Composition per cowork-briefs/onboarding-cover.md §2.
 * Vertical rhythm per design spec §4.3 — 88px wordmark→prelabel,
 * 32px prelabel→headline, 64px headline→accent. This rhythm is the brand
 * signature.
 *
 * Stagger via app/onboarding/animations.css. No framer-motion.
 *
 * Wordmark is the canonical aissisted logotype SVG at
 * /brand/Aissisted-logo-H.svg — graphite-on-white variant. The SVG holds
 * the custom letterforms (path data, not text). Same asset as nav.tsx.
 *
 * Mobile: full-viewport, no status bar (browser/native chrome).
 * Tablet+: rendered inside PhoneFrame; StatusBar is part of the chrome.
 */

interface CoverSurfaceProps {
  onAdvance?: () => void;
  showStatusBar?: boolean;
}

export function CoverSurface({
  onAdvance,
  showStatusBar = false,
}: CoverSurfaceProps) {
  return (
    <div className="flex h-full min-h-[100dvh] md:min-h-0 w-full flex-col bg-surface">
      {/* StatusBar visible only at md+ (desktop phone-frame chrome).
          On mobile the browser/native chrome supplies the status row. */}
      {showStatusBar ? (
        <div className="hidden md:block">
          <StatusBar />
        </div>
      ) : null}

      {/* Top section — wordmark, pre-label, headline, accent. */}
      <div className="flex flex-col items-center px-8 pt-14 md:pt-[56px]">
        {/* Wordmark — canonical SVG logotype. */}
        <div className="stagger-base stagger-wordmark">
          <Image
            src="/brand/Aissisted-logo-H.svg"
            alt="aissisted"
            width={160}
            height={30}
            priority
          />
        </div>

        {/* 88px gap → pre-label. */}
        <p
          className="stagger-base stagger-prelabel mt-[88px] font-system uppercase text-soft text-[11px] tracking-[0.18em] text-center"
        >
          EST. 2026 · PERSONALIZED INTELLIGENCE
        </p>

        {/* 32px gap → headline stack. */}
        <h2
          className="mt-8 font-display font-bold text-[56px] leading-[0.92] tracking-[-0.025em] text-center"
        >
          <span className="stagger-base stagger-headline-1 block text-ink">
            Your Body.
          </span>
          <span className="stagger-base stagger-headline-2 block text-brand">
            Understood.
          </span>
        </h2>

        {/* 64px gap → Baskerville accent. */}
        <div
          className="stagger-base stagger-accent mt-16 font-accent italic text-soft text-[17px] leading-[1.45] text-center"
        >
          <p>Built from your data.</p>
          <p>Designed for your life.</p>
        </div>
      </div>

      {/* Spacer pushes CTA to the bottom anchor. */}
      <div className="flex-1" />

      {/* CTA + footer micro — 80px from bottom anchor (px-8 + pb-20). */}
      <div className="px-8 pb-20">
        <div className="stagger-base stagger-cta">
          <PillCTA onClick={onAdvance}>Begin</PillCTA>
        </div>
        <p
          className="stagger-base stagger-footer mt-6 font-system text-soft text-[11px] tracking-[0.06em] text-center"
        >
          ~ 4 min · interrupted anytime
        </p>
      </div>
    </div>
  );
}
