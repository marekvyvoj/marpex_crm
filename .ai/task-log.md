# Task Log

## 2026-04-26

### Visit Detail, Mobile UX, Pipeline Stage View, Revenue Split

- Inspected the owning web pages for visits, customer detail, pipeline, layout, and opportunity detail.
- Verified that API already exposes `GET /visits/:id`, but the web app has no visit detail route or clickable visit rows yet.
- Verified that visit schema and DB currently lack a dedicated free-text notes field.
- Verified that customer data has ABRA yearly revenues for the last three years but no current-year customer plan field.
- Verified that pipeline cards are clickable, while stage columns have no detail view or chart summary.
- Confirmed that mobile layout is only partially responsive and will require page-level responsive treatment.
- Implemented persistent visit notes, a dedicated visit detail page, mobile dictation for visit notes, and clickable visit rows from both Visits and Customer Detail.
- Implemented clickable pipeline stage headers, stage detail routing, and stage charts for opportunity counts and pipeline value.
- Implemented customer current-year plan storage plus three-year ABRA revenue cards with plan-progress status for the current year.
- Added forward-safe SQL migrations `0004_visit_notes.sql` and `0005_customer_annual_plan.sql` without executing them.
- Updated OpenAPI for visit detail, visit notes, and customer annual-plan fields.
- Validated with focused Vitest runs for visits, pipeline, customer detail, layout, import, report, and users, plus a full `npm run typecheck` in `06_IMPLEMENTATION`.

### Repository AI Workflow Setup

- Read the existing manifests, README, ADRs, deployment docs, and test configs.
- Confirmed that `06_IMPLEMENTATION/` is the code root and `07_TEST_SUITE/` is the broader validation project.
- Created repository-wide Copilot instructions, path-specific instruction files, `AGENTS.md`, and the `.ai/` memory, prompt, playbook, and report scaffold.
- Ran five adversarial review passes and tightened prompt usability, instruction precedence, and safety boundaries.
- Identified remaining manual questions around Docker service naming in docs, minimum Node version drift, and deployment wrapper ownership.

### Railway Confirmation And Node Alignment

- Logged into Railway CLI with browserless auth and linked the repo to project `ravishing-flow`.
- Confirmed live production services `marpex_crm`, `Postgres`, and `web`.
- Verified API build on Node `22.22.2` from the `06_IMPLEMENTATION` workspace and verified web Dockerfile deployment on `node:22-alpine`.
- Synced the Launch Checklist, Railway guides, and `.ai/open-questions.md` to the verified Node 22 and deployment facts.

### Customer Revenue Split, Task Toggle, And Local DB Recovery

- Replaced the customer list `Revenue` column with current-year and previous-year ABRA revenue fields in the API list payload and web table.
- Made opportunity tasks reversible by allowing `PATCH /api/tasks/:id/complete` to accept `completed: false` and by removing the one-way checkbox lock in the UI.
- Added focused web tests for `CustomersPage` and `OpportunityDetailPage`.
- Expanded integration coverage for yearly customer revenue fields and reversible task completion.
- Confirmed focused web tests and `cd 06_IMPLEMENTATION && npm run typecheck` passed.
- Diagnosed local integration DB drift: `drizzle.__drizzle_migrations` only recorded `0001` and `0002`, while ABRA tables from `0003` already existed and newer columns were missing.
- Recovered the local integration target by backfilling the local Drizzle ledger for `0003` to `0005`, reran `cd 06_IMPLEMENTATION && npm run db:migrate`, and then confirmed `cd 07_TEST_SUITE && npm run test:integration` passed 19/19.

## 2026-04-27

### SourceData Customers And Login Hardening

