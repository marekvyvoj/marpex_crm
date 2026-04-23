# Marpex CRM Test Suite

Phase 5 output pre Marpex CRM.

Štruktúra:

- `unit/` — business rules a schema validácie
- `integration/` — Fastify API testy proti reálnej DB a seed dátam
- `e2e/` — Playwright UI smoke + workflow scenáre
- `helpers/` — shared DB fixtures pre integration a e2e setup

Predpoklady:

- PostgreSQL z `06_IMPLEMENTATION/docker-compose.yml` beží na `localhost:5432`
- migrácie sú aplikované
- seed dáta existujú (`manager@marpex.sk`, `obchodnik1@marpex.sk`)

Príkazy:

```bash
cd 07_TEST_SUITE
npm install
npm run test
npm run coverage
npm run test:e2e
```

Poznámka ku coverage:

- `npm run coverage` deleguje na root runner v `06_IMPLEMENTATION/`, aby sa coverage rátal nad reálnymi source súbormi a nie len nad test packageom.

Aktuálny scope:

- pipeline transition rules
- visit schema validácia vrátane `cross_sell` typu
- auth/session guard, logout a login rate limiting
- manager dashboard payload vrátane coverage ratio, cross-sell a stagnant logiky
- salesperson-scoped dashboard
- manager-only report authorization + manager access path
- visits route filters, late flag a data integrity check pre contact/customer pair
- import customers z CSV vrátane content-type/payload validácie a partial error reportu
- manager-only user management vrátane self-deactivate guardu
- task workflow pre opportunity/customer väzby, complete a delete flow
- customer CRUD, filter a detail resources (`contacts`, `visits`, `opportunities`)
- opportunity CRUD, gate-required stage transitions a stage history
- web/API client správanie, layout auth guard, login page, customer detail, import, users a report page
- pipeline drag & drop workflow
- robust HTML5 drag/drop handoff pre gated stages aj mid-pipeline presuny
- customer detail workflow end-to-end
- CSV import workflow end-to-end
- manager report workflow end-to-end
- mobile viewport navigation
- stagnant opportunity highlight na dashboarde

Aktuálny coverage scope:

- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/customers.ts`
- `apps/api/src/routes/dashboard.ts`
- `apps/api/src/routes/health.ts`
- `apps/api/src/routes/import.ts`
- `apps/api/src/routes/opportunities.ts`
- `apps/api/src/routes/report.ts`
- `apps/api/src/routes/tasks.ts`
- `apps/api/src/routes/users.ts`
- `apps/api/src/routes/visits.ts`
- `apps/web/src/components/Layout.tsx`
- `apps/web/src/pages/CustomerDetailPage.tsx`
- `apps/web/src/pages/ImportPage.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/pages/LoginPage.tsx`
- `apps/web/src/pages/ReportPage.tsx`
- `apps/web/src/pages/UsersPage.tsx`
- `packages/domain/src/pipeline/index.ts`
- `packages/domain/src/visits/index.ts`

Posledný overený coverage výsledok:

- statements: `97.97 %`
- branches: `84.37 %`
- functions: `91.46 %`
- lines: `97.97 %`

Posledný overený výsledok `npm run test`:

- 10 web test files passed
- 1 integration test file passed
- 2 unit test files passed
- spolu `51 / 51` tests passed

Posledný overený výsledok `npm run test:e2e`:

- 6 E2E spec files passed
- spolu `11 / 11` Playwright tests passed

Používateľský E2E guide:

- `06_IMPLEMENTATION/docs/E2E_USER_GUIDE.md`

Ďalšie rozšírenia pre ďalší krok:

- ABRA mock integration tests
- pokrytie gate-required drag/drop scenárov (`quote_delivered` redirect na detail)
- explicitný responsive test aj pre import, users a customer detail page
- detailný E2E workflow pre opportunity detail a task management