# Session State

Last updated: 2026-04-28
Current task: Customer list cleanup for imported SourceData companies, manual customer plan usage, demo-data isolation, and requested commit or push or deploy follow-up
Current phase: Implementation complete; focused validation passed on typecheck plus web tests, with DB-backed validation blocked by missing local runtime
Approval status: User explicitly requested commit, push, and deploy for this task. Code edits and remote mutation are in scope once the changed slice is validated.

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
- `cd 06_IMPLEMENTATION && npx vitest run tests/web/customers-page.spec.tsx tests/web/opportunity-detail-page.spec.tsx --config vitest.phase5.config.ts`: passed.
- Local PostgreSQL recovery: confirmed `drizzle.__drizzle_migrations` existed in schema `drizzle`, backfilled local ledger entries for already-present `0003` to `0005`, then reran `cd 06_IMPLEMENTATION && npm run db:migrate`: passed.
- `cd 07_TEST_SUITE && npm run test:integration`: passed (19/19).
- `cd 06_IMPLEMENTATION && npm run typecheck`: passed after the SourceData customer, industry, and login client changes.
- `cd 06_IMPLEMENTATION && npm run phase5:test:web`: passed (15 files, 37 tests).
- Docker Desktop was started successfully and `cd 06_IMPLEMENTATION && docker compose up -d db` passed.
- `cd 06_IMPLEMENTATION && npm run db:migrate`: passed on the local disposable PostgreSQL target.
- `cd 06_IMPLEMENTATION && npm run db:seed`: initially failed on `xlsx` ESM interop, then on ABRA foreign-key cleanup during reseed; both were fixed locally and the final seed passed.
- `cd 07_TEST_SUITE && npx vitest run integration/api.spec.ts --config vitest.config.ts -t "creates, filters, updates and expands customer detail resources"`: passed after local DB migration and seed.
- `cd 06_IMPLEMENTATION && npx vitest run tests/web/customers-page.spec.tsx tests/web/customer-detail-page.spec.tsx --config vitest.phase5.config.ts`: passed after replacing `Potenciál` with manual `Plán` in the customer UI.
- `cd 06_IMPLEMENTATION && npm run typecheck`: passed after removing legacy customer `profit`, `potential`, and `category` usage from the shared schema, API routes, import flow, and seed.
- `cd 06_IMPLEMENTATION && npx vitest run tests/web/customers-page.spec.tsx tests/web/customer-detail-page.spec.tsx tests/web/import-page.spec.tsx --config vitest.phase5.config.ts`: passed after the customer/import cleanup.
- `cd 07_TEST_SUITE && npx vitest run integration/api.spec.ts --config vitest.config.ts -t "creates, filters, updates and expands customer detail resources|validates import content type and payload|imports customers from CSV and reports row errors"`: blocked by `ECONNREFUSED` because no local PostgreSQL instance was reachable on `localhost:5432`.
- `cd 06_IMPLEMENTATION && docker compose up -d db`: failed on this workstation because the Docker Desktop Linux engine pipe was unavailable.
- `cd 07_TEST_SUITE && npx tsc --noEmit --project tsconfig.json`: blocked because the validation workspace is missing the installed `node` type definitions in the current environment.
- `git push origin main`: passed for commits `18568b5` and `eac4c01`.
- Railway production deployments triggered automatically for both `marpex_crm` and `web` and both reached `SUCCESS`.
- `railway ssh -s marpex_crm sh -lc "cd /app; npm -w apps/api run db:migrate"`: passed in production.
- `railway ssh -s marpex_crm sh -lc "cd /app; npm -w apps/api run db:seed"`: initially failed because the deployed workspace did not contain `SourceData`, then passed after duplicating the workbook files into `06_IMPLEMENTATION/SourceData` and redeploying.
- Public smoke checks passed: `GET https://marpexcrm-production.up.railway.app/api/health` returned `200`, `GET https://web-production-c47f4.up.railway.app` returned `200`, and live login with `manager@marpex.sk / manager123` returned `200` for `/api/auth/login`, `/api/auth/me`, and `/api/customers`.

## Review Results

