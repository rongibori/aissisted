import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── Users ───────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(healthProfiles),
  biomarkers: many(biomarkers),
  protocols: many(protocols),
  stacks: many(supplementStacks),
  conversations: many(conversations),
  auditLogs: many(auditLog),
}));

// ─── Health Profiles ─────────────────────────────────────

export const healthProfiles = sqliteTable("health_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  sex: text("sex", { enum: ["male", "female", "other"] }),
  goals: text("goals").notNull().default("[]"), // JSON array
  conditions: text("conditions").notNull().default("[]"),
  medications: text("medications").notNull().default("[]"),
  allergies: text("allergies").notNull().default("[]"),
  supplements: text("supplements").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const healthProfilesRelations = relations(
  healthProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [healthProfiles.userId],
      references: [users.id],
    }),
  })
);

// ─── Biomarkers ──────────────────────────────────────────

export const biomarkers = sqliteTable("biomarkers", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  source: text("source"),
  // Clinical reference range from the source lab or FHIR Observation
  referenceRangeLow: real("reference_range_low"),
  referenceRangeHigh: real("reference_range_high"),
  // Lab panel this result belongs to (e.g. "CBC", "Lipid Panel")
  labPanelName: text("lab_panel_name"),
  measuredAt: text("measured_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const biomarkersRelations = relations(biomarkers, ({ one }) => ({
  user: one(users, {
    fields: [biomarkers.userId],
    references: [users.id],
  }),
}));

// ─── Protocols ───────────────────────────────────────────

export const protocols = sqliteTable("protocols", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  warnings: text("warnings").notNull().default("[]"), // JSON array
  signals: text("signals").notNull().default("{}"), // JSON object
  createdAt: text("created_at").notNull(),
});

export const protocolsRelations = relations(protocols, ({ one, many }) => ({
  user: one(users, {
    fields: [protocols.userId],
    references: [users.id],
  }),
  recommendations: many(recommendations),
}));

export const TIME_SLOTS = [
  "morning_fasted",
  "morning_with_food",
  "midday",
  "afternoon",
  "evening",
  "presleep",
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export const recommendations = sqliteTable("recommendations", {
  id: text("id").primaryKey(),
  protocolId: text("protocol_id")
    .notNull()
    .references(() => protocols.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  timing: text("timing").notNull(),
  // Structured time slot for scheduling — canonical enum value
  timeSlot: text("time_slot", { enum: TIME_SLOTS }),
  rationale: text("rationale").notNull(),
  score: real("score").notNull().default(0),
  // Safety: explicit status per-item (allowed / blocked / warning)
  safetyStatus: text("safety_status", { enum: ["allowed", "blocked", "warning"] }).default("allowed"),
  safetyNote: text("safety_note"),
});

export const recommendationsRelations = relations(
  recommendations,
  ({ one }) => ({
    protocol: one(protocols, {
      fields: [recommendations.protocolId],
      references: [protocols.id],
    }),
  })
);

// ─── Supplement Stacks ───────────────────────────────────

export const supplementStacks = sqliteTable("supplement_stacks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  items: text("items").notNull().default("[]"), // JSON array
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const supplementStacksRelations = relations(
  supplementStacks,
  ({ one }) => ({
    user: one(users, {
      fields: [supplementStacks.userId],
      references: [users.id],
    }),
  })
);

// ─── Conversations (Jeffrey) ─────────────────────────────

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [conversations.userId],
      references: [users.id],
    }),
    messages: many(messages),
  })
);

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  intent: text("intent"),
  metadata: text("metadata"), // JSON
  createdAt: text("created_at").notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// ─── Session History (wearable data) ─────────────────────

export const sessionHistory = sqliteTable("session_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  source: text("source").notNull(),
  metric: text("metric").notNull(),
  value: real("value").notNull(),
  measuredAt: text("measured_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// ─── Integration Tokens ──────────────────────────────────

export const integrationTokens = sqliteTable("integration_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", {
    enum: ["whoop", "fhir", "apple_health"],
  }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: text("expires_at"),
  scope: text("scope"),
  metadata: text("metadata"), // JSON for provider-specific data
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const integrationTokensRelations = relations(
  integrationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [integrationTokens.userId],
      references: [users.id],
    }),
  })
);

// ─── Audit Log ───────────────────────────────────────────

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  detail: text("detail"), // JSON
  createdAt: text("created_at").notNull(),
});

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

// ─── Raw FHIR Resources (immutable compliance layer) ─────
// Stores the original JSON payloads exactly as received from Epic/FHIR.
// Never modified — append-only. Used for audit, re-processing, and debugging.

