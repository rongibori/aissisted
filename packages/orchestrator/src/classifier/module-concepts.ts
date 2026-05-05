/**
 * Module concept anchors — the SEMANTIC reference texts used to detect topic
 * intent without keyword matching.
 *
 * Each module has 3-6 anchor phrases that capture the *space* of language
 * an investor (or Jeffrey) might use when discussing it. At build/init time
 * each anchor is embedded once via text-embedding-3-small and cached. At
 * runtime, streaming text is embedded and compared via cosine similarity to
 * each module's anchor cluster — the highest similarity wins.
 *
 * Why hand-crafted anchors instead of LLM-on-every-token: latency and cost.
 * Embeddings give us ~50ms in-browser matching once anchors are cached. That's
 * the visual reactivity layer. The LLM classifier still runs on final
 * utterances for accurate intent routing.
 *
 * Discipline:
 *   - Anchors should be PHRASES not single words (richer embedding signal).
 *   - 3-6 anchors per module — too few misses signal, too many blurs identity.
 *   - Cover the technical (clinical), colloquial (investor lay), and
 *     metaphorical (brand voice) registers in each module's anchor set.
 *   - When in doubt, prefer phrases Jeffrey would actually say in the master
 *     deck narrative — those are the texts most likely to embed-match well
 *     when he says them in voice.
 */

import type { ModuleId } from "../state/types.js";

export interface ModuleConcept {
  id: ModuleId;
  /** Display label, mirrors apps/web visualization labels. */
  label: string;
  /** 3-6 reference phrases that capture the conceptual space. */
  anchors: string[];
  /**
   * Weight applied to this module's max-similarity score. Default 1.0.
   * Used to bias detection if some modules consistently false-trigger.
   */
  weight?: number;
}

export const MODULE_CONCEPTS: Record<ModuleId, ModuleConcept> = {
  sleep: {
    id: "sleep",
    label: "Sleep",
    anchors: [
      "sleep quality and architecture, REM stages, deep slow-wave sleep",
      "sleep latency, time to fall asleep, sleep onset and continuity",
      "circadian rhythm, melatonin, sleep debt, total sleep time",
      "wake bouts, sleep efficiency, restorative sleep",
      "how I sleep, how my night went, last night's rest",
    ],
  },

  recovery: {
    id: "recovery",
    label: "Recovery",
    anchors: [
      "heart rate variability HRV, recovery score, parasympathetic tone",
      "training load, adaptation, deload, rest day, ready to train",
      "regenerative state, restored, recovered, bouncing back",
      "vagal tone, autonomic balance, sympathetic dominance",
      "how my recovery is, am I ready, can I push it today",
    ],
  },

  stress: {
    id: "stress",
    label: "Stress",
    anchors: [
      "cortisol, stress response, allostatic load, sympathetic activation",
      "anxiety, mental load, cognitive strain, overwhelm",
      "stress markers, autonomic stress, perceived stress",
      "chronic stress, acute stressor, stress recovery",
      "feeling stressed, under pressure, dialed in or wound up",
    ],
  },

  performance: {
    id: "performance",
    label: "Performance",
    anchors: [
      "VO2 max, aerobic capacity, training output, exercise performance",
      "strain, exertion, training stress, daily activity",
      "physical capacity, output, power, peak performance",
      "fitness level, training adaptation, athletic readiness",
      "how I'm performing, output, capacity, can I go harder",
    ],
  },

  metabolic: {
    id: "metabolic",
    label: "Metabolic",
    anchors: [
      "glucose, insulin sensitivity, A1C HbA1c, HOMA-IR",
      "metabolic flexibility, fasting glucose, post-prandial glucose",
      "insulin resistance, metabolic syndrome, blood sugar control",
      "fat oxidation, metabolic efficiency, energy substrate",
      "metabolism, sugar handling, energy metabolism",
    ],
  },

  labs: {
    id: "labs",
    label: "Labs",
    anchors: [
      "ApoB, LDL particle count, lipid panel, cholesterol markers",
      "biomarkers, blood work, lab panel, clinical labs",
      "hsCRP, inflammation markers, ferritin, hormones",
      "thyroid panel, TSH free T4 T3, hormone biomarkers",
      "what my labs say, what changed in my bloodwork, lab results",
    ],
  },

  stack: {
    id: "stack",
    label: "Stack",
    anchors: [
      "supplement stack, daily protocol, formulation, dose",
      "personalized formula, supplements, ingredient stack",
      "compound, peptide, dosing, timing, regimen",
      "what's in my stack, my dose, today's formulation",
      "protocol changed, stack updated, formula adapted",
    ],
  },
};

// ─── Build-time helpers ──────────────────────────────────────────────────

/**
 * Flatten the concept tree into a list of (moduleId, anchorIndex, text)
 * tuples. Useful for batch embedding — the consumer embeds every text in one
 * API call, then groups by moduleId for storage.
 */
export interface FlatAnchor {
  moduleId: ModuleId;
  anchorIndex: number;
  text: string;
}

export function flattenAnchors(): FlatAnchor[] {
  const out: FlatAnchor[] = [];
  for (const moduleId of Object.keys(MODULE_CONCEPTS) as ModuleId[]) {
    const concept = MODULE_CONCEPTS[moduleId];
    concept.anchors.forEach((text, anchorIndex) => {
      out.push({ moduleId, anchorIndex, text });
    });
  }
  return out;
}

/**
 * Total anchor count — used for sanity-checking embedding batch responses.
 * Currently 7 modules × 5 anchors = 35.
 */
export const TOTAL_ANCHORS = flattenAnchors().length;
