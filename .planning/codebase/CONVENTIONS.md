# Coding Conventions

**Analysis Date:** 2026-05-04

## Naming Patterns

**Files:**
- Service files: `{entity}.service.ts` — `biomarker.service.ts`, `auth.service.ts`
- Adapter/bridge files: `{feature}.adapter.ts` — `jeffrey-memory.adapter.ts`
- Route handlers: Named after resource — `biomarkers.ts`, `chat.ts`
- Middleware: `{middleware}.ts` in `middleware/` folder
- Utilities: Named by function — `token-encryption.ts`, `retry.ts`
- Tests: Co-located in `__tests__/` subfolder adjacent to source
- Configuration: `config.ts` at module root

**Functions:**
- PascalCase for export functions that define modules/factories: `createJeffreySession()`, `getOpenAIClient()`
- camelCase for utility/helper functions: `validateBiomarkerValue()`, `annotate()`, `parseIntent()`
- Async functions use past-tense or present verbs: `fetchUser()`, `addMessage()`, `verifyCredentials()`, `deleteAccount()`
- Boolean predicates: `is*()` or `has*()` prefix — example: `isCritical` property, `hasLength`

**Variables:**
- camelCase throughout: `userId`, `conversationId`, `protocolTriggered`
- Acronyms remain uppercase in camelCase context: `jwtSecret`, `csvData`, `apiKey`
- SQL snake_case used only in schema definitions: `password_hash`, `created_at`, `user_id`
- Short, descriptive names preferred: `now` for current timestamp, `err` for error in catch blocks, `sub` for JWT subject claim

**Types:**
- PascalCase for all types: `JeffreyChatResult`, `RangeStatus`, `TrendDirection`
- Import types with `type` keyword: `import type { FastifyInstance } from "fastify"`
- Enum-like constants (readonly arrays): UPPER_SNAKE_CASE — `SIGNAL_TYPES`, `TREND_DIRECTIONS`, `TIME_SLOTS`
- Re-export types from domain packages: `export type { RangeStatus }` from `biomarker-ranges.js`

## Code Style

**Formatting:**
- No explicit Prettier or ESLint config detected in root — follows TypeScript defaults
- Two-space indentation (inferred from tsconfig and source)
- Single quotes used in string literals (verified in source)
- Trailing commas in multiline objects/arrays (ES2022 target)

**Linting:**
- TypeScript strict mode enabled in `tsconfig.base.json`: `"strict": true`
- Lint command: `turbo run lint` → runs `tsc --noEmit` per package
- Type-checking is mandatory; no ESLint rules overrides detected

## Import Organization

**Order (observed pattern):**
1. Node.js built-in imports (`crypto`, `path`, `fs`)
2. Third-party framework imports (`fastify`, `drizzle-orm`, `openai`, `bcryptjs`)
3. Third-party plugin/decorator imports (`@fastify/*`, `@libsql/*`)
4. Internal workspace packages (`@aissisted/*`)
5. Relative imports (`./config.js`, `../middleware/auth.js`)

**Example from `apps/api/src/index.ts`:**
```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { config } from "./config.js";
import { registerJwt } from "./middleware/auth.js";
import { db, schema, sql } from "@aissisted/db";
import { migrate } from "drizzle-orm/libsql/migrator";
```

**Path Aliases:**
- No alias configuration in tsconfig — all imports use relative or full workspace package names
- Workspace packages imported as `@aissisted/{package}` — example: `import { db, schema } from "@aissisted/db"`
- ESM module resolution with `.js` extensions required in imports (TypeScript ESM convention)

## Error Handling

**Custom Error Classes:**
Pattern observed in `packages/jeffrey/src/errors.ts` — extend base `JeffreyError`:
```typescript
export class JeffreyError extends Error {
  public readonly code: string;
  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "JeffreyError";
    this.code = code;
  }
}

export class JeffreyConfigError extends JeffreyError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("JEFFREY_CONFIG_ERROR", message, options);
    this.name = "JeffreyConfigError";
  }
}
```

**Service-level Error Pattern:**
Use `Object.assign(new Error(...), { code, status })` to attach metadata to errors:
```typescript
// From apps/api/src/services/auth.service.ts
throw Object.assign(new Error("Email already registered"), {
  code: "EMAIL_TAKEN",
  status: 409,
});
```

**Route Handler Error Handling:**
Try/catch with error introspection — check `err.code` to determine HTTP status and response shape:
```typescript
// From apps/api/src/routes/biomarkers.ts
try {
  const biomarker = await biomarkerService.addBiomarker(sub, body);
  reply.status(201).send({ data: { biomarker } });
} catch (err: any) {
  if (err.code === "INVALID_BIOMARKER_VALUE") {
    return reply.status(400).send({ error: { message: err.message, code: err.code } });
  }
  throw err;
}
```

