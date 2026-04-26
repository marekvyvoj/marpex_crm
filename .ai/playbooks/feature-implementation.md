# Feature Implementation Playbook

## Trigger

Use this when adding a new feature or expanding an existing workflow in the Marpex CRM app.

## Steps

1. Read the owning manifest, implementation files, and nearest tests.
2. Check whether the feature belongs in `apps/api`, `apps/web`, `packages/domain`, or a combination.
3. If the task touches migrations, seed commands, deployment wrappers, auth or session rollout, env handling, or secrets, stop unless the user has approved the risky work or explicitly confirmed a local disposable target.
4. If the feature changes business rules, update `packages/domain` first.
5. Implement the smallest vertical slice that proves the feature end to end.
6. Add or update the nearest tests.
7. Run the narrowest relevant validation.
8. Update `.ai/session-state.md`, `.ai/task-log.md`, and `.ai/decisions.md` if the change introduces a durable rule.

## Validation Prerequisites

- Local env should come from `06_IMPLEMENTATION/.env.example` or equivalent shell exports.
- DB-backed validation expects PostgreSQL on `localhost:5432`.
- Integration and E2E checks usually require migrations and seed data already applied.
- If `packages/domain` changes, rebuild it before claiming API, web, or E2E validation is current.

## Validation Matrix

- Domain only: `cd 06_IMPLEMENTATION && npm -w packages/domain run build`
- API logic: `cd 06_IMPLEMENTATION && npm run typecheck` then `cd 06_IMPLEMENTATION && npm run phase5:test` or `cd 07_TEST_SUITE && npm run test:integration`
- Web logic: `cd 06_IMPLEMENTATION && npm run typecheck` then `npm run phase5:test:web`
- Full workflow: `cd 07_TEST_SUITE && npm run test:e2e`

## Exit Criteria

- The owning code path is still simple and local.
- The smallest relevant tests pass or the blocker is documented.
- Critical work received reviewer and security passes.
- Any contract or doc changes were synced.