# Railway Web Frontend Deployment Guide

Návod ako deployovať React frontend na Railway ako **druhy service** vedľa API.

**Čas na setup: ~10 minút**

---

## 📋 Predpoklady

- ✅ API service je už na Railway a beží (z predchádzajúceho deploymenty)
- ✅ GitHub repo má updatovaný `06_IMPLEMENTATION/apps/web/package.json` s `start` skriptom
- ✅ Máš GitHub konto s push oprávneniami

---

## 🚀 KROK 1: Vytvorenie druhého Railway service pre web

1. Choď na tvoj **Railway projekt** (kde máš API)
2. Klikni **"+ New"** (horný pravý roh)
3. Vyberi **"Deploy from GitHub repo"**
4. Vyberi znova **`marpex_crm`** repo

Railway potom:
- Klonuje repo
- Detekuje `package.json` v root
- Automaticky pustí build

---

## 🔧 KROK 2: Konfigurácia web service

Keď sa service začína builday, musíš ho nakonfigurovať ako **WEB**, nie ako API.

### V Railway dashboard:

1. Klikni na nový service (zvyčajne pomenovaný `marpex-crm` alebo podobne)
2. Choď na **"Settings"** tab
3. Nájdi **"Root Directory"** a nastav:

```
06_IMPLEMENTATION/apps/web
```

4. Nájdi **"Procfile"** a nastav:

```
web.Procfile
```

Inak Railway hľadá v root, čo je zlé. Musíš mu povedať aby hľadal v `06_IMPLEMENTATION/apps/web`.

---

## 🔨 KROK 3: Build príkaz (automatický)

Railway sám detekuje build príkaz z `06_IMPLEMENTATION/apps/web/package.json`:

```
npm run build
```

To je správne. Nic nemusíš meniť.

---

## 🌐 KROK 4: Premenné prostredia

V web service klikni na **"Variables"** a pridaj:

```
VITE_API_URL=https://marpex-api.railway.app
```

Kde `marpex-api.railway.app` je tvoj **API service URL**. Môžeš si ho nájsť v API service → Settings → Domains alebo Development domain.

**OPCIA:** Ak máš vlastnú doménu (napr. `marpex.sk`):

```
VITE_API_URL=https://api.marpex.sk
```

---

## 🚀 KROK 5: Start príkaz (automatický)

Railway automaticky spustí:

```bash
npm -w apps/web run start
```

Čo znamená:
- `npm -w apps/web` – pracuj s `apps/web` workspace
- `run start` – spusti `start` skript z `apps/web/package.json`
- Ktorý servuje `dist/` na porte `3000`

---

## 🔌 KROK 6: Port a deployment

Railway automaticky:
- Detekuje port `3000` z web service (Railway preferuje port 3000)
- Priraďuje ti verejnú URL (napr. `https://marpex-web.railway.app`)

**Status sleduj v "Deployments" taške** – čaká cca 2-3 minúty na build.

---

## ✅ KROK 7: Frontendový kód musí vedieť kde je API

V `06_IMPLEMENTATION/apps/web/src/` (alebo kde sú API calls):

**Príklad (React fetch):**

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3005";

async function fetchCustomers() {
  const response = await fetch(`${API_URL}/api/customers`, {
    credentials: "include", // Cookies pre auth session
  });
  return response.json();
}
```

Alebo ak máš **API client triedu/funkciu** (napr. `lib/api.ts`):

```typescript
// apps/web/src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3005";

export const api = {
  get: (path: string) => fetch(`${API_BASE}${path}`, { credentials: "include" }),
  post: (path: string, body: unknown) =>
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    }),
  // ... ďalšie metódy
};
```

---

## 🎯 Výsledok

Keď je deployment hotový:

```
API:   https://marpex-api.railway.app
Web:   https://marpex-web.railway.app
```

Bratovi pošleš: https://marpex-web.railway.app

Aplikácia sa v браузéri prihláša a komunikuje s API automaticky (s credentials/cookies).

---

## 🔗 CORS a cookies

Aby session cookies fungovali:

1. **API strana** (`06_IMPLEMENTATION/apps/api/src/app.ts`):

```typescript
await app.register(fastifyCors, {
  origin: ["https://marpex-web.railway.app", "https://marpex.sk"],
  credentials: true, // ← DÔLEŽITÉ
});
```

2. **Web strana** (v fetch/axios):

```typescript
fetch(url, { credentials: "include" }) // ← DÔLEŽITÉ
```

---

## 🆘 Troubleshooting

### ❌ Build failed: "Missing script: build"

**Riešenie:** Skontroluj že `06_IMPLEMENTATION/apps/web/package.json` má:

```json
"scripts": {
  "build": "tsc -b && vite build",
  "start": "serve -s dist -l 3000"
}
```

### ❌ Web sa neprepája na API (CORS error)

**Riešenie:** Skontroluj:
1. `VITE_API_URL` v Railway variables
2. API `CORS_ORIGIN` settings (má byť `https://marpex-web.railway.app`)
3. Fetch/axios call má `credentials: "include"`

### ❌ "Cannot GET /"

**Riešenie:** Port je špatný. Akúkoľvek chybu v console Railway logs.

---

## 📝 Checklist

- [ ] API service je deployment a live
- [ ] Vytvoril som nový web service v Railway
- [ ] Nastayil som "Root Directory" na `06_IMPLEMENTATION/apps/web`
- [ ] Nastayil som "Procfile" na `web.Procfile`
- [ ] `VITE_API_URL` premenná ukazuje na správny API service
- [ ] Web sa builday bez erroru
- [ ] Web sa spúšťa na porte 3000
- [ ] Frontend HTML sa loady (môžeš vidieť v braužéri)
- [ ] Login stránka sa loady
- [ ] Login funguje a prihláši ťa

---

## 🎉 Go live!

Keď je všetko zelené, máš live aplikáciu na Railway:

- **API:** Prístupné pre web na Railway domene
- **Web:** Live a volá API

Pošli bratovi obe linky a testuj v produkcii! 🚀
