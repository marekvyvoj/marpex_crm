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

## Logging Rules

- Append short factual entries only.
- Record what was changed, what was validated, and what remains unresolved.
- Do not copy long diffs or verbose reasoning into this file.