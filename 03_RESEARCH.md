# 03_RESEARCH.md
## Fáza 1: Produktový research pre vlastný Marpex CRM

> Tento dokument je prerobený podľa potvrdeného smeru: Marpex nejde kupovať hotové CRM.  
> Cieľ Phase 1 už nie je vybrať vendor, ale zistiť, **aké vzory a funkcie majú najlepšie moderné CRM systémy**, aby sa dali cielene preniesť do vlastného riešenia.  
> Fokus tejto verzie: **fully online MVP, self-build, desktop-first, nízka prevádzková zložitosť, vysoká disciplína obchodného procesu**.

---

## 1. Potvrdené východiská

- CRM budeš vyvíjať **ty sám**.
- CRM budeš **ty sám aj dlhodobo supportovať**.
- Prvá verzia má byť **fully online**, offline sa teraz nerieši.
- Reálny stack pre aktuálny smer: **React + Node + PostgreSQL**.
- Primárne použitie MVP: **desktop / laptop**.
- Nasadenie prvej verzie: **cloud VPS / server**.
- MVP login: **jednoduchý email/password**.
- Počiatočný zdroj dát: **Excel / CSV exporty**.
- ABRA scope pre prvý krok: **import zákazníkov a kontaktov**, nie plný sync.
- Najvyššia potvrdená priorita: **visit form a disciplína**.
- V MVP má byť určite aj **pipeline board**.

### Dôsledok pre návrh produktu

Najdôležitejšie nie je postaviť „veľké CRM", ale **presný obchodný operačný systém pre Marpex**. Keďže si jediný developer aj support, každá funkcia navyše má nielen implementačný cost, ale aj budúci maintenance cost. Preto má zmysel stavať len to, čo priamo podporuje disciplínu obchodníka, pipeline a manažérsku viditeľnosť.

---

## 2. Executive Summary

Najlepší smer pre vlastný Marpex CRM nie je kopírovať jedno existujúce SaaS riešenie celé, ale zobrať z moderných CRM len tie vzory, ktoré reálne zvyšujú kvalitu obchodného procesu. Pre Marpex vychádza najsilnejšia kombinácia takto:

- **z Pipedrive** zobrať activity-first logiku a neustály dôraz na ďalší krok,
- **z HubSpotu** zobrať bohatý customer record a timeline v jednom mieste,
- **zo Zoho CRM** zobrať tvrdé procesné pravidlá a podmienené validácie,
- **z Copperu** zobrať vizuálnu jednoduchosť pipeline kariet,
- **z monday** zobrať formulárové myslenie: formulár -> workflow -> dashboard.

Pre Marpex má CRM fungovať ako **visit-to-opportunity engine**. To znamená:

- **návšteva je hlavný vstup dát**, nie vedľajšia aktivita,
- **next step je povinný a operatívny objekt**, nie len textové pole,
- **customer card je operačný cockpit**, nie len karta kontaktov,
- **pipeline board je riadiaca plocha**, nie miesto, kde vzniká väčšina dát,
- **dashboard má ukazovať výnimky a riziká**, nie len pekné čísla.

Najdôležitejší produktový záver: **nestavať generické CRM**, ale úzko navrhnuté CRM na disciplínu návštev, vznik príležitostí a riadenie next stepov.

---

## 3. Čo moderné CRM robia dobre

Táto sekcia už nehodnotí, čo kúpiť. Hodnotí, **čo sa oplatí preniesť do vlastného produktu**.

