"use client";

/**
 * Aissisted — System Surface (aissisted-system.html)
 *
 * Public design system showcase. Brand Bible v1.1 canon.
 * Sections:
 *   01 — Foundations  (palette, type scale, spacing)
 *   02 — Dashboard    (Architecture A — phone-framed canonical surface)
 *   03 — Components   (cards, buttons, badges, dividers)
 *   04 — Motion       (entrance choreography, formula adaptation transition)
 *
 * Color budget held to 70/20/8/2  →  white · graphite · red · aqua.
 * Brand red (#EE2B37) reserved for identity, accents, and adaptation moments.
 */

import React, { useEffect, useState } from "react";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-8">
      <span className="font-system text-[11px] tracking-[0.24em] text-soft uppercase">
        {index}
      </span>
      <span className="font-system text-[11px] tracking-[0.24em] text-soft uppercase">
        ·
      </span>
      <span className="font-display text-[28px] font-bold tracking-[-0.025em] text-ink leading-[1.0]">
        {title}
      </span>
    </div>
  );
}

function Swatch({
  name,
  hex,
  token,
  inverted = false,
}: {
  name: string;
  hex: string;
  token: string;
  inverted?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div
        className="aspect-[4/3] rounded-md border border-line"
        style={{ background: hex }}
      />
      <div className="mt-2 flex flex-col gap-0.5">
        <span className="font-display text-sm font-semibold text-ink">{name}</span>
        <span className="font-system text-[10px] tracking-[0.06em] text-soft uppercase">
          {token}
        </span>
        <span className="font-system text-[10px] text-muted">{hex}</span>
      </div>
    </div>
  );
}

