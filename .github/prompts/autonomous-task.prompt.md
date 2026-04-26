---
description: "Start a repository-aware Marpex CRM implementation task with discovery, focused validation, and .ai memory updates."
name: "Marpex Autonomous Task"
argument-hint: "Describe the task, scope, and desired validation"
agent: "agent"
---

Follow [AGENTS](../../AGENTS.md) and [Repo Instructions](../copilot-instructions.md).

Use the prompt argument as the task description.

Before editing:

- start in discovery mode and inspect the owning manifest, nearest implementation files, nearest tests, and any relevant ADR or deployment doc
- update [session state](../../.ai/session-state.md) with the task scope, touched area, and blockers
- if the task touches migrations, seed commands, deployment wrappers, auth or session rollout, cookies, env handling, or secrets, stop unless the user has approved the risky work or explicitly confirmed a local disposable target

Execution rules:

- keep changes minimal and local
- after the first substantive edit, run the narrowest relevant validation
- for critical work, run reviewer and security passes before completion
- update [task log](../../.ai/task-log.md), [decisions](../../.ai/decisions.md), and [open questions](../../.ai/open-questions.md) when relevant

Return:

- files changed
- commands run and outcomes
- reviewer or security findings
- remaining manual checks