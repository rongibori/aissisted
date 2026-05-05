/**
 * @aissisted/jeffrey/safety — rule definitions (v1)
 *
 * Implements the four rule families called out in roadmap §5.4 and exercised
 * by `packages/jeffrey-evals/eval-sets/safety-rule-coverage.json`:
 *
 *   I-18 — Medication-specific contraindications
 *   I-19 — Condition-specific contraindications
 *   I-20 — Dose ceiling enforcement
 *   I-21 — Escalation triggers (clinical / mental-health crisis)
 *
 * Note on rule IDs: the eval cohort uses descriptive `I-18-*` style IDs.
 * SAFETY_RULE_PACK_V1.md uses numeric `SAFE-001` style IDs. We keep BOTH —
 * `id` is the canonical numeric, `evalId` is the eval-aligned string. The
 * audit ledger logs both so PRs can link a regression to a clinical rule.
 *
 * Clinical sign-off: each rule below MUST be reviewed by a licensed clinician
 * before going live. The TODO(clinical:NAME) markers are the explicit hooks.
 */

import type { SafetyRule } from "./types.js";

// ─── I-18 — Medication contraindications ───────────────────────────────────

const STATIN_REGEX = /(atorvastatin|rosuvastatin|simvastatin|pravastatin|lovastatin|fluvastatin|pitavastatin)/i;

const I_18_STATIN_RED_YEAST: SafetyRule = {
  id: "SAFE-018-01",
  // @ts-expect-error — extra eval-aligned id
  evalId: "I-18-statin-red-yeast-rice",
  name: "Statin + red yeast rice",
  version: "1.0.0",
  checkpoint: "stage_1",
  category: "interaction",
  severity: "block",
  description:
    "Red yeast rice contains naturally-occurring lovastatin analogs. Stacking with a prescribed statin compounds risk of myopathy and rhabdomyolysis.",
  condition: (ctx) => {
    if (!ctx.candidate) return false;
    if (!ctx.candidate.name.toLowerCase().includes("red yeast rice")) return false;
    return ctx.profile.medications.some((m) => STATIN_REGEX.test(m));
  },
  action: {
    onTrigger: "exclude_ingredient",
    responseTemplate:
      "Red yeast rice contains a natural statin analog. Combining with your prescribed statin compounds the same liver and muscle pathway. That's a conversation for your physician — not the formula.",
    auditMessage: "I-18 red-yeast-rice + statin → ingredient excluded",
    remediation: "Discuss with prescribing physician before adding any statin-class supplement.",
  },
  evidence: "JAMA Intern Med 2017; statin-related myopathy literature",
  // TODO(clinical:reviewedBy): set to licensed clinician before deploy
};

const I_18_WARFARIN_VITK: SafetyRule = {
  id: "SAFE-018-02",
  // @ts-expect-error — extra eval-aligned id
  evalId: "I-18-warfarin-vitamin-k",
  name: "Warfarin + Vitamin K",
  version: "1.0.0",
  checkpoint: "stage_1",
  category: "interaction",
  severity: "block",
  description:
    "Vitamin K antagonizes warfarin. Inconsistent supplementation produces unpredictable INR swings.",
  condition: (ctx) => {
    if (!ctx.candidate) return false;
    const n = ctx.candidate.name.toLowerCase();
    if (!(n.includes("vitamin k") || n.includes("k1") || n.includes("k2") || n.includes("menaquinone") || n.includes("phylloquinone"))) return false;
    return ctx.profile.medications.some((m) => m.toLowerCase().includes("warfarin"));
  },
  action: {
    onTrigger: "exclude_ingredient",
    responseTemplate:
      "Vitamin K and warfarin pull in opposite directions. We can't tune the formula around a moving INR — that needs your prescriber's hand on the wheel.",
    auditMessage: "I-18 vitamin-K + warfarin → ingredient excluded",
    remediation: "Vitamin K dosing must be coordinated with anticoagulation clinic.",
  },
  evidence: "Holbrook et al., Arch Intern Med 2005",
};

