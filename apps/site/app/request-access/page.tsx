import type { Metadata } from "next";

export const metadata: Metadata = { title: "Request access" };

// Page 7 · Request access (formerly "Waitlist / Start") — shell only.
// Milestone 3 lands copy. Milestone 7 wires the invite-code + magic-link form.
// Milestone 12 wires HubSpot CRM lead capture.
export default function RequestAccessPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <section className="mx-auto max-w-4xl px-6 py-24">
        <p className="text-xs font-system uppercase tracking-[0.18em] text-soft">
          Page 07
        </p>
        <h1 className="mt-4 text-4xl md:text-5xl">Request access</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Page shell. Copy lands in Milestone 3.
        </p>
      </section>
    </main>
  );
}
