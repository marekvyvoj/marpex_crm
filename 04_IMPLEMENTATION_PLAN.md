# 04_IMPLEMENTATION_PLAN.md
## Fáza 2: Implementation Plan pre vlastný Marpex CRM

> Tento plán vychádza z [03_RESEARCH.md](03_RESEARCH.md), z business požiadaviek v [CRM_System_Requirement.md](CRM_System_Requirement.md) a z technologického draftu v [02_TECHNOLOGY_STACK.md](02_TECHNOLOGY_STACK.md).  
> Smer je potvrdený: **self-build, fully online MVP, desktop-first, jeden developer, jeden dlhodobý maintainer**.

---

## 1. Finálne rozhodnutie

### BUILD vs BUY vs HYBRID

**Finálne rozhodnutie: BUILD**

Dôvod je už jednoznačný:

- CRM nebude kupované ako hotový produkt.
- Produkt aj support ostávajú v tvojich rukách.
- Najvyššia hodnota nie je v širokom feature sete, ale v presnom prispôsobení Marpex obchodnému procesu.
- Kľúčový diferenciátor je disciplína návštev, vynútený next step a manažérska viditeľnosť, nie breadth funkcií.

### Čo presne staviame

Nie generické CRM, ale **online sales operating system pre Marpex**.

Prvá verzia má riešiť hlavne:

- rýchle a presné logovanie návštev,
- vznik a správu opportunities,
- next-step disciplínu,
- customer context na jednom mieste,
- pipeline prehľad,
- manažérsku viditeľnosť rizík,
- migráciu a riadený odchod z existujúceho **eWay-CRM**.

### Nový potvrdený vstup: existujúce eWay-CRM

Marpex dnes používa **eWay-CRM**, ale nie je s ním spokojný. To má pri pláne dva dôsledky:

- nové CRM nesmie začínať od nuly bez migračného scenára,
- treba navrhnúť **migráciu z eWay-CRM do novej platformy** a krátke obdobie riadenej koexistencie.

Z oficiálnych eWay zdrojov vyplýva, že eWay-CRM je Outlook-first CRM so samostatnými modulmi pre:

- Companies a Contacts,
- Deals,
- Projects,
- Tasks / Calendar väzby,
- email history / journaling,
- custom fields, mandatory fields a workflows,
- developer portal s **Swagger dokumentáciou, Postmanom, JS/PHP/C# knižnicami a databázovou schémou**.

To znamená, že migrácia je technicky reálna a nemusí byť založená len na ručných CSV exportoch.

---

## 2. Architektonické rozhodnutie: Web vs Mobile vs PWA

### Vstupy, ktoré rozhodujú

- offline teraz nie je podmienka,
- MVP je desktop-first,
- development aj support robí jeden človek,
- priorita je rýchlosť dodania, jednoduchosť a nízke maintenance overhead,
- mobil je dôležitý skôr neskôr ako doplnok, nie ako hlavná prvá platforma.

### Vyhodnotenie variantov

| Varianta | UX kvalita | Maintenance cost | Speed to market | Online-only fit | Solo-dev fit | Verdikt |
|---|---:|---:|---:|---:|---:|---|
| **A. PWA + cloud backend** | 4/5 | 3/5 | 4/5 | 4/5 | 3/5 | Dobrá druhá voľba, ale pre MVP zbytočne pridáva complexity |
| **B. Native mobile apps + cloud backend** | 3/5 | 1/5 | 1/5 | 2/5 | 1/5 | Zamietnuť |
| **C. Traditional responsive web app** | 4/5 | 5/5 | 5/5 | 5/5 | 5/5 | **Odporúčané pre MVP** |
| **D. Hybrid web + native companion** | 3/5 | 1/5 | 1/5 | 2/5 | 1/5 | Zamietnuť |

### Finálne rozhodnutie

**MVP bude traditional responsive web app.**

To znamená:

- jeden frontend pre desktop aj základný mobile browser fallback,
- jeden backend,
- žiadne service workers, sync queues ani offline cache v prvej verzii,
- nižšia zložitosť deploymentu a debugovania,
- jednoduchší support.

