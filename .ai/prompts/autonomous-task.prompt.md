# Autonomous Task Prompt Template

Status: Manual copy-paste template. The slash-command version lives in `.github/prompts/autonomous-task.prompt.md`.

Use this when starting a new implementation task outside the built-in workspace prompts.

```text
Act as DISCOVERY_AGENT first, then IMPLEMENTER_AGENT, following AGENTS.md and .github/copilot-instructions.md.

Task:
<describe the requested change>

Execution rules:
- Inspect the owning manifest, nearest implementation files, nearest tests, and relevant docs before editing.
- Update .ai/session-state.md with scope, touched area, and blockers before edits.
- Keep changes minimal and local.
- If the task touches migrations, seed commands, deployment wrappers, auth/session, cookies, env handling, or secrets, stop unless the user has approved the risky work or explicitly confirmed a local disposable target.
- After the first substantive edit, run the narrowest relevant validation.
- For critical work, run reviewer and security passes before completion.
- Update .ai/task-log.md, .ai/decisions.md, and .ai/open-questions.md when relevant.

Required output:
- files changed
- commands run and results
- reviewer or security findings
- remaining manual checks
```