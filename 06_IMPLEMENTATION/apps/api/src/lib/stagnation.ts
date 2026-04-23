import { sql } from "drizzle-orm";
import { db } from "../db/index.js";

const STAGNATION_SYNC_INTERVAL_MS = 5 * 60 * 1000;

let lastSuccessfulSyncAt = 0;
let inFlightSync: Promise<void> | null = null;

export async function syncStagnantOpportunities() {
  const now = Date.now();

  if (now - lastSuccessfulSyncAt < STAGNATION_SYNC_INTERVAL_MS) {
    return;
  }

  if (inFlightSync) {
    return inFlightSync;
  }

  inFlightSync = (async () => {
    await db.execute(sql`
      UPDATE opportunities
      SET stagnant = true, updated_at = now()
      WHERE last_activity_at < now() - interval '30 days'
        AND stage NOT IN ('won', 'lost')
        AND stagnant = false
    `);

    lastSuccessfulSyncAt = Date.now();
  })().finally(() => {
    inFlightSync = null;
  });

  return inFlightSync;
}