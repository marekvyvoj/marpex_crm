# Railway Deployment Guide – Marpex CRM

Kompletný návod ako nasadiť Marpex CRM aplikáciu na Railway cloud platformu so všetkými komponentmi (API, Web, PostgreSQL databáza).

**Čas na setup: ~15 minút**

---

## 📋 Predpoklady

- ✅ GitHub konto s pushnutým `marpex_crm` repozitárom
- ✅ Railway konto (registrácia cez GitHub na https://railway.app)
- ✅ Projekt má v root:
  - `package.json` ✅ (Railway entry point)
  - `Procfile` ✅ (spúšťacia konfigurácia)
  - `start.sh` ✅ (build & run skript)
  - `06_IMPLEMENTATION/.env.production` ✅ (produkčná konfigurácia)

---

## 🚀 KROK 1: Registrácia na Railway

1. Choď na **https://railway.app**
2. Klikni **"Create account"**
3. Vyberi **"Continue with GitHub"**
4. Autorizuj Railway aby mal prístup k tvojim repozitárom
5. Buď presmerovaný na Railway dashboard

---

## 🛠️ KROK 2: Vytvorenie nového projektu

1. Na Railway dashboard klikni **"+ New Project"**
2. Vyberi **"Deploy from GitHub repo"**
3. Vyhľadaj `marpex_crm` repo
4. Klikni **"Deploy"**

Railway teraz:
- Klonuje tvoj GitHub repo
- Detekuje `package.json` v root
- Automaticky pustí build proces

**Status sleduj v "Deployments" taške** – čaká cca 2-3 minúty na prvý build.

---

## 🗄️ KROK 3: Vytvorenie PostgreSQL databázy

1. V Railway projekte klikni **"+ New"** (horný pravý roh)
2. Vyberi **"Database" → "PostgreSQL"**
3. Railway automaticky vytvorí PostgreSQL inštanciu

```
✅ Databáza je vytvorená a spustená
   Hostname: postgres-xyz.railway.app
   Port: 5432
   User: postgres
   Password: auto-generated
```

---

## 🔌 KROK 4: Prepojenie API s databázou

1. V Railway projekte vidíš 2 services:
   - `marpex-crm-railway` (tvoj kód)
   - `postgres` (databáza)

2. Klikni na **`marpex-crm-railway`** service

3. Choď na tab **"Variables"**

4. Pridaj tieto premenné:

```
DATABASE_URL=postgresql://postgres:<PASSWORD>@<HOST>:5432/postgres

NODE_ENV=production

SESSION_SECRET=<GENERATED_64_CHAR_SECRET>
# Vygeneruj random 64 znakový reťazec:
# openssl rand -base64 48
# Alebo online: https://www.uuidgenerator.net/random

COOKIE_DOMAIN=<tvoja-doména>
# Zatiaľ: yourdomain.railway.app

API_PORT=3000
API_HOST=0.0.0.0
```

### 🔑 Ako zístiť DATABASE_URL?

1. Klikni na **`postgres`** service v projekte
2. Choď na tab **"Connect"**
3. Skopíruj **"DATABASE_PUBLIC_URL"**
4. Vložil do `DATABASE_URL` premennej v API service

---

## 🏗️ KROK 5: Build & Deploy API

1. Vráť sa na **`marpex-crm-railway`** service
2. Choď na tab **"Deployments"**
3. Ak vidíš zelený status **"Success"** – API je deployovaný ✅

**Ak sú errory:**
- Klikni na **"View logs"** aby si videl čo sa pokazilo
- Skontroluj premenné (`DATABASE_URL`, `SESSION_SECRET`)

---

## 🌐 KROK 6: Spustenie databázových migrácií

**Musíš manuálne spustiť migrácie aby sa vytvorili tabuľky:**

1. V Railway projekte klikni na **`marpex-crm-railway`** service
2. Choď na tab **"Connect"**
3. Klikni **"Connect via SSH"** alebo skopíruj príkaz
4. V terminále behom spustil:

```bash
npm run db:migrate
npm run db:seed
```

**ALEBO cez Railway CLI (jednoduchšie):**

1. Stiahni Railway CLI: https://railway.app/cli
2. V terminále (v root `marpex_crm` folderi):

```bash
railway login
railway link  # Vyberi svoj projekt
cd 06_IMPLEMENTATION
railway run npm run db:migrate
railway run npm run db:seed
```

---

## 🎨 KROK 7: Frontend (Web)

**Možnosť A: Vercel (odporúčam – najjednoduchšie)**

1. Choď na https://vercel.com
2. Import GitHub repo `marpex_crm`
3. Root directory: `06_IMPLEMENTATION/apps/web`
4. Build command: `npm run build`
5. Deploy

Frontend sa bude automaticky builday s each push na GitHub.

**Možnosť B: Railway (všetko na jednom mieste)**

1. V Railway projekte klikni **"+ New"**
2. Deploy GitHub repo znova, ale iný build:
   - Root directory: `06_IMPLEMENTATION/apps/web`
   - Build command: `npm run build`
   - Start command: `npm run preview`

---

## 🔌 KROK 8: Spojenie Frontend ↔ API

Keď máš frontend na Vercel/Railway a API na Railway:

1. V **frontend** premenných (`Environment variables`):

```
VITE_API_URL=https://marpex-api.railway.app
```

2. V **frontend** kóde (`apps/web/src/lib/api.ts` alebo podobne):

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

const response = await fetch(`${API_URL}/api/endpoint`);
```

---

## ✅ KROK 9: Custom doména (voliteľné)

Ak máš vlastnú doménu (napr. `marpex.sk`):

1. V Railway projekte → **Settings** → **Domains**
2. Klikni **"+ New Domain"**
3. Zadaj `api.marpex.sk` pre API a `app.marpex.sk` pre web
4. Railway ti dá DNS rekordy (CNAME) ktoré musíš nastaviť u domény registrátora

---

## 📊 KROK 10: Monitoring & Logs

Keď je app live:

1. **Deployment status:** Railway Dashboard → Deployments
2. **Live logs:** Klikni na service → "Logs" tab
3. **Metrics:** Choď na service → "Metrics" (CPU, memory, requests)

---

## 🐛 Troubleshooting

### ❌ API Build failed

```
✖ Railpack could not determine how to build the app
```

**Riešenie:** Skontroluj či je `package.json` v root a či `Procfile` existuje.

```bash
ls -la package.json Procfile start.sh
```

### ❌ Databáza sa neumiestni

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Riešenie:** Skontroluj `DATABASE_URL` v premenných. Má byť:

```
postgresql://postgres:PASSWORD@postgres-SERVICE.railway.internal:5432/postgres
```

**Nie** `localhost` alebo `127.0.0.1` – Railway internú sieť.

### ❌ API beží ale frontend sa nemôže pripojiť

**Riešenie:** Skontroluj CORS v API (`apps/api/src/app.ts`):

```typescript
app.register(fastifyCors, {
  origin: ['https://yourdomain.railway.app', 'https://marpex.sk'],
  credentials: true,
});
```

### ❌ Migrácie sa nespustili

```bash
# Ak nemáš Railway CLI, použi SSH:
# 1. Railway Dashboard → Service → Connect
# 2. Skopíruj SSH príkaz
# 3. V SSH session:

cd /app/06_IMPLEMENTATION
npm run db:migrate
npm run db:seed
```

---

## 🎯 Live URL

Keď je všetko deployované:

```
API:   https://marpex-api.railway.app/api/...
Web:   https://marpex-web.railway.app (alebo tvoja doména)
```

Pošli tieto linky bratovi na testovanie! 🚀

---

## 📝 Checklist pred go-live

- [ ] GitHub repo má všetky zmeny pushnuté
- [ ] `package.json`, `Procfile`, `start.sh` sú v root
- [ ] `06_IMPLEMENTATION/.env.production` má všetky premenné
- [ ] PostgreSQL databáza je vytvorená na Railway
- [ ] `DATABASE_URL` je nastavená v API service
- [ ] `SESSION_SECRET` je generovaný a nastavený
- [ ] Databázové migrácie sú spustené (`npm run db:migrate`)
- [ ] API je deployovaný a beží bez erroru
- [ ] Frontend je deployovaný
- [ ] Frontend má `VITE_API_URL` nastavené na Railway API
- [ ] Testuješ login, vytvorenie customer, všetky основné funkcie

---

## 🆘 Ďalšia pomoc

- Railway docs: https://docs.railway.app
- Railway Community: https://railway.app/discussions
- Kontakt: support@railway.app

---

**Keď to máš hotové, pošli mi linky a spravíme finálnu validáciu!** 🎉
