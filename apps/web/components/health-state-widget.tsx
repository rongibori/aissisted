"use client";

import React, { useEffect, useState, useCallback } from "react";
import { healthState as healthStateApi } from "../lib/api";
import { Card, Spinner } from "./ui";

// ─── Types ────────────────────────────────────────────────

interface DomainScores {
  cardiovascular: number;
  metabolic: number;
  hormonal: number;
  micronutrient: number;
  renal: number;
  inflammatory: number;
}

interface ActiveSignal {
  key: string;
  domain: string;
  biomarkerName: string;
  signalType: string;
  severity: "info" | "warn" | "critical";
  explanation: string;
  value?: number;
  components?: string[];
}

export interface HealthState {
  id: string;
  mode: string;
  confidenceScore: number;
  domainScores: DomainScores;
  activeSignals: ActiveSignal[];
  warnings: string[];
  missingDataFlags: string[];
  createdAt: string;
}

// ─── Mode visuals (white-first palette) ───────────────────

const MODE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  optimal: {
    label: "Optimal",
    color: "text-aqua",
    bg: "bg-aqua/10",
    border: "border-aqua/30",
  },
  cardiovascular_risk: {
    label: "Cardiovascular Risk",
    color: "text-signal-red",
    bg: "bg-signal-red/10",
    border: "border-signal-red/30",
  },
  metabolic_dysfunction: {
    label: "Metabolic Concern",
    color: "text-warn",
    bg: "bg-warn/10",
    border: "border-warn/30",
  },
  hormonal_imbalance: {
    label: "Hormonal Imbalance",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  micronutrient_deficient: {
    label: "Micronutrient Gap",
    color: "text-yellow-800",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  renal_caution: {
    label: "Renal Caution",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  inflammatory: {
    label: "Inflammation",
    color: "text-signal-red",
    bg: "bg-signal-red/10",
    border: "border-signal-red/30",
  },
  data_insufficient: {
    label: "Insufficient Data",
    color: "text-graphite-soft",
    bg: "bg-surface-2",
    border: "border-border",
  },
};

const DOMAIN_LABELS: Record<string, string> = {
  cardiovascular: "Cardio",
  metabolic: "Metabolic",
  hormonal: "Hormonal",
  micronutrient: "Nutrients",
  renal: "Renal",
  inflammatory: "Inflam.",
};

const SEVERITY_COLORS = {
  critical: "text-signal-red",
  warn: "text-warn",
  info: "text-graphite-soft",
};

const SEVERITY_DOT = {
  critical: "bg-signal-red",
  warn: "bg-warn",
  info: "bg-graphite-soft",
};

// ─── Domain bar ───────────────────────────────────────────

function domainBarColor(score: number): string {
  if (score < 0.2) return "bg-aqua";
  if (score < 0.4) return "bg-aqua/80";
  if (score < 0.6) return "bg-warn";
  if (score < 0.8) return "bg-orange-500";
  return "bg-signal-red";
}

function DomainBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-graphite-soft w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${domainBarColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-graphite-soft w-7 text-right shrink-0 font-data">
        {pct}%
      </span>
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────

interface HealthStateWidgetProps {
  /** Optional pre-fetched state. When provided, the widget skips its own fetch
   * and renders from this prop. Used by the dashboard to share a single fetch
   * with the NeuralCore. */
  state?: HealthState | null;
  onRefresh?: () => Promise<void>;
}

export function HealthStateWidget({ state: externalState, onRefresh }: HealthStateWidgetProps = {}) {
  const isControlled = externalState !== undefined;
  const [internalState, setInternalState] = useState<HealthState | null>(null);
  const [loading, setLoading] = useState(!isControlled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const data = await healthStateApi.get();
      setInternalState(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isControlled) {
      setLoading(false);
      return;
    }
    load();
  }, [load, isControlled]);

  const state = isControlled ? externalState : internalState;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        const data = await healthStateApi.get(true);
        setInternalState(data);
      }
    } catch {
      // keep existing state
    } finally {
      setRefreshing(false);
    }
  };

  const modeConfig =
    MODE_CONFIG[state?.mode ?? ""] ?? MODE_CONFIG.data_insufficient;

  const actionableSignals =
    state?.activeSignals.filter((s) => s.severity !== "info").slice(0, 3) ?? [];

  const missingCount = state?.missingDataFlags.filter((f) =>
    f.startsWith("missing_")
  ).length ?? 0;

  const staleCount = state?.missingDataFlags.filter((f) =>
    f.startsWith("stale_")
  ).length ?? 0;

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <h2 className="font-semibold text-graphite">Health State</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="text-xs text-graphite-soft hover:text-graphite transition-colors disabled:opacity-40"
          aria-label="Refresh health state"
        >
          {refreshing ? "..." : "↻ Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : error || !state ? (
        <div className="text-center py-6">
          <p className="text-sm text-graphite-soft">
            {error ? "Could not load health state." : "No health data yet."}
          </p>
          <p className="text-xs text-graphite-soft mt-1">Add lab results to get started.</p>
        </div>
      ) : (
        <>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${modeConfig.color} ${modeConfig.bg} border ${modeConfig.border} mb-4`}
          >
            {state.mode === "optimal" ? "✓ " : "● "}
            {modeConfig.label}
            <span className="text-xs opacity-70 ml-1 font-data">
              {Math.round(state.confidenceScore * 100)}% confidence
            </span>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            {Object.entries(state.domainScores).map(([domain, score]) => (
              <DomainBar
                key={domain}
                label={DOMAIN_LABELS[domain] ?? domain}
                score={score}
              />
            ))}
          </div>

          {actionableSignals.length > 0 && (
            <div className="border-t border-border pt-3 mb-3">
              <p className="text-[11px] font-semibold text-graphite-soft uppercase tracking-wider mb-2">
                Active Signals
              </p>
              <div className="flex flex-col gap-2">
                {actionableSignals.map((sig) => (
                  <div key={sig.key} className="flex items-start gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[sig.severity]}`}
                    />
                    <div className="flex-1 min-w-0">
                      {sig.signalType === "compound_risk" && sig.components && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {sig.components.map((c) => (
                            <span
                              key={c}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-surface-2 text-graphite-soft font-data"
                            >
                              {c.replace(/_/g, " ").replace(/ (mg dl|ng ml|pg ml|miu l|mcg dl|g dl|u l)$/, "")}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className={`text-xs leading-relaxed ${SEVERITY_COLORS[sig.severity]}`}>
                        {sig.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.warnings.length > 0 && (
            <div className="border-t border-border pt-3 mb-3">
              <p className="text-[11px] font-semibold text-graphite-soft uppercase tracking-wider mb-2">
                Clinical Notes
              </p>
              {state.warnings.slice(0, 2).map((w, i) => (
                <p key={i} className="text-xs text-warn leading-relaxed mb-1">
                  ⚠ {w}
                </p>
              ))}
            </div>
          )}

          {(missingCount > 0 || staleCount > 0) && (
            <div className="border-t border-border pt-3">
              <p className="text-[11px] text-graphite-soft">
                {missingCount > 0 && (
                  <span className="font-data">{missingCount}</span>
                )}
                {missingCount > 0 && (
                  <span> key lab{missingCount > 1 ? "s" : ""} missing · </span>
                )}
                {staleCount > 0 && (
                  <span className="font-data">{staleCount}</span>
                )}
                {staleCount > 0 && (
                  <span> lab{staleCount > 1 ? "s" : ""} stale (&gt;6 mo)</span>
                )}
              </p>
            </div>
          )}

          <p className="text-[10px] text-graphite-soft mt-3 opacity-70">
            Updated{" "}
            {new Date(state.createdAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </>
      )}
    </Card>
  );
}
