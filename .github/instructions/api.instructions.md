---
applyTo: "06_IMPLEMENTATION/apps/api/src/**/*.ts"
description: "Use when editing the Fastify API, route handlers, auth/session flow, env loading, or HTTP contracts in apps/api."
name: "API Instructions"
---

# Instructions

- Keep routes thin. Shared validation and business rules belong in `06_IMPLEMENTATION/packages/domain` unless the logic is strictly transport-specific.
- Preserve the API error contract from ADR 0002: `{ error, code, details? }`. Reuse existing helpers such as `sendError` and `getStatusCode` instead of inventing new response shapes.
- Preserve auth and session behavior in `06_IMPLEMENTATION/apps/api/src/app.ts`: only `api/auth/login` and `api/health` are public, cookies are `httpOnly`, and production behavior depends on `trustProxy`, `Secure`, and `SameSite=None`.
- Keep list endpoints compatible with header-based pagination. If you change list behavior, update both headers and tests.
- When touching route payloads or business rules, inspect and update the corresponding domain module, web consumer, and tests.
- If you add or change externally visible API behavior, sync `06_IMPLEMENTATION/docs/openapi.yaml` and the affected docs.
- Validate with the narrowest relevant commands, usually `npm run typecheck`, `npm run phase5:test`, or the affected tests in `07_TEST_SUITE`.
- Do not inspect or edit real env files or production-only values. Use `06_IMPLEMENTATION/.env.example` and docs as references.