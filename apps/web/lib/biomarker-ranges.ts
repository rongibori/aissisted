export type RangeStatus = "low" | "optimal" | "high" | "unknown";

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
  low: "text-blue-400 bg-blue-950 border-blue-900",
  optimal: "text-emerald-400 bg-emerald-950 border-emerald-900",
  high: "text-amber-400 bg-amber-950 border-amber-900",
  unknown: "text-[#7a7a98] bg-[#1c1c26] border-[#2a2a38]",
};
