import { cn } from "@/lib/cn";
import { UILabel, DataValue, Body, H4 } from "@/components/typography";

/**
 * ComparablesRow — side-by-side framing for category benchmarks.
 *
 * Not a pricing claim. Illustrative analog. Each card names a comparable,
 * why it's the right frame, and the lens (retention / moat / category).
 *
 * Rendered inverse (midnight-tone) so it sits cleanly inside midnight chapters.
 */

type Tone = "default" | "inverse";

export type Comparable = {
  id: string;
  name: string;
  category: string;
  frame: string;
  metric: { label: string; value: string; note?: string };
};

const DEFAULTS: Comparable[] = [
  {
    id: "function",
    name: "Function Health",
    category: "Continuous diagnostics · membership",
    frame:
      "Sets the precedent that consumers will pay for longitudinal biomarker tracking.",
    metric: {
      label: "Price anchor",
      value: "$499",
      note: "annual membership",
    },
  },
  {
    id: "livongo",
    name: "Livongo (acq. Teladoc)",
    category: "Data-compounding chronic care",
    frame:
      "Proved that wearable + adherence data loops drive outsized enterprise multiples.",
    metric: {
      label: "Exit",
      value: "$18.5B",
      note: "2020 all-stock acquisition",
    },
  },
  {
    id: "oura",
    name: "Oura",
    category: "Wearable · biometric subscription",
    frame:
      "Hardware + subscription path; mainstreamed HRV and readiness as language.",
    metric: {
      label: "Valuation (last)",
      value: "$5.2B",
      note: "2024 secondary",
    },
  },
  {
    id: "hims",
    name: "Hims & Hers",
    category: "Telehealth-native personalization",
    frame:
      "Consumer pull for recurring personalized formulations works at scale.",
    metric: {
      label: "Category signal",
      value: "Public",
      note: "subscriptions, repeat revenue",
    },
  },
];

type Props = {
  comps?: Comparable[];
  tone?: Tone;
  className?: string;
};

export function ComparablesRow({
  comps = DEFAULTS,
  tone = "inverse",
  className,
}: Props) {
  const isInverse = tone === "inverse";
  return (
    <ul
      className={cn(
        "grid gap-6",
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {comps.map((c) => (
        <li
          key={c.id}
          className={cn(
            "p-6 flex flex-col gap-4",
            isInverse
              ? "bg-white/5 ring-1 ring-inset ring-white/10 text-white"
              : "bg-surface ring-1 ring-inset ring-ink/10 text-ink",
          )}
        >
          <UILabel
            className={isInverse ? "text-data" : "text-brand"}
          >
            {c.category}
          </UILabel>
          <H4
            as="h3"
            className={isInverse ? "text-white" : "text-ink"}
          >
            {c.name}
          </H4>
          <Body
            className={cn(
              "text-sm md:text-base",
              isInverse ? "text-white/75" : "text-ink/80",
            )}
          >
            {c.frame}
          </Body>
          <div
            className={cn(
              "mt-auto pt-4 border-t",
              isInverse ? "border-white/10" : "border-ink/10",
            )}
          >
            <UILabel
              className={isInverse ? "text-white/60" : "text-ink/60"}
            >
              {c.metric.label}
            </UILabel>
            <div className="mt-1.5 flex items-baseline gap-2">
              <DataValue
                className={cn(
                  "text-2xl",
                  isInverse ? "text-white" : "text-ink",
                )}
              >
                {c.metric.value}
              </DataValue>
              {c.metric.note && (
                <span
                  className={cn(
                    "font-system text-xs",
                    isInverse ? "text-white/55" : "text-ink/55",
                  )}
                >
                  {c.metric.note}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
