import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { H2, UILabel, DataValue } from "@/components/typography";

/**
 * HeroMetric — metric-dominant hero. Used when a page leads with evidence
 * (Pricing, Science top-of-page, Investor Room opener).
 *
 * Layout: headline left, metric rail right on desktop; metric rail below
 * on mobile. Metrics are Plex Mono, tabular, aqua accent — the 8% data band.
 *
 * Metric count is capped at three by design. More than three is a table,
 * not a hero.
 */

type Metric = {
  label: string;
  value: string;
  unit?: string;
};

type Props = {
  eyebrow: ReactNode;
  headline: ReactNode;
  metrics: Metric[]; // 1–3 only; composition caps enforced at call site
  children?: ReactNode;
  className?: string;
};

export function HeroMetric({
  eyebrow,
  headline,
  metrics,
  children,
  className,
}: Props) {
  const trimmed = metrics.slice(0, 3);

  return (
    <section
      className={cn(
        "relative isolate",
        "pt-20 pb-24 md:pt-28 md:pb-32",
        className
      )}
    >
      <Container width="wide">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <Eyebrow>{eyebrow}</Eyebrow>
            <div className="mt-6">
              {typeof headline === "string" ? <H2>{headline}</H2> : headline}
            </div>
            {children && <div className="mt-8">{children}</div>}
          </div>

          <div className="md:col-span-5">
            <div className="grid gap-8 border-l border-ink/10 pl-8">
              {trimmed.map((metric) => (
                <div key={metric.label} className="flex flex-col gap-1">
                  <UILabel>{metric.label}</UILabel>
                  <div className="flex items-baseline gap-2">
                    <DataValue className="text-4xl md:text-5xl text-data">
                      {metric.value}
                    </DataValue>
                    {metric.unit && (
                      <span className="font-system text-sm text-ink/60">
                        {metric.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
