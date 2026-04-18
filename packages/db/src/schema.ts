import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  varchar,
  doublePrecision,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────

export const sexEnum = pgEnum("sex", ["male", "female", "other"]);
export const sourceEnum = pgEnum("biomarker_source", [
  "fhir",
  "whoop",
  "apple_health",
  "manual",
]);
export const abnormalFlagEnum = pgEnum("abnormal_flag", ["H", "L", "HH", "LL", "A"]);
export const safetyStatusEnum = pgEnum("safety_status", [
  "allowed",
  "blocked",
  "warning",
]);
export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);
export const providerEnum = pgEnum("integration_provider", [
  "whoop",
  "fhir",
  "apple_health",
]);
export const consentTypeEnum = pgEnum("consent_type", [
  "hipaa_notice",
  "data_processing",
  "fhir_data_access",
  "research_opt_in",
]);
export const signalTypeEnum = pgEnum("signal_type", [
  "deficiency",
  "excess",
  "trend_worsening",
  "trend_improving",
  "trend_stable",
  "data_gap",
  "critical_value",
]);
export const signalDomainEnum = pgEnum("signal_domain", [
  "cardiovascular",
  "metabolic",
  "hormonal",
  "micronutrient",
  "renal",
  "inflammatory",
  "general",
]);
export const severityEnum = pgEnum("severity", ["info", "warn", "critical"]);
export const trendDirectionEnum = pgEnum("trend_direction", [
  "worsening",
  "improving",
  "stable",
  "new",
  "insufficient_data",
]);
export const medicationStatusEnum = pgEnum("medication_status", [
  "active",
  "inactive",
  "stopped",
  "unknown",
]);
export const conditionStatusEnum = pgEnum("condition_status", [
  "active",
  "resolved",
  "inactive",
  "unknown",
]);
export const syncSourceEnum = pgEnum("sync_source", [
  "fhir",
  "whoop",
  "apple_health",
  "manual",
]);
export const syncStatusEnum = pgEnum("sync_status", [
  "running",
  "completed",
  "failed",
  "partial",
]);
export const dataSourceEnum = pgEnum("data_source", [
  "fhir",
  "manual",
  "inferred",
]);
export const timeSlotEnum = pgEnum("time_slot", [
  "morning_fasted",
  "morning_with_food",
  "midday",
  "afternoon",
  "evening",
  "presleep",
]);

// ─── Users ───────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

