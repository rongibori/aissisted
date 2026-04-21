"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { UILabel } from "@/components/typography";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * RoadmapTimeline — horizontal temporal timeline.
 *
 * Anchored to a single horizontal rail. Each node is a moment in the arc,
 * with one phrase of surface copy. The rail draws in on first view — a
 * single, quiet motion — which reads as an Apple-style reveal rather than
 * an ambient loop.
 *
 * Content is aligned with the existing Chapter 07 roadmap copy:
 *   Now      — supplements · pressed daily stick
 *   Q3 2026  — founder cohort · first customers
 *   Q1 2027  — peptide track · clinician-paired
 *   Year 02  — prescriptions · chronic meds
 *   Year 03  — diagnostics · deepened
 *
 * The final node ("Year 03") sits on the brand-red endpoint, reading as the
 * future state. Every other node is a neutral marker on the rail.
 */

type Node = {
  when: string;
  headline: string;
  body: string;
  emphasis?: boolean;
};

const NODES: Node[] = [
  {
    when: "Now",
    headline: "Pressed daily stick.",
    body: "Founder-operated. Surface-isolated investor room. Technical DD-ready.",
  },
  {
    when: "Q3 2026",
    headline: "Founder cohort.",
    body: "First cohort of customers — operators, clinicians, early adopters.",
  },
  {
    when: "Q1 2027",
    headline: "Peptide track.",
    body: "Clinician-paired peptide protocols on the same record, same cadence.",
  },
  {
    when: "Year 02",
    headline: "Prescriptions.",
    body: "Chronic-med expansion. Adherence rails extend past wellness.",
  },
  {
    when: "Year 03",
    headline: "Diagnostics, deepened.",
    body: "Partnered lab relationships compound the longitudinal record.",
    emphasis: true,
  },
];

export function RoadmapTimeline({ className }: { className?: string }) {
  const [seen, setSeen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (reduced) {
      setSeen(true);
      return;
    }
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section
      ref={ref}
      aria-labelledby="roadmap-timeline-heading"
      className={cn(
        "relative overflow-hidden",
        "bg-[color:var(--brand-midnight)] text-white",
        "py-28 md:py-36",
        className,
      )}
    >
      {/* Ambient mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 90% 20%, rgba(0,194,209,0.12) 0%, transparent 60%), radial-gradient(40% 40% at 10% 90%, rgba(238,43,55,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[88rem] px-6 md:px-10">
        {/* Heading */}
        <div
          className={cn(
            "flex items-center gap-3",
            "transition-[opacity,transform] duration-[700ms] ease-out",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          )}
        >
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
          <UILabel className="text-data">Arc · now to year three</UILabel>
        </div>
        <h2
          id="roadmap-timeline-heading"
          className={cn(
            "mt-6 max-w-4xl font-display font-bold text-white",
            "text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.03] tracking-[-0.02em]",
            "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.2,0,0,1)]",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
          )}
          style={{ transitionDelay: "120ms" }}
        >
          One rail. Five moments.
          <br className="hidden md:block" />
          <span className="text-white/55">Every node reuses the last one&rsquo;s system.</span>
        </h2>

        {/* Timeline rail — desktop */}
        <div className="mt-20 hidden md:block">
          <div className="relative">
            {/* Horizontal rail */}
            <div
              aria-hidden
              className={cn(
                "absolute left-0 right-0 top-[24px] h-px origin-left",
                "bg-[linear-gradient(to_right,rgba(255,255,255,0.25),rgba(0,194,209,0.45)_60%,rgba(238,43,55,0.55))]",
                "transition-transform duration-[2200ms] ease-[cubic-bezier(0.2,0,0,1)]",
                seen ? "scale-x-100" : "scale-x-0",
              )}
              style={{ transitionDelay: "300ms" }}
            />
            <div className="grid grid-cols-5 gap-6">
              {NODES.map((n, i) => (
                <div
                  key={n.when}
                  className={cn(
                    "relative pt-14",
                    "transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.2,0,0,1)]",
                    seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
                  )}
                  style={{ transitionDelay: `${600 + i * 140}ms` }}
                >
                  {/* Node marker */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-[18px] left-0 inline-flex items-center justify-center",
                      "h-[13px] w-[13px] rounded-full",
                      n.emphasis ? "bg-brand" : "bg-data",
                      "ring-4 ring-[color:var(--brand-midnight)]",
                    )}
                  />
                  {n.emphasis ? (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-[14px] left-[-3px] inline-flex h-[19px] w-[19px] rounded-full",
                        "bg-brand/30 motion-safe:animate-ping",
                      )}
                    />
                  ) : null}
                  <UILabel
                    className={cn(
                      n.emphasis ? "text-brand" : "text-data",
                      "tracking-[0.18em]",
                    )}
                  >
                    {n.when}
                  </UILabel>
                  <h3 className="mt-4 font-display font-bold text-white text-[clamp(1.1rem,1.5vw,1.375rem)] leading-[1.2] tracking-[-0.005em]">
                    {n.headline}
                  </h3>
                  <p className="mt-3 font-body text-[14px] leading-[1.55] text-white/70">
                    {n.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline — mobile stacked */}
        <ol className="mt-16 md:hidden relative pl-6">
          <span
            aria-hidden
            className={cn(
              "absolute left-[5px] top-1 bottom-1 w-px origin-top",
              "bg-[linear-gradient(to_bottom,rgba(255,255,255,0.25),rgba(0,194,209,0.45)_60%,rgba(238,43,55,0.55))]",
              "transition-transform duration-[2000ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "scale-y-100" : "scale-y-0",
            )}
          />
          {NODES.map((n, i) => (
            <li
              key={n.when}
              className={cn(
                "relative pb-10 last:pb-0",
                "transition-[opacity,transform] duration-[700ms] ease-out",
                seen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2",
              )}
              style={{ transitionDelay: `${500 + i * 130}ms` }}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[3px] top-[6px] h-[11px] w-[11px] rounded-full",
                  n.emphasis ? "bg-brand" : "bg-data",
                  "ring-4 ring-[color:var(--brand-midnight)]",
                )}
              />
              <UILabel
                className={cn(
                  n.emphasis ? "text-brand" : "text-data",
                  "tracking-[0.18em]",
                )}
              >
                {n.when}
              </UILabel>
              <h3 className="mt-2 font-display font-bold text-white text-[18px] leading-[1.2]">
                {n.headline}
              </h3>
              <p className="mt-2 font-body text-[14px] leading-[1.55] text-white/70">
                {n.body}
              </p>
            </li>
          ))}
        </ol>

        {/* Footer line */}
        <p
          className={cn(
            "mt-20 max-w-2xl font-body text-[15px] md:text-[17px] leading-[1.55] text-white/55",
            "transition-opacity duration-[900ms] ease-out",
            seen ? "opacity-100" : "opacity-0",
          )}
          style={{ transitionDelay: "1200ms" }}
        >
          Same record. Same intelligence. Same monthly cadence. The rails
          extend; the system does not fork.
        </p>
      </div>
    </section>
  );
}
