/**
 * Run pending Drizzle migrations against PostgreSQL.
 *
 * Usage:
 *   pnpm --filter @aissisted/db db:migrate
 */

import { migrate } from "drizzle-orm/node-postgres/migrator";
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
  if (err?.code === "ENOENT" || err?.message?.includes("ENOENT")) {
    console.warn(
      "No migrations folder found — run `pnpm --filter @aissisted/db db:generate` first."
    );
  } else {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}
