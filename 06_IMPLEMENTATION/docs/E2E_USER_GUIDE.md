# E2E Guide pre používateľa Marpex CRM

Tento dokument vysvetľuje, čo v Marpex CRM znamená `E2E`, ako si vieš systém prejsť od začiatku do konca ako používateľ a ako si môžeš spustiť aj automatizované E2E testy.

## 1. Čo je E2E

`E2E = end-to-end`, teda overenie celého toku od používateľského kliknutia v UI až po odpoveď backendu a zápis do databázy.

V praxi to znamená, že neskúšaš izolovaný formulár alebo samostatnú funkciu, ale kompletný scenár, napríklad:

- prihlásenie do systému
- otvorenie zákazníka
- úpravu údajov firmy
- pridanie kontaktu
- import CSV
- otvorenie manažérskeho reportu

E2E je užitočné z dvoch dôvodov:

- používateľ si vie overiť, že systém funguje tak, ako ho bude reálne používať
- tím vie automaticky odhaliť regresie po ďalších úpravách

## 2. Čo potrebuješ pripraviť

Pre manuálne vyskúšanie systému v produkcii na Railway:

Stačí ti webový prehliadač a prístup k produkčným URL.

Ak chceš pracovať s lokálnym vývojom:

1. Spusti PostgreSQL cez Docker Compose.
2. Uisti sa, že migrácie a seed sú aplikované.
3. Spusti API a web aplikáciu.

Odporúčaný lokálny postup:

```powershell
Set-Location "c:\Users\marko\Desktop\Marpex_CRM\06_IMPLEMENTATION"
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev:web
```

Production URL pre manuálne použitie:

- Web: `https://web-production-c47f4.up.railway.app`
- API health: `https://marpexcrm-production.up.railway.app/api/health`

Lokálne URL (pri lokálnom vývoji):

- Web: `http://localhost:5173`
- API health: `http://localhost:3005/api/health`

Testovacie účty:

- Manažér: `manager@marpex.sk` / `manager123`
- Obchodník: `obchodnik1@marpex.sk` / `sales123`

## 3. Manuálny E2E walkthrough

Táto časť je určená pre používateľa systému. Každý scenár je napísaný ako konkrétny postup s očakávaným výsledkom.

### Scenár A: Prihlásenie a základná orientácia

Kroky:

1. Otvor `https://web-production-c47f4.up.railway.app` (alebo `http://localhost:5173` ak pracuješ lokálne).
2. Prihlás sa ako manažér cez `manager@marpex.sk` / `manager123`.
3. Po prihlásení sa má otvoriť Dashboard.
4. V ľavej navigácii over položky `Dashboard`, `Zákazníci`, `Návštevy`, `Pipeline`, `Import`, `Report`, `Používatelia`.

Očakávaný výsledok:

- Dashboard sa načíta bez chyby.
- Manažér vidí aj manažérske sekcie `Report` a `Používatelia`.
- Manažér vidí dashboard za celé portfólio bez potreby prepínania scope.

### Scenár B: Plán práce obchodníka

Kroky:

1. Prihlás sa ako obchodník cez `obchodnik1@marpex.sk` / `sales123`.
2. Na `Dashboarde` si všimni, že predvolený pohľad je len na tvoje portfólio.
3. Preklikni prepínač `Moje portfólio` / `Všetci obchodníci` a over, že sa dashboard prepne bez reload erroru.
4. V navigácii otvor `Plán práce`.
5. Skontroluj sumárne boxy `Po termíne`, `Dnes`, `Do 7 dní`, `Neskôr` a `Všetky next stepy`.
6. Over, že v sekciách vidíš next stepy z návštev aj z príležitostí.
7. Klikni na jednu položku z návštevy a na jednu položku z príležitosti.
8. Over, že sa otvorí správny detail (`Návšteva` alebo detail príležitosti v `Pipeline`).

Očakávaný výsledok:

- obchodník vidí svoje nadchádzajúce a oneskorené next stepy na jednom mieste
- dashboard je pre obchodníka defaultne obmedzený na jeho priradené portfólio
- položky sú rozdelené podľa urgency
- klik z plánovača vedie na správny detail zdrojového záznamu

### Scenár C: Zákazník od zoznamu po detail

Kroky:

1. V navigácii klikni na `Zákazníci`.
2. Ako obchodník over prepínač `Moje firmy` / `Všetci obchodníci`.
3. Použi filtrovanie podľa názvu firmy alebo podľa stĺpca `Obchodník`.
4. Otvor detail zákazníka kliknutím na názov firmy.
4. Na detaile si skontroluj:
   - segment a odvetvie
   - obchodníka
   - ročný plán a tržby
   - počet kontaktov, návštev a príležitostí
5. Klikni na `Upraviť`.
6. Zmeň názov firmy alebo ročný plán a ulož zmenu.
7. Ako manažér over, že vieš na firme zmeniť aj pole `Obchodník`.
8. Klikni na `+ Nový kontakt`.
9. Vyplň meno, priezvisko, pozíciu, email a telefón.
10. Ulož kontakt.
11. Preklikni tabs `Kontakty`, `Návštevy`, `Príležitosti`.

Očakávaný výsledok:

- uložené zmeny sa hneď zobrazia v hlavičke firmy
- obchodník je na firme viditeľný a manažér ho vie zmeniť
- nový kontakt sa objaví v tabuľke kontaktov
- návštevy a príležitosti sú zobrazené v samostatných tabs

### Scenár D: CSV import zákazníkov

Kroky:

1. V navigácii klikni na `Import`.
2. Do textového poľa vlož CSV v tomto formáte:

```csv
name,segment,currentRevenue,contactFirstName,contactLastName,contactRole,contactEmail,contactPhone
Phase5 Demo Alpha,oem,120000,Ján,Novák,decision_maker,jan.novak@example.test,0900123456
Phase5 Demo Beta,vyroba,80000,Petra,Kováčová,influencer,petra.kovacova@example.test,
```

3. Skontroluj náhľad tabuľky pod textovým poľom.
4. Klikni na `Spustiť import`.
5. Po úspechu si zapamätaj počet importovaných riadkov.
6. Choď späť na `Zákazníci`.
7. Vyhľadaj `Phase5 Demo Alpha`.
8. Otvor detail importovaného zákazníka a skontroluj, že kontakt bol vytvorený.

Očakávaný výsledok:

- systém zobrazí náhľad CSV ešte pred importom
- výsledok importu ukáže celkový počet riadkov, importované riadky a prípadné chyby
- importovaná firma sa dá ihneď nájsť v zozname zákazníkov

Tip pre negatívny test:

- zmeň `segment` na neplatnú hodnotu, napríklad `invalid`, a import zopakuj
- systém má vrátiť error report pre konkrétny riadok

### Scenár E: Manažérsky report obchodníkov

Kroky:

1. Prihlás sa ako manažér.
2. Otvor `Report`.
3. Skontroluj horné sumárne karty:
   - návštevy celkom
   - open pipeline
   - weighted pipeline
   - won celkom
4. V tabuľke obchodníkov si skontroluj pre každého obchodníka:
   - počet návštev
   - oneskorené návštevy
   - conversion rate
   - open a won hodnotu
   - stagnant a overdue count
   - risk badge (`OK`, `POZOR`, `RIZIKO`)

Očakávaný výsledok:

- manažér report vidí
- obchodník bez manažérskej roly report vidieť nesmie
- riadky s problémami sú zvýraznené rizikovým badgeom

### Scenár F: Pipeline a stagnácia

Kroky:

1. Otvor `Pipeline`.
2. Ako obchodník over prepínač `Moje príležitosti` / `Všetky príležitosti`.
3. Nájdeš príležitosť v niektorej fáze.
4. Potiahni ju myšou do ďalšej dovolenej fázy.
5. Klikni na detail fázy a over, že si zachová rovnaký scope ako board.
6. Vráť sa na Dashboard.
7. Skontroluj top dealy a zvýraznenie stagnujúcich príležitostí.

Očakávaný výsledok:

- karta sa po dropnutí presunie do nového stĺpca
- backend zmenu uloží a po refreshi zostane zachovaná
- obchodník vidí defaultne len svoje príležitosti, ale vie si vedome zapnúť all scope
- stagnujúce príležitosti sú viditeľne odlíšené

## 4. Ako spustiť automatizované E2E testy

Automatizované E2E testy spúšťajú Playwright scenáre z priečinka `07_TEST_SUITE/e2e`.

Príkaz:

```powershell
Set-Location "c:\Users\marko\Desktop\Marpex_CRM\07_TEST_SUITE"
npm install
npm run test:e2e
```

Čo sa pri tom deje:

- Playwright spustí API server
- Playwright spustí web aplikáciu
- scenáre prebehnú v prehliadači Chromium
- výsledok sa vypíše do konzoly

Aktuálne automatizované E2E scenáre pokrývajú:

- login a základné zobrazenie dashboardu
- validáciu prázdneho formulára návštevy
- mobile viewport navigáciu
- drag and drop v pipeline
- zvýraznenie stagnácie na dashboarde
- customer detail workflow
- CSV import workflow
- manager report workflow

Poznámka:

- runner je nastavený na `1 worker`, aby sa testy nebili o jednu databázu a cleanup zostal stabilný

## 5. Ako čítať výsledok E2E testu

Ak test prejde:

- scenár je označený ako `passed`
- celý tok funguje od UI po backend podľa očakávania

Ak test padne:

- Playwright vypíše názov scenára a miesto pádu
- pri retry vie uložiť trace na detailnú analýzu

Užitočné pravidlo:

- ak padne len jeden scenár, najprv si manuálne prejdi presne ten istý tok podľa kapitoly 3
- ak padá viac scenárov naraz, najprv skontroluj, že beží DB, migrácie aj seed

## 6. Odporúčaný používateľský mini-test po každom väčšom release

Ak nechceš testovať všetko, prejdi minimálne tento krátky balík:

1. Prihlásenie ako manažér.
2. Otvorenie `Plán práce` a kontrola najbližších next stepov.
3. Vyhľadanie zákazníka a otvorenie customer detailu.
4. Pridanie jedného kontaktu.
5. Import jedného CSV súboru.
6. Otvorenie reportu obchodníkov.
7. Kontrola pipeline a dashboardu.

Ak všetkých 7 krokov funguje bez chyby, systém je z používateľského pohľadu vo veľmi dobrej kondícii.

## 7. Kedy použiť manuálne E2E a kedy automatické E2E

Manuálne E2E použi, keď:

- chceš si systém osahať ako reálny používateľ
- testuješ UX, zrozumiteľnosť a tok práce
- kontroluješ release pred demo alebo nasadením

Automatické E2E použi, keď:

- chceš rýchlo overiť, že nič nepokazila nová zmena
- potrebuješ opakovateľný regression check
- chceš mať dôkaz, že hlavné workflow fungujú aj po refaktoringu

Najlepšia prax je kombinácia oboch:

- automatika stráži regresie
- manuálny walkthrough overuje reálny používateľský pocit zo systému