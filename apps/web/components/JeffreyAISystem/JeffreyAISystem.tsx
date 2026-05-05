"use client";

/**
 * AISSISTED — Jeffrey AI System
 *
 * The top-level component. Owns:
 *   - mode state (idle/listening/thinking/speaking/recommendation)
 *   - active module list (which paths light up)
 *   - signal router instance (lives across the lifetime of the system)
 *   - personalization snapshot (currently mock; swap for real bridge data)
 *
 * Exposes:
 *   - mode-control buttons (idle/listening/thinking/speaking/recommendation)
 *   - "Run Demo" button that plays the live interaction script end-to-end
 *   - Recommendation card overlay during recommendation mode
 *
 * Visual layout:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  Header: user, state phrase, last sync                 │
 *   │  ┌─────────────────────────────────────────────────┐   │
 *   │  │                                                 │   │
 *   │  │            AI SCENE (R3F Canvas)                │   │
 *   │  │     core + 7 modules + signal streams           │   │
 *   │  │                                                 │   │
 *   │  │              [recommendation card]              │   │
 *   │  └─────────────────────────────────────────────────┘   │
 *   │  Footer: mode buttons + UI copy                        │
 *   └─────────────────────────────────────────────────────────┘
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import type {
  SystemMode,
  SystemSnapshot,
  DataModuleType,
} from "./systemTypes";
import { BRAND_COLOR } from "./systemTypes";
import { SignalRouter } from "./SignalRouter";
import { RON_SNAPSHOT, DEMO_SCRIPT, RECOMMENDATION } from "./mockData";

// Lazy-load the Canvas-bearing AIScene so it doesn't ship to SSR.
const AIScene = dynamic(() => import("./AIScene").then((m) => m.AIScene), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.5)",
        fontSize: 11,
        letterSpacing: 1.2,
        textTransform: "uppercase",
      }}
    >
      Booting Jeffrey
    </div>
  ),
});

interface Props {
  /** Override the mock snapshot. Real product hydrates from the FHIR bridge. */
  snapshot?: SystemSnapshot;
  /** External mode driver (e.g., real voice WebRTC events). When supplied,
   *  the demo controls and internal mode state are bypassed. */
  mode?: SystemMode;
  activeModules?: DataModuleType[];
  /** Hide the bottom mode control bar (production surfaces wouldn't show it) */
  hideControls?: boolean;
}

const ALL_MODES: SystemMode[] = [
  "idle",
  "listening",
  "thinking",
  "speaking",
  "recommendation",
];

