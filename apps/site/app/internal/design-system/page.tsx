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
 * Every primitive, every variant — lorem-only copy (M3 content pass brings
 * the real words). Use this to check token wiring, type scales, palette
 * budget, and motion before layouts go live.
 *
 * Sections:
 *   01 · Palette
 *   02 · Type specimen (Briston Bold + Plex scale)
 *   03 · Rally cry
 *   04 · Button
 *   05 · Card
 *   06 · Pill
 *   07 · Divider
 *   08 · Heading
 *   09 · Text
 *   10 · Eyebrow
 *   11 · Container
 *   12 · Typography roles
 */

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="border-b border-line bg-surface">
        <Container width="full" className="py-12">
          <Pill tone="data">Internal · M2</Pill>
          <H1 className="mt-6">Design system</H1>
          <Lede className="mt-3 max-w-xl text-muted">
            Every primitive, every variant. The source of truth before content lands in M3.
          </Lede>
        </Container>
      </div>

      {/* 01 · Palette */}
      <Section label="01 · Palette — 70 / 20 / 8 / 2">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {[
            { name: "surface",       cls: "bg-surface border border-line", note: "70%" },
            { name: "surface-2",     cls: "bg-surface-2 border border-line", note: "surface tint" },
            { name: "ink",           cls: "bg-ink", note: "20%" },
            { name: "muted",         cls: "bg-muted", note: "" },
            { name: "soft",          cls: "bg-soft", note: "" },
            { name: "brand",         cls: "bg-brand", note: "8%" },
            { name: "data",          cls: "bg-data", note: "2%" },
            { name: "signal",        cls: "bg-signal", note: "activation" },
            { name: "line",          cls: "bg-line border border-line-strong", note: "" },
            { name: "ok",            cls: "bg-ok", note: "" },
            { name: "warn",          cls: "bg-warn", note: "" },
            { name: "danger",        cls: "bg-danger", note: "" },
            { name: "ok-soft",       cls: "bg-ok-soft border border-line", note: "" },
            { name: "warn-soft",     cls: "bg-warn-soft border border-line", note: "" },
            { name: "danger-soft",   cls: "bg-danger-soft border border-line", note: "" },
          ].map(({ name, cls, note }) => (
            <div key={name}>
              <div className={`h-14 w-full ${cls}`} />
              <JeffreySystem className="mt-1.5 block">{name}</JeffreySystem>
              {note && <JeffreySystem className="text-soft">{note}</JeffreySystem>}
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* 02 · Type specimen */}
      <Section label="02 · Type specimen — Briston Bold display, IBM Plex body + mono">
        <div className="space-y-8">
          {/* Briston Bold specimen */}
          <div className="rounded-[2px] border border-line p-8 bg-surface-2">
            <JeffreySystem className="mb-4 block">
              Briston Bold — display &amp; headlines (font files pending, renders IBM Plex Bold until dropped in)
            </JeffreySystem>
            <div className="space-y-4">
              <div className="font-display font-bold text-[72px] leading-[1.02] tracking-[-0.025em] text-ink">
                Aa
              </div>
              <div className="font-display font-bold text-5xl leading-[1.05] tracking-[-0.02em] text-ink">
                Your Body. Understood.
              </div>
              <div className="font-display font-bold text-3xl leading-[1.1] tracking-[-0.015em] text-ink">
                Intelligence that learns you.
              </div>
            </div>
          </div>

          {/* IBM Plex Sans body specimen */}
          <div>
            <JeffreySystem className="mb-4 block">IBM Plex Sans — body prose</JeffreySystem>
            <Body>
              Personalized by intelligence. Owned by you. Your body is constantly
              changing — your protocol should too. Lorem ipsum dolor sit amet,
              consectetur adipiscing elit, sed do eiusmod tempor.
            </Body>
          </div>

          {/* IBM Plex Mono specimen */}
          <div>
            <JeffreySystem className="mb-4 block">IBM Plex Mono — data, labels, system</JeffreySystem>
            <div className="space-y-2">
              <UILabel>Vitamin D · 128 ng/mL · Optimal</UILabel>
              <br />
              <JeffreySystem>Updated 2 minutes ago · Protocol v14 · Morning dose</JeffreySystem>
            </div>
          </div>

          {/* Full scale */}
          <div>
            <JeffreySystem className="mb-6 block">Full scale</JeffreySystem>
            <div className="space-y-5">
              {[
                { label: "display · 72px", cls: "font-display font-bold text-[4.5rem] leading-[1.02] tracking-[-0.025em]" },
                { label: "h1 · 48px",      cls: "font-display font-bold text-5xl leading-[1.05] tracking-[-0.02em]" },
                { label: "h2 · 32px",      cls: "font-display font-bold text-4xl leading-[1.1] tracking-[-0.015em]" },
                { label: "h3 · 24px",      cls: "font-display font-semibold text-3xl leading-[1.15] tracking-[-0.01em]" },
                { label: "h4 · 20px",      cls: "font-display font-semibold text-2xl leading-[1.2]" },
                { label: "body-lg · 18px", cls: "font-body text-lg leading-[1.65]" },
                { label: "body · 16px",    cls: "font-body text-base leading-[1.65]" },
                { label: "body-sm · 14px", cls: "font-body text-sm leading-snug" },
                { label: "mono-lg · 15px", cls: "font-system text-[0.9375rem] font-medium leading-[1.5]" },
                { label: "mono · 13px",    cls: "font-system text-[0.8125rem] leading-[1.5]" },
                { label: "caption · 12px", cls: "font-system text-xs leading-[1.4] tracking-[0.04em]" },
              ].map(({ label, cls }) => (
                <div key={label} className="flex items-baseline gap-6">
                  <span className="w-40 shrink-0 font-system text-[11px] text-soft tracking-[0.06em] uppercase">{label}</span>
                  <span className={cls}>Lorem ipsum dolor sit amet</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* 03 · Rally cry */}
      <Section label="03 · Rally cry — period-locked, one per page">
        <div className="space-y-12">
          <div>
            <JeffreySystem className="mb-6 block">hero · 80px</JeffreySystem>
            <RallyCry size="hero" />
          </div>
          <div>
            <JeffreySystem className="mb-6 block">display · 60px</JeffreySystem>
            <RallyCry size="display" />
          </div>
          <div>
            <JeffreySystem className="mb-6 block">inline · 30px</JeffreySystem>
            <RallyCry size="inline" />
          </div>
        </div>
      </Section>

      <Divider />

      {/* 04 · Button */}
      <Section label="04 · Button — 2px radius, earned motion">
        <div className="space-y-8">
          <div>
            <JeffreySystem className="mb-4 block">Tones — hover to feel the lift</JeffreySystem>
            <div className="flex flex-wrap gap-4">
              <Button tone="primary">Start your protocol</Button>
              <Button tone="secondary">Learn how it works</Button>
              <Button tone="ghost">Dismiss</Button>
            </div>
          </div>
          <div>
            <JeffreySystem className="mb-4 block">Sizes</JeffreySystem>
            <div className="flex flex-wrap items-center gap-4">
              <Button tone="primary" size="sm">Small</Button>
              <Button tone="primary" size="md">Medium</Button>
              <Button tone="primary" size="lg">Large · hero CTA</Button>
            </div>
          </div>
          <div>
            <JeffreySystem className="mb-4 block">Disabled states</JeffreySystem>
            <div className="flex flex-wrap gap-4">
              <Button tone="primary" disabled>Primary (disabled)</Button>
              <Button tone="secondary" disabled>Secondary (disabled)</Button>
              <Button tone="ghost" disabled>Ghost (disabled)</Button>
            </div>
          </div>
          <div>
            <JeffreySystem className="mb-4 block">On dark surface</JeffreySystem>
            <div className="bg-data p-8 rounded-[2px]">
              <div className="flex flex-wrap gap-4">
                <Button tone="secondary" className="border border-white/20 bg-white/10 text-white hover:bg-white/15 ring-0">
                  Investor access
                </Button>
                <Button tone="ghost" className="text-white hover:bg-white/10">
                  Learn more
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* 05 · Card */}
      <Section label="05 · Card — elevation-1 default, flat for dense layouts">
        <div className="space-y-8">
          <div>
            <JeffreySystem className="mb-4 block">Variants — hover a card with hover=true to see the lift</JeffreySystem>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <JeffreySystem className="mb-3 block">default (elevation-1)</JeffreySystem>
                <Card hover>
                  <H4>Morning formula</H4>
                  <Body className="mt-2">
                    Your protocol updated based on last night&apos;s sleep and this week&apos;s activity.
                  </Body>
                </Card>
              </div>
              <div>
                <JeffreySystem className="mb-3 block">flat (dense contexts)</JeffreySystem>
                <Card variant="flat">
                  <H4>Flat card</H4>
                  <Body className="mt-2">
                    Use in tiled layouts where elevation-1 would feel cluttered.
                  </Body>
                </Card>
              </div>
              <div>
                <JeffreySystem className="mb-3 block">data (intelligence panel)</JeffreySystem>
                <Card variant="data">
                  <H4 className="text-white">Vitamin D</H4>
                  <DataValue className="text-4xl text-white mt-3">128</DataValue>
                  <JeffreySystem className="mt-1 text-white/60">ng/mL · optimal</JeffreySystem>
                </Card>
              </div>
              <div>
                <JeffreySystem className="mb-3 block">ghost (separation, no mass)</JeffreySystem>
                <Card variant="ghost" padding="sm">
                  <H4>Subtle</H4>
                  <Body className="mt-2">Transparent — hairline only.</Body>
                </Card>
              </div>
            </div>
          </div>
          <div>
            <JeffreySystem className="mb-4 block">Padding scale</JeffreySystem>
            <div className="grid gap-4 md:grid-cols-4">
              {(["none", "sm", "md", "lg"] as const).map((p) => (
                <Card key={p} variant="flat" padding={p} className={p === "none" ? "p-3" : ""}>
                  <JeffreySystem>padding={p}</JeffreySystem>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* 06 · Pill */}
      <Section label="06 · Pill — Plex Mono, uppercase, 11px">
        <div className="space-y-6">
          <div>
            <JeffreySystem className="mb-4 block">All tones</JeffreySystem>
            <div className="flex flex-wrap gap-3">
              <Pill>Neutral (default)</Pill>
              <Pill tone="brand">New</Pill>
              <Pill tone="data">Intelligence</Pill>
              <Pill tone="signal">Live</Pill>
              <Pill tone="ok">Active</Pill>
              <Pill tone="warn">Review</Pill>
            </div>
          </div>
          <div>
            <JeffreySystem className="mb-4 block">Real-world usage</JeffreySystem>
            <div className="flex flex-wrap gap-3">
              <Pill tone="data">01 / 10</Pill>
              <Pill>Science</Pill>
              <Pill>Longevity</Pill>
              <Pill tone="signal">Updated</Pill>
              <Pill tone="brand">Beta</Pill>
              <Pill tone="ok">Verified</Pill>
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* 07 · Divider */}
      <Section label="07 · Divider — hairline, ink/line color">
        <div className="space-y-8">
          <div>
            <JeffreySystem className="mb-4 block">Decorative (default)</JeffreySystem>
            <Divider />
          </div>
          <div>
            <JeffreySystem className="mb-4 block">With margin — breathing room</JeffreySystem>
            <div className="bg-surface-2 border border-line p-6">
              <Body>Content above.</Body>
              <Divider className="my-6" />
              <Body>Content below — notice the breathing room.</Body>
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* 08 · Heading */}
      <Section label="08 · Heading — polymorphic, level=1–4">
        <div className="space-y-8">
          {([1, 2, 3, 4] as const).map((level) => (
            <div key={level} className="flex items-baseline gap-6">
              <JeffreySystem className="w-20 shrink-0">level={level}</JeffreySystem>
              <Heading level={level}>
                Intelligence that learns you
              </Heading>
            </div>
          ))}
          <div className="flex items-baseline gap-6">
            <JeffreySystem className="w-20 shrink-0">as=div</JeffreySystem>
            <Heading level={2} as="div">
              H2 scale rendered as a div
            </Heading>
          </div>
        </div>
      </Section>

      <Divider />

      {/* 09 · Text */}
      <Section label="09 · Text — 7 variants">
        <div className="space-y-6">
          {(["lede", "body", "body-sm", "label", "data", "jeffrey", "system"] as const).map((v) => (
            <div key={v} className="flex items-baseline gap-6">
              <JeffreySystem className="w-24 shrink-0">variant={v}</JeffreySystem>
              <Text variant={v}>
                {v === "data"
                  ? "128.4 ng/mL"
                  : v === "label"
                  ? "Vitamin D · Morning"
                  : v === "system"
                  ? "Updated 2 minutes ago"
                  : "Your body is the signal. We're just listening."}
              </Text>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* 10 · Eyebrow */}
      <Section label="10 · Eyebrow — section anchor, three tones">
        <div className="space-y-4">
          <Eyebrow>Brand tone — default accent</Eyebrow>
          <Eyebrow tone="data">Data tone — midnight</Eyebrow>
          <Eyebrow tone="muted">Muted tone — soft gray</Eyebrow>
        </div>
      </Section>

      <Divider />

      {/* 11 · Container */}
      <Section label="11 · Container — four widths, consistent gutters">
        <div className="space-y-4">
          {(["narrow", "reading", "wide", "full"] as const).map((w) => (
            <div key={w} className="border border-dashed border-line-strong">
              <Container width={w} className="py-3">
                <JeffreySystem>width={w} · max-w: {
                  { narrow: "672px", reading: "768px", wide: "1024px", full: "1280px" }[w]
                }</JeffreySystem>
              </Container>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* 12 · Typography roles */}
      <Section label="12 · Typography roles — full system">
        <div className="space-y-10">
          <div>
            <JeffreySystem className="mb-6 block">Headings — Briston Bold (display fallback: IBM Plex Bold)</JeffreySystem>
            <div className="space-y-5">
              <H1>H1 — Briston Bold 700 · 48px</H1>
              <H2>H2 — Briston Bold 700 · 32px</H2>
              <H3>H3 — Briston Bold 600 · 24px</H3>
              <H4>H4 — Briston Bold 600 · 20px</H4>
            </div>
          </div>
          <div>
            <JeffreySystem className="mb-6 block">Body — IBM Plex Sans</JeffreySystem>
            <div className="space-y-4">
              <Lede>Lede — 18px · opens a section, directly after a heading</Lede>
              <Body>Body — 16px · default prose · comfortable at column width · 1.65 line-height</Body>
            </div>
          </div>
          <div>
            <JeffreySystem className="mb-6 block">System — IBM Plex Mono</JeffreySystem>
            <div className="space-y-4">
              <UILabel>UI label — 12px Mono · 0.18em tracked · uppercase</UILabel>
              <div>
                <DataValue className="text-3xl text-data">128 </DataValue>
                <span className="font-system text-sm text-soft">ng/mL · tabular-nums</span>
              </div>
              <JeffreySystem>System affordance · 12px · timestamp · citation · 0.08em</JeffreySystem>
            </div>
          </div>
          <div>
            <JeffreySystem className="mb-6 block">Accent — IBM Plex Serif · one per page max</JeffreySystem>
            <ValueProp>
              Intelligence that understands you better than any average ever could.
            </ValueProp>
          </div>
          <div>
            <JeffreySystem className="mb-6 block">Jeffrey — locked deviation from Brand Bible</JeffreySystem>
            <div className="space-y-4">
              <JeffreyText>
                Jeffrey voice — IBM Plex Sans 400, warm and close. Approved deviation
                from Briston Bold (Jeffrey reads as a person, not a brand mark).
              </JeffreyText>
              <JeffreySystem>Not live · conversation wires in M10</JeffreySystem>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="border-t border-line mt-8">
        <Container width="full" className="py-10">
          <JeffreySystem>
            /internal/design-system · M2 primitives · robots: noindex ·
            safe to share with design reviewers · content lands in M3
          </JeffreySystem>
        </Container>
      </div>
    </div>
  );
}

// ─── Section wrapper — more generous spacing for Lemonade rhythm ──────────

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-16 md:py-24">
      <Container width="full">
        <Eyebrow tone="muted" className="mb-8">{label}</Eyebrow>
        {children}
      </Container>
    </section>
  );
}
