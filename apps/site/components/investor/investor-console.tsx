"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { transition, usePrefersReducedMotion } from "@/lib/motion";
import {
  JeffreySystem,
  JeffreyText,
  UILabel,
} from "@/components/typography";

/**
 * InvestorConsole — the live Jeffrey surface for /investor-room.
 *
 * Posture:
 *   · Bottom-right persistent dock on desktop; full-width sheet on mobile.
 *   · Cmd+K / Ctrl+K toggles open. Esc closes. ⏎ sends. Shift+⏎ newline.
 *   · Chapter-aware quick-ask chips bridge the deck narrative to Jeffrey.
 *   · Voice output plays through /api/jeffrey/voice/tts when keys are live
 *     (UI stays composed when 503 is returned — "voice pending" state).
 *
 * Data surface:
 *   · All requests hit /api/jeffrey with surface:"investor".
 *   · noopMemoryAdapter server-side: zero PHI, zero cross-session memory.
 *
 * Brand discipline:
 *   · Midnight surface. Aqua signal. No red in the console.
 *   · Plex Sans prose (JeffreyText). Plex Mono system affordances.
 *   · Transitions 240–360ms, reduced-motion aware.
 */

type Role = "user" | "jeffrey";

type Message = {
  id: string;
  role: Role;
  text: string;
  pending?: boolean;
};

type QuickAsk = {
  id: string;
  label: string;
  question: string;
};

const DEFAULT_QUICK_ASKS: QuickAsk[] = [
  {
    id: "thesis",
    label: "The thesis",
    question:
      "Give me the thesis — why Aissisted is the right bet now, in two minutes.",
  },
  {
    id: "model",
    label: "Business model",
    question:
      "Walk me through the business model. Where does the revenue come from and what does it compound on?",
  },
  {
    id: "unit-economics",
    label: "Unit economics",
    question:
      "What do the unit economics look like — LTV, CAC, payback, margin profile?",
  },
  {
    id: "moat",
    label: "Moat · data flywheel",
    question:
      "Explain the moat. How does the data flywheel compound and why can't Hims or Care/Of catch this?",
  },
  {
    id: "comparables",
    label: "Comparables",
    question:
      "Which comparables should we use to price this? What multiples, and why are they the right analog?",
  },
  {
    id: "projections",
    label: "Projections",
    question:
      "What do the projections look like through Year 3? Walk me through the drivers.",
  },
  {
    id: "product-vision",
    label: "Product vision",
    question:
      "Describe the product vision. What does onboarding feel like, and what does the system do once it knows a person?",
  },
  {
    id: "peptides",
    label: "Peptide roadmap",
    question:
      "What's the peptide expansion roadmap and where does it sit in the business model?",
  },
];

type Props = {
  initialOpen?: boolean;
  quickAsks?: QuickAsk[];
};