- Inspected the six `SourceData/*.xlsx` workbooks and confirmed 687 unique customer rows with shared identity, address, revenue, and profit columns.
- Added a separate customer `industry` enum and the requested SourceData-backed fields across the shared domain schema, API DB schema, customer routes, web customer pages, and additive migration `0007_customer_source_data_fields.sql`.
- Added `apps/api/src/lib/source-customers.ts` and rewired `apps/api/src/seed.ts` so local seeding replaces generated demo customers with the Excel-derived customer set.
- Hardened `apps/web/src/lib/api.ts` so `VITE_API_URL` works with or without `/api`, and updated `LoginPage` to surface rate-limit and network errors instead of only invalid credentials.
- Synced OpenAPI and Railway or launch docs to the new customer contract and normalized `VITE_API_URL` guidance.
- Validated with `cd 06_IMPLEMENTATION && npm run typecheck` and `cd 06_IMPLEMENTATION && npm run phase5:test:web`; both passed.
- Extended the nearest customer integration test in `07_TEST_SUITE/integration/api.spec.ts` for `industry`, SourceData fields, and profit updates.
- Started Docker Desktop, brought up `docker compose` PostgreSQL locally, and confirmed the focused DB-backed customer integration scenario passes after local migrate and seed.
- Fixed `xlsx` default export interop in `apps/api/src/lib/source-customers.ts` after local `db:seed` failed at runtime.
- Fixed ABRA foreign-key cleanup ordering in `apps/api/src/seed.ts` so reseeding seeded customers no longer violates `abra_revenues_customer_id_fkey`.
- Pushed validated commits to `origin/main`, triggered Railway redeploys for `marpex_crm` and `web`, and confirmed both services reached `SUCCESS`.
- Added `06_IMPLEMENTATION/SourceData` because the Railway API service builds from the workspace root and otherwise could not see the Excel files during production seed.
- Ran `npm -w apps/api run db:migrate` and `npm -w apps/api run db:seed` inside the live `marpex_crm` Railway service via SSH; both passed after the workspace-local SourceData copy was deployed.
- Verified live production smoke checks: API health `200`, web root `200`, and authenticated manager login plus `/api/customers` access `200`.

### Salesperson Planner Discovery

- Verified that both visits and opportunities already store `nextStepDeadline` and that users enter these values from existing visit and pipeline forms.
- Confirmed the dashboard route already scopes visits and opportunities by the logged-in user role, which makes it the smallest safe place to aggregate upcoming work items.
- Chose a minimal slice: extend dashboard API payload with upcoming next steps, add a dedicated planner page in the web app, add focused tests, and sync docs.
- Implemented the planner endpoint and web screens, then tightened the slice after review by making the planner salesperson-only, removing the extra dashboard fetch, and surfacing UI error states.
- Confirmed focused web tests and `cd 06_IMPLEMENTATION && npm run typecheck` passed.
- Attempted `cd 07_TEST_SUITE && npm run test:integration -- api.spec.ts`, but local PostgreSQL was unavailable on `localhost:5432`, so DB-backed validation remains blocked.
- Confirmed on the live deploy that `obchodnik1` only sees 1 planner item while `obchodnik3` sees 114, which exposed the demo-owner distribution bug in `src/seed.ts`.
- Updated future demo seeding to include all sales demo accounts, added a dry-run-by-default demo-owner rebalance script for existing data, and added Vite legacy output for Safari.
- Confirmed `npm install -w apps/web -D @vitejs/plugin-legacy@^6.1.0`, `npm run typecheck`, and `npm -w apps/web run build` passed.
- Tried a Railway-backed dry run of the rebalance script, but the injected `postgres.railway.internal` host is not reachable from the local shell, so the live backfill must be run from inside the deployed service environment.
- Ran a strict review of the rebalance script, then tightened it to require the exact demo owner allowlist, scope visits and tasks to seeded records only, update the initial seeded stage-history author with opportunity owner changes, and close the shared DB pool.
- Re-ran `get_errors` on the rebalance script and `cd 06_IMPLEMENTATION && npm run typecheck`: both passed.
- Final reduced-assurance review found no remaining concrete code defects; only the live Railway `--write` execution and Safari runtime smoke test remain as operational checks.

## 2026-04-28

### Customer Plan And Demo Data Cleanup

