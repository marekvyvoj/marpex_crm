---
applyTo:
  - "package.json"
  - "Procfile"
  - "web.Procfile"
  - "start.sh"
  - "06_IMPLEMENTATION/.env.example"
  - "06_IMPLEMENTATION/package.json"
  - "06_IMPLEMENTATION/docker-compose.yml"
  - "06_IMPLEMENTATION/eslint.config.mjs"
  - "06_IMPLEMENTATION/vitest.phase5.config.ts"
  - "06_IMPLEMENTATION/tsconfig.base.json"
  - "06_IMPLEMENTATION/api.Procfile"
  - "06_IMPLEMENTATION/apps/*/package.json"
  - "06_IMPLEMENTATION/apps/api/Dockerfile"
  - "06_IMPLEMENTATION/apps/api/drizzle.config.ts"
  - "06_IMPLEMENTATION/apps/api/tsconfig.json"
  - "06_IMPLEMENTATION/apps/web/nginx.conf"
  - "06_IMPLEMENTATION/apps/web/Dockerfile"
  - "06_IMPLEMENTATION/apps/web/postcss.config.js"
  - "06_IMPLEMENTATION/apps/web/tailwind.config.js"
  - "06_IMPLEMENTATION/apps/web/tsconfig.json"
  - "06_IMPLEMENTATION/apps/web/vite.config.ts"
  - "06_IMPLEMENTATION/packages/*/package.json"
  - "07_TEST_SUITE/package.json"
  - "07_TEST_SUITE/playwright.config.ts"
  - "07_TEST_SUITE/vitest.config.ts"
description: "Use when editing build, deployment, runtime, lint, TypeScript, Docker, Vite, Tailwind, Drizzle, or test-runner configuration files."
name: "Config Instructions"
---

# Instructions

- Confirm which layer owns the change before editing config. The root `package.json` is mostly a Railway wrapper, while the real application workspace lives in `06_IMPLEMENTATION`.
- Prefer the smallest config edit that matches current behavior. Do not rewrite deployment wrappers, Dockerfiles, or test runners unless the task requires it.
- Verify deployment path assumptions against actual files. Railway-related config spans the root wrappers plus `06_IMPLEMENTATION/api.Procfile`, `docs/RAILWAY_*`, and Dockerfiles.
- Keep Vite local development compatible with the existing `/api` proxy to `http://localhost:3005`.
- Keep test runner changes aligned with current assumptions: Vitest spans both monorepo and `07_TEST_SUITE`, and Playwright currently builds the API, serves the web app, and runs with one worker.
- Before running migration, seed, deploy, or restart commands from a config task, require explicit user approval or an explicitly confirmed local disposable target.
- Do not auto-retry a mutating config-side command after an unexpected failure.
- Validate config changes with the narrowest relevant command and record any environment prerequisites that prevented full verification.