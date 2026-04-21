"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { H4, Body, UILabel, JeffreySystem } from "@/components/typography";
import { RequestDeckModal } from "./request-deck-modal";
import { WaitlistForm } from "./waitlist-form";

/**
 * InvestorCTAGrid — three side-by-side conversion modules on the final chapter.
 *
 *   1. Request deck     · opens private modal, submits to /api/investor/request-deck
 *   2. Book founder call · Calendly or mailto-first
 *   3. Join waitlist    · inline email capture, /api/investor/waitlist
 *
 * Midnight-inverse tone. Aqua signal. Generous negative space.
 * Stacks on mobile with full-bleed card treatment.
 */

export function InvestorCTAGrid({
  calendlyUrl,
}: {
  calendlyUrl?: string;
}) {
  const [deckOpen, setDeckOpen] = useState(false);
  const bookHref =
    calendlyUrl ??
    "mailto:ron@aissisted.com?subject=Founder%20session%20%E2%80%94%20Aissisted";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
        {/* 01 — Request deck */}
        <article
          className={cn(
            "relative flex flex-col",
            "p-7 md:p-8 min-h-[300px]",
            "bg-white/[0.04] ring-1 ring-inset ring-white/10",
            "transition-[background,transform] duration-300 ease-out",
            "hover:bg-white/[0.06] hover:-translate-y-[2px]",
          )}
        >
          <Ribbon>01 · Private</Ribbon>
          <H4 as="h3" className="mt-5 text-white">
            Request the deck.
          </H4>
          <Body className="mt-3 text-white/75 text-sm md:text-base">
            Deck and data room, sent after a short review. Ron writes the
            note personally. No auto-reply.
          </Body>
          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={() => setDeckOpen(true)}
              className={cn(
                "inline-flex items-center gap-3 h-11 px-5",
                "bg-data text-[color:var(--brand-midnight)]",
                "font-system text-[11px] font-semibold uppercase tracking-[0.16em]",
                "hover:brightness-110 transition-[filter]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--brand-midnight)]",
              )}
            >
              Request deck
              <span aria-hidden>→</span>
            </button>
          </div>
        </article>

        {/* 02 — Book founder call */}
        <article
          className={cn(
            "relative flex flex-col",
            "p-7 md:p-8 min-h-[300px]",
            "bg-white/[0.06] ring-1 ring-inset ring-white/15",
            "transition-[background,transform] duration-300 ease-out",
            "hover:bg-white/[0.08] hover:-translate-y-[2px]",
          )}
        >
          <Ribbon highlighted>02 · Founder session</Ribbon>
          <H4 as="h3" className="mt-5 text-white">
            Book a working session.
          </H4>
          <Body className="mt-3 text-white/75 text-sm md:text-base">
            Forty-five minutes. Ron + Jeffrey. The thesis, the model, the
            product — walked live, not pitched.
          </Body>
          <div className="mt-auto pt-8">
            <a
              href={bookHref}
              target={calendlyUrl ? "_blank" : undefined}
              rel={calendlyUrl ? "noopener noreferrer" : undefined}
              className={cn(
                "inline-flex items-center gap-3 h-11 px-5",
                "bg-white text-[color:var(--brand-midnight)]",
                "font-system text-[11px] font-semibold uppercase tracking-[0.16em]",
                "hover:brightness-110 transition-[filter]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--brand-midnight)]",
              )}
            >
              Book founder call
              <span aria-hidden>→</span>
            </a>
            <JeffreySystem className="mt-3 block text-white/45">
              {calendlyUrl ? "Opens in a new tab" : "Opens your mail client"}
            </JeffreySystem>
          </div>
        </article>

        {/* 03 — Join waitlist */}
        <article
          className={cn(
            "relative flex flex-col",
            "p-7 md:p-8 min-h-[300px]",
            "bg-white/[0.04] ring-1 ring-inset ring-white/10",
            "transition-[background] duration-300 ease-out",
            "hover:bg-white/[0.06]",
          )}
        >
          <Ribbon>03 · Watchlist</Ribbon>
          <H4 as="h3" className="mt-5 text-white">
            Watch the build.
          </H4>
          <Body className="mt-3 text-white/75 text-sm md:text-base">
            If the timing isn't now, stay close. Rare updates when milestones
            warrant them — nothing else.
          </Body>
          <div className="mt-auto pt-6">
            <WaitlistForm tone="inverse" label="Your email" />
          </div>
        </article>
      </div>

      <RequestDeckModal open={deckOpen} onClose={() => setDeckOpen(false)} />
    </>
  );
}

function Ribbon({
  children,
  highlighted,
}: {
  children: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          highlighted ? "bg-data shadow-[0_0_0_4px_rgba(0,194,209,0.18)]" : "bg-data/70",
        )}
      />
      <UILabel className={highlighted ? "text-data" : "text-white/55"}>
        {children}
      </UILabel>
    </div>
  );
}
