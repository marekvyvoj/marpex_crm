---
applyTo:
  - "06_IMPLEMENTATION/tests/web/**/*.{ts,tsx}"
  - "07_TEST_SUITE/**/*.{ts,tsx,js,mjs}"
description: "Use when adding or editing Vitest, Playwright, integration, web, or load tests in the Marpex CRM repository."
name: "Tests Instructions"
---

# Instructions

- Choose the smallest test layer that can catch the behavior: `06_IMPLEMENTATION/tests/web` for frontend slices, `07_TEST_SUITE/unit` for pure domain logic, `07_TEST_SUITE/integration` for API plus DB behavior, and `07_TEST_SUITE/e2e` for full workflows.
- DB-dependent tests assume PostgreSQL on `localhost:5432` with migrations and seed data already applied.
- Keep Playwright changes compatible with shared-database stability. The current E2E runner is configured with `workers: 1`.
- Reuse existing helpers and seeded accounts instead of hardcoding new credentials or duplicating setup.
- When a product change touches a contract or workflow, update the nearest tests rather than broadening unrelated suites.
- Record exactly which commands ran and which preconditions were missing.