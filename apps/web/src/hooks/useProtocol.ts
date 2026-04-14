import { useState } from "react";
import { fetchProtocol, ProtocolResponse } from "../lib/api";

export function useProtocol() {
  const [data, setData] = useState<ProtocolResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runProtocol(input: any) {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchProtocol(input);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, runProtocol };
}
