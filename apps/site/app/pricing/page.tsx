import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pricing" };

// Page 5 · Pricing — shell only. Copy lands in Milestone 3.
// Pricing is LOCKED: One Formula $69 / Two $99 / All Three $149 per month.
// Do not render price numerals here until Milestone 3 copy pass.
export default function PricingPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <section className="mx-auto max-w-4xl px-6 py-24">
        <p className="text-xs font-system uppercase tracking-[0.18em] text-soft">
          Page 05
        </p>
        <h1 className="mt-4 text-4xl md:text-5xl">Pricing</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Page shell. Copy lands in Milestone 3.
        </p>
      </section>
    </main>
  );
}
