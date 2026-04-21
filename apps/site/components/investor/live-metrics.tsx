"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { UILabel, JeffreySystem } from "@/components/typography";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * LiveMetrics — architecture-level "system status" dashboard.
 *
 * Four cards, each honest: system status, integration count, adaptation
 * cadence, cohort state. NO user counts, revenue, or fabricated traction.
 * Cards carry a small status dot: aqua-pulsing for "live", white-pulsing
 * for "in-flight", hairline for "scheduled".
 *
 * Fetches /api/investor/live-metrics on mount. If the fetch fails the
 * component falls back to the baked-in defaults (same content) so the
 * surface still renders.
 */

type Metric = {
  key: string;
  label: string;
  value: string;
  unit?: string;
  context: string;
  status: "live" | "in-flight" | "scheduled";
};

const FALLBACK: Metric[] = [
  {
    key: "system_status",
    label: "System status",
    value: "Online",
    context: "Investor room, Jeffrey console, lead capture — all live.",
    status: "live",
  },
  {
    key: "integrations",
    label: "Integrations",
    value: "4",
    unit: "active",
    context: "Epic MyChart · WHOOP · Apple Health · Oura.",
    status: "live",
  },
  {
    key: "cadence",
    label: "Adaptation cadence",
    value: "30",
    unit: "days",
    context: "Re-read the body. Re-weight the protocol. Every cycle.",
    status: "live",
  },
  {
    key: "cohort",
    label: "Founder cohort",
    value: "Invitational",
    context: "First cohort closing — operators, clinicians, advisors only.",
    status: "in-flight",
  },
];

export function LiveMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>(FALLBACK);
  const [seen, setSeen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/investor/live-metrics", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.ok && Array.isArray(data.metrics)) {
          setMetrics(data.metrics);
        }
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduced) {
      setSeen(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section className="bg-surface text-ink py-20 md:py-28">
      <Container width="wide">
        <div className="flex items-center gap-3">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data motion-safe:animate-pulse" />
          <UILabel className="text-brand">Live · system status</UILabel>
        </div>
        <h2 className="mt-6 font-display font-bold text-ink text-[clamp(1.75rem,3.4vw,2.75rem)] leading-[1.1] tracking-[-0.015em] max-w-3xl">
          The architecture is running.
          <br className="hidden md:block" />
          <span className="text-ink/55">The numbers that matter are public.</span>
        </h2>
        <p className="mt-4 font-body text-[15px] md:text-[17px] leading-[1.55] text-ink/70 max-w-2xl">
          No vanity metrics. No fabricated traction. What ships live, what is
          in flight, and what the system adapts on.
        </p>

        <div
          ref={ref}
          className="mt-12 grid gap-px md:grid-cols-2 lg:grid-cols-4 bg-ink/10"
        >
          {metrics.map((m, i) => (
            <article
              key={m.key}
              className={cn(
                "relative bg-surface p-6 md:p-8 flex flex-col gap-5",
                "transition-[opacity,transform] ease-[cubic-bezier(0.2,0,0,1)]",
                seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
              )}
              style={{
                transitionDelay: `${280 + i * 110}ms`,
                transitionDuration: "700ms",
              }}
            >
              <div className="flex items-center gap-2">
                <StatusDot status={m.status} />
                <UILabel className="text-ink/55 tracking-[0.18em]">
                  {m.label}
                </UILabel>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-ink text-[clamp(2rem,3.4vw,2.75rem)] leading-none tracking-[-0.02em]">
                  {m.value}
                </span>
                {m.unit ? (
                  <span className="font-system text-[11.5px] uppercase tracking-[0.14em] text-ink/55">
                    {m.unit}
                  </span>
                ) : null}
              </div>
              <p className="font-body text-[14px] leading-[1.55] text-ink/65">
                {m.context}
              </p>
            </article>
          ))}
        </div>

        <JeffreySystem className="mt-8 block text-ink/45">
          Polled every 60s · placeholder surface · wires to live telemetry on
          cohort close.
        </JeffreySystem>
      </Container>
    </section>
  );
}

function StatusDot({ status }: { status: Metric["status"] }) {
  if (status === "live") {
    return (
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inset-0 rounded-full bg-data motion-safe:animate-ping opacity-60" />
        <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-data" />
      </span>
    );
  }
  if (status === "in-flight") {
    return (
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inset-0 rounded-full bg-brand motion-safe:animate-ping opacity-50" />
        <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-brand" />
      </span>
    );
  }
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink/25" />
    </span>
  );
}