- Inspected the customer list and detail pages, customer route contract, CSV import flow, and seed script.
- Confirmed that `annualRevenuePlan` already models the manual customer plan, while `potential` is only a seeded derived value and `profit` plus `strategicCategory` are currently carried mainly by UI or import surfaces.
- Confirmed the current seed attaches contacts, visits, opportunities, tasks, and ABRA demo data to every SourceData customer, which is the root cause of the imported-customer pollution the user wants removed.
- Replaced the customer-facing `Potenciál` column with `Plán` backed by `annualRevenuePlan`, and removed customer `Kategória` plus `Zisk` from the web customer flow and the documented API contract.
- Removed legacy `category` and `potential` fields from the CSV customer import flow and updated the matching import UI help, integration coverage, and E2E fixtures.
- Split `apps/api/src/seed.ts` into two datasets: all SourceData customers are now inserted clean under a dedicated source-system marker, while only six synthetic demo companies receive contacts, visits, opportunities, tasks, and ABRA demo data.
- Validated with `cd 06_IMPLEMENTATION && npm run typecheck` and focused web Vitest runs for customer list, customer detail, and import page; DB-backed integration revalidation stayed blocked because no local PostgreSQL target or Docker engine was available on this workstation.

### Customer Grid Modernization And Legacy Column Drop Migration

- Replaced the customers-page search and filter bar with a sortable in-table grid using per-column header filters.
- Removed the `Segment` column from the customer list, added `Okres`, and renamed the lead revenue header to `Tržby Finstat 24/25`.
- Kept the new grid client-side because the existing customers API does not expose per-column sort or filter parameters for the requested fields.
- Added forward-safe migration `apps/api/drizzle/0008_drop_legacy_customer_columns.sql` and journal entry `_journal.json` to drop `profit`, `potential`, and `strategic_category`.
- Removed those legacy fields from the active Drizzle schema, customer API route handling, and shared customer domain exports.
- Added a sticky two-row header and vertical scroll container to the new customer grid so sort and filter controls remain visible.
- Started Docker Desktop locally, brought up `docker compose` PostgreSQL, and confirmed `cd 06_IMPLEMENTATION && npm run db:migrate` applied the new drop migration on the disposable DB target.
- Verified with direct SQL queries that the `customers` table no longer has `profit`, `potential`, or `strategic_category` and that the `strategic_category` enum type is gone.
- Validated with `cd 06_IMPLEMENTATION && npx vitest run tests/web/customers-page.spec.tsx --config vitest.phase5.config.ts`, `cd 06_IMPLEMENTATION && npm run typecheck`, and `cd 06_IMPLEMENTATION && npm run build`; all passed.

## 2026-04-29

### Railway Login Failure Root Cause And Fix

- Confirmed in live Railway production logs that the user's reported `~10:36` incident matches a burst of `POST /api/auth/login` failures from one IP around `08:35Z`, followed by `429` rate limiting after repeated retries.
- Reproduced the production bug directly against the live API: `obchodnik1@marpex.sk / sales123` returned `200`, while `Obchodnik1@marpex.sk / sales123` returned `401`, proving case-sensitive email matching in the auth query.
- Patched `apps/api/src/routes/auth.ts` so login trims and lowercases the email input and compares against `lower(users.email)`, which also covers any existing mixed-case rows.
- Patched `apps/api/src/routes/users.ts` so newly created user emails are stored lowercase and do not reintroduce the same mismatch.
- Added a focused integration test in `07_TEST_SUITE/integration/api.spec.ts` for successful login with uppercase email input.
- Validation: `cd 06_IMPLEMENTATION && npm run typecheck` passed, and `get_errors` on the touched files reported no errors.
- DB-backed integration validation is currently blocked in this shell because PostgreSQL is not reachable on `localhost:5432`.
- Committed the fix as `7b0b771` and pushed it to `origin/main`.
- Triggered an explicit Railway API redeploy with `railway redeploy -s marpex_crm -y`; deployment `65c797d3-64c9-4be3-a8ac-00fd43abadd9` reached `SUCCESS`.
- Live smoke verification passed after deploy: direct mixed-case login returned `200`, the production web login form redirected to `/dashboard`, and `GET /api/auth/me` returned the expected salesperson payload in the authenticated session.

### Safari Login Cookie Persistence Fix

