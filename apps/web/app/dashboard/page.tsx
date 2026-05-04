"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import {
  protocol,
  biomarkers as biomarkersApi,
  profile as profileApi,
  healthState as healthStateApi,
} from "../../lib/api";
import { Card, Button, Badge, Spinner, EmptyState } from "../../components/ui";
import {
  getRangeStatus,
  STATUS_COLORS,
  STATUS_LABELS,
  TREND_ICONS,
  TREND_COLORS,
  type TrendDirection,
} from "../../lib/biomarker-ranges";
import { Sparkline } from "../../components/sparkline";
import {
  HealthStateWidget,
  type HealthState,
} from "../../components/health-state-widget";
import { NeuralCore } from "../../components/neural-core";
import { DomainTile, type TileStatus } from "../../components/domain-tile";

// ─── Types ────────────────────────────────────────────────

interface Recommendation {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  rationale: string;
  score: number;
}

interface Protocol {
  id: string;
  summary: string;
  warnings: string[];
  recommendations: Recommendation[];
  createdAt: string;
}

interface Biomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  measuredAt: string;
}

interface TrendRecord {
  biomarkerName: string;
  readingCount: number;
  trendDirection: TrendDirection;
  rollingAvg30d: number | null;
}

// ─── Tile derivation ──────────────────────────────────────

interface TileSpec {
  label: string;
  source: string;
  primary: string;
  fallback?: string;
  unit?: string;
  status(value: number): TileStatus;
  href: string;
}

const TILES: TileSpec[] = [
  {
    label: "Sleep",
    source: "WHOOP",
    primary: "whoop_sleep_performance_pct",
    fallback: "whoop_total_sleep_hours",
    unit: "%",
    status: (v) => (v >= 85 ? "optimal" : v >= 70 ? "watch" : "alert"),
    href: "/labs",
  },
  {
    label: "Recovery",
    source: "WHOOP",
    primary: "whoop_recovery_score",
    unit: "%",
    status: (v) => (v >= 67 ? "optimal" : v >= 34 ? "watch" : "alert"),
    href: "/labs",
  },
  {
    label: "Performance",
    source: "WHOOP",
    primary: "whoop_hrv_rmssd_ms",
    unit: "ms",
    status: (v) => (v >= 50 ? "optimal" : v >= 30 ? "watch" : "alert"),
    href: "/labs",
  },
  {
    label: "Stress",
    source: "WHOOP",
    primary: "whoop_resting_hr",
    unit: "bpm",
    // Inverted: higher RHR = more sympathetic stress
    status: (v) => (v <= 60 ? "optimal" : v <= 70 ? "watch" : "alert"),
    href: "/labs",
  },
];

