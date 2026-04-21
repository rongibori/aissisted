"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * ChapterProgress — sticky top-of-page indicator for the investor walkthrough.
 *
 * Two layers:
 *   · A 1px aqua scroll-progress bar (page %).
 *   · A horizontally scrolling chapter rail showing which chapter the
 *     viewport is currently anchored on.
 *
 * Pure CSS sticky + scrollY listener — no library. Hidden on mount until
 * the user has scrolled past the hero (avoids competing with the fold).
 */

type Chapter = {
  id: string;
  label: string;
};

const CHAPTERS: Chapter[] = [
  { id: "chapter-thesis", label: "01 · Thesis" },
  { id: "chapter-product", label: "02 · Product" },
  { id: "chapter-model", label: "03 · Model" },
  { id: "chapter-comparables", label: "04 · Comparables" },
  { id: "chapter-projections", label: "05 · Projections" },
  { id: "chapter-moat", label: "06 · Moat" },
  { id: "chapter-roadmap", label: "07 · Roadmap" },
  { id: "chapter-cta", label: "08 · Next step" },
];

export function ChapterProgress() {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string>(CHAPTERS[0].id);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    function update() {
      const doc = document.documentElement;
      const scrolled = window.scrollY;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, scrolled / max)) : 0;
      setProgress(pct);

      // Reveal once we leave the fold.
      setRevealed(scrolled > window.innerHeight * 0.6);

      // Find the chapter whose top is closest above the 25%-from-top line.
      const probeY = window.innerHeight * 0.25;
      let current = CHAPTERS[0].id;
      for (const c of CHAPTERS) {
        const el = document.getElementById(c.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= probeY) {
          current = c.id;
        }
      }
      setActiveId(current);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-40 pointer-events-none",
        "transition-opacity duration-500 ease-out",
        revealed ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!revealed}
    >
      {/* Backdrop — only visible once revealed */}
      <div
        className={cn(
          "pointer-events-auto",
          "bg-[color:var(--brand-midnight)]/85 backdrop-blur-md",
          "border-b border-white/10",
        )}
      >
        {/* Aqua progress line */}
        <div
          className="h-px bg-data origin-left"
          style={{ transform: `scaleX(${progress})` }}
        />

        {/* Chapter rail — horizontally scrollable on mobile */}
        <nav
          aria-label="Chapter progress"
          className={cn(
            "overflow-x-auto",
            "[&::-webkit-scrollbar]:hidden",
            "[scrollbar-width:none]",
          )}
        >
          <ul className="flex items-center gap-x-5 px-6 md:px-8 h-10 whitespace-nowrap">
            {CHAPTERS.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id} className="shrink-0">
                  <a
                    href={`#${c.id}`}
                    className={cn(
                      "font-system text-[10.5px] uppercase tracking-[0.18em]",
                      "transition-colors duration-200",
                      active
                        ? "text-white"
                        : "text-white/50 hover:text-white/80",
                    )}
                  >
                    {c.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
