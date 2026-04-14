import { randomUUID } from "crypto";
import { db, schema, eq, desc } from "@aissisted/db";

export async function getOrCreateConversation(
  userId: string,
  conversationId?: string
) {
  if (conversationId) {
    const existing = await db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, conversationId))
      .get();
    if (existing) return existing;
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  await db.insert(schema.conversations).values({
    id,
    userId,
    createdAt: now,
    updatedAt: now,
  });

  return { id, userId, title: null, createdAt: now, updatedAt: now };
}

export async function getConversationHistory(
  conversationId: string,
  limit = 20
) {
  return db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(desc(schema.messages.createdAt))
    .limit(limit)
    .then((rows) => rows.reverse()); // chronological order
}

export async function addMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  intent?: string,
  metadata?: Record<string, unknown>
) {
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(schema.messages).values({
    id,
    conversationId,
    role,
    content,
    intent,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: now,
  });

  // Update conversation updatedAt
  await db
    .update(schema.conversations)
    .set({ updatedAt: now })
    .where(eq(schema.conversations.id, conversationId));

  return { id, conversationId, role, content, intent, createdAt: now };
}

export async function getUserConversations(userId: string) {
  return db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.userId, userId))
    .orderBy(desc(schema.conversations.updatedAt))
    .limit(20);
}
