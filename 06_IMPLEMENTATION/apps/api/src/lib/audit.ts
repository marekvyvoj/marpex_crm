import { db } from "../db/index.js";
import { auditLog } from "../db/schema.js";

export async function writeAudit(params: {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: unknown;
}) {
  try {
    await db.insert(auditLog).values({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      payload: params.payload != null ? JSON.stringify(params.payload) : null,
    });
  } catch {
    // Audit failures must never break business operations
  }
}
