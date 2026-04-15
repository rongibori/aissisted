import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
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

export const biomarkers = sqliteTable(
  "biomarkers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    value: real("value").notNull(),
    unit: text("unit").notNull(),
    // Data provenance: "fhir" | "whoop" | "apple_health" | "manual"
    source: text("source"),
    // Clinical reference range from the source lab or FHIR Observation
    referenceRangeLow: real("reference_range_low"),
    referenceRangeHigh: real("reference_range_high"),
    // Abnormal flag from source lab ("H", "L", "HH", "LL", "A", or null)
    abnormalFlag: text("abnormal_flag"),
    // Confidence score: 1.0=FHIR lab, 0.8=wearable, 0.6=manual
    confidence: real("confidence").notNull().default(1.0),
    // Lab panel this result belongs to (e.g. "CBC", "Lipid Panel")
    labPanelName: text("lab_panel_name"),
    measuredAt: text("measured_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    uniqReading: uniqueIndex("biomarkers_uniq").on(
      t.userId,
      t.name,
      t.measuredAt,
      t.source
    ),
  })
);

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

export const rawFhirResources = sqliteTable(
  "raw_fhir_resources",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // "epic", "cerner", etc.
    resourceType: text("resource_type").notNull(), // "Observation", "DiagnosticReport", etc.
    resourceId: text("resource_id").notNull(), // FHIR resource id
    payload: text("payload").notNull(), // raw JSON
    // SHA-256 hash of payload for dedup across repeated pulls
    payloadHash: text("payload_hash"),
    // Which sync run produced this record
    syncBatchId: text("sync_batch_id"),
    syncedAt: text("synced_at").notNull(),
  },
  (t) => ({
    uniqResource: uniqueIndex("raw_fhir_resources_uniq").on(
      t.userId,
      t.provider,
      t.resourceType,
      t.resourceId
    ),
  })
);

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

export const biomarkerTrends = sqliteTable("biomarker_trends", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  biomarkerName: text("biomarker_name").notNull(),
  // Latest observed value
  latestValue: real("latest_value").notNull(),
  latestUnit: text("latest_unit").notNull(),
  latestMeasuredAt: text("latest_measured_at").notNull(),
  // Earliest reading in the trend window
  firstMeasuredAt: text("first_measured_at"),
  // Number of distinct readings included in computation
  readingCount: integer("reading_count").notNull().default(0),
  // Linear slope: value change per 30 days (positive = rising)
  slope30d: real("slope_30d"),
  // Rolling averages
  rollingAvg7d: real("rolling_avg_7d"),
  rollingAvg30d: real("rolling_avg_30d"),
  rollingAvg90d: real("rolling_avg_90d"),
  // Derived direction relative to reference range
  trendDirection: text("trend_direction", { enum: TREND_DIRECTIONS }).notNull().default("new"),
  // When this record was last recomputed
  computedAt: text("computed_at").notNull(),
});

export const biomarkerTrendsRelations = relations(biomarkerTrends, ({ one }) => ({
  user: one(users, {
    fields: [biomarkerTrends.userId],
    references: [users.id],
  }),
}));

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

export const medications = sqliteTable("medications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // Normalized/canonical name (lowercase, trimmed)
  normalizedName: text("normalized_name").notNull(),
  dosage: text("dosage"),
  frequency: text("frequency"),
  status: text("status", { enum: MEDICATION_STATUSES }).notNull().default("active"),
  // Dates from FHIR MedicationRequest
  startDate: text("start_date"),
  endDate: text("end_date"),
  // Source provenance
  source: text("source", { enum: ["fhir", "manual", "inferred"] }).notNull().default("manual"),
  sourceResourceId: text("source_resource_id"), // FHIR MedicationRequest id
  // Raw FHIR codes for future deduplication
  rxnormCode: text("rxnorm_code"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
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

export const conditions = sqliteTable("conditions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  status: text("status", { enum: CONDITION_STATUSES }).notNull().default("active"),
  onsetDate: text("onset_date"),
  abatementDate: text("abatement_date"),
  // Source
  source: text("source", { enum: ["fhir", "manual", "inferred"] }).notNull().default("manual"),
  sourceResourceId: text("source_resource_id"), // FHIR Condition id
  // Codes
  icd10Code: text("icd10_code"),
  snomedCode: text("snomed_code"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
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

export const syncBatches = sqliteTable("sync_batches", {
  id: text("id").primaryKey(), // UUID, stamped on raw_fhir_resources.syncBatchId
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: text("source", { enum: SYNC_SOURCES }).notNull(),
  status: text("status", { enum: SYNC_STATUSES }).notNull().default("running"),
  // Counts
  resourcesFetched: integer("resources_fetched").notNull().default(0),
  biomarkersInserted: integer("biomarkers_inserted").notNull().default(0),
  // fullHistory = true means backfill, false = incremental
  fullHistory: integer("full_history", { mode: "boolean" }).notNull().default(false),
  errorMessage: text("error_message"),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
});

export const syncBatchesRelations = relations(syncBatches, ({ one }) => ({
  user: one(users, {
    fields: [syncBatches.userId],
    references: [users.id],
  }),
}));