| Zdroj inšpirácie | Vzor, ktorý stojí za prevzatie | Prečo je to silné | Ako to preložiť do Marpex CRM |
|---|---|---|---|
| **Pipedrive** | Activity-first predaj | CRM stále tlačí obchodníka k akcii, nie len k evidencii | Na každej opportunity aj návšteve zobrazovať aktuálny next step, termín a stav |
| **Pipedrive** | Vizualizovaná pipeline a stage reporting | Manažér rýchlo vidí, čo stojí a kde sa obchod hýbe | Kanban board + prehľad počtu dealov, hodnoty a weighted value podľa fázy |
| **HubSpot** | Jeden bohatý customer record | Všetko dôležité o zákazníkovi je na jednom mieste | Customer card ako hlavný cockpit: kontakty, návštevy, opportunities, posledná aktivita, riziká |
| **HubSpot** | Timeline interakcií | Kontext pred ďalším kontaktom je okamžite po ruke | Jedna chronologická história návštev, poznámok, taskov a zmien opportunity |
| **Zoho CRM** | Tvrdé procesné vynútenie | Systém nedovolí preskočiť disciplínu | Validácie na úrovni formulára aj backendu pre návštevy, opportunities a stage transition |
| **Zoho CRM** | Podmienené polia a layouty | UI ukazuje len to, čo je relevantné | V Visit forme zobrazovať doplnkové polia len podľa typu návštevy alebo podľa toho, či vznikla príležitosť |
| **Zoho CRM** | Stagnation a eskalácie | Obchod nezostane visieť bez pozornosti | Overdue next step alert + stagnant opportunity flag po 30 dňoch |
| **Copper** | Jednoduché pipeline karty | Deal karta nesie len to, čo treba na rozhodnutie | Na karte zobrazovať: zákazník, názov príležitosti, fáza, hodnota, next step, deadline, owner |
| **Copper** | Jasná accountability | Deal má ownera, termín a stav | Každá opportunity musí mať zodpovedného používateľa a termín ďalšieho kroku |
| **monday** | Formulár -> workflow -> dashboard | Dobrý vzor pre plynulý tok dát bez administratívneho chaosu | Visit form uloží dáta, vytvorí/update task, podľa potreby vytvorí opportunity a hneď ovplyvní dashboard |
| **monday** | Jednoduché dashboardy a bottleneck pohľad | Manažér nepotrebuje report builder, potrebuje vidieť odchýlky | Dashboard postaviť okolo rizík: bez next step, po termíne, stagnujúce, slabá coverage |

### Čo z benchmarku nepreberať slepo

- **AI everywhere**: dnes je to skôr marketingová vrstva než jadro hodnoty pre tvoj MVP.
- **široké marketing moduly**: pre Marpex sú teraz vedľajšie.
- **univerzálny no-code builder**: keď budeš jediný maintainer, generický admin systém je drahší než presne napísaná logika.
- **prehnaná modularita typu „všetko je objekt"**: pri 5 používateľoch to znižuje jasnosť produktu.

---

## 4. Produktové princípy pre vlastný Marpex CRM

### 4.1 Visits sú first-class entity

V mnohých CRM sú návštevy len generické „aktivity". Pre Marpex je to chyba. Tu má byť návšteva **hlavný zdroj obchodných dát**.

To znamená:

- návšteva musí mať vlastný formulár,
- návšteva musí mať vlastný detail,
- návšteva musí vedieť vytvoriť alebo aktualizovať opportunity,
- návšteva musí zanechať záznam v timeline zákazníka,
- návšteva musí niesť next step a deadline.

### 4.2 Next step nesmie byť len text

Ak bude next step len string v opportunity, rýchlo stratíš schopnosť robiť reporty, overdue alerty a accountability.

Preto odporúčam:

- mať **next_step_summary** ako rýchly text na karte,
- ale zároveň mať aj **Task / NextStep** entitu s ownerom, due date, statusom, zdrojom a väzbou na visit/opportunity.

### 4.3 Customer card je hlavná pracovná obrazovka

Najlepšie CRM nedržia dáta roztrúsené. Pre Marpex by mal zákazník otvoriť jednu obrazovku a okamžite vidieť:

- základný profil zákazníka,
- všetky relevantné kontakty,
- posledné návštevy,
- otvorené opportunities,
- aktuálne next stepy,
- risk flagy,
- importované ABRA odkazy alebo identifikátory.

### 4.4 Pipeline je riadiaca plocha, nie formulár

Pipeline má ukazovať tok obchodu. Nemá byť primárnym miestom zberu detailov. Detail vzniká cez visit form a opportunity detail.

