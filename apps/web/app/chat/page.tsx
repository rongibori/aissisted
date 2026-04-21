"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth-context";
import { AuthProvider } from "../../lib/auth-context";
import { Nav } from "../../components/nav";
import { chat as chatApi } from "../../lib/api";
import { Button, Spinner } from "../../components/ui";

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

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "I'm Jeffrey, your concierge. I read your biomarkers, labs, and daily signals — then build a protocol that's yours alone. Where should we start?",
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
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversationList = useCallback(async () => {
    try {
      const data = await chatApi.conversations();
      setConversations(data.conversations);
    } catch {
      // non-critical
    }
  }, []);

  // Restore last conversation from server
  useEffect(() => {
    if (loading || !user) return;
    Promise.all([
      chatApi.recent().then((data) => {
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
      }).catch(() => {}),
      loadConversationList(),
    ]).finally(() => setRestoring(false));
  }, [user, loading, loadConversationList]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
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
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.reply,
          protocolTriggered: result.protocolTriggered,
        },
      ]);
      // Refresh conversation list after sending (title may have been set)
      loadConversationList();
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
  };

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
      send();
    }
  };

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
        {/* Conversation history sidebar */}
        <div
          className={`flex-shrink-0 bg-surface-2 border-r border-line flex flex-col transition-all duration-200 overflow-hidden ${
            sidebarOpen ? "w-64" : "w-0"
          }`}
        >
          <div className="p-3 border-b border-line flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              History
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-muted hover:text-ink text-sm"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <button
              onClick={newConversation}
              className="w-full text-left px-3 py-2 text-xs text-signal hover:bg-surface-2 transition-colors"
            >
              + New conversation
            </button>
            {conversations.length === 0 ? (
              <p className="text-xs text-soft px-3 py-2">No past conversations</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`w-full text-left px-3 py-2.5 transition-colors hover:bg-line ${
                    conv.id === conversationId ? "bg-line-strong" : ""
                  }`}
                >
                  <p className={`text-xs font-medium truncate ${
                    conv.id === conversationId ? "text-ink" : "text-muted"
                  }`}>
                    {conv.title ?? "Untitled"}
                  </p>
                  <p className="text-[10px] text-soft mt-0.5">
                    {formatRelativeTime(conv.updatedAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="border-b border-line px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-muted hover:text-ink transition-colors text-sm px-1"
              title="Conversation history"
            >
              ☰
            </button>
            <div className="w-8 h-8 rounded-full bg-signal flex items-center justify-center text-xs font-bold text-surface shrink-0">
              J
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">Jeffrey</p>
            </div>
            <button
              onClick={newConversation}
              className="text-xs text-muted hover:text-ink transition-colors px-2 py-1 rounded border border-line hover:border-line-strong shrink-0"
            >
              + New
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
                          ? "bg-signal text-surface rounded-tr-sm"
                          : "bg-surface-2 text-ink rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                      {msg.protocolTriggered && (
                        <p className="text-xs mt-2 opacity-70">
                          ✓ Protocol updated — check your Dashboard
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-surface-2 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-line px-6 py-4">
            <div className="flex gap-3 items-end max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Jeffrey anything about your health…"
                rows={1}
                className="flex-1 bg-surface-2 border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-soft resize-none focus:outline-none focus:ring-2 focus:ring-signal focus:border-transparent"
                style={{ maxHeight: "120px" }}
              />
              <Button
                onClick={send}
                disabled={!input.trim() || sending}
                className="shrink-0"
              >
                Send
              </Button>
            </div>
            <p className="text-xs text-center text-muted mt-2">
              Not medical advice. Consult your physician before making changes.
            </p>
          </div>
        </div>
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