const I_18_SSRI_5HTP: SafetyRule = {
  id: "SAFE-018-03",
  // @ts-expect-error — extra eval-aligned id
  evalId: "I-18-ssri-5htp",
  name: "SSRI + 5-HTP / St John's Wort",
  version: "1.0.0",
  checkpoint: "stage_1",
  category: "interaction",
  severity: "block",
  description:
    "Serotonergic supplements stacked with SSRIs/SNRIs raise serotonin syndrome risk.",
  condition: (ctx) => {
    if (!ctx.candidate) return false;
    const n = ctx.candidate.name.toLowerCase();
    const isSerotonergic =
      n.includes("5-htp") || n.includes("5htp") || n.includes("st john") || n.includes("hypericum") || n.includes("tryptophan");
    if (!isSerotonergic) return false;
    const ssriRegex = /(sertraline|fluoxetine|escitalopram|citalopram|paroxetine|venlafaxine|duloxetine|trazodone|amitriptyline|maoi|phenelzine|tranylcypromine)/i;
    return ctx.profile.medications.some((m) => ssriRegex.test(m));
  },
  action: {
    onTrigger: "exclude_ingredient",
    responseTemplate:
      "Stacking serotonergic supplements on top of your prescription is one of the few places we firmly draw the line. Serotonin syndrome isn't theoretical.",
    auditMessage: "I-18 serotonergic + SSRI → ingredient excluded",
    remediation: "Serotonergic supplementation requires prescriber coordination.",
  },
  evidence: "Boyer & Shannon, NEJM 2005",
};

// ─── I-19 — Condition contraindications ────────────────────────────────────

const I_19_KIDNEY_POTASSIUM: SafetyRule = {
  id: "SAFE-019-01",
  // @ts-expect-error
  evalId: "I-19-kidney-disease-potassium",
  name: "CKD + high-dose potassium",
  version: "1.0.0",
  checkpoint: "stage_1",
  category: "interaction",
  severity: "block",
  description: "Reduced renal clearance + supplemental potassium raises hyperkalemia risk.",
  condition: (ctx) => {
    if (!ctx.candidate) return false;
    if (!ctx.candidate.name.toLowerCase().includes("potassium")) return false;
    if ((ctx.candidate.doseMg ?? 0) < 200) return false; // dietary trace OK
    return ctx.profile.conditions.some((c) =>
      ["ckd", "chronic-kidney-disease", "kidney-disease", "renal-failure"].some((k) => c.toLowerCase().includes(k)),
    );
  },
  action: {
    onTrigger: "exclude_ingredient",
    responseTemplate: "Supplemental potassium and reduced renal clearance is a combination we won't run without nephrology in the loop.",
    auditMessage: "I-19 CKD + potassium ≥200mg → excluded",
  },
};

const I_19_PREGNANCY: SafetyRule = {
  id: "SAFE-019-02",
  // @ts-expect-error
  evalId: "I-19-pregnancy",
  name: "Pregnancy contraindications",
  version: "1.0.0",
  checkpoint: "stage_1",
  category: "interaction",
  severity: "escalate",
  description: "Many supplements are contraindicated or poorly studied in pregnancy. Defer to OB.",
  condition: (ctx) => Boolean(ctx.profile.pregnant) && Boolean(ctx.candidate),
  action: {
    onTrigger: "escalate_to_clinician",
    responseTemplate:
      "Pregnancy is a different clinical surface entirely. We're not the right system for this — your OB is. Once you're past delivery, we can pick up where we left off.",
    auditMessage: "I-19 pregnancy → escalate",
  },
};

// ─── I-20 — Dose ceiling enforcement ───────────────────────────────────────

const I_20_VITD_HIGH: SafetyRule = {
  id: "SAFE-020-01",
  // @ts-expect-error
  evalId: "I-20-vitamin-d-ceiling",
  name: "Vitamin D dose ceiling",
  version: "1.0.0",
  checkpoint: "stage_1",
  category: "dosing",
  severity: "block",
  description:
    "Vitamin D > 10,000 IU/day requires monitoring. Block if user has no recent 25-OH-D lab on file.",
  condition: (ctx) => {
    if (!ctx.candidate) return false;
    if (!ctx.candidate.name.toLowerCase().includes("vitamin d")) return false;
    const doseIu = (ctx.candidate.doseMg ?? 0) * 40; // rough conversion if dose given in mcg
    if (doseIu < 10_000) return false;
    const hasRecentLab = (ctx.profile.recentLabs ?? []).some(
      (l) => /25-?oh|vitamin d|vit d/i.test(l.biomarker),
    );
    return !hasRecentLab;
  },
  action: {
    onTrigger: "exclude_ingredient",
    responseTemplate:
      "Doses above 10,000 IU need a recent 25-OH-D in your file. Drop a lab in and we'll revisit.",
    auditMessage: "I-20 vitamin D >10kIU + no recent lab → excluded",
  },
};

// ─── I-21 — Escalation triggers ────────────────────────────────────────────

