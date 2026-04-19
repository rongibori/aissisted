import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { H1, Lede } from "@/components/typography";

/**
 * HeroText — text-dominant hero. The default hero for pages that lead with
 * narrative (Home, How It Works, For You, Science).
 *
 * Slots:
 *   eyebrow · required · data-band anchor
 *   headline · required · H1 or RallyCry (rally cry only once per page)
 *   lede · optional · Plex Sans body at lede scale
 *   actions · optional · 1–2 buttons. Primary CTA is the 2% signal.
 *
 * Composition is tight on purpose — a hero is an act of restraint.
 */

type Props = {
  eyebrow: ReactNode;
  headline: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function HeroText({
  eyebrow,
  headline,
  lede,
  actions,
  className,
}: Props) {
  return (
    <section
      className={cn(
        "relative isolate",
        "pt-20 pb-24 md:pt-28 md:pb-32",
        className
      )}
    >
      <Container width="wide">
        <div className="max-w-4xl">
          <Eyebrow>{eyebrow}</Eyebrow>

          <div className="mt-6">
            {typeof headline === "string" ? <H1>{headline}</H1> : headline}
          </div>

          {lede && <Lede className="mt-8 max-w-2xl">{lede}</Lede>}

          {actions && (
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {actions}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
