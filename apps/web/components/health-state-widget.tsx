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
  components?: string[]; // compound signals only
}

interface HealthState {
  id: string;
  mode: string;
  confidenceScore: number;
  domainScores: DomainScores;
  activeSignals: ActiveSignal[];
  warnings: string[];
  missingDataFlags: string[];
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────
/*
 * Mode palette — Brand Bible v1.1 semantic mapping.
 * Red (`danger`) is the attention signal. Warn is graphite-amber.
 * Ok is desaturated success. Data is midnight for informational states.
 * Never introduce raw Tailwind color utilities here.
 */

const MODE_CONFIG: Record<
  string,
  { label: string; tone: "ok" | "warn" | "danger" | "data" | "neutral" }
> = {
  optimal:                 { label: "Optimal",              tone: "ok"      },
  cardiovascular_risk:     { label: "Cardiovascular Risk",  tone: "danger"  },
  metabolic_dysfunction:   { label: "Metabolic Concern",    tone: "warn"    },
  hormonal_imbalance:      { label: "Hormonal Imbalance",   tone: "warn"    },
  micronutrient_deficient: { label: "Micronutrient Gap",    tone: "warn"    },
  renal_caution:           { label: "Renal Caution",        tone: "warn"    },
  inflammatory:            { label: "Inflammation",         tone: "danger"  },
  data_insufficient:       { label: "Insufficient Data",    tone: "neutral" },
};

const TONE_CLASSES: Record<
  "ok" | "warn" | "danger" | "data" | "neutral",
  string
> = {
  ok:      "text-ok bg-ok-soft border-ok/20",
  warn:    "text-warn bg-warn-soft border-warn/20",
  danger:  "text-danger bg-danger-soft border-danger/20",
  data:    "text-data bg-surface-2 border-line",
  neutral: "text-muted bg-surface-2 border-line",
};

const DOMAIN_LABELS: Record<string, string> = {
  cardiovascular: "Cardio",
  metabolic: "Metabolic",
  hormonal: "Hormonal",
  micronutrient: "Nutrients",
  renal: "Renal",
  inflammatory: "Inflam.",
};

const SEVERITY_TEXT: Record<ActiveSignal["severity"], string> = {
  critical: "text-danger",
  warn: "text-warn",
  info: "text-muted",
};

const SEVERITY_DOT: Record<ActiveSignal["severity"], string> = {
  critical: "bg-danger",
  warn: "bg-warn",
  info: "bg-muted",
};

// ─── Domain score bar ─────────────────────────────────────

function domainBarColor(score: number): string {
  // Lower score = healthier. Ok / warn / danger, matte brand semantics.
  if (score < 0.4) return "bg-ok";
  if (score < 0.7) return "bg-warn";
  return "bg-danger";
}

function DomainBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${domainBarColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-muted w-7 text-right shrink-0">
        {pct}%
      </span>
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────

export function HealthStateWidget() {
  const [state, setState] = useState<HealthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const data = await healthStateApi.get();
      setState(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await healthStateApi.get(true);
      setState(data);
    } catch {
      // keep existing state
    } finally {
      setRefreshing(false);
    }
  };

  const modeConfig =
    (state?.mode ? MODE_CONFIG[state.mode] : undefined) ??
    MODE_CONFIG.data_insufficient;
  const toneClass = TONE_CLASSES[modeConfig.tone];

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
        <h2 className="font-semibold text-ink">Health State</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="text-xs text-muted hover:text-ink transition-colors disabled:opacity-40"
          title="Refresh health state"
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
          <p className="text-sm text-muted">
            {error ? "We couldn't load your health state." : "No health data yet."}
          </p>
          <p className="text-xs text-soft mt-1">Add a lab result to begin.</p>
        </div>
      ) : (
        <>
          {/* Mode badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${toneClass} mb-4`}
          >
            {state.mode === "optimal" ? "✓ " : "● "}
            {modeConfig.label}
            <span className="text-xs opacity-60 ml-1">
              {Math.round(state.confidenceScore * 100)}% confidence
            </span>
          </div>

          {/* Domain scores */}
          <div className="flex flex-col gap-1.5 mb-4">
            {Object.entries(state.domainScores).map(([domain, score]) => (
              <DomainBar
                key={domain}
                label={DOMAIN_LABELS[domain] ?? domain}
                score={score}
              />
            ))}
          </div>

          {/* Active signals (warn + critical) */}
          {actionableSignals.length > 0 && (
            <div className="border-t border-line pt-3 mb-3">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                Active Signals
              </p>
              <div className="flex flex-col gap-2">
                {actionableSignals.map((sig) => (
                  <div key={sig.key} className="flex items-start gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[sig.severity]}`}
                    />
                    <div className="flex-1 min-w-0">
                      {/* Compound signal gets a distinct header chip */}
                      {sig.signalType === "compound_risk" && sig.components && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {sig.components.map((c) => (
                            <span
                              key={c}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-surface-2 text-muted font-system border border-line"
                            >
                              {c
                                .replace(/_/g, " ")
                                .replace(/ (mg dl|ng ml|pg ml|miu l|mcg dl|g dl|u l)$/, "")}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className={`text-xs leading-relaxed ${SEVERITY_TEXT[sig.severity]}`}>
                        {sig.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {state.warnings.length > 0 && (
            <div className="border-t border-line pt-3 mb-3">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                Clinical Notes
              </p>
              {state.warnings.slice(0, 2).map((w, i) => (
                <p key={i} className="text-xs text-warn leading-relaxed mb-1">
                  ⚠ {w}
                </p>
              ))}
            </div>
          )}

          {/* Data gaps */}
          {(missingCount > 0 || staleCount > 0) && (
            <div className="border-t border-line pt-3">
              <p className="text-[11px] text-muted">
                {missingCount > 0 && (
                  <span>
                    {missingCount} key lab{missingCount > 1 ? "s" : ""} missing ·{" "}
                  </span>
                )}
                {staleCount > 0 && (
                  <span>
                    {staleCount} lab{staleCount > 1 ? "s" : ""} stale (&gt;6 mo)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Last updated */}
          <p className="text-[10px] text-soft mt-3">
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
