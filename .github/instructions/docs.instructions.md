---
applyTo:
  - "01_*.md"
  - "02_*.md"
  - "03_*.md"
  - "04_*.md"
  - "05_*.md"
  - "06_VALIDATION_FULL_REPORT.md"
  - "CRM_System_Requirement.md"
  - "06_IMPLEMENTATION/README.md"
  - "docs/**/*.md"
  - "06_IMPLEMENTATION/docs/**/*.{md,yaml}"
  - "07_TEST_SUITE/README.md"
description: "Use when editing architecture, deployment, requirements, OpenAPI, validation, or user-facing documentation in this repository."
name: "Docs Instructions"
---

# Instructions

- Preserve the language and audience of the surrounding document. Business, deployment, and user docs are often Slovak; code-adjacent technical docs may be English.
- Verify commands and file paths against manifests and config files before editing docs. This repo already contains some stale deployment guidance, so treat code and package manifests as the source of truth.
- Use `06_IMPLEMENTATION/README.md` and the ADRs as higher-priority architecture references than older ad hoc notes.
- If you change an external contract, sync all affected docs together: `openapi.yaml`, launch or deployment guides, test docs, and user guides.
- Keep docs specific to the current MVP architecture: npm workspaces under `06_IMPLEMENTATION`, Fastify API, React web app, shared domain package, PostgreSQL with Drizzle, and separate `07_TEST_SUITE` validation.
- Call out assumptions and unresolved mismatches in `.ai/open-questions.md` instead of silently flattening them.