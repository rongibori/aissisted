"use client";

import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * Reveal — intersection-observer scroll reveal for investor-room chapters.
 *
 * Earned motion only: one ease-out fade-and-rise per element, once, on enter.
 * Never loops. Never re-plays. Honors prefers-reduced-motion.
 *
 * No framer-motion dependency — Tailwind + CSS transitions keep the bundle
 * tight and deterministic.
 */

type Props = {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
  /** Start hidden until 8% of the element has entered the viewport. */
  threshold?: number;
  /** Disable motion entirely (used inside already-animated parents). */
  disabled?: boolean;
  as?: keyof JSX.IntrinsicElements;
};

export function Reveal({
  children,
  delayMs = 0,
  className,
  threshold = 0.08,
  disabled = false,
  as = "div",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (disabled || prefersReducedMotion) {
      setSeen(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeen(true);
            io.disconnect();
            return;
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [disabled, prefersReducedMotion, threshold]);

  const Tag = as as any;

  return (
    <Tag
      ref={ref as any}
      className={cn(
        "will-change-[opacity,transform]",
        "transition-[opacity,transform] duration-[720ms] ease-[cubic-bezier(0.2,0,0,1)]",
        seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      )}
      style={{ transitionDelay: seen ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
