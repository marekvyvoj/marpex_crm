---
description: "Debug a Marpex CRM issue by finding the controlling code path, stating a falsifiable hypothesis, and running focused validation."
name: "Marpex Debugging"
argument-hint: "Describe the failing behavior or reproduction"
agent: "agent"
---

Use the prompt argument as the bug report.

Debugging rules:

- inspect the smallest owning surface first
- for API issues, check `06_IMPLEMENTATION/apps/api/src/app.ts`, the owning route, related domain logic, and the nearest integration or phase5 tests
- for auth issues, also inspect `06_IMPLEMENTATION/apps/api/src/routes/auth.ts`
- for web issues, check the owning page or component, `06_IMPLEMENTATION/apps/web/src/lib/api.ts`, and the nearest web or E2E tests
- for data issues, check `06_IMPLEMENTATION/apps/api/src/db`, `06_IMPLEMENTATION/apps/api/src/seed.ts`, and the tests that depend on seeded records
- if the task touches migrations, seed commands, deployment wrappers, auth or session rollout, env handling, or secrets, stop unless the user has approved the risky work or explicitly confirmed a local disposable target
- state one falsifiable local hypothesis before editing
- after the first substantive edit, rerun the narrowest validation that can falsify the hypothesis

Return:

- root cause
- files changed
- commands run and outcomes
- unresolved risks or reproduction gaps