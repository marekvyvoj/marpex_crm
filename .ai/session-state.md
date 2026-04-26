# Session State

Last updated: 2026-04-26
Current task: Visits detail, mobile UX, pipeline stage detail view, and customer yearly revenue split
Current phase: Implemented and validated locally; DB migration execution still pending
Approval status: Safe for low-risk local edits and non-destructive validation. Not pre-approved for DB-mutating commands.

## Repository Discovery

- Primary languages: TypeScript and SQL, plus Markdown docs and shell wrappers
- Frameworks and libraries: Fastify 5, React 19, Vite 6, Tailwind CSS 3, Drizzle ORM, Zod, React Query, React Router, Vitest, Playwright
- Package manager: npm workspaces rooted at `06_IMPLEMENTATION/`
- Runtime baseline: Node.js 22+, PostgreSQL 16+
- Code root: `06_IMPLEMENTATION/`
- Validation root: `07_TEST_SUITE/`

## Important Directories

- `06_IMPLEMENTATION/apps/api`: Fastify API, auth/session, Drizzle config, routes, seed
- `06_IMPLEMENTATION/apps/web`: React SPA, router, API client, Tailwind styling
- `06_IMPLEMENTATION/packages/domain`: shared business rules, schemas, pipeline and visit logic
- `06_IMPLEMENTATION/tests/web`: Vitest browser-style tests tied to the monorepo
- `07_TEST_SUITE/unit`: domain-level tests
- `07_TEST_SUITE/integration`: API plus DB tests
- `07_TEST_SUITE/e2e`: Playwright workflow tests
- `06_IMPLEMENTATION/docs`: OpenAPI, launch checklist, ADRs, user guide
- `docs`: Railway deployment notes and fixes

## Commands Confirmed From Repo Files

- `cd 06_IMPLEMENTATION && npm install`
- `cd 06_IMPLEMENTATION && docker compose up -d db`
- `cd 06_IMPLEMENTATION && npm run dev:api`
- `cd 06_IMPLEMENTATION && npm run dev:web`
- `cd 06_IMPLEMENTATION && npm run build`
- `cd 06_IMPLEMENTATION && npm run lint`
- `cd 06_IMPLEMENTATION && npm run typecheck`
- `cd 06_IMPLEMENTATION && npm run format:check`
- `cd 06_IMPLEMENTATION && npm run phase5:test`
- `cd 06_IMPLEMENTATION && npm run phase5:test:web`
- `cd 07_TEST_SUITE && npm install`
- `cd 07_TEST_SUITE && npm run test`
- `cd 07_TEST_SUITE && npm run coverage`
- `cd 07_TEST_SUITE && npm run test:e2e`
- `cd 07_TEST_SUITE && npm run test:load:smoke`

## Architecture Notes

- ADR 0001 keeps Drizzle queries near thin Fastify route handlers for the MVP.
- `packages/domain` holds reusable business rules and schemas shared by API and web.
- ADR 0002 defines the error contract as `{ error, code, details? }` and keeps pagination metadata in headers.
- The root `package.json` is mostly a Railway wrapper; the real application scripts live in `06_IMPLEMENTATION/package.json`.

## Known Risk Areas

- Auth, session cookies, CORS, and `trustProxy` behavior in `06_IMPLEMENTATION/apps/api/src/app.ts`
- Deployment wrappers: `Procfile`, `web.Procfile`, `06_IMPLEMENTATION/api.Procfile`, `start.sh`, Dockerfiles, Railway docs
- Schema, migrations, and seed changes that can destabilize integration or E2E tests
- Docs that do not fully match current manifests or config
- Deployment and launch docs still contain a few mismatches that need human confirmation before cleanup

## Existing Docs And Standards

- `06_IMPLEMENTATION/README.md` captures naming conventions and the monorepo layout
- `06_IMPLEMENTATION/docs/adr/0001-mvp-architecture.md` and `0002-api-contract-and-mvp-tradeoffs.md` define core architectural choices
- `06_IMPLEMENTATION/.env.example` is the safe source for env shape
- `06_IMPLEMENTATION/eslint.config.mjs` and package manifests define the current TypeScript tooling

## Validation Performed