**Fastify Error Handling:**
Middleware catches errors post-handler. The `requireAuth` middleware throws on JWT failure rather than returning early:
```typescript
// From apps/api/src/middleware/auth.ts
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
  }
}
```

**Response Shape:**
Success: `{ data: T }`
Error: `{ error: { message: string, code: string } }`

## Logging

**Framework:** Fastify built-in logger (Pino)

**Configuration:**
- Dev: `level: "info"` — more verbose
- Prod: `level: "warn"` — less noise
- Set in `apps/api/src/index.ts`: `logger: { level: config.isDev ? "info" : "warn" }`

**Patterns:**
- Access logs via Fastify request logger: `app.log.info()`, `app.log.error()`
- Serializers redact sensitive data (JWT tokens in query strings): `ticket=REDACTED`
- Error logging in catch blocks: `app.log.error(err)` with full error object
- Startup/shutdown logs: `app.log.info()` for operational events

**Example from `apps/api/src/index.ts`:**
```typescript
const app = Fastify({
  logger: {
    level: config.isDev ? "info" : "warn",
    serializers: {
      req(req: { method?: string; url?: string; id?: string; hostname?: string }) {
        const url = typeof req.url === "string"
          ? req.url.replace(/([?&])ticket=[^&]+/g, "$1ticket=REDACTED")
          : req.url;
        return { method: req.method, url, hostname: req.hostname, id: req.id };
      },
    },
  },
});
```

## Comments

**When to Comment:**
- Non-obvious algorithmic choices: see `biomarker.service.ts` with trend calculation logic
- Compliance/security reasoning: "Redact short-lived auth tokens that ride in query strings"
- Module-level JSDoc for public exports (especially in package interfaces)
- Section dividers using ASCII art: `// ─── Users ─────────────────────────────` (see `packages/db/src/schema.ts`)

**JSDoc/TSDoc:**
- Used for function module exports; example in `packages/jeffrey/src/client.ts`:
```typescript
/**
 * OpenAI client factory.
 *
 * Single responsibility: produce a configured OpenAI SDK client using the
 * validated Jeffrey config. Session and bridge modules consume this — they
 * should not instantiate the SDK directly.
 *
 * Server-only. Never bundle into the browser.
 */
```

- TSDoc for complex types with business meaning; example in `packages/db/src/schema.ts`:
```typescript
// Abnormal flag from source lab ("H", "L", "HH", "LL", "A", or null)
abnormalFlag: text("abnormal_flag"),
```

## Function Design

**Size:** Functions 30-100 lines typical; services decompose into smaller helpers (e.g., `annotate()` helper in `biomarker.service.ts`)

**Parameters:**
- Options objects for functions with 3+ parameters: `getBiomarkers(userId, { name?, limit? })`
- Spread destructuring in handlers to extract only what's used: `const { sub } = request.user as { sub: string }`

**Return Values:**
- Services return plain objects or arrays — no wrapper classes
- Async functions return Promises of the resolved type directly
- Nullable returns use explicit `| null` or `| undefined` (not `?` in type syntax typically)
- Collections return empty arrays rather than null: `getConversations()` returns `[]` if no matches

## Module Design

**Exports:**
- Named exports preferred: `export async function addBiomarker() { ... }`
- Re-export types alongside implementations: `export type { RangeStatus }` in same file
- Barrel files (index.ts) in bridge and prompts packages; see `packages/jeffrey/src/bridge/index.ts`

**Barrel Files:**
- Used in `packages/jeffrey` to group related exports: `./bridge/index.ts` exports bridge implementations
- Packages also use export map in `package.json` for subpath exports: `"./bridge": "./src/bridge/index.ts"`
- Not used in `apps/api` (routes and services are imported directly)

## Drizzle ORM Patterns

**Schema Definition:**
- Table names in snake_case: `biomarkers`, `health_profiles`
- Column names in snake_case: `user_id`, `created_at`, `password_hash`
- Relations defined separately: `export const biomarkersRelations = relations(biomarkers, ({ one }) => ...)`
- Enum columns use string type with enum constraint: `text("status", { enum: ["active", "inactive"] })`

**Queries:**
- Drizzle fluent API used: `db.select().from(table).where(eq(column, value)).get()`
- Batch inserts with `onConflictDoNothing()` for idempotency: `await db.insert().values({...}).onConflictDoNothing()`
- Ordering: `desc(schema.biomarkers.measuredAt)` for reverse chronological
- Type-safe column selection: `.select({ id, email })` or `.select()`

## Async Patterns

**Async/Await (not promises chains):** All async functions use async/await; `.then()` chains are rare

**Error propagation:** Errors thrown from service functions bubble to route handlers unless explicitly caught

**No implicit void promises:** Functions that return Promises are explicitly typed

---

*Convention analysis: 2026-05-04*
