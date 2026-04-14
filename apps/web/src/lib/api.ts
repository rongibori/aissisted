export interface ProtocolRecommendation {
  name: string;
  dosage: string;
  timing: string;
  rationale: string;
}

export interface ProtocolResponse {
  recommendations: ProtocolRecommendation[];
  notes?: string[];
  warnings?: string[];
}

export async function fetchProtocol(input: { biomarkers?: Array<{ code: string; value: number }>; symptoms?: string[]; goals?: string[]; }) {
  const response = await fetch("http://localhost:4000/protocol", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch protocol");
  }

  return (await response.json()) as ProtocolResponse;
}
