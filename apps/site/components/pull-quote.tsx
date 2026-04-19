import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { ValueProp, UILabel } from "@/components/typography";

/**
 * PullQuote — the one emotional beat. Plex Serif italic, one per page max.
 *
 * Brand Bible v1.1: serif is reserved for emotional accents. UILabel
 * (Plex Mono) attributes the line. No quotation marks at the glyph level —
 * the serif + italic does the framing.
 */

type Props = {
  children: ReactNode;
  attribution?: ReactNode;
  className?: string;
};

export function PullQuote({ children, attribution, className }: Props) {
  return (
    <section
      className={cn("py-16 md:py-24", className)}
      aria-label="Pull quote"
    >
      <Container width="reading">
        <figure className="border-l-2 border-brand pl-8 md:pl-10">
          <ValueProp as="blockquote">{children}</ValueProp>
          {attribution && (
            <figcaption className="mt-6">
              <UILabel>{attribution}</UILabel>
            </figcaption>
          )}
        </figure>
      </Container>
    </section>
  );
}
