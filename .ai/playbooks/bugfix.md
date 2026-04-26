# Bugfix Playbook

## Trigger

Use this when the repository already has a failing behavior and the goal is to fix it safely.

## Steps

1. Reproduce or narrow the failure using the smallest available test or command.
2. Inspect the controlling code path before editing.
3. If the fix touches migrations, seed commands, deployment wrappers, auth or session rollout, env handling, or secrets, stop unless the user has approved the risky work or explicitly confirmed a local disposable target.
4. State one local hypothesis.
5. Make one minimal edit in the controlling slice.
6. Rerun the same narrow validation immediately.
7. If the hypothesis is wrong, move one hop closer to the real owner instead of broadening the search.
8. Update `.ai/task-log.md` and `.ai/open-questions.md` if the bug exposed stale docs or unclear ownership.

## Common Hot Spots In This Repo

- `06_IMPLEMENTATION/apps/api/src/app.ts` for auth, cookies, CORS, and public route handling
- `06_IMPLEMENTATION/apps/api/src/routes/auth.ts` for login flow and rate limiting
- `06_IMPLEMENTATION/apps/web/src/lib/api.ts` for authenticated fetch behavior
- `06_IMPLEMENTATION/packages/domain/src` for pipeline and validation rules
- `06_IMPLEMENTATION/apps/api/src/seed.ts` plus integration or E2E tests when seeded data assumptions drift

## Exit Criteria

- The failing behavior has a passing focused validation, or the exact blocker is documented.
- Critical work received reviewer and security passes.
- No unrelated files were changed without reason.