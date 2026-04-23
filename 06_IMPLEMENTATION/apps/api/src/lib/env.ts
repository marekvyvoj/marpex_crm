import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

let envLoaded = false;

export function loadEnv() {
  if (envLoaded) {
    return;
  }

  const envFileNames = process.env.NODE_ENV === "production" ? [".env.production", ".env"] : [".env", ".env.production"];
  const envCandidates = envFileNames.flatMap((fileName) => [
    resolve(process.cwd(), fileName),
    resolve(process.cwd(), "../../", fileName),
  ]);

  for (const envPath of envCandidates) {
    if (existsSync(envPath)) {
      config({ path: envPath });
      break;
    }
  }

  envLoaded = true;
}

export function requireEnv(name: string) {
  loadEnv();

  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Create 06_IMPLEMENTATION/.env from .env.example or export it in the shell.`);
  }

  return value;
}

export function getOptionalNumberEnv(name: string) {
  loadEnv();

  const raw = process.env[name];
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`${name} must be a valid number.`);
  }

  return value;
}