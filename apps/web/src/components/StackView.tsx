import React from "react";

export function StackView() {
  const stack = [
    { name: "Omega-3", timing: "morning" },
    { name: "Vitamin D3", timing: "morning" },
    { name: "Magnesium Glycinate", timing: "evening" },
  ];

  return (
    <div>
      <h2>Your Daily Stack</h2>
      <ul>
        {stack.map((item) => (
          <li key={item.name}>
            {item.name} ({item.timing})
          </li>
        ))}
      </ul>
    </div>
  );
}
