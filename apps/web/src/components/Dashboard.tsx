import React from "react";

export function Dashboard() {
  const biomarkers = [
    { label: "LDL", value: 172, unit: "mg/dL" },
    { label: "HRV", value: 42, unit: "ms" },
    { label: "Vitamin D", value: 24, unit: "ng/mL" },
  ];

  return (
    <div>
      <h1>Aissisted Dashboard</h1>
      <p>Your personalized health operating system.</p>
      <ul>
        {biomarkers.map((item) => (
          <li key={item.label}>
            {item.label}: {item.value} {item.unit}
          </li>
        ))}
      </ul>
    </div>
  );
}
