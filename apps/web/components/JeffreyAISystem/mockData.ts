/**
 * AISSISTED Jeffrey AI System — mock snapshot
 *
 * Realistic Ron data for the prototype. Numbers chosen to demonstrate ALL
 * three module statuses (optimal / watch / priority) so the visual contrast
 * is visible from the first frame.
 *
 * In production this is replaced by a hydrator that reads from the FHIR /
 * WHOOP / lab-result aggregation layer.
 */

import type { SystemSnapshot, ModuleData, DataModuleType } from "./systemTypes";

// Tiny seeded sparkline generator so the 7 modules have visually distinct
// histories without being random on every render.
function spark(seed: number, trend: number = 0): number[] {
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < 24; i++) {
    s = (s * 9301 + 49297) % 233280;
    const noise = (s / 233280) * 0.4 - 0.2;
    const t = trend * (i / 23);
    out.push(Math.max(0, Math.min(1, 0.5 + noise + t)));
  }
  return out;
}

const modules: Record<DataModuleType, ModuleData> = {
  sleep: {
    type: "sleep",
    label: "Sleep",
    primaryValue: "7h 41m",
    caption: "fragmented · 2 wakes",
    status: "watch",
    metrics: [
      { label: "Score", value: "78", status: "watch" },
      { label: "REM", value: "1h 24m", status: "watch" },
      { label: "Deep", value: "1h 02m", status: "optimal" },
    ],
    spark: spark(7, -0.2),
  },
  recovery: {
    type: "recovery",
    label: "Recovery",
    primaryValue: "62%",
    caption: "suppressed",
    status: "priority",
    metrics: [
      { label: "HRV", value: "48ms", status: "watch" },
      { label: "RHR", value: "59 bpm", status: "watch" },
      { label: "Δ from baseline", value: "−12%", status: "priority" },
    ],
    spark: spark(13, -0.3),
  },
  stress: {
    type: "stress",
    label: "Stress + Recovery",
    primaryValue: "elevated",
    caption: "morning cortisol high",
    status: "watch",
    metrics: [
      { label: "Cortisol", value: "21 µg/dL", status: "watch" },
      { label: "Resp rate", value: "16 /min", status: "optimal" },
      { label: "HRV trend", value: "−8%", status: "watch" },
    ],
    spark: spark(29, -0.1),
  },
  performance: {
    type: "performance",
    label: "Performance",
    primaryValue: "VO₂ 49.2",
    caption: "strain low · capacity strong",
    status: "optimal",
    metrics: [
      { label: "Strain", value: "8.4", status: "optimal" },
      { label: "Steps", value: "6,210", status: "optimal" },
      { label: "Active cal", value: "412", status: "optimal" },
    ],
    spark: spark(41, 0.15),
  },
  metabolic: {
    type: "metabolic",
    label: "Metabolic",
    primaryValue: "88 mg/dL",
    caption: "fasting glucose · stable",
    status: "optimal",
    metrics: [
      { label: "HbA1c", value: "5.2%", status: "optimal" },
      { label: "Insulin", value: "6.1 µU/mL", status: "optimal" },
      { label: "HOMA-IR", value: "1.3", status: "optimal" },
    ],
    spark: spark(53, 0.05),
  },
  labs: {
    type: "labs",
    label: "Lab Biomarkers",
    primaryValue: "ApoB 92 ↑",
    caption: "above target · priority",
    status: "priority",
    metrics: [
      { label: "LDL", value: "118 mg/dL", status: "priority" },
      { label: "hs-CRP", value: "1.8 mg/L", status: "watch" },
      { label: "Vitamin D", value: "44 ng/mL", status: "optimal" },
    ],
    spark: spark(67, 0.2),
  },
  stack: {
    type: "stack",
    label: "Supplement Stack",
    primaryValue: "v3.2 · adapted",
    caption: "Mg ↑40 · Rhodiola back in",
    status: "optimal",
    metrics: [
      { label: "Morning", value: "5 items", status: "optimal" },
      { label: "Day", value: "3 items", status: "optimal" },
      { label: "Night", value: "5 items", status: "watch" },
    ],
    spark: spark(83, 0.1),
  },
};

export const RON_SNAPSHOT: SystemSnapshot = {
  user: {
    name: "Ron",
    lastSyncedAt: "2026-05-03T19:32:39Z",
    state: "Recovery suppressed · sleep fragmented · ApoB priority",
  },
  modules,
};

/**
 * Demo script — the canonical "live interaction" sequence Jeffrey runs through
 * when the user taps Demo. Each step has a target SystemMode and a list of
 * module activations, so the SignalRouter knows which paths to fire.
 */
export interface DemoStep {
  id: number;
  mode: import("./systemTypes").SystemMode;
  durationMs: number;
  uiCopy: string;
  modules: DataModuleType[];
  /** Optional spoken text Jeffrey "says" during this step. */
  spoken?: string;
  /** If true, surface the recommendation card. */
  showRecommendation?: boolean;
}

export const DEMO_SCRIPT: DemoStep[] = [
  {
    id: 1,
    mode: "idle",
    durationMs: 2500,
    uiCopy: "Monitoring Ron's signals",
    modules: ["sleep", "recovery", "labs"],
  },
  {
    id: 2,
    mode: "listening",
    durationMs: 1800,
    uiCopy: "Listening",
    modules: ["sleep", "recovery"],
  },
  {
    id: 3,
    mode: "listening",
    durationMs: 3200,
    uiCopy: "HRV trend · Sleep deviation · Resting HR · Recovery signal",
    modules: ["sleep", "recovery", "stress"],
  },
  {
    id: 4,
    mode: "thinking",
    durationMs: 3000,
    uiCopy: "Interpreting recovery pattern",
    modules: ["sleep", "recovery", "stress", "labs", "stack"],
  },
  {
    id: 5,
    mode: "speaking",
    durationMs: 6000,
    uiCopy: "Sleep fragmented · RHR elevated · Stack timing adjustment",
    modules: ["sleep", "recovery", "stress", "stack"],
    spoken:
      "Your recovery looks suppressed because sleep was fragmented and your resting heart rate is elevated. I would move tonight's sleep stack 30 minutes earlier and keep stimulants lower today.",
  },
  {
    id: 6,
    mode: "recommendation",
    durationMs: 4500,
    uiCopy: "Recommendation issued",
    modules: ["stack"],
    showRecommendation: true,
  },
  {
    id: 7,
    mode: "idle",
    durationMs: 2000,
    uiCopy: "System updated",
    modules: ["stack"],
  },
];

/** The recommendation card body that surfaces during step 6. */
export const RECOMMENDATION = {
  primary: "Move tonight's sleep dose 30 minutes earlier.",
  reason: "Recovery signal suggests delayed wind-down.",
  secondary: "Keep stimulant load low today.",
};
