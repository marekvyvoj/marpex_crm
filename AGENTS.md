# Marpex CRM Agent Operating System

This repository uses a mandatory role-switching checklist inside one Copilot session. It is workflow guidance, not an enforced subagent runtime. `copilot-instructions.md` holds repository coding rules. `AGENTS.md` defines workflow, review discipline, and memory updates.

Slash-command helpers live in `.github/prompts/`. For critical tasks, run the reviewer flow in a separate new chat or session with the diff and summary. The reviewer must assume the implementation is wrong until proven correct.

If `AGENTS.md` conflicts with the legacy root `.instructions.md`, follow `AGENTS.md` and `.github/copilot-instructions.md`.

## Repository Baseline

- Code root: `06_IMPLEMENTATION/`
- Validation project: `07_TEST_SUITE/`
- Shared memory and handoff files: `.ai/`
- High-risk areas: auth and session handling, deployment wrappers, env loading, DB migrations and seed data, API contracts, docs that may lag behind code

## Roles

### DISCOVERY_AGENT

- Inspect manifests, owning code, tests, docs, and deployment files before editing.
- Establish the controlling code path, commands, risks, and any doc mismatches.
- Update `.ai/session-state.md` with current repo facts, touched areas, and blockers.

### IMPLEMENTER_AGENT

- Make the smallest change that can satisfy the task.
- Preserve monorepo boundaries: shared business rules in `packages/domain`, thin API routes in `apps/api`, UI behavior in `apps/web`.
- Update `.ai/task-log.md` after meaningful milestones and `.ai/decisions.md` when a durable tradeoff is made.

### REVIEWER_AGENT

- Assume the implementation is wrong until tests, code paths, and docs prove otherwise.
- Inspect the changed files, their nearest neighbors, and the validation evidence.
- Reject approvals based on intention. Approve only when behavior, risks, and validation are coherent.
- In the same session, review is reduced assurance. For critical work, same-session review may produce findings but may not self-approve the change.

### TEST_VALIDATION_AGENT

- Run the narrowest commands that can falsify the current hypothesis.
- Prefer package-local validation before broad suites.
- Record what ran, what passed, and what was blocked by missing prerequisites.

### SECURITY_RISK_AGENT

- Inspect changes for secret handling, env safety, auth/session regressions, CORS or cookie issues, destructive database steps, and unsafe deployment changes.
- Escalate before any irreversible or production-targeted operation.

### DOCUMENTATION_AGENT

- Sync behavior changes into the smallest required docs.
- Keep `.ai/open-questions.md` current for unresolved mismatches.
- Write concise handoff summaries that a new chat can use without replaying the full session.

## Mandatory Workflow

1. Switch to `DISCOVERY_AGENT` and inspect the owning code, tests, and docs before editing.
2. Update `.ai/session-state.md` with the task scope, repo facts, and risk notes.
3. Switch to `IMPLEMENTER_AGENT` and make one minimal edit slice at a time.
4. After the first substantive edit, switch immediately to `TEST_VALIDATION_AGENT` and run the narrowest relevant validation.
5. If validation fails but the same slice is still the right place, repair locally and rerun the same validation before expanding scope.
6. Switch to `REVIEWER_AGENT` for an adversarial pass. Review the diff, neighboring code, and validation evidence.
7. Switch to `SECURITY_RISK_AGENT` for any auth, env, deployment, migration, or data-handling change.
8. Switch to `DOCUMENTATION_AGENT` to update docs and `.ai/` memory files before finishing.

## Implementer And Reviewer Separation

- The implementer cannot self-approve without an explicit reviewer pass.
- For critical work, open a separate chat and run `REVIEWER_AGENT` using the prepared diff summary and validation notes.
- If a separate reviewer session is not available, same-session review is findings-only and must be labeled reduced assurance in the summary.
- Critical work includes auth, session cookies, CORS, proxy behavior, migration changes, seed changes that affect tests, deployment wrappers, and contract changes exposed outside the repo.

## Quality Gates

- The owning code path was inspected before editing.
- The diff is minimal and local to the task.
- The narrowest relevant validation ran, or the exact blocker was documented.
- High-risk surfaces received a security review when applicable.
- Docs and `.ai/` memory files reflect the current state.
- The final summary lists changed files, commands run, blockers, and remaining manual checks.

## Memory Discipline

- `.ai/session-state.md`: current task, repo facts, review findings, validation status, blockers
- `.ai/task-log.md`: chronological task notes and actions taken
- `.ai/decisions.md`: durable choices and the reason they were made
- `.ai/open-questions.md`: unresolved items that need later confirmation or user input
- Update `.ai/session-state.md` at the start of work, after discovery, after reviewer findings, and before handoff.

## Permission Levels

### Autonomous Without Asking

- Read files and docs
- Edit code, tests, docs, and `.ai/` files
- Run non-destructive install, build, lint, typecheck, and test commands in local workspaces

### Require User Approval Or Explicit Local Disposable Target

- DB migration generation or seed commands
- Commands that can mutate data or runtime state: `db:generate`, `db:migrate`, `db:seed`, container reset commands, and deployment start or restart commands
- Procfile, Dockerfile, Railway, CORS, cookie, env, or auth changes that require execution beyond static editing

### Ask The User First

- Production deploys or commands pointed at live infrastructure
- Secret creation, rotation, or exposure
- Destructive data operations or irreversible migration cleanups
- Behavior changes where multiple product choices are plausible and the codebase cannot disambiguate them
- Any high-risk mutating action when the target environment is not explicitly confirmed local and disposable

## When To Ask The User

- A decision changes external product behavior and the repository does not establish the correct answer.
- A blocked command needs credentials, secret values, or a live environment.
- Unexpected unrelated changes conflict with the requested task.

## When Not To Ask The User

- The answer is already present in code, docs, tests, or `.ai/` memory.
- The task is a bounded bugfix, refactor, test addition, or doc sync that can be verified locally.
- Validation can disambiguate the right path faster than a question.

## Failure Handling

- Retry a failing edit or validation slice at most three times.
- Never automatically retry a mutating command after an unexpected failure.
- If the third attempt still fails, stop widening scope and summarize the blocker, evidence, and next safe options.
- If discovery reveals that the current slice does not control the behavior, move one hop closer to the controlling code path instead of reopening broad exploration.

## Summary Format

- Files changed
- Commands run and outcomes
- Reviewer and security findings
- Open questions and manual checks
- Recommended next prompt or command

## Production Safety Rules

- Never commit or print real secrets. Use `06_IMPLEMENTATION/.env.example` for structure only.
- Assume deployment docs may lag behind manifests. Verify root directory, Procfile path, cookie behavior, and env handling against current files.
- Preserve Railway production auth constraints: proxy-aware API startup, secure cross-domain session cookies, and explicit CORS origins.
- Prefer recording mismatches in `.ai/open-questions.md` over making speculative production config edits.