Pipeline board má byť silný v týchto veciach:

- drag & drop,
- vizuálna čitateľnosť,
- rýchly pohľad na next step a deadline,
- možnosť filtrovať podľa obchodníka, segmentu a rizika,
- weighted pipeline a coverage pohľad pre manažéra.

### 4.5 Jediný maintainer = preferovať explicitnú logiku pred meta-systémom

Toto je dôležité strategické rozhodnutie. Keď si developer aj support, je lepšie mať:

- pár pevných, dobre pomenovaných pravidiel,
- pár jasných obrazoviek,
- presný dátový model,

než budovať:

- workflow builder,
- custom layout engine,
- generický form designer,
- univerzálne custom moduly.

Na začiatku sa oplatí hardcodovať správny proces, nie stavať platformu.

---

## 5. Must-have funkcie pre MVP

Toto je odporúčaný rez pre prvú ostrú verziu, ktorá už dáva obchodný zmysel.

| Funkcia | Stav pre MVP | Prečo |
|---|---|---|
| **Login + role** | Áno | Minimálne salesperson vs manager |
| **Import zákazníkov a kontaktov z CSV/Excel** | Áno | Potvrdený počiatočný zdroj dát |
| **Customers modul** | Áno | Základ celého CRM |
| **Contacts modul** | Áno | Viac rolí a vzťahov na zákazníka |
| **Visit form s 11 povinnými poľami** | Áno | Kľúčová priorita a primárny vstup dát |
| **Visit detail a história návštev** | Áno | Kontext a spätná dohľadateľnosť |
| **Opportunity entity** | Áno | Jadro pipeline |
| **Pipeline board** | Áno | Potvrdené, musí byť v MVP |
| **Next step task model** | Áno | Bez toho nebude disciplína ani alerty |
| **Opportunity detail** | Áno | Potrebný pre úplné riadenie dealu |
| **Customer card ako cockpit** | Áno | Najvyššia hodnota pri dennom používaní |
| **Basic dashboard** | Áno | Manažér potrebuje hneď vidieť výnimky |
| **Search + filtre** | Áno | Bez rýchleho nájdenia zákazníka sa CRM spomalí |
| **Audit log minimálne na kľúčové zmeny** | Áno | Kto zmenil fázu, termín, hodnotu, status |
| **Stage history** | Áno | Potrebuješ neskôr analyzovať stagnáciu a pohyb |
| **ABRA sync** | Nie | V MVP stačí import zákazníkov a kontaktov |
| **Email sync / kalendár sync** | Nie | Veľký maintenance cost, slabšia immediate value |
| **AI sumarizácia** | Nie | Zbytočné pre prvú verziu |
| **Natívna mobilná appka** | Nie | Desktop-first je potvrdený smer |

### Najdôležitejší MVP flow

1. Obchodník otvorí zákazníka.  
2. Založí návštevu cez rýchly formulár.  
3. Systém vynúti výsledok, potrebu a next step.  
4. Ak vznikla príležitosť, vytvorí alebo doplní opportunity.  
5. Opportunity sa objaví v pipeline.  
6. Dashboard okamžite ukáže, čo je po termíne alebo bez ďalšieho kroku.

Ak tento flow funguje bez trenia, CRM má šancu na adopciu.

---

## 6. Hard business rules, ktoré sa oplatí zakódovať hneď

Toto je najväčšia hodnota vlastného riešenia oproti generickému CRM. Odporúčam nevnímať ich ako „nice to have", ale ako jadro produktu.

### Visits

- Návštevu nepovoliť uložiť bez 11 povinných polí.
- Ak `opportunity_created = yes`, systém musí vyžadovať vytvorenie alebo prepojenie opportunity.
- Ak `opportunity_created = no`, systém má vedieť uložiť dôvod, prečo nevznikla.
- Návšteva sa po uložení musí objaviť v timeline zákazníka.

### Opportunities

