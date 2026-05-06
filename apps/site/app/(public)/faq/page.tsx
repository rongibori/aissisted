import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { Card } from "@/components/card";
import { Divider } from "@/components/divider";
import { Body, H1, H2, H3, Lede, UILabel } from "@/components/typography";

/**
 * FAQ — M3 Phase 4.
 *
 * High-intent SEO surface and sales-team load reducer. 12 questions across
 * five themes — getting started, personalization, pricing & shipping, safety
 * & medical, data & privacy. Distinct from the pricing FAQ (which lives
 * inside /pricing and focuses narrowly on tier mechanics).
 *
 * Compliance:
 *   · FDA question handled at the dietary-supplement level, with explicit
 *     "not evaluated by FDA" framing. No medical claims anywhere.
 *   · HIPAA question handled honestly — aissisted is not a HIPAA-covered
 *     entity unless explicitly enrolled in the clinical pilot program.
 *   · 0 forbidden words audited against lib/brand-rules.ts FORBIDDEN_WORDS.
 *   · Brand red is spent on hero <Eyebrow> (default tone="brand") and the
 *     closing PRIMARY_CTA. Inside the 2% signal budget.
 */

export const metadata: Metadata = {
  title: { absolute: "FAQ — aissisted" },
  description:
    "The questions our team answers most. Getting started, personalization, pricing, safety, and how we handle your data.",
};

const PRIMARY_CTA = cn(
  "inline-flex h-12 items-center justify-center px-6",
  "bg-brand text-white",
  "font-system text-xs font-medium uppercase tracking-[0.18em]",
  "rounded-[2px]",
  "transition-[filter,transform] duration-150 ease-out",
  "hover:brightness-110 hover:-translate-y-px active:brightness-95 active:translate-y-0",
  "motion-reduce:transition-none motion-reduce:transform-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
);

const SECONDARY_CTA = cn(
  "inline-flex h-12 items-center justify-center px-6",
  "bg-white text-ink ring-1 ring-inset ring-ink/15",
  "font-system text-xs font-medium uppercase tracking-[0.18em]",
  "rounded-[2px]",
  "transition-[box-shadow,transform] duration-150 ease-out",
  "hover:ring-ink/30 hover:-translate-y-px active:ring-ink/40 active:translate-y-0",
  "motion-reduce:transition-none motion-reduce:transform-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
);

type FAQ = {
  q: string;
  a: string;
};

type FAQGroup = {
  theme: string;
  intro: string;
  items: FAQ[];
};

