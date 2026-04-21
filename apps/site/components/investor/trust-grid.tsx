"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";
import { UILabel } from "@/components/typography";

/**
 * TrustGrid — six proof signals that anchor the posture.
 *
 * Each signal is a terse statement about the shape of what we've built and
 * how we operate. No logos, no fake customer counts. The signals are things
 * that are already true or explicitly committed: FHIR, surface isolation,
 * brand lock, Jeffrey persistence, operator model, and medical-board posture.
 *
 * Rendered on light surface by default; inverse variant for midnight beats.
 */

type Tone = "surface" | "midnight";

type Signal = {
  num: string;
  title: string;
  body: string;
};

const SIGNALS: Signal[] = [
  {
    num: "01",
    title: "FHIR-native intake.",
    body: "SMART-on-FHIR + MyChart from day one. We talk to Epic the way a clinician would — without faxes, scans, or CSV imports.",
  },
  {
    num: "02",
    title: "Surface isolation.",
    body: "This room runs with no PHI, no userId, no cross-session memory. The member surface runs on a separate adapter with explicit consent.",
  },
  {
    num: "03",
    title: "One canonical Jeffrey.",
    body: "A single reasoning layer, shared across chat, voice, and protocol generation. No forked copies drifting inside different features.",
  },
  {
    num: "04",
    title: "Brand discipline, locked.",
    body: "Brand Bible v1.1 is a running spec. Every color, every weight, every verb has a rule that Claude and Copilot are held to.",
  },
  {
    num: "05",
    title: "Clinician-paired expansion.",
    body: "The peptide arc ships with a medical board and partnered telehealth. The supplement rails are the floor — not the ceiling.",
  },
  {
    num: "06",
    title: "Operator on record.",
    body: "Founder-led. No agency content. Ron reads every founder-session request personally. No auto-reply, no SDR stack behind the curtain.",
  },
];

type Props = {
  tone?: Tone;
  className?: string;
};

export function TrustGrid({ tone = "surface", className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setSeen(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
            return;
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const dark = tone === "midnight";

  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px",
        dark
          ? "bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]"
          : "bg-ink/10 ring-1 ring-inset ring-ink/10",
        className,
      )}
    >
      {SIGNALS.map((s, i) => (
        <div
          key={s.num}
          className={cn(
            "relative p-7 md:p-8",
            dark ? "bg-[color:var(--brand-midnight)]" : "bg-surface",
            "transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.2,0,0,1)]",
            seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
          )}
          style={{ transitionDelay: seen ? `${100 + i * 70}ms` : "0ms" }}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                "inline-block h-1 w-1 rounded-full",
                dark ? "bg-data" : "bg-brand",
              )}
            />
            <UILabel className={dark ? "text-data/80" : "text-brand/80"}>
              {s.num}
            </UILabel>
          </div>
          <h3
            className={cn(
              "mt-5 font-display font-semibold",
              "text-lg md:text-xl leading-[1.2] tracking-[-0.01em]",
              dark ? "text-white" : "text-ink",
            )}
          >
            {s.title}
          </h3>
          <p
            className={cn(
              "mt-3 font-body text-sm md:text-[15px] leading-[1.6]",
              dark ? "text-white/70" : "text-ink/75",
            )}
          >
            {s.body}
          </p>
        </div>
      ))}
    </div>
  );
}
