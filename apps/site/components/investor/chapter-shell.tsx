import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { H2, Lede } from "@/components/typography";
import { AskAffordance } from "./ask-affordance";
import { Reveal } from "./reveal";

/**
 * ChapterShell — single chapter container for the investor room.
 *
 * Anatomy (top → bottom):
 *   · Eyebrow (chapter number · topic slug)
 *   · H2 headline as a question
 *   · Lede (one sentence of framing)
 *   · Visual slot (charts, metric cards, diagrams, quotes)
 *   · AskAffordance — pipes a precise question into the InvestorConsole
 *
 * v2:
 *   · Wider vertical rhythm (28/40 vs 24/32) — luxury negative space.
 *   · Eyebrow → headline → lede → body → ask, each Revealed on scroll
 *     for an earned, once-only entry.
 *   · A single hairline aqua marker sits left of the eyebrow on midnight
 *     chapters, anchoring the eye like a Stripe / Linear product page.
 *
 * Tone options:
 *   · midnight   · hero/moat chapters (premium night)
 *   · graphite   · default body (slightly darker than default white)
 *   · surface    · default white (70% band)
 */

type Tone = "midnight" | "graphite" | "surface";

const SURFACE_STYLES: Record<Tone, string> = {
  midnight:
    "bg-[color:var(--brand-midnight)] text-white border-y border-white/5",
  graphite: "bg-ink/5 text-ink",
  surface: "bg-surface text-ink",
};

const EYEBROW_TONE: Record<Tone, "brand" | "data" | "muted"> = {
  midnight: "data",
  graphite: "brand",
  surface: "brand",
};

const HEADING_COLOR: Record<Tone, string> = {
  midnight: "text-white",
  graphite: "text-ink",
  surface: "text-ink",
};

const LEDE_COLOR: Record<Tone, string> = {
  midnight: "text-white/80",
  graphite: "text-ink/85",
  surface: "text-ink/85",
};

const MARKER_COLOR: Record<Tone, string> = {
  midnight: "bg-data",
  graphite: "bg-brand",
  surface: "bg-brand",
};

type Props = {
  id: string;
  chapterLabel: string; // "Chapter 03 · Moat"
  question: ReactNode; // H2 line, posed as a question
  lede?: ReactNode;
  askQuestion: string; // piped into the Jeffrey console
  askLabel?: string;
  tone?: Tone;
  children?: ReactNode;
  className?: string;
};

export function ChapterShell({
  id,
  chapterLabel,
  question,
  lede,
  askQuestion,
  askLabel,
  tone = "surface",
  children,
  className,
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        "py-28 md:py-40 scroll-mt-24",
        SURFACE_STYLES[tone],
        className,
      )}
      aria-labelledby={`${id}-heading`}
    >
      <Container width="wide">
        <Reveal>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                MARKER_COLOR[tone],
              )}
            />
            <Eyebrow tone={EYEBROW_TONE[tone]}>{chapterLabel}</Eyebrow>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <H2
            as="h2"
            className={cn(
              "mt-8 max-w-4xl",
              "text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] tracking-[-0.015em]",
              HEADING_COLOR[tone],
            )}
          >
            <span id={`${id}-heading`}>{question}</span>
          </H2>
        </Reveal>

        {lede && (
          <Reveal delayMs={160}>
            <Lede
              className={cn(
                "mt-8 max-w-2xl text-lg md:text-xl",
                LEDE_COLOR[tone],
              )}
            >
              {lede}
            </Lede>
          </Reveal>
        )}

        {children && (
          <Reveal delayMs={220}>
            <div className="mt-16 md:mt-20">{children}</div>
          </Reveal>
        )}

        <Reveal delayMs={300}>
          <div className="mt-16">
            <AskAffordance
              tone={tone === "midnight" ? "inverse" : "default"}
              question={askQuestion}
              label={askLabel}
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
