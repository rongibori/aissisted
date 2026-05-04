"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AuthProvider, useAuth } from "../../lib/auth-context";
import { Nav } from "../../components/nav";
import { biomarkers as biomarkersApi } from "../../lib/api";
import { Card, Button, Input, Spinner, EmptyState, Badge } from "../../components/ui";
import {
  getRangeStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  TREND_ICONS,
  TREND_COLORS,
  TREND_LABELS,
  type TrendDirection,
} from "../../lib/biomarker-ranges";
import { Sparkline } from "../../components/sparkline";

interface Biomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  source?: string;
  measuredAt: string;
}

interface TrendRecord {
  biomarkerName: string;
  latestValue: number;
  latestUnit: string;
  latestMeasuredAt: string;
  readingCount: number;
  slope30d: number | null;
  rollingAvg7d: number | null;
  rollingAvg30d: number | null;
  rollingAvg90d: number | null;
  trendDirection: TrendDirection;
}

const COMMON_BIOMARKERS = [
  { name: "vitamin_d_ng_ml", label: "Vitamin D", unit: "ng/mL" },
  { name: "b12_pg_ml", label: "B12", unit: "pg/mL" },
  { name: "ferritin_ng_ml", label: "Ferritin", unit: "ng/mL" },
  { name: "crp_mg_l", label: "CRP", unit: "mg/L" },
  { name: "testosterone_ng_dl", label: "Testosterone", unit: "ng/dL" },
  { name: "cortisol_mcg_dl", label: "Cortisol", unit: "mcg/dL" },
  { name: "tsh_miu_l", label: "TSH", unit: "mIU/L" },
  { name: "hemoglobin_g_dl", label: "Hemoglobin", unit: "g/dL" },
  { name: "ldl_mg_dl", label: "LDL", unit: "mg/dL" },
  { name: "hdl_mg_dl", label: "HDL", unit: "mg/dL" },
  { name: "triglycerides_mg_dl", label: "Triglycerides", unit: "mg/dL" },
  { name: "glucose_mg_dl", label: "Glucose", unit: "mg/dL" },
];

function formatSlope(slope30d: number | null, unit: string): string | null {
  if (slope30d === null || Math.abs(slope30d) < 0.001) return null;
  const sign = slope30d > 0 ? "+" : "";
  const val = Math.abs(slope30d) < 1
    ? slope30d.toFixed(2)
    : slope30d.toFixed(1);
  return `${sign}${val} ${unit}/mo`;
}

