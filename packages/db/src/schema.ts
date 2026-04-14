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

export const recommendations = sqliteTable("recommendations", {
  id: text("id").primaryKey(),
  protocolId: text("protocol_id")
    .notNull()
    .references(() => protocols.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  timing: text("timing").notNull(),
  rationale: text("rationale").notNull(),
  score: real("score").notNull().default(0),
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