/** SwatchV2 — Brand Bible v1.2 ratio swap. White text on every fill (50/100/50). */
function SwatchV2({
  name,
  hex,
  ratio,
  emphasis = false,
}: {
  name: string;
  hex: string;
  ratio: string;
  emphasis?: boolean;
}) {
  // White fill is the only one needing graphite text (contrast). All others get white.
  const isWhite = hex.toUpperCase() === "#FFFFFF";
  const textColor = isWhite ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isWhite ? "#E5E5EA" : hex;
  return (
    <div
      className={`relative aspect-[3/4] rounded-md flex flex-col justify-between p-3 ${emphasis ? "ring-2 ring-brand ring-offset-2" : ""}`}
      style={{ background: hex, color: textColor, border: `1px solid ${borderColor}` }}
    >
      <span
        className="font-system text-[10px] tracking-[0.18em] uppercase"
        style={{ color: textColor, opacity: 0.85 }}
      >
        {ratio}
      </span>
      <div className="flex flex-col">
        <span className="font-display text-[15px] font-semibold leading-tight">{name}</span>
        <span
          className="font-system text-[10px] tracking-[0.06em] uppercase mt-0.5"
          style={{ color: textColor, opacity: 0.7 }}
        >
          {hex}
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 02 — Dashboard mockup (phone-framed)
// ────────────────────────────────────────────────────────────────────────────

function DashboardMockup() {
  // Stagger: pre 0ms · headline 200ms · subhead 720ms · cards 1100ms · formula 1400ms
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div
        className="relative w-[360px] rounded-[40px] border border-ink/10 shadow-[0_30px_60px_-30px_rgba(28,28,30,0.25),0_0_0_1px_rgba(28,28,30,0.04)] bg-surface overflow-hidden"
        style={{ aspectRatio: "9 / 19.5" }}
      >
        {/* Status bar */}
        <div className="h-11 px-7 flex items-center justify-between font-system text-[11px] tracking-[0.04em] text-ink">
          <span className="font-semibold">9:41</span>
          <div className="flex items-center gap-1.5">
            <span aria-hidden>•••</span>
            <span aria-hidden>◐</span>
            <span aria-hidden>▮▮▮</span>
          </div>
        </div>

        {/* Inner screen (anchor for absolute layers — confirmation surface lives here) */}
        <div className="relative flex flex-col h-[calc(100%-44px-72px)] px-6 pt-2 overflow-hidden">
          {/* Wordmark */}
          <div
            className={`transition-opacity duration-200 ease-out ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "0ms" }}
          >
            <span className="font-accent italic text-[26px] tracking-[-0.01em] text-ink leading-none">
              aissisted
            </span>
          </div>

          {/* Day + Greeting */}
          <div className="mt-6">
            <div
              className={`transition-opacity duration-300 ease-out ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              <span className="font-system text-[11px] tracking-[0.24em] text-soft uppercase">
                Tue · May 2
              </span>
            </div>
            <h1
              className={`font-display text-[40px] font-bold tracking-[-0.025em] leading-[1.0] text-ink mt-2 transition-all duration-500 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              Good morning,
              <br />
              Ron.
            </h1>
            <p
              className={`mt-3 font-accent italic text-[17px] leading-[1.4] text-ink/80 max-w-[240px] transition-opacity duration-700 ease-out ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: "720ms" }}
            >
              Recovery&rsquo;s up. We dialed your formula in overnight.
            </p>
          </div>

          {/* Today's read header */}
          <div
            className={`mt-7 mb-3 flex items-center justify-between transition-opacity duration-500 ease-out ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "1100ms" }}
          >
            <span className="font-system text-[11px] tracking-[0.24em] text-soft uppercase">
              Today&rsquo;s Read
            </span>
            <span className="font-system text-[11px] tracking-[0.06em] text-soft">
              06:42
            </span>
          </div>

          {/* Metric cards row */}
          <div
            className={`grid grid-cols-3 gap-2 transition-all duration-500 ease-out ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{ transitionDelay: "1100ms" }}
          >
            <MetricCard
              label="Recovery"
              value="78"
              delta="+12"
              deltaTone="ok"
            />
            <MetricCard
              label="Sleep"
              value="92"
              delta="7h 41"
              deltaTone="muted"
            />
            <MetricCard
              label="Strain"
              value="14"
              delta="low"
              deltaTone="warn"
            />
          </div>

          {/* Formula adaptation card */}
          <div
            className={`mt-5 transition-all duration-500 ease-out ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{ transitionDelay: "1400ms" }}
          >
            <FormulaCard />
          </div>

          {/* View link */}
          <div
            className={`mt-auto pb-2 transition-opacity duration-500 ease-out ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "1400ms" }}
          >
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-block font-system text-[11px] tracking-[0.06em] text-ink uppercase border-b border-ink/30 hover:border-ink transition-colors pb-0.5"
            >
              View today&rsquo;s read →
            </a>
          </div>
        </div>

        {/* Dock */}
        <div className="absolute bottom-0 left-0 right-0 h-[72px] border-t border-line bg-surface flex items-center justify-around px-6">
          <DockButton label="Today" active />
          <DockButton label="Stack" />
          <DockButton label="Jeffrey" badge />
          <DockButton label="Trends" />
        </div>
      </div>

      <p className="mt-4 font-system text-[10px] tracking-[0.06em] text-soft uppercase">
        02 · Dashboard — Architecture A
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  deltaTone,
}: {
  label: string;
  value: string;
  delta: string;
  deltaTone: "ok" | "muted" | "warn";
}) {
  const toneClass =
    deltaTone === "ok"
      ? "text-ok"
      : deltaTone === "warn"
      ? "text-warn"
      : "text-soft";
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 flex flex-col">
      <span className="font-system text-[10px] tracking-[0.18em] text-soft uppercase">
        {label}
      </span>
      <span className="mt-1 font-display text-[32px] font-bold tracking-[-0.03em] leading-[1.0] text-ink">
        {value}
      </span>
      <span className={`mt-1 font-system text-[10px] ${toneClass}`}>
        {delta}
      </span>
    </div>
  );
}

function FormulaCard() {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-system text-[10px] tracking-[0.18em] text-soft uppercase">
          Your Formula
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden />
          <span className="font-system text-[10px] tracking-[0.06em] text-muted uppercase">
            v3.2 · adapted today
          </span>
        </span>
      </div>
      <p className="font-display text-[18px] font-semibold tracking-[-0.015em] text-ink leading-[1.25]">
        Magnesium up <span className="text-brand">+40mg</span>. Rhodiola back
        in. Zinc holding.
      </p>
      <p className="mt-2 font-accent italic text-[13px] text-ink/70 leading-[1.4]">
        Your overnight HRV cleared the threshold for stack adaptation.
      </p>
    </div>
  );
}