### Dôležitá poznámka

Frontend má byť navrhnutý **PWA-ready, ale nie PWA-first**.  
Inými slovami: teraz neriešiť offline, no neblokovať si neskoršie pridanie installability alebo service worker vrstvy.

### Formálne rozhodnutie k offline

**Offline je pre MVP oficiálne waived requirement.**  
Nie je blocker pre launch V1 a presúva sa až do neskoršej fázy po stabilizácii online workflowu.  
Pre Phase 3 validáciu sa má offline posudzovať ako **vedome schválená scope change**, nie ako opomenutý requirement.

---

## 3. Odporúčaná technická architektúra

### 3.1 Frontend

**Odporúčaný smer:**

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui alebo vlastná ľahká komponentová vrstva

### Prečo takto

- React + Vite drží setup rýchly a priamy.
- TanStack Query zjednoduší server state, invalidácie a optimistic updates.
- React Hook Form + Zod sú ideálne na tvrdé formulárové validácie pri visits a opportunities.
- Tailwind + jednoduchá komponentová vrstva ti dá rýchly UI vývoj bez veľkého design-system projektu.

### 3.2 Backend

**Odporúčaný smer:**

- Node.js 22 LTS
- TypeScript
- Fastify
- Zod alebo TypeBox schema validation
- PostgreSQL
- ORM / query layer: Prisma alebo Drizzle

### Preferované rozhodnutie

Ak chceš minimum framework magic, odporúčam:

- **Fastify + Zod + Drizzle**

Ak chceš rýchlejší onboarding do DB tooling a migrations, prijateľné je aj:

- **Fastify + Prisma**

### Prečo Fastify

- nízky overhead,
- dobrý výkon,
- čistý plugin model,
- schema-first prístup sa hodí na tvrdé business rules,
- jednoduchšie dlhodobé maintenance než ťažší framework.

### 3.3 Databáza

**Databáza:** PostgreSQL

Toto je správna voľba kvôli:

- relačnému modelu customers, contacts, visits, opportunities, tasks,
- potrebe constraints a transakcií,
- jednoduchému reportingu,
- neskoršej ABRA integrácii,
- možnosti robiť audit a históriu zmien bez hackov.

### 3.4 Auth

**MVP auth model:** email/password

**Odporúčanie implementácie:**

- hash hesla cez Argon2id alebo bcrypt,
- session-based auth cez httpOnly secure cookie,
- server-side session store alebo signed token cookie prístup,
- jednoduché roly:
  - `manager`
  - `sales`

### Prečo nie plné JWT-first riešenie

Na interný CRM systém pre 5 používateľov je dôležitejšia jednoduchosť a bezpečnosť než „moderný auth feeling". Session cookie model bude na support ľahší.

### 3.5 Hosting a deployment

**Odporúčaný MVP deployment:** cloud VPS / server

**Navrhovaná skladba:**

- Ubuntu VPS
- Docker Compose
- Nginx ako reverse proxy
- Node API container
- PostgreSQL container
- nightly DB backup job
- off-server backup storage

### MVP infra princíp

Pre prvú verziu je úplne v poriadku držať app aj DB na jednom serveri, ak budeš mať:

- pravidelné zálohy,
- restore postup,
- monitoring disk space a uptime,
- HTTPS,
- základný log management.

### Kedy infra meniť

Po pilote alebo po prvých 30-60 dňoch používania zváž:

- presun DB na managed PostgreSQL,
- oddelené object storage pre prílohy,
- lepší monitoring a alerting.

### 3.6 Security a GDPR baseline

Pre MVP je bezpečnostné minimum toto:

