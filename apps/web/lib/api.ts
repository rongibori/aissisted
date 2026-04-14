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

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  deleteAccount: (password: string) =>
    request<{ message: string }>("/auth/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),
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

  history: (name: string) =>
    request<{ biomarkers: any[] }>(`/biomarkers/history/${encodeURIComponent(name)}`),
};

// ─── Protocol ────────────────────────────────────────────
export const protocol = {
  run: () =>
    request<{ protocol: any }>("/protocol/run", { method: "POST" }),

  latest: () => request<{ protocol: any }>("/protocol/latest"),

  get: (id: string) => request<{ protocol: any }>(`/protocol/${id}`),

  history: () => request<{ protocols: any[] }>("/protocol/history"),
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

// ─── Integrations ────────────────────────────────────────
export const integrations = {
  status: () =>
    request<{ connected: Record<string, { connectedAt: string }> }>(
      "/integrations/status"
    ),

  whoopConnect: () => {
    // Redirects — navigate directly
    window.location.href = `${API_URL}/integrations/whoop/connect`;
  },

  whoopSync: () =>
    request<{ synced: number }>("/integrations/whoop/sync", {
      method: "POST",
    }),

  fhirSync: () =>
    request<{ observations: number; conditionsUpdated: boolean; medicationsUpdated: boolean }>(
      "/integrations/fhir/sync",
      { method: "POST" }
    ),

  appleHealthUpload: (xml: string) =>
    request<{ parsed: number; imported: number }>(
      "/integrations/apple-health/upload",
      { method: "POST", body: JSON.stringify({ xml }) }
    ),

  fhirConnect: () => {
    window.location.href = `${API_URL}/integrations/fhir/connect`;
  },
};

// ─── Health ──────────────────────────────────────────────
export const health = {
  check: () =>
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .catch(() => ({ status: "offline" })),
};

// ─── Adherence ───────────────────────────────────────────
export const adherence = {
  log: (data: {
    supplementName: string;
    dosage?: string;
    timeSlot?: string;
    takenAt?: string;
    skipped?: boolean;
    protocolId?: string;
    recommendationId?: string;
    note?: string;
  }) =>
    request<{ log: any }>("/adherence/log", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  today: () => request<{ logs: any[] }>("/adherence/today"),

  score: (days = 30) =>
    request<{ score: number; taken: number; skipped: number; total: number; periodDays: number }>(
      `/adherence/score?days=${days}`
    ),

  history: () => request<{ logs: any[] }>("/adherence/history"),
};

// ─── Health State ─────────────────────────────────────────
export const healthState = {
  get: (refresh = false) =>
    request<{
      id: string;
      userId: string;
      mode: string;
      confidenceScore: number;
      domainScores: {
        cardiovascular: number;
        metabolic: number;
        hormonal: number;
        micronutrient: number;
        renal: number;
        inflammatory: number;
      };
      activeSignals: Array<{
        key: string;
        domain: string;
        biomarkerName: string;
        signalType: string;
        severity: "info" | "warn" | "critical";
        explanation: string;
        value?: number;
      }>;
      warnings: string[];
      missingDataFlags: string[];
      createdAt: string;
    }>(`/health-state${refresh ? "?refresh=true" : ""}`),

  refresh: () =>
    request<any>("/health-state/refresh", { method: "POST" }),
};
