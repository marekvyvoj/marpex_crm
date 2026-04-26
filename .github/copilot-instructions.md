# Project Guidelines

Use `AGENTS.md` for role-switching and session workflow. Use this file for repository-wide coding rules.

If this file conflicts with the legacy root `.instructions.md`, follow this file.

## Workspace Shape

- Treat `06_IMPLEMENTATION/` as the code root. It is an npm-workspaces monorepo with `apps/api`, `apps/web`, and `packages/domain`.
- Treat `07_TEST_SUITE/` as the broader validation project. The root `package.json`, `Procfile`, `web.Procfile`, and `start.sh` are mainly deployment wrappers.
- Existing business and deployment docs live in `06_IMPLEMENTATION/README.md`, `06_IMPLEMENTATION/docs/`, `docs/`, and the numbered root markdown files.

## Inspect Before Editing

- Read the owning manifest and the nearest implementation before changing behavior: `06_IMPLEMENTATION/package.json`, `06_IMPLEMENTATION/README.md`, the local package `package.json`, the nearest route, page, component, or test, and the relevant ADR or doc if the change touches contracts or deployment.
- For API work, inspect the matching route, `06_IMPLEMENTATION/apps/api/src/app.ts`, related domain rules in `06_IMPLEMENTATION/packages/domain`, and the nearest tests in `06_IMPLEMENTATION/tests/web` or `07_TEST_SUITE`.
- For web work, inspect the nearest page or component, `06_IMPLEMENTATION/apps/web/src/lib/api.ts`, and the route map in `06_IMPLEMENTATION/apps/web/src/App.tsx`.
- For schema or seed changes, inspect `06_IMPLEMENTATION/apps/api/src/db`, `06_IMPLEMENTATION/apps/api/drizzle`, `06_IMPLEMENTATION/apps/api/drizzle.config.ts`, `06_IMPLEMENTATION/.env.example`, and the tests that rely on seeded data.

## Change Style

- Keep changes minimal and local. Preserve the current MVP architecture: thin Fastify routes, shared business rules in `packages/domain`, and React pages and components in `apps/web`.
- Keep database identifiers `snake_case`. Keep TypeScript symbols and JSON payloads `camelCase`. Keep pipeline stage IDs and other persisted enum-like values in `snake_case`.
- Follow the existing TypeScript style: ESM imports, double quotes, semicolons, named exports, and small helpers over new abstractions.
- Do not introduce a repository or service layer unless the task clearly requires it; ADR 0001 intentionally keeps Drizzle queries close to thin route handlers for this MVP.
- Preserve the surrounding language of the file: business and deployment docs are often Slovak, while code, tests, and technical comments are English.

## Validation

- Run the narrowest relevant command from `06_IMPLEMENTATION/` or `07_TEST_SUITE/`.
- Common commands in `06_IMPLEMENTATION/`:
  - `npm install`
  - `docker compose up -d db`
  - `npm run dev:api`
  - `npm run dev:web`
  - `npm run build`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run format:check`
  - `npm run phase5:test`
  - `npm run phase5:test:web`
- Common commands in `07_TEST_SUITE/`:
  - `npm install`
  - `npm run test`
  - `npm run coverage`
  - `npm run test:e2e`
  - `npm run test:load:smoke`
- If `packages/domain` changes, rebuild or typecheck it before claiming downstream API or web code is valid.

## Tests

- Update or add the nearest tests when behavior changes.
- Use `06_IMPLEMENTATION/tests/web` for frontend and API-client slices.
- Use `07_TEST_SUITE/unit` for pure domain logic, `07_TEST_SUITE/integration` for Fastify plus DB behavior, and `07_TEST_SUITE/e2e` for full workflows.
- DB-dependent tests assume local PostgreSQL on `localhost:5432` with migrations and seed data. State when that precondition was not available.
- Do not claim a command passed unless you ran it.

## Contracts And Docs

- Keep the API error shape consistent with ADR 0002: `{ error, code, details? }`.
- Preserve header-based pagination on list endpoints using `X-Total-Count`, `X-Page`, `X-Limit`, and `X-Total-Pages`, unless the task explicitly changes the contract.
- When external behavior changes, sync the relevant docs: `06_IMPLEMENTATION/docs/openapi.yaml`, `06_IMPLEMENTATION/docs/LAUNCH_CHECKLIST.md`, Railway docs under `docs/`, and any user-facing guide that the change invalidates.

## Safety

- Never read from or modify real secrets or production credentials. Use `06_IMPLEMENTATION/.env.example` and the deployment docs as references.
- Be careful around auth, session, CORS, and proxy settings in `06_IMPLEMENTATION/apps/api/src/app.ts`; Railway production requires proxy-aware secure cross-domain cookies.
- Treat deployment wrappers and runtime config files as high-risk: `Procfile`, `web.Procfile`, `06_IMPLEMENTATION/api.Procfile`, `start.sh`, Dockerfiles, `docker-compose.yml`, and env handling.
- Run mutating commands for migrations, seed data, deployment wrappers, auth or session rollout work, and env-sensitive runtime changes only with explicit user approval or an explicitly confirmed local disposable environment.
- Do not automatically retry a mutating command after an unexpected failure; inspect the target and the failure first.
- Record unresolved assumptions or doc mismatches in `.ai/open-questions.md` and durable tradeoffs in `.ai/decisions.md`.