- **TLS in transit** cez HTTPS terminované na Nginx.
- **Encryption at rest** na úrovni VPS volume alebo managed disk encryption + šifrované DB backupy.
- **Password hashing** cez Argon2id.
- **Session security** cez httpOnly, secure, sameSite cookies.
- **Role-based access** minimálne `manager` a `sales`, s kontrolou prístupu na backend úrovni.
- **Audit log scope** minimálne: login, import joby, vytvorenie/úprava/zmena stage opportunity, zmena deadline, zmena ownera, delete operácie.
- **Password reset flow** cez transactional email a jednorazový token s expirácou.
- **Backup policy**: denný backup, 30-dňová retencia, mesačný snapshot pre dlhšie držanie.
- **Restore target**: RPO max 24h, RTO cieľ do 4h.
- **GDPR minimum**: export zákazníckych dát na vyžiadanie, logický delete/anonymizácia podľa business rozhodnutia, oddelené spracovanie prihlasovacích údajov a business dát.
- **Retention policy**: audit log min. 12 mesiacov, backupy podľa backup policy, business records až do archivácie alebo deletion workflowu.

### 3.7 eWay-CRM migration a integračný baseline

Migráciu z eWay-CRM treba chápať dvojvrstvovo:

- **migrácia dát** do nového CRM,
- **dočasná read-only integrácia** počas cutover obdobia, ak nebude jednorazový prechod stačiť.

#### Preferované technické poradie prístupu k dátam z eWay-CRM

1. **eWay API / SDK** cez developer portal, Swagger a oficiálne knižnice.
2. **CSV/Excel exporty** z jednotlivých modulov, ak API neprinesie dostatočne čisté dáta.
3. **DB-assisted extraction** len ak bude nevyhnutná a bezpečne zvládnuteľná.

#### Migračné pravidlo

Nové CRM nebude robiť 1:1 kópiu všetkého z eWay. Migruje sa len to, čo má hodnotu pre nový operating model.

---

## 4. Systémová architektúra

```text
Users (5 sales + 1 manager)
        |
        v
Responsive Web App (React)
        |
        v
REST API (Node + Fastify)
        |
        v
PostgreSQL
        |
        +--> eWay migration adapter (API / CSV / one-way delta import)
        |
        +--> Import layer (CSV/Excel)
        |
        +--> Audit log / stage history / task engine
        |
        +--> Future ABRA integration layer
```

### Architektonický princíp

Doména má byť navrhnutá explicitne, nie cez všeobecný CRM engine.  
To znamená:

- `visits` ako samostatná primárna entita,
- `tasks` ako samostatná entita,
- `opportunity_stage_history` ako samostatná história,
- imports oddelené od core domény,
- eWay migration adapter oddelený od core CRUD,
- ABRA integration layer oddelená od CRUD jadra.

### 4.1 Pipeline canon pre MVP

Pipeline stages sú pre MVP **fixed**, nie admin-konfigurovateľné. Dôvod je jednoduchý: menšia zložitosť, konzistentné KPI a jednoduchší reporting.

| Stage | Weight | Typ stavu |
|---|---:|---|
| **Identifikovaná potreba** | 10 % | otvorený |
| **Kvalifikovaná príležitosť** | 25 % | otvorený |
| **Technické riešenie** | 40 % | otvorený |
| **Ponuka odovzdaná** | 55 % | otvorený |
| **Rokovanie** | 70 % | otvorený |
| **Verbálne potvrdené** | 90 % | otvorený |
| **Vyhraté** | 100 % | finálny |
| **Prehraté** | 0 % | finálny |

### 4.2 Rule matrix pre pipeline a visits

| Trigger / stav | Required údaje | Enforcement |
|---|---|---|
| **Create Visit** | `date`, `customer`, `contact`, `visit_goal`, `result`, `customer_need`, `opportunity_created`, `potential_eur`, `competition`, `next_step`, `next_step_deadline` | frontend + backend validation |
| **Visit s opportunity_created = yes** | vytvoriť alebo prepojiť opportunity | blocking rule |
| **Create Opportunity** | `value`, `stage`, `next_step_summary`, `next_step_deadline`, owner | blocking rule |
| **Move to Ponuka odovzdaná** | technické zadanie, konkurencia, follow-up date | blocking rule |
| **Move to Won** | close result + validný final timestamp | blocking rule |
| **Move to Lost** | lost reason + close result | blocking rule |
| **Open opportunity bez aktívneho next stepu** | nepovoliť stabilný open stav bez tasku | blocking rule alebo immediate warning + forced create |
| **Visit log po viac než 24h** | late flag + manager visibility | soft enforcement v MVP, procesne mandatory |
| **30 dní bez aktivity** | review flag + risk badge + manager widget | automated rule |

