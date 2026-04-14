import React, { useState } from "react";
import { useSessionHistory } from "../hooks/useSessionHistory";
import { useJeffreyProtocol } from "../hooks/useJeffreyProtocol";

export function IntelligentJeffreyChat() {
  const [input, setInput] = useState("");
  const { messages, addMessage } = useSessionHistory();
  const { sendToJeffrey, loading } = useJeffreyProtocol();

  async function handleSend() {
    if (!input) return;

    addMessage({ role: "user", content: input });

    const result = await sendToJeffrey(input);

    if (result?.reply) {
      addMessage({ role: "assistant", content: result.reply });
    }

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
