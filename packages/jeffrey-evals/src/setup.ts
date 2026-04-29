/**
 * @aissisted/jeffrey-evals — Setup
 *
 * Spins up an isolated test environment for a run.
 * Default: in-memory SQLite via Drizzle (matches .env.example dev default).
 * Production-like: Postgres testcontainer with pgvector extension.
 *
 * Switch via EVAL_DB env var: 'sqlite' (default) | 'postgres'
 */

import type { SyntheticPersona } from './types.js';

// TODO(integration): import the actual Drizzle client and migration runner from
// the @aissisted/db workspace package. Pseudocode below shows shape only.

interface TestEnv {
  dbUrl: string;
  cleanup: () => Promise<void>;
}

let env: TestEnv | null = null;

export async function setupTestEnv(): Promise<void> {
  const mode = process.env.EVAL_DB ?? 'sqlite';
  if (mode === 'sqlite') {
    env = await setupSqlite();
  } else if (mode === 'postgres') {
    env = await setupPostgres();
  } else {
    throw new Error(`Unknown EVAL_DB mode: ${mode}`);
  }
  await runMigrations(env.dbUrl);
}

export async function teardownTestEnv(): Promise<void> {
  if (env) {
    await env.cleanup();
    env = null;
  }
}

export async function seedPersona(persona: SyntheticPersona): Promise<void> {
  // TODO(integration):
  // 1. Insert user row from persona.user
  // 2. Insert health_profile from persona.healthProfile
  // 3. Insert lab_panels and biomarker rows from persona.labHistory
  // 4. Insert wearable_connections + synthesized daily data
  // 5. Insert adherence_log rows
  // 6. Insert protocol + protocol_ingredients (current + history)
  // 7. Insert prior conversations + transcripts
  // 8. Insert memory items + generate embeddings via OpenAI text-embedding-3-small
  // 9. Insert into pgvector index (when EVAL_DB=postgres)
  void persona;
}

export async function clearPersona(personaUserId: string): Promise<void> {
  // TODO(integration): cascade-delete all rows for this user across all tables.
  void personaUserId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

async function setupSqlite(): Promise<TestEnv> {
  // TODO(integration): use better-sqlite3 in-memory or a temp file
  const dbUrl = `file::memory:?cache=shared`;
  return {
    dbUrl,
    cleanup: async () => {
      /* in-memory cleans up automatically */
    },
  };
}

async function setupPostgres(): Promise<TestEnv> {
  // TODO(integration): boot a testcontainers Postgres with pgvector
  // Returns connection URL + cleanup that stops the container
  throw new Error('Postgres test container not yet implemented — see README');
}

async function runMigrations(dbUrl: string): Promise<void> {
  // TODO(integration): import drizzle migrate runner from @aissisted/db
  // For pgvector: ensure CREATE EXTENSION IF NOT EXISTS vector ran first.
  void dbUrl;
}