#### Definícia activity pre 30-day logiku

Za activity sa počíta:

- vytvorenie alebo úprava visit,
- vytvorenie, dokončenie alebo update tasku,
- stage change opportunity,
- update next stepu alebo deadline,
- relevantný import/update z externého systému.

### 4.3 KPI a reporting scope

#### Manager dashboard musí pokrývať

- počet zákazníkov,
- total pipeline value,
- weighted pipeline value,
- otvorené opportunities,
- vyhraté €,
- prehraté €,
- coverage ratio vs target,
- visit count,
- visit -> opportunity conversion,
- win rate,
- average deal size,
- cross-sell %,
- stagnant opportunities,
- overdue next steps,
- lost deal reasons,
- top 10 open deals,
- semaphore: OK / POZOR / RIZIKO.

#### Stagnant opportunities report musí ukázať

- názov,
- obchodníka,
- hodnotu,
- next step,
- dni po termíne.

#### Salesperson report scope

Každý obchodník musí mať svoj report view alebo ekvivalentný filtrovaný dashboard s:

- visit count,
- number of opportunities,
- pipeline total,
- weighted pipeline,
- win rate,
- average deal size,
- top 10 deals.

Top 10 deals musia vedieť zobraziť minimálne:

- názov,
- zákazníka,
- fázu,
- hodnotu,
- pravdepodobnosť,
- next step.

### 4.4 Visit discipline canon

MVP musí podporovať tieto procesné pravidlá:

- návšteva bez zápisu sa považuje za neexistujúcu,
- zápis z návštevy sa očakáva do 24h,
- bez next stepu je open obchodný stav nevalidný,
- bez € hodnoty nie je opportunity validná,
- každá interakcia so zákazníkom má skončiť opportunity alebo jasným dôvodom, prečo nevznikla.

---

## 5. Scope rozhodnutie pre MVP

### V MVP musí byť

- login a role,
- eWay-CRM data audit a mapping,
- eWay-CRM migration/import adapter,
- import customers a contacts z CSV/Excel,
- customers list,
- customer card,
- contacts,
- visit form s 11 povinnými poľami,
- visit history,
- opportunities,
- next-step task model,
- pipeline board,
- basic dashboard,
- salesperson report view alebo jeho MVP ekvivalent,
- search a filtre,
- audit log minimálne na kritické zmeny,
- stage history.

### V MVP vedome nebude

- offline režim,
- natívna mobile app,
- full bi-directional sync s eWay-CRM,
- email sync,
- calendar sync,
- ABRA API sync,
- AI vrstva,
- generický workflow builder,
- custom module builder,
- komplikované permissions.

### Produktová definícia MVP

MVP je hotové vtedy, keď:

- obchodník vie od zákazníka prejsť k zalogovanej návšteve za menej než 2 minúty,
- z návštevy vie okamžite vzniknúť alebo sa aktualizovať opportunity,
- každá otvorená opportunity má next step a deadline,
- manažér vie na dashboarde vidieť rizikové dealy bez ručného reportovania.

---

## 6. Roadmap a fázy

Tento plán je navrhnutý realisticky pre jedného developera.

### Predpoklad intenzity práce

- **Ak ideš na projekt sústredene:** 4-5 týždňov do použiteľného MVP.
- **Ak ideš popri inej práci:** 6-8 týždňov.

### Phase A: Foundation + Data Base

**Cieľ:** pripraviť technický základ a dostať prvé dáta do systému.

**Obsah:**

- repo štruktúra,
- auth,
- users/roles,
- PostgreSQL schema v prvej verzii,
- eWay-CRM source audit,
- eWay field mapping matrix,
- import job infrastructure,
- prvý dry-run import z eWay alebo CSV exportov,
- import customers + contacts,
- základný customers list,
- základný contacts model,
- audit foundation.

**Exit criteria:**

