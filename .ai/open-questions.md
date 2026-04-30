# Open Questions

## Active Questions

- Current-year customer plan is stored directly on the customer record (`annualRevenuePlan`, `annualRevenuePlanYear`). If the product later needs historical multi-year plans or ABRA-sourced plan import, decide whether to replace this with a dedicated yearly plan table.
- Existing customers now support one owner plus multiple resolvers, but the real business mapping of current firms to concrete owner or resolver assignments still needs a manual assignment or a later approved bulk-import strategy.
- Existing live demo data still need a one-time owner rebalance from inside the Railway `marpex_crm` service environment, because local `railway run` uses a `postgres.railway.internal` hostname that is not reachable from the workstation shell.
- Safari compatibility is now build-hardened with legacy bundles, but an actual deployed Safari or iOS Safari smoke run is still pending.
- Consider whether the duplicated workbook set under `06_IMPLEMENTATION/SourceData` should remain the long-term packaging strategy, or whether the Railway API service should later switch to a repo-root build context or an explicit import storage approach.
- Local DB-backed verification for the new owner or resolver customer slice is still blocked until PostgreSQL is reachable on `localhost:5432`.
- Production release for the current slice requires applying migration `0010_customer_resolvers` before resolver-based customer and dashboard views are relied on in Railway.

## Resolved 2026-04-26

- Local Docker Compose docs should use service name `db`, matching `06_IMPLEMENTATION/docker-compose.yml`.
- Supported Node baseline should be Node 22 LTS. The repo now aligns on `22.x`, and the live Railway API build was verified on Node `22.22.2`.
- The live API deployment path is the `marpex_crm` service built from the `06_IMPLEMENTATION` workspace with build `npm -w packages/domain run build && npm -w apps/api run build` and start `npm -w apps/api run start`, which matches the API-specific Railway flow better than the root wrapper files.
- The live web deployment path uses a Dockerfile-based build from `06_IMPLEMENTATION/apps/web/Dockerfile` on `node:22-alpine`; the older `web.Procfile` / `npm run preview` guide was stale.
- The Railway guides were partially stale. They have been updated to reflect the current API and web deployment flows and to call out the proxy and cross-domain cookie requirements for production auth.