- `get_errors` on `.github/copilot-instructions.md` and `AGENTS.md`: no workspace errors reported
- `file_search` confirmed 7 path-specific instruction files under `.github/instructions/`
- `file_search` confirmed the `.ai/` memory, prompt, playbook, and report files were created
- `grep_search` confirmed frontmatter keys across `.github/instructions/*.instructions.md`
- Ran five read-only reviewer passes with distinct focuses: repository fit, Copilot usability, autonomy safety, quality gates, and documentation clarity
- Verified the live Railway production project with Railway CLI after browserless login and local project linking
- Confirmed live services `marpex_crm`, `Postgres`, and `web` in project `ravishing-flow`
- Confirmed from live build logs that API uses the `06_IMPLEMENTATION` workspace on Node `22.22.2`, while web uses `06_IMPLEMENTATION/apps/web/Dockerfile` on `node:22-alpine`
- No application code build or test command was needed. Validation for this follow-up task came from Railway CLI inspection plus workspace checks on the edited docs and config files.
- `cd 06_IMPLEMENTATION && npm -w packages/domain run build` after the visit schema change: passed.
- `cd 06_IMPLEMENTATION && npx vitest run tests/web/visits-page.spec.tsx tests/web/visit-detail-page.spec.tsx tests/web/customer-detail-page.spec.tsx --config vitest.phase5.config.ts`: passed.
- `cd 06_IMPLEMENTATION && npx vitest run tests/web/pipeline-page.spec.tsx --config vitest.phase5.config.ts`: passed.
- `cd 06_IMPLEMENTATION && npm -w packages/domain run build` after the customer schema change: passed.
- `cd 06_IMPLEMENTATION && npx vitest run tests/web/customer-detail-page.spec.tsx --config vitest.phase5.config.ts`: passed.
- `cd 06_IMPLEMENTATION && npx vitest run tests/web/layout.spec.tsx tests/web/import-page.spec.tsx tests/web/report-page.spec.tsx tests/web/users-page.spec.tsx --config vitest.phase5.config.ts`: passed.
- `cd 06_IMPLEMENTATION && npm run typecheck`: passed.

## Review Results

- Repository fit review: repo facts largely matched live manifests and source files. Fixed path drift in bugfix and debugging materials, added README coverage, and expanded config file coverage.
- Copilot usability review: `.ai/prompts/` are now treated as manual templates, while real slash prompts live under `.github/prompts/`. `AGENTS.md` is framed as workflow guidance rather than enforced subagents.
- Autonomy safety review: high-risk mutating actions now require explicit user approval or an explicitly confirmed local disposable target. Same-session review cannot self-approve critical work.
- Quality gate review: command names match current manifests. The original Docker service-name and Node-version drift were later confirmed and resolved via doc updates.
- Documentation review: report and handoff materials were completed, and the handoff summary now has a canonical home in this file.

## Active Blockers And Manual Confirmation

- Added migrations `06_IMPLEMENTATION/apps/api/drizzle/0004_visit_notes.sql` and `06_IMPLEMENTATION/apps/api/drizzle/0005_customer_annual_plan.sql`, but they were not executed because no explicit approval or disposable DB target was provided.
- Visit dictation on mobile depends on browser support for `SpeechRecognition` or `webkitSpeechRecognition`; unsupported browsers fall back to normal text input or OS keyboard dictation.
- Customer annual plan is currently modeled as a single current-year amount plus year stamp on the customer record. If the product needs multi-year plan history or ABRA-driven plan import, this should move to a dedicated table or import flow.

## Handoff Summary

- Visits now support persistent free-text notes, mobile dictation, clickable list/detail navigation, and a dedicated detail page.
- Pipeline now exposes clickable stage headers, a stage detail page with tabular opportunity view, and two stage-level charts for counts and potential.
- Customer detail now shows yearly ABRA revenues for the current year plus the two previous years, highlights the current year, and evaluates current-year plan progress when a plan is defined.
- Main web pages were adjusted for mobile browser use by removing rigid desktop grids and wrapping wide content in responsive containers.

## Next Recommended Action

- Run the new DB migrations in a confirmed local disposable environment, then smoke-test visit creation and customer detail against real API data.