- používateľ sa prihlási,
- existuje potvrdený mapping z eWay source modulov do nového CRM,
- zákazníci a kontakty sa dajú importovať,
- customer list je použiteľný,
- základný customer detail existuje.

### Phase B: Visit Discipline Core

**Cieľ:** vyriešiť hlavný business problém, teda disciplínu návštev.

**Obsah:**

- visit form,
- 11 povinných polí,
- validácie,
- visit detail,
- visit history na customer card,
- prepojenie visit -> customer,
- prepojenie visit -> contact,
- prepojenie visit -> opportunity create/update.

**Exit criteria:**

- návšteva sa dá rýchlo uložiť,
- systém blokuje nevalidné dáta,
- návšteva sa zobrazuje v histórii zákazníka,
- existuje jasná väzba medzi návštevou a obchodnou príležitosťou.

### Phase C: Pipeline Execution

**Cieľ:** spraviť z návštev riadený pipeline proces.

**Obsah:**

- opportunities modul,
- pipeline stages a weights,
- pipeline board,
- drag & drop medzi stage,
- stage transition rules,
- task / next-step model,
- overdue flags,
- stagnant logic foundation,
- opportunity detail a stage history.

**Exit criteria:**

- pipeline je vizuálne použiteľná,
- každá opportunity má hodnotu, fázu, next step a termín,
- rizikové opportunity sú identifikované,
- história pohybu medzi stage sa zaznamenáva.

### Phase D: Manager Visibility + Launch Polish

**Cieľ:** dostať systém do pilot-ready stavu.

**Obsah:**

- dashboard,
- weighted pipeline,
- coverage ratio,
- win rate,
- average deal size,
- cross-sell %,
- lost reasons analytics,
- salesperson report view alebo filtered report screen,
- risk widgets,
- search a filtre,
- polishing customer card,
- performance tuning,
- error handling,
- empty states,
- smoke test scenáre,
- backup a restore check,
- launch checklist.

**Exit criteria:**

- manažér vidí pipeline health bez ručného reportingu,
- hlavné toky sú stabilné,
- systém je nasaditeľný pre pilot,
- dáta sú zálohované a obnoviteľné.

### Post-MVP Phase E: ABRA Integration

**Cieľ:** doplniť integráciu bez blokovania MVP.

**Obsah:**

- analýza ABRA Web API,
- import joby a mapping strategy,
- invoice -> won status mapping,
- order status mapping,
- fallback import scenáre.

**Dôležité pravidlo:**

ABRA nesmie blokovať launch MVP.  
Ak API nebude pripravené alebo bude nejasné, ostáva fallback cez CSV/Excel import.

---

## 7. Tím a roly

Aj keď development robíš sám, plán potrebuje jasné roly.

| Rola | Zodpovednosť |
|---|---|
| **Ty** | product owner, architect, frontend, backend, DB, DevOps, support |
| **Manager / business owner** | priorizácia, akceptácia procesných pravidiel, KPI definícia |
| **Pilot salesperson** | UAT, spätná väzba na Visit form a customer card |
| **Data owner / eWay admin** | exporty z eWay, čistenie dát, mapovanie modulov a fieldov |

### Kto testuje

- ty: technické testy, smoke testy, integračné scenáre,
- manager: business acceptance,
- pilot obchodník: workflow usability.

### Kto školí

- primárne ty,
- sekundárne manager po pilotnom zabehnutí.

---

## 8. Success metrics

### Produktové metriky

- 5/5 obchodníkov má aktívny účet do 30 dní od go-live.
- 100 % zalogovaných návštev obsahuje všetky povinné polia.
- 100 % otvorených opportunities obsahuje hodnotu, fázu, next step a deadline.
- Weighted pipeline je viditeľná bez ručného výpočtu.
- Manažér vie identifikovať stagnujúce a overdue dealy za menej než 1 minútu.
- eWay import pokryje 100 % aktívnych companies a contacts z potvrdeného zdroja.
- kritické open deals a open tasks z eWay sú dostupné v novom CRM pred cutoverom.

### Adoption metriky

