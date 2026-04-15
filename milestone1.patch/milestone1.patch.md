# milestone1.patch  
  
diff --git a/packages/db/src/index.ts b/packages/db/src/index.ts  
index 6b23c4b..ebc7f2e 100644  
--- a/packages/db/src/index.ts  
+++ b/packages/db/src/index.ts  
@@ -21,3 +21,4 @@ export const db = drizzle(client, { schema });  
   
 export { schema };  
 export * from "drizzle-orm";  
+export { migrate } from "drizzle-orm/libsql/migrator";  
diff --git a/apps/api/src/index.ts b/apps/api/src/index.ts  
index 9442053..c8869b0 100644  
--- a/apps/api/src/index.ts  
+++ b/apps/api/src/index.ts  
@@ -12,8 +12,7 @@ import { protocolRoutes } from "./routes/protocol.js";  
 import { chatRoutes } from "./routes/chat.js";  
 import { integrationsRoutes } from "./routes/integrations.js";  
 import { startScheduler } from "./scheduler.js";  
-import { db, schema } from "@aissisted/db";  
-import { migrate } from "drizzle-orm/libsql/migrator";  
+import { db, schema, sql, migrate } from "@aissisted/db";  
 import { resolve, dirname } from "path";  
 import { fileURLToPath } from "url";  
   
@@ -52,7 +51,7 @@ await registerAuditLog(app);  
 app.get("/health", async (_request, reply) => {  
   let dbStatus = "ok";  
   try {  
-    await db.run({ sql: "SELECT 1", args: [] });  
+    await db.run(sql`SELECT 1`);  
   } catch {  
     dbStatus = "error";  
   }  
diff --git a/apps/api/src/services/persist-biomarkers.ts b/apps/api/src/services/persist-biomarkers.ts  
new file mode 100644  
index 0000000..61318bd  
--- /dev/null  
+++ b/apps/api/src/services/persist-biomarkers.ts  
@@ -0,0 +1,42 @@  
+import { randomUUID } from "crypto";  
+import { db, schema } from "@aissisted/db";  
+  
+export type BiomarkerEntry = {  
+  name: string;  
+  value: number;  
+  unit: string;  
+  source: string;  
+  measuredAt: string;  
+};  
+  
+/**  
+ * Persist an array of biomarker entries for a user.  
+ * Skips rows that violate unique/constraint rules (e.g. duplicates).  
+ * Returns the number of rows successfully inserted.  
+ */  
+export async function persistBiomarkers(  
+  userId: string,  
+  entries: BiomarkerEntry[]  
+): Promise<number> {  
+  if (entries.length === 0) return 0;  
+  let count = 0;  
+  const now = new Date().toISOString();  
+  for (const entry of entries) {  
+    try {  
+      await db.insert(schema.biomarkers).values({  
+        id: randomUUID(),  
+        userId,  
+        name: entry.name,  
+        value: entry.value,  
+        unit: entry.unit,  
+        source: entry.source,  
+        measuredAt: entry.measuredAt,  
+        createdAt: now,  
+      });  
+      count++;  
+    } catch {  
+      // Skip duplicates / constraint violations  
+    }  
+  }  
+  return count;  
+}  
diff --git a/apps/api/src/routes/integrations.ts b/apps/api/src/routes/integrations.ts  
index 0f498de..4535190 100644  
--- a/apps/api/src/routes/integrations.ts  
+++ b/apps/api/src/routes/integrations.ts  
@@ -3,6 +3,7 @@ import type { FastifyInstance } from "fastify";  
 import { requireAuth } from "../middleware/auth.js";  
 import { config } from "../config.js";  
 import { db, schema, eq } from "@aissisted/db";  
+import { persistBiomarkers } from "../services/persist-biomarkers.js";  
   
 // WHOOP  
 import { buildAuthUrl, exchangeCode, storeTokens } from "../integrations/whoop/oauth.js";  
diff --git a/apps/api/src/integrations/whoop/sync.ts b/apps/api/src/integrations/whoop/sync.ts  
index bfda925..f34b599 100644  
--- a/apps/api/src/integrations/whoop/sync.ts  
+++ b/apps/api/src/integrations/whoop/sync.ts  
@@ -1,42 +1,6 @@  
-import { randomUUID } from "crypto";  
-import { db, schema } from "@aissisted/db";  
 import { getLatestRecovery, getLatestSleep } from "./client.js";  
 import { recoveryToSignals, sleepToSignals } from "./normalizer.js";  
-  
-type BiomarkerEntry = {  
-  name: string;  
-  value: number;  
-  unit: string;  
-  source: string;  
-  measuredAt: string;  
-};  
-  
-async function persistBiomarkers(  
-  userId: string,  
-  entries: BiomarkerEntry[]  
-): Promise<number> {  
-  if (entries.length === 0) return 0;  
-  let count = 0;  
-  const now = new Date().toISOString();  
-  for (const entry of entries) {  
-    try {  
-      await db.insert(schema.biomarkers).values({  
-        id: randomUUID(),  
-        userId,  
-        name: entry.name,  
-        value: entry.value,  
-        unit: entry.unit,  
-        source: entry.source,  
-        measuredAt: entry.measuredAt,  
-        createdAt: now,  
-      });  
-      count++;  
-    } catch {  
-      // Skip duplicates / constraint violations  
-    }  
-  }  
-  return count;  
-}  
+import { persistBiomarkers, type BiomarkerEntry } from "../../services/persist-biomarkers.js";  
   
 export async function syncWhoopForUser(userId: string): Promise<number> {  
   const [recovery, sleep] = await Promise.all([  
