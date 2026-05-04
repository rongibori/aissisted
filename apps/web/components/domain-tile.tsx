"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sparkline } from "./sparkline";

export type TileStatus = "optimal" | "watch" | "alert" | "neutral";

const STATUS_BORDER: Record<TileStatus, string> = {
  optimal: "border-l-aqua",
  watch: "border-l-warn",
  alert: "border-l-signal-red",
  neutral: "border-l-graphite-soft/40",
};

const STATUS_SPARK: Record<TileStatus, string> = {
  optimal: "#2EC4B6",
  watch: "#F59E0B",
  alert: "#E63946",
  neutral: "#0F1B2D",
};

interface DomainTileProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: TileStatus;
  trend?: number[];
  href?: string;
  source?: string;
  empty?: boolean;
}

export function DomainTile({
  label,
  value,
  unit,
  status = "neutral",
  trend,
  href,
  source,
  empty = false,
}: DomainTileProps) {
  const router = useRouter();
  const interactive = !!href;
  const baseCls =
    "group relative bg-surface border border-border rounded-xl p-4 border-l-4 transition-all";
  const interactiveCls = interactive
    ? "cursor-pointer hover:border-l-midnight hover:shadow-sm"
    : "";

  const handleClick = () => {
    if (href) router.push(href);
  };

  return (
    <div
      onClick={interactive ? handleClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${label}: ${value}${unit ? ` ${unit}` : ""}` : undefined}
      className={`${baseCls} ${STATUS_BORDER[status]} ${interactiveCls} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-graphite-soft uppercase tracking-wider">
          {label}
        </span>
        {source && (
          <span className="text-[9px] font-data text-graphite-soft/70 px-1.5 py-0.5 bg-surface-2 rounded">
            {source}
          </span>
        )}
      </div>

      {empty ? (
        <p className="text-sm text-graphite-soft/70 mt-1">No data yet</p>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-graphite font-data tabular-nums">
            {value}
          </span>
          {unit && <span className="text-xs text-graphite-soft font-data">{unit}</span>}
        </div>
      )}

      {trend && trend.length > 1 && (
        <div className="mt-2">
          <Sparkline
            values={trend}
            width={120}
            height={28}
            color={STATUS_SPARK[status]}
            className="opacity-90"
          />
        </div>
      )}
    </div>
  );
}