- visit form sa vyplní pri bežnom prípade za menej než 2 minúty,
- customer card dá odpoveď na „čo sa deje u zákazníka" bez potreby otvoriť viac než jednu obrazovku,
- obchodníci nepoužívajú paralelné Excel evidencie po pilote.

### Technické metriky

- page load do 2 sekúnd na bežnom kancelárskom pripojení,
- uloženie visit form do 500 ms p95 bez import workloadu,
- zero data loss pri importe,
- úspešný restore databázy zo zálohy.

---

## 9. Risk register

| Riziko | Pravdepodobnosť | Dopad | Mitigácia |
|---|---|---|---|
| Scope creep do generického CRM | Vysoká | Vysoký | Držať sa MVP definition a nepridávať platformové features |
| Visit form bude príliš ťažký | Stredná | Vysoký | Pilot po prvom usable prototype, skrátiť textové polia, rozdeliť formulár do logických blokov |
| Dirty import dáta z CSV | Vysoká | Stredný | Import preview, validation report, error rows export |
| eWay custom fields / workflows sa nebudú mapovať 1:1 | Vysoká | Stredný | Migrovať iba business-critical dáta, nie celý eWay feature model |
| eWay email history bude príliš ťažká na čistú migráciu | Stredná | Stredný | Email history nechať mimo MVP alebo migrovať len odkazy / summary pre aktívne prípady |
| Jediný maintainer bottleneck | Vysoká | Vysoký | Explicitná architektúra, jednoduchý deployment, minimum magic abstractions |
| Pipeline board zje priveľa času | Stredná | Stredný | Najprv functional board, až potom polishing drag-drop UX |
| Slabé testovanie vyrobí regresie | Stredná | Vysoký | Smoke test checklist pre každú release vetvu |
| Bezpečnosť a GDPR budú riešené neskoro | Stredná | Vysoký | Hneď od začiatku auth, audit, HTTPS, backup, role separation |
| ABRA integrácia sa ukáže komplikovanejšia | Vysoká | Stredný | MVP neviazať na API, ponechať CSV import fallback |

---

## 10. Rozpočtový a prevádzkový rámec

Číselný rozpočet je zámerne vynechaný podľa zadania.  
Namiesto ceny je dôležité vedieť, **aké nákladové a prevádzkové kategórie budeš reálne niesť**.

### Development budget v realite znamená

- tvoj čas na návrh,
- tvoj čas na implementáciu,
- tvoj čas na testovanie,
- tvoj čas na support po launchi.

### Budget guardrails pre MVP

- žiadny nákup nového CRM produktu,
- žiadny externý implementačný partner ako blocker MVP,
- jeden primárny frontend,
- jeden backend,
- jedna primárna databáza,
- jeden hlavný deployment target,
- eWay migrácia len v rozsahu business-critical dát,
- ABRA API mimo MVP, aby nespôsobovalo rozpočtový sklz.

### Prevádzkový rámec zahŕňa

- VPS/server,
- PostgreSQL backup storage,
- doména a HTTPS,
- transactional email pre reset hesla a systémové notifikácie,
- logy a monitoring,
- čas na maintenance, bugfixy a backup restore testy.

### Praktický záver

Najväčší rozpočet tohto projektu nie sú služby, ale **dlhodobý ownership**. Preto je správne zjednodušiť V1 čo najviac.

---

## 11. Timeline a míľniky

### Varianta A: sústredený development

| Týždeň | Míľnik |
|---|---|
| **1** | Foundation, auth, schema, import customer/contact |
| **2** | Visit form, visit history, customer card základ |
| **3** | Opportunities, tasks, pipeline board prvá verzia |
| **4** | Dashboard, risk logic, filters, polishing |
| **5** | Pilot, bugfixes, launch prep, go-live |

### Varianta B: development popri inej práci

| Týždeň | Míľnik |
|---|---|
| **1-2** | Foundation a import |
| **3-4** | Visit core |
| **5-6** | Opportunities + pipeline |
| **7** | Dashboard + polishing |
| **8** | Pilot + launch |

### Realistické milestone gates

