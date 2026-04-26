# Handoff Prompt Template

Status: Manual copy-paste template. The slash-command version lives in `.github/prompts/handoff.prompt.md`.

Use this prompt to resume work in a new chat without rediscovering the repository.

```text
Act as DISCOVERY_AGENT first, then continue as IMPLEMENTER_AGENT.

Before doing anything else:
- read .ai/session-state.md
- read .ai/task-log.md
- read .ai/decisions.md
- read .ai/open-questions.md
- inspect the current git diff
- treat .ai notes as hints, not the source of truth; re-verify against manifests, code, tests, and docs before acting

Then continue this task:
<describe the unfinished task>

Requirements:
- keep changes inside the smallest owning area
- rerun the narrowest relevant validations before expanding scope
- store the current handoff summary inside the Handoff Summary section of .ai/session-state.md before handing off again
```