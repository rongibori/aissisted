/**
 * motion — earned-motion tokens for apps/site.
 *
 * Brand Bible v1.1: motion is earned, never decorative. Use these tokens so
 * every transition reads from the same timing system. If a motion doesn't
 * reinforce meaning (state change, spatial continuity, system response), it
 * doesn't ship.
 *
 * We do NOT install framer-motion at M2. CSS transitions cover every primitive
 * in this milestone. When an animation genuinely needs physics (Jeffrey dock
 * open, investor-room reveal), we'll install framer-motion in that milestone
 * and wire these tokens into a Motion provider.
 */

export const motion = {
  /**
   * Durations (ms). Keep tight — premium reads as precise, not languid.
   */
  duration: {
    instant: 120, // micro: hover, focus ring
    quick: 180, // small state: button press, toggle
    base: 240, // default: disclosure, tab switch
    calm: 360, // deliberate: hero reveal, Jeffrey dock open
    slow: 520, // rare: investor-room transition, narrative shift
  },

  /**
   * Easings. Named by intent so the calling site reads right.
   * - standard: default for anything entering or settling
   * - enter: content coming in from rest
   * - exit: content leaving toward rest (snappier)
   * - emphasized: for a single hero beat per page
   */
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    enter: "cubic-bezier(0, 0, 0, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1.2)",
  },
} as const;

/**
 * Tailwind-safe transition string helper.
 * Usage: style={{ transition: transition("opacity, transform", "base") }}
 */
export function transition(
  properties: string,
  duration: keyof typeof motion.duration = "base",
  easing: keyof typeof motion.easing = "standard"
): string {
  return `${properties} ${motion.duration[duration]}ms ${motion.easing[easing]}`;
}

/**
 * Reduced-motion hook — server-safe, hydrates client-side.
 * Every non-trivial motion must honor this. No exceptions.
 */
import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefers(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return prefers;
}
