"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { UILabel } from "@/components/typography";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * FounderPosture — elite founder credibility without fabrication.
 *
 * Built as a commitments-based block rather than a bio block. We do not
 * invent credentials, logos, or prior exits. We state how the founder
 * operates against this build — things that are observable on the ground
 * and defensible in DD.
 *
 * If Ron wants a bio block (with real credentials), we can swap this
 * component for one driven by explicit copy he provides. Until then, this
 * is the safest, highest-signal surface: four operating commitments that
 * signal posture without pretending to be a track-record block.
 */

type Commitment = {
  kicker: string;
  headline: string;
  body: string;
};

const COMMITMENTS: Commitment[] = [
  {
    kicker: "01 · Operator on record",
    headline: "Founder reads every investor message.",
    body:
      "No auto-reply. No SDR between the founder and the investor. If the system responds, it's because the founder wrote the system — and he's read what you wrote.",
  },
  {
    kicker: "02 · Technical due-diligence first",
    headline: "The repo is the spec. The spec is shippable.",
    body:
      "Every claim on this page is anchored to code, schema, or a committed standard. Nothing is a slide until it's a surface. Technical DD can start the moment a term sheet is in motion.",
  },
  {
    kicker: "03 · Brand discipline is a product feature",
    headline: "Simplicity over cleverness, every time.",
    body:
      "We do not lead with AI. We do not use category language. The language of the system matches the system itself — precise, minimal, intentional. That discipline is a hiring filter and a product filter.",
  },
  {
    kicker: "04 · Individual over average",
    headline: "This is not a DTC brand with a data layer.",
    body:
      "It is a data layer with a product surface. Every decision — from onboarding to packaging to protocol — is judged by whether it makes one person feel the system was built for them. That filter is non-negotiable.",
  },
];

export function FounderPosture({ className }: { className?: string }) {
  const [seen, setSeen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement | null>(null);

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
    <section
      ref={ref}
      aria-labelledby="founder-posture-heading"
      className={cn(
        "relative overflow-hidden bg-surface text-ink",
        "py-28 md:py-36",
        className,
      )}
    >
      {/* Soft aqua accent rail on the left */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-data/30",
          "transition-transform duration-[1800ms] ease-[cubic-bezier(0.2,0,0,1)] origin-top",
          seen ? "scale-y-100" : "scale-y-0",
        )}
      />

      <div className="mx-auto max-w-[88rem] px-6 md:px-10">
        <div className="grid gap-16 lg:grid-cols-[22rem_1fr] lg:gap-24">
          {/* Left rail — the posture */}
          <div>
            <div
              className={cn(
                "flex items-center gap-3",
                "transition-[opacity,transform] duration-[700ms] ease-out",
                seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              )}
            >
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
              <UILabel className="text-brand">Founder posture</UILabel>
            </div>
            <h2
              id="founder-posture-heading"
              className={cn(
                "mt-6 font-display font-bold text-ink",
                "text-[clamp(2rem,4vw,3.25rem)] leading-[1.03] tracking-[-0.02em]",
                "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.2,0,0,1)]",
                seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
              )}
              style={{ transitionDelay: "120ms" }}
            >
              The team is legible
              <br className="hidden md:block" />
              <span className="text-ink/55"> before the product is.</span>
            </h2>
            <p
              className={cn(
                "mt-6 max-w-md font-body text-lg leading-[1.55] text-ink/70",
                "transition-[opacity,transform] duration-[800ms] ease-out",
                seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              )}
              style={{ transitionDelay: "260ms" }}
            >
              Four commitments this company is built on. Each is observable,
              not promised. Each survives due diligence.
            </p>
            <div
              className={cn(
                "mt-10 inline-flex items-center gap-2 rounded-full",
                "bg-ink/[0.04] px-4 h-8 ring-1 ring-inset ring-ink/10",
                "transition-[opacity,transform] duration-[700ms] ease-out",
                seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              )}
              style={{ transitionDelay: "400ms" }}
            >
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data motion-safe:animate-pulse" />
              <span className="font-system text-[10.5px] uppercase tracking-[0.16em] text-ink/60">
                Founder-read · invite only
              </span>
            </div>
          </div>

          {/* Right rail — commitments */}
          <div className="space-y-px bg-ink/10">
            {COMMITMENTS.map((c, i) => (
              <article
                key={c.kicker}
                className={cn(
                  "relative bg-surface p-8 md:p-10",
                  "transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.2,0,0,1)]",
                  seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                )}
                style={{ transitionDelay: `${200 + i * 110}ms` }}
              >
                <div className="flex items-baseline justify-between">
                  <UILabel className="text-brand">{c.kicker}</UILabel>
                </div>
                <h3 className="mt-5 font-display font-bold text-ink text-[clamp(1.25rem,2vw,1.75rem)] leading-[1.2] tracking-[-0.01em]">
                  {c.headline}
                </h3>
                <p className="mt-4 max-w-3xl font-body text-[16px] md:text-[17px] leading-[1.6] text-ink/75">
                  {c.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
