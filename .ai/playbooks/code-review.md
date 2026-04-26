# Code Review Playbook

## Trigger

Use this after implementation, especially for API contracts, auth, DB, deployment, or test-runner changes.

## Reviewer Stance

- Assume the implementation is wrong until the diff, nearby code, and validation evidence prove otherwise.
- Look for missing tests, contract drift, stale docs, hidden production risk, and unnecessary scope.
- Review is read-only by default. Follow-up fixes belong in a later implementer pass.

## Review Steps

1. Read the task summary and the changed files.
2. Inspect the nearest untouched neighbors to understand whether the change matches local patterns.
3. Verify the chosen validation commands make sense for the touched slice.
4. Re-check high-risk surfaces: auth and session, CORS, env loading, migrations, seed data, Procfiles, Dockerfiles, Railway docs.
5. For critical work, require a separate session before approving. Same-session review is findings-only.
6. Approve only if the change is minimal, validated, and consistent with repo conventions.

## Output Format

- Findings ordered by severity
- Missing validation or missing docs
- Follow-up fixes for the implementer
- Remaining manual checks