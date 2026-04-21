"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { UILabel, JeffreySystem } from "@/components/typography";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * FounderVideo — billionaire-grade cinematic founder surface.
 *
 * Three states, three grades:
 *   · VIDEO_URL set            · 16:9 player, poster, controls, letterbox ring
 *   · CAL_URL set, no video    · designed placeholder with direct book-a-call
 *   · neither set              · honest "in production" placeholder
 *
 * The placeholder is not a broken player — it's a designed surface. Subtle
 * scanning chevron line, timecode chip (00:00 · 00:90), brand hairline grid,
 * and a data-aqua heartbeat dot that matches LiveMetrics. The poster frame
 * sits in a black canvas with a 1px ring and an oversized drop shadow so it
 * reads like a mastered cinema frame, not a browser <video> box.
 *
 * Sits between the hero and Chapter 01 · Thesis. Midnight tone.
 */

const VIDEO_URL = process.env.NEXT_PUBLIC_FOUNDER_VIDEO_URL ?? "";
const POSTER_URL = process.env.NEXT_PUBLIC_FOUNDER_VIDEO_POSTER ?? "";
const CAL_URL = process.env.NEXT_PUBLIC_FOUNDER_CALENDAR_URL ?? "";
const CAL_LABEL = process.env.NEXT_PUBLIC_FOUNDER_CALENDAR_LABEL ?? "Book time with the founder";

export function FounderVideo() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setSeen(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section className="bg-[color:var(--brand-midnight)] text-white py-20 md:py-32 relative overflow-hidden">
      {/* Subtle radial vignette so the frame reads as a theater */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_40%,rgba(0,194,209,0.06),transparent_70%)]"
      />
      <Container width="wide">
        <div
          ref={ref}
          className="grid gap-12 lg:grid-cols-[20rem_1fr] items-start relative"
        >
          <div
            className={cn(
              "transition-all duration-[800ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
            )}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
              <UILabel className="text-data">From the founder · on camera</UILabel>
            </div>
            <h2 className="mt-6 font-display font-bold text-white text-[clamp(1.75rem,3.4vw,2.75rem)] leading-[1.05] tracking-[-0.02em]">
              Ninety seconds.
              <br />
              <span className="text-white/55">One take.</span>
              <br />
              <span className="text-white/40">No script.</span>
            </h2>
            <p className="mt-6 font-body text-[15px] md:text-[16px] leading-[1.55] text-white/70 max-w-sm">
              Why this company. Why this founder. Why now. Recorded cold, uncut,
              no voice-over, no b-roll. The same read that closed the first
              strategic cheques.
            </p>
            <JeffreySystem className="mt-6 block text-white/45">
              No teleprompter · no edit · no marketing gloss
            </JeffreySystem>

            {CAL_URL && !VIDEO_URL ? (
              <a
                href={CAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-8 inline-flex items-center h-11 px-5",
                  "bg-data text-[color:var(--brand-midnight)]",
                  "font-system text-[11px] font-semibold uppercase tracking-[0.16em]",
                  "hover:brightness-110 transition-[filter,transform]",
                  "hover:-translate-y-[1px]",
                )}
              >
                {CAL_LABEL} →
              </a>
            ) : null}
          </div>

          <div
            className={cn(
              "relative w-full transition-all duration-[1100ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
            style={{ transitionDelay: "220ms" }}
          >
            {/* Corner ticks — cinema framing marks */}
            <CornerTicks />

            <div
              className={cn(
                "relative w-full aspect-video bg-black",
                "ring-1 ring-white/[0.08]",
                "shadow-[0_60px_160px_-40px_rgba(0,0,0,0.85)]",
              )}
            >
              {VIDEO_URL ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={POSTER_URL || undefined}
                  className="h-full w-full object-cover"
                >
                  <source src={VIDEO_URL} />
                  Your browser does not support inline video. Open the founder
                  video here: <a href={VIDEO_URL}>{VIDEO_URL}</a>
                </video>
              ) : (
                <PlaceholderFrame />
              )}
            </div>

            {/* Timecode strip */}
            <div className="mt-4 flex items-center justify-between gap-6">
              <JeffreySystem className="text-white/40">
                TC · 00:00 → 01:30 · one take · no edit
              </JeffreySystem>
              <JeffreySystem className="text-white/40 hidden md:block">
                Filed · private · investors only
              </JeffreySystem>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PlaceholderFrame() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 overflow-hidden">
      {/* Aqua glow pool */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_50%,rgba(0,194,209,0.2),transparent_60%)]" />
      {/* Scan line */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div className="relative">
        <div
          className={cn(
            "mx-auto h-20 w-20 rounded-full ring-1 ring-white/12 bg-white/[0.03]",
            "flex items-center justify-center",
          )}
        >
          <span
            aria-hidden
            className="block h-3 w-3 rounded-full bg-data motion-safe:animate-pulse shadow-[0_0_32px_rgba(0,194,209,0.6)]"
          />
        </div>
        <p className="mt-8 font-display text-white/90 text-xl md:text-2xl tracking-[-0.015em]">
          Founder video · in production
        </p>
        <JeffreySystem className="mt-3 block text-white/45">
          Lands on first cohort close · 90 seconds · uncut · filed privately
        </JeffreySystem>
      </div>
    </div>
  );
}

function CornerTicks() {
  const common =
    "absolute block h-3 w-3 border-white/25 pointer-events-none";
  return (
    <>
      <span aria-hidden className={cn(common, "-top-2 -left-2 border-t border-l")} />
      <span aria-hidden className={cn(common, "-top-2 -right-2 border-t border-r")} />
      <span aria-hidden className={cn(common, "-bottom-2 -left-2 border-b border-l")} />
      <span aria-hidden className={cn(common, "-bottom-2 -right-2 border-b border-r")} />
    </>
  );
}
