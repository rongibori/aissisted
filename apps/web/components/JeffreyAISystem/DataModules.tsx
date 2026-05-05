"use client";

/**
 * AISSISTED — Data Modules
 *
 * The 7 modules orbiting the AI Core. Each is a flat HTML/Tailwind card
 * positioned in the canvas via @react-three/drei's <Html> overlay so we get
 * crisp text + sparklines without rasterizing them as textures.
 *
 * Active state (controlled by parent via activeModules prop) lights up the
 * card border + lifts opacity. Mode shapes the activation logic upstream.
 */

import { Html } from "@react-three/drei";
import type {
  DataModuleType,
  ModuleData,
  ModuleStatus,
  SystemMode,
  SystemSnapshot,
} from "./systemTypes";
import { modulePosition, BRAND_COLOR } from "./systemTypes";

interface Props {
  snapshot: SystemSnapshot;
  mode: SystemMode;
  activeModules: DataModuleType[];
}

export function DataModules({ snapshot, mode, activeModules }: Props) {
  const types: DataModuleType[] = [
    "sleep",
    "recovery",
    "stress",
    "performance",
    "metabolic",
    "labs",
    "stack",
  ];
  return (
    <group>
      {types.map((t) => {
        const data = snapshot.modules[t];
        const pos = modulePosition(t);
        const active = activeModules.includes(t);
        return (
          <ModuleNode
            key={t}
            data={data}
            position={pos}
            active={active}
            mode={mode}
          />
        );
      })}
    </group>
  );
}

interface ModuleNodeProps {
  data: ModuleData;
  position: [number, number, number];
  active: boolean;
  mode: SystemMode;
}

function ModuleNode({ data, position, active, mode }: ModuleNodeProps) {
  return (
    <group position={position}>
      {/* drei's <Html> renders the React tree as a positioned DOM overlay.
          transform=true keeps it screen-aligned; distanceFactor controls scale. */}
      <Html
        center
        zIndexRange={[10, 0]}
        style={{ pointerEvents: "none" }}
      >
        <ModuleCard data={data} active={active} mode={mode} />
      </Html>
    </group>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

function ModuleCard({
  data,
  active,
  mode,
}: {
  data: ModuleData;
  active: boolean;
  mode: SystemMode;
}) {
  const accent = STATUS_COLOR[data.status];
  const baseAlpha = active ? 1.0 : mode === "idle" ? 0.62 : 0.78;
  const borderAlpha = active ? 0.95 : 0.28;

  return (
    <div
      style={{
        width: 192,
        padding: "10px 12px",
        background:
          "linear-gradient(180deg, rgba(11, 29, 58, 0.92) 0%, rgba(5, 11, 26, 0.92) 100%)",
        border: `1px solid ${accent}${alphaHex(borderAlpha)}`,
        borderRadius: 6,
        color: BRAND_COLOR.white,
        fontFamily:
          "var(--font-body, ui-sans-serif), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 11,
        letterSpacing: 0.2,
        opacity: baseAlpha,
        transition: "opacity 320ms cubic-bezier(0.2, 0, 0, 1), border-color 320ms",
        boxShadow: active
          ? `0 0 24px ${accent}40, inset 0 0 12px ${accent}22`
          : "0 4px 14px rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(2px)",
        userSelect: "none",
      }}
    >
      {/* Header row: label + status dot */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textTransform: "uppercase",
          fontSize: 9.5,
          letterSpacing: 1.4,
          color: "rgba(255,255,255,0.65)",
          marginBottom: 4,
        }}
      >
        <span>{data.label}</span>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 6px ${accent}`,
          }}
        />
      </div>

      {/* Primary value */}
      <div
        style={{
          fontFamily:
            "var(--font-mono, ui-monospace), 'SFMono-Regular', Menlo, monospace",
          fontSize: 18,
          color: data.status === "priority" ? accent : BRAND_COLOR.white,
          fontWeight: 500,
          lineHeight: 1.05,
          marginBottom: 2,
        }}
      >
        {data.primaryValue}
      </div>

      {/* Caption */}
      <div
        style={{
          fontSize: 10,
          color:
            data.status === "priority"
              ? `${accent}${alphaHex(0.85)}`
              : "rgba(255,255,255,0.55)",
          fontStyle: "italic",
          marginBottom: data.metrics?.length ? 6 : 0,
        }}
      >
        {data.caption}
      </div>

      {/* Sparkline (drawn as inline SVG) */}
      {data.spark && (
        <div style={{ height: 18, marginBottom: 6 }}>
          <Sparkline values={data.spark} color={accent} />
        </div>
      )}

      {/* Secondary metrics */}
      {data.metrics?.length ? (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 6,
            display: "grid",
            rowGap: 3,
            fontSize: 10,
          }}
        >
          {data.metrics.map((m) => (
            <div
              key={m.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                color:
                  m.status === "priority"
                    ? STATUS_COLOR.priority
                    : "rgba(255,255,255,0.78)",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.45)" }}>{m.label}</span>
              <span
                style={{
                  fontFamily:
                    "var(--font-mono, ui-monospace), 'SFMono-Regular', Menlo, monospace",
                  letterSpacing: 0.3,
                }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 168;
  const h = 18;
  if (!values.length) return null;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - v * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`spark-fill-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        fill={`url(#spark-fill-${color})`}
        stroke="none"
        points={`0,${h} ${points} ${w},${h}`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeOpacity={0.92}
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ModuleStatus, string> = {
  optimal: BRAND_COLOR.aqua,
  watch: "#9DD6DD", // softer aqua
  priority: BRAND_COLOR.red,
};

function alphaHex(a: number): string {
  const v = Math.round(a * 255).toString(16).padStart(2, "0");
  return v;
}

export default DataModules;
