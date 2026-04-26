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

## Logging Rules

- Append short factual entries only.
- Record what was changed, what was validated, and what remains unresolved.
- Do not copy long diffs or verbose reasoning into this file.