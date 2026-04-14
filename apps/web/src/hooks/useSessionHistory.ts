import { useEffect, useState } from "react";

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "aissisted-session-history";

export function useSessionHistory() {
  const [messages, setMessages] = useState<SessionMessage[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setMessages(JSON.parse(raw));
      } catch {
        setMessages([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  function addMessage(message: SessionMessage) {
    setMessages((prev) => [...prev, message]);
  }

  function clearMessages() {
    setMessages([]);
  }

  return { messages, addMessage, clearMessages };
}
