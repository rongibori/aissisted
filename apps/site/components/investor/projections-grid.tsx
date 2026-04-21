import { cn } from "@/lib/cn";
import { MetricCard } from "@/components/metric-card";
import { Body, UILabel } from "@/components/typography";
import { KineticNumber } from "./kinetic-number";

/**
 * ProjectionsGrid — illustrative, not a pro forma.
 *
 * Ron lock: no raise size anywhere, and every projection is labeled
 * "illustrative" so we never promise a number on the marketing surface.
 * The true model lives in the data room. This grid exists to give Jeffrey
 * a surface to reason over when asked — not to pitch a number.
 *
 * v2: numbers count up on first view via KineticNumber for a luxury-tech
 * cue that "this is live, this is data" — without claiming forecasted truth.
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
    context: "Paid, protocol-active. Range governed by waitlist depth.",
  },
  {
    id: "arpu",
    label: "Year 1 · blended ARPU",
    value: "$2.4",
    unit: "k",
    context: "Subscription + diagnostics pass-through. Illustrative.",
  },
  {
    id: "gm",
    label: "Steady-state gross margin",
    value: "62–68",
    unit: "%",
    context: "Formulation + fulfillment at scale. Excludes pass-through.",
  },
  {
    id: "payback",
    label: "CAC payback",
    value: "< 9",
    unit: "mo",
    context: "Concierge-led onboarding. Referred-in members.",
  },
  {
    id: "retention",
    label: "12-month retention",
    value: "> 70",
    unit: "%",
    context: "Personalization + adherence loop. The compounding edge.",
  },
  {
    id: "y3-arr",
    label: "Year 3 · ARR (illustrative)",
    value: "$60–90",
    unit: "M",
    context: "Scenario frame. Drivers and cohorts live in the data room.",
  },
];

export function ProjectionsGrid({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-10", className)}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
        <UILabel className="text-data">
          Illustrative — not a forecast · model in the data room
        </UILabel>
      </div>
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
              value={<KineticNumber value={r.value} />}
              unit={r.unit}
              context={r.context}
            />
          </li>
        ))}
      </ul>
      <Body className="text-white/65 text-sm max-w-2xl">
        Public-surface projections are framed for narrative. The cohort model,
        unit economics, and sensitivity ranges live in the data room — sent
        after a short review.
      </Body>
    </div>
  );
}
