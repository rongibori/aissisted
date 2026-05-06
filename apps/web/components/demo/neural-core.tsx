import "./neural-core.css";

/**
 * Neural CORE — central pulsing entity for the live demo surface.
 *
 * 7 states (audited from CLAUDE_DESIGN_JEFFREY_VOICE_MODAL_PROMPTS scope):
 *   idle | listening | speaking | analyzing | recommendation | warning | error
 *
 * The live realtime hook (lib/hooks/use-jeffrey-realtime.ts) emits the
 * conversational subset (idle/listening/speaking/error). The two derived
 * states — analyzing and recommendation — are layered on top by the demo
 * orchestrator (WS4): analyzing fires when the assistant is silent +
 * thinking; recommendation fires on transcript "I (recommend|suggest)…"
 * matches. warning is a manual escalation; error matches the realtime
 * hook's error state.
 *
 * Visual language is SVG + CSS only. Animations live in neural-core.css
 * and key off the .nc-state-{state} parent class. WS1.b will introduce a
 * --nc-amp custom property so listening/speaking animation timing can be
 * driven by mic + assistant audio amplitude.
 */

export type CoreState =
  | "idle"
  | "listening"
  | "speaking"
  | "analyzing"
  | "recommendation"
  | "warning"
  | "error";

export const CORE_STATES: readonly CoreState[] = [
  "idle",
  "listening",
  "speaking",
  "analyzing",
  "recommendation",
  "warning",
  "error",
] as const;

export interface NeuralCoreProps {
  state: CoreState;
  /**
   * Optional ARIA label override. Defaults to a state-appropriate phrase.
   * The CORE is decorative-but-meaningful; state changes should be
   * announced to screen readers via aria-live in the parent surface.
   */
  label?: string;
}

const STATE_LABELS: Record<CoreState, string> = {
  idle: "Ready",
  listening: "Listening",
  speaking: "Speaking",
  analyzing: "Analyzing",
  recommendation: "Recommendation",
  warning: "Warning",
  error: "Error",
};

export function NeuralCore({ state, label }: NeuralCoreProps) {
  return (
    <div
      className={`nc-root nc-state-${state}`}
      role="img"
      aria-label={label ?? STATE_LABELS[state]}
    >
      <svg
        className="nc-svg"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Halo — scales/fades for speaking, recommendation, warning */}
        <circle className="nc-halo" cx="100" cy="100" r="62" />

        {/* Outer rings — listen pulses, analyze trail */}
        <circle className="nc-ring-3" cx="100" cy="100" r="56" />
        <circle className="nc-ring-2" cx="100" cy="100" r="52" />
        <circle className="nc-ring-1" cx="100" cy="100" r="48" />

        {/* Core — the entity */}
        <circle className="nc-core" cx="100" cy="100" r="40" />
      </svg>
    </div>
  );
}
