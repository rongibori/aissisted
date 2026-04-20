import type { Metadata } from "next";
import { Container } from "@/components/container";
import { MetricCard } from "@/components/metric-card";
import { PullQuote } from "@/components/pull-quote";
import {
  Body,
  H3,
  H4,
  JeffreySystem,
  UILabel,
  ValueProp,
} from "@/components/typography";
import { InvestorHero } from "@/components/investor/investor-hero";
import { ChapterShell } from "@/components/investor/chapter-shell";
import { ChapterProgress } from "@/components/investor/chapter-progress";
import { ComparablesRow } from "@/components/investor/comparables-row";
import { ProjectionsGrid } from "@/components/investor/projections-grid";
import { DataFlywheel } from "@/components/investor/data-flywheel";
import { ValuationBars } from "@/components/investor/valuation-bars";
import { InvestorConsole } from "@/components/investor/investor-console";
import { InvestorCTAGrid } from "@/components/investor/investor-cta-grid";
import { BigStat } from "@/components/investor/big-stat";
import { MarketInevitability } from "@/components/investor/market-inevitability";
import { TrustGrid } from "@/components/investor/trust-grid";
import { OneLinePunch } from "@/components/investor/one-line-punch";
import { InvestorCohortCTA } from "@/components/investor/investor-cohort-cta";

/**
 * Investor Room v3 — $10B-company posture.
 *
 * Same 8-chapter frame (Ron lock), upgraded to read like an Apple keynote:
 *   · One-line headlines. No multi-clause throat-clears.
 *   · Iconic beats: BigStat, MarketInevitability, TrustGrid, OneLinePunch.
 *   · Founder cohort scarcity CTA (honest framing — no fake seat counts).
 *   · Magical Jeffrey opener with prompt suggestion cards.
 *
 * Chapters:
 *   01 · Thesis       — one-line punch + 4-up inevitability grid
 *   02 · Product      — "Built for one body." · 6-step arc
 *   03 · Model        — "Subscription. Compounds. Owned." + trust grid beat
 *   04 · Comparables  — ValuationBars + ComparablesRow + "what we are not"
 *   05 · Projections  — OneLinePunch intro + ProjectionsGrid
 *   06 · Moat         — DataFlywheel · "A category brand cannot run this loop."
 *   07 · Roadmap      — "One system. Four categories."
 *   08 · Cohort       — FounderCohort scarcity + InvestorCTAGrid underneath
 *
 * Data isolation: console + CTA endpoints all use surface:"investor" with
 * noopMemoryAdapter. Server-log-only for now; no PHI, no cross-session
 * memory, no userId. CRM/email lands in the next PR.
 */

export const metadata: Metadata = {
  title: "Investor Room",
  description:
    "Aissisted is operating intelligence for one person's body. A private, founder-led walkthrough — thesis, product, model, comparables, projections, moat, roadmap, cohort.",
  robots: { index: false, follow: false },
};

