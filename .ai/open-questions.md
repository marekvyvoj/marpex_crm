# Open Questions

## Active Questions

- Current-year customer plan is stored directly on the customer record (`annualRevenuePlan`, `annualRevenuePlanYear`). If the product later needs historical multi-year plans or ABRA-sourced plan import, decide whether to replace this with a dedicated yearly plan table.
- User requested push and deployment for the planner feature, but the intended live target for this task still needs explicit reconfirmation before any remote mutation is executed.

## Resolved 2026-04-26

- Local Docker Compose docs should use service name `db`, matching `06_IMPLEMENTATION/docker-compose.yml`.
- Supported Node baseline should be Node 22 LTS. The repo now aligns on `22.x`, and the live Railway API build was verified on Node `22.22.2`.
- The live API deployment path is the `marpex_crm` service built from the `06_IMPLEMENTATION` workspace with build `npm -w packages/domain run build && npm -w apps/api run build` and start `npm -w apps/api run start`, which matches the API-specific Railway flow better than the root wrapper files.
- The live web deployment path uses a Dockerfile-based build from `06_IMPLEMENTATION/apps/web/Dockerfile` on `node:22-alpine`; the older `web.Procfile` / `npm run preview` guide was stale.
- The Railway guides were partially stale. They have been updated to reflect the current API and web deployment flows and to call out the proxy and cross-domain cookie requirements for production auth.