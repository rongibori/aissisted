"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * KineticNumber — count-up on first view for projections/metrics.
 *
 * Handles ranges ("5–8"), percents, units, and prefixed currencies.
 * Uses a single requestAnimationFrame loop, stops at the target, then
 * disconnects. One-shot — never re-animates.
 *
 * For non-numeric values, it renders the string directly.
 */

type Props = {
  /** Fully-formatted display value, e.g. "$60–90", "62–68", "< 9", "> 70". */
  value: string;
  className?: string;
  /** How long the count-up runs, in ms. Default 1400. */
  durationMs?: number;
};

export function KineticNumber({
  value,
  className,
  durationMs = 1400,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [seen, setSeen] = useState(false);
  const [display, setDisplay] = useState(value);
  const prefersReducedMotion = usePrefersReducedMotion();
  const parsed = parseValue(value);

  // Intersection trigger.
  useEffect(() => {
    if (!parsed.animatable || prefersReducedMotion) {
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
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [parsed.animatable, prefersReducedMotion]);

  // Animate once.
  useEffect(() => {
    if (!seen || !parsed.animatable || prefersReducedMotion) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const targets = parsed.numbers;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const currents = targets.map((n) => {
        const v = n * eased;
        return formatNumber(v, n);
      });
      setDisplay(renderTemplate(parsed.template, currents));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, parsed, value, durationMs, prefersReducedMotion]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </span>
  );
}

// ─── parsing ──────────────────────────────────────────────────────────────

type Parsed = {
  animatable: boolean;
  template: string; // "$__0__–__1__"
  numbers: number[]; // [60, 90]
};

function parseValue(raw: string): Parsed {
  // Extract all numbers (supports decimals). Replace with placeholders so we
  // can re-assemble during the animation without losing symbols / dashes.
  const matches: Array<{ n: number; s: string; idx: number }> = [];
  const re = /-?\d+(?:\.\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    matches.push({ n: parseFloat(m[0]), s: m[0], idx: m.index });
  }
  if (!matches.length) {
    return { animatable: false, template: raw, numbers: [] };
  }
  // Build a template with __0__, __1__ placeholders.
  let cursor = 0;
  let template = "";
  matches.forEach((match, i) => {
    template += raw.slice(cursor, match.idx);
    template += `__${i}__`;
    cursor = match.idx + match.s.length;
  });
  template += raw.slice(cursor);
  return {
    animatable: true,
    template,
    numbers: matches.map((m) => m.n),
  };
}

function renderTemplate(template: string, values: string[]): string {
  return template.replace(/__(\d+)__/g, (_, idx: string) => values[parseInt(idx, 10)] ?? "");
}

function formatNumber(current: number, target: number): string {
  if (!Number.isFinite(current)) return String(target);
  // Respect whether the target was integer or decimal.
  const isInteger = Number.isInteger(target);
  if (isInteger) {
    return String(Math.round(current));
  }
  const decimals = (String(target).split(".")[1] ?? "").length;
  return current.toFixed(Math.min(decimals, 2));
}