export const rawFhirResources = sqliteTable("raw_fhir_resources", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // "epic", "cerner", etc.
  resourceType: text("resource_type").notNull(), // "Observation", "DiagnosticReport", etc.
  resourceId: text("resource_id").notNull(), // FHIR resource id
  payload: text("payload").notNull(), // raw JSON
  syncedAt: text("synced_at").notNull(),
});

export const rawFhirResourcesRelations = relations(rawFhirResources, ({ one }) => ({
  user: one(users, {
    fields: [rawFhirResources.userId],
    references: [users.id],
  }),
}));

// ─── Supplement Adherence Logs ────────────────────────────
// Records each supplement taken (or skipped) for adherence tracking.

export const supplementLogs = sqliteTable("supplement_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  protocolId: text("protocol_id").references(() => protocols.id, { onDelete: "set null" }),
  recommendationId: text("recommendation_id"),
  supplementName: text("supplement_name").notNull(),
  dosage: text("dosage"),
  timeSlot: text("time_slot", { enum: TIME_SLOTS }),
  takenAt: text("taken_at"), // null = skipped
  skipped: integer("skipped", { mode: "boolean" }).notNull().default(false),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const supplementLogsRelations = relations(supplementLogs, ({ one }) => ({
  user: one(users, {
    fields: [supplementLogs.userId],
    references: [users.id],
  }),
}));

// ─── Consent Records (HIPAA) ─────────────────────────────
// Tracks when and what a user consented to (data processing, HIPAA BAA, etc.)

export const consentRecords = sqliteTable("consent_records", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  consentType: text("consent_type", {
    enum: ["hipaa_notice", "data_processing", "fhir_data_access", "research_opt_in"],
  }).notNull(),
  version: text("version").notNull(), // e.g. "1.0"
  grantedAt: text("granted_at").notNull(),
  revokedAt: text("revoked_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const consentRecordsRelations = relations(consentRecords, ({ one }) => ({
  user: one(users, {
    fields: [consentRecords.userId],
    references: [users.id],
  }),
}));

// ─── Health Signals ───────────────────────────────────────
// Explicit, versioned signals derived from biomarker analysis.
// Each signal record is immutable (append-only); effective_to is set when superseded.

export const SIGNAL_TYPES = [
  "deficiency",
  "excess",
  "trend_worsening",
  "trend_improving",
  "trend_stable",
  "data_gap",
  "critical_value",
] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export const SIGNAL_DOMAINS = [
  "cardiovascular",
  "metabolic",
  "hormonal",
  "micronutrient",
  "renal",
  "inflammatory",
  "general",
] as const;
export type SignalDomain = (typeof SIGNAL_DOMAINS)[number];

export const healthSignals = sqliteTable("health_signals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  signalType: text("signal_type", { enum: SIGNAL_TYPES }).notNull(),
  domain: text("domain", { enum: SIGNAL_DOMAINS }).notNull(),
  biomarkerName: text("biomarker_name"),
  severity: text("severity", { enum: ["info", "warn", "critical"] }).notNull(),
  value: real("value"),
  explanation: text("explanation").notNull(),
  sourceIds: text("source_ids"), // JSON array of source biomarker row IDs
  effectiveFrom: text("effective_from").notNull(),
  effectiveTo: text("effective_to"), // null = still active
  createdAt: text("created_at").notNull(),
});

export const healthSignalsRelations = relations(healthSignals, ({ one }) => ({
  user: one(users, {
    fields: [healthSignals.userId],
    references: [users.id],
  }),
}));

// ─── Health State Snapshots ───────────────────────────────
// Machine-readable summary of a user's overall health state at a point in time.
// Computed by the analysis engine after each sync or on-demand.

export const healthStateSnapshots = sqliteTable("health_state_snapshots", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Primary mode label (dominant health concern or "optimal")
  mode: text("mode").notNull(),
  // 0-1: proportion of key biomarkers present and in range
  confidenceScore: real("confidence_score").notNull(),
  // JSON: { cardiovascular: 0.3, metabolic: 0.7, ... } — 0=optimal, 1=severe
  domainScores: text("domain_scores").notNull(),
  // JSON array of active signal keys (e.g. ["ldl_high", "vitamin_d_deficient"])
  activeSignals: text("active_signals").notNull(),
  // JSON array of safety/clinical warnings
  warnings: text("warnings").notNull(),
  // JSON array of missing key lab flags
  missingDataFlags: text("missing_data_flags").notNull(),
  createdAt: text("created_at").notNull(),
});

export const healthStateSnapshotsRelations = relations(
  healthStateSnapshots,
  ({ one }) => ({
    user: one(users, {
      fields: [healthStateSnapshots.userId],
      references: [users.id],
    }),
  })
);
