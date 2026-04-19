"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { transition } from "@/lib/motion";
import { JeffreySystem, JeffreyText } from "@/components/typography";

/**
 * JeffreyDock — persistent bottom-right dock. VISUAL PLACEHOLDER ONLY.
 *
 * M2 scope: the affordance — closed pill, open panel, focus ring, reduced-
 * motion honor. No chat wiring. No /api/jeffrey calls. No transcript state.
 *
 * M10 will replace the body of the open panel with the real Jeffrey surface
 * (persona switching, retrieval, Claude Sonnet 4.6 stream). The opener,
 * dimensions, and palette stay so there's no visual migration cost.
 *
 * Palette discipline:
 *   · Midnight surface when open (investor-room overlap; reads premium at
 *     night). Dock lives on the 20% secondary band, not the 2% signal band.
 *   · Aqua dot in the closed pill — the only brand signal in the dock's
 *     rest state. Signals the system is listening without shouting.
 */

export function JeffreyDock() {
  const [open, setOpen] = useState(false);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      style={{ transition: transition("transform, opacity", "calm") }}
    >
      {open && (
        <div
          role="dialog"
          aria-label="Jeffrey — placeholder"
          className={cn(
            "mb-3 w-[22rem] max-w-[calc(100vw-3rem)]",
            "bg-[color:var(--brand-midnight)] text-white",
            "ring-1 ring-white/10 shadow-2xl",
            "p-5"
          )}
        >
          <div className="flex items-center justify-between">
            <JeffreySystem className="text-white/60">
              Jeffrey · placeholder
            </JeffreySystem>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Jeffrey"
              className={cn(
                "h-7 w-7 inline-flex items-center justify-center",
                "text-white/60 hover:text-white transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data"
              )}
            >
              <span aria-hidden>×</span>
            </button>
          </div>

          <JeffreyText className="mt-4 text-white/90">
            Surface reserved for Jeffrey. The prompt and retrieval layer land in
            Milestone 10.
          </JeffreyText>

          <div className="mt-5 border-t border-white/10 pt-4">
            <JeffreySystem className="text-white/50">
              Not live · M10 wires conversation
            </JeffreySystem>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Minimize Jeffrey" : "Open Jeffrey"}
        className={cn(
          "inline-flex h-12 items-center gap-3 px-5",
          "bg-[color:var(--brand-midnight)] text-white",
          "ring-1 ring-white/10 shadow-xl",
          "font-system text-xs font-medium uppercase tracking-[0.16em]",
          "hover:brightness-110 transition-[filter]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
        )}
      >
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-data"
        />
        Jeffrey
      </button>
    </div>
  );
}
