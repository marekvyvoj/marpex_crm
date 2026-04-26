# Debugging Prompt Template

Status: Manual copy-paste template. The slash-command version lives in `.github/prompts/debugging.prompt.md`.

Use this prompt when a behavior is broken and the controlling code path is not obvious.

```text
Act as DISCOVERY_AGENT and TEST_VALIDATION_AGENT first, then IMPLEMENTER_AGENT.

Bug report:
<describe the failing behavior>

Debugging rules:
- inspect the smallest owning surface first
- for API issues, check 06_IMPLEMENTATION/apps/api/src/app.ts, the owning route, related domain logic, and the nearest integration or phase5 tests
- for auth issues, also inspect 06_IMPLEMENTATION/apps/api/src/routes/auth.ts
- for web issues, check the owning page or component, 06_IMPLEMENTATION/apps/web/src/lib/api.ts, and web or e2e tests
- for data issues, check 06_IMPLEMENTATION/apps/api/src/db, 06_IMPLEMENTATION/apps/api/src/seed.ts, and the tests that depend on seeded records
- if the task touches migrations, seed commands, deployment wrappers, auth/session rollout, env handling, or secrets, stop unless the user has approved the risky work or explicitly confirmed a local disposable target
- state one falsifiable hypothesis before editing
- run the narrowest validation after the first substantive edit

Required output:
- root cause
- files changed
- commands run and outcomes
- any unresolved risks or reproduction gaps
```