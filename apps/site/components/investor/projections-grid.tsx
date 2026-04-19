import { cn } from "@/lib/cn";
import { MetricCard } from "@/components/metric-card";
import { Body, UILabel } from "@/components/typography";

/**
 * ProjectionsGrid — illustrative, not a pro forma.
 *
 * Ron lock: no raise size anywhere, and every projection is labeled
 * "illustrative" so we never promise a number on the marketing surface.
 * The true model lives in the data room. This grid exists to give Jeffrey
 * a surface to reason over when asked — not to pitch a number.
 */

type Row = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  context: string;
};

const ROWS: Row[] = [
  {
    id: "cohort",
    label: "Year 1 · active members",
    value: "5–8",
    unit: "k",
    context:
      "Paid, protocol-active. Illustrative. Waitlist depth informs range.",
  },
  {
    id: "arpu",
    label: "Year 1 · blended ARPU",
    value: "$2.4",
    unit: "k",
    context:
      "Supplement subscription + diagnostics pass-through. Illustrative.",
  },
  {
    id: "gm",
    label: "Steady-state gross margin",
    value: "62–68",
    unit: "%",
    context:
      "Formulation + fulfillment at scale. Excludes diagnostics pass-through.",
  },
  {
    id: "payback",
    label: "CAC payback",
    value: "< 9",
    unit: "mo",
    context:
      "Targeted. Assumes concierge-led onboarding and referred-in members.",
  },
  {
    id: "retention",
    label: "12-month retention",
    value: "> 70",
    unit: "%",
    context:
      "Target. Personalization + adherence loop drive the compounding.",
  },
  {
    id: "y3-arr",
    label: "Year 3 · ARR (illustrative)",
    value: "$60–90",
    unit: "M",
    context:
      "Scenario frame. Real model and drivers live in the data room.",
  },
];

export function ProjectionsGrid({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <UILabel className="text-white/55">
        Illustrative — not a forecast · see data room for the model
      </UILabel>
      <ul
        className={cn(
          "grid gap-5",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {ROWS.map((r) => (
          <li key={r.id}>
            <MetricCard
              tone="inverse"
              label={r.label}
              value={r.value}
              unit={r.unit}
              context={r.context}
            />
          </li>
        ))}
      </ul>
      <Body className="text-white/65 text-sm max-w-2xl">
        Projections are placeholders for narrative framing on this page. The
        underlying unit economics, cohort modeling, and scenarios are available
        in the data room on request.
      </Body>
    </div>
  );
}
