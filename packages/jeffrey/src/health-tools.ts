/**
 * Health interpretation tools.
 *
 * Jeffrey's surface for interpreting biomarkers, HRV, sleep, recovery, and
 * wearable streams for the person they belong to.
 *
 * Scope rules (important):
 *   - We explain signals and suggest wellness protocols.
 *   - We do NOT diagnose, prescribe, or present ourselves as a clinician.
 *   - When a pattern warrants clinical attention, Jeffrey says so plainly
 *     and defers to a clinician. This is encoded in `escalateIfPatternMatches`.
 */

import type { JeffreySurface, JeffreyToneMode } from "./types.js";

export const healthSurface = {
  surface: "health" as JeffreySurface,
  tone: "health" as JeffreyToneMode,
  temperature: 0.3,
  maxTokens: 700,
} as const;

/**
 * The biomarker families Jeffrey currently interprets. Each family has a
 * short natural-language framing for reference in prompts.
 */
export const biomarkerFamilies = {
  metabolic: "fasting glucose, HbA1c, fasting insulin, HOMA-IR, triglycerides",
  lipids: "ApoB, LDL-C, HDL-C, Lp(a), triglyceride/HDL ratio",
  inflammation: "hs-CRP, ferritin, homocysteine, GGT",
  hormones: "testosterone (total + free), SHBG, estradiol, cortisol, thyroid panel",
  nutrients: "vitamin D, B12, folate, magnesium (RBC), zinc, iron/ferritin",
  bloodCount: "CBC, RBC indices, WBC differential, platelets",
  kidneyLiver: "creatinine, eGFR, ALT, AST, albumin, bilirubin",
} as const;

export const wearableSignals = {
  hrv: "heart rate variability (rMSSD overnight)",
  rhr: "resting heart rate trend",
  sleep: "total sleep, deep sleep %, REM %, wake after sleep onset",
  recovery: "WHOOP recovery score / Oura readiness",
  strain: "WHOOP strain / activity load",
  spo2: "overnight oxygen saturation",
  temperature: "skin temperature deviation from baseline",
} as const;

/**
 * Patterns where Jeffrey must recommend a clinician rather than interpret
 * alone. This is a conservative, hand-curated list.
 */
export const clinicalEscalationPatterns: Array<{
  id: string;
  description: string;
}> = [
  { id: "chest-pain", description: "Chest pain, pressure, or radiating arm pain" },
  { id: "resting-tachy", description: "Sustained resting HR > 110 bpm without cause" },
  { id: "severe-anemia", description: "Hemoglobin < 10 g/dL" },
  { id: "acute-renal", description: "eGFR < 45 or rapid drop > 15 in 3 months" },
  { id: "ldl-extreme", description: "ApoB > 150 mg/dL or LDL-C > 190 mg/dL" },
  { id: "thyroid-storm", description: "TSH < 0.1 with symptoms or > 10" },
  { id: "mental-health", description: "Any self-harm or acute psychiatric signal" },
];

/**
 * Returns the escalation pattern ID if a free-text input matches, else null.
 * Used as a pre-flight check before Jeffrey answers a health question.
 */
export function escalateIfPatternMatches(text: string): string | null {
  const t = text.toLowerCase();
  for (const pat of clinicalEscalationPatterns) {
    const kw = pat.description.toLowerCase().split(/[,;]/)[0]?.trim();
    if (kw && t.includes(kw)) return pat.id;
  }
  if (/suicid|self.?harm|kill myself/.test(t)) return "mental-health";
  return null;
}

/**
 * Tool-call schemas Jeffrey can invoke on the health surface. The actual
 * implementations live in apps/api; this package only declares the shape so
 * the OpenAI tool-calling loop is typed.
 */
export const healthToolSchemas = {
  getLatestBiomarkers: {
    name: "getLatestBiomarkers",
    description:
      "Fetch the user's most recent lab values for a biomarker family.",
    parameters: {
      type: "object",
      properties: {
        family: {
          type: "string",
          enum: Object.keys(biomarkerFamilies),
        },
        lookbackDays: { type: "number", default: 180 },
      },
      required: ["family"],
    },
  },
  getWearableTrend: {
    name: "getWearableTrend",
    description: "Fetch a rolling-window trend for a wearable signal.",
    parameters: {
      type: "object",
      properties: {
        signal: { type: "string", enum: Object.keys(wearableSignals) },
        windowDays: { type: "number", default: 14 },
      },
      required: ["signal"],
    },
  },
  getCurrentProtocol: {
    name: "getCurrentProtocol",
    description: "Fetch the user's current Aissisted formula and rationale.",
    parameters: { type: "object", properties: {} },
  },
} as const;
