/**
 * Audit logging service — records every major data-pipeline event
 * to the audit_log table for traceability and HIPAA compliance.
 *
 * Callers should fire-and-forget: writeAuditLog(...).catch(() => {})
 * so audit failures never block critical paths.
 */

import { randomUUID } from "crypto";
import { db, schema } from "@aissisted/db";

export type AuditAction =
  // Auth
  | "auth.register"
  | "auth.login"
  | "auth.logout"
  | "auth.password_change"
  | "auth.account_delete"
  // Integrations
  | "integration.connect"
  | "integration.disconnect"
  | "integration.token_refresh"
  // Sync
  | "sync.start"
  | "sync.complete"
  | "sync.fail"
  // Analysis
  | "health_state.generated"
  | "biomarker_trends.computed"
  // Protocol
  | "protocol.generated"
  // Data access
  | "health_state.read"
  | "protocol.read"
  | "biomarkers.read";

export async function writeAuditLog(
  userId: string | null,
  action: AuditAction | string,
  resource: string,
  resourceId?: string | null,
  detail?: Record<string, unknown> | null
): Promise<void> {
  await db.insert(schema.auditLog).values({
    id: randomUUID(),
    userId,
    action,
    resource,
    resourceId: resourceId ?? null,
    detail: detail ?? null,
    createdAt: new Date(),
  });
}
