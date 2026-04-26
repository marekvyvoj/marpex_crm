---
applyTo:
  - "06_IMPLEMENTATION/apps/api/drizzle/**/*.sql"
  - "06_IMPLEMENTATION/apps/api/drizzle.config.ts"
  - "06_IMPLEMENTATION/apps/api/src/db/**/*.ts"
  - "06_IMPLEMENTATION/apps/api/src/seed.ts"
description: "Use when editing Drizzle schema, SQL migrations, seed data, or PostgreSQL configuration for the Fastify API."
name: "Database Instructions"
---

# Instructions

- PostgreSQL naming stays `snake_case`. Keep TypeScript-side mapping and API payloads `camelCase`.
- Prefer additive, forward-safe migrations. If a migration may already be applied outside a local sandbox, add a new migration instead of rewriting an old one.
- Keep seed data deterministic enough for integration and E2E tests. Changes to seeded users, customers, or auth assumptions usually require test updates.
- Validate schema changes against `06_IMPLEMENTATION/apps/api/drizzle.config.ts`, `06_IMPLEMENTATION/.env.example`, and the affected tests before claiming the change is safe.
- Run migration or seed commands only with explicit user approval or an explicitly confirmed local disposable environment. Do not run destructive database commands against unknown or production-like targets.
- Do not automatically retry `db:generate`, `db:migrate`, or `db:seed` after an unexpected failure.
- When schema changes affect routes, update the corresponding API tests, domain logic, and docs.