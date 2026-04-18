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

const MODE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  optimal: {
    label: "Optimal",
    color: "text-emerald-400",
    bg: "bg-emerald-950",
    border: "border-emerald-900",
  },
  cardiovascular_risk: {
    label: "Cardiovascular Risk",
    color: "text-red-400",
    bg: "bg-red-950",
    border: "border-red-900",
  },
  metabolic_dysfunction: {
    label: "Metabolic Concern",
    color: "text-amber-400",
    bg: "bg-amber-950",
    border: "border-amber-900",
  },
  hormonal_imbalance: {
    label: "Hormonal Imbalance",
    color: "text-purple-400",
    bg: "bg-purple-950",
    border: "border-purple-900",
  },
  micronutrient_deficient: {
    label: "Micronutrient Gap",
    color: "text-yellow-400",
    bg: "bg-yellow-950",
    border: "border-yellow-900",
  },
  renal_caution: {
    label: "Renal Caution",
    color: "text-orange-400",
    bg: "bg-orange-950",
    border: "border-orange-900",
  },
  inflammatory: {
    label: "Inflammation",
    color: "text-red-400",
    bg: "bg-red-950",
    border: "border-red-900",
  },
  data_insufficient: {
    label: "Insufficient Data",
    color: "text-[#7a7a98]",
    bg: "bg-[#1c1c26]",
    border: "border-[#2a2a38]",
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
  critical: "text-red-400",
  warn: "text-amber-400",
  info: "text-[#7a7a98]",
};

const SEVERITY_DOT = {
  critical: "bg-red-500",
  warn: "bg-amber-400",
  info: "bg-[#7a7a98]",
};

// ─── Domain score bar ─────────────────────────────────────

function domainBarColor(score: number): string {
  if (score < 0.2) return "bg-emerald-500";
  if (score < 0.4) return "bg-emerald-400";
  if (score < 0.6) return "bg-amber-400";
  if (score < 0.8) return "bg-orange-500";
  return "bg-red-500";
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
      <span className="text-[11px] text-[#7a7a98] w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#2a2a38] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${domainBarColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-[#7a7a98] w-7 text-right shrink-0">
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
    (state?.mode && MODE_CONFIG[state.mode]) ?? MODE_CONFIG.data_insufficient;

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
        <h2 className="font-semibold text-[#e8e8f0]">Health State</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="text-xs text-[#7a7a98] hover:text-[#e8e8f0] transition-colors disabled:opacity-40"
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
          <p className="text-sm text-[#7a7a98]">
            {error ? "Could not load health state." : "No health data yet."}
          </p>
          <p className="text-xs text-[#7a7a98] mt-1">Add lab results to get started.</p>
        </div>
      ) : (
        <>
          {/* Mode badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${modeConfig.color} ${modeConfig.bg} border ${modeConfig.border} mb-4`}
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
            <div className="border-t border-[#2a2a38] pt-3 mb-3">
              <p className="text-[11px] font-semibold text-[#7a7a98] uppercase tracking-wider mb-2">
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
                              className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a2a38] text-[#7a7a98] font-mono"
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

          {/* Warnings */}
          {state.warnings.length > 0 && (
            <div className="border-t border-[#2a2a38] pt-3 mb-3">
              <p className="text-[11px] font-semibold text-[#7a7a98] uppercase tracking-wider mb-2">
                Clinical Notes
              </p>
              {state.warnings.slice(0, 2).map((w, i) => (
                <p key={i} className="text-xs text-amber-400 leading-relaxed mb-1">
                  ⚠ {w}
                </p>
              ))}
            </div>
          )}

          {/* Data gaps */}
          {(missingCount > 0 || staleCount > 0) && (
            <div className="border-t border-[#2a2a38] pt-3">
              <p className="text-[11px] text-[#7a7a98]">
                {missingCount > 0 && (
                  <span>{missingCount} key lab{missingCount > 1 ? "s" : ""} missing · </span>
                )}
                {staleCount > 0 && (
                  <span>{staleCount} lab{staleCount > 1 ? "s" : ""} stale (&gt;6 mo)</span>
                )}
              </p>
            </div>
          )}

          {/* Last updated */}
          <p className="text-[10px] text-[#7a7a98] mt-3 opacity-60">
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
