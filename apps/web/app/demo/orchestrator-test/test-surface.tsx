"use client";

/**
 * OrchestratorTestSurface — minimal client UI that wires:
 *
 *   useJeffreyRealtime  ──events──▶  RealtimeAdapter  ──dispatches──▶  Store
 *                                                                       │
 *                                                                       ▼
 *                                                              React selector hooks
 *                                                                       │
 *                                                                       ▼
 *                                                              This component renders
 *
 * The visual is intentionally rough. The point is to PROVE:
 *   - Mode pill changes (idle / listening / thinking / analyzing / speaking)
 *   - Module chips light up by SEMANTIC similarity, not keyword
 *   - Visual reaction happens BEFORE Jeffrey finishes speaking
 *   - Interruption cuts audio + lets user route a new question
 *   - Resume tone is natural and subtle
 *
 * Mobile-first. Single column. No multi-panel desktop layout.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useJeffreyRealtime } from "../../../lib/hooks/use-jeffrey-realtime";
import {
  MODULE_IDS,
  createRealtimeAdapter,
  dispatch,
  getOrchestrationState,
  useOrchestratorMode,
  useActiveModules,
  useAllTopicConfidence,
  usePrimaryFocus,
  useVoiceConnection,
  useIsAssistantSpeaking,
  useLastClassification,
  useLastUserUtterance,
  useLastAssistantUtterance,
  type ModuleId,
  type EmbedFn,
  type ClassifyFn,
  type EmbedResponse,
  type ClassifyResponse,
} from "@aissisted/orchestrator";

// ─── API client wrappers (server-side OPENAI_API_KEY) ────────────────────

function getApiBase(): string {
  // Match the convention used in apps/web/lib/jeffrey-realtime.ts
  if (typeof window === "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_API_URL ?? window.location.origin.replace(":3000", ":4000")
  );
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = window.localStorage.getItem("aissisted_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const embedFn: EmbedFn = async (texts) => {
  const resp = await fetch(`${getApiBase()}/v1/jeffrey/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ texts }),
  });
  if (!resp.ok) throw new Error(`embeddings ${resp.status}`);
  return (await resp.json()) as EmbedResponse;
};

const classifyFn: ClassifyFn = async (req) => {
  const resp = await fetch(`${getApiBase()}/v1/jeffrey/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(req),
  });
  if (!resp.ok) throw new Error(`classify ${resp.status}`);
  return (await resp.json()) as ClassifyResponse;
};

// ─── Component ────────────────────────────────────────────────────────────

export function OrchestratorTestSurface() {
  // Hook — owns audio + WS lifecycle.
  const realtime = useJeffreyRealtime({ surface: "concierge" });

  // Adapter — bridges hook outputs to orchestrator events.
  const adapterRef = useRef<ReturnType<typeof createRealtimeAdapter> | null>(
    null,
  );
  if (adapterRef.current === null) {
    adapterRef.current = createRealtimeAdapter({
      embed: embedFn,
      classifyLlm: classifyFn,
      dispatch,
      getRollingAssistantText: () => getOrchestrationState().lastAssistantUtterance,
    });
  }

  // Push hook outputs into the adapter on every render.
  useEffect(() => {
    adapterRef.current?.onStateChange(realtime.state);
  }, [realtime.state]);
  useEffect(() => {
    adapterRef.current?.onTranscript(realtime.transcript);
  }, [realtime.transcript]);
  useEffect(() => {
    adapterRef.current?.onAssistantSpeaking(realtime.isAssistantSpeaking);
  }, [realtime.isAssistantSpeaking]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      adapterRef.current?.destroy();
      adapterRef.current = null;
    };
  }, []);

  // Orchestrator state slices.
  const mode = useOrchestratorMode();
  const voiceConn = useVoiceConnection();
  const isSpeaking = useIsAssistantSpeaking();
  const activeModules = useActiveModules();
  const allConfidence = useAllTopicConfidence();
  const primary = usePrimaryFocus();
  const lastClassification = useLastClassification();
  const lastUser = useLastUserUtterance();
  const lastAssistant = useLastAssistantUtterance();

  // Manual interruption simulator — dispatches user.speech_started directly.
  const simulateInterrupt = useCallback(() => {
    dispatch({ type: "user.speech_started" });
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0B1D3A",
        color: "#FFF",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "24px 16px 80px",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            marginBottom: 4,
          }}
        >
          Aissisted · Orchestrator Test
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: 0.2,
          }}
        >
          Voice → state → reaction
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          Synthetic data · not medical advice · not HIPAA-protected. Speak
          naturally; modules light up by meaning, not keywords.
        </p>
      </header>

      {/* Voice connection + mode pills */}
      <Section label="System">
        <Row>
          <Pill label="Voice" value={voiceConn} accent={voiceColor(voiceConn)} />
          <Pill
            label="Mode"
            value={mode}
            accent={modeColor(mode)}
            big
          />
        </Row>
        <div style={{ height: 8 }} />
        <Row>
          <Pill
            label="Assistant"
            value={isSpeaking ? "speaking" : "—"}
            accent={isSpeaking ? "#00C2D1" : "rgba(255,255,255,0.18)"}
          />
          <Pill
            label="Primary focus"
            value={primary ?? "—"}
            accent={primary ? "#00C2D1" : "rgba(255,255,255,0.18)"}
          />
        </Row>
      </Section>

      {/* Module activation row */}
      <Section label="Modules (semantic activation)">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
          }}
        >
          {MODULE_IDS.map((id) => (
            <ModuleChip
              key={id}
              id={id}
              active={activeModules.includes(id)}
              confidence={allConfidence[id] ?? 0}
              isPrimary={id === primary}
            />
          ))}
        </div>
      </Section>

      {/* Session controls */}
      <Section label="Session">
        <Row>
          {realtime.state === "ready" || realtime.state === "listening" || realtime.state === "speaking" ? (
            <Button onClick={realtime.stop} variant="muted">
              Stop session
            </Button>
          ) : (
            <Button onClick={() => void realtime.start()} variant="primary">
              Start session
            </Button>
          )}
          <Button onClick={simulateInterrupt} variant="muted">
            Simulate interrupt
          </Button>
        </Row>
        {realtime.error && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#EE2B37" }}>
            ⚠ {realtime.error}
          </div>
        )}
      </Section>

      {/* Live transcript (debug) */}
      <Section label="Live transcript (debug)">
        <Block label="user" text={lastUser || "—"} />
        <div style={{ height: 6 }} />
        <Block label="jeffrey" text={lastAssistant || "—"} />
      </Section>

      {/* Last classification */}
      <Section label="Last classification">
        {lastClassification ? (
          <div
            style={{
              fontSize: 11,
              fontFamily: "ui-monospace, Menlo, monospace",
              color: "rgba(255,255,255,0.78)",
              background: "rgba(255,255,255,0.03)",
              padding: 10,
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div>
              <strong>source</strong>: {lastClassification.source}{" "}
              <span style={{ color: "rgba(255,255,255,0.4)" }}>
                @ {new Date(lastClassification.classifiedAt).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <strong>intent</strong>: {lastClassification.intent}
            </div>
            <div>
              <strong>topics</strong>: {lastClassification.topics.join(", ") || "—"}
            </div>
            <div>
              <strong>urgency</strong>: {lastClassification.urgency}
            </div>
            <div>
              <strong>requiresDataLookup</strong>:{" "}
              {String(lastClassification.requiresDataLookup)}
            </div>
            <div
              style={{
                marginTop: 6,
                color: "rgba(255,255,255,0.55)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              "{lastClassification.rawText.slice(0, 220)}"
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              fontStyle: "italic",
            }}
          >
            no classification yet — start a session and speak
          </div>
        )}
      </Section>

      {/* Footer hint */}
      <div
        style={{
          marginTop: 32,
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        feat/orchestration-layer · v0.0.1
        <br />
        modules activate via cosine similarity vs cached anchor embeddings
        <br />
        intent + topics finalized by gpt-4o-mini on each user utterance
      </div>
    </main>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────────

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.45)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>
  );
}

function Pill({
  label,
  value,
  accent,
  big,
}: {
  label: string;
  value: string;
  accent: string;
  big?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 110,
        padding: big ? "10px 12px" : "7px 10px",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${accent}`,
        borderRadius: 6,
        color: "#FFF",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: big ? 16 : 12,
          letterSpacing: 0.3,
          color: accent,
          fontWeight: 500,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ModuleChip({
  id,
  active,
  confidence,
  isPrimary,
}: {
  id: ModuleId;
  active: boolean;
  confidence: number;
  isPrimary: boolean;
}) {
  const accent = isPrimary ? "#EE2B37" : "#00C2D1";
  const opacity = active ? 1.0 : 0.18 + confidence * 0.6;
  return (
    <div
      style={{
        padding: "8px 4px",
        background: active
          ? `linear-gradient(180deg, ${accent}28, transparent)`
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${active ? accent : "rgba(255,255,255,0.08)"}`,
        borderRadius: 5,
        textAlign: "center",
        opacity,
        transition: "all 280ms cubic-bezier(0.2, 0, 0, 1)",
        minHeight: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: active ? "#FFF" : "rgba(255,255,255,0.55)",
          fontWeight: active ? 600 : 400,
        }}
      >
        {id}
      </div>
      <div
        style={{
          fontSize: 9,
          fontFamily: "ui-monospace, Menlo, monospace",
          color: active ? accent : "rgba(255,255,255,0.35)",
          marginTop: 2,
        }}
      >
        {confidence > 0 ? confidence.toFixed(2) : "—"}
      </div>
    </div>
  );
}

function Button({
  onClick,
  children,
  variant,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant: "primary" | "muted";
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 130,
        padding: "10px 14px",
        background: isPrimary ? "#EE2B37" : "rgba(255,255,255,0.06)",
        color: isPrimary ? "#FFF" : "rgba(255,255,255,0.85)",
        border: `1px solid ${isPrimary ? "#EE2B37" : "rgba(255,255,255,0.18)"}`,
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        letterSpacing: 0.2,
      }}
    >
      {children}
    </button>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6,
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.45)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 110,
          overflowY: "auto",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function modeColor(mode: string): string {
  switch (mode) {
    case "listening":
      return "#00C2D1";
    case "thinking":
    case "analyzing":
      return "#9DD6DD";
    case "speaking":
      return "#FFFFFF";
    case "recommendation":
      return "#EE2B37";
    case "idle":
    default:
      return "rgba(255,255,255,0.35)";
  }
}

function voiceColor(state: string): string {
  switch (state) {
    case "ready":
      return "#00C2D1";
    case "connecting":
      return "#9DD6DD";
    case "error":
      return "#EE2B37";
    case "disconnected":
    default:
      return "rgba(255,255,255,0.25)";
  }
}
