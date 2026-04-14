// ─── Enums ───────────────────────────────────────────────

export type Sex = "male" | "female" | "other";
export type Role = "user" | "assistant" | "system";
export type WearableSource = "whoop" | "oura" | "apple_health";

// ─── Domain Models ───────────────────────────────────────

export interface HealthProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  sex?: Sex;
  goals: string[];
  conditions: string[];
  medications: string[];
  supplements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BiomarkerReading {
  id: string;
  userId: string;
  name: string;
  value: number;
  unit: string;
  measuredAt: string;
  source?: string;
}

export interface WearableSample {
  id: string;
  userId: string;
  source: WearableSource;
  metric: string;
  value: number;
  measuredAt: string;
}

export interface SupplementRecommendation {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  rationale: string;
  score: number;
}

export interface ProtocolRecommendation {
  id: string;
  userId: string;
  summary: string;
  warnings: string[];
  recommendations: SupplementRecommendation[];
  createdAt: string;
}

export interface SupplementStack {
  id: string;
  userId: string;
  name: string;
  items: SupplementRecommendation[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthPayload {
  user: User;
  token: string;
}

// ─── Conversations (Jeffrey) ─────────────────────────────

export interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  intent?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// ─── API ─────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    message: string;
    code: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ─── Audit ───────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}