export default function InvestorRoomPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <ChapterProgress />

      <InvestorHero />

      {/* 01 · Thesis */}
      <ChapterShell
        id="chapter-thesis"
        chapterLabel="Chapter 01 · Thesis"
        question={<>The body is finally legible. We are the layer above it.</>}
        lede="Four forces are moving at once. None of them alone builds this company. Together, they make the next one inevitable."
        askQuestion="Give me the thesis in two minutes — the shift, the wedge, and why now."
        askLabel="Walk the thesis"
        tone="midnight"
      >
        <MarketInevitability />

        <div className="mt-16 grid gap-12 md:grid-cols-2 items-start">
          <div className="border-l-2 border-data pl-6">
            <ValueProp className="text-white">
              The supplement aisle gives you the average. We learn you, and
              build what you need.
            </ValueProp>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              tone="data"
              label="Addressable"
              value="$150B+"
              unit="global"
              context="Supplements + personalized wellness. Converging."
            />
            <MetricCard
              tone="default"
              label="Beachhead"
              value="Top 5%"
              context="Data-native, longevity-literate early adopters."
            />
          </div>
        </div>
      </ChapterShell>

      {/* Transitional punch — Apple-style beat */}
      <OneLinePunch
        primary="Built for one body."
        secondary="Not a category. A person."
      />

      {/* 02 · Product vision */}
      <ChapterShell
        id="chapter-product"
        chapterLabel="Chapter 02 · Product"
        question={<>Day one feels like a conversation. Day three hundred feels like a system that knows you.</>}
        lede="Onboarding is not a form. It is a conversation. Jeffrey introduces himself, asks for what he needs, and returns with a protocol that looks nothing like a category product — because it was built for one body."
        askQuestion="Describe the product vision. What does onboarding feel like, and what does the system do once it knows a person?"
        askLabel="Show the product arc"
        tone="graphite"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <ProductStep
            phase="Day 00 · Introduction"
            title="Jeffrey meets you."
            body="Voice-first. British, calm, attentive. He explains what he does, what he would like to learn, and what to expect. You do most of the talking."
          />
          <ProductStep
            phase="Day 01–07 · Intake"
            title="The signal comes in."
            body="MyChart labs via Epic. WHOOP, Apple, Oura via OAuth. Diet and symptoms when helpful. Normalized into one longitudinal record."
          />
          <ProductStep
            phase="Day 08 · First protocol"
            title="One formula. One body."
            body="A pressed daily stick. Pre-mixed. Explained. You know every ingredient, the dose, and why it is there today."
          />
          <ProductStep
            phase="Day 30–90 · Adaptation"
            title="The system re-reads you."
            body="Next lab pass. Wearable deltas. Adherence. Jeffrey re-weights. Month two is not month one."
          />
          <ProductStep
            phase="Day 180 · Concierge"
            title="You stop managing it."
            body="Ask Jeffrey anything in plain language. Sleep ragged? Cortisol climbing? He saw it, adjusted, and explained it before you asked."
          />
          <ProductStep
            phase="Year 01+ · Expansion"
            title="Beyond supplements."
            body="Peptides, prescriptions, diagnostics — same system, same intelligence, same person. The rails are category-agnostic."
          />
        </div>
      </ChapterShell>

      {/* 03 · Business model */}
      <ChapterShell
        id="chapter-model"
        chapterLabel="Chapter 03 · Model"
        question={<>Subscription. Compounds. Owned.</>}
        lede="Recurring revenue at the core. Diagnostics at the edge. The real asset is the longitudinal record — every month of adherence makes the next month sharper and the switching cost higher."
        askQuestion="Walk me through the business model. Where does revenue come from, what's recurring, and what does the data layer unlock?"
        askLabel="Break down the model"
        tone="surface"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard
            tone="data"
            label="Core · subscription"
            value="Monthly"
            context="Pressed daily-stick protocol, delivered every 30 days. Adapts after each lab and wearable pass."
          />
          <MetricCard
            tone="default"
            label="Expansion · diagnostics"
            value="Pass-through"
            context="Partnered lab panels at intake and re-test cadence. High-intent, high-retention trigger."
          />
          <MetricCard
            tone="default"
            label="Compound · data"
            value="Longitudinal"
            context="The record is the moat. Each month makes the protocol better — and harder for any new entrant to replicate."
          />
        </div>
        <div className="mt-12 grid gap-12 md:grid-cols-2 items-start">
          <div>
            <H4 as="h3">The loop runs on data the customer is actively producing.</H4>
            <Body className="mt-4">
              Personalization increases adherence. Adherence lengthens
              retention. Longer retention produces more longitudinal signal.
              More signal tightens the protocol. Tighter protocols increase
              outcomes. Better outcomes compound word-of-mouth and cohort LTV.
            </Body>
            <Body className="mt-4">
              It cannot be bought. A new entrant cannot fake a year of it.
            </Body>
          </div>
          <div className="bg-ink/5 p-7 md:p-9">
            <UILabel>Retention thesis</UILabel>
            <ValueProp className="mt-5 text-xl md:text-2xl">
              The longer you are in, the more expensive it is for the product
              to ever be wrong about you.
            </ValueProp>
            <JeffreySystem className="mt-7 block">
              Built-for-one is the retention mechanism — not a marketing line.
            </JeffreySystem>
          </div>
        </div>
      </ChapterShell>

      {/* Trust signal beat — proves the posture */}
      <section className="bg-[color:var(--brand-midnight)] text-white py-24 md:py-32">
        <Container width="wide">
          <div className="flex items-center gap-3">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
            <UILabel className="text-data">Posture · six proof points</UILabel>
          </div>
          <h2 className="mt-8 font-display font-bold text-white text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] tracking-[-0.015em] max-w-4xl">
            Built for operators who read technical due diligence first.
          </h2>
          <p className="mt-6 max-w-2xl font-body text-lg md:text-xl text-white/75 leading-[1.5]">
            We are not hand-waving. Each of these is a posture that is already
            true, locked in the repo, or committed as the ship standard.
          </p>
          <div className="mt-14">
            <TrustGrid tone="midnight" />
          </div>
        </Container>
      </section>

      {/* 04 · Comparables */}
      <ChapterShell
        id="chapter-comparables"
        chapterLabel="Chapter 04 · Comparables"
        question={<>Each mechanic already cleared. Combined, none have.</>}
        lede="We sit at the crossing of continuous diagnostics, data-compounding health platforms, wearable subscriptions, and recurring personalization. The right comparables prove each individual mechanic already cleared at scale."
        askQuestion="Which comparables should we use to price this, and why are they the right analog rather than Hims or Care/Of?"
        askLabel="Frame the comparables"
        tone="midnight"
      >
        <div className="space-y-16">
          <ValuationBars />
          <ComparablesRow tone="inverse" />
          <div className="max-w-3xl">
            <H4 as="h3" className="text-white">What we are not.</H4>
            <Body className="mt-4 text-white/80">
              Not a direct-to-consumer supplement brand. Not a telehealth shop.
              Not a wearable. We are the operating intelligence sitting above
              all of them, for one person. The right comp is the company that
              proved each mechanic — not the company that shares our shelf.
            </Body>
          </div>
        </div>
      </ChapterShell>

      {/* Scale anchor — one big number before projections */}
      <section className="bg-surface py-20 md:py-28">
        <Container width="wide">
          <BigStat
            tone="surface"
            eyebrow="Market · reference comp"
            value="$13.9B"
            punch="Livongo sold for $13.9B on one thesis — continuous data changes outcomes."
            caption="We run the same loop on a category with ten times the behavioral frequency. One record. Adapts every thirty days. For a lifetime."
          />
        </Container>
      </section>

      {/* 05 · Projections */}
      <ChapterShell
        id="chapter-projections"
        chapterLabel="Chapter 05 · Projections"
        question={<>The drivers, not the spreadsheet.</>}
        lede="Public-surface scenarios. The working model, cohort assumptions, and sensitivities live in the data room. Ask Jeffrey for the drivers — he will walk what moves and what does not."
        askQuestion="What do the projections look like through Year 3? Walk me through the drivers — the levers that move and the ones that don't."
        askLabel="Walk the projections"
        tone="midnight"
      >
        <ProjectionsGrid />
      </ChapterShell>

      {/* Pull-quote beat between projections and moat */}
      <section className="bg-[color:var(--brand-midnight)] text-white py-16 md:py-20">
        <Container width="reading">
          <figure className="border-l-2 border-data pl-8 md:pl-10">
            <ValueProp
              as="blockquote"
              className="text-white text-2xl md:text-3xl leading-[1.25]"
            >
              Retention is the valuation. Personalization is the retention
              mechanism. The data is the personalization.
            </ValueProp>
            <figcaption className="mt-7">
              <UILabel className="text-white/55">
                Aissisted · operating principle
              </UILabel>
            </figcaption>
          </figure>
        </Container>
      </section>

      {/* 06 · Moat */}
      <ChapterShell
        id="chapter-moat"
        chapterLabel="Chapter 06 · Moat"
        question={<>A category brand cannot run this loop.</>}
        lede="The moat is not a proprietary ingredient, a cheaper supply chain, or a clever ad creative. It is a compounding data loop around one person — which a category brand, by definition, does not run."
        askQuestion="Explain the moat. How does the data flywheel compound and why can't Hims or Care/Of catch this?"
        askLabel="Show the flywheel"
        tone="midnight"
      >
        <DataFlywheel />
      </ChapterShell>

      {/* 07 · Roadmap */}
      <ChapterShell
        id="chapter-roadmap"
        chapterLabel="Chapter 07 · Roadmap"
        question={<>One system. Four categories.</>}
        lede="Supplements are the beachhead. The rails — intake, normalization, protocol, adherence, re-test — work for anything taken daily. Peptides are the first expansion. Prescriptions are the second. Diagnostics is the third."
        askQuestion="Lay out the peptide roadmap and how the supplement rails extend to peptides, prescriptions, and diagnostics."
        askLabel="Walk the roadmap"
        tone="surface"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <RoadmapStage
            when="Now"
            title="Supplements · daily stick"
            body="Pressed, personalized, monthly. The data-producing anchor. Proves adherence and retention loops."
          />
          <RoadmapStage
            when="Next 12 months"
            title="Peptides · clinician-paired"
            body="BPC-157, semaglutide, tesamorelin and similar — delivered through partnered telehealth. Same record, same intelligence."
          />
          <RoadmapStage
            when="Next 24 months"
            title="Prescriptions + diagnostics"
            body="Extend the daily-stick cadence to chronic medications where appropriate. Deepen diagnostic relationships to compound signal."
          />
        </div>
        <div className="mt-12 max-w-3xl">
          <Body>
            Every expansion reuses the same rails: one record, one Jeffrey, one
            monthly cadence, one explained protocol. We are not building four
            products. We are building one system and pointing it at four
            categories.
          </Body>
        </div>
      </ChapterShell>

      {/* Signature line */}
      <PullQuote attribution="Aissisted · closing line">
        We don't give answers. We build the system that produces them — for one
        person, for a lifetime.
      </PullQuote>

      {/* 08 · Cohort — scarcity CTA + three quiet conversion paths underneath */}
      <section
        id="chapter-cta"
        aria-labelledby="chapter-cta-heading"
        className="bg-[color:var(--brand-midnight)] text-white py-28 md:py-36 scroll-mt-24"
      >
        <Container width="wide">
          <div className="flex items-center gap-3">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
            <UILabel className="text-data">Chapter 08 · Cohort</UILabel>
          </div>
          <h2
            id="chapter-cta-heading"
            className="mt-8 font-display font-bold text-[clamp(2rem,4.4vw,3.5rem)] tracking-[-0.015em] leading-[1.05] text-white max-w-4xl"
          >
            The next step is a conversation.
            <br className="hidden md:block" />
            <span className="text-white/55">Not a term sheet.</span>
          </h2>

          <div className="mt-14">
            <InvestorCohortCTA />
          </div>

          <div className="mt-16 border-t border-white/10 pt-14">
            <UILabel className="text-white/55">Or choose your path</UILabel>
            <div className="mt-6">
              <InvestorCTAGrid />
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3">
            <JeffreySystem className="text-white/45">
              ⌘K · ask Jeffrey anything first
            </JeffreySystem>
            <JeffreySystem className="text-white/45">
              Private surface · no PHI captured
            </JeffreySystem>
            <JeffreySystem className="text-white/45">
              Founder-read · no auto-reply
            </JeffreySystem>
          </div>
        </Container>
      </section>

      {/* Jeffrey console — persistent across the whole room */}
      <InvestorConsole />
    </main>
  );
}

function ProductStep({
  phase,
  title,
  body,
}: {
  phase: string;
  title: string;
  body: string;
}) {
  return (
    <article className="bg-surface p-6 md:p-7 ring-1 ring-inset ring-ink/10 transition-[transform,box-shadow] duration-300 hover:-translate-y-[2px] hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.18)]">
      <UILabel className="text-brand">{phase}</UILabel>
      <H4 as="h3" className="mt-3 text-xl md:text-2xl">
        {title}
      </H4>
      <Body className="mt-3 text-sm md:text-base">{body}</Body>
    </article>
  );
}

function RoadmapStage({
  when,
  title,
  body,
}: {
  when: string;
  title: string;
  body: string;
}) {
  return (
    <article className="p-6 md:p-7 bg-ink/5 transition-[background] duration-300 hover:bg-ink/[0.07]">
      <UILabel className="text-ink/60">{when}</UILabel>
      <H4 as="h3" className="mt-3 text-xl md:text-2xl">
        {title}
      </H4>
      <Body className="mt-3 text-sm md:text-base">{body}</Body>
    </article>
  );
}
