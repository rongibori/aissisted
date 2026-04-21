"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { UILabel } from "@/components/typography";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * WhyNow — urgency section framed as four temporal forces converging.
 *
 * Sits after Chapter 01 (Thesis) as the closing beat that converts
 * "this is true" into "this window is closing if we wait". NO fabricated
 * stats — every force is a structural claim about policy, hardware,
 * model capability, and category trust.
 *
 * Tone: surface (light) — intentional contrast against the midnight thesis
 * block above, so the urgency lands on bright canvas instead of dark mood.
 */

type Force = {
  index: string;
  kicker: string;
  title: string;
  body: string;
  signature: string;
};

const FORCES: Force[] = [
  {
    index: "01",
    kicker: "Policy",
    title: "Health records just opened.",
    body: "21st Century Cures is in force. Electronic health information is patient-portable by federal rule. The records were locked for a decade — today they travel.",
    signature: "In force · 2021–2026",
  },
  {
    index: "02",
    kicker: "Hardware",
    title: "Wearables crossed the threshold.",
    body: "Heart rate variability, sleep architecture, and continuous glucose are now consumer-grade. The signal-to-noise crossed the line where adaptive protocols outperform category averages.",
    signature: "At scale · 2024 onward",
  },
  {
    index: "03",
    kicker: "Intelligence",
    title: "Models matured to clinician-grade.",
    body: "Reasoning-class models can now weigh lab panels, wearables, and longitudinal context in a single pass. The layer above the data is now buildable by a small team.",
    signature: "Inflection · 2025",
  },
  {
    index: "04",
    kicker: "Category",
    title: "Trust in the supplement aisle is at floor.",
    body: "The category is saturated with stacks, sub-stacks, and influencer bundles. The buyer is demanding personal, explained, and data-backed. The shelf cannot answer.",
    signature: "Gap open · now",
  },
];

export function WhyNow() {
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
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section
      aria-label="Why now"
      className="bg-surface text-ink py-24 md:py-32"
    >
      <Container width="wide">
        <div className="flex items-center gap-3">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
          <UILabel className="text-brand">Why now</UILabel>
        </div>

        <h2 className="mt-6 font-display font-bold text-ink text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] tracking-[-0.015em] max-w-4xl">
          Four forces converged in a window
          <br className="hidden md:block" />
          <span className="text-ink/55">that closes the moment it's crowded.</span>
        </h2>
        <p className="mt-5 max-w-2xl font-body text-[16px] md:text-[17px] leading-[1.55] text-ink/70">
          None of these alone build this company. All four, at once, make it
          inevitable. The window is measured in quarters, not years — and the
          first company to run the full loop owns the longitudinal record.
        </p>

        <div
          ref={ref}
          className="mt-14 grid gap-px md:grid-cols-2 lg:grid-cols-4 bg-ink/10"
        >
          {FORCES.map((f, i) => (
            <article
              key={f.index}
              className={cn(
                "relative bg-surface p-6 md:p-8 flex flex-col gap-5",
                "transition-[opacity,transform] ease-[cubic-bezier(0.2,0,0,1)]",
                seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{
                transitionDelay: `${280 + i * 130}ms`,
                transitionDuration: "800ms",
              }}
            >
              <div className="flex items-baseline gap-3">
                <span className="font-system text-[11px] tracking-[0.2em] text-ink/40">
                  {f.index}
                </span>
                <UILabel className="text-brand">{f.kicker}</UILabel>
              </div>
              <h3 className="font-display font-semibold text-ink text-[clamp(1.1rem,1.8vw,1.5rem)] leading-[1.2] tracking-[-0.01em]">
                {f.title}
              </h3>
              <p className="font-body text-[14.5px] leading-[1.55] text-ink/70">
                {f.body}
              </p>
              <div className="mt-auto pt-3 border-t border-ink/10">
                <span className="font-system text-[10.5px] uppercase tracking-[0.16em] text-ink/45">
                  {f.signature}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 max-w-3xl border-l-2 border-brand pl-6 md:pl-8">
          <p className="font-display text-ink text-[clamp(1.15rem,2vw,1.625rem)] leading-[1.25] tracking-[-0.01em]">
            The records opened. The wearables crossed. The models matured. The
            shelf lost trust. The layer above the body is the next company —
            and it gets built exactly once.
          </p>
        </div>
      </Container>
    </section>
  );
}