- Opportunity nemôže existovať bez `value`, `stage`, `next_step_summary` a `next_step_deadline`.
- Pri prechode do fázy `Quote delivered` vyžadovať technické zadanie a konkurenciu.
- Pri `Won` alebo `Lost` vyžadovať uzatvárací výsledok.
- Pri `Lost` vyžadovať lost reason.

### Tasks / Next steps

- Každá otvorená opportunity musí mať minimálne jeden aktívny next step.
- Ak task prejde po termíne, opportunity musí dostať risk flag.
- Ak na opportunity nebola aktivita 30 dní, označiť ju ako stagnujúcu.

### Manager visibility

- Dashboard musí vedieť zobraziť: bez next step, po termíne, stagnujúce, bez hodnoty, bez kontaktu, bez poslednej aktivity.

---

## 7. UX vzory, ktoré sa oplatí prevziať

### 7.1 Na každej dôležitej obrazovke má byť zrejmá jedna akcia

Príklady:

- na customer card: `Log Visit`
- na opportunity detaile: `Complete Next Step` alebo `Move Stage`
- na dashboarde: `Review Risks`

### 7.2 Hustota informácií má byť vysoká, ale kontrolovaná

Keďže MVP je desktop-first, môžeš si dovoliť viac informácií než mobilné CRM. Aj tak však platí:

- karta nesmie byť preplnená,
- najdôležitejšie dáta musia byť nad foldom,
- timeline musí byť čitateľná bez chaosu,
- formulár návštevy musí byť rýchly, nie „enterprise labyrinth".

### 7.3 Detailný record musí podporovať prácu v kontexte

Najlepšie patterny z HubSpotu a Copperu hovoria jedno: človek nemá skákať medzi 5 modulmi. Preto odporúčam, aby customer card obsahovala:

- summary panel,
- kontakty,
- otvorené opportunities,
- posledné návštevy,
- timeline,
- quick actions.

### 7.4 Vizualizovať riziko, nie len status

Nestačí ukázať fázu dealu. Treba ukázať aj kvalitu dealu.

Na opportunity karte majú byť viditeľné aspoň:

- stage,
- value,
- weighted value,
- next step,
- due date,
- dni od poslednej aktivity,
- risk badge.

### 7.5 Empty states majú navigovať

Ak zákazník nemá kontakty, obrazovka nemá byť prázdna. Má hovoriť:

- pridaj hlavný kontakt,
- zaloguj prvú návštevu,
- vytvor prvú príležitosť.

Toto je dôležité najmä pri adopcii nového interného systému.

---

## 8. Odporúčaný dátový model pre vlastný CRM

Toto nie je finálna schéma databázy, ale research-driven odporúčanie, ako rozmýšľať nad jadrom systému.

### Core entity

- **users**
- **customers**
- **contacts**
- **visits**
- **visit_contacts**
- **opportunities**
- **opportunity_stage_history**
- **tasks**
- **activity_timeline_events** alebo odvodená timeline vrstva
- **imports**
- **audit_log**

### Dôležité modelové rozhodnutia

#### Visits a generic activities nepliesť do jednej entity

`visits` majú iný obchodný význam než bežné tasky alebo systémové udalosti. Preto ich drž ako samostatnú tabuľku.

#### Opportunity stage history ukladať explicitne

Nestačí mať len aktuálnu fázu. Budeš chcieť vedieť:

- kedy sa stage zmenila,
- kto ju zmenil,
- koľko dní deal strávil v danej fáze.

#### Tasky držať samostatne

Ak due date ostane len v opportunity, prídeš o:

- closed/open históriu,
- viac krokov nad jednou opportunity,
- reporting nad overdue taskmi.

#### Importy z ABRA / CSV logovať

Odporúčam mať tabuľku alebo log vrstvu pre import joby:

- zdroj súboru,
- čas importu,
- počet úspechov,
- počet chýb,
- mapovanie stĺpcov,
- kto import spustil.

To ti neskôr výrazne zjednoduší support.

---

## 9. Odporúčaný MVP rez po obrazovkách

