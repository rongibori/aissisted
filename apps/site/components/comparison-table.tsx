import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * ComparisonTable — Aissisted vs. the alternative. Category rows, two
 * columns, clean rule-lines. Plex Mono on column heads (system), Plex Sans
 * on row labels + cell values.
 *
 * Rules:
 *   · No check/cross emoji. The typography and the aqua accent do the work.
 *   · "Aissisted" column is emphasized; the other column is muted.
 *   · Never more than 6 rows. Brevity is the argument.
 */

type Row = {
  category: string;
  left: ReactNode; // Aissisted
  right: ReactNode; // the alternative
};

type Props = {
  rows: Row[];
  leftLabel?: string; // default "Aissisted"
  rightLabel: string; // e.g. "Typical supplement shelf"
  className?: string;
};

export function ComparisonTable({
  rows,
  leftLabel = "Aissisted",
  rightLabel,
  className,
}: Props) {
  const trimmed = rows.slice(0, 6);

  return (
    <div
      className={cn(
        "w-full border-y border-ink/10",
        "bg-surface",
        className
      )}
      role="table"
      aria-label={`Comparison: ${leftLabel} vs ${rightLabel}`}
    >
      <div
        className={cn(
          "grid grid-cols-[1.2fr_1fr_1fr] gap-6 py-4",
          "border-b border-ink/10"
        )}
        role="row"
      >
        <div role="columnheader" aria-hidden="true" />
        <div role="columnheader">
          <span className="font-system text-xs font-medium uppercase tracking-[0.18em] text-brand">
            {leftLabel}
          </span>
        </div>
        <div role="columnheader">
          <span className="font-system text-xs font-medium uppercase tracking-[0.18em] text-ink/50">
            {rightLabel}
          </span>
        </div>
      </div>

      {trimmed.map((row, i) => (
        <div
          key={row.category}
          className={cn(
            "grid grid-cols-[1.2fr_1fr_1fr] gap-6 py-6",
            i !== trimmed.length - 1 && "border-b border-ink/5"
          )}
          role="row"
        >
          <div role="rowheader">
            <span className="font-system text-xs uppercase tracking-[0.18em] text-ink/60">
              {row.category}
            </span>
          </div>
          <div role="cell" className="font-body text-base text-ink">
            {row.left}
          </div>
          <div role="cell" className="font-body text-base text-ink/55">
            {row.right}
          </div>
        </div>
      ))}
    </div>
  );
}
