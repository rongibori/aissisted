import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "fs";
import { dirname } from "path";
import * as schema from "./schema.js";

const dbUrl = process.env.DATABASE_URL ?? "file:./data/aissisted.db";

// Ensure the data directory exists for local SQLite files
if (dbUrl.startsWith("file:")) {
  const filePath = dbUrl.replace("file:", "");
  try {
    mkdirSync(dirname(filePath), { recursive: true });
  } catch {
    // Directory already exists
  }
}

const client = createClient({ url: dbUrl });
export const db = drizzle(client, { schema });

export { schema };
export * from "drizzle-orm";
export { migrate } from "drizzle-orm/libsql/migrator";
