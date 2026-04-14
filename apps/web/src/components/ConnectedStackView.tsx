import React from "react";
import { useProtocol } from "../hooks/useProtocol";

export function ConnectedStackView() {
  const { data, loading, error, runProtocol } = useProtocol();

  return (
    <div>
      <h2>Generate Your Stack</h2>

      <button
        onClick={() =>
          runProtocol({
            biomarkers: [{ code: "LDL", value: 180 }],
          })
        }
      >
        Run Protocol
      </button>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      {data && (
        <ul>
          {data.recommendations.map((rec) => (
            <li key={rec.name}>
              {rec.name} - {rec.dosage} ({rec.timing})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
