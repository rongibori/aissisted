"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { UILabel } from "@/components/typography";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * ProofArchitecture — social proof without fabrication.
 *
 * Three columns of honest proof:
 *   · STANDARDS — what the system complies with (technical DD-ready).
 *   · SYSTEMS   — what the system integrates with (named platforms).
 *   · PEOPLE    — who the system is accountable to (operator on record).
 *
 * Nothing here is invented. No fake logos, no claimed customer counts, no
 * fabricated endorsements. Each line is something that is either already
 * true, locked in the repo, or committed as ship standard.
 *
 * The layout uses a three-column architecture with hairline dividers, which
 * reads as a clean, almost-schematic proof surface — intentionally not a
 * "logo soup" pattern.
 */

type Column = {
  kicker: string;
  heading: string;
  items: string[];
};

const COLUMNS: Column[] = [
  {
    kicker: "Standards",
    heading: "Adopted before the first customer.",
    items: [
      "FHIR R4 — via SMART on FHIR (Epic MyChart).",
      "21st Century Cures — patient-initiated data, in force.",
      "HIPAA-grade architecture — surface isolation, no PHI bleed.",
      "OAuth 2.0 — WHOOP, Apple Health, Oura.",
    ],
  },
  {
    kicker: "Systems",
    heading: "Integrations designed, not announced.",
    items: [
      "Epic MyChart — labs, vitals, problem list.",
      "WHOOP — recovery, strain, HRV, sleep.",
      "Apple Health — activity, heart, respiratory.",
      "Oura — circadian signal, readiness, temperature.",
    ],
  },
  {
    kicker: "People",
    heading: "Accountable, not anonymous.",
    items: [
      "Founder-led · founder-read · founder-accountable.",
      "Clinician-paired — every category expansion.",
      "Medical review board — in formation.",
      "Operator on record — direct line, no auto-reply.",
    ],
  },
];

export function ProofArchitecture({
  tone = "surface",
  className,
}: {
  tone?: "surface" | "midnight";
  className?: string;
}) {
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
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const isMidnight = tone === "midnight";

  return (
    <section
      ref={ref}
      aria-labelledby="proof-architecture-heading"
      className={cn(
        "relative",
        isMidnight
          ? "bg-[color:var(--brand-midnight)] text-white"
          : "bg-surface text-ink",
        "py-24 md:py-32",
        className,
      )}
    >
      <div className="mx-auto max-w-[88rem] px-6 md:px-10">
        <div
          className={cn(
            "flex items-center gap-3",
            "transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.2,0,0,1)]",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          )}
        >
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
          <UILabel className={isMidnight ? "text-data" : "text-brand"}>
            Proof · three rails
          </UILabel>
        </div>

        <h2
          id="proof-architecture-heading"
          className={cn(
            "mt-6 max-w-4xl font-display font-bold",
            "text-[clamp(1.875rem,3.6vw,3rem)] leading-[1.05] tracking-[-0.015em]",
            isMidnight ? "text-white" : "text-ink",
            "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.2,0,0,1)]",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
          )}
          style={{ transitionDelay: "120ms" }}
        >
          Proof is an architecture. Not a logo wall.
        </h2>

        <p
          className={cn(
            "mt-5 max-w-2xl font-body text-lg md:text-xl leading-[1.5]",
            isMidnight ? "text-white/75" : "text-ink/70",
            "transition-[opacity,transform] duration-[700ms] ease-out",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          )}
          style={{ transitionDelay: "240ms" }}
        >
          Three rails hold this company up. Standards we comply with. Systems
          we integrate with. People we are accountable to. Nothing on this list
          is aspirational.
        </p>

        <div
          className={cn(
            "mt-16 grid gap-px",
            "grid-cols-1 md:grid-cols-3",
            isMidnight ? "bg-white/[0.08]" : "bg-ink/10",
          )}
        >
          {COLUMNS.map((col, idx) => (
            <div
              key={col.kicker}
              className={cn(
                isMidnight ? "bg-[color:var(--brand-midnight)]" : "bg-surface",
                "p-8 md:p-10",
                "transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.2,0,0,1)]",
                seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: `${320 + idx * 120}ms` }}
            >
              <div className="flex items-baseline justify-between">
                <UILabel
                  className={isMidnight ? "text-data" : "text-brand"}
                >
                  {col.kicker}
                </UILabel>
                <span
                  aria-hidden
                  className={cn(
                    "font-system text-[10px] tracking-[0.18em]",
                    isMidnight ? "text-white/30" : "text-ink/30",
                  )}
                >
                  {`0${idx + 1}`}
                </span>
              </div>
              <h3
                className={cn(
                  "mt-6 font-display font-bold",
                  "text-[clamp(1.15rem,1.8vw,1.5rem)] leading-[1.2] tracking-[-0.01em]",
                  isMidnight ? "text-white" : "text-ink",
                )}
              >
                {col.heading}
              </h3>
              <ul className="mt-6 space-y-3">
                {col.items.map((item) => (
                  <li
                    key={item}
                    className={cn(
                      "flex gap-3 font-body text-[15px] leading-[1.55]",
                      isMidnight ? "text-white/80" : "text-ink/75",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-[9px] inline-block h-px w-3 shrink-0",
                        isMidnight ? "bg-data/70" : "bg-brand/70",
                      )}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
