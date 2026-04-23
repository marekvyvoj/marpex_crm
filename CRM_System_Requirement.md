# 📘 Calm Effectivity CRM System
## Industrial Automation Sales Engine

---

## 🔴 HLAVNÝ CIEĽ (NEPREHLIADNUTEĽNÉ)

Zvýšiť tržby o **+30 %** pomocou riadeného CRM systému, ktorý transformuje obchodníkov z "návštevníkov zákazníkov" na systematických generátorov pipeline a rastu.

---

## 📋 AKTUÁLNY STAV A PROBLÉM

**Existujúca situácia:**
- Firma má implementovaný ERP systém **ABRA** (v.26.1)
  - [ABRA Dokumentácia](https://help.abra.eu/sk/26.1/G3/Content/Part50_TechDoc/tech_doc.htm)
  - Obsahuje: faktúry, objednávky, ponuky
  - **Problém:** Obchodníci ERP nepoužívajú

**Dôvod potreby CRM:**
- ERP je kvôli administratíve (finance, logistika, operácie)
- CRM musí byť nástroj (**pre obchodníkov**)
  - Zameraný na pipeline a rast
  - Intuitívny a rýchly
  - Zlepší komunikáciu s ERP (integrácia)

**Synergia:**
- ERP zústaňe systémon pravdy pre finance/objednávky
- CRM bude mať svoje dáta pre obchodný proces
- Integrácia → synchronizácia kľúčových údajov

---

## 🧠 CORE PRINCÍP

**CRM ≠ evidencia**
**CRM = operating system na rast tržieb**

Každý prvok systému musí odpovedať na 5 otázok:

1. Kde je reálny potenciál rastu?
2. Aký problém zákazník rieši?
3. Aká konkrétna obchodná príležitosť vznikla?
4. Čo je ďalší krok a dokedy?
5. Prečo vyhráme / prehráme?

---

## 🧱 ARCHITEKTÚRA SYSTÉMU

### 1. CRM moduly

#### A. Customers (Zákazníci)
- segment (OEM, výroba, integrátor…)
- aktuálny obrat
- potenciál
- share of wallet
- produktové skupiny (má vs nemá)
- konkurencia
- strategická kategória (A/B/C)

#### B. Contacts (Kontakty)

Každý zákazník musí mať:
- nákup
- údržba
- automatizér
- výroba
- vedenie
- integrátor

Každý kontakt:
- rola (decision maker / influencer / user)
- vzťah
- vplyv

#### C. Visits (Návštevy)

→ **hlavný vstup dát**

Každá návšteva musí produkovať:
- potrebu
- potenciál
- next step

#### D. Opportunities (Príležitosti)

→ **jadro rastu**

Každá príležitosť:
- má hodnotu €
- má fázu
- má next step
- má konkurenciu

#### E. Pipeline

→ **riadenie biznisu**

---

## 🧩 CRM FORMULÁR – POVINNÉ POĽA

### MINIMUM (hard enforcement)

Po každej návšteve musí byť:
- dátum
- zákazník
- kontakt
- cieľ návštevy
- výsledok
- potreba zákazníka
- vznikla príležitosť (áno/nie)
- potenciál €
- konkurencia
- next step
- termín next stepu

### ROZŠÍRENÉ BLOKY

#### 1. Základ návštevy
- typ (osobná, technická, projektová…)
- účel

#### 2. Zistenia
- problém zákazníka
- stav projektu
- rozpočet
- priorita

#### 3. Technológia
- aktuálne značky
- PLC / HMI / pohony
- vek technológie
- retrofit potenciál

#### 4. Obchodný potenciál
- produktová skupina
- typ (projekt / servis / cross-sell)
- € hodnota
- pravdepodobnosť
- close date

#### 5. Konkurencia
- kto tam je
- prečo vyhráva
- naša výhoda
- riziko prehry

#### 6. Next step (kritické)
- čo konkrétne
- kto
- dokedy

---

## ⚙️ PIPELINE MODEL

### Fázy
- Identifikovaná potreba (10%)
- Kvalifikovaná príležitosť (25%)
- Technické riešenie (40%)
- Ponuka odovzdaná (55%)
- Rokovanie (70%)
- Verbálne potvrdené (90%)
- Vyhraté (100%)
- Prehraté (0%)

### Pravidlá

Opportunity nemôže existovať bez:
- hodnoty €
- fázy
- next stepu
- termínu

Opportunity nemôže ísť do "Ponuka" bez:
- technického zadania
- konkurencie
- follow-up dátumu

Opportunity bez pohybu **30 dní**:
→ review alebo close

---

## 📊 KPI SYSTÉM

### Manažér sleduje:

**Pipeline**
- total €
- weighted €
- coverage (>= 3x target)

**Aktivita**
- počet návštev
- návšteva → opportunity %

**Výkonnosť**
- win rate
- average deal size
- cross-sell %

**Riziko**
- stagnujúce príležitosti
- dôvody prehier

---

## 📈 DASHBOARD LOGIKA

### KPI
- počet zákazníkov
- počet návštev
- otvorené príležitosti
- pipeline €
- weighted pipeline €
- vyhraté €
- prehraté

### Kontroly
- pipeline coverage vs target
- stagnujúce príležitosti
- existujú next steps?

### Semafor
- OK
- POZOR
- RIZIKO

---

## 👤 REPORT OBCHODNÍKA

Každý obchodník vidí:
- počet návštev
- počet príležitostí
- pipeline €
- weighted pipeline €
- win rate
- priemerná veľkosť dealu

### TOP 10 príležitostí
- názov
- zákazník
- fáza
- hodnota
- pravdepodobnosť
- next step

---

## ⚠️ STAGNUJÚCE PRÍLEŽITOSTI

### Definícia
Príležitosť bez aktivity X dní (default 30)

### Obsah
- názov
- obchodník
- hodnota
- next step
- dni po termíne

---

## 🎯 GROWTH TRIGGERS (kritické pre +30%)

Obchodník MUSÍ zisťovať:
- nové investície
- retrofity
- poruchy
- nedostupné diely
- bezpečnosť
- energetika
- digitalizácia
- nespokojnosť s dodávateľom

---

## 🧠 STRATEGICKÝ MODEL

### 3 zdroje rastu

1. **Existing accounts**
   → zvýšiť share of wallet

2. **Projects**
   → automatizácia, retrofit

3. **Cross-sell**
   → rozšíriť produktové portfólio

---

## 🧪 IMPLEMENTAČNÉ PRAVIDLÁ

### DISCIPLÍNA
- návšteva bez zápisu = neexistuje
- zápis do 24h
- bez next stepu = nevalidné
- bez € = nevalidné

### MANAŽMENT
- weekly pipeline review
- top deals review
- lost deals analysis

---

## 🔗 INTEGRÁCIA S ABRA ERP

### Čo sa synchronizuje z ABRA do CRM

**Do CRM importovať:**
- Vytvorenú objednávku → update opportunity status
- Vypísanú faktúru → deal sa markuje ako "vyhraté"
- Ponuku → link na dokumenty v ERP

**Z CRM do ABRA:**
- Vytvorená príležitosť → možnosť vytvoriť draft ponuku v ABRA
- Uzavretý deal → template na objednávku

### Účel
- CRM je obchodný proces (prvak ≠ faktúra)
- ABRA zústaňe systémon pravdy pre finance
- Obchodník vidí vo svojom CRM čo sa deje v ERP

### Implementácia
- API na ABRA (REST/SOAP) 
- Real-time sync kľúčových údajov
- Fallback: ručný import (Excel) v MVP fáze

---

## 📂 EXCEL STRUKTÚRA (pre MVP/pilot fázu)

### Sheets
- Customers
- Contacts
- Visits
- Opportunities
- Dropdown_Values
- KPI_Dashboard
- Obchodnik_Report
- Stagnujuce_Prilezitosti

---

## 🧰 TECH STACK PRE DEVELOPMENT

> Detailné technologické rozhodnutia sú v `02_TECHNOLOGY_STACK.md`

### Vysokoúrovňové požiadavky
- CRM systém (custom build / SaaS / hybrid — rozhodne Phase 1-2)
- **API integrácia s ABRA ERP** (faktúry, objednávky, ponuky)
- Offline podpora (obchodníci v teréne)
- Mobilný prístup (telefón + tablet + laptop)
- AI layer v budúcnosti (Copilot / agenti)

---

## 🤖 AI EXTENSIONS (NEXT PHASE)

### Možnosti
- auto-sumarizácia návštev
- návrh next steps
- scoring príležitostí
- generovanie ponúk
- predikcia win rate

---

## 🚀 ROADMAP

### Fáza 1
- Excel pilot
- disciplína
- pipeline tracking

### Fáza 2
- CRM implementácia
- dashboardy
- reporting

### Fáza 3
- AI integrácia
- automatizácia

---

## 🔚 ZHRNUTIE

Tento systém robí jednu vec:

**Transformuje obchod z chaotických návštev na riadený systém rastu.**

Ak CRM:
- nemá pipeline → je mŕtve
- nemá next steps → je ilúzia
- nemá € hodnoty → nie je obchod
- nemá offline → obchodníci ho nepoužijú

---

## 🔥 NAJDÔLEŽITEJŠIE PRAVIDLO

**Každá interakcia so zákazníkom musí viesť k obchodnej príležitosti alebo jasnému dôvodu, prečo nie.**
