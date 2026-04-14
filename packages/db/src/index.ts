import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

const dbUrl = process.env.DATABASE_URL ?? "file:./data/aissisted.db";

export const db = drizzle(dbUrl, { schema });

export { schema };
export * from "drizzle-orm";
