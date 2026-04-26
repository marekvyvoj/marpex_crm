---
applyTo: "06_IMPLEMENTATION/apps/web/src/**/*.{ts,tsx}"
description: "Use when editing the React, Vite, Tailwind, React Router, or React Query frontend in apps/web."
name: "Web Instructions"
---

# Instructions

- Follow the existing page-driven structure in `06_IMPLEMENTATION/apps/web/src/App.tsx`, `pages/`, and `components/` before introducing new abstractions.
- Preserve the API client behavior in `06_IMPLEMENTATION/apps/web/src/lib/api.ts`: requests include `credentials: \"include\"`, and non-auth `401` responses redirect to `/login`.
- Reuse shared types and business rules from `@marpex/domain` rather than duplicating validation logic in the frontend.
- Keep route names, page names, and lazy-loading patterns consistent with the current router setup.
- Keep UI copy aligned with the surrounding screen. Existing UI labels are often Slovak even though code is English.
- When a frontend change depends on an API contract update, validate both sides and update the matching web tests in `06_IMPLEMENTATION/tests/web` or `07_TEST_SUITE/e2e`.
- Validate with the narrowest relevant commands, usually `npm run typecheck` and `npm run phase5:test:web` from `06_IMPLEMENTATION`.