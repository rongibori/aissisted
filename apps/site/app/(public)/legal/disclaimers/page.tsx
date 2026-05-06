import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "../_legal-page";

/**
 * /legal/disclaimers — M3 Phase 4.
 *
 * Industry-template dietary-supplement and AI-output disclaimers for
 * pre-launch transparency. Counsel-drafted final version replaces this
 * before any commercial relationship begins (see [LEGAL REVIEW PENDING]
 * banner).
 *
 * Compliance:
 *   · The FDA / dietary-supplement framing is explicit — formulas are not
 *     evaluated by the FDA, do not diagnose/treat/prevent/address disease.
 *   · 0 medical claims. Every product description uses "supports / studied
 *     for / associated with" verb-class only.
 *   · 0 forbidden words audited against lib/brand-rules.ts FORBIDDEN_WORDS.
 */

export const metadata: Metadata = {
  title: { absolute: "Disclaimers — aissisted" },
  description:
    "Dietary supplement, AI-output, and editorial disclaimers — pre-launch template, counsel-drafted final version pending.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Plain-language summary",
    intro:
      "Read this first if you read nothing else on the page. The bullets below are the disclaimers in their shortest honest form. The sections that follow expand on each one.",
    body: [
      {
        paragraphs: [
          "Aissisted is a dietary supplement service with a personalization layer on top. The service is not a substitute for medical care. The Jeffrey assistant is not a clinician. The dashboard is not a diagnostic tool.",
        ],
        bullets: [
          "Aissisted formulas have not been evaluated by the FDA.",
          "Aissisted formulas are not intended to diagnose, treat, prevent, or address any disease.",
          "Aissisted does not provide medical advice. The Jeffrey assistant is not a clinician.",
          "Talk to a qualified clinician before starting any new supplement regimen, especially if you take medication, are pregnant or breastfeeding, or manage a chronic condition.",
          "If you experience an adverse reaction, stop the formula and consult a clinician.",
          "AI outputs (recommendations, dashboard interpretations, Jeffrey responses) are model-generated — review them before acting and use your judgment.",
        ],
      },
    ],
  },
  {
    heading: "FDA and dietary-supplement framing",
    body: [
      {
        paragraphs: [
          "The aissisted formula products are dietary supplements as defined under the United States Dietary Supplement Health and Education Act (DSHEA). Statements regarding ingredient categories on this site (the science page, the formula pages, the dashboard) describe a structure-function context and have not been evaluated by the Food and Drug Administration.",
          "The aissisted service and the products it ships are not intended to diagnose, treat, prevent, or address any disease. Where the science page describes biomarker categories or evidence tiers, those descriptions inform formulation rationale and are not claims about a specific health outcome.",
        ],
      },
    ],
  },
  {
    heading: "Not medical advice",
    body: [
      {
        paragraphs: [
          "Nothing the aissisted service produces — not the formula recommendation, not the dashboard interpretation, not the Jeffrey response — is medical advice. The personalization layer reads health data and shapes a dietary supplement formula in response. It does not diagnose conditions, prescribe medications, or replace the relationship between you and a qualified clinician.",
        ],
        bullets: [
          "Talk to a qualified clinician before starting a new supplement regimen if you take prescription medication, are pregnant or breastfeeding, manage a chronic medical condition, are scheduled for surgery in the next four weeks, or are under 18.",
          "Bring the formula list to your appointment — it reads cleanly on a chart and your clinician can review it directly.",
          "Stop the formula and consult a clinician if you experience an adverse reaction. Report serious adverse events to the FDA's MedWatch program at fda.gov/safety/medwatch.",
        ],
      },
    ],
  },
  {
    heading: "Aissisted is not a HIPAA-covered entity (consumer flow)",
    body: [
      {
        paragraphs: [
          "In the standard direct-to-consumer flow, aissisted is not a HIPAA-covered entity. The same regulatory frame that applies to a hospital or a clinician's office does not automatically apply to a wellness service that you sign up for directly.",
          "We treat your data with the discipline that the spirit of HIPAA describes — encryption at rest and in transit, scoped access, audit logs, vendor review — but the legal framework that governs is consumer privacy law, not HIPAA. The privacy policy describes the practical handling.",
          "The aissisted clinical pilot program operates under a separate written agreement with full HIPAA-grade handling. If you are enrolled in the pilot, the pilot agreement governs your data.",
        ],
      },
    ],
  },
  {
    heading: "AI outputs",
    body: [
      {
        paragraphs: [
          "The personalization layer and the Jeffrey assistant are model-generated systems. They are designed to be accountable — every recommendation arrives with the reasoning attached — but they are not infallible.",
        ],
        bullets: [
          "Recommendations should be reviewed before being acted on. Read the rationale, check that it matches your situation, and use your own judgment.",
          "Jeffrey responses are AI-generated. Jeffrey is not a clinician, will not interpret a lab as a doctor would, and will defer to you and your care team on anything beyond its scope.",
          "If a model output looks wrong, contradicts your clinician, or surfaces an interaction the rules engine did not catch, stop and contact us via the request access page so we can review.",
        ],
      },
    ],
  },
  {
    heading: "Editorial and reference disclaimers",
    body: [
      {
        paragraphs: [
          "References to ingredient categories, biomarker categories, and evidence tiers on this site reflect a snapshot of how aissisted's internal evidence framework reads the published literature at the date shown. The framework is reviewed quarterly. Specific paper citations are not displayed in marketing copy by design — the framework summarizes a body of evidence, not any single study.",
          "External links may appear on this site for context. Aissisted does not endorse and is not responsible for the content of external sites.",
        ],
      },
    ],
  },
  {
    heading: "Testimonials and outcomes",
    body: [
      {
        paragraphs: [
          "Where the site shows a quote, an outcome description, or a story from someone using aissisted, the story is presented as a personal account and not as a typical or expected outcome. Individual responses to a dietary supplement vary. The personalization layer is built specifically because individual responses vary.",
        ],
      },
    ],
  },
  {
    heading: "Affiliate and material connection disclosure",
    body: [
      {
        paragraphs: [
          "Where aissisted has a material connection with an external party referenced on the site (for example, a partnership with a wearable device or lab service), that connection is disclosed at the point of reference. We don't run paid advertising for third-party supplement products on aissisted properties.",
        ],
      },
    ],
  },
  {
    heading: "Errors and corrections",
    body: [
      {
        paragraphs: [
          "We work hard to keep this site accurate. Errors do happen — pricing, product descriptions, scientific framing — and we correct them promptly when we find them or when you report them. Reach the team via the request access page if something looks off.",
        ],
      },
    ],
  },
  {
    heading: "Changes to these disclaimers",
    body: [
      {
        paragraphs: [
          "We update these disclaimers as the service evolves and as the regulatory frame around dietary supplements and AI-assisted services moves. The effective date at the top of this page reflects the most recent meaningful change. Significant changes will be communicated by email and in the dashboard before they take effect.",
          "Pre-launch, the document above is a template — the counsel-drafted version replaces it before any commercial relationship begins.",
        ],
      },
    ],
  },
];

export default function DisclaimersPage() {
  return (
    <LegalPage
      documentLabel="Disclaimers"
      title="The honest frame around what aissisted is."
      lede="Dietary supplements, AI outputs, and the limits of what a personalization layer can reasonably claim. The plain-language summary at the top is the short version."
      effective="Effective May 5, 2026 — pre-launch template."
      sections={SECTIONS}
    />
  );
}
