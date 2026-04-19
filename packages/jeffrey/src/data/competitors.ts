/**
 * Competitor reference.
 *
 * Jeffrey uses these entries to frame comparisons crisply without attacking.
 * Keep each entry short — the shape + one-line difference is what matters.
 */

export const competitors = {
  hims: {
    id: "hims",
    name: "Hims & Hers",
    shape: "subscription-telehealth offering — narrow SKU set, opinionated, rarely adaptive",
    focus: "telehealth-gated prescription and supplement bundles",
  },
  functionOfBeauty: {
    id: "functionOfBeauty",
    name: "Function of Beauty",
    shape: "D2C personalised consumer-packaged-goods — personalisation ends at sign-up",
    focus: "personalised hair and skin CPG",
  },
  careOf: {
    id: "careOf",
    name: "Care/of",
    shape: "catalogue-with-quiz subscription — now wound down; useful as a lesson in category ceiling",
    focus: "quiz-based vitamin pack subscription",
  },
  levels: {
    id: "levels",
    name: "Levels",
    shape: "continuous signal plus coaching — strong data, no formulation layer",
    focus: "continuous glucose + behaviour coaching",
  },
  lingo: {
    id: "lingo",
    name: "Lingo (Abbott)",
    shape: "continuous signal plus coaching — strong hardware, no formulation layer",
    focus: "consumer CGM",
  },
  ritual: {
    id: "ritual",
    name: "Ritual",
    shape: "catalogue-with-quiz subscription — transparency narrative, minimal personalisation",
    focus: "daily supplement subscription",
  },
  fullyVital: {
    id: "fullyVital",
    name: "Fully Vital / similar D2C",
    shape: "D2C personalised CPG — personalisation stops after onboarding",
    focus: "specific outcome (hair, skin) subscriptions",
  },
} as const;

export type CompetitorId = keyof typeof competitors;
