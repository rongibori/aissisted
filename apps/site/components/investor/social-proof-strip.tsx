"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { JeffreySystem } from "@/components/typography";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * SocialProofStrip — thin horizontal band with hairline-separated proof
 * tokens. Architecture-language signal only. NO logos. NO testimonials.
 * NO customer counts.
 *
 * Sits as a quiet beat between the cinematic hero and the founder video.
 * Reads as a one-line breath of credibility before the first chapter lands.
 */

const TOKENS = [
  "Operator-built",
  "Clinician-paired",
  "FHIR-native",
  "Founder-read",
  "HIPAA-grade",
  "Surface-isolated",
] as const;

export function SocialProofStrip() {
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
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section
      aria-label="Architecture proof"
      className="bg-[color:var(--brand-midnight)] text-white border-y border-white/[0.06]"
    >
      <Container width="wide">
        <div
          ref={ref}
          className="py-5 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <JeffreySystem className="text-white/45 shrink-0">
            What it is, in one breath
          </JeffreySystem>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 md:gap-x-6">
            {TOKENS.map((t, i) => (
              <li
                key={t}
                className={cn(
                  "flex items-center gap-3",
                  "transition-[opacity,transform] ease-[cubic-bezier(0.2,0,0,1)]",
                  seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
                )}
                style={{
                  transitionDelay: `${120 + i * 80}ms`,
                  transitionDuration: "560ms",
                }}
              >
                <span
                  aria-hidden
                  className="font-system text-[10.5px] uppercase tracking-[0.18em] text-white/75"
                >
                  {t}
                </span>
                {i < TOKENS.length - 1 ? (
                  <span
                    aria-hidden
                    className="hidden md:inline-block h-3 w-px bg-white/15"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
