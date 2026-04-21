"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { UILabel } from "@/components/typography";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * HardCTA — three-tier final ask.
 *
 * Tier 1 (primary, aqua-filled): Request allocation
 *   For: lead-style investors who are ready to talk ticket size.
 * Tier 2 (secondary, aqua ghost): Book a founder call
 *   For: warm interest — a 30-minute walk-through with the founder.
 * Tier 3 (tertiary, hairline ghost): Join strategic waitlist
 *   For: operators, clinicians, advisors who want to be in the room later.
 *
 * The three tiers sit in one horizontal band on desktop, stacking on
 * mobile. The staggered reveal pulls attention from tier 1 → tier 3, which
 * matches the psychological weight of the ask.
 *
 * All three routes to the existing RequestDeckModal (parent-wired), with an
 * intent string that the modal can surface in its note field. Wiring to
 * distinct endpoints (Resend + HubSpot per intent) lands in a later PR.
 */

type Intent = "allocation" | "founder-call" | "waitlist";

type Tier = {
  intent: Intent;
  kicker: string;
  headline: string;
  body: string;
  cta: string;
  variant: "primary" | "secondary" | "tertiary";
};

const TIERS: Tier[] = [
  {
    intent: "allocation",
    kicker: "01 · The round",
    headline: "Take your seat.",
    body: "For leads and co-leads. Ticket, terms, and timing — handled in a founder session inside five business days. The cohort is kept small on purpose.",
    cta: "Request allocation →",
    variant: "primary",
  },
  {
    intent: "founder-call",
    kicker: "02 · The walk-through",
    headline: "Thirty minutes. On camera.",
    body: "Working session with the founder. Walk the live product, the model, the moat. Direct questions, direct answers — no deck theater.",
    cta: "Book the call →",
    variant: "secondary",
  },
  {
    intent: "waitlist",
    kicker: "03 · The list",
    headline: "Hold a seat for later.",
    body: "For operators, clinicians, and advisors who want early access to the cohort and to the thinking behind it. Quarterly at most.",
    cta: "Join the list →",
    variant: "tertiary",
  },
];

type Props = {
  onRequest?: (intent: Intent) => void;
  className?: string;
};

export function HardCTA({ onRequest, className }: Props) {
  const [seen, setSeen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) {
      setSeen(true);
      return;
    }
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={cn(
        "grid gap-px md:grid-cols-3",
        "bg-white/[0.08]",
        className,
      )}
    >
      {TIERS.map((t, i) => (
        <button
          key={t.intent}
          type="button"
          onClick={() => onRequest?.(t.intent)}
          className={cn(
            "group relative flex flex-col items-start text-left",
            "bg-[color:var(--brand-midnight)] p-8 md:p-10",
            "transition-[background,transform,box-shadow] duration-300",
            "hover:bg-[color:var(--brand-midnight)] hover:brightness-[1.08]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-inset",
            "transition-[opacity,transform] ease-[cubic-bezier(0.2,0,0,1)]",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
          style={{ transitionDelay: `${180 + i * 140}ms`, transitionDuration: "800ms" }}
        >
          {/* Variant accent strip */}
          <span
            aria-hidden
            className={cn(
              "absolute top-0 left-0 right-0 h-px origin-left",
              "transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "scale-x-100" : "scale-x-0",
              t.variant === "primary"
                ? "bg-data"
                : t.variant === "secondary"
                  ? "bg-data/60"
                  : "bg-white/20",
            )}
            style={{ transitionDelay: `${320 + i * 140}ms` }}
          />

          <UILabel
            className={cn(
              t.variant === "primary"
                ? "text-data"
                : t.variant === "secondary"
                  ? "text-data/80"
                  : "text-white/55",
              "tracking-[0.18em]",
            )}
          >
            {t.kicker}
          </UILabel>

          <h3
            className={cn(
              "mt-6 font-display font-bold text-white",
              "text-[clamp(1.3rem,2vw,1.875rem)] leading-[1.15] tracking-[-0.01em]",
            )}
          >
            {t.headline}
          </h3>

          <p
            className={cn(
              "mt-5 font-body text-[15px] md:text-[16px] leading-[1.55] text-white/75",
            )}
          >
            {t.body}
          </p>

          <span
            className={cn(
              "mt-10 inline-flex items-center h-11 px-5 rounded-full",
              "font-system text-[11.5px] uppercase tracking-[0.14em]",
              "transition-[background,color,transform]",
              "group-hover:-translate-y-[1px]",
              t.variant === "primary"
                ? "bg-data text-[color:var(--brand-midnight)] group-hover:brightness-110"
                : t.variant === "secondary"
                  ? "bg-transparent text-data ring-1 ring-inset ring-data/40 group-hover:ring-data/70"
                  : "bg-transparent text-white/80 ring-1 ring-inset ring-white/15 group-hover:ring-white/35 group-hover:text-white",
            )}
          >
            {t.cta}
          </span>
        </button>
      ))}
    </div>
  );
}

export type { Intent as HardCTAIntent };
