import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { H3, Body, UILabel } from "@/components/typography";

/**
 * GatedRoomCTA — the "Investor Room" ask. Appears on marketing pages where
 * an investor might land. Midnight surface (secondary band), aqua accent on
 * the value line, single secondary CTA.
 *
 * No raise size, band, or valuation copy — ever. This block routes intent,
 * it doesn't answer the ask. Ron lock.
 */

type Props = {
  eyebrow?: ReactNode;
  headline?: ReactNode;
  body?: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

export function GatedRoomCTA({
  eyebrow = "Investor room",
  headline = "For the investors we've already started talking to.",
  body = "Gated detail, founder-meeting routing, and the long-form thesis live inside. Access by invite.",
  ctaLabel = "Request access",
  ctaHref = "/request-access",
  className,
}: Props) {
  return (
    <section
      className={cn(
        "bg-[color:var(--brand-midnight)] text-white",
        "py-20 md:py-28",
        className
      )}
      aria-label="Investor room"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <UILabel className="text-data">{eyebrow}</UILabel>
          <H3 as="p" className="mt-4 text-white">
            {headline}
          </H3>
          <Body className="mt-6 text-white/75">{body}</Body>

          <div className="mt-10">
            <Link
              href={ctaHref}
              className={cn(
                "inline-flex h-11 items-center px-6",
                "bg-white text-[color:var(--brand-midnight)]",
                "font-system text-xs font-medium uppercase tracking-[0.16em]",
                "hover:bg-white/90 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--brand-midnight)]"
              )}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