function DockButton({
  label,
  active = false,
  badge = false,
}: {
  label: string;
  active?: boolean;
  badge?: boolean;
}) {
  return (
    <button
      className={`relative flex flex-col items-center gap-1 font-system text-[10px] tracking-[0.06em] uppercase ${
        active ? "text-ink" : "text-soft"
      } hover:text-ink transition-colors`}
    >
      <span
        className={`w-5 h-5 rounded-md ${
          active ? "bg-ink" : "bg-line"
        } transition-colors`}
        aria-hidden
      />
      <span>{label}</span>
      {badge && (
        <span
          className="absolute -top-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand"
          aria-hidden
        />
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 04 — Motion: post-submit confirmation surface (Journal Entry)
// ────────────────────────────────────────────────────────────────────────────

function JournalConfirmation() {
  const [active, setActive] = useState(false);
  return (
    <div className="relative w-[360px] aspect-[9/19.5] rounded-[40px] border border-ink/10 bg-surface overflow-hidden">
      {/* Status bar — fills below */}
      <div className="h-11 px-7 flex items-center justify-between font-system text-[11px] text-ink">
        <span className="font-semibold">9:41</span>
        <span aria-hidden>▮▮▮</span>
      </div>

      {/* Inner screen — absolute confirmation lives here */}
      <div className="relative h-[calc(100%-44px)] px-6">
        {/* Form (fades out when active) */}
        <div
          className={`absolute inset-0 px-6 pt-4 flex flex-col gap-4 transition-opacity duration-[240ms] ${
            active ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <span className="font-system text-[11px] tracking-[0.24em] text-soft uppercase">
            Today&rsquo;s Read
          </span>
          <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] leading-[1.05] text-ink">
            How did the morning land?
          </h2>
          <textarea
            placeholder="A line. A word. Whatever&rsquo;s honest."
            className="flex-1 w-full font-accent italic text-[15px] text-ink placeholder:text-soft bg-transparent resize-none focus:outline-none border-b border-line py-2"
          />
          <button
            onClick={() => setActive(true)}
            className="self-start font-system text-[11px] tracking-[0.18em] text-ink uppercase border-b border-ink/30 pb-0.5 hover:border-ink transition-colors"
          >
            Submit →
          </button>
        </div>

        {/* Confirmation (data-active='true' fades in 320ms after form fades) */}
        <div
          data-active={active ? "true" : "false"}
          className={`absolute top-[44px] inset-x-0 bottom-0 px-6 flex flex-col items-center justify-start text-center bg-surface transition-opacity duration-[320ms] ${
            active ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{ transitionDelay: active ? "240ms" : "0ms" }}
        >
          <span className="font-system text-[11px] tracking-[0.24em] text-ink/70 uppercase mt-12">
            Entry Logged
          </span>
          <h3 className="font-display text-[40px] font-bold tracking-[-0.025em] leading-[1.0] text-ink mt-6">
            Got it.
          </h3>
          <p className="font-accent italic text-[17px] text-ink/80 leading-[1.4] mt-6 max-w-[240px]">
            I&rsquo;ll fold this into today&rsquo;s read.
          </p>
          <span className="mt-14 font-system text-[11px] tracking-[0.06em] text-soft">
            06:42 → 09:41
          </span>
          <button
            onClick={() => setActive(false)}
            className="mt-20 font-system text-[11px] tracking-[0.06em] text-ink uppercase border-b border-ink/30 pb-0.5 hover:border-ink transition-colors"
          >
            View today&rsquo;s read →
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function SystemPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* Top bar */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-accent italic text-[22px] tracking-[-0.01em] text-ink leading-none">
              aissisted
            </span>
            <span className="font-system text-[10px] tracking-[0.24em] text-soft uppercase">
              · System
            </span>
          </div>
          <div className="font-system text-[10px] tracking-[0.18em] text-soft uppercase">
            Brand Bible v1.1
          </div>
        </div>
      </header>

      {/* Hero — Rally cry */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-8 py-24">
          <span className="font-system text-[11px] tracking-[0.24em] text-soft uppercase">
            00 · Rally Cry
          </span>
          <h1 className="rally-cry mt-6 text-[clamp(48px,8vw,112px)] text-ink">
            Your Body. Understood.
          </h1>
          <p className="mt-6 font-accent italic text-[20px] text-ink/70 max-w-[520px] leading-[1.4]">
            A voice-led, data-driven supplement system. Personalization is the
            product. The formula adapts. The system listens.
          </p>
        </div>
      </section>

      {/* 01 — Foundations */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <SectionLabel index="01" title="Foundations" />

          {/* Color — updated ratio: 70 / 8 / 4 / 15 / 2 / 1 (Signal Red bumped to 15%) */}
          <div className="mb-14">
            <h3 className="font-system text-[11px] tracking-[0.24em] text-soft uppercase mb-4">
              Color · 70 White · 8 Graphite · 4 Soft · 15 Signal · 2 Aqua · 1 Midnight
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
              <SwatchV2 name="Pure White"     hex="#FFFFFF" ratio="70%" />
              <SwatchV2 name="Graphite"       hex="#1C1C1E" ratio="8%"  />
              <SwatchV2 name="Soft Graphite"  hex="#2E2E2E" ratio="4%"  />
              <SwatchV2 name="Signal Red"     hex="#EE2B37" ratio="15%" emphasis />
              <SwatchV2 name="Aqua"           hex="#00C2D1" ratio="2%"  />
              <SwatchV2 name="Midnight"       hex="#0B1D3A" ratio="1%"  />
            </div>
            <p className="mt-4 font-system text-[12px] text-muted max-w-[680px] leading-[1.5]">
              White carries the surface. Graphite carries structure. <span className="text-brand">Signal Red carries identity, action, and adaptation</span> — now the third dominant. Aqua belongs to Jeffrey&rsquo;s voice. Midnight grounds the dark moments. Held to the budget; never decoration.
            </p>
          </div>

          {/* Type */}
          <div>
            <h3 className="font-system text-[11px] tracking-[0.24em] text-soft uppercase mb-4">
              Typography
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-line pt-8">
              <div>
                <span className="font-system text-[10px] tracking-[0.18em] text-soft uppercase">
                  Display · Briston Bold
                </span>
                <p className="font-display text-[44px] font-bold tracking-[-0.025em] leading-[1.0] text-ink mt-3">
                  Got it.
                </p>
                <p className="mt-2 font-system text-[11px] text-muted">
                  Headlines · key brand moments. Tight tracking, period-led.
                </p>
              </div>
              <div>
                <span className="font-system text-[10px] tracking-[0.18em] text-soft uppercase">
                  System · Plex Mono
                </span>
                <p className="font-system text-[14px] tracking-[0.06em] text-ink mt-3 leading-[1.5]">
                  ENTRY LOGGED &nbsp;·&nbsp; 06:42 &nbsp;·&nbsp; v3.2
                </p>
                <p className="mt-2 font-system text-[11px] text-muted">
                  Data, intervals, system pre-headlines. Wide tracking,
                  uppercase.
                </p>
              </div>
              <div>
                <span className="font-system text-[10px] tracking-[0.18em] text-soft uppercase">
                  Accent · Libre Baskerville
                </span>
                <p className="font-accent italic text-[19px] text-ink/80 mt-3 leading-[1.4]">
                  &ldquo;I&rsquo;ll fold this into today&rsquo;s read.&rdquo;
                </p>
                <p className="mt-2 font-system text-[11px] text-muted">
                  One Baskerville moment per surface. Emotional, never
                  decorative.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — Dashboard */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <SectionLabel index="02" title="Dashboard" />
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-16 items-start">
            <DashboardMockup />
            <div className="max-w-md">
              <h3 className="font-display text-[24px] font-bold tracking-[-0.02em] text-ink leading-[1.1]">
                The morning surface.
              </h3>
              <p className="mt-4 font-accent italic text-[17px] text-ink/80 leading-[1.45]">
                One screen, one read. Three lines of biometric truth, then the
                formula response. Everything else is one tap away.
              </p>
              <div className="mt-8 flex flex-col gap-3 font-system text-[12px] text-muted leading-[1.55]">
                <Spec label="Wordmark" body="aissisted · Baskerville italic 26px · 0ms" />
                <Spec label="Date" body="Plex Mono 11px / 0.24em · graphite-soft" />
                <Spec label="Greeting" body="Briston Bold 40px / -0.025em / 1.0 · 200ms fade-up" />
                <Spec label="Read line" body="Baskerville italic 17px / max-w 240px · 720ms" />
                <Spec label="Cards" body="3-up grid · Plex labels · Briston values · 1100ms" />
                <Spec label="Formula" body="Surface-2 card · accent dot · v3.2 microcopy · 1400ms" />
                <Spec label="View link" body="Plex Mono 11px · 1px graphite-30% underline · click → journal:view-analytics" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Components */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <SectionLabel index="03" title="Components" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ComponentCard title="Primary action">
              <button className="font-system text-[11px] tracking-[0.18em] uppercase bg-ink text-surface px-5 py-3 rounded-md hover:bg-ink/90 transition-colors">
                Generate formula
              </button>
              <button className="font-system text-[11px] tracking-[0.18em] uppercase bg-brand text-surface px-5 py-3 rounded-md hover:bg-[var(--accent-hover)] transition-colors">
                Adapt now
              </button>
            </ComponentCard>

            <ComponentCard title="Secondary / link">
              <button className="font-system text-[11px] tracking-[0.18em] uppercase border border-line text-ink px-5 py-3 rounded-md hover:border-ink transition-colors">
                View stack
              </button>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="font-system text-[11px] tracking-[0.06em] text-ink uppercase border-b border-ink/30 hover:border-ink pb-0.5 transition-colors"
              >
                View today&rsquo;s read →
              </a>
            </ComponentCard>

            <ComponentCard title="Metric pill">
              <div className="rounded-2xl border border-line bg-surface p-3 w-32">
                <span className="font-system text-[10px] tracking-[0.18em] text-soft uppercase">
                  Recovery
                </span>
                <div className="font-display text-[32px] font-bold tracking-[-0.03em] leading-none text-ink mt-1">
                  78
                </div>
                <span className="font-system text-[10px] text-ok">+12</span>
              </div>
            </ComponentCard>

            <ComponentCard title="Adaptation badge">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-2 border border-line">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                <span className="font-system text-[10px] tracking-[0.06em] text-muted uppercase">
                  v3.2 · adapted today
                </span>
              </span>
            </ComponentCard>
          </div>
        </div>
      </section>

      {/* 04 — Motion */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <SectionLabel index="04" title="Motion" />
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-16 items-start">
            <JournalConfirmation />
            <div className="max-w-md">
              <h3 className="font-display text-[24px] font-bold tracking-[-0.02em] text-ink leading-[1.1]">
                Fade, never dismiss.
              </h3>
              <p className="mt-4 font-accent italic text-[17px] text-ink/80 leading-[1.45]">
                The system never auto-dismisses confirmations. No icons. No
                checkmarks. The next moment arrives because the user moved
                toward it.
              </p>
              <div className="mt-8 flex flex-col gap-3 font-system text-[12px] text-muted leading-[1.55]">
                <Spec label="Form fade" body=".je-form-fading · 240ms · ease-out" />
                <Spec label="Confirmation in" body="data-active='true' · 320ms · 240ms delay" />
                <Spec label="Stagger" body="pre 0ms · headline 200ms · accent 700ms · interval 1100ms · link 1400ms" />
                <Spec label="Dismissal" body="user-driven only — no timeout, no auto-close" />
              </div>
              <p className="mt-8 font-system text-[11px] tracking-[0.06em] text-soft uppercase">
                Try it →
              </p>
              <p className="mt-1 font-system text-[12px] text-muted">
                Tap <span className="text-ink">Submit</span> in the mockup, then{" "}
                <span className="text-ink">View today&rsquo;s read</span> to
                replay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-8 py-10 flex items-center justify-between">
          <span className="font-system text-[10px] tracking-[0.18em] text-soft uppercase">
            Aissisted · Your Body. Understood.
          </span>
          <span className="font-system text-[10px] tracking-[0.06em] text-soft">
            apps/web/app/system · canonical clone
          </span>
        </div>
      </footer>
    </div>
  );
}

function Spec({ label, body }: { label: string; body: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4">
      <span className="text-ink uppercase tracking-[0.06em]">{label}</span>
      <span>{body}</span>
    </div>
  );
}

function ComponentCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-6">
      <span className="font-system text-[10px] tracking-[0.24em] text-soft uppercase">
        {title}
      </span>
      <div className="mt-5 flex items-center gap-3 flex-wrap">{children}</div>
    </div>
  );
}
