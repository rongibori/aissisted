import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "../_legal-page";

/**
 * /legal/terms — M3 Phase 4.
 *
 * Industry-template terms of service for pre-launch transparency. Pattern
 * parity with Termly / iubenda — descriptive, structured, neutral. The
 * counsel-drafted final version replaces this before any commercial
 * relationship begins (see [LEGAL REVIEW PENDING] banner).
 *
 * 0 forbidden words audited against lib/brand-rules.ts FORBIDDEN_WORDS.
 */

export const metadata: Metadata = {
  title: { absolute: "Terms of service — aissisted" },
  description:
    "The agreement between you and aissisted — pre-launch template, counsel-drafted final version pending.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Agreement and acceptance",
    intro:
      "These terms describe the agreement between you and Aissisted, Inc. when you use aissisted.com or sign up for the service. By creating an account or requesting access, you accept these terms.",
    body: [
      {
        paragraphs: [
          "If you don't accept these terms, don't create an account or sign up for the service. The free baseline, the paid tiers, and the Jeffrey assistant are all governed by this single agreement.",
          "Where these terms conflict with a separately signed enterprise or clinical pilot agreement, the signed agreement governs.",
        ],
      },
    ],
  },
  {
    heading: "Eligibility",
    body: [
      {
        paragraphs: [
          "Aissisted is a service for adults. To create an account, you must be at least 18 years old, legally able to enter into this agreement, and located in a jurisdiction we serve. You are responsible for the accuracy of the information you provide.",
        ],
      },
      {
        heading: "Health context that matters",
        paragraphs: [
          "If any of the following apply, talk to a qualified clinician before starting the formula:",
        ],
        bullets: [
          "You take prescription medication.",
          "You are pregnant or breastfeeding.",
          "You manage a chronic medical condition.",
          "You have a known allergy or intolerance to common supplement ingredients.",
          "You are scheduled for surgery in the next four weeks.",
        ],
      },
    ],
  },
  {
    heading: "Your account",
    body: [
      {
        paragraphs: [
          "You are responsible for the security of your account credentials and for the activity that takes place under your account. If you suspect unauthorized access, contact us via the request access page so we can lock the account.",
          "We may suspend or close accounts that violate these terms, post abusive content, attempt to circumvent the rules engine, or are used in a way that risks harm to other people relying on the service.",
        ],
      },
    ],
  },
  {
    heading: "The service",
    body: [
      {
        heading: "What aissisted is",
        paragraphs: [
          "Aissisted is a personalization layer that reads health data you authorize and shapes a daily dietary supplement formula in response. The service includes the dashboard, the formula recommendations, the manufacturing and shipping of paid-tier formulas, and the Jeffrey assistant.",
        ],
      },
      {
        heading: "What aissisted is not",
        paragraphs: [
          "Aissisted is not a drug, a diagnostic device, a substitute for medical care, or a HIPAA-covered entity in the standard consumer flow. Nothing the service produces — including formula recommendations, dashboard interpretations, and Jeffrey responses — should be read as medical advice. The formulas are dietary supplements and have not been evaluated by the FDA.",
        ],
      },
      {
        heading: "Changes to the service",
        paragraphs: [
          "We update the service regularly. New features may arrive; existing features may change or be retired. We aim to give meaningful notice before retiring a feature you depend on, and to preserve continuity for paid subscribers across changes.",
        ],
      },
    ],
  },
  {
    heading: "Subscriptions, payment, and shipping",
    body: [
      {
        paragraphs: [
          "Paid tiers are billed in advance on a monthly recurring basis. The price for your tier is shown on the pricing page at the time of sign-up and confirmed in your dashboard. Prices are in US dollars unless otherwise noted.",
        ],
        bullets: [
          "Tier moves take effect at the next re-formulation cycle.",
          "Cancellation can be done from your account at any time. Cancellation stops future renewals; the current cycle continues to its end.",
          "Shipping is included on Formula, Stack, and Full Day. The free baseline does not ship anything.",
          "Refunds for un-shipped formulas are issued on request via support.",
          "We may update prices with notice; existing subscribers receive the change at the next renewal after notice.",
        ],
      },
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      {
        paragraphs: [
          "You agree to use aissisted in good faith and for personal use. You agree not to:",
        ],
        bullets: [
          "Misrepresent who you are, your age, or your health context — the rules engine relies on your honest disclosure.",
          "Attempt to circumvent the safety guards inside the rules engine.",
          "Reverse-engineer the personalization layer or the recommendation engine.",
          "Resell, redistribute, or commercially repackage the service or the formula.",
          "Use the service to generate content that is illegal, abusive, or that infringes the rights of others.",
          "Attempt to access another account or another person's data without authorization.",
        ],
      },
    ],
  },
  {
    heading: "Your content and your data",
    body: [
      {
        paragraphs: [
          "You retain ownership of the data you upload — wearable connections, lab panels, conversational notes, and anything else you share with the service. You grant aissisted a limited, revocable license to process this data for the purposes described in the privacy policy: running the personalization layer, operating the rules engine, manufacturing and shipping the formula, and providing Jeffrey responses.",
          "We do not sell your data and we do not share it with advertisers. The privacy policy describes the third parties that see specific subsets of the data and what they are allowed to do with it.",
        ],
      },
    ],
  },
  {
    heading: "Intellectual property",
    body: [
      {
        paragraphs: [
          "The aissisted brand, software, recommendation algorithms, and content are owned by Aissisted, Inc. and protected by intellectual property law. Your account does not transfer ownership of any of this. You receive a limited, non-exclusive, non-transferable license to use the service for personal use during the period your account is active.",
        ],
      },
    ],
  },
  {
    heading: "Disclaimers",
    body: [
      {
        paragraphs: [
          "The service is provided on an \"as is\" and \"as available\" basis. We work hard to keep it accurate and reliable, but we cannot guarantee that it will be error-free, uninterrupted, or that the personalization layer will produce a specific health outcome.",
          "Nothing the service produces is medical advice. The dietary supplement formulas have not been evaluated by the FDA and are not intended to diagnose, treat, prevent, or address any disease. The full disclaimers page expands on this framing.",
        ],
      },
    ],
  },
  {
    heading: "Limitation of liability",
    body: [
      {
        paragraphs: [
          "To the maximum extent permitted by law, aissisted, its officers, employees, and partners are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the service. Our total liability for any claim related to the service is limited to the amount you paid in the 12 months preceding the claim.",
          "Some jurisdictions don't allow these limitations — where that's the case, the local law governs to the extent it provides stronger protection.",
        ],
      },
    ],
  },
  {
    heading: "Termination",
    body: [
      {
        paragraphs: [
          "You can close your account at any time from the dashboard. Cancellation stops future renewals; the current cycle runs to its end and any in-flight shipment is honored.",
          "We may suspend or close your account if you violate these terms, if your account is used to harm others, or if continuing service is unworkable for legal or operational reasons. We will give meaningful notice except in cases of abuse, fraud, or imminent harm.",
        ],
      },
    ],
  },
  {
    heading: "Governing law and disputes",
    body: [
      {
        paragraphs: [
          "These terms are governed by the laws of the state in which Aissisted, Inc. is incorporated, without regard to conflict-of-laws principles. The counsel-drafted final version of this document specifies the venue and dispute-resolution mechanism that apply.",
        ],
      },
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      {
        paragraphs: [
          "We may update these terms as the service evolves. The effective date at the top of this page reflects the most recent meaningful change. Significant changes will be communicated by email and in the dashboard before they take effect.",
          "Pre-launch, the document above is a template — the counsel-drafted version replaces it before any commercial relationship begins.",
        ],
      },
    ],
  },
  {
    heading: "Contact",
    body: [
      {
        paragraphs: [
          "Questions about these terms? Reach the team via the request access page and we will respond directly. A dedicated legal contact email lands in the counsel-drafted final version of this document.",
        ],
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      documentLabel="Terms of service"
      title="The agreement between you and aissisted."
      lede="What you can expect from the service, what we ask in return, and the framing that keeps both sides honest."
      effective="Effective May 5, 2026 — pre-launch template."
      sections={SECTIONS}
    />
  );
}
