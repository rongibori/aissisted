import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "../_legal-page";

/**
 * /legal/privacy — M3 Phase 4.
 *
 * Industry-template privacy policy for pre-launch transparency. Structured
 * sections covering data collection, third-party processors, your rights,
 * security, retention, and contact. Counsel-drafted final version arrives
 * before any commercial relationship begins — that promise lives in the
 * [LEGAL REVIEW PENDING] banner at the top of the page.
 *
 * Pattern parity: Termly / iubenda style — descriptive, structured, neutral.
 * No legalistic stylings; no marketing dressing.
 *
 * 0 forbidden words audited against lib/brand-rules.ts FORBIDDEN_WORDS.
 */

export const metadata: Metadata = {
  title: { absolute: "Privacy policy — aissisted" },
  description:
    "How aissisted collects, processes, and protects your data — pre-launch template, counsel-drafted final version pending.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "What this document covers",
    intro:
      "This privacy policy describes how aissisted collects, uses, shares, and protects information about you when you visit aissisted.com, request access, or sign up for the service. It is one of three legal documents — read alongside terms and disclaimers.",
    body: [
      {
        paragraphs: [
          "Aissisted is operated by Aissisted, Inc. (referred to as \"aissisted\" or \"we\" in this document). The personalization layer, the formula recommendations, the dashboard, and the Jeffrey assistant are all part of the same service and the same data-handling description.",
          "If anything below conflicts with what we do in practice, the practice is wrong, not the document. Tell us — the contact details are at the bottom.",
        ],
      },
    ],
  },
  {
    heading: "Information we collect",
    body: [
      {
        heading: "Information you give us directly",
        paragraphs: [
          "When you create an account, request access, or interact with the dashboard, we collect the information you choose to share. This includes the basics needed to operate the service:",
        ],
        bullets: [
          "Account information — name, email address, password (stored hashed), and any profile detail you add.",
          "Health information you upload or enter — wearable connections, lab panels, prior-condition disclosures, medications, allergies, and the conversational notes you give Jeffrey.",
          "Payment information — billing details handled by our payment processor; full card numbers are never stored on aissisted servers.",
          "Shipping information — name and address used to deliver formula on the paid tiers.",
          "Support and feedback — anything you send via the request access page or support channels.",
        ],
      },
      {
        heading: "Information collected automatically",
        paragraphs: [
          "When you visit the site or use the dashboard, we collect a limited set of technical signals to operate the service safely:",
        ],
        bullets: [
          "Device information — browser type, operating system, and device identifiers when needed for session continuity.",
          "Log data — IP address, request paths, response codes, and timestamps. Used for security, abuse prevention, and basic operational metrics.",
          "Cookies — strictly-necessary cookies for authentication and session state. We do not use third-party advertising cookies.",
        ],
      },
      {
        heading: "Information from connected services",
        paragraphs: [
          "When you connect a wearable account or upload a lab panel, we collect the data you have authorized that source to share. We do not pull data outside the scope you have explicitly authorized — disconnecting the source stops further collection at the source itself.",
        ],
      },
    ],
  },
  {
    heading: "How we use your information",
    body: [
      {
        paragraphs: [
          "We use your information to operate the service, generate the personalized formula, and communicate with you. The specific uses fall into a small number of categories:",
        ],
        bullets: [
          "Run the personalization layer — read your normalized data and shape your daily formula.",
          "Operate the rules engine — check medications, allergies, life-stage flags, and interaction guards before any recommendation reaches you.",
          "Run Jeffrey — provide context-aware responses based on the data you have authorized Jeffrey to read.",
          "Manufacture and ship — pass shipping address and order details to fulfillment partners as required.",
          "Process payments — pass billing information to the payment processor.",
          "Communicate — send transactional messages (order confirmations, account changes, formula updates) and infrequent product updates you have opted into.",
          "Improve the service — aggregate, de-identified analysis to refine the personalization layer. Individual records are not used for marketing.",
          "Comply with law — respond to lawful requests, enforce terms, and protect against abuse.",
        ],
      },
    ],
  },
  {
    heading: "Who we share information with",
    body: [
      {
        heading: "Service providers we operate with",
        paragraphs: [
          "Aissisted relies on a small set of third-party processors to run. Each one operates under a written agreement that limits use of the data to the specific service we have asked them to perform. The current set includes:",
        ],
        bullets: [
          "Cloud infrastructure (hosting, storage, encryption-at-rest providers).",
          "Payment processor (handles billing details we do not store directly).",
          "Shipping and fulfillment partners (receive name and address for delivery).",
          "Email and notification provider (delivers transactional and opt-in messages).",
          "Analytics provider (de-identified aggregate metrics; no individual profiling).",
        ],
      },
      {
        heading: "What we do not do",
        paragraphs: [
          "We do not sell your data. We do not share your health information with advertisers. We do not allow third parties to use the data we collect for their own marketing purposes.",
          "If aissisted is acquired or merged, your data may transfer to the surviving entity under the same handling commitments described here. We will notify you in advance and give you the opportunity to delete your account before any transfer takes effect.",
        ],
      },
    ],
  },
  {
    heading: "Your rights and choices",
    body: [
      {
        paragraphs: [
          "You have a set of rights regarding the information we hold about you. Where local law gives you a stronger right than what is described below, the local law governs.",
        ],
        bullets: [
          "Access — request a copy of the information we hold about you.",
          "Correct — update inaccurate information directly in the dashboard or via support.",
          "Delete — close your account; we remove your record from active systems on the timeline described below.",
          "Export — receive a portable copy of your data in a structured format.",
          "Object or restrict — ask us to limit how we process your information for specific purposes.",
          "Withdraw consent — disconnect any source you have authorized; cancellation is effective immediately at the source.",
        ],
      },
    ],
  },
  {
    heading: "Data retention",
    body: [
      {
        paragraphs: [
          "Active account data is retained while your account is open. When you close your account, we remove your record from active systems within 30 days. A small set of records is retained where required by law — financial transaction logs, regulatory records, and security incident logs — and is purged on the schedule each one specifies.",
          "De-identified, aggregate data may be retained indefinitely for service quality. By design, this data cannot be re-associated with you.",
        ],
      },
    ],
  },
  {
    heading: "How we protect your information",
    body: [
      {
        paragraphs: [
          "Aissisted treats your data with the discipline that the spirit of HIPAA describes, even when the standard consumer flow is not subject to HIPAA. Practical measures include:",
        ],
        bullets: [
          "Encryption in transit (TLS) and at rest.",
          "Scoped access — engineering and care team access is least-privilege and audited.",
          "Audit logging — sensitive read and write actions are logged for review.",
          "Vendor review — every third-party processor is reviewed before being added.",
          "Incident response — defined process for notification and remediation if a breach is suspected.",
        ],
      },
      {
        paragraphs: [
          "No system is perfect. If we discover a breach affecting your information, we notify you on the timeline required by applicable law and describe the steps we are taking.",
        ],
      },
    ],
  },
  {
    heading: "Children",
    body: [
      {
        paragraphs: [
          "Aissisted is not directed at children under 18 and we do not knowingly collect information from them. If you believe a child has shared information with us, contact us via the request access page and we will remove the record.",
        ],
      },
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      {
        paragraphs: [
          "We update this policy as the service evolves. The effective date at the top of this page reflects the most recent meaningful change. Significant changes will be communicated by email and in the dashboard before they take effect.",
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
          "Questions about this policy or about how aissisted handles a specific situation? Reach the team via the request access page and we will respond directly. A dedicated privacy contact email lands in the counsel-drafted final version of this document.",
        ],
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      documentLabel="Privacy policy"
      title="How we handle your data."
      lede="Aissisted reads health data. The discipline below is how we act on the access you give us — and what we will not do with it."
      effective="Effective May 5, 2026 — pre-launch template."
      sections={SECTIONS}
    />
  );
}