export function JeffreyAISystem({
  snapshot = RON_SNAPSHOT,
  mode: modeProp,
  activeModules: activeProp,
  hideControls = false,
}: Props) {
  const [internalMode, setInternalMode] = useState<SystemMode>("idle");
  const [internalActive, setInternalActive] = useState<DataModuleType[]>([
    "sleep",
    "recovery",
    "labs",
  ]);
  const [demoStep, setDemoStep] = useState<number>(-1);
  const [uiCopy, setUiCopy] = useState<string>("Monitoring Ron's signals");
  const [showRec, setShowRec] = useState<boolean>(false);
  const router = useMemo(() => new SignalRouter(), []);

  const mode = modeProp ?? internalMode;
  const activeModules = activeProp ?? internalActive;

  // ─── Demo runner ──────────────────────────────────────────────────────
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearDemo() {
    if (demoTimerRef.current) {
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  }
  function runDemo() {
    clearDemo();
    setDemoStep(0);
  }
  function stopDemo() {
    clearDemo();
    setDemoStep(-1);
    setShowRec(false);
    setInternalMode("idle");
    setUiCopy("Monitoring Ron's signals");
  }

  useEffect(() => {
    if (demoStep < 0) return;
    if (demoStep >= DEMO_SCRIPT.length) {
      // Loop back to idle and exit demo
      stopDemo();
      return;
    }
    const step = DEMO_SCRIPT[demoStep];
    setInternalMode(step.mode);
    setInternalActive(step.modules);
    setUiCopy(step.uiCopy);
    if (step.showRecommendation) setShowRec(true);
    if (step.id === 7) setShowRec(false); // hide recommendation when returning to idle

    demoTimerRef.current = setTimeout(() => {
      setDemoStep((s) => s + 1);
    }, step.durationMs);

    return () => {
      if (demoTimerRef.current) {
        clearTimeout(demoTimerRef.current);
        demoTimerRef.current = null;
      }
    };
  }, [demoStep]);

  // Cleanup on unmount
  useEffect(() => () => clearDemo(), []);

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        width: "100%",
        // Explicit viewport-based height — parent only sets min-height, so we
        // need a real height for Canvas inside to resolve via getBoundingClientRect.
        height: "100vh",
        minHeight: 720,
        background: BRAND_COLOR.midnight,
        color: BRAND_COLOR.white,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "var(--font-body, ui-sans-serif), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header
        style={{
          padding: "20px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          background:
            "linear-gradient(180deg, rgba(11,29,58,0.85) 0%, transparent 100%)",
          zIndex: 5,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2.2,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              marginBottom: 6,
            }}
          >
            Aissisted · Jeffrey System
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: -0.2,
            }}
          >
            {snapshot.user.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
              fontStyle: "italic",
              marginTop: 2,
            }}
          >
            {snapshot.user.state}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              marginBottom: 4,
            }}
          >
            Last sync
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily:
                "var(--font-mono, ui-monospace), 'SFMono-Regular', Menlo, monospace",
              color: "rgba(255,255,255,0.85)",
              letterSpacing: 0.4,
            }}
          >
            {formatSync(snapshot.user.lastSyncedAt)}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: modeColor(mode),
              opacity: 0.92,
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "flex-end",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: modeColor(mode),
                boxShadow: `0 0 8px ${modeColor(mode)}`,
              }}
            />
            {mode}
          </div>
        </div>
      </header>

      {/* ── Scene + Recommendation overlay ─────────────────────────────── */}
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 540,
          // Ensure the inner Canvas has resolvable dimensions:
          // flex:1 needs a flex container with finite cross-axis; we provide it.
          width: "100%",
          overflow: "hidden",
        }}
      >
        <AIScene
          mode={mode}
          snapshot={snapshot}
          activeModules={activeModules}
          router={router}
        />

        {/* UI copy banner — sits at top-center of the scene */}
        <div
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            pointerEvents: "none",
            textAlign: "center",
            maxWidth: 520,
          }}
        >
          {uiCopy}
        </div>

        {/* Recommendation card */}
        <AnimatePresence>
          {showRec && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.42, ease: [0.2, 0, 0, 1] }}
              style={{
                position: "absolute",
                bottom: 32,
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(420px, 92%)",
                background:
                  "linear-gradient(180deg, rgba(11,29,58,0.94) 0%, rgba(5,11,26,0.94) 100%)",
                border: `1px solid ${BRAND_COLOR.aqua}55`,
                borderRadius: 8,
                padding: "16px 18px",
                boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 28px ${BRAND_COLOR.aqua}22`,
                color: BRAND_COLOR.white,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: BRAND_COLOR.aqua,
                  marginBottom: 8,
                }}
              >
                Recommendation · v3.2 → v3.3
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 500,
                  lineHeight: 1.25,
                  marginBottom: 8,
                }}
              >
                {RECOMMENDATION.primary}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.7)",
                  fontStyle: "italic",
                  marginBottom: 6,
                }}
              >
                {RECOMMENDATION.reason}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: 8,
                }}
              >
                Secondary · {RECOMMENDATION.secondary}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer · Mode controls ─────────────────────────────────────── */}
      {!hideControls && (
        <footer
          style={{
            padding: "14px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background:
              "linear-gradient(0deg, rgba(11,29,58,0.85) 0%, transparent 100%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            zIndex: 5,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ALL_MODES.map((m) => (
              <ModeButton
                key={m}
                label={m}
                active={mode === m && demoStep < 0}
                onClick={() => {
                  clearDemo();
                  setDemoStep(-1);
                  setShowRec(m === "recommendation");
                  setInternalMode(m);
                  setInternalActive(defaultActiveFor(m));
                  setUiCopy(defaultCopyFor(m));
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {demoStep < 0 ? (
              <button
                onClick={runDemo}
                style={demoButtonStyle(true)}
              >
                ▶ Run Demo
              </button>
            ) : (
              <button onClick={stopDemo} style={demoButtonStyle(false)}>
                ■ Stop Demo
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: SystemMode;
  active: boolean;
  onClick: () => void;
}) {
  const accent = modeColor(label);
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px",
        background: active ? `${accent}20` : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? accent : "rgba(255,255,255,0.12)"}`,
        borderRadius: 4,
        color: active ? accent : "rgba(255,255,255,0.65)",
        fontSize: 10,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        fontFamily: "inherit",
        cursor: "pointer",
        transition: "all 240ms cubic-bezier(0.2, 0, 0, 1)",
        boxShadow: active ? `0 0 12px ${accent}44` : "none",
      }}
    >
      {label}
    </button>
  );
}

function demoButtonStyle(start: boolean): React.CSSProperties {
  return {
    padding: "8px 14px",
    background: start ? BRAND_COLOR.aqua : "rgba(238, 43, 55, 0.18)",
    border: `1px solid ${start ? BRAND_COLOR.aqua : BRAND_COLOR.red}`,
    borderRadius: 4,
    color: start ? BRAND_COLOR.midnight : BRAND_COLOR.white,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontFamily: "inherit",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 200ms",
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function modeColor(mode: SystemMode): string {
  switch (mode) {
    case "idle":
      return "rgba(157, 214, 221, 0.85)";
    case "listening":
      return BRAND_COLOR.white;
    case "thinking":
      return BRAND_COLOR.aqua;
    case "speaking":
      return BRAND_COLOR.aqua;
    case "recommendation":
      return BRAND_COLOR.red;
    default:
      return BRAND_COLOR.aqua;
  }
}

function defaultActiveFor(mode: SystemMode): DataModuleType[] {
  switch (mode) {
    case "idle":
      return ["sleep", "recovery", "labs"];
    case "listening":
      return ["sleep", "recovery"];
    case "thinking":
      return ["sleep", "recovery", "stress", "labs", "stack"];
    case "speaking":
      return ["sleep", "recovery", "stress", "stack"];
    case "recommendation":
      return ["stack"];
    default:
      return [];
  }
}

function defaultCopyFor(mode: SystemMode): string {
  switch (mode) {
    case "idle":
      return "Monitoring Ron's signals";
    case "listening":
      return "Listening";
    case "thinking":
      return "Interpreting recovery pattern";
    case "speaking":
      return "Sleep fragmented · RHR elevated · Stack timing adjustment";
    case "recommendation":
      return "Recommendation issued";
    default:
      return "";
  }
}

function formatSync(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${d.getMonth() + 1}/${d.getDate()} · ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

export default JeffreyAISystem;