### 1. Dashboard

Musí ukazovať:

- počet otvorených opportunities,
- total pipeline value,
- weighted pipeline value,
- dealy po termíne,
- stagnujúce dealy,
- návštevy za obdobie,
- conversion visit -> opportunity.

### 2. Customers list

Musí vedieť:

- vyhľadávanie,
- filtre podľa segmentu a kategórie,
- rýchle otvorenie customer card,
- indikovať poslednú aktivitu.

### 3. Customer card

Musí obsahovať:

- základný profil,
- kontakty,
- visits,
- opportunities,
- otvorené tasky,
- risk panel,
- quick actions.

### 4. Visit form

Toto je najkritickejšia obrazovka. Musí byť:

- rýchla,
- validovaná,
- logická,
- bez zbytočnej administratívy.

Odporúčam členenie:

- základ návštevy,
- výsledok a potreba,
- obchodný potenciál,
- konkurencia,
- next step,
- opportunity block, ak vznikla.

### 5. Pipeline board

Musí vedieť:

- drag & drop,
- zobraziť kvalitné karty,
- filtrovať podľa ownera a rizika,
- ukázať weighted totals per stage.

### 6. Opportunity detail

Musí vedieť:

- zobraziť úplný kontext,
- editovať hodnotu a stage,
- spravovať next steps,
- ukázať históriu zmien,
- zobraziť súvisiace visits.

---

## 10. Čo vedome nestavať do V1

Toto je kritické, lebo tvoj najväčší limit nie je technológia, ale budúca údržba.

### Nevkladať do V1

- generický automation builder,
- custom field builder pre všetko,
- custom module builder,
- email tracking a mailbox sync,
- kalendárové obojsmerné synchronizácie,
- CPQ / quote builder,
- dokument manažment okrem jednoduchých odkazov alebo attachmentov,
- AI summarization, scoring, predikcie,
- multi-currency a multi-language support,
- zložité permission matrixy,
- natívne mobilné appky.

### Prečo to nedáva zmysel teraz

- nepridáva to najvyššiu hodnotu pre disciplínu obchodníkov,
- zvyšuje to maintenance burden,
- odďaľuje to moment, keď sa CRM začne reálne používať.

---

## 11. Čo zaradiť až po MVP

### V1.1

- manager report view,
- detailnejšie KPI dashboardy,
- lepšie filtre a saved views,
- export reportov,
- ABRA import wizard s mappingom,
- notifikácie na overdue next step.

### V1.2

- ABRA invoice -> won sync,
- ABRA order status mapping,
- richer attachments / document links,
- activity templates,
- keyboard shortcuts a rýchlejšie desktop flows.

### Neskôr

- AI sumarizácia návštev,
- scoring príležitostí,
- email a kalendár sync,
- mobilný web polish,
- plnohodnotná integrácia ABRA cez API.

---

## 12. Finálne odporúčanie pre Marpex self-build

Stavaj **úzke, disciplinované, online CRM**, nie všeobecný CRM framework.

### Presný smer

- **desktop-first online CRM**,
- **visit-first workflow**,
- **customer card ako centrum práce**,
- **pipeline ako riadiaci pohľad**,
- **task / next step model ako samostatná entita**,
- **CSV/Excel import ako prvá integračná vrstva**,
- **minimum meta-konfigurácie, maximum explicitnej logiky**.

### Najlepší mix inšpirácie

- **Pipedrive**: action bias a pipeline čitateľnosť
- **HubSpot**: record context a timeline
- **Zoho CRM**: procesné vynútenie a podmienené validácie
- **Copper**: jednoduchosť kariet a accountability
- **monday**: formulár -> workflow -> dashboard tok

### Jedna veta, ktorá by mala riadiť Phase 2

**Marpex CRM nemá byť databáza zákazníkov. Má to byť systém, ktorý z každej návštevy tlačí obchodníka k ďalšiemu konkrétnemu kroku a dáva manažérovi okamžitú viditeľnosť, kde pipeline rastie a kde sa kazí.**