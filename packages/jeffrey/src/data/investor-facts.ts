/**
 * Investor facts — the reference layer Jeffrey reasons from.
 *
 * These are deliberately short and structural. Numbers are placeholders where
 * Ron has not yet locked a figure — Jeffrey will say "not set" rather than
 * invent, and this file is the single place to update them.
 */

import type { InvestorTopic } from "../investor.js";

type FactMap = Record<InvestorTopic, string>;

export const investorFacts: FactMap = {
  market:
    "US supplements + personalised wellness is a large, fragmented category. The wedge is the move from SKU-based selling to system-based membership — biomarker + wearable driven formulas that adapt over time.",

  "tam-sam-som":
    "TAM frame: US VMS (vitamins, minerals, supplements) + adjacent functional nutrition. SAM frame: the subset of that category buyable by high-intent personalisation buyers with labs + wearables willingness. SOM frame: initial waitlist + partner channels at launch. Exact figures: not set — cite the frame, not a fabricated number.",

  "business-model":
    "Subscription + adaptive formulas as the primary line. Optional one-off lab workups. Data value compounds: every biomarker read and wearable week improves the personalisation engine for the person it belongs to, which improves retention.",

  "unit-economics":
    "Contribution margin target: not set. Key levers: per-formula COGS, fulfilment, and the share of members on the continuous adaptation tier. Adaptive tier is higher margin and the retention driver.",

  "ltv-cac":
    "Not set. Assumption frame: LTV is driven by membership duration, which is driven by felt adaptation, which is driven by data input density. CAC frame: early channels are waitlist, founder network, and select partner programs. Paid channels are a later lever.",

  moat:
    "Three layers. (1) Data moat — longitudinal per-person biomarker + wearable data, with explicit consent. (2) Formulation moat — the rules engine + AI personalisation layer refined on that data. (3) Experience moat — Jeffrey and the owned-feeling interface. Competitors replicate one; none replicate all three at once.",

  defensibility:
    "The data + formulation loop is the hardest part to clone. Wearable and EHR integrations take regulatory and engineering effort. Jeffrey is an additional, brand-level differentiator.",

  comparables:
    "Hims — telehealth-gated subscription, narrow SKU range, little adaptation. Function of Beauty — D2C personalised CPG, personalisation ends at sign-up. Care/of — subscription vitamins, now wound down, useful as a lesson in what a catalogue-plus-quiz ceiling looks like. Levels / Lingo — continuous signal + coaching but not formulation. None are a closed-loop biomarker+wearable+formulation system.",

  "valuation-frame":
    "Not set. Round frame: seed / pre-seed context. Valuation will be shaped by traction markers, team, and committed medical board sign-on rather than a multiple at this stage.",

  "competitive-landscape":
    "Category is crowded at the surface, thin at depth. Most competitors are catalogue-with-quiz or subscription-telehealth. Closed-loop health — labs + wearables + continuous formulation — is the empty quadrant Aissisted is building into.",

  "integrations-roadmap":
    "Phase 1: MyChart via SMART on FHIR (labs + history), WHOOP, Apple Health / Apple Watch, Oura. Phase 2: Dexcom / CGM, direct lab partners, additional EHR coverage. Server-side only; PHI handled under HIPAA + wellness posture.",

  "regulatory-posture":
    "Supplement regulatory posture in the US (dietary supplement framework, not drug). HIPAA-adjacent posture for any PHI pulled via EHR integrations. Medical advisory board in flight. We explain and interpret; we do not diagnose.",

  team:
    "Founder-led. Medical board in flight. Engineering + product shipping from a small, senior team with domain time in AI systems, product design, and health data.",

  traction:
    "Waitlist and early-access signups are the current tracked metric. Exact counts: not set in this reference — consult live dashboard before citing.",

  risks:
    "Regulatory shift in health data (EHR integration terms, HIPAA interpretations). Supplement category noise. Personalisation claims must stay well short of medical claims. Execution risk around sustaining voice + quality across surfaces as the system scales.",
};
