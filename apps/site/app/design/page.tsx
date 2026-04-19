import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { Button } from "@/components/button";
import { RallyCry } from "@/components/rally-cry";
import {
  H1,
  H2,
  H3,
  H4,
  Body,
  Lede,
  UILabel,
  DataValue,
  ValueProp,
  JeffreyText,
  JeffreySystem,
} from "@/components/typography";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { HeroText } from "@/components/hero-text";
import { HeroMetric } from "@/components/hero-metric";
import { PullQuote } from "@/components/pull-quote";
import { MetricCard } from "@/components/metric-card";
import { ComparisonTable } from "@/components/comparison-table";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { JeffreyDock } from "@/components/jeffrey-dock";
import { GatedRoomCTA } from "@/components/gated-room-cta";
import { LeadCaptureForm } from "@/components/lead-capture-form";

/**
 * Design catalog — every M2 primitive rendered in isolation.
 *
 * Lorem-only copy (Ron lock: no public-facing copy until M3). The catalog
 * exists to verify token wiring, typography roles, palette budget, and
 * motion tokens — not narrative.
 */

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <Nav />

      <CatalogIntro />

      <Section title="01 · Typography roles">
        <div className="grid gap-10">
          <div>
            <UILabel>H1 · Plex Sans 700</UILabel>
            <H1>Lorem ipsum dolor sit amet</H1>
          </div>
          <div>
            <UILabel>H2 · Plex Sans 700</UILabel>
            <H2>Consectetur adipiscing elit</H2>
          </div>
          <div>
            <UILabel>H3 · Plex Sans 600</UILabel>
            <H3>Sed do eiusmod tempor incididunt</H3>
          </div>
          <div>
            <UILabel>H4 · Plex Sans 600</UILabel>
            <H4>Ut labore et dolore magna aliqua</H4>
          </div>
          <div>
            <UILabel>Lede · Plex Sans 400</UILabel>
            <Lede>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </Lede>
          </div>
          <div>
            <UILabel>Body · Plex Sans 400</UILabel>
            <Body>
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
              cupidatat non proident.
            </Body>
          </div>
          <div>
            <UILabel>UI label · Plex Mono 500</UILabel>
            <div className="mt-2">
              <UILabel>Formula · Morning</UILabel>
            </div>
          </div>
          <div>
            <UILabel>Data value · Plex Mono tabular</UILabel>
            <div className="mt-2">
              <DataValue className="text-4xl text-data">128</DataValue>{" "}
              <span className="font-system text-sm text-ink/60">ng/mL</span>
            </div>
          </div>
          <div>
            <UILabel>Emotional accent · Plex Serif italic</UILabel>
            <ValueProp>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </ValueProp>
          </div>
          <div>
            <UILabel>Jeffrey prose · Plex Sans 400</UILabel>
            <JeffreyText>
              Lorem ipsum dolor sit amet. I'll stay close if anything shifts.
            </JeffreyText>
          </div>
          <div>
            <UILabel>Jeffrey system · Plex Mono</UILabel>
            <div className="mt-2">
              <JeffreySystem>Not live · M10 wires conversation</JeffreySystem>
            </div>
          </div>
        </div>
      </Section>

      <Section title="02 · Rally cry (period-locked)">
        <div className="grid gap-10">
          <RallyCry size="hero" />
          <RallyCry size="display" />
          <RallyCry size="inline" />
        </div>
      </Section>

      <Section title="03 · Buttons">
        <div className="flex flex-wrap gap-4">
          <Button tone="primary">Primary</Button>
          <Button tone="secondary">Secondary</Button>
          <Button tone="ghost">Ghost</Button>
          <Button tone="primary" size="sm">
            Small
          </Button>
          <Button tone="secondary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="04 · Eyebrow + container">
        <div className="grid gap-6">
          <Eyebrow>Data band · brand</Eyebrow>
          <Eyebrow tone="data">Data band · data</Eyebrow>
          <Eyebrow tone="muted">Data band · muted</Eyebrow>
        </div>
      </Section>

      <PrimitiveFullBleed title="05 · Hero text">
        <HeroText
          eyebrow="Lorem · 01"
          headline="Lorem ipsum dolor sit amet, consectetur adipiscing."
          lede="Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
          actions={
            <>
              <Button tone="primary">Primary action</Button>
              <Button tone="ghost">Secondary action</Button>
            </>
          }
        />
      </PrimitiveFullBleed>

      <PrimitiveFullBleed title="06 · Hero metric">
        <HeroMetric
          eyebrow="Lorem · 02"
          headline="Ut labore et dolore magna aliqua enim ad minim veniam."
          metrics={[
            { label: "Adherence", value: "91", unit: "%" },
            { label: "Median biomarker drift", value: "2.4", unit: "σ" },
            { label: "Cohort", value: "148" },
          ]}
        />
      </PrimitiveFullBleed>

      <PrimitiveFullBleed title="07 · Pull quote">
        <PullQuote attribution="Ron · founder note">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore.
        </PullQuote>
      </PrimitiveFullBleed>

      <Section title="08 · Metric cards">
        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard
            label="Vitamin D"
            value="52"
            unit="ng/mL"
            context="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
          />
          <MetricCard
            tone="data"
            label="HRV"
            value="68"
            unit="ms"
            context="Duis aute irure dolor in reprehenderit in voluptate."
          />
          <MetricCard
            tone="inverse"
            label="Sleep score"
            value="84"
            unit="/100"
            context="Excepteur sint occaecat cupidatat non proident."
          />
        </div>
      </Section>

      <Section title="09 · Comparison table">
        <ComparisonTable
          rightLabel="Typical supplement shelf"
          rows={[
            {
              category: "Personalization",
              left: "Built from your labs and biometrics.",
              right: "One bottle, everyone the same.",
            },
            {
              category: "Adaptation",
              left: "Re-tuned on every new signal.",
              right: "Static formula, static answer.",
            },
            {
              category: "Evidence",
              left: "Longitudinal biomarker trend.",
              right: "Marketing claims on the label.",
            },
            {
              category: "Experience",
              left: "Jeffrey · quiet, continuous.",
              right: "A cabinet full of bottles.",
            },
          ]}
        />
      </Section>

      <Section title="10 · Architecture diagram">
        <ArchitectureDiagram
          nodes={[
            { label: "Input", caption: "Labs · wearables · voice" },
            { label: "Normalize", caption: "Unit harmonization" },
            { label: "Rules", caption: "Deterministic safety" },
            { label: "AI layer", caption: "Adaptive personalization", emphasized: true },
            { label: "Output", caption: "Formula recommendation" },
            { label: "Memory", caption: "Longitudinal trend" },
          ]}
        />
      </Section>

      <PrimitiveFullBleed title="11 · Gated room CTA">
        <GatedRoomCTA />
      </PrimitiveFullBleed>

      <Section title="12 · Lead capture form">
        <div className="max-w-xl">
          <LeadCaptureForm source="request-access" submitLabel="Request access" />
        </div>
      </Section>

      <Footer />
      <JeffreyDock />
    </div>
  );
}

// ─── Catalog chrome ───────────────────────────────────────────────────────

function CatalogIntro() {
  return (
    <section className="py-16 md:py-20">
      <Container width="full">
        <UILabel>Design catalog · Milestone 2</UILabel>
        <H2 className="mt-4 max-w-2xl">
          Primitives at the locked palette.
        </H2>
        <Body className="mt-6 max-w-2xl">
          Lorem placeholder only. Brand Bible v1.1 locks: rally cry period,
          70/20/8/2 palette budget, IBM Plex Sans / Mono / Serif role mapping,
          earned motion only. Narrative copy lands in Milestone 3.
        </Body>
      </Container>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink/5 py-16 md:py-20">
      <Container width="full">
        <UILabel>{title}</UILabel>
        <div className="mt-8">{children}</div>
      </Container>
    </section>
  );
}

function PrimitiveFullBleed({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink/5">
      <Container width="full">
        <div className="pt-16">
          <UILabel>{title}</UILabel>
        </div>
      </Container>
      {children}
    </section>
  );
}
