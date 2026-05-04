import Link from "next/link";
import { NeuralCore, CORE_STATES, type CoreState } from "../../components/demo/neural-core";

const VALID_STATES = new Set<CoreState>(CORE_STATES);

function parseState(raw: string | string[] | undefined): CoreState {
  if (typeof raw !== "string") return "idle";
  return VALID_STATES.has(raw as CoreState) ? (raw as CoreState) : "idle";
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; debug?: string }>;
}) {
  const params = await searchParams;
  const state = parseState(params.state);
  const debug = params.debug === "1";

  return (
    <main
      className="relative min-h-svh w-full flex flex-col items-center justify-center px-6 py-10"
      style={{
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* HIPAA / synthetic-data banner — persistent at top */}
      <div className="absolute top-0 inset-x-0 px-6 py-2 text-center bg-surface-2 border-b border-line">
        <p className="text-[11px] uppercase tracking-widest text-muted">
          Synthetic data · Not medical advice · Not HIPAA-protected
        </p>
      </div>

      {/* CORE */}
      <div className="flex-1 flex items-center justify-center w-full">
        <NeuralCore state={state} />
      </div>

      {/* State label — small, calm, butler cadence */}
      <div className="mt-6 text-center" aria-live="polite">
        <p className="text-xs uppercase tracking-widest text-muted">Jeffrey</p>
        <p className="text-base text-ink mt-0.5">{STATE_HEADLINES[state]}</p>
      </div>

      {/* Debug state switcher — only when ?debug=1 */}
      {debug && (
        <div className="mt-8 w-full max-w-md">
          <p className="text-[11px] uppercase tracking-widest text-soft text-center mb-3">
            Debug · pick a state
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CORE_STATES.map((s) => (
              <Link
                key={s}
                href={`/demo?state=${s}&debug=1`}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  s === state
                    ? "bg-ink text-surface border-ink"
                    : "bg-surface text-ink border-line hover:border-muted"
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Subtle hint when debug is off */}
      {!debug && (
        <p className="mt-4 text-[10px] uppercase tracking-widest text-soft">
          Demo · v0
        </p>
      )}
    </main>
  );
}

const STATE_HEADLINES: Record<CoreState, string> = {
  idle: "Ready when you are.",
  listening: "Go ahead.",
  speaking: "—",
  analyzing: "One moment.",
  recommendation: "Here's what I'd do.",
  warning: "Worth a closer look.",
  error: "Something's off.",
};
