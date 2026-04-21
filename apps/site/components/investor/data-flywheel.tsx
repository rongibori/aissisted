import { cn } from "@/lib/cn";
import { UILabel, Body } from "@/components/typography";

/**
 * DataFlywheel — the moat visual.
 *
 * Six stations arranged around a circle. Each station is a node in the
 * compounding loop: labs → wearables → adherence → cohort intelligence →
 * better protocols → more signal. Rendered server-side SVG, no JS needed.
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
    caption: "Epic + labs intake. Biomarkers normalized, longitudinal.",
  },
  {
    id: "wearables",
    label: "02 · Wearables",
    caption: "WHOOP, Apple, Oura. Recovery, HRV, sleep, load — real-time.",
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
    caption: "Cohort-level signal. The system learns the individual.",
  },
];

export function DataFlywheel({ className }: { className?: string }) {
  const size = 560;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 200;

  const points = NODES.map((_, i) => {
    const angle = (i / NODES.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });

  return (
    <div className={cn("w-full", className)}>
      <div className="mx-auto max-w-3xl">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-auto"
          role="img"
          aria-label="Aissisted data flywheel — labs, wearables, protocol, adherence, response, intelligence"
        >
          {/* Orbit ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
          {/* Inner core */}
          <circle
            cx={cx}
            cy={cy}
            r={64}
            fill="rgba(0,194,209,0.08)"
            stroke="rgba(0,194,209,0.35)"
            strokeWidth={1}
          />
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

          {/* Arrow arcs between nodes */}
          {points.map((p, i) => {
            const next = points[(i + 1) % points.length];
            return (
              <path
                key={`arc-${i}`}
                d={`M ${p.x} ${p.y} A ${radius} ${radius} 0 0 1 ${next.x} ${next.y}`}
                fill="none"
                stroke="rgba(0,194,209,0.5)"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            );
          })}

          {/* Nodes */}
          {points.map((p, i) => (
            <g key={`node-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={10}
                fill="#00C2D1"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={18}
                fill="none"
                stroke="rgba(0,194,209,0.35)"
                strokeWidth={1}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Caption grid */}
      <ul
        className={cn(
          "mt-10 grid gap-6",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {NODES.map((n) => (
          <li
            key={n.id}
            className={cn(
              "p-5",
              "bg-white/5 ring-1 ring-inset ring-white/10",
            )}
          >
            <UILabel className="text-data">{n.label}</UILabel>
            <Body className="mt-2 text-sm text-white/80">{n.caption}</Body>
          </li>
        ))}
      </ul>
    </div>
  );
}
