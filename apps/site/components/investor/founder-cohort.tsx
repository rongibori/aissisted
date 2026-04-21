"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";
import { JeffreySystem, UILabel } from "@/components/typography";

/**
 * FounderCohort — scarcity / urgency CTA without fabrication.
 *
 * Frames the conversation as a small, founder-stage cohort that is forming
 * now. No fake seat counts. The thin aqua progress bar implies "filling"
 * without claiming a number we cannot defend in DD.
 *
 * Two CTAs:
 *   · Primary  — "Request a founder session" → opens RequestDeckModal flow
 *                (or Calendly if wired) via window event.
 *   · Secondary — "Request the thesis memo" → also routes through CTA grid.
 *
 * The component itself only emits events; the parent wires them to the
 * existing CTA modal / waitlist endpoints. That keeps this drop-in.
 */

type Props = {
  className?: string;
  onRequestSession?: () => void;
  onRequestMemo?: () => void;
};

export function FounderCohort({
  className,
  onRequestSession,
  onRequestMemo,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setSeen(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
            return;
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-[linear-gradient(135deg,rgba(0,194,209,0.10),rgba(11,29,58,0)_55%)]",
        "ring-1 ring-inset ring-white/10",
        "p-8 md:p-12",
        className,
      )}
    >
      {/* Hairline aqua signal */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 left-0 h-px bg-data origin-left",
          "transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0,0,1)]",
          seen ? "scale-x-100" : "scale-x-0",
        )}
        style={{ width: "min(40%, 320px)" }}
      />

      <div
        className={cn(
          "transition-[opacity,transform] duration-[700ms] ease-out",
          seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        )}
      >
        <div className="flex items-center gap-3">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
          <UILabel className="text-data">Founder cohort · invite only</UILabel>
        </div>

        <h3
          className={cn(
            "mt-7 font-display font-bold text-white",
            "text-[clamp(1.75rem,3.4vw,2.75rem)] leading-[1.05] tracking-[-0.02em]",
            "max-w-3xl",
          )}
        >
          The first conversation is the product.
        </h3>

        <p className="mt-6 max-w-2xl font-body text-white/80 text-base md:text-lg leading-[1.6]">
          A small number of founder-stage investors are meeting with Ron
          directly this quarter. One question. One conversation. No deck asked
          of you — Jeffrey will walk anything you need first.
        </p>

        {/* Cohort-forming bar — visual scarcity, no fake number */}
        <div
          className={cn(
            "mt-10 max-w-md",
            "transition-opacity duration-[900ms] ease-out",
            seen ? "opacity-100" : "opacity-0",
          )}
          style={{ transitionDelay: seen ? "320ms" : "0ms" }}
          aria-hidden
        >
          <div className="flex items-center justify-between">
            <JeffreySystem className="text-white/55">Cohort forming</JeffreySystem>
            <JeffreySystem className="text-white/45">Q2 · 2026</JeffreySystem>
          </div>
          <div className="mt-2 h-[3px] w-full rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-data origin-left",
                "transition-transform duration-[1600ms] ease-[cubic-bezier(0.2,0,0,1)]",
              )}
              style={{
                width: "62%",
                transform: seen ? "scaleX(1)" : "scaleX(0)",
                transitionDelay: seen ? "500ms" : "0ms",
              }}
            />
          </div>
        </div>

        <div
          className={cn(
            "mt-10 flex flex-col sm:flex-row gap-4",
            "transition-[opacity,transform] duration-[700ms] ease-out",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          )}
          style={{ transitionDelay: seen ? "440ms" : "0ms" }}
        >
          <button
            type="button"
            onClick={onRequestSession}
            className={cn(
              "inline-flex h-12 items-center justify-center px-7 rounded-full",
              "bg-data text-[color:var(--brand-midnight)]",
              "font-system text-[12px] uppercase tracking-[0.18em] font-semibold",
              "hover:brightness-110 active:scale-[0.98]",
              "transition-[filter,transform]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--brand-midnight)]",
            )}
          >
            Request a founder session
          </button>
          <button
            type="button"
            onClick={onRequestMemo}
            className={cn(
              "inline-flex h-12 items-center justify-center px-7 rounded-full",
              "bg-white/[0.04] text-white",
              "ring-1 ring-inset ring-white/15",
              "font-system text-[12px] uppercase tracking-[0.18em] font-medium",
              "hover:bg-white/[0.08]",
              "transition-[background]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--brand-midnight)]",
            )}
          >
            Request the thesis memo
          </button>
        </div>

        <JeffreySystem className="mt-8 block text-white/45">
          Founder-read · no auto-reply · private surface
        </JeffreySystem>
      </div>
    </div>
  );
}
