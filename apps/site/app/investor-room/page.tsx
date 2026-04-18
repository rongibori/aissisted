import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investor Room",
  robots: { index: false, follow: false },
};

// Page 10 · Investor Room — GATED. Middleware enforces session check before
// the route ever renders. This shell assumes middleware has already verified.
//
// Milestone 8 builds out the room. Milestone 7 wires the auth flow.
// No raise size, band, or valuation surfaces here per Ron lock —
// Jeffrey routes raise-specific intent to the founder-meeting ask.
export default function InvestorRoomPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <section className="mx-auto max-w-5xl px-6 py-24">
        <p className="text-xs font-system uppercase tracking-[0.18em] text-brand">
          Investor room · gated
        </p>
        <h1 className="mt-4 text-4xl md:text-5xl">Investor room</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Page shell. Milestone 8 builds the surface.
        </p>
      </section>
    </main>
  );
}
