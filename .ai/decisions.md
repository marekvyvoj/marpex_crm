# Decisions

## 2026-04-26

### Treat `06_IMPLEMENTATION` As The Code Root

- Decision: Repository instructions and playbooks treat `06_IMPLEMENTATION/` as the authoritative application workspace.
- Why: Root-level scripts are mainly deployment wrappers, while the real app workspaces, tests, docs, and package scripts live under `06_IMPLEMENTATION/`.

### Keep Instructions Layered

- Decision: Use `.github/copilot-instructions.md` for repo-wide rules and `.github/instructions/*.instructions.md` for path-specific guidance.
- Why: The repo spans API, web, domain, tests, docs, and deployment config. A single instruction file would either be too broad or too generic.

### Keep `AGENTS.md` As Workflow, Not Coding Style

- Decision: `AGENTS.md` defines role-switching, review gates, and memory discipline, while `copilot-instructions.md` carries coding rules.
- Why: The user explicitly requested both files, and separating workflow from coding rules keeps each file narrow enough to remain useful.

### Preserve Existing Production Behavior By Default

- Decision: Do not modify deployment or runtime files during setup unless the workflow itself requires it.
- Why: The repository already has environment-specific deployment wrappers and documented Railway fixes. The safe setup is to document risks and mismatches rather than make speculative runtime edits.

### Retire The Legacy Root Instruction Surface

- Decision: Reduce the root `.instructions.md` file to a compatibility pointer and make `.github/copilot-instructions.md` plus `.github/instructions/*.instructions.md` authoritative.
- Why: The older root file contained stale product and architecture constraints that would conflict with the current repository state.

### Separate Manual Templates From Real Workspace Prompts

- Decision: Keep `.ai/prompts/` as human-readable copy-paste templates and create real slash prompts under `.github/prompts/`.
- Why: The user requested `.ai/prompts/*`, but Copilot discovers prompt files from `.github/prompts/*.prompt.md`.

### Require Stronger Guards For High-Risk Mutating Work

- Decision: Treat migrations, seed commands, deployment-affecting commands, and auth or env rollout work as high-risk operations that require explicit user approval or an explicitly confirmed local disposable target.
- Why: The reviewer passes agreed that the initial workflow was too permissive for mutating actions with production or data risk.

### Model Customer Plan As Current-Year Fields For Now

- Decision: Implement customer plan tracking as `annualRevenuePlan` plus `annualRevenuePlanYear` directly on the `customers` table and evaluate progress only when the stored year matches the current year.
- Why: The request required current-year progress against ABRA actuals, but the repo had no existing yearly plan model or ABRA plan source. This keeps the change small and usable now while leaving room for a later dedicated yearly-plan table if historical planning becomes necessary.

### Recover Local Integration DB By Repairing The Ledger First

- Decision: For the local `07_TEST_SUITE` PostgreSQL target, recover migration drift by backfilling `drizzle.__drizzle_migrations` for already-present `0003` to `0005`, then rerun `0006` instead of replaying older SQL or resetting the database.
- Why: The local schema already contained ABRA tables from `0003`, but the ledger only recorded `0001` and `0002`, so a normal `drizzle-kit migrate` retried `0003` and failed on existing relations. Repairing the local ledger preserved data, kept the recovery minimal, and let the forward-safe `0006` migration add the missing columns cleanly.

## 2026-04-27

### Build The Planner Over Existing Next-Step Deadlines

- Decision: Implement the salesperson planner by aggregating `nextStepDeadline` values from existing `visits` and open `opportunities`, exposed through `GET /api/dashboard/planner` and rendered in a dedicated `Plán práce` screen plus a dashboard preview.
- Why: The repository already stores next-step dates in both workflows and already scopes dashboard data by the logged-in user. Reusing that surface delivered the feature without schema changes, duplicate task storage, or a second source of truth.

### Fix Demo Planner Visibility At The Seed Layer

- Decision: Fix planner visibility for demo sales accounts by changing seed ownership distribution and by adding a one-time rebalance script for already-seeded demo data.
- Why: Live verification showed the planner endpoint was behaving correctly, but the current demo seed excluded `obchodnik1` and `obchodnik2` from seeded visits and opportunities, so those users had almost nothing to test against.

### Add Legacy Safari Bundles In Vite

- Decision: Add `@vitejs/plugin-legacy` to the web build with Safari and iOS Safari targets instead of trying to guess a single runtime API bug.
- Why: The repository had no strong global Safari runtime culprit in app code, while the Vite build had no legacy browser output at all. A legacy bundle is the smallest broad compatibility hardening for older WebKit clients.

### Keep Demo Rebalance Strictly Bound To Seed Artifacts

- Decision: Require the fixed demo email allowlist in the rebalance script, limit visits and tasks to seed-shaped records, and only rewrite the initial seeded opportunity stage-history author when reassigning owners.
- Why: The reviewer correctly flagged that a broader mutation could reassign live user data or leave seeded history inconsistent. This keeps the one-time backfill narrowly aligned with what the seed actually created.