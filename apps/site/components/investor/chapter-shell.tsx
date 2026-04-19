import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { H2, Lede } from "@/components/typography";
import { AskAffordance } from "./ask-affordance";

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
        "py-24 md:py-32 scroll-mt-20",
        SURFACE_STYLES[tone],
        className,
      )}
      aria-labelledby={`${id}-heading`}
    >
      <Container width="wide">
        <Eyebrow tone={EYEBROW_TONE[tone]}>{chapterLabel}</Eyebrow>
        <H2
          as="h2"
          className={cn("mt-6 max-w-3xl", HEADING_COLOR[tone])}
        >
          <span id={`${id}-heading`}>{question}</span>
        </H2>
        {lede && (
          <Lede className={cn("mt-6 max-w-2xl", LEDE_COLOR[tone])}>
            {lede}
          </Lede>
        )}
        {children && <div className="mt-12 md:mt-16">{children}</div>}
        <div className="mt-12">
          <AskAffordance
            tone={tone === "midnight" ? "inverse" : "default"}
            question={askQuestion}
            label={askLabel}
          />
        </div>
      </Container>
    </section>
  );
}
