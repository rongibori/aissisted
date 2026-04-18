import React from "react";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Pill } from "@/components/pill";
import { Divider } from "@/components/divider";
import { Heading } from "@/components/heading";
import { Text } from "@/components/text";
import { RallyCry } from "@/components/rally-cry";
import {
  H1, H2, H3, H4,
  Body, Lede, UILabel, DataValue, ValueProp,
  JeffreyText, JeffreySystem,
} from "@/components/typography";

/**
 * /internal/design-system — M2 visual QA surface.
 *
 * Every primitive, every variant, lorem-only copy.
 * This is the single source of visual truth before M3 content lands.
 *
 * Sections:
 *   01 · Color tokens
 *   02 · Type scale
 *   03 · Rally cry
 *   04 · Button
 *   05 · Card
 *   06 · Pill
 *   07 · Divider
 *   08 · Heading (polymorphic)
 *   09 · Text (variant router)
 *   10 · Eyebrow
 *   11 · Container widths
 *   12 · Typography roles (full set)
 */

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* Header */}
      <div className="border-b border-line">
        <Container width="full" className="py-8">
          <Pill tone="data">Internal</Pill>
          <H1 className="mt-4">Design System</H1>
          <Body className="mt-2 text-muted">
            M2 primitive catalog · all components · all variants · lorem copy only
          </Body>
        </Container>
      </div>

      {/* 01 · Color tokens */}
      <Section label="01 · Color tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[
            { name: "surface",     cls: "bg-surface border border-line" },
            { name: "surface-2",   cls: "bg-surface-2 border border-line" },
            { name: "ink",         cls: "bg-ink" },
            { name: "muted",       cls: "bg-muted" },
            { name: "soft",        cls: "bg-soft" },
            { name: "brand",       cls: "bg-brand" },
            { name: "data",        cls: "bg-data" },
            { name: "signal",      cls: "bg-signal" },
            { name: "line",        cls: "bg-line border border-line-strong" },
            { name: "ok",          cls: "bg-ok" },
            { name: "warn",        cls: "bg-warn" },
            { name: "danger",      cls: "bg-danger" },
          ].map(({ name, cls }) => (
            <div key={name}>
              <div className={`h-12 rounded-none ${cls}`} />
              <JeffreySystem className="mt-1">{name}</JeffreySystem>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* 02 · Type scale */}
      <Section label="02 · Type scale">
        <div className="space-y-6">
          {[
            { label: "display · 72px · -0.025em", cls: "text-[4.5rem] font-bold font-display leading-[1.02] tracking-[-0.025em]" },
            { label: "h1 · 48px · -0.02em",       cls: "text-5xl font-bold font-display leading-[1.05] tracking-[-0.02em]" },
            { label: "h2 · 32px · -0.015em",      cls: "text-4xl font-bold font-display leading-[1.1] tracking-[-0.015em]" },
            { label: "h3 · 24px · -0.01em",       cls: "text-3xl font-semibold font-display leading-[1.15] tracking-[-0.01em]" },
            { label: "h4 · 20px",                 cls: "text-2xl font-semibold font-display leading-[1.2]" },
            { label: "body-lg · 18px",             cls: "text-lg font-normal font-body leading-[1.65]" },
            { label: "body · 16px",                cls: "text-base font-normal font-body leading-[1.65]" },
            { label: "body-sm · 14px",             cls: "text-sm font-normal font-body leading-snug" },
            { label: "mono-lg · 15px",             cls: "text-[0.9375rem] font-medium font-system leading-[1.5]" },
            { label: "mono · 13px",                cls: "text-[0.8125rem] font-normal font-system leading-[1.5]" },
            { label: "caption · 12px · 0.04em",   cls: "text-xs font-normal font-system leading-[1.4] tracking-[0.04em]" },
          ].map(({ label, cls }) => (
            <div key={label} className="flex items-baseline gap-4">
              <span className="w-52 shrink-0 font-system text-[11px] text-soft tracking-[0.06em] uppercase">{label}</span>
              <span className={cls}>Lorem ipsum dolor sit</span>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* 03 · Rally cry */}
      <Section label="03 · Rally cry (period-locked)">
        <div className="space-y-10">
          <div>
            <UILabel className="mb-4">hero · 80px</UILabel>
            <RallyCry size="hero" />
          </div>
          <div>
            <UILabel className="mb-4">display · 60px</UILabel>
            <RallyCry size="display" />
          </div>
          <div>
            <UILabel className="mb-4">inline · 30px</UILabel>
            <RallyCry size="inline" />
          </div>
        </div>
      </Section>

      <Divider />

      {/* 04 · Button */}
      <Section label="04 · Button">
        <div className="space-y-6">
          <div>
            <UILabel className="mb-3">Tones</UILabel>
            <div className="flex flex-wrap gap-3">
              <Button tone="primary">Primary</Button>
              <Button tone="secondary">Secondary</Button>
              <Button tone="ghost">Ghost</Button>
            </div>
          </div>
          <div>
            <UILabel className="mb-3">Sizes</UILabel>
            <div className="flex flex-wrap items-center gap-3">
              <Button tone="primary" size="sm">Small</Button>
              <Button tone="primary" size="md">Medium</Button>
              <Button tone="primary" size="lg">Large</Button>
            </div>
          </div>
          <div>
            <UILabel className="mb-3">States</UILabel>
            <div className="flex flex-wrap gap-3">
              <Button tone="primary" disabled>Disabled primary</Button>
              <Button tone="secondary" disabled>Disabled secondary</Button>
            </div>
          </div>
          <div>
            <UILabel className="mb-3">On dark surface</UILabel>
            <div className="bg-data p-6 flex flex-wrap gap-3">
              <Button tone="secondary" className="border border-white/20 bg-white/10 text-white hover:bg-white/20 ring-0">
                Light ghost
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* 05 · Card */}
      <Section label="05 · Card">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <UILabel className="mb-3">default</UILabel>
            <Card>
              <H4>Card heading</H4>
              <Body className="mt-2">
                Minimal hairline border, white surface. No shadow.
              </Body>
            </Card>
          </div>
          <div>
            <UILabel className="mb-3">data</UILabel>
            <Card variant="data">
              <H4 className="text-white">Intelligence</H4>
              <Body className="mt-2 text-white/70">
                Midnight surface for data and system panels.
              </Body>
            </Card>
          </div>
          <div>
            <UILabel className="mb-3">ghost</UILabel>
            <Card variant="ghost" padding="sm">
              <H4>Subtle</H4>
              <Body className="mt-2">
                Transparent with hairline — minimal footprint.
              </Body>
            </Card>
          </div>
        </div>
        <div className="mt-6">
          <UILabel className="mb-3">Padding variants</UILabel>
          <div className="grid gap-4 md:grid-cols-4">
            {(["none", "sm", "md", "lg"] as const).map((p) => (
              <Card key={p} padding={p} className={p === "none" ? "p-0" : ""}>
                <JeffreySystem>padding={p}</JeffreySystem>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Divider />

      {/* 06 · Pill */}
      <Section label="06 · Pill">
        <div className="space-y-4">
          <div>
            <UILabel className="mb-3">Tones</UILabel>
            <div className="flex flex-wrap gap-2">
              <Pill>ink (default)</Pill>
              <Pill tone="brand">brand</Pill>
              <Pill tone="data">data</Pill>
              <Pill tone="signal">signal</Pill>
              <Pill tone="ok">ok</Pill>
              <Pill tone="warn">warn</Pill>
            </div>
          </div>
          <div>
            <UILabel className="mb-3">Usage examples</UILabel>
            <div className="flex flex-wrap gap-2">
              <Pill tone="data">01 / 10</Pill>
              <Pill tone="signal">Live</Pill>
              <Pill tone="brand">New</Pill>
              <Pill>Science</Pill>
              <Pill>Beta</Pill>
              <Pill tone="ok">Active</Pill>
              <Pill tone="warn">Review</Pill>
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* 07 · Divider */}
      <Section label="07 · Divider">
        <div className="space-y-6">
          <div>
            <UILabel className="mb-4">Default (decorative)</UILabel>
            <Divider />
          </div>
          <div>
            <UILabel className="mb-4">With margin — my-6</UILabel>
            <div className="bg-surface-2 p-4">
              <Body>Above divider content</Body>
              <Divider className="my-4" />
              <Body>Below divider content</Body>
            </div>
          </div>
          <div>
            <UILabel className="mb-4">Structural (role=separator)</UILabel>
            <Divider decorative={false} />
          </div>
        </div>
      </Section>

      <Divider />

      {/* 08 · Heading (polymorphic) */}
      <Section label="08 · Heading">
        <div className="space-y-6">
          {([1, 2, 3, 4] as const).map((level) => (
            <div key={level} className="flex items-baseline gap-4">
              <JeffreySystem className="w-20 shrink-0">level={level}</JeffreySystem>
              <Heading level={level}>
                Lorem ipsum dolor sit amet consectetur
              </Heading>
            </div>
          ))}
          <div>
            <UILabel className="mb-2">as override (h2 scale on div)</UILabel>
            <Heading level={2} as="div">Rendered as div, styled as H2</Heading>
          </div>
        </div>
      </Section>

      <Divider />

      {/* 09 · Text */}
      <Section label="09 · Text">
        <div className="space-y-5">
          {(["lede", "body", "body-sm", "label", "data", "jeffrey", "system"] as const).map((v) => (
            <div key={v} className="flex items-baseline gap-4">
              <JeffreySystem className="w-24 shrink-0">variant={v}</JeffreySystem>
              <Text variant={v}>
                {v === "data"
                  ? "128.4 ng/mL"
                  : v === "label"
                  ? "Formula · Morning"
                  : "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
              </Text>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* 10 · Eyebrow */}
      <Section label="10 · Eyebrow">
        <div className="space-y-3">
          <Eyebrow>Brand · default</Eyebrow>
          <Eyebrow tone="data">Data · midnight</Eyebrow>
          <Eyebrow tone="muted">Muted · soft</Eyebrow>
        </div>
      </Section>

      <Divider />

      {/* 11 · Container widths */}
      <Section label="11 · Container widths">
        <div className="space-y-3">
          {(["narrow", "reading", "wide", "full"] as const).map((w) => (
            <div key={w} className="bg-surface-2 border border-line">
              <Container width={w} className="py-2">
                <JeffreySystem>width={w}</JeffreySystem>
              </Container>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* 12 · Typography roles (full set) */}
      <Section label="12 · Typography roles">
        <div className="space-y-8">
          <div>
            <UILabel className="mb-3">Heading roles (H1–H4)</UILabel>
            <div className="space-y-4">
              <H1>H1 · IBM Plex Sans 700 · 48px</H1>
              <H2>H2 · IBM Plex Sans 700 · 32px</H2>
              <H3>H3 · IBM Plex Sans 600 · 24px</H3>
              <H4>H4 · IBM Plex Sans 600 · 20px</H4>
            </div>
          </div>
          <div>
            <UILabel className="mb-3">Body roles</UILabel>
            <div className="space-y-3">
              <Lede>Lede · 18/20px · leads into body text, slightly elevated</Lede>
              <Body>Body · 16px · default prose, 1.65 line-height for comfortable reading at column width</Body>
            </div>
          </div>
          <div>
            <UILabel className="mb-3">System roles (IBM Plex Mono)</UILabel>
            <div className="space-y-3">
              <div>
                <UILabel>UI label sample</UILabel>
              </div>
              <div>
                <DataValue className="text-3xl text-data">128 </DataValue>
                <span className="font-system text-sm text-soft">ng/mL</span>
              </div>
              <JeffreySystem>System affordance · timestamp · citation · 12px</JeffreySystem>
            </div>
          </div>
          <div>
            <UILabel className="mb-3">Emotional accent (one per page max)</UILabel>
            <ValueProp>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. One per
              page, never in UI.
            </ValueProp>
          </div>
          <div>
            <UILabel className="mb-3">Jeffrey roles</UILabel>
            <div className="space-y-3">
              <JeffreyText>
                Jeffrey prose — Plex Sans 400, slightly tighter ink than body.
                Warmth approved deviation from Brand Bible Briston/SourceCodePro.
              </JeffreyText>
              <JeffreySystem>Not live · M10 wires conversation · jeffrey system</JeffreySystem>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="border-t border-line mt-16">
        <Container width="full" className="py-8">
          <JeffreySystem>
            /internal/design-system · M2 primitives · robots: noindex · not
            in sitemap · safe to share with design reviewers
          </JeffreySystem>
        </Container>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-12 md:py-16">
      <Container width="full">
        <Eyebrow tone="muted" className="mb-6">{label}</Eyebrow>
        {children}
      </Container>
    </section>
  );
}
