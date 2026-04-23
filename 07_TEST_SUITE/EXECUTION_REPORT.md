# Phase 5 Execution Report

Dátum: 2026-04-19

## Spustené testy

Poznámka: tento report odráža poslednú rozšírenú verziu Phase 5, kde boli znovu spustené unit, integration, web aj Playwright E2E suite.

### Unit (Vitest)

- `unit/pipeline.spec.ts`
- `unit/visit-validation.spec.ts`

Výsledok:

- 2 test files passed
- 8 tests passed
- 0 failed

### Integration (Vitest)

- `integration/api.spec.ts`

Pokryté scenáre:

- public health endpoint
- auth guard pre private routes
- opakované úspešné loginy nie sú rate-limitované
- opakované neúspešné loginy sú rate-limitované
- `/auth/me` + logout flow
- manager dashboard vracia rozšírené Phase D metriky
- salesperson dashboard je scope-nutý na vlastné dáta
- salesperson nemá prístup na manager report
- manager má prístup na salesperson report
- visit validation blokuje `opportunityCreated=true` bez `opportunityType`
- visits filter podľa customer/owner/date/late funguje
- import route validuje content type, empty/header-only payload a partial row errors
- users route pokrýva manager-only access, create/update a self-deactivate guard
- tasks route pokrýva create/list/complete/delete flow
- contact/customer mismatch je blokovaný
- `GET /api/visits/:id` vracia 404 pre chýbajúci záznam
- fixture scenár overuje coverage ratio, cross-sell rate a stagnant top-deal správanie

Výsledok:

- 1 test file passed
- 19 tests passed
- 0 failed

### Web (Vitest + jsdom)

- `tests/web/api.spec.ts`
- `tests/web/customer-detail-page.spec.tsx`
- `tests/web/import-page.spec.tsx`
- `tests/web/layout.spec.tsx`
- `tests/web/login-page.spec.tsx`
- `tests/web/report-page.spec.tsx`
- `tests/web/users-page.spec.tsx`

Pokryté scenáre:

- frontend API wrapper spracuje JSON, `204`, chybu aj `401` redirect
- customer detail page pokrýva edit headeru, create contact a prepínanie tabs
- import page pokrýva sample CSV, preview, success aj error flow
- layout správne renderuje manager/sales navigáciu a auth guard stavy
- login page spracuje úspešný aj neúspešný login flow
- report page pokrýva denied stav, empty stav aj risk badge rendering
- users page pokrýva denied stav, create user, role change a deactivate flow

Výsledok:

- 7 test files passed
- 19 tests passed
- 0 failed

### E2E (Playwright)

- `e2e/customer-detail.spec.ts`
- `e2e/import-report.spec.ts`
- `e2e/login.spec.ts`
- `e2e/pipeline.spec.ts`
- `e2e/mobile.spec.ts`

Pokryté scenáre:

- manager login otvorí dashboard
- empty submit vo Visits zobrazí validačné chyby
- manažér prejde customer detail, edit firmy, create contact a prepne tabs
- manažér vykoná CSV import a nájde importovaného zákazníka v zozname
- manažér vidí report obchodníkov s rizikovým obchodníkom
- drag & drop presunie opportunity do ďalšej pipeline fázy
- mobile viewport zachová navigáciu a prístup k pipeline
- dashboard zvýrazní stagnujúcu príležitosť v top deals

Výsledok:

- 5 spec files passed
- 8 tests passed
- 0 failed

## Súhrn

- unit + integration + web: 46
- Playwright E2E: 8
- passed: 54
- failed: 0

## Coverage status

Coverage infra bola opravená cez root runner v `06_IMPLEMENTATION/vitest.phase5.config.ts`, ktorý spúšťa testy z `07_TEST_SUITE/` a meria reálne source súbory v implementácii.

Posledný overený výsledok nad broadened backend/web scope:

- statements: `97.97 %`
- branches: `84.37 %`
- functions: `91.46 %`
- lines: `97.97 %`

Meraný scope:

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

Stabilizačné opravy, ktoré odblokovali broadened run:

- cleanup helper teraz maže všetky Phase 5 entity naviazané na test customerov, aj keď vznikli cez API bez `sourceSystem`
- opportunity stage transition používa parsované gate dáta, takže `won` prechod zapisuje korektný `closeTimestamp`

## Known issues / gaps

- ABRA integračné testy ešte neexistujú, lebo ABRA integrácia je stále mimo MVP scope.
- Gate-required drag/drop scenáre ešte nemajú samostatný Playwright test.
- Coverage je širšia než pôvodný kritický scope, ale stále nie nad celým monorepom.
- Opportunity detail a task management ešte nemajú samostatný Playwright workflow test.

## User-facing guide

- Detailný manuálny aj automatizovaný E2E walkthrough je v `06_IMPLEMENTATION/docs/E2E_USER_GUIDE.md`.