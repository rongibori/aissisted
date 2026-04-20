"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { H1, Lede, JeffreySystem, UILabel } from "@/components/typography";
import { AskAffordance } from "./ask-affordance";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * InvestorHero — the fold. Luxury technology posture.
 *
 * One emotional beat: the thesis, stated the way Jeffrey would state it.
 * No raise size, no "investing" language. The fold earns the rest of the
 * page — it doesn't pitch the round.
 *
 * v2:
 *   · Staged reveal on entry (eyebrow → headline → accent line → lede → CTAs).
 *   · Aqua accent line draws in on first render — subtle, premium, once.
 *   · Refined anchor nav: two-tier (number + label) with micro-separator.
 *   · Dual radial glow + denser grid wash for depth without busy-ness.
 */

type Props = {
  className?: string;
};

export function InvestorHero({ className }: Props) {
  const [seen, setSeen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) {
      setSeen(true);
      return;
    }
    // Fire on next frame so transitions register the state change.
    const t = requestAnimationFrame(() => setSeen(true));
    return () => cancelAnimationFrame(t);
  }, [reduced]);

  return (
    <section
      aria-labelledby="investor-hero-heading"
      className={cn(
        "relative overflow-hidden",
        "bg-[color:var(--brand-midnight)] text-white",
        "py-28 md:py-40",
        className,
      )}
    >
      {/* Subtle grid wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Core glow — dual radials */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 85% 15%, rgba(0,194,209,0.22) 0%, transparent 60%), radial-gradient(40% 40% at 5% 80%, rgba(0,194,209,0.10) 0%, transparent 60%)",
        }}
      />
      {/* Hairline top-of-hero signal */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 left-0 h-px bg-data origin-left",
          "transition-transform duration-[1400ms] ease-[cubic-bezier(0.2,0,0,1)]",
          seen ? "scale-x-100" : "scale-x-0",
        )}
        style={{ width: "min(40vw, 400px)" }}
      />
      <Container width="wide" className="relative">
        <div ref={ref} className="flex flex-col">
          <div
            className={cn(
              "flex items-center gap-3",
              "transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-data"
            />
            <Eyebrow tone="data">Investor room · private</Eyebrow>
          </div>

          <H1
            as="h1"
            className={cn(
              "mt-10 max-w-5xl text-white",
              "text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] tracking-[-0.02em]",
              "transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
            )}
            style={{ transitionDelay: "120ms" }}
          >
            <span id="investor-hero-heading">
              We don't sell supplements.
              <br className="hidden md:block" />
              <span className="text-data">We sell a body understood.</span>
            </span>
          </H1>

          <Lede
            className={cn(
              "mt-10 max-w-2xl text-white/85 text-lg md:text-xl",
              "transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
            style={{ transitionDelay: "280ms" }}
          >
            Operating intelligence for one person's body. Labs in. Wearables in.
            A protocol that adapts. Pressed, packed, shipped every thirty days.
            The longer you're in, the sharper the system gets.
          </Lede>

          <div
            className={cn(
              "mt-14 flex flex-col md:flex-row md:items-center gap-6",
              "transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
            style={{ transitionDelay: "440ms" }}
          >
            <AskAffordance
              tone="inverse"
              label="Walk the thesis"
              question="Give me the thesis in two minutes — the shift, the wedge, and why now."
            />
            <JeffreySystem className="text-white/55">
              ⌘K · Jeffrey, anywhere on this page
            </JeffreySystem>
          </div>

          {/* Anchor nav for chapters — two-tier, restrained */}
          <nav
            aria-label="Investor chapters"
            className={cn(
              "mt-20 border-t border-white/10 pt-8",
              "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-5",
              "transition-opacity duration-[900ms] ease-out",
              seen ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDelay: "640ms" }}
          >
            {CHAPTERS.map((c) => (
              <a
                key={c.href}
                href={c.href}
                className={cn(
                  "group flex flex-col gap-1 py-1",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--brand-midnight)]",
                )}
              >
                <UILabel className="text-white/40 group-hover:text-data transition-colors">
                  {c.num}
                </UILabel>
                <span
                  className={cn(
                    "font-system text-[11px] uppercase tracking-[0.18em]",
                    "text-white/70 group-hover:text-white transition-colors",
                  )}
                >
                  {c.label}
                </span>
              </a>
            ))}
          </nav>
        </div>
      </Container>
    </section>
  );
}

const CHAPTERS = [
  { href: "#chapter-thesis", num: "01", label: "Thesis" },
  { href: "#chapter-product", num: "02", label: "Product" },
  { href: "#chapter-model", num: "03", label: "Model" },
  { href: "#chapter-comparables", num: "04", label: "Comparables" },
  { href: "#chapter-projections", num: "05", label: "Projections" },
  { href: "#chapter-moat", num: "06", label: "Moat" },
  { href: "#chapter-roadmap", num: "07", label: "Roadmap" },
  { href: "#chapter-cta", num: "08", label: "Next step" },
];
