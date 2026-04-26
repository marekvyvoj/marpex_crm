# Session Handoff Playbook

## Trigger

Use this before ending a session or moving a task into a new chat.

## Steps

1. Update `.ai/session-state.md` with the current task, changed areas, validation status, and blockers.
2. Append a short factual entry to `.ai/task-log.md`.
3. Record any durable rule or decision in `.ai/decisions.md`.
4. Record unresolved issues in `.ai/open-questions.md`.
5. Store a short handoff summary in the `Handoff Summary` section of `.ai/session-state.md`.

## Minimum Handoff Summary

- task status
- files changed
- validations run and outcomes
- blockers or manual checks
- next prompt or command