---
description: "Resume a Marpex CRM task from the .ai memory files and current diff, then continue with fresh discovery."
name: "Marpex Handoff"
argument-hint: "Describe the unfinished task or goal"
agent: "agent"
---

Before doing anything else:

- read [session state](../../.ai/session-state.md)
- read [task log](../../.ai/task-log.md)
- read [decisions](../../.ai/decisions.md)
- read [open questions](../../.ai/open-questions.md)
- inspect the current diff
- treat `.ai` notes as hints, not source of truth; re-verify against manifests, code, tests, and docs before acting

Then continue the task described in the prompt argument.

Requirements:

- keep changes inside the smallest owning area
- rerun the narrowest relevant validations before expanding scope
- update the `Handoff Summary` section in [session state](../../.ai/session-state.md) before handing off again