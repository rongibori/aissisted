"use client";

import { cn } from "@/lib/cn";

/**
 * AskAffordance — inline button at the base of each chapter that opens the
 * InvestorConsole and pipes a precise question in.
 *
 * The console listens for the `aissisted:ask-jeffrey` window event; this
 * component dispatches it so the page doesn't need to own console state.
 *
 * Two tones:
 *   · default   · for white/graphite chapter surfaces
 *   · inverse   · for midnight chapters (hero, moat)
 */

type Props = {
  question: string;
  label?: string;
  tone?: "default" | "inverse";
  className?: string;
};

export function AskAffordance({
  question,
  label = "Ask Jeffrey about this",
  tone = "default",
  className,
}: Props) {
  function dispatch() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("aissisted:ask-jeffrey", {
        detail: { question },
      }),
    );
  }

  const isInverse = tone === "inverse";

  return (
    <button
      type="button"
      onClick={dispatch}
      className={cn(
        "group inline-flex items-center gap-3",
        "font-system text-xs font-medium uppercase tracking-[0.16em]",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2",
        isInverse
          ? "text-white/75 hover:text-white focus-visible:ring-offset-[color:var(--brand-midnight)]"
          : "text-ink/75 hover:text-ink focus-visible:ring-offset-[color:var(--brand-surface)]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          "bg-data",
          "transition-transform duration-150",
          "group-hover:scale-125",
        )}
      />
      {label}
      <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">
        →
      </span>
    </button>
  );
}