const CRISIS_PATTERNS = [
  /\b(kill myself|suicid|end (my|it all)|don't want to be here|harm myself)\b/i,
  /\b(chest pain|crushing chest|left arm.*numb|stroke|can'?t breathe|bleeding heavily)\b/i,
  /\b(overdos(e|ed)|took too (many|much))\b/i,
];

const I_21_MENTAL_HEALTH_CRISIS: SafetyRule = {
  id: "SAFE-021-01",
  // @ts-expect-error
  evalId: "I-21-mental-health-crisis",
  name: "Mental health crisis escalation",
  version: "1.0.0",
  checkpoint: "safety_gate",
  category: "red_flag",
  severity: "escalate",
  description: "Crisis language in user input → surface 988 + frame warmly without diagnosis.",
  condition: (ctx) => {
    if (!ctx.input) return false;
    return CRISIS_PATTERNS.some((p) => p.test(ctx.input!));
  },
  action: {
    onTrigger: "escalate_to_clinician",
    responseTemplate:
      "I'm hearing something heavy. Please call or text 988 — that's the Suicide & Crisis Lifeline. They'll stay with you. The formula is here when you're ready, but right now this is the conversation.",
    auditMessage: "I-21 mental-health-crisis → escalate to 988",
  },
};

const I_21_MEDICAL_EMERGENCY: SafetyRule = {
  id: "SAFE-021-02",
  // @ts-expect-error
  evalId: "I-21-medical-emergency",
  name: "Medical emergency escalation",
  version: "1.0.0",
  checkpoint: "safety_gate",
  category: "red_flag",
  severity: "escalate",
  description: "Acute symptoms (chest pain, stroke signs, severe bleeding) → 911.",
  condition: (ctx) => {
    if (!ctx.input) return false;
    return /\b(chest pain|crushing chest|left arm.*numb|stroke|can'?t breathe|bleeding heavily|sudden vision loss)\b/i.test(ctx.input);
  },
  action: {
    onTrigger: "escalate_to_clinician",
    responseTemplate:
      "Stop. Call 911 now. What you're describing is not something to manage with a supplement formula — it's emergency medical care. We'll be here when you're back.",
    auditMessage: "I-21 medical-emergency → escalate to 911",
  },
};

const I_21_EATING_DISORDER: SafetyRule = {
  id: "SAFE-021-03",
  // @ts-expect-error
  evalId: "I-21-eating-disorder",
  name: "Eating disorder pattern",
  version: "1.0.0",
  checkpoint: "safety_gate",
  category: "red_flag",
  severity: "escalate",
  description: "Restrictive-language patterns or known ED history → no dose math, escalate to specialist.",
  condition: (ctx) => {
    if (ctx.profile.mentalHealthFlags?.includes("history-eating-disorder")) return true;
    if (!ctx.input) return false;
    return /\b(stop eating|starve|purge|how few calories|too fat|can'?t eat)\b/i.test(ctx.input);
  },
  action: {
    onTrigger: "escalate_to_clinician",
    responseTemplate:
      "I'm not the right system for this conversation. NEDA (the National Alliance for Eating Disorders) has trained people who are. Their helpline is the next step.",
    auditMessage: "I-21 eating-disorder → escalate to NEDA",
  },
};

// ─── Diagnosis refusal (DNR-aligned) ───────────────────────────────────────

const I_22_DIAGNOSIS_REFUSAL: SafetyRule = {
  id: "SAFE-022-01",
  // @ts-expect-error
  evalId: "I-22-diagnosis-refusal",
  name: "Medical diagnosis refusal",
  version: "1.0.0",
  checkpoint: "safety_gate",
  category: "red_flag",
  severity: "flag",
  description: "Refuse to diagnose, in-character. Redirect to physician.",
  condition: (ctx) => {
    if (!ctx.input) return false;
    return /\b(do i have|am i (diabetic|prediabetic|hypothyroid|cancer)|what.*condition|diagnos[ei])\b/i.test(ctx.input);
  },
  action: {
    onTrigger: "flag_response",
    responseTemplate:
      "Diagnosis isn't a conversation we have here — that's a conversation for your physician. What I can do is hold the formula steady while you find out, and adjust once you know.",
    auditMessage: "I-22 diagnosis-question → in-character refusal",
  },
};

// ─── Export the rule pack ──────────────────────────────────────────────────

export const SAFETY_RULES_V1: SafetyRule[] = [
  I_18_STATIN_RED_YEAST,
  I_18_WARFARIN_VITK,
  I_18_SSRI_5HTP,
  I_19_KIDNEY_POTASSIUM,
  I_19_PREGNANCY,
  I_20_VITD_HIGH,
  I_21_MENTAL_HEALTH_CRISIS,
  I_21_MEDICAL_EMERGENCY,
  I_21_EATING_DISORDER,
  I_22_DIAGNOSIS_REFUSAL,
];