export function InvestorConsole({
  initialOpen = false,
  quickAsks = DEFAULT_QUICK_ASKS,
}: Props) {
  const [open, setOpen] = useState(initialOpen);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceReady, setVoiceReady] = useState<boolean | null>(null);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "seed",
      role: "jeffrey",
      text:
        "Good. I'm Jeffrey. I know the house, the numbers, and the roadmap. Ask me anything — thesis, model, moat, comparables, peptide plan. I answer short, honest, and structured.",
    },
  ]);

  const prefersReducedMotion = usePrefersReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice readiness probe.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/jeffrey/voice/tts", { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setVoiceReady(Boolean(data?.configured));
      })
      .catch(() => {
        if (!cancelled) setVoiceReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cmd/Ctrl+K toggles the console.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Open-to-ask affordance from chapter cards.
  useEffect(() => {
    function onOpenEvent(e: Event) {
      const detail = (e as CustomEvent<{ question?: string }>).detail ?? {};
      setOpen(true);
      if (typeof detail.question === "string" && detail.question.trim()) {
        void send(detail.question.trim());
      } else {
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    }
    window.addEventListener("aissisted:ask-jeffrey", onOpenEvent as EventListener);
    return () =>
      window.removeEventListener(
        "aissisted:ask-jeffrey",
        onOpenEvent as EventListener,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoscroll transcript to bottom on new messages.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const playVoice = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      setVoiceError(null);
      setVoicePlaying(true);
      const res = await fetch("/api/jeffrey/voice/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.status === 503) {
        const data = await res.json().catch(() => null);
        setVoiceError(
          data?.error?.message ??
            "Voice not configured. Keys pending.",
        );
        setVoiceReady(false);
        return;
      }
      if (!res.ok) {
        setVoiceError("Voice relay failed.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      audio.src = url;
      audio.onended = () => {
        setVoicePlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setVoicePlaying(false);
        setVoiceError("Voice playback failed.");
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setVoiceError("Voice relay failed.");
      setVoicePlaying(false);
    }
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || sending) return;
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        text,
      };
      const pendingId = `j-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: pendingId, role: "jeffrey", text: "", pending: true },
      ]);
      setInput("");
      setSending(true);
      try {
        const res = await fetch("/api/jeffrey", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: text, surface: "investor" }),
        });
        const data = await res.json().catch(() => null);
        const reply: string =
          typeof data?.reply === "string"
            ? data.reply
            : "Jeffrey couldn't answer that just now. Try again in a moment.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId ? { ...m, text: reply, pending: false } : m,
          ),
        );
        if (voiceReady) {
          void playVoice(reply);
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  ...m,
                  text: "Connection lost. The network didn't answer.",
                  pending: false,
                }
              : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [playVoice, sending, voiceReady],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void send(input);
    },
    [input, send],
  );

  const dockTransition = useMemo(
    () =>
      prefersReducedMotion
        ? undefined
        : transition("transform, opacity", "calm"),
    [prefersReducedMotion],
  );

  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed z-50 flex flex-col items-stretch",
        "right-4 left-4 bottom-4",
        "md:left-auto md:right-6 md:bottom-6 md:w-[28rem]",
      )}
      style={{ transition: dockTransition }}
    >
      {open && (
        <div
          role="dialog"
          aria-label="Jeffrey — investor console"
          className={cn(
            "mb-3 overflow-hidden",
            "bg-[color:var(--brand-midnight)] text-white",
            "ring-1 ring-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]",
            "flex flex-col",
            "max-h-[calc(100vh-7rem)] md:max-h-[36rem]",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  voicePlaying ? "bg-data animate-pulse" : "bg-data",
                )}
              />
              <JeffreySystem className="text-white/60">
                Jeffrey · investor room
              </JeffreySystem>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimize Jeffrey"
              className={cn(
                "h-7 w-7 inline-flex items-center justify-center",
                "text-white/60 hover:text-white transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data",
              )}
            >
              <span aria-hidden className="text-lg leading-none">×</span>
            </button>
          </div>

          {/* Transcript */}
          <div
            ref={scrollRef}
            className={cn(
              "mt-4 px-5 flex-1 overflow-y-auto",
              "scroll-smooth",
              "space-y-4",
            )}
          >
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}
          </div>

          {/* Quick asks */}
          <div className="px-5 pt-4 pb-3 border-t border-white/10 mt-4">
            <UILabel className="text-white/50">Walk me through</UILabel>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickAsks.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => void send(q.question)}
                  disabled={sending}
                  className={cn(
                    "inline-flex items-center px-3 h-8",
                    "font-system text-[11px] uppercase tracking-[0.14em]",
                    "bg-white/5 text-white/80",
                    "ring-1 ring-inset ring-white/10",
                    "hover:bg-white/10 hover:text-white",
                    "disabled:opacity-40 disabled:pointer-events-none",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data",
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={onSubmit}
            className="border-t border-white/10 px-5 py-4 bg-black/20"
          >
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                placeholder="Ask Jeffrey about the business…"
                className={cn(
                  "flex-1 resize-none bg-transparent text-white",
                  "placeholder:text-white/40",
                  "font-body text-[15px] leading-[1.5]",
                  "min-h-[2.25rem] max-h-36",
                  "focus:outline-none",
                )}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send message to Jeffrey"
                className={cn(
                  "shrink-0 inline-flex items-center justify-center",
                  "h-9 px-4",
                  "bg-data text-[color:var(--brand-midnight)]",
                  "font-system text-[11px] font-semibold uppercase tracking-[0.16em]",
                  "hover:brightness-110 transition-[filter]",
                  "disabled:opacity-40 disabled:pointer-events-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                )}
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <JeffreySystem className="text-white/40">
                ⏎ send · shift+⏎ newline · ⌘K toggle
              </JeffreySystem>
              <JeffreySystem className="text-white/40">
                {voiceReady === null
                  ? "voice · probing"
                  : voiceReady
                    ? voicePlaying
                      ? "voice · speaking"
                      : "voice · ready"
                    : "voice · pending keys"}
                {voiceError ? ` · ${voiceError}` : ""}
              </JeffreySystem>
            </div>
          </form>
        </div>
      )}

      {/* Closed pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Minimize Jeffrey" : "Open Jeffrey"}
        className={cn(
          "self-end",
          "inline-flex h-12 items-center gap-3 px-5",
          "bg-[color:var(--brand-midnight)] text-white",
          "ring-1 ring-white/10 shadow-xl",
          "font-system text-xs font-medium uppercase tracking-[0.16em]",
          "hover:brightness-110 transition-[filter]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2",
        )}
      >
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-data"
        />
        {open ? "Jeffrey · open" : "Ask Jeffrey"}
      </button>
    </div>
  );
}

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[88%] px-4 py-3",
          isUser
            ? "bg-white text-[color:var(--brand-midnight)]"
            : "bg-white/5 text-white ring-1 ring-inset ring-white/10",
        )}
      >
        {isUser ? (
          <p className="font-body text-[15px] leading-[1.55]">{message.text}</p>
        ) : message.pending ? (
          <PendingPulse />
        ) : (
          <JeffreyText className="text-white/90">
            <TextWithBreaks text={message.text} />
          </JeffreyText>
        )}
      </div>
    </div>
  );
}

function TextWithBreaks({ text }: { text: string }) {
  const parts = text.split(/\n{2,}/);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} className="block mt-3 first:mt-0 whitespace-pre-wrap">
          {p}
        </span>
      ))}
    </>
  );
}

function PendingPulse() {
  return (
    <div
      aria-label="Jeffrey is composing a reply"
      role="status"
      className="flex items-center gap-1.5 py-1"
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-data/80 animate-pulse" />
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-data/60 animate-pulse"
        style={{ animationDelay: "120ms" }}
      />
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-data/40 animate-pulse"
        style={{ animationDelay: "240ms" }}
      />
    </div>
  );
}
