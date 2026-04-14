import React, { useState } from "react";
import { useSessionHistory } from "../hooks/useSessionHistory";
import { useProtocol } from "../hooks/useProtocol";

export function ConnectedJeffreyChat() {
  const [input, setInput] = useState("");
  const { messages, addMessage } = useSessionHistory();
  const { runProtocol, loading } = useProtocol();

  async function handleSend() {
    if (!input) return;

    addMessage({ role: "user", content: input });

    // Simple mapping (Phase 9): treat all queries as protocol triggers
    await runProtocol({
      biomarkers: [{ code: "LDL", value: 170 }],
    });

    addMessage({
      role: "assistant",
      content: "I’ve generated a new protocol based on your input. Check your stack.",
    });

    setInput("");
  }

  return (
    <div>
      <h2>Jeffrey</h2>

      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask Jeffrey anything..."
      />

      <button onClick={handleSend} disabled={loading}>
        {loading ? "Thinking..." : "Send"}
      </button>
    </div>
  );
}
