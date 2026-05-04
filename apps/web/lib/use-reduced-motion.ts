"use client";

import { useEffect, useState } from "react";

/**
 * Reads `prefers-reduced-motion` once and subscribes to changes.
 * Components can use the boolean to strip animation classes when
 * the user has opted into reduced motion at the OS level.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
