"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { UILabel, Body } from "@/components/typography";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * DataFlywheel — the moat visual.
 *
 * Six stations arranged around a circle. Each station is a node in the
 * compounding loop: labs → wearables → adherence → cohort intelligence →
 * better protocols → more signal.
 *
 * v2 motion: orbit ring drifts slowly clockwise; aqua arcs run a one-shot
 * draw-in on first view; the core breathes with a soft aqua glow. All
 * motion is honored against `prefers-reduced-motion`.
 *
 * Tone: inverse (midnight canvas), aqua accents only. White text.
 */

type Node = {
  id: string;
  label: string;
  caption: string;
};

const NODES: Node[] = [
  {
    id: "labs",
    label: "01 · Labs",
    caption: "Epic + diagnostics intake. Biomarkers normalized, longitudinal.",
  },
  {
    id: "wearables",
    label: "02 · Wearables",
    caption: "WHOOP, Apple, Oura. HRV, recovery, sleep, load — continuous.",
  },
  {
    id: "protocol",
    label: "03 · Protocol",
    caption: "Deterministic rules engine. Explainable. Auditable.",
  },
  {
    id: "adherence",
    label: "04 · Adherence",
    caption: "Pre-mixed daily dose. Ownership over consumption.",
  },
  {
    id: "response",
    label: "05 · Response",
    caption: "Re-test. Wearable delta. Jeffrey re-weights the protocol.",
  },
  {
    id: "intelligence",
    label: "06 · Intelligence",
    caption: "Cohort signal. The system learns the individual.",
  },
];

export function DataFlywheel({ className }: { className?: string }) {
  const size = 560;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 200;

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
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const points = NODES.map((_, i) => {
    const angle = (i / NODES.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });

  const arcCircumference = (2 * Math.PI * radius) / NODES.length;

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <div className="mx-auto max-w-3xl">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-auto"
          role="img"
          aria-label="Aissisted data flywheel — labs, wearables, protocol, adherence, response, intelligence"
        >
          {/* Outer drifting ring */}
          <g
            className={cn(
              "origin-center",
              !reduced && "[transform-box:fill-box]",
              !reduced && "motion-safe:[animation:flywheel-drift_60s_linear_infinite]",
            )}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            <circle
              cx={cx}
              cy={cy}
              r={radius + 14}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
              strokeDasharray="2 6"
            />
          </g>

          {/* Orbit ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />

          {/* Inner core — soft breathing glow */}
          <g style={{ transformOrigin: `${cx}px ${cy}px` }}>
            <circle
              cx={cx}
              cy={cy}
              r={84}
              fill="rgba(0,194,209,0.04)"
              className={cn(
                !reduced && "motion-safe:[animation:flywheel-pulse_4.6s_ease-in-out_infinite]",
              )}
            />
            <circle
              cx={cx}
              cy={cy}
              r={64}
              fill="rgba(0,194,209,0.08)"
              stroke="rgba(0,194,209,0.35)"
              strokeWidth={1}
            />
          </g>

          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fill="white"
            fontFamily="var(--font-system, 'IBM Plex Mono', monospace)"
            fontSize={10}
            letterSpacing={2}
            opacity={0.7}
          >
            AISSISTED
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fill="#00C2D1"
            fontFamily="var(--font-system, 'IBM Plex Mono', monospace)"
            fontSize={12}
            letterSpacing={2}
          >
            CORE
          </text>

          {/* Spokes */}
          {points.map((p, i) => (
            <line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}

          {/* Arrow arcs between nodes — staged draw-in on first view */}
          {points.map((p, i) => {
            const next = points[(i + 1) % points.length];
            const drawDelay = 200 + i * 140;
            return (
              <path
                key={`arc-${i}`}
                d={`M ${p.x} ${p.y} A ${radius} ${radius} 0 0 1 ${next.x} ${next.y}`}
                fill="none"
                stroke="rgba(0,194,209,0.55)"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeDasharray={arcCircumference}
                strokeDashoffset={seen ? 0 : arcCircumference}
                style={{
                  transition:
                    "stroke-dashoffset 1100ms cubic-bezier(0.2,0,0,1)",
                  transitionDelay: `${drawDelay}ms`,
                }}
              />
            );
          })}

          {/* Nodes — soft halo + center dot */}
          {points.map((p, i) => (
            <g key={`node-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={18}
                fill="none"
                stroke="rgba(0,194,209,0.35)"
                strokeWidth={1}
                opacity={seen ? 1 : 0}
                style={{
                  transition: "opacity 400ms ease-out",
                  transitionDelay: `${300 + i * 140}ms`,
                }}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={10}
                fill="#00C2D1"
                opacity={seen ? 1 : 0}
                style={{
                  transition: "opacity 400ms ease-out",
                  transitionDelay: `${300 + i * 140}ms`,
                }}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Caption grid */}
      <ul
        className={cn(
          "mt-12 grid gap-6",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {NODES.map((n, i) => (
          <li
            key={n.id}
            className={cn(
              "p-5",
              "bg-white/5 ring-1 ring-inset ring-white/10",
              "transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
            style={{ transitionDelay: `${500 + i * 80}ms` }}
          >
            <UILabel className="text-data">{n.label}</UILabel>
            <Body className="mt-2 text-sm text-white/80">{n.caption}</Body>
          </li>
        ))}
      </ul>

      {/* Local keyframes — scoped global so Tailwind animation utilities can resolve them */}
      <style jsx global>{`
        @keyframes flywheel-drift {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes flywheel-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}
