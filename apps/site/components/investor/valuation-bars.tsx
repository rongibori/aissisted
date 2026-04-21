import { cn } from "@/lib/cn";
import { UILabel, DataValue, Body } from "@/components/typography";

/**
 * ValuationBars — illustrative comparable valuation bars.
 *
 * Inverse-tone (midnight) horizontal bar visual for the comparables chapter.
 * Server-rendered SVG; widths are normalized against the largest value so
 * the eye reads multiples instantly without us claiming a price tag.
 *
 * Ron lock: every label is illustrative · "anchor", not a forecast.
 */

type Comp = {
  id: string;
  name: string;
  band: string; // "Continuous diagnostics", etc.
  /** Relative magnitude — used only to scale the bar. Caption carries the real number. */
  magnitude: number;
  /** Caption right of the bar; e.g. "$18.5B exit · 2020". */
  caption: string;
};

const ROWS: Comp[] = [
  {
    id: "livongo",
    name: "Livongo",
    band: "Data-compounding chronic care",
    magnitude: 18.5,
    caption: "$18.5B exit · 2020 (Teladoc)",
  },
  {
    id: "oura",
    name: "Oura",
    band: "Wearable · subscription",
    magnitude: 5.2,
    caption: "$5.2B last secondary · 2024",
  },
  {
    id: "hims",
    name: "Hims & Hers",
    band: "Telehealth · personalization",
    magnitude: 4.6,
    caption: "Public · recurring revenue",
  },
  {
    id: "function",
    name: "Function Health",
    band: "Continuous diagnostics",
    magnitude: 2.5,
    caption: "Member-funded · price anchor",
  },
];

export function ValuationBars({ className }: { className?: string }) {
  const max = Math.max(...ROWS.map((r) => r.magnitude));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between mb-6">
        <UILabel className="text-data">Comparable scale · illustrative</UILabel>
        <UILabel className="text-white/50 hidden sm:inline">
          Bars are relative magnitudes · not a forecast
        </UILabel>
      </div>

      <ul className="flex flex-col gap-5">
        {ROWS.map((r) => {
          const pct = Math.round((r.magnitude / max) * 100);
          return (
            <li key={r.id} className="group">
              <div className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <DataValue className="text-white text-base md:text-lg">
                    {r.name}
                  </DataValue>
                  <span className="ml-3 font-system text-[11px] uppercase tracking-[0.16em] text-white/45">
                    {r.band}
                  </span>
                </div>
                <span className="font-system text-xs text-white/55 shrink-0">
                  {r.caption}
                </span>
              </div>
              <div
                role="img"
                aria-label={`${r.name} relative scale ${pct} percent`}
                className="mt-2 h-[6px] w-full bg-white/[0.06] overflow-hidden"
              >
                <span
                  className={cn(
                    "block h-full bg-data origin-left",
                    "transition-transform duration-[1100ms] ease-[cubic-bezier(0.2,0,0,1)]",
                    "[transform:scaleX(0)] group-[.is-revealed]:[transform:scaleX(var(--scale))]",
                  )}
                  style={
                    {
                      // Static fallback: render at full pct so server HTML still
                      // reads. The reveal class on a parent toggles the kinetic
                      // animation on the client when desired.
                      transform: `scaleX(${pct / 100})`,
                      ["--scale" as any]: `${pct / 100}`,
                    } as React.CSSProperties
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>

      <Body className="mt-8 text-sm text-white/55 max-w-2xl">
        Bars are not pricing claims. They show the order of magnitude that
        each mechanic — diagnostics, wearable, telehealth, data-compounding
        care — already cleared in market. The data room contains the working
        comparables analysis.
      </Body>
    </div>
  );
}
