export type RangeStatus = "low" | "optimal" | "high" | "unknown";

// Evaluative trend direction — maps to backend BiomarkerTrendRecord.trendDirection
export type TrendDirection =
  | "worsening"
  | "improving"
  | "stable"
  | "new"
  | "insufficient_data";

export const TREND_ICONS: Record<TrendDirection, string> = {
  worsening: "↓",
  improving: "↑",
  stable: "→",
  new: "",
  insufficient_data: "",
};

export const TREND_COLORS: Record<TrendDirection, string> = {
  worsening: "text-signal-red",
  improving: "text-aqua",
  stable: "text-graphite-soft",
  new: "text-graphite-soft",
  insufficient_data: "text-graphite-soft",
};

export const TREND_LABELS: Record<TrendDirection, string> = {
  worsening: "Worsening",
  improving: "Improving",
  stable: "Stable",
  new: "New",
  insufficient_data: "Not enough data",
};

const RANGES: Record<string, { low: number; highNormal: number }> = {
  vitamin_d_ng_ml: { low: 30, highNormal: 100 },
  b12_pg_ml: { low: 200, highNormal: 900 },
  ferritin_ng_ml: { low: 20, highNormal: 300 },
  hemoglobin_g_dl: { low: 12, highNormal: 17.5 },
  crp_mg_l: { low: 0, highNormal: 3 },
  hs_crp_mg_l: { low: 0, highNormal: 3 },
  testosterone_ng_dl: { low: 300, highNormal: 1000 },
  tsh_miu_l: { low: 0.4, highNormal: 4 },
  cortisol_mcg_dl: { low: 6, highNormal: 23 },
  glucose_mg_dl: { low: 70, highNormal: 100 },
  hba1c_percent: { low: 4, highNormal: 5.7 },
  hdl_mg_dl: { low: 40, highNormal: 100 },
  ldl_mg_dl: { low: 0, highNormal: 100 },
  triglycerides_mg_dl: { low: 0, highNormal: 150 },
  whoop_recovery_score: { low: 33, highNormal: 100 },
  whoop_hrv_rmssd_ms: { low: 20, highNormal: 200 },
  whoop_sleep_performance_pct: { low: 70, highNormal: 100 },
};

export function getRangeStatus(name: string, value: number): RangeStatus {
  const range = RANGES[name];
  if (!range) return "unknown";
  if (value < range.low) return "low";
  if (value > range.highNormal) return "high";
  return "optimal";
}

export const STATUS_LABELS: Record<RangeStatus, string> = {
  low: "Low",
  optimal: "Normal",
  high: "High",
  unknown: "",
};

export const STATUS_COLORS: Record<RangeStatus, string> = {
  low: "text-blue-700 bg-blue-50 border-blue-200",
  optimal: "text-aqua bg-aqua/10 border-aqua/30",
  high: "text-warn bg-warn/10 border-warn/30",
  unknown: "text-graphite-soft bg-surface-2 border-border",
};
