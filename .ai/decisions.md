# Decisions

## 2026-04-26

### Treat `06_IMPLEMENTATION` As The Code Root

- Decision: Repository instructions and playbooks treat `06_IMPLEMENTATION/` as the authoritative application workspace.
- Why: Root-level scripts are mainly deployment wrappers, while the real app workspaces, tests, docs, and package scripts live under `06_IMPLEMENTATION/`.

### Keep Instructions Layered

- Decision: Use `.github/copilot-instructions.md` for repo-wide rules and `.github/instructions/*.instructions.md` for path-specific guidance.
- Why: The repo spans API, web, domain, tests, docs, and deployment config. A single instruction file would either be too broad or too generic.

### Keep `AGENTS.md` As Workflow, Not Coding Style

- Decision: `AGENTS.md` defines role-switching, review gates, and memory discipline, while `copilot-instructions.md` carries coding rules.
- Why: The user explicitly requested both files, and separating workflow from coding rules keeps each file narrow enough to remain useful.

### Preserve Existing Production Behavior By Default

- Decision: Do not modify deployment or runtime files during setup unless the workflow itself requires it.
- Why: The repository already has environment-specific deployment wrappers and documented Railway fixes. The safe setup is to document risks and mismatches rather than make speculative runtime edits.

### Retire The Legacy Root Instruction Surface

- Decision: Reduce the root `.instructions.md` file to a compatibility pointer and make `.github/copilot-instructions.md` plus `.github/instructions/*.instructions.md` authoritative.
- Why: The older root file contained stale product and architecture constraints that would conflict with the current repository state.

### Separate Manual Templates From Real Workspace Prompts

- Decision: Keep `.ai/prompts/` as human-readable copy-paste templates and create real slash prompts under `.github/prompts/`.
- Why: The user requested `.ai/prompts/*`, but Copilot discovers prompt files from `.github/prompts/*.prompt.md`.

### Require Stronger Guards For High-Risk Mutating Work

- Decision: Treat migrations, seed commands, deployment-affecting commands, and auth or env rollout work as high-risk operations that require explicit user approval or an explicitly confirmed local disposable target.
- Why: The reviewer passes agreed that the initial workflow was too permissive for mutating actions with production or data risk.