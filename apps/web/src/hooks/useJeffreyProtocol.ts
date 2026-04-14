import { useState } from "react";
import { fetchProtocol, ProtocolResponse } from "../lib/api";

export interface JeffreyResult {
  reply: string;
  protocol: ProtocolResponse | null;
}

export function useJeffreyProtocol() {
  const [result, setResult] = useState<JeffreyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendToJeffrey(message: string) {
    setLoading(true);
    setError(null);

    try {
      const protocol = await fetchProtocol({
        biomarkers: message.toLowerCase().includes("cholesterol")
          ? [{ code: "LDL", value: 170 }]
          : [{ code: "HRV", value: 35 }],
        symptoms: [message],
      });

      const firstRecommendation = protocol.recommendations[0];
      const reply = firstRecommendation
        ? `Based on what you shared, I recommend ${firstRecommendation.name} at ${firstRecommendation.dosage}. ${firstRecommendation.rationale}`
        : "I need a bit more information to generate a recommendation.";

      const payload = { reply, protocol };
      setResult(payload);
      return payload;
    } catch (err: any) {
      setError(err.message || "Failed to process Jeffrey request");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { result, loading, error, sendToJeffrey };
}
