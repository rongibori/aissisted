import type { Metadata } from "next";

export const metadata: Metadata = { title: "Science + method" };

// Page 4 · Science + method — shell only. Copy lands in Milestone 3.
export default function SciencePage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <section className="mx-auto max-w-4xl px-6 py-24">
        <p className="text-xs font-system uppercase tracking-[0.18em] text-soft">
          Page 04
        </p>
        <h1 className="mt-4 text-4xl md:text-5xl">Science + method</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Page shell. Copy lands in Milestone 3.
        </p>
      </section>
    </main>
  );
}
