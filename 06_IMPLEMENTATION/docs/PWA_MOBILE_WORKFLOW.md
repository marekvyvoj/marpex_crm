# PWA Mobile Workflow Pre Návštevy

Tento dokument popisuje odporúčaný ďalší krok pre mobilné používanie Marpex CRM nad rámec aktuálnej responzívnej web aplikácie a browser diktovania poznámok.

## Cieľ

- zrýchliť založenie návštevy na mobile
- minimalizovať počet klikov pri zápise po stretnutí
- umožniť hlasové zadanie poznámky a priebežné drafty
- zachovať online-first architektúru bez plného offline režimu

## Aktuálny Stav

- aplikácia je responzívna web app v browseri
- formulár návštevy už podporuje voľnú poznámku
- v podporovaných mobilných browseroch funguje diktovanie poznámky cez Web Speech API
- detail návštevy a pipeline stage detail sú už použiteľné aj na mobile

## Navrhovaný PWA Rozsah

### 1. Installable Shell

- pridať `manifest.webmanifest`
- doplniť app icon set pre Android a iOS
- nastaviť `display: standalone`
- doplniť farby a názov aplikácie pre home screen

Výsledok:

- používateľ si vie aplikáciu pripnúť na plochu telefónu
- otvorenie pôsobí viac ako appka a menej ako klasická stránka

### 2. Quick Add Návšteva

Pridať samostatný mobilný flow `Nova navsteva` s minimálnym formulárom:

- zákazník
- kontakt
- dátum
- výsledok návštevy
- poznámka

Voliteľné polia ako konkurencia, potreba zákazníka, next step, potenciál a typ príležitosti môžu zostať v druhom kroku alebo v editácii detailu.

Výsledok:

- obchodník zapíše jadro návštevy do 20-40 sekúnd
- zvyšok doplní neskôr z detailu návštevy

### 3. Draft Autosave

Pre mobilný visit flow odporúčam draft vrstvu:

- draft ukladať do `localStorage` podľa kľúča používateľ + customerId
- autosave pri zmene po 500-1000 ms
- po úspešnom odoslaní draft zmazať
- pri návrate do formulára ponúknuť obnovu rozpracovaného záznamu

Výsledok:

- používateľ nestratí rozpracovaný zápis
- flow je odolnejší voči prerušeniu hovoru alebo prepnutiu appky

### 4. Hlasový Vstup

Aktuálny browser dictation je vhodný ako baseline. Pre PWA fázu odporúčam:

- ponechať browser `SpeechRecognition`, kde je dostupný
- na iOS a unsupported browseroch komunikovať fallback na systémové diktovanie klávesnice
- držať hlasové zadanie len pre voľnú poznámku, nie pre celý formulár

Výsledok:

- implementácia ostane malá a spoľahlivá
- netreba stavať vlastný speech backend

### 5. Safe UX Pri Jazde

Táto aplikácia nemá podporovať manuálnu interakciu počas jazdy.

Odporúčaný UX text:

- návštevu zapisujte len pri státí
- počas presunu použite len hands-free diktovanie poznámky
- po zastavení doplňte štruktúrované polia

## Technický Návrh

### Web Vrstva

- pridať manifest a service worker registráciu vo Vite appke
- service worker používať len na app shell a statické assety
- API requesty necacheovať ako offline queue

### Prečo Nie Full Offline

- repo smerovanie je stále online-first MVP
- ABRA a session-based auth sú jednoduchšie bez offline sync vrstvy
- offline konflikty pre návštevy a pipeline by zbytočne rozšírili scope

## Odporúčané Implementačné Kroky

1. pridať manifest, ikony a install prompt
2. spraviť mobilný quick-add visit flow
3. doplniť draft autosave a restore
4. ponechať existujúce diktovanie poznámky ako hlasový vstup
5. overiť PWA install a quick-add flow na Android Chrome a iPhone Safari

## Mimo Aktuálneho Scope

- plná offline synchronizácia
- background sync fronty pre POST requesty
- natívna mobilná aplikácia
- vlastný speech-to-text backend

## Záver

Najlepší ďalší krok pre mobil je malá PWA vrstva nad existujúcou responzívnou appkou, nie prepis do natívnej aplikácie. Najväčšiu hodnotu prinesie kombinácia `installable shell + quick add navsteva + draft autosave`, pričom aktuálne browser diktovanie ostane najrýchlejšia cesta pre voľnú poznámku.