function LabsPage() {
  const { user, loading } = useAuth();
  const [allBiomarkers, setAllBiomarkers] = useState<Biomarker[]>([]);
  const [trends, setTrends] = useState<Map<string, TrendRecord>>(new Map());
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    customName: "",
    value: "",
    unit: "",
    source: "manual",
    measuredAt: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    setFetching(true);
    try {
      // Fetch latest biomarkers + pre-computed trends in parallel
      const [biomarkersData, trendsData] = await Promise.all([
        biomarkersApi.list({ latest: true }),
        biomarkersApi.trends().catch(() => ({ trends: [] })),
      ]);

      setAllBiomarkers(biomarkersData.biomarkers);

      // Build trend map for O(1) lookup
      const trendMap = new Map<string, TrendRecord>();
      for (const t of trendsData.trends) {
        trendMap.set(t.biomarkerName, t);
      }
      setTrends(trendMap);

      // Fetch sparkline history for biomarkers that have multiple readings
      // (only for those with readingCount > 1 from trends, to avoid wasteful requests)
      const needsSparkline = biomarkersData.biomarkers
        .map((b: Biomarker) => b.name)
        .filter((name: string) => {
          const t = trendMap.get(name);
          return t ? t.readingCount > 1 : false;
        });

      if (needsSparkline.length > 0) {
        Promise.allSettled(
          needsSparkline.map((name: string) =>
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
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) load();
  }, [user, loading, load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name === "custom" ? form.customName : form.name;
    if (!name || !form.value || !form.unit) return;

    setSaving(true);
    try {
      await biomarkersApi.add({
        name,
        value: parseFloat(form.value),
        unit: form.unit,
        source: form.source || "manual",
        measuredAt: new Date(form.measuredAt).toISOString(),
      });
      setShowForm(false);
      setForm({
        name: "",
        customName: "",
        value: "",
        unit: "",
        source: "manual",
        measuredAt: new Date().toISOString().slice(0, 10),
      });
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return (
      <>
        <Nav />
        <div className="pt-14 flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="pt-14 max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-graphite">Labs</h1>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add result"}
          </Button>
        </div>

        {/* Add form */}
        {showForm && (
          <Card className="mb-5">
            <h3 className="font-medium text-graphite mb-4">
              Add biomarker reading
            </h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-graphite block mb-1.5">
                  Biomarker
                </label>
                <select
                  value={form.name}
                  onChange={(e) => {
                    const selected = COMMON_BIOMARKERS.find(
                      (b) => b.name === e.target.value
                    );
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      unit: selected?.unit ?? f.unit,
                    }));
                  }}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-graphite text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua"
                >
                  <option value="">Select biomarker…</option>
                  {COMMON_BIOMARKERS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.label} ({b.unit})
                    </option>
                  ))}
                  <option value="custom">Custom…</option>
                </select>
              </div>

              {form.name === "custom" && (
                <Input
                  label="Custom name"
                  value={form.customName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customName: e.target.value }))
                  }
                  placeholder="e.g. hs_crp_mg_l"
                  required
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Value"
                  type="number"
                  step="any"
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Unit"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  placeholder="ng/mL"
                  required
                />
              </div>

              <Input
                label="Date measured"
                type="date"
                value={form.measuredAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, measuredAt: e.target.value }))
                }
                required
              />

              <Button
                type="submit"
                loading={saving}
                className="w-full mt-1"
              >
                Save reading
              </Button>
            </form>
          </Card>
        )}

        {/* Biomarker list */}
        {allBiomarkers.length === 0 ? (
          <Card>
            <EmptyState
              title="No biomarkers yet"
              description="Add your lab results to power personalized supplement recommendations."
              action={
                <Button size="sm" onClick={() => setShowForm(true)}>
                  Add first result
                </Button>
              }
            />
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {allBiomarkers.map((b) => {
                const trend = trends.get(b.name);
                const status = getRangeStatus(b.name, b.value);
                const slopeLabel = trend ? formatSlope(trend.slope30d, b.unit) : null;
                const dir = trend?.trendDirection ?? "new";
                const showTrendIcon = dir !== "new" && dir !== "insufficient_data";

                return (
                  <div
                    key={b.id}
                    className="py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-graphite capitalize">
                          {b.name.replace(/_/g, " ")}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-graphite-soft">
                            <span className="font-data">{new Date(b.measuredAt).toLocaleDateString()}</span>
                            {b.source && b.source !== "manual" && (
                              <> · {b.source}</>
                            )}
                          </p>
                          {trend && trend.readingCount > 1 && (
                            <span className="text-xs text-graphite-soft/70 font-data">
                              {trend.readingCount} readings
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sparklines[b.name] && (
                          <Sparkline
                            values={sparklines[b.name]}
                            width={64}
                            height={24}
                            color={
                              status === "optimal"
                                ? "#2EC4B6"
                                : status === "high"
                                ? "#F59E0B"
                                : "#0F1B2D"
                            }
                          />
                        )}
                        {showTrendIcon && (
                          <span
                            className={`text-sm font-bold ${TREND_COLORS[dir as TrendDirection]}`}
                            title={TREND_LABELS[dir as TrendDirection]}
                          >
                            {TREND_ICONS[dir as TrendDirection]}
                          </span>
                        )}
                        <span className="text-sm font-medium text-graphite font-data">
                          {b.value} {b.unit}
                        </span>
                        {status !== "unknown" && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLORS[status]}`}
                          >
                            {STATUS_LABELS[status]}
                          </span>
                        )}
                      </div>
                    </div>

                    {slopeLabel && dir === "worsening" && (
                      <p className="text-xs text-signal-red mt-1 ml-0 font-data">
                        {slopeLabel} over last 30 days
                      </p>
                    )}
                    {slopeLabel && dir === "improving" && (
                      <p className="text-xs text-aqua mt-1 ml-0 font-data">
                        {slopeLabel} over last 30 days
                      </p>
                    )}

                    {trend && trend.readingCount >= 3 && trend.rollingAvg30d !== null && (
                      <p className="text-xs text-graphite-soft/70 mt-0.5 font-data">
                        30-day avg: {trend.rollingAvg30d.toFixed(1)} {b.unit}
                        {trend.rollingAvg7d !== null && (
                          <> · 7-day avg: {trend.rollingAvg7d.toFixed(1)}</>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

export default function LabsPageWrapper() {
  return (
    <AuthProvider>
      <LabsPage />
    </AuthProvider>
  );
}
