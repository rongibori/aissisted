const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aissisted_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? "Request failed");
  }

  return json.data as T;
}

// ─── Auth ────────────────────────────────────────────────
export const auth = {
  register: (email: string, password: string) =>
    request<{ user: { id: string; email: string }; token: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  login: (email: string, password: string) =>
    request<{ user: { id: string; email: string }; token: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  me: () =>
    request<{ user: { id: string; email: string } }>("/auth/me"),
};

// ─── Profile ─────────────────────────────────────────────
export const profile = {
  get: () => request<{ profile: any }>("/user/profile"),

  update: (data: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    sex?: string;
    goals?: string[];
    conditions?: string[];
    medications?: string[];
    supplements?: string[];
  }) =>
    request<{ profile: any }>("/user/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ─── Biomarkers ──────────────────────────────────────────
export const biomarkers = {
  add: (data: {
    name: string;
    value: number;
    unit: string;
    source?: string;
    measuredAt: string;
  }) =>
    request<{ biomarker: any }>("/biomarkers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: (options?: { latest?: boolean; name?: string }) => {
    const params = new URLSearchParams();
    if (options?.latest) params.set("latest", "true");
    if (options?.name) params.set("name", options.name);
    return request<{ biomarkers: any[] }>(
      `/biomarkers${params.toString() ? `?${params}` : ""}`
    );
  },
};

// ─── Protocol ────────────────────────────────────────────
export const protocol = {
  run: () =>
    request<{ protocol: any }>("/protocol/run", { method: "POST" }),

  latest: () => request<{ protocol: any }>("/protocol/latest"),

  get: (id: string) => request<{ protocol: any }>(`/protocol/${id}`),
};

// ─── Chat ────────────────────────────────────────────────
export const chat = {
  send: (message: string, conversationId?: string) =>
    request<{
      reply: string;
      conversationId: string;
      intent: string;
      protocolTriggered: boolean;
    }>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversationId }),
    }),

  recent: () =>
    request<{
      conversationId: string | null;
      messages: Array<{
        id: string;
        role: "user" | "assistant" | "system";
        content: string;
        createdAt: string;
      }>;
    }>("/chat/recent"),

  conversations: () =>
    request<{ conversations: any[] }>("/chat/conversations"),
};

// ─── Health ──────────────────────────────────────────────
export const health = {
  check: () =>
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .catch(() => ({ status: "offline" })),
};
