# AI Workflow Setup Report

Status: Setup completed and reviewed on 2026-04-26. Manual confirmation is still required for a few doc and deployment mismatches.

## Repository Detection Summary

This setup was tailored from live repository files rather than generic templates.

- Primary language: TypeScript, with SQL migrations, Markdown docs, and shell wrappers
- App structure: npm-workspaces monorepo under `06_IMPLEMENTATION/`
- API: Fastify 5 in `06_IMPLEMENTATION/apps/api`
- Web: React 19 plus Vite and Tailwind in `06_IMPLEMENTATION/apps/web`
- Shared business logic: `06_IMPLEMENTATION/packages/domain`
- Validation project: `07_TEST_SUITE/` with Vitest and Playwright
- Database: PostgreSQL 16 plus Drizzle ORM
- Existing docs: `06_IMPLEMENTATION/README.md`, `06_IMPLEMENTATION/docs/`, `docs/`, and the numbered root markdown files
- Existing deployment surfaces: root `package.json`, `Procfile`, `web.Procfile`, `start.sh`, `06_IMPLEMENTATION/api.Procfile`, Dockerfiles, and Railway docs
- Existing coding standards: TypeScript ESM, double quotes, semicolons, shared domain rules, DB `snake_case`, TS and JSON `camelCase`, pipeline IDs in `snake_case`

No GitHub Actions workflow files were detected during setup. Current automation is script- and wrapper-driven rather than CI-workflow-driven.

## Files Created Or Updated

### Repository-Wide Guidance

- `.github/copilot-instructions.md`
	- Global coding rules, validation guidance, architecture notes, repo-specific commands, and safety boundaries.
- `AGENTS.md`
	- Role-switching checklist, reviewer separation, quality gates, memory discipline, and stop conditions.
- `.instructions.md`
	- Reduced to a legacy compatibility pointer so stale repository guidance no longer conflicts with the new setup.

### Path-Specific Instructions

- `.github/instructions/api.instructions.md`
- `.github/instructions/web.instructions.md`
- `.github/instructions/domain.instructions.md`
- `.github/instructions/database.instructions.md`
- `.github/instructions/tests.instructions.md`
- `.github/instructions/docs.instructions.md`
- `.github/instructions/config.instructions.md`

These files keep Copilot guidance scoped to the real owning paths in this repo instead of loading one broad generic rule set everywhere.

### Prompts

- `.github/prompts/autonomous-task.prompt.md`
- `.github/prompts/reviewer.prompt.md`
- `.github/prompts/handoff.prompt.md`
- `.github/prompts/debugging.prompt.md`

These are real workspace prompt files for Copilot slash-command discovery.

- `.ai/prompts/autonomous-task.prompt.md`
- `.ai/prompts/reviewer.prompt.md`
- `.ai/prompts/handoff.prompt.md`
- `.ai/prompts/debugging.prompt.md`

These remain as manual copy-paste templates and durable repo-local references.

### Memory And Handoff Files

- `.ai/session-state.md`
	- Current repo facts, validation performed, review results, blockers, handoff summary, and next action.
- `.ai/task-log.md`
	- Short chronological record of setup and later task work.
- `.ai/decisions.md`
	- Durable workflow decisions and why they were made.
- `.ai/open-questions.md`
	- Doc mismatches and unresolved deployment questions that still need human confirmation.

### Playbooks

- `.ai/playbooks/feature-implementation.md`
- `.ai/playbooks/bugfix.md`
- `.ai/playbooks/code-review.md`
- `.ai/playbooks/session-handoff.md`

These are concise operational checklists tuned to the repo layout, validation commands, and known risk areas.

### Report

- `.ai/AI_WORKFLOW_SETUP_REPORT.md`
	- This file explains the tailored setup, reviewer findings, usage guidance, and remaining manual checks.

## Commands Discovered

