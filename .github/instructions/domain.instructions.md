---
applyTo: "06_IMPLEMENTATION/packages/domain/src/**/*.ts"
description: "Use when editing shared domain logic, pipeline rules, Zod schemas, or reusable business validation in packages/domain."
name: "Domain Instructions"
---

# Instructions

- Treat `06_IMPLEMENTATION/packages/domain` as the shared source of truth for pipeline rules, visit validation, opportunity logic, and reusable schemas.
- Keep this package platform-neutral. Do not introduce Fastify, browser, or database-specific dependencies into domain modules.
- Preserve existing naming rules: TypeScript symbols are `camelCase`, while persisted enum-like values such as pipeline stages remain `snake_case`.
- If you add a new public module, update the package exports so API and web workspaces can consume it intentionally.
- Domain changes usually require downstream validation in both API and web code. Rebuild or typecheck the package first, then run the smallest affected test suites.
- Prefer explicit business rules over generic configuration layers; this repo is intentionally optimized for a small, explicit MVP.