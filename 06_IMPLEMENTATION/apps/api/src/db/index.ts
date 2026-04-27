import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import { requireEnv } from "../lib/env.js";

export const pool = new pg.Pool({
  connectionString: requireEnv("DATABASE_URL"),
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
