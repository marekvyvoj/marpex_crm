# Marpex CRM

Marpex CRM je interný sales operating system pre Marpex postavený ako monorepo nad React + Fastify + PostgreSQL + Drizzle ORM.

## Štruktúra

- `apps/api` – Fastify API, session auth, Drizzle queries, migrations
- `apps/web` – React klient cez Vite a TailwindCSS
- `packages/domain` – zdieľané business rules, pipeline canon a Zod schémy
- `docs` – launch checklist, ADR záznamy, OpenAPI špecifikácia

## Naming konvencie

- databáza: `snake_case`
- TypeScript a React: `camelCase`
- enum hodnoty a pipeline stage IDs: `snake_case`
- JSON payloady medzi webom a API: `camelCase`

Tieto konvencie sú úmyselné. DB ostáva idiomatická pre PostgreSQL, zatiaľ čo TypeScript a UI ostávajú idiomatické pre JS ekosystém.

## Prečo sú Drizzle queries priamo v routes

Pre current MVP je route vrstva stále tenká a business pravidlá sú vytiahnuté do `packages/domain`. Repository/service layer zatiaľ nepridáva primeranú hodnotu vzhľadom na scope 5-20 používateľov. Keď sa začne doména vetviť alebo pribudnú zložitejšie transaction flows, je vhodné queries vytiahnuť do samostatných services.

## Lokálny vývoj

Požiadavky:

- Node.js 22+
- npm 10+
- PostgreSQL 16+

Prvé spustenie:

```bash
npm install
docker compose up -d db
npm run db:migrate
npm run db:seed
```

Vývoj:

```bash
npm run dev:api
npm run dev:web
```

## Dôležité skripty

```bash
npm run build
npm run lint
npm run typecheck
npm run format:check
npm run security:audit
npm run phase5:test
```

## API dokumentácia

- OpenAPI špecifikácia: `docs/openapi.yaml`
- Prevádzkový checklist: `docs/LAUNCH_CHECKLIST.md`
- ADR záznamy: `docs/adr/`

## Pagination contract

List endpointy podporujú voliteľné query parametre `page` a `limit`.

Príklad:

```http
GET /api/customers?page=2&limit=20
```

Response ostáva kompatibilne pole objektov a metadata idú v headeroch:

- `X-Total-Count`
- `X-Page`
- `X-Limit`
- `X-Total-Pages`

## Docker buildy

API image:

```bash
docker build -f apps/api/Dockerfile -t marpex-api .
```

Web image:

```bash
docker build -f apps/web/Dockerfile -t marpex-web .
```

## Load smoke test

Základný load smoke test dashboard endpointu je v `../07_TEST_SUITE/load/dashboard-smoke.mjs`:

```bash
cd ../07_TEST_SUITE
npm run test:load:smoke
```

Pred spustením musí bežať API aj DB.