const GROUPS: FAQGroup[] = [
  {
    theme: "Getting started",
    intro: "What it takes to begin, and what you walk away with on day one.",
    items: [
      {
        q: "What do I need to start?",
        a: "An email address. The free baseline begins with whatever data sources you already have — a wearable, a recent lab panel, or just a few notes about how your body has been running. None of it is required upfront.",
      },
      {
        q: "Do I need a wearable to start?",
        a: "No. The free baseline reads what you tell it. A wearable adds resolution — recovery, sleep stages, daily activity — and unlocks the recommendations that depend on those signals. You can add one any time and the formula picks it up on the next cycle.",
      },
      {
        q: "How long until my first formula?",
        a: "The first formula recommendation arrives once the system has enough signal to shape one — typically a week of wearable data or a recent lab panel. The free baseline read is immediate.",
      },
    ],
  },
  {
    theme: "Personalization",
    intro: "How the formula adjusts, and why your version isn't anyone else's.",
    items: [
      {
        q: "How is the formula different from a multivitamin?",
        a: "A multivitamin is one shape, sold to many bodies. The aissisted formula is one shape, drawn from your data, refreshed at the cadence your tier supports — monthly, weekly, or daily. The ingredients sit on the same shelf as anything else; the difference is which ones are in your bottle and at what dose.",
      },
      {
        q: "How often does the formula change?",
        a: "On the cadence of your tier. Formula re-shapes monthly. Stack re-shapes weekly. Full Day re-shapes daily. The free baseline doesn't ship a formula at all — it's the read on your data and one shared recommendation.",
      },
      {
        q: "What data does aissisted read?",
        a: "Wearable signals (HRV, sleep, recovery, daily activity), lab panels you upload or that we collect, and the small notes you give Jeffrey. That's it. We don't pull from social media, browser history, or anything outside the health domain.",
      },
    ],
  },
  {
    theme: "Pricing & shipping",
    intro: "What it costs, what's included, and how the bottle gets to you.",
    items: [
      {
        q: "What does it cost?",
        a: "Free baseline at $0. Single formula at $69 a month. Stack of two formulas at $99 a month. Full Day (all three) at $149 a month. Shipping is included on every paid tier. Detailed breakdown lives on the pricing page.",
      },
      {
        q: "Where do you ship?",
        a: "Continental United States at launch. Hawaii, Alaska, and international shipping arrive on a published rollout calendar — request access from outside the lower 48 and we'll let you know when we open in your zone.",
      },
      {
        q: "Can I cancel any time?",
        a: "Yes. No annual contract, no early-termination fee. Cancel from your account and the read on your data stays yours.",
      },
    ],
  },
  {
    theme: "Safety & medical",
    intro: "The honest framing on what aissisted is — and what it isn't.",
    items: [
      {
        q: "Are these supplements FDA-approved?",
        a: "Aissisted formulas are dietary supplements, not drugs. They are not evaluated by the FDA, and we don't make medical claims — nothing here treats, prevents, or addresses disease. Ingredients are sourced from cGMP-compliant facilities and the rationale for each one stays inside the published evidence we cite.",
      },
      {
        q: "Should I talk to my doctor before starting?",
        a: "If you're on prescription medication, pregnant or breastfeeding, managing a chronic condition, or under 18 — yes. The rules engine inside the personalization layer handles a lot of interactions, but it doesn't replace the clinician who knows your full record. Bring the formula list to your appointment; it reads cleanly on a chart.",
      },
    ],
  },
  {
    theme: "Data & privacy",
    intro: "Where your data sits, who can read it, and what we will not do.",
    items: [
      {
        q: "Is aissisted HIPAA compliant?",
        a: "Aissisted is not a HIPAA-covered entity in the standard consumer flow — the same regulatory frame that applies to a hospital does not automatically apply to a direct-to-consumer wellness service. We do treat your data with the discipline that the spirit of HIPAA describes: encryption at rest and in transit, scoped access, audit logs. The clinical pilot program operates under a separate agreement with full HIPAA-grade handling.",
      },
      {
        q: "Who has access to my data?",
        a: "You, the on-call engineering and care teams under audit, and the personalization system itself. We don't sell your data. We don't share it with advertisers. The full data-handling description lives on the privacy page, and that page tells you exactly which third parties (shipping, payment, infrastructure) see what.",
      },
      {
        q: "Can I delete my data?",
        a: "Yes. Account deletion removes your record from active systems. A small set of records is retained where required (financial transaction logs, regulatory records); everything else is removed. The privacy page describes the timeline.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="bg-surface text-ink">
      <Hero />
      <Groups />
      <ClosingCTA />
    </div>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="faq-hero-heading"
      className="relative isolate pt-20 pb-20 md:pt-28 md:pb-28"
    >
      <Container width="wide">
        <div className="max-w-4xl">
          <Eyebrow>FAQ</Eyebrow>

          <H1 id="faq-hero-heading" className="mt-6">
            The questions we answer most.
          </H1>

          <Lede className="mt-8 max-w-2xl">
            Five themes, twelve questions. If yours isn't here, the request
            access page is the fastest way to reach a person.
          </Lede>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/request-access" className={SECONDARY_CTA}>
              Request access
            </Link>
            <Link href="/how-it-works" className={SECONDARY_CTA}>
              How it works
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Groups() {
  return (
    <section
      aria-labelledby="faq-groups-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <h2 id="faq-groups-heading" className="sr-only">
          Frequently asked questions
        </h2>

        <div className="grid gap-16">
          {GROUPS.map((group) => (
            <FAQGroupBlock key={group.theme} group={group} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function FAQGroupBlock({ group }: { group: FAQGroup }) {
  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1.6fr] md:gap-14">
      <div>
        <UILabel className="text-ink/55">{group.theme}</UILabel>
        <H2 className="mt-4 text-3xl md:text-4xl">{group.theme}.</H2>
        <Body className="mt-5 text-sm text-ink/70 md:text-base">
          {group.intro}
        </Body>
      </div>

      <ul className="grid gap-5">
        {group.items.map((faq) => (
          <li key={faq.q}>
            <Card variant="flat" padding="lg">
              <H3 className="text-xl md:text-2xl">{faq.q}</H3>
              <Body className="mt-4 text-sm md:text-base">{faq.a}</Body>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClosingCTA() {
  return (
    <section
      aria-labelledby="faq-cta-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Still have a question</Eyebrow>
          <H2 id="faq-cta-heading" className="mt-4">
            The fastest way is to ask.
          </H2>

          <Divider className="mt-10" />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/request-access" className={PRIMARY_CTA}>
              Request access
            </Link>
            <Link href="/pricing" className={SECONDARY_CTA}>
              See pricing
            </Link>
          </div>

          <p className="mt-6 max-w-xl text-sm text-ink/65">
            Request access opens a short conversation with the team. We answer
            the question that isn't on this page and we don't put you on a list
            you have to dig out of.
          </p>
        </div>
      </Container>
    </section>
  );
}
