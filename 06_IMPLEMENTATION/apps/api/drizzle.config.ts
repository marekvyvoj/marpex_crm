import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

const envCandidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Create 06_IMPLEMENTATION/.env from .env.example or export it in the shell.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
