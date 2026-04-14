import React, { useState } from "react";

export function JeffreyChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const sendMessage = () => {
    if (!input) return;
    setMessages([...messages, `You: ${input}`, "Jeffrey: Processing..."]);
    setInput("");
  };

  return (
    <div>
      <h2>Jeffrey</h2>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
