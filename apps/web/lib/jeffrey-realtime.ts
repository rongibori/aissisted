/**
 * Jeffrey Realtime — pure helpers, no React.
 *
 * URL construction, PCM conversion, base64 encode/decode. The React hook
 * (`./hooks/use-jeffrey-realtime.ts`) composes these.
 */

const DEFAULT_API_URL = "http://localhost:4000";

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

/** `http://...` → `ws://...`, `https://...` → `wss://...`. */
export function httpToWs(httpUrl: string): string {
  if (httpUrl.startsWith("https://")) return "wss://" + httpUrl.slice(8);
  if (httpUrl.startsWith("http://")) return "ws://" + httpUrl.slice(7);
  return httpUrl;
}

export function getApiWsUrl(): string {
  return httpToWs(getApiUrl());
}

/** Read the aissisted JWT from localStorage. Returns null in SSR. */
export function readAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("aissisted_token");
}

/** Encode a Uint8Array/ArrayBuffer as standard base64 (no URL variant). */
export function bytesToBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < view.length; i += chunkSize) {
    const chunk = view.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  if (typeof btoa === "function") return btoa(binary);
  // Fallback: Node shouldn't execute this path at runtime — the hook is
  // browser-only — but typecheck demands it.
  return Buffer.from(binary, "binary").toString("base64");
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary =
    typeof atob === "function"
      ? atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** int16 little-endian PCM → Float32Array in [-1, 1]. */
export function int16LEToFloat32(bytes: Uint8Array): Float32Array {
  const samples = Math.floor(bytes.byteLength / 2);
  const out = new Float32Array(samples);
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  for (let i = 0; i < samples; i++) {
    const s = view.getInt16(i * 2, true);
    out[i] = s / (s < 0 ? 0x8000 : 0x7fff);
  }
  return out;
}

/**
 * POST the realtime ticket request to apps/api.
 * Returns the ticket JWT the caller embeds in the WS query string.
 */
export async function requestRealtimeTicket(
  surface: "concierge" | "onboarding",
  options?: { apiUrl?: string; token?: string | null },
): Promise<{ ticket: string; expiresInSeconds: number }> {
  const apiUrl = options?.apiUrl ?? getApiUrl();
  const token = options?.token ?? readAuthToken();
  if (!token) {
    throw new Error("Not authenticated — cannot mint realtime ticket.");
  }

  const res = await fetch(`${apiUrl}/v1/jeffrey/realtime/ticket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ surface }),
  });

  const json = (await res.json()) as {
    data?: { ticket: string; expiresInSeconds: number; surface: string };
    error?: { message?: string; code?: string };
  };

  if (!res.ok || !json.data) {
    const msg = json.error?.message ?? "Ticket request failed";
    throw new Error(msg);
  }

  return {
    ticket: json.data.ticket,
    expiresInSeconds: json.data.expiresInSeconds,
  };
}
