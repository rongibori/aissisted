// Page 1 · Home — shell only.
// Copy lands in Milestone 3 (content pass). Do not add public-facing copy here.
// Structural skeleton exists so route resolves and a11y/perf baseline can be measured.

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <section
        aria-label="Home — hero"
        className="mx-auto max-w-5xl px-6 py-24"
      >
        <p className="text-xs font-system uppercase tracking-[0.18em] text-soft">
          Milestone 1 · scaffold
        </p>
        <h1 className="rally-cry mt-4 text-5xl md:text-7xl">
          Your Body. <span className="text-brand">Understood.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Page shell. Copy lands in Milestone 3.
        </p>
      </section>
    </main>
  );
}