// ─── Page ─────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentProtocol, setCurrentProtocol] = useState<Protocol | null>(null);
  const [latestBiomarkers, setLatestBiomarkers] = useState<Biomarker[]>([]);
  const [trendMap, setTrendMap] = useState<Map<string, TrendRecord>>(new Map());
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [tileTrends, setTileTrends] = useState<Record<string, number[]>>({});
  const [healthStateData, setHealthStateData] = useState<HealthState | null>(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [protoData, bioData, profileData, trendsData, hsData] = await Promise.allSettled([
        protocol.latest(),
        biomarkersApi.list({ latest: true }),
        profileApi.get(),
        biomarkersApi.trends().catch(() => ({ trends: [] })),
        healthStateApi.get().catch(() => null),
      ]);
      if (protoData.status === "fulfilled") {
        setCurrentProtocol(protoData.value.protocol);
      }
      if (profileData.status === "rejected") {
        setHasProfile(false);
      } else if (profileData.status === "fulfilled") {
        const p = profileData.value.profile;
        setHasProfile(!!(p?.firstName));
      }
      if (trendsData.status === "fulfilled") {
        const map = new Map<string, TrendRecord>();
        for (const t of trendsData.value.trends) {
          map.set(t.biomarkerName, t);
        }
        setTrendMap(map);
      }
      if (hsData.status === "fulfilled" && hsData.value) {
        setHealthStateData(hsData.value as HealthState);
      }
      if (bioData.status === "fulfilled") {
        const markers: Biomarker[] = bioData.value.biomarkers;
        setLatestBiomarkers(markers);

        const trends = trendsData.status === "fulfilled" ? trendsData.value.trends : [];

        // Sparklines for biomarker list (right rail)
        const multipleReadings = markers
          .map((b) => b.name)
          .filter((name) => {
            const t = trends.find((tr: TrendRecord) => tr.biomarkerName === name);
            return t ? t.readingCount > 1 : false;
          });
        if (multipleReadings.length > 0) {
          Promise.allSettled(
            multipleReadings.map((name) =>
              biomarkersApi.history(name).then((h) => ({
                name,
                values: [...h.biomarkers].reverse().map((b: Biomarker) => b.value),
              }))
            )
          ).then((results) => {
            const map: Record<string, number[]> = {};
            for (const r of results) {
              if (r.status === "fulfilled" && r.value.values.length > 1) {
                map[r.value.name] = r.value.values;
              }
            }
            setSparklines(map);
          });
        }

        // Trend histories specifically for tiles (limited window so we
        // don't flood the API with unused fetches).
        const tileNames = new Set<string>();
        for (const tile of TILES) {
          if (markers.some((b) => b.name === tile.primary)) tileNames.add(tile.primary);
          else if (tile.fallback && markers.some((b) => b.name === tile.fallback))
            tileNames.add(tile.fallback);
        }
        if (tileNames.size > 0) {
          Promise.allSettled(
            [...tileNames].map((name) =>
              biomarkersApi.history(name).then((h) => ({
                name,
                values: [...h.biomarkers]
                  .reverse()
                  .slice(-7)
                  .map((b: Biomarker) => b.value),
              }))
            )
          ).then((results) => {
            const map: Record<string, number[]> = {};
            for (const r of results) {
              if (r.status === "fulfilled" && r.value.values.length > 1) {
                map[r.value.name] = r.value.values;
              }
            }
            setTileTrends(map);
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await protocol.run();
      setCurrentProtocol(data.protocol);
      // Health state may have changed too
      const hs = await healthStateApi.get(true).catch(() => null);
      if (hs) setHealthStateData(hs as HealthState);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const refreshHealthState = useCallback(async () => {
    const hs = await healthStateApi.get(true).catch(() => null);
    if (hs) setHealthStateData(hs as HealthState);
  }, []);

  // Build resolved tile data from latest biomarker readings
  const resolvedTiles = useMemo(() => {
    const byName = new Map(latestBiomarkers.map((b) => [b.name, b]));
    const stackTile = {
      label: "Stack",
      source: "Protocol",
      value: currentProtocol?.recommendations.length ?? 0,
      unit: "active",
      status: (currentProtocol?.recommendations.length ?? 0) > 0
        ? ("optimal" as TileStatus)
        : ("neutral" as TileStatus),
      trend: undefined,
      href: "/stack",
      empty: !currentProtocol,
    };

    const wearableTiles = TILES.map((spec) => {
      const reading = byName.get(spec.primary) ?? (spec.fallback ? byName.get(spec.fallback) : undefined);
      if (!reading) {
        return {
          label: spec.label,
          source: spec.source,
          value: "—",
          unit: undefined,
          status: "neutral" as TileStatus,
          trend: undefined,
          href: spec.href,
          empty: true,
        };
      }
      const value = Math.round(reading.value);
      return {
        label: spec.label,
        source: spec.source,
        value,
        unit: spec.unit ?? reading.unit,
        status: spec.status(reading.value),
        trend: tileTrends[reading.name],
        href: spec.href,
        empty: false,
      };
    });

    return [...wearableTiles, stackTile];
  }, [latestBiomarkers, currentProtocol, tileTrends]);

  // NeuralCore inputs derived from health state (or sane defaults)
  const coreMode = healthStateData?.mode ?? "data_insufficient";
  const coreConfidence = healthStateData?.confidenceScore ?? 0;
  const coreSignalCount =
    healthStateData?.activeSignals.filter((s) => s.severity !== "info").length ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-graphite">Dashboard</h1>
          <p className="text-graphite-soft text-sm mt-0.5 font-data">{user?.email}</p>
        </div>
        <Button onClick={handleGenerate} loading={generating}>
          Generate Protocol
        </Button>
      </div>

      {/* Onboarding checklist */}
      {(!hasProfile || latestBiomarkers.length === 0 || !currentProtocol) && (
        <div className="mb-6 p-4 bg-midnight/5 border border-midnight/20 rounded-xl">
          <p className="text-sm font-medium text-midnight mb-3">
            Complete your setup to unlock your personalized protocol
          </p>
          <div className="flex flex-col gap-2">
            {[
              {
                done: hasProfile,
                label: "Complete your profile",
                action: () => router.push("/profile"),
                cta: "Go to Profile",
              },
              {
                done: latestBiomarkers.length > 0,
                label: "Add at least one biomarker reading",
                action: () => router.push("/labs"),
                cta: "Add labs",
              },
              {
                done: !!currentProtocol,
                label: "Generate your first protocol",
                action: handleGenerate,
                cta: "Generate now",
              },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    step.done
                      ? "bg-aqua text-white"
                      : "bg-surface-2 border border-border text-graphite-soft"
                  }`}
                >
                  {step.done ? "✓" : "○"}
                </span>
                <span
                  className={`text-sm flex-1 ${
                    step.done ? "line-through text-graphite-soft" : "text-graphite"
                  }`}
                >
                  {step.label}
                </span>
                {!step.done && (
                  <button
                    onClick={step.action}
                    className="text-xs text-midnight hover:underline shrink-0"
                  >
                    {step.cta} →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Center stage: Neural core flanked by domain tiles */}
      <Card className="mb-6 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_1fr] gap-6 items-center">
          {/* Left tiles (desktop) / first row (mobile) */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:order-1 order-2">
            <DomainTile {...resolvedTiles[0]} />
            <DomainTile {...resolvedTiles[3]} />
          </div>

          {/* Center: neural core */}
          <div className="flex flex-col items-center gap-3 lg:order-2 order-1">
            <NeuralCore
              mode={coreMode}
              confidenceScore={coreConfidence}
              signalCount={coreSignalCount}
              size={280}
            />
            <p className="text-xs text-graphite-soft text-center max-w-[260px]">
              Real-time synthesis of your labs, wearables, and protocol activity
            </p>
          </div>

          {/* Right tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:order-3 order-3">
            <DomainTile {...resolvedTiles[1]} />
            <DomainTile {...resolvedTiles[2]} />
          </div>
        </div>

        {/* Stack tile spans the row beneath on lg+, 2-col grid on mobile */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          <DomainTile {...resolvedTiles[4]} />
        </div>
      </Card>

      {/* Body grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Protocol summary */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-graphite">Current Protocol</h2>
              {currentProtocol && (
                <Badge variant="info">
                  {currentProtocol.recommendations.length} supplements
                </Badge>
              )}
            </div>

            {!currentProtocol ? (
              <EmptyState
                title="No protocol yet"
                description="Generate your first protocol based on your health data and goals."
                action={
                  <Button onClick={handleGenerate} loading={generating} size="sm">
                    Generate now
                  </Button>
                }
              />
            ) : (
              <>
                <p className="text-sm text-graphite-soft mb-4 leading-relaxed">
                  {currentProtocol.summary}
                </p>
                {currentProtocol.warnings.length > 0 && (
                  <div className="mb-4 p-3 bg-warn/10 border border-warn/30 rounded-lg">
                    {currentProtocol.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-warn">
                        ⚠ {w}
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {currentProtocol.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-start gap-3 p-3 bg-surface-2 rounded-lg"
                    >
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-aqua shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-graphite">
                            {rec.name}
                          </span>
                          <Badge variant="default">{rec.dosage}</Badge>
                        </div>
                        <p className="text-xs text-graphite-soft">{rec.timing}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push("/stack")}
                >
                  View full stack →
                </Button>
              </>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          <HealthStateWidget state={healthStateData} onRefresh={refreshHealthState} />

          {/* Biomarkers */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-graphite">Biomarkers</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/labs")}
              >
                View all
              </Button>
            </div>
            {latestBiomarkers.length === 0 ? (
              <EmptyState
                title="No labs yet"
                description="Add your first biomarker reading."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push("/labs")}
                  >
                    Add labs
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {latestBiomarkers.slice(0, 6).map((b) => {
                  const status = getRangeStatus(b.name, b.value);
                  const trend = trendMap.get(b.name);
                  const dir = trend?.trendDirection;
                  const showTrend = dir && dir !== "new" && dir !== "insufficient_data";
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-graphite-soft capitalize truncate mr-2">
                        {b.name.replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {sparklines[b.name] && (
                          <Sparkline
                            values={sparklines[b.name]}
                            width={48}
                            height={20}
                            color={
                              status === "optimal" ? "#2EC4B6"
                              : status === "high" || status === "low" ? "#F59E0B"
                              : "#0F1B2D"
                            }
                          />
                        )}
                        {showTrend && (
                          <span className={`text-xs font-bold ${TREND_COLORS[dir as TrendDirection]}`}>
                            {TREND_ICONS[dir as TrendDirection]}
                          </span>
                        )}
                        <span className="text-graphite font-medium font-data">
                          {b.value} {b.unit}
                        </span>
                        {status !== "unknown" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${STATUS_COLORS[status]}`}>
                            {STATUS_LABELS[status]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="font-semibold text-graphite mb-4">Quick actions</h2>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push("/chat")}
              >
                Ask Jeffrey
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push("/labs")}
              >
                Add lab results
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push("/stack")}
              >
                View my stack
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push("/adherence")}
              >
                Log supplements
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
