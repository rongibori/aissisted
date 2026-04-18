import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

// Page 9 · Contact / founder meeting — shell only. Copy lands in Milestone 3.
// This is the soft-sell surface Jeffrey routes to when intent > 0.7.
// Milestone 12 wires HubSpot for investor-lead routing.
export default function ContactPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <section className="mx-auto max-w-4xl px-6 py-24">
        <p className="text-xs font-system uppercase tracking-[0.18em] text-soft">
          Page 09
        </p>
        <h1 className="mt-4 text-4xl md:text-5xl">Contact</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Page shell. Copy lands in Milestone 3.
        </p>
      </section>
    </main>
  );
}