export const healthProfiles = pgTable("health_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  sex: sexEnum("sex"),
  goals: jsonb("goals").notNull().default("[]"),
  conditions: jsonb("conditions").notNull().default("[]"),
  medications: jsonb("medications").notNull().default("[]"),
  allergies: jsonb("allergies").notNull().default("[]"),
  supplements: jsonb("supplements").notNull().default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

export const biomarkers = pgTable("biomarkers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: doublePrecision("value").notNull(),
  unit: text("unit").notNull(),
  // Data provenance: "fhir" | "whoop" | "apple_health" | "manual"
  source: sourceEnum("source"),
  // Clinical reference range from the source lab or FHIR Observation
  referenceRangeLow: doublePrecision("reference_range_low"),
  referenceRangeHigh: doublePrecision("reference_range_high"),
  // Abnormal flag from source lab ("H", "L", "HH", "LL", "A", or null)
  abnormalFlag: abnormalFlagEnum("abnormal_flag"),
  // Confidence score: 1.0=FHIR lab, 0.8=wearable, 0.6=manual
  confidence: doublePrecision("confidence").notNull().default(1.0),
  // Lab panel this result belongs to (e.g. "CBC", "Lipid Panel")
  labPanelName: text("lab_panel_name"),
  measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const biomarkersRelations = relations(biomarkers, ({ one }) => ({
  user: one(users, {
    fields: [biomarkers.userId],
    references: [users.id],
  }),
}));

// ─── Protocols ───────────────────────────────────────────

export const protocols = pgTable("protocols", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  warnings: jsonb("warnings").notNull().default("[]"),
  signals: jsonb("signals").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

export const recommendations = pgTable("recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  protocolId: uuid("protocol_id")
    .notNull()
    .references(() => protocols.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  timing: text("timing").notNull(),
  // Structured time slot for scheduling — canonical enum value
  timeSlot: timeSlotEnum("time_slot"),
  rationale: text("rationale").notNull(),
  score: doublePrecision("score").notNull().default(0),
  // Safety: explicit status per-item (allowed / blocked / warning)
  safetyStatus: safetyStatusEnum("safety_status").default("allowed"),
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

export const supplementStacks = pgTable("supplement_stacks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  items: jsonb("items").notNull().default("[]"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  intent: text("intent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// ─── Session History (wearable data) ─────────────────────

export const sessionHistory = pgTable("session_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  source: text("source").notNull(),
  metric: text("metric").notNull(),
  value: doublePrecision("value").notNull(),
  measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Integration Tokens ──────────────────────────────────

export const integrationTokens = pgTable("integration_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: providerEnum("provider").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  scope: text("scope"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: uuid("resource_id"),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

export const rawFhirResources = pgTable("raw_fhir_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  payload: jsonb("payload").notNull(),
  // SHA-256 hash of payload for dedup across repeated pulls
  payloadHash: text("payload_hash"),
  // Which sync run produced this record
  syncBatchId: uuid("sync_batch_id"),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
});

export const rawFhirResourcesRelations = relations(
  rawFhirResources,
  ({ one }) => ({
    user: one(users, {
      fields: [rawFhirResources.userId],
      references: [users.id],
    }),
  })
);

// ─── Supplement Adherence Logs ────────────────────────────
// Records each supplement taken (or skipped) for adherence tracking.

export const supplementLogs = pgTable("supplement_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  protocolId: uuid("protocol_id").references(() => protocols.id, {
    onDelete: "set null",
  }),
  recommendationId: uuid("recommendation_id"),
  supplementName: text("supplement_name").notNull(),
  dosage: text("dosage"),
  timeSlot: timeSlotEnum("time_slot"),
  takenAt: timestamp("taken_at", { withTimezone: true }),
  skipped: boolean("skipped").notNull().default(false),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const supplementLogsRelations = relations(supplementLogs, ({ one }) => ({
  user: one(users, {
    fields: [supplementLogs.userId],
    references: [users.id],
  }),
}));

// ─── Consent Records (HIPAA) ─────────────────────────────
// Tracks when and what a user consented to (data processing, HIPAA BAA, etc.)

export const consentRecords = pgTable("consent_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  consentType: consentTypeEnum("consent_type").notNull(),
  version: text("version").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
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

export const healthSignals = pgTable("health_signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  signalType: signalTypeEnum("signal_type").notNull(),
  domain: signalDomainEnum("domain").notNull(),
  biomarkerName: text("biomarker_name"),
  severity: severityEnum("severity").notNull(),
  value: doublePrecision("value"),
  explanation: text("explanation").notNull(),
  sourceIds: jsonb("source_ids"),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

export const healthStateSnapshots = pgTable("health_state_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Primary mode label (dominant health concern or "optimal")
  mode: text("mode").notNull(),
  // 0-1: proportion of key biomarkers present and in range
  confidenceScore: doublePrecision("confidence_score").notNull(),
  // JSON: { cardiovascular: 0.3, metabolic: 0.7, ... } — 0=optimal, 1=severe
  domainScores: jsonb("domain_scores").notNull(),
  // JSON array of active signal keys (e.g. ["ldl_high", "vitamin_d_deficient"])
  activeSignals: jsonb("active_signals").notNull(),
  // JSON array of safety/clinical warnings
  warnings: jsonb("warnings").notNull(),
  // JSON array of missing key lab flags
  missingDataFlags: jsonb("missing_data_flags").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

// ─── Biomarker Trends (Feature Layer) ────────────────────
// Pre-computed per-biomarker trend records: rolling averages, slope,
// trend direction. Upserted after each sync or on-demand re-analysis.
// Provides the Feature Layer that sits between raw biomarker storage
// and the health-state / protocol engines.

export const TREND_DIRECTIONS = [
  "worsening",
  "improving",
  "stable",
  "new",
  "insufficient_data",
] as const;
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];

export const biomarkerTrends = pgTable("biomarker_trends", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  biomarkerName: text("biomarker_name").notNull(),
  // Latest observed value
  latestValue: doublePrecision("latest_value").notNull(),
  latestUnit: text("latest_unit").notNull(),
  latestMeasuredAt: timestamp("latest_measured_at", {
    withTimezone: true,
  }).notNull(),
  // Earliest reading in the trend window
  firstMeasuredAt: timestamp("first_measured_at", { withTimezone: true }),
  // Number of distinct readings included in computation
  readingCount: integer("reading_count").notNull().default(0),
  // Linear slope: value change per 30 days (positive = rising)
  slope30d: doublePrecision("slope_30d"),
  // Rolling averages
  rollingAvg7d: doublePrecision("rolling_avg_7d"),
  rollingAvg30d: doublePrecision("rolling_avg_30d"),
  rollingAvg90d: doublePrecision("rolling_avg_90d"),
  // Derived direction relative to reference range
  trendDirection: trendDirectionEnum("trend_direction")
    .notNull()
    .default("new"),
  // When this record was last recomputed
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull(),
});

export const biomarkerTrendsRelations = relations(
  biomarkerTrends,
  ({ one }) => ({
    user: one(users, {
      fields: [biomarkerTrends.userId],
      references: [users.id],
    }),
  })
);

// ─── Medications (Longitudinal) ───────────────────────────
// Structured medication records derived from FHIR MedicationRequest
// or entered manually. Separate from health_profiles.medications JSON
// so we can track start/end dates, dosage changes, and FHIR provenance.

export const MEDICATION_STATUSES = [
  "active",
  "inactive",
  "stopped",
  "unknown",
] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];

export const medications = pgTable("medications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // Normalized/canonical name (lowercase, trimmed)
  normalizedName: text("normalized_name").notNull(),
  dosage: text("dosage"),
  frequency: text("frequency"),
  status: medicationStatusEnum("status")
    .notNull()
    .default("active"),
  // Dates from FHIR MedicationRequest
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  // Source provenance
  source: dataSourceEnum("source").notNull().default("manual"),
  sourceResourceId: text("source_resource_id"),
  // Raw FHIR codes for future deduplication
  rxnormCode: text("rxnorm_code"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const medicationsRelations = relations(medications, ({ one }) => ({
  user: one(users, {
    fields: [medications.userId],
    references: [users.id],
  }),
}));

// ─── Conditions (Longitudinal) ────────────────────────────
// Structured condition/diagnosis records from FHIR Condition resources
// or entered manually. Tracks onset, abatement, clinical status,
// and ICD/SNOMED codes for downstream safety and protocol logic.

export const CONDITION_STATUSES = [
  "active",
  "resolved",
  "inactive",
  "unknown",
] as const;
export type ConditionStatus = (typeof CONDITION_STATUSES)[number];

export const conditions = pgTable("conditions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  status: conditionStatusEnum("status")
    .notNull()
    .default("active"),
  onsetDate: timestamp("onset_date", { withTimezone: true }),
  abatementDate: timestamp("abatement_date", { withTimezone: true }),
  // Source
  source: dataSourceEnum("source").notNull().default("manual"),
  sourceResourceId: text("source_resource_id"),
  // Codes
  icd10Code: text("icd10_code"),
  snomedCode: text("snomed_code"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const conditionsRelations = relations(conditions, ({ one }) => ({
  user: one(users, {
    fields: [conditions.userId],
    references: [users.id],
  }),
}));

// ─── Sync Batches ─────────────────────────────────────────
// Tracks each FHIR or wearable sync run for auditability,
// reprocessing, and deduplication across pulls.

export const SYNC_SOURCES = ["fhir", "whoop", "apple_health", "manual"] as const;
export type SyncSource = (typeof SYNC_SOURCES)[number];

export const SYNC_STATUSES = ["running", "completed", "failed", "partial"] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const syncBatches = pgTable("sync_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: syncSourceEnum("source").notNull(),
  status: syncStatusEnum("status").notNull().default("running"),
  // Counts
  resourcesFetched: integer("resources_fetched").notNull().default(0),
  biomarkersInserted: integer("biomarkers_inserted").notNull().default(0),
  // fullHistory = true means backfill, false = incremental
  fullHistory: boolean("full_history").notNull().default(false),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const syncBatchesRelations = relations(syncBatches, ({ one }) => ({
  user: one(users, {
    fields: [syncBatches.userId],
    references: [users.id],
  }),
}));
