"use client";

/**
 * /jeffrey-live — internal demo surface for the Realtime hook.
 *
 * This is intentionally utilitarian — a single control, a transcript, a
 * state pill. The real concierge surface will be designed separately; this
 * page exists so we can prove the WS proxy + mic graph + playback round
 * trip works end to end.
 */

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../../lib/auth-context";
import {
  useJeffreyRealtime,
  type RealtimeState,
} from "../../lib/hooks/use-jeffrey-realtime";
import { Button, Card, Badge, Spinner } from "../../components/ui";

const STATE_LABEL: Record<RealtimeState, string> = {
  idle: "Ready",
  "requesting-ticket": "Requesting access",
  connecting: "Connecting",
  ready: "Connected",
  listening: "Listening",
  speaking: "Speaking",
  closing: "Closing",
  closed: "Ended",
  error: "Error",
};

function JeffreyLivePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const {
    state,
    error,
    transcript,
    isAssistantSpeaking,
    start,
    stop,
  } = useJeffreyRealtime({ surface: "concierge" });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const live =
    state === "requesting-ticket" ||
    state === "connecting" ||
    state === "ready" ||
    state === "listening" ||
    state === "speaking" ||
    state === "closing";

  return (
    <div className="min-h-screen bg-surface-2">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted">
            Jeffrey · Live
          </p>
          <h1 className="text-3xl font-semibold text-ink">Talk to Jeffrey</h1>
          <p className="text-muted">
            Press start. Speak normally. He will respond.
          </p>
        </header>

        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <Badge>{STATE_LABEL[state] ?? state}</Badge>
            {isAssistantSpeaking && (
              <span className="text-sm text-muted">Jeffrey is speaking…</span>
            )}
          </div>

          <div className="flex gap-3">
            {!live ? (
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  void start();
                }}
              >
                Start session
              </Button>
            ) : (
              <Button variant="secondary" size="lg" onClick={stop}>
                End session
              </Button>
            )}
          </div>

          {error && (
            <div className="text-sm text-brand">
              {error}
            </div>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-medium text-muted uppercase tracking-widest">
            Transcript
          </h2>
          {transcript.length === 0 ? (
            <p className="text-muted text-sm">
              Nothing yet. Start a session and speak.
            </p>
          ) : (
            <ul className="space-y-3">
              {transcript.map((turn) => (
                <li key={turn.id} className="space-y-1">
                  <span className="text-xs uppercase tracking-widest text-muted">
                    {turn.role === "user" ? "You" : "Jeffrey"}
                  </span>
                  <p
                    className={`text-ink ${
                      turn.partial ? "opacity-70" : ""
                    }`}
                  >
                    {turn.text || "…"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function JeffreyLivePageWrapper() {
  return (
    <AuthProvider>
      <JeffreyLivePage />
    </AuthProvider>
  );
}