- Inspected the live Railway web service and confirmed the current production frontend still used `VITE_API_URL=https://marpexcrm-production.up.railway.app` while its runtime was only `serve`, with no `/api` proxy.
- Correlated that setup with the user symptom: Safari can accept the `200` login response body but still block the cross-site session cookie, which then causes the next authenticated request to fail.
- Replaced the web runtime in `apps/web/Dockerfile` with `nginx:alpine`, wired `apps/web/nginx.conf` as a template-backed `/api` reverse proxy to `${RAILWAY_SERVICE_MARPEX_CRM_URL}`, and updated `apps/web/src/lib/api.ts` to prefer same-origin `/api` whenever a configured API base would otherwise be cross-origin.
- Added a focused regression test in `06_IMPLEMENTATION/tests/web/api.spec.ts` covering the same-origin proxy resolution rule.
- Validated locally with `cd 06_IMPLEMENTATION && npx vitest run tests/web/api.spec.ts --config vitest.phase5.config.ts` and `cd 06_IMPLEMENTATION && npm -w apps/web run build`; both passed.
- Updated the Railway web deployment guide to use `VITE_API_URL=/api` and document the Safari-safe same-origin proxy flow.
- Updated the live Railway web service variable with `railway variable set VITE_API_URL=/api -s web --skip-deploys`, committed the fix as `c1297ac`, pushed it to `origin/main`, and triggered `railway redeploy -s web -y`.
- Railway web deployment `769e9f6b-3f6a-4946-a542-35c6815dca33` reached `SUCCESS` on the nginx runtime.
- Live smoke verification passed after deploy: login with `Obchodnik1@marpex.sk / sales123` reached `/dashboard`, same-origin `GET /api/auth/me` returned `200`, and web logs showed successful `/api/auth/me` and `/api/dashboard` traffic from the web origin.

## 2026-04-30

### Customer Owner And Resolver Model

- Kept `customers.salesperson_id` as the internal owner field, added the new `customer_resolvers` join table, and exposed the clearer `ownerId` or `ownerName` plus `resolverIds` or `resolverNames` customer contract across domain, API, and web.
- Updated the customers list UI to rename `Obchodník` to `Vlastník`, add `Riešitelia`, and allow manager-side owner or resolver assignment in both create and detail edit flows.
- Updated the dashboard so salesperson KPIs and top deals use firms where the user is the owner or one of the resolvers, while the planner preview stays tied to the salesperson's own visits and opportunities.
- Added focused web regression coverage for customers list, customer detail, and dashboard; `cd 06_IMPLEMENTATION && npx vitest run tests/web/customers-page.spec.tsx tests/web/customer-detail-page.spec.tsx tests/web/dashboard-page.spec.tsx --config vitest.phase5.config.ts` passed.
- Rebuilt the domain package and confirmed `cd 06_IMPLEMENTATION && npm -w packages/domain run build && npm run typecheck` passed.
- Updated focused integration coverage in `07_TEST_SUITE/integration/api.spec.ts`, but DB-backed execution is currently blocked by `ECONNREFUSED` because PostgreSQL is not reachable on `localhost:5432` in this shell.

### Salesperson Ownership And Default Mine Scope

- Added customer-level `salespersonId` in the shared domain schema, API DB schema, and forward-safe migration `0009_customer_salesperson_scope.sql`.
- Scoped `/api/customers`, `/api/dashboard`, `/api/visits`, and `/api/opportunities` to the logged-in salesperson by default, with an explicit `scope=all` opt-out that preserves broader read access when intentionally requested.
- Updated dashboard, customers, visits, pipeline, and pipeline-stage detail pages so a salesperson sees `mine` by default and can switch to `all`; managers stay on the full portfolio by default.
- Added customer salesperson display plus manager-side reassignment UI on the customer detail and create flows.
- Added focused web regression coverage for dashboard, customers, customer detail, visits, and pipeline scope toggles; all targeted web tests passed.
- Added focused integration coverage for customer and activity scope behavior, but execution is blocked in this shell because PostgreSQL on `localhost:5432` is unavailable (`ECONNREFUSED`).
- Generated the five requested salesperson credentials into the local ignored file `PRIVATE_SALES_CREDENTIALS_2026-04-29.md` so the data can be shared without committing plaintext passwords to git.

## Logging Rules

- Append short factual entries only.
- Record what was changed, what was validated, and what remains unresolved.
- Do not copy long diffs or verbose reasoning into this file.