### From `06_IMPLEMENTATION/`

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
- `npm run phase5:coverage`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`

### From `07_TEST_SUITE/`

- `npm install`
- `npm run test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:web`
- `npm run coverage`
- `npm run test:e2e`
- `npm run test:load:smoke`

### Root-Level Wrappers

- `npm run start`
- `npm run build`

These root-level commands are mainly deployment wrappers and should not be treated as the default development entrypoints.

## How The Setup Was Tailored

The setup is built around the actual repository split:

- `06_IMPLEMENTATION` is the application workspace and owns nearly all code changes.
- `07_TEST_SUITE` owns broader validation and DB-backed or E2E scenarios.
- The repo intentionally keeps Fastify routes thin and business rules in `packages/domain`, matching ADR 0001.
- API error handling and pagination rules are codified in ADR 0002 and were pulled into the instruction set.
- Deployment and auth safety rules reference the actual `app.ts`, `env.ts`, Railway docs, and repository memory about proxy-aware secure cookies.
- Reviewers identified that the old root `.instructions.md` conflicted with current repo behavior, so it was reduced to a compatibility pointer.
- Reviewers also flagged that `.ai/prompts` would not be usable as actual Copilot prompts, so real workspace prompts were added under `.github/prompts/`.

## Assumptions Made

- The user wanted the required `.ai/` directories and files versioned in the repository rather than kept local-only.
- `06_IMPLEMENTATION/README.md`, the ADRs, manifests, and config files outrank older ad hoc notes when instructions conflict.
- The workflow should be safe for low-risk local coding tasks immediately, but not automatically authorized for high-risk autonomous operations.
- Prompt usability mattered enough to justify adding `.github/prompts/` in addition to the required `.ai/prompts/` files.

## Reviewer Findings And Fixes Applied

Five read-only reviewer passes were simulated with different focuses: repository fit, Copilot usability, autonomy safety, quality gates, and documentation clarity.

Fixes applied after review:

- corrected repo-root path drift in debugging and bugfix materials
- added real workspace prompt files under `.github/prompts/`
- converted `.ai/prompts/` into manual template references rather than pretending they are slash prompts
- tightened safety boundaries for migrations, seed commands, deployment, auth, cookie, and env-sensitive work
- made reviewer flow read-only by default and disallowed same-session approval for critical work
- expanded config and docs instruction coverage to include real repo files such as `06_IMPLEMENTATION/.env.example`, `06_IMPLEMENTATION/apps/web/nginx.conf`, and `06_IMPLEMENTATION/README.md`
- reduced the legacy root `.instructions.md` to a compatibility pointer
- replaced placeholder review state with concrete validation and blocker notes in `.ai/session-state.md`

## How To Use The Workflow Tomorrow

### Start A New Autonomous Task

Use the workspace prompt in `.github/prompts/autonomous-task.prompt.md`, or copy the fallback template from `.ai/prompts/autonomous-task.prompt.md`.

Expected flow:

1. discovery first
2. update `.ai/session-state.md`
3. implement a minimal change
4. run the narrowest validation
5. run reviewer and security passes for critical work
6. update `.ai/task-log.md`, `.ai/decisions.md`, and `.ai/open-questions.md`

### Trigger Implementer Or Reviewer Workflow

- Implementer: run the autonomous-task prompt with a concrete task and validation target.
- Reviewer: run `.github/prompts/reviewer.prompt.md` in a separate chat for critical changes, passing the diff and summary.
- Handoff: run `.github/prompts/handoff.prompt.md` in a new chat after reading the `.ai/` memory files.
- Debugging: run `.github/prompts/debugging.prompt.md` with a failing behavior or reproduction.

### Memory Discipline

- `.ai/session-state.md` is the canonical current-state snapshot and handoff summary.
- `.ai/task-log.md` records short factual events.
- `.ai/decisions.md` stores durable workflow choices.
- `.ai/open-questions.md` captures unresolved mismatches that should not be silently flattened.

## Validation Performed During Setup

- Read the relevant manifests, README, ADRs, deployment docs, env template, and test configs.
- Verified that `.github/instructions/*.instructions.md` exist and contain frontmatter keys.
- Checked `.github/copilot-instructions.md` and `AGENTS.md` for workspace errors.
- Ran five read-only reviewer passes and incorporated safe fixes.
- Logged into Railway CLI, linked the repo to the live project, confirmed live services, and inspected production build logs for both API and web.

No application build, typecheck, lint, or test command was required for the workflow setup itself. The later follow-up verification used Railway CLI and workspace validation rather than source-code test runs.

## Remaining Manual Confirmation

- None from the original setup questions. They were resolved on 2026-04-26 by live Railway CLI inspection and doc updates.
- Future deployments can still drift, so Railway service settings should be rechecked if the deployment strategy changes.

## Risks And Limitations

- `AGENTS.md` remains workflow guidance, not an actually enforced isolated-agent runtime.
- Same-session review can find problems but is not treated as approval for critical work.
- Some deployment docs still appear stale relative to manifests and runtime files.
- This setup intentionally avoids making speculative source or production-config changes.

## Recommended Next Step

Use `.github/prompts/autonomous-task.prompt.md` for the next real repo task. The playbooks under `.ai/playbooks/` are reference material, not required context for every request.