"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth, AuthProvider } from "../../lib/auth-context";
import { Nav } from "../../components/nav";
import { chat as chatApi, healthState as healthStateApi } from "../../lib/api";
import { Button, Spinner } from "../../components/ui";
import { VoiceOrb, type VoiceOrbState } from "../../components/voice-orb";
import { NeuralCore } from "../../components/neural-core";
import {
  useSpeechRecognition,
  useSpeechSynthesis,
} from "../../lib/use-speech";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  protocolTriggered?: boolean;
}

interface ConversationMeta {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface HealthStateLite {
  mode: string;
  confidenceScore: number;
  activeSignals: { severity: string }[];
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Jeffrey, your Aissisted health concierge. I can help you understand your biomarkers, build a personalized supplement protocol, and answer health questions. What would you like to explore today?",
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ChatPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [healthLite, setHealthLite] = useState<HealthStateLite | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const tts = useSpeechSynthesis();

  const speech = useSpeechRecognition({
    onResult: (text, isFinal) => {
      setInput(text);
      if (isFinal && text.trim()) {
        // Auto-submit on final result
        setTimeout(() => sendMessage(text), 50);
      }
    },
  });

  const loadConversationList = useCallback(async () => {
    try {
      const data = await chatApi.conversations();
      setConversations(data.conversations);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    Promise.all([
      chatApi
        .recent()
        .then((data) => {
          if (data.conversationId && data.messages.length > 0) {
            setConversationId(data.conversationId);
            const restored = data.messages
              .filter((m) => m.role !== "system")
              .map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
              }));
            setMessages(restored.length > 0 ? restored : [WELCOME]);
          }
        })
        .catch(() => {}),
      loadConversationList(),
      healthStateApi
        .get()
        .then((d) => setHealthLite(d as HealthStateLite))
        .catch(() => {}),
    ]).finally(() => setRestoring(false));
  }, [user, loading, loadConversationList]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || sending) return;
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setSending(true);
      try {
        const result = await chatApi.send(text, conversationId);
        setConversationId(result.conversationId);
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.reply,
          protocolTriggered: result.protocolTriggered,
        };
        setMessages((prev) => [...prev, reply]);
        loadConversationList();
        if (voiceMode && tts.supported) {
          tts.speak(result.reply);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    },
    [input, sending, conversationId, loadConversationList, voiceMode, tts]
  );

  const openConversation = async (id: string) => {
    if (id === conversationId) {
      setSidebarOpen(false);
      return;
    }
    setLoadingHistory(true);
    setSidebarOpen(false);
    try {
      const data = await chatApi.loadMessages(id);
      setConversationId(id);
      const msgs = data.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      setMessages(msgs.length > 0 ? msgs : [WELCOME]);
    } catch {
      // keep current conversation
    } finally {
      setLoadingHistory(false);
    }
  };

  const newConversation = () => {
    setConversationId(undefined);
    setMessages([WELCOME]);
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleListen = () => {
    if (speech.listening) speech.stop();
    else speech.start();
  };

  // Compute orb state and core state
  const voiceState: VoiceOrbState = speech.listening
    ? "listening"
    : sending
      ? "processing"
      : tts.speaking
        ? "speaking"
        : "idle";

  const coreState =
    voiceState === "processing"
      ? "thinking"
      : voiceState === "speaking"
        ? "speaking"
        : voiceState === "listening"
          ? "listening"
          : "idle";

  if (loading || restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Nav />
      <div className="pt-14 flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`flex-shrink-0 bg-surface-2 border-r border-border flex flex-col transition-all duration-200 overflow-hidden ${
            sidebarOpen ? "w-64" : "w-0"
          }`}
          aria-label="Conversation history"
        >
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-soft uppercase tracking-wider">
              History
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-graphite-soft hover:text-graphite text-sm"
              aria-label="Close history"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <button
              onClick={newConversation}
              className="w-full text-left px-3 py-2 text-xs text-midnight hover:bg-surface transition-colors"
            >
              + New conversation
            </button>
            {conversations.length === 0 ? (
              <p className="text-xs text-graphite-soft/70 px-3 py-2">
                No past conversations
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`w-full text-left px-3 py-2.5 transition-colors hover:bg-surface ${
                    conv.id === conversationId ? "bg-surface" : ""
                  }`}
                >
                  <p
                    className={`text-xs font-medium truncate ${
                      conv.id === conversationId ? "text-graphite" : "text-graphite-soft"
                    }`}
                  >
                    {conv.title ?? "Untitled"}
                  </p>
                  <p className="text-[10px] text-graphite-soft/70 mt-0.5 font-data">
                    {formatRelativeTime(conv.updatedAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border px-4 py-3 flex items-center gap-3 bg-surface">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-graphite-soft hover:text-graphite transition-colors text-sm px-1"
              aria-label="Toggle conversation history"
              aria-expanded={sidebarOpen}
            >
              ☰
            </button>

            {/* Mini neural core mirroring user health + voice state */}
            <div className="shrink-0">
              <NeuralCore
                mode={healthLite?.mode ?? "data_insufficient"}
                confidenceScore={healthLite?.confidenceScore ?? 0}
                signalCount={
                  healthLite?.activeSignals.filter((s) => s.severity !== "info")
                    .length ?? 0
                }
                state={coreState as "idle" | "thinking" | "speaking" | "listening"}
                size={48}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-graphite">Jeffrey</p>
              <p className="text-xs text-graphite-soft">AI Health Concierge</p>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-graphite-soft cursor-pointer select-none">
              <input
                type="checkbox"
                checked={voiceMode}
                onChange={(e) => {
                  setVoiceMode(e.target.checked);
                  if (!e.target.checked) tts.cancel();
                }}
                disabled={!tts.supported}
                className="accent-aqua"
              />
              <span>Read replies</span>
            </label>

            <button
              onClick={newConversation}
              className="text-xs text-graphite-soft hover:text-graphite transition-colors px-2 py-1 rounded border border-border hover:border-graphite-soft shrink-0"
            >
              + New
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-bg">
            {loadingHistory ? (
              <div className="flex justify-center pt-16">
                <Spinner size="md" />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-midnight text-white rounded-tr-sm"
                          : "bg-surface text-graphite border border-border rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                      {msg.protocolTriggered && (
                        <p className="text-xs mt-2 opacity-80 text-aqua">
                          ✓ Protocol updated — check your Dashboard
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-graphite-soft rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-graphite-soft rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-graphite-soft rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                {speech.error && (
                  <p className="text-xs text-signal-red text-center">
                    Voice error: {speech.error}
                  </p>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border px-6 py-4 bg-surface">
            <div className="flex gap-3 items-end max-w-3xl mx-auto">
              <VoiceOrb
                state={voiceState}
                onClick={toggleListen}
                disabled={!speech.supported || sending}
                size={48}
              />
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  speech.listening
                    ? "Listening…"
                    : "Ask Jeffrey anything about your health…"
                }
                rows={1}
                aria-label="Message Jeffrey"
                className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-graphite placeholder-graphite-soft resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua focus-visible:border-transparent"
                style={{ maxHeight: "120px" }}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending}
                className="shrink-0"
              >
                Send
              </Button>
            </div>
            <p className="text-xs text-center text-graphite-soft mt-2">
              {!speech.supported
                ? "Voice input requires Chrome or Edge. "
                : ""}
              Not medical advice. Consult your physician before making changes.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

export default function ChatPageWrapper() {
  return (
    <AuthProvider>
      <ChatPage />
    </AuthProvider>
  );
}
