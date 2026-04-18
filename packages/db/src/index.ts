import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL ?? "postgresql://aissisted:aissisted@localhost:5432/aissisted";

const pool = new pg.Pool({
  connectionString,
  // Connection pool settings for production
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // SSL for AWS RDS in production
  ...(process.env.NODE_ENV === "production" && {
    ssl: { rejectUnauthorized: true },
  }),
});

export const db = drizzle(pool, { schema });

export { schema };
export * from "drizzle-orm";
export * from "./encryption.js";