- **Gate 1:** import a customer card fungujú,
- **Gate 2:** visit workflow funguje bez obchádzok,
- **Gate 3:** pipeline a next-step disciplína sú hotové,
- **Gate 4:** dashboard a risk visibility sú pripravené pre manažéra,
- **Gate 5:** pilot a go-live.

---

## 12. Externé systémy: eWay-CRM migrácia, ABRA plán a fallback

### 12.1 eWay-CRM migrácia a dočasná integrácia

#### Cieľ

Preniesť obchodne relevantné dáta z existujúceho eWay-CRM do nového Marpex CRM bez toho, aby sa nový systém snažil kopírovať všetky Outlook-centric moduly eWay.

#### Zdrojové oblasti, ktoré sa majú migrovať v MVP

- companies,
- contacts,
- open deals,
- recent won/lost deals podľa dohodnutého okna,
- open tasks / follow-ups,
- business-critical custom fields,
- notes alebo journal záznamy, ak sú naviazané na aktívne customers alebo deals.

#### Čo sa vedome nemigruje 1:1 do MVP

- kompletná historická emailová komunikácia,
- project delivery agenda mimo aktívneho sales kontextu,
- marketing data,
- timesheets,
- resource planning,
- AI artefakty a interné eWay automatizácie bez priamej business hodnoty.

#### Migračná technická stratégia

1. **Source audit**: zistiť, ktoré moduly a custom fields sa reálne používajú.
2. **Mapping matrix**: zdrojový eWay objekt -> cieľový objekt v novom CRM.
3. **Dry run import**: test import na kópii dát.
4. **UAT validation**: overenie správnosti na pilotnej vzorke.
5. **Final snapshot import**: finálny import pred cutoverom.
6. **Delta import window**: krátke read-only alebo opakované one-way importy z eWay, ak bude treba zachytiť zmeny medzi testom a go-live.
7. **Cutover**: nový CRM sa stane primárny systém pre sales process, eWay ostane read-only počas dohodnutého obdobia.

#### Preferované technické prístupy

- **Primárne:** eWay API / oficiálne SDK / Swagger.
- **Sekundárne:** CSV/Excel exporty po moduloch.
- **Posledná možnosť:** DB-level extraction podľa oficiálnej schémy, ak API alebo exporty nebudú stačiť.

#### Povinné technické prvky migrácie

- `source_system = eway_crm`,
- `source_record_id` alebo ekvivalentný eWay identifikátor,
- import batch id,
- error report na úrovni riadkov,
- preview pred potvrdením importu,
- duplicate handling policy.

### 12.2 ABRA plán v MVP

- bez priamej ABRA API integrácie,
- import customers a contacts cez CSV/Excel,
- ručné mapovanie podľa dostupných exportov,
- logovanie import jobov.

### 12.3 Neskoršia ABRA integračná fáza

- otestovať ABRA Web API,
- navrhnúť read-only sync pre faktúry a objednávky,
- invoice -> won mapping,
- order -> opportunity status update,
- link na doklady alebo identifikátory.

### 12.4 Fallback

Ak ABRA API nebude prakticky pripravené:

- pokračovať cez plánovaný CSV import,
- import opakovať v definovaných intervaloch,
- oddeliť core CRM od integračnej neistoty.

---

## 13. Odporúčaný okamžitý ďalší krok

Po tomto pláne má zmysel ísť v presnom poradí:

1. uzavrieť finálny dátový model,
2. rozkresliť screen flows pre Dashboard, Customer card, Visit form a Pipeline board,
3. pripraviť [05_VALIDATION_REPORT.md](05_VALIDATION_REPORT.md) ako self-build validation checkpoint ešte pred implementáciou,
4. potom začať Phase 4 implementáciu.

---

## Záverečné odporúčanie

Najlepšia architektúra pre Marpex V1 je **traditional responsive web app na React + Node + PostgreSQL**, s minimom platformových abstrakcií a maximom explicitných business rules.  
Ak budeš držať scope úzky, máš realistickú šancu dostať usable MVP do pilotu rýchlo.  
Ak začneš budovať CRM framework namiesto CRM produktu, projekt sa ti zbytočne roztiahne.