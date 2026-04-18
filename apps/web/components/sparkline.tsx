"use client";

import React from "react";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /**
   * Stroke color. Defaults to the Brand Bible aqua activation signal
   * (`var(--signal)`). Any caller-supplied value takes precedence — use
   * `var(--data)` for neutral trends, `var(--accent)` for concerning ones.
   */
  color?: string;
  className?: string;
}

export function Sparkline({
  values,
  width = 80,
  height = 28,
  color = "var(--signal)",
  className = "",
}: SparklineProps) {
  if (values.length < 2) {
    return <span className={`inline-block w-[${width}px] h-[${height}px] ${className}`} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polyline = points.join(" ");
  const lastPoint = points[points.length - 1].split(",");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {/* Dot at latest value */}
      <circle
        cx={lastPoint[0]}
        cy={lastPoint[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}