- Repository fit review: repo facts largely matched live manifests and source files. Fixed path drift in bugfix and debugging materials, added README coverage, and expanded config file coverage.
- Copilot usability review: `.ai/prompts/` are now treated as manual templates, while real slash prompts live under `.github/prompts/`. `AGENTS.md` is framed as workflow guidance rather than enforced subagents.
- Autonomy safety review: high-risk mutating actions now require explicit user approval or an explicitly confirmed local disposable target. Same-session review cannot self-approve critical work.
- Quality gate review: command names match current manifests. The original Docker service-name and Node-version drift were later confirmed and resolved via doc updates.
- Documentation review: report and handoff materials were completed, and the handoff summary now has a canonical home in this file.
- Same-session reduced-assurance reviewer pass for the latest follow-up found no new contract or auth regressions after the customer list payload expansion and task toggle change; behavior is backed by focused web tests plus the full integration suite.
- Same-session security pass for the latest follow-up confirmed the only mutating recovery step was limited to the local `localhost:5432/marpex_crm` integration target and did not touch Railway production data.
- Same-session reduced-assurance reviewer pass for the SourceData customer and login slice found and resolved two concrete operational defects before release: `xlsx` default export interop in the seed loader and missing ABRA cleanup before reseeding customers.
- Same-session security pass for the SourceData slice confirmed that production mutation happened only after local disposable validation, explicit user approval, successful Railway redeploy, and direct execution inside the Railway API service.
- Same-session reduced-assurance reviewer pass for the current customer-plan cleanup found no remaining code-level blockers after the follow-up fixes; residual risk is limited to the unexecuted DB-backed seed or integration path on this workstation.
- Same-session security pass for the current task confirmed that the customer cleanup only changes local code plus the seed script and does not alter auth, env, cookies, or deployment wrappers.

## Active Blockers And Manual Confirmation

- Visit dictation on mobile depends on browser support for `SpeechRecognition` or `webkitSpeechRecognition`; unsupported browsers fall back to normal text input or OS keyboard dictation.
- Customer annual plan is currently modeled as a single current-year amount plus year stamp on the customer record. If the product needs multi-year plan history or ABRA-driven plan import, this should move to a dedicated table or import flow.
- `SourceData/` contains 687 unique customer rows across six Excel files. Shared columns are `IČO`, `Názov`, `DIČ`, `IČ DPH`, `Adresa`, `Mesto`, `PSČ`, `Okres`, `Kraj`, `Tržby`; one workbook also adds `Zisk`.
- The requested filter values `Potravinarstvo`, `OEM`, and `Mobile Equipment` do not match the existing `segment` enum. They need a separate customer industry field rather than overloading the current segment semantics.
- Railway API service builds from the `06_IMPLEMENTATION` workspace, so SourceData workbooks required for production seeding must also exist under `06_IMPLEMENTATION/SourceData`, not only in the repo root.
- DB-backed validation for the current cleanup remains blocked on this workstation because Docker Desktop is unavailable and no local PostgreSQL target is reachable on `localhost:5432`.
- `07_TEST_SUITE` TypeScript validation is environment-blocked until its dependencies or type packages are installed in this shell.

## Current Execution Notes

