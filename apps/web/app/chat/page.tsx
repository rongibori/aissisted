"use client";

import React, { useState, useRef, useEffect } from "react";
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

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Jeffrey, your Aissisted health concierge. I can help you understand your biomarkers, build a personalized supplement protocol, and answer health questions. What would you like to explore today?",
};

function ChatPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore last conversation from server
  useEffect(() => {
    if (loading || !user) return;
    chatApi.recent()
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
      .catch(() => {}) // silently fall back to welcome message
      .finally(() => setRestoring(false));
  }, [user, loading]);

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
    } catch (err: any) {
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

  const newConversation = () => {
    setConversationId(undefined);
    setMessages([WELCOME]);
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
      <div className="pt-14 flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-[#2a2a38] px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            J
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#e8e8f0]">Jeffrey</p>
            <p className="text-xs text-[#7a7a98]">AI Health Concierge</p>
          </div>
          <button
            onClick={newConversation}
            className="text-xs text-[#7a7a98] hover:text-[#e8e8f0] transition-colors px-2 py-1 rounded border border-[#2a2a38] hover:border-[#7a7a98]"
            title="Start new conversation"
          >
            + New chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-[#1c1c26] text-[#e8e8f0] rounded-tl-sm"
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
              <div className="bg-[#1c1c26] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#7a7a98] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-[#7a7a98] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[#7a7a98] rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#2a2a38] px-6 py-4">
          <div className="flex gap-3 items-end max-w-3xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Jeffrey anything about your health…"
              rows={1}
              className="flex-1 bg-[#1c1c26] border border-[#2a2a38] rounded-xl px-4 py-3 text-sm text-[#e8e8f0] placeholder-[#7a7a98] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          <p className="text-xs text-center text-[#7a7a98] mt-2">
            Not medical advice. Consult your physician before making changes.
          </p>
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
