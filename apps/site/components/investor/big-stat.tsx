"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";
import { UILabel } from "@/components/typography";

/**
 * BigStat — Apple-style oversize numeric beat.
 *
 * One number. One line. One emotional weight. Used as a chapter anchor or a
 * stand-alone beat between sections.
 *
 * The number scales on enter; the caption follows with a short delay. No
 * loops, no parallax. Honors prefers-reduced-motion.
 */

type Tone = "midnight" | "surface";

type Props = {
  /** Eyebrow context (small caps). */
  eyebrow?: string;
  /** The display value — short, dense (e.g., "$13.9B", "1", "30 days"). */
  value: string;
  /** One-line statement that sits below the value. */
  punch: string;
  /** Optional small caption below the punch line. */
  caption?: string;
  tone?: Tone;
  className?: string;
  align?: "left" | "center";
};

export function BigStat({
  eyebrow,
  value,
  punch,
  caption,
  tone = "midnight",
  className,
  align = "left",
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
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const dark = tone === "midnight";

  return (
    <div
      ref={ref}
      className={cn(
        "relative",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <div
          className={cn(
            "flex items-center gap-3",
            align === "center" && "justify-center",
            "transition-opacity duration-[700ms] ease-out",
            seen ? "opacity-100" : "opacity-0",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              dark ? "bg-data" : "bg-brand",
            )}
          />
          <UILabel className={dark ? "text-data" : "text-brand"}>
            {eyebrow}
          </UILabel>
        </div>
      ) : null}

      <div
        className={cn(
          "mt-6 font-display font-bold",
          "text-[clamp(4rem,12vw,10rem)] leading-[0.92] tracking-[-0.04em]",
          dark ? "text-white" : "text-ink",
          "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.2,0,0,1)]",
          seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        {value}
      </div>

      <div
        className={cn(
          "mt-8 font-display font-semibold",
          "text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.15] tracking-[-0.01em]",
          dark ? "text-white" : "text-ink",
          align === "center" ? "mx-auto" : "",
          "max-w-3xl",
          "transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.2,0,0,1)]",
          seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        )}
        style={{ transitionDelay: seen ? "180ms" : "0ms" }}
      >
        {punch}
      </div>

      {caption ? (
        <p
          className={cn(
            "mt-6 font-body text-base md:text-lg leading-[1.55]",
            dark ? "text-white/70" : "text-ink/75",
            align === "center" ? "mx-auto" : "",
            "max-w-2xl",
            "transition-[opacity,transform] duration-[700ms] ease-out",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          )}
          style={{ transitionDelay: seen ? "320ms" : "0ms" }}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
