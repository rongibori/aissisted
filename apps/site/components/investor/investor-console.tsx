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
 * InvestorConsole · v2 — Apple × OpenAI posture.
 *
 * Visual upgrades over v1:
 *   · Glass surface (backdrop-blur on a translucent midnight) with hairline
 *     gradient border so it reads premium against any background.
 *   · Pill toggle becomes a refined rounded-full capsule with a live signal
 *     dot that pulses while voice is speaking.
 *   · Message bubbles tighten radius and shift assistant prose onto a
 *     borderless ground (no chat-room bubbles); user prose sits on a high-
 *     contrast white block, like an Apple Human Interface chat surface.
 *   · Pending state becomes a single shimmer line, not three dots.
 *   · Voice waveform bar visualizes "speaking" state when audio is playing.
 *   · Mobile is a true bottom sheet with a drag-handle motif.
 *
 * Behavior surface preserved:
 *   · POST /api/jeffrey { message, surface: "investor" }
 *   · GET /api/jeffrey/voice/tts → readiness probe
 *   · POST /api/jeffrey/voice/tts → audio/mpeg blob
 *   · Cmd/Ctrl+K toggle, Esc close, ⏎ send, Shift+⏎ newline
 *   · Listens to window CustomEvent `aissisted:ask-jeffrey`
 *
 * Data isolation: noopMemoryAdapter on the server. No PHI, no userId.
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
    label: "Thesis",
    question:
      "Give me the thesis in two minutes — the shift, the wedge, and why now.",
  },
  {
    id: "model",
    label: "Model",
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
    label: "Moat",
    question:
      "Explain the moat. How does the data flywheel compound and why can't a category brand catch this?",
  },
  {
    id: "comparables",
    label: "Comparables",
    question:
      "Which comparables should we use to price this, and why are they the right analog?",
  },
  {
    id: "projections",
    label: "Projections",
    question:
      "What do the projections look like through Year 3? Walk me through the drivers.",
  },
  {
    id: "product-vision",
    label: "Product",
    question:
      "Describe the product. What does Day 00 feel like, and what does the system do once it knows a person?",
  },
  {
    id: "peptides",
    label: "Peptides",
    question:
      "What is the peptide expansion roadmap and how does it fit the model?",
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
        "Good. I'm Jeffrey. Ask me anything — thesis, model, moat, comparables, peptide plan. Short, honest, structured.",
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
          data?.error?.message ?? "Voice not configured. Keys pending.",
        );
        setVoiceReady(false);
        setVoicePlaying(false);
        return;
      }
      if (!res.ok) {
        setVoiceError("Voice relay failed.");
        setVoicePlaying(false);
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
        "fixed z-[60] flex flex-col items-stretch",
        "right-3 left-3 bottom-3",
        "md:left-auto md:right-6 md:bottom-6 md:w-[30rem]",
      )}
      style={{ transition: dockTransition }}
    >
      {open && (
        <div
          role="dialog"
          aria-label="Jeffrey — investor console"
          className={cn(
            "relative mb-3 overflow-hidden",
            "rounded-2xl",
            "bg-[color:var(--brand-midnight)]/85 text-white",
            "backdrop-blur-2xl backdrop-saturate-150",
            "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)]",
            "flex flex-col",
            "max-h-[calc(100dvh-6rem)] md:max-h-[40rem]",
            "motion-safe:animate-[consoleIn_320ms_cubic-bezier(0.2,0,0,1)]",
          )}
        >
          {/* Hairline gradient border */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-2xl",
              "bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0)_30%,rgba(0,194,209,0.10)_70%,rgba(255,255,255,0))]",
              "[mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)]",
              "[mask-composite:exclude] [-webkit-mask-composite:xor]",
              "p-px",
            )}
          />

          {/* Mobile drag handle motif */}
          <div className="md:hidden flex items-center justify-center pt-2">
            <span aria-hidden className="block h-1 w-10 rounded-full bg-white/15" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 md:pt-5">
            <div className="flex items-center gap-3">
              <SignalDot speaking={voicePlaying} />
              <div className="flex flex-col leading-tight">
                <UILabel className="text-white/80 normal-case tracking-[0.06em] text-[10.5px]">
                  Jeffrey
                </UILabel>
                <JeffreySystem className="text-white/45 text-[10px]">
                  investor room · live
                </JeffreySystem>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <VoiceWave active={voicePlaying} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimize Jeffrey"
                className={cn(
                  "h-8 w-8 inline-flex items-center justify-center rounded-full",
                  "text-white/60 hover:text-white hover:bg-white/5 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data",
                )}
              >
                <span aria-hidden className="text-lg leading-none">×</span>
              </button>
            </div>
          </div>

          {/* Transcript */}
          <div
            ref={scrollRef}
            className={cn(
              "mt-3 px-5 flex-1 overflow-y-auto",
              "scroll-smooth space-y-5",
            )}
          >
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}
          </div>

          {/* Quick asks */}
          <div className="px-5 pt-4 pb-3 mt-3 border-t border-white/[0.06]">
            <UILabel className="text-white/40 text-[10px] tracking-[0.16em]">
              Walk me through
            </UILabel>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {quickAsks.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => void send(q.question)}
                  disabled={sending}
                  className={cn(
                    "inline-flex items-center px-3 h-7 rounded-full",
                    "font-system text-[10.5px] uppercase tracking-[0.14em]",
                    "bg-white/[0.04] text-white/75",
                    "ring-1 ring-inset ring-white/10",
                    "hover:bg-white/[0.08] hover:text-white",
                    "disabled:opacity-40 disabled:pointer-events-none",
                    "transition-[background,color]",
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
            className="border-t border-white/[0.06] px-4 py-3 bg-black/15"
          >
            <div
              className={cn(
                "flex items-end gap-2 rounded-xl px-3 py-2",
                "bg-white/[0.04] ring-1 ring-inset ring-white/10",
                "focus-within:ring-data/60 transition-shadow",
              )}
            >
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
                placeholder="Ask Jeffrey…"
                className={cn(
                  "flex-1 resize-none bg-transparent text-white",
                  "placeholder:text-white/40",
                  "font-body text-[15px] leading-[1.5]",
                  "min-h-[1.75rem] max-h-32",
                  "focus:outline-none",
                )}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send message to Jeffrey"
                className={cn(
                  "shrink-0 inline-flex items-center justify-center",
                  "h-8 w-8 rounded-full",
                  "bg-data text-[color:var(--brand-midnight)]",
                  "hover:brightness-110 transition-[filter,transform]",
                  "active:scale-95",
                  "disabled:opacity-40 disabled:pointer-events-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                )}
              >
                <ArrowUp />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <JeffreySystem className="text-white/35 text-[10px]">
                ⏎ send · ⇧⏎ newline · ⌘K toggle
              </JeffreySystem>
              <JeffreySystem className="text-white/35 text-[10px]">
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

      {/* Closed pill — refined */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Minimize Jeffrey" : "Open Jeffrey"}
        className={cn(
          "self-end group",
          "inline-flex h-12 items-center gap-3 pl-4 pr-5 rounded-full",
          "bg-[color:var(--brand-midnight)]/95 text-white",
          "backdrop-blur-xl",
          "shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)]",
          "font-system text-[11px] font-medium uppercase tracking-[0.16em]",
          "hover:brightness-110 transition-[filter,transform]",
          "active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2",
        )}
      >
        <SignalDot speaking={voicePlaying} />
        <span className="hidden sm:inline">{open ? "Jeffrey · open" : "Ask Jeffrey"}</span>
        <span className="sm:hidden">Jeffrey</span>
        <span aria-hidden className="text-white/40 text-[10px] tracking-[0.18em] hidden md:inline">
          ⌘K
        </span>
      </button>

      {/* Local keyframes — scoped to this component. */}
      <style jsx>{`
        @keyframes consoleIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────

function SignalDot({ speaking }: { speaking: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2 items-center justify-center">
      <span
        aria-hidden
        className={cn(
          "absolute inline-flex h-full w-full rounded-full bg-data",
          speaking ? "opacity-100 motion-safe:animate-ping" : "opacity-0",
        )}
      />
      <span
        aria-hidden
        className={cn("relative inline-flex h-1.5 w-1.5 rounded-full bg-data")}
      />
    </span>
  );
}

function VoiceWave({ active }: { active: boolean }) {
  // Five bars; static sine line when idle, animated heights when active.
  const bars = [3, 6, 9, 6, 3];
  return (
    <span
      aria-hidden
      className={cn(
        "mr-1 inline-flex items-end gap-0.5 h-5 px-1",
        "transition-opacity duration-200",
        active ? "opacity-100" : "opacity-30",
      )}
    >
      {bars.map((base, i) => (
        <span
          key={i}
          className={cn(
            "block w-[2px] rounded-full bg-data",
            active ? "motion-safe:animate-[wave_1100ms_ease-in-out_infinite]" : "",
          )}
          style={{
            height: `${base}px`,
            animationDelay: `${i * 90}ms`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50%      { transform: scaleY(1.6); }
        }
      `}</style>
    </span>
  );
}

function ArrowUp() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7 11.5V2.5M7 2.5L3 6.5M7 2.5L11 6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          isUser
            ? "max-w-[88%] px-4 py-2.5 rounded-2xl rounded-br-md bg-white text-[color:var(--brand-midnight)]"
            : "max-w-[92%] py-1 text-white",
        )}
      >
        {isUser ? (
          <p className="font-body text-[15px] leading-[1.5]">{message.text}</p>
        ) : message.pending ? (
          <Shimmer />
        ) : (
          <JeffreyText className="text-white/90 text-[15px] leading-[1.65]">
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

function Shimmer() {
  return (
    <div
      role="status"
      aria-label="Jeffrey is composing a reply"
      className="py-1 max-w-xs"
    >
      <span
        className={cn(
          "block h-3 w-48 rounded",
          "bg-[linear-gradient(90deg,rgba(255,255,255,0.05),rgba(0,194,209,0.35),rgba(255,255,255,0.05))]",
          "bg-[length:200%_100%]",
          "motion-safe:animate-[shimmer_1600ms_linear_infinite]",
        )}
      />
      <span
        className={cn(
          "mt-2 block h-3 w-32 rounded",
          "bg-[linear-gradient(90deg,rgba(255,255,255,0.05),rgba(0,194,209,0.25),rgba(255,255,255,0.05))]",
          "bg-[length:200%_100%]",
          "motion-safe:animate-[shimmer_1600ms_linear_infinite]",
        )}
        style={{ animationDelay: "200ms" }}
      />
    </div>
  );
}
