"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * OneLinePunch — single declarative statement as its own beat.
 *
 * Apple-style transitional headline that breaks rhythm between heavy
 * chapters. No body copy, no CTAs. Just a sentence at scale, optionally
 * split into a primary clause and a softer follow-on.
 *
 * Used between projections → moat, or moat → roadmap, etc.
 */

type Tone = "midnight" | "surface";

type Props = {
  primary: string;
  /** Optional second clause rendered at lower contrast. */
  secondary?: string;
  tone?: Tone;
  className?: string;
};

export function OneLinePunch({
  primary,
  secondary,
  tone = "midnight",
  className,
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
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const dark = tone === "midnight";

  return (
    <section
      ref={ref}
      className={cn(
        "relative",
        dark
          ? "bg-[color:var(--brand-midnight)] text-white"
          : "bg-surface text-ink",
        "py-24 md:py-36",
        className,
      )}
    >
      <div className="mx-auto max-w-[88rem] px-6 md:px-10">
        <h2
          className={cn(
            "font-display font-bold",
            "text-[clamp(2rem,5vw,4rem)] leading-[1.05] tracking-[-0.02em]",
            "max-w-5xl",
            "transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.2,0,0,1)]",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
          )}
        >
          {primary}
          {secondary ? (
            <>
              <br className="hidden md:block" />
              <span
                className={cn(
                  dark ? "text-white/55" : "text-ink/55",
                  "transition-opacity duration-[1000ms] ease-out",
                  seen ? "opacity-100" : "opacity-0",
                )}
                style={{ transitionDelay: seen ? "200ms" : "0ms" }}
              >
                {" "}
                {secondary}
              </span>
            </>
          ) : null}
        </h2>
      </div>
    </section>
  );
}
