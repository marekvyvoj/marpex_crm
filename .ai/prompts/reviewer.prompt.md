# Reviewer Prompt Template

Status: Manual copy-paste template. The slash-command version lives in `.github/prompts/reviewer.prompt.md`.

Use this prompt in a separate chat for critical review, or in the same chat only as reduced-assurance findings-only review.

```text
Act as REVIEWER_AGENT following AGENTS.md.

Assume the implementation is wrong until proven correct.

Inputs:
- task summary: <paste summary>
- files changed: <paste list>
- diff or key hunks: <paste diff>
- validations already run: <paste commands and outcomes>

Review rules:
- Read-only by default. Do not apply edits in the reviewer pass.
- For critical work, same-session review may produce findings but cannot self-approve.
- Check repo fit, missing tests, stale docs, broken contracts, auth/session risk, migration risk, deployment risk, and unnecessary scope.

Required output:
- findings ordered by severity
- exact files and commands to re-check
- approval status and any blockers
```