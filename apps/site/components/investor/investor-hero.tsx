"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { H1, Lede, JeffreySystem, UILabel } from "@/components/typography";
import { AskAffordance } from "./ask-affordance";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * InvestorHero · v3 — $10B-company posture.
 *
 * One declarative line. One emotional weight. The fold reads like an Apple
 * keynote frame: a massive, single statement on a depth-rich midnight surface
 * with a barely-there scroll-linked parallax on the headline.
 *
 * v3 upgrades over v2:
 *   · Headline drops to a single declarative punch. No "we don't sell …".
 *   · Scroll-linked parallax — headline drifts up ~12px and softens 4% as the
 *     fold leaves. Off when prefers-reduced-motion.
 *   · Mesh layer added: three drifting radials at 6% opacity instead of two.
 *   · Eyebrow shifts to "Founder-led · invitational" — stronger posture.
 *   · Anchor nav reads as a quiet table of contents — bigger labels, hairline
 *     between rows on mobile.
 *   · Trust pill row sits beneath the lede: HIPAA-grade · FHIR · Founder-read.
 */

type Props = {
  className?: string;
};

export function InvestorHero({ className }: Props) {
  const [seen, setSeen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) {
      setSeen(true);
      return;
    }
    const t = requestAnimationFrame(() => setSeen(true));
    return () => cancelAnimationFrame(t);
  }, [reduced]);

  // Scroll-linked parallax — only attach if motion is allowed.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Drift the headline up to ~14px and fade ~6% over the first viewport.
  const drift = Math.min(scrollY * 0.06, 14);
  const opacity = Math.max(1 - scrollY / 1200, 0.92);

  return (
    <section
      aria-labelledby="investor-hero-heading"
      className={cn(
        "relative overflow-hidden",
        "bg-[color:var(--brand-midnight)] text-white",
        "py-32 md:py-44 lg:py-56",
        className,
      )}
    >
      {/* Subtle grid wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      {/* Mesh — three drifting radials for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 88% 12%, rgba(0,194,209,0.22) 0%, transparent 60%), radial-gradient(45% 45% at 8% 78%, rgba(0,194,209,0.10) 0%, transparent 65%), radial-gradient(35% 35% at 50% 110%, rgba(238,43,55,0.06) 0%, transparent 70%)",
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
        style={{ width: "min(48vw, 480px)" }}
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
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
            <Eyebrow tone="data">Founder-led · invitational</Eyebrow>
          </div>

          <H1
            as="h1"
            className={cn(
              "mt-12 max-w-[64rem] text-white",
              "text-[clamp(2.75rem,7vw,6rem)] leading-[1.0] tracking-[-0.025em]",
              "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
            )}
            style={{
              transitionDelay: "120ms",
              transform: reduced
                ? undefined
                : `translate3d(0, ${seen ? -drift : 12}px, 0)`,
              opacity: reduced ? undefined : seen ? opacity : 0,
              willChange: "transform, opacity",
            }}
          >
            <span id="investor-hero-heading">
              The body, finally legible.
            </span>
          </H1>

          <Lede
            className={cn(
              "mt-12 max-w-3xl text-white/85 text-xl md:text-2xl leading-[1.45]",
              "transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
            style={{ transitionDelay: "300ms" }}
          >
            Aissisted is operating intelligence for one person's body. Labs in.
            Wearables in. A protocol that adapts. Pressed, packed, shipped
            every thirty days. The longer you're in, the sharper the system
            gets.
          </Lede>

          {/* Trust pills — small, restrained, anchor the posture */}
          <div
            className={cn(
              "mt-10 flex flex-wrap gap-2.5",
              "transition-[opacity,transform] duration-[700ms] ease-out",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
            )}
            style={{ transitionDelay: "440ms" }}
          >
            {TRUST_PILLS.map((p) => (
              <span
                key={p}
                className={cn(
                  "inline-flex h-7 items-center px-3 rounded-full",
                  "bg-white/[0.04] text-white/75 ring-1 ring-inset ring-white/10",
                  "font-system text-[10.5px] uppercase tracking-[0.16em]",
                )}
              >
                {p}
              </span>
            ))}
          </div>

          <div
            className={cn(
              "mt-14 flex flex-col md:flex-row md:items-center gap-6",
              "transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
            style={{ transitionDelay: "560ms" }}
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

          {/* Anchor nav for chapters — quieter, more table-of-contents */}
          <nav
            aria-label="Investor chapters"
            className={cn(
              "mt-24 border-t border-white/10 pt-10",
              "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-6",
              "transition-opacity duration-[1000ms] ease-out",
              seen ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDelay: "760ms" }}
          >
            {CHAPTERS.map((c) => (
              <a
                key={c.href}
                href={c.href}
                className={cn(
                  "group flex flex-col gap-1.5 py-1",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--brand-midnight)]",
                )}
              >
                <UILabel className="text-white/40 group-hover:text-data transition-colors">
                  {c.num}
                </UILabel>
                <span
                  className={cn(
                    "font-system text-[11.5px] uppercase tracking-[0.18em]",
                    "text-white/75 group-hover:text-white transition-colors",
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

const TRUST_PILLS = [
  "FHIR-native",
  "HIPAA-grade architecture",
  "Founder-read",
  "Surface-isolated",
];

const CHAPTERS = [
  { href: "#chapter-thesis", num: "01", label: "Thesis" },
  { href: "#chapter-product", num: "02", label: "Product" },
  { href: "#chapter-model", num: "03", label: "Model" },
  { href: "#chapter-comparables", num: "04", label: "Comparables" },
  { href: "#chapter-projections", num: "05", label: "Projections" },
  { href: "#chapter-moat", num: "06", label: "Moat" },
  { href: "#chapter-roadmap", num: "07", label: "Roadmap" },
  { href: "#chapter-cta", num: "08", label: "Cohort" },
];