- New task discovery confirmed the smallest controlling slices: customer list and detail UI in `apps/web`, customer input and filters in `packages/domain` plus `apps/api/src/routes/customers.ts`, CSV import help plus parsing in `apps/web/src/pages/ImportPage.tsx` and `apps/api/src/routes/import.ts`, and seeded SourceData enrichment in `apps/api/src/seed.ts`.
- Working hypothesis: the requested `Plan` column should reuse the existing nullable `annualRevenuePlan` field, while `profit`, `strategicCategory`, and seeded `potential` should stop driving customer UI and import flows.
- Implemented the current cleanup by moving the customer list and detail UI to `annualRevenuePlan`, removing category and profit from the customer-facing API or import or docs surface, and splitting seed data into clean SourceData companies plus six synthetic demo customers that own the test contacts or visits or opportunities or ABRA records.
- Live verification showed the planner seed-data issue is ownership-related, not planner logic: `obchodnik1` currently sees only 1 planner item, while `obchodnik3` sees 114.
- Root cause in `apps/api/src/seed.ts`: demo visits and opportunities were only assigned to manager plus `obchodnik3-6`, excluding `obchodnik1` and `obchodnik2`.
- Updated future seed distribution to include all sales users, added a dry-run-by-default `db:rebalance-demo-owners` script for existing seeded data, and added a Safari-friendly legacy Vite build for the web app.
- `cd 06_IMPLEMENTATION && npm install -w apps/web -D @vitejs/plugin-legacy@^6.1.0`: passed.
- `cd 06_IMPLEMENTATION && npm run typecheck`: passed after the seed script and Safari changes.
- `cd 06_IMPLEMENTATION && npm -w apps/web run build`: passed and emitted legacy bundles for Safari.
- `cd 06_IMPLEMENTATION && railway run npm -w apps/api run db:rebalance-demo-owners`: dry-run validation blocked locally because Railway injects `postgres.railway.internal`, which is not resolvable from the local shell.
- Tightened the rebalance script after reviewer findings: it now requires the full fixed demo account set, limits visits and tasks to seed-shaped records only, updates only the initial seeded opportunity stage-history author, and closes the shared DB pool cleanly.
- `get_errors` on `apps/api/src/scripts/rebalance-demo-owners.ts`: passed.
- Same-session reduced-assurance reviewer pass after the fixes found no remaining concrete code defects; residual risk is limited to the live `--write` operation and unverified Safari runtime smoke coverage.
- New task discovery identified the owning files for customer schema (`packages/domain/src/customers/index.ts`, `apps/api/src/db/schema.ts`), customer routes (`apps/api/src/routes/customers.ts`), seed (`apps/api/src/seed.ts`), import (`apps/api/src/routes/import.ts`), customer UI (`apps/web/src/pages/CustomersPage.tsx`, `CustomerDetailPage.tsx`), and auth/client flow (`apps/api/src/routes/auth.ts`, `apps/api/src/app.ts`, `apps/web/src/lib/api.ts`, `apps/web/src/pages/LoginPage.tsx`).
- Implemented a separate `industry` field plus SourceData-derived customer identity, address, revenue, and profit fields across `packages/domain`, the API schema and routes, the web customer pages, and additive migration `0007_customer_source_data_fields.sql`.
- Added `apps/api/src/lib/source-customers.ts` to load the six `SourceData/*.xlsx` workbooks and rewired `apps/api/src/seed.ts` to replace generated demo customers with the 687 Excel-derived records.
- Fixed `apps/api/src/lib/source-customers.ts` to use the `xlsx` default export so runtime `readFile` works under ESM.
- Fixed `apps/api/src/seed.ts` reseed cleanup so ABRA rows are deleted before deleting seeded customers.
- Hardened `apps/web/src/lib/api.ts` so `VITE_API_URL` works with or without `/api`, and updated `LoginPage` to surface network and rate-limit failures instead of always showing invalid credentials.
- Synced `06_IMPLEMENTATION/docs/openapi.yaml`, `06_IMPLEMENTATION/docs/LAUNCH_CHECKLIST.md`, and the Railway deployment guides so the documented customer contract and `VITE_API_URL` guidance match the new code.
- Added `06_IMPLEMENTATION/SourceData` as a duplicate of the workbook set so Railway's workspace-based build includes the Excel files needed for production seeding.
- Extended the nearest integration coverage in `07_TEST_SUITE/integration/api.spec.ts` for `industry`, SourceData fields, and profit updates, and the targeted scenario passed after local DB setup.

## Handoff Summary

- Customer schema, API routes, web screens, seed flow, and docs now support the new SourceData-driven fields plus a separate filterable `industry` field for `potravinarstvo`, `oem`, and `mobile_equipment`.
- Seed data generation now loads the six Excel workbooks from `SourceData/` and `06_IMPLEMENTATION/SourceData` and produces 687 unique customer records instead of synthetic company names.
- The login inconsistency was hardened at the client or env boundary by normalizing `VITE_API_URL` with or without `/api` and by exposing clearer login error messages.
- Local validation passed across typecheck, web tests, local migration, local seed, and the focused DB-backed customer integration scenario.
- Production status is live: commits were pushed to `origin/main`, both Railway services redeployed successfully, production migration and seed ran inside `marpex_crm`, and public API or web or login smoke checks all passed.

## Next Recommended Action

- Optional manual follow-up: open the live web UI and visually confirm the new customer columns, industry filters, and customer detail fields against a few SourceData records.