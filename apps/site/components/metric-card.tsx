import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { UILabel, DataValue, Body } from "@/components/typography";

/**
 * MetricCard — a single biomarker, cohort stat, or measured outcome.
 *
 * Three-line anatomy (label → value → context). Plex Mono on the label and
 * value (system + data band), Plex Sans on the context prose.
 *
 * Tone:
 *   default · white surface, subtle ink border (public pages)
 *   data    · aqua accent on the value (emphasis, still within 8% budget)
 *   inverse · midnight surface (investor room; ink-on-midnight)
 */

type Tone = "default" | "data" | "inverse";

const SURFACE: Record<Tone, string> = {
  default: "bg-surface ring-1 ring-inset ring-ink/10 text-ink",
  data: "bg-surface ring-1 ring-inset ring-ink/10 text-ink",
  inverse: "bg-[color:var(--brand-midnight)] ring-0 text-white",
};

const VALUE_COLOR: Record<Tone, string> = {
  default: "text-ink",
  data: "text-data",
  inverse: "text-white",
};

type Props = {
  label: ReactNode;
  value: ReactNode;
  unit?: string;
  context?: ReactNode;
  tone?: Tone;
  className?: string;
};

export function MetricCard({
  label,
  value,
  unit,
  context,
  tone = "default",
  className,
}: Props) {
  return (
    <article
      className={cn("p-6 md:p-8 flex flex-col gap-3", SURFACE[tone], className)}
    >
      <UILabel className={tone === "inverse" ? "text-white/70" : undefined}>
        {label}
      </UILabel>

      <div className="flex items-baseline gap-2">
        <DataValue className={cn("text-4xl md:text-5xl", VALUE_COLOR[tone])}>
          {value}
        </DataValue>
        {unit && (
          <span
            className={cn(
              "font-system text-sm",
              tone === "inverse" ? "text-white/60" : "text-ink/60"
            )}
          >
            {unit}
          </span>
        )}
      </div>

      {context && (
        <Body
          className={cn(
            "text-sm md:text-base",
            tone === "inverse" ? "text-white/80" : undefined
          )}
        >
          {context}
        </Body>
      )}
    </article>
  );
}
