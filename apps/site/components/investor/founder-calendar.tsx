"use client";

import { cn } from "@/lib/cn";
import { UILabel, JeffreySystem } from "@/components/typography";

/**
 * FounderCalendar — direct-booking surface for founder-call / founder-session
 * intents inside the RequestDeckModal.
 *
 * Renders a short explainer + primary "Book time directly" button that opens
 * NEXT_PUBLIC_FOUNDER_CALENDAR_URL in a new tab. If the env var is unset, the
 * component renders nothing — no broken calendar CTA.
 *
 * Lead form remains primary. The calendar is a parallel path for investors
 * who want to skip the form and grab a slot.
 */

const CAL_URL = process.env.NEXT_PUBLIC_FOUNDER_CALENDAR_URL ?? "";
const CAL_LABEL = process.env.NEXT_PUBLIC_FOUNDER_CALENDAR_LABEL ?? "Book on calendar";

export function FounderCalendar({ className }: { className?: string }) {
  if (!CAL_URL) return null;

  return (
    <div
      className={cn(
        "mt-2 p-4 md:p-5 bg-white/[0.04] ring-1 ring-inset ring-white/10",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
        <UILabel className="text-data">Or · book direct</UILabel>
      </div>
      <p className="mt-3 font-body text-[14px] leading-[1.55] text-white/75">
        Grab a 30-minute slot on the founder's calendar. Working session — you'll walk the live product end-to-end.
      </p>
      <a
        href={CAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mt-4 inline-flex items-center h-10 px-4",
          "bg-transparent text-data",
          "ring-1 ring-inset ring-data/40 hover:ring-data/80",
          "font-system text-[11px] font-semibold uppercase tracking-[0.16em]",
          "transition-[ring,color] duration-200",
        )}
      >
        {CAL_LABEL} →
      </a>
      <JeffreySystem className="mt-3 block text-white/40">
        Opens in new tab · privacy-respecting · no cookies set on aissisted.com.
      </JeffreySystem>
    </div>
  );
}
