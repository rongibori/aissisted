/**
 * Run pending Drizzle migrations.
 *
 * For local SQLite the drizzle-kit `push` command applies schema changes
 * without needing migration files. For production (Turso / libsql remote)
 * use `drizzle-kit migrate` after generating migration files with
 * `drizzle-kit generate`.
 *
 * Usage:
 *   pnpm --filter @aissisted/db db:migrate
 *   node --loader tsx packages/db/src/migrate.ts
 */

import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index.js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, "../drizzle");

console.log(`Running migrations from: ${migrationsFolder}`);

try {
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully.");
} catch (err: any) {
  // If the drizzle folder doesn't exist yet (no migrations generated), skip.
  if (err?.code === "ENOENT" || err?.message?.includes("ENOENT")) {
    console.warn(
      "No migrations folder found — run `pnpm --filter @aissisted/db db:generate` first."
    );
  } else {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}
