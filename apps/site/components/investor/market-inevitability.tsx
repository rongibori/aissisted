"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";
import { UILabel } from "@/components/typography";

/**
 * MarketInevitability — four inevitability signals in a quiet 2×2 / 4-col grid.
 *
 * Not a feature list. Each card is a market force that is already in motion:
 * regulatory, demographic, technical, behavioral. Framing is "this is happening
 * — we are the system that survives it."
 *
 * Staged reveal on enter. One-shot, honors reduced-motion.
 */

type Pillar = {
  kicker: string;
  headline: string;
  body: string;
  marker: string; // small stat or token pinned to the card
};

const PILLARS: Pillar[] = [
  {
    kicker: "Regulatory",
    headline: "Labs are finally portable.",
    body: "FHIR + SMART-on-FHIR, Apple Health records, and state-level interoperability mandates mean a modern system can pull a user's labs without a fax machine for the first time.",
    marker: "21st C. Cures · in force",
  },
  {
    kicker: "Demographic",
    headline: "The top decile wants owned health.",
    body: "HENRYs and high-net-worth consumers are already paying Function, Oura, WHOOP, and 1,200-calorie GLP-1 stacks in parallel. They want one operator, not four apps.",
    marker: "$150B+ addressable",
  },
  {
    kicker: "Technical",
    headline: "Reasoning crossed the line.",
    body: "Large-context models now explain biology in plain language with clinical caveats intact. The missing layer is a memory of one person — which is what we build.",
    marker: "Context · persistent",
  },
  {
    kicker: "Behavioral",
    headline: "Wearables trained a habit.",
    body: "Daily HRV, sleep, and glucose checks created the first generation of users who expect a system to notice, explain, and adjust. Supplements have not caught up. We are that catch-up.",
    marker: "∼300M wearable-active",
  },
];

export function MarketInevitability({ className }: { className?: string }) {
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
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px",
        "bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]",
        className,
      )}
    >
      {PILLARS.map((p, i) => (
        <article
          key={p.kicker}
          className={cn(
            "relative bg-[color:var(--brand-midnight)] p-7 md:p-8",
            "transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.2,0,0,1)]",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
          )}
          style={{ transitionDelay: seen ? `${120 + i * 90}ms` : "0ms" }}
        >
          <div className="flex items-center justify-between">
            <UILabel className="text-data">{p.kicker}</UILabel>
            <span className="font-system text-[10px] tracking-[0.14em] text-white/40 uppercase">
              {p.marker}
            </span>
          </div>
          <h3 className="mt-6 font-display font-semibold text-white text-xl md:text-2xl leading-[1.15] tracking-[-0.01em]">
            {p.headline}
          </h3>
          <p className="mt-4 font-body text-[15px] leading-[1.6] text-white/75">
            {p.body}
          </p>
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-px w-12 bg-data/70"
          />
        </article>
      ))}
    </div>
  );
}
