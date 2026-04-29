# Railway Web Frontend Deployment Guide

Návod ako deployovať React frontend na Railway ako **druhy service** vedľa API.

Overené 2026-04-26 cez Railway CLI:

- live web service sa volá `web`
- aktuálny production build používa `06_IMPLEMENTATION/apps/web/Dockerfile`
- build beží na `node:22-alpine`
- build context musí obsahovať celý repo root, aby boli dostupné cesty `06_IMPLEMENTATION/...`
- current live flow nepoužíva `web.Procfile`
- runtime teraz servuje statické `dist/` cez `nginx:alpine` a proxuje `/api` na API service, aby session cookies ostali first-party aj v Safari

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
- Použije Dockerfile-based build pre web service
- Builduje frontend z monorepo zdrojov pod `06_IMPLEMENTATION/`

---

## 🔧 KROK 2: Konfigurácia web service

Keď sa service začína builday, musíš ho nakonfigurovať ako **WEB**, nie ako API.

### V Railway dashboard:

1. Klikni na nový service (zvyčajne pomenovaný `marpex-crm` alebo podobne)
2. Choď na **"Settings"** tab
3. Nechaj build context tak, aby obsahoval celý repo root.
4. Ako Dockerfile nastav:

```
06_IMPLEMENTATION/apps/web/Dockerfile
```

`06_IMPLEMENTATION/apps/web/Dockerfile` už obsahuje build aj runtime kroky. Pre current live setup `web.Procfile` nepoužívaj.

---

## 🔨 KROK 3: Build príkaz (automatický)

Build prebieha cez Dockerfile:

- base image: `node:22-alpine`
- install: `npm ci`
- build: `npm -w packages/domain run build && npm -w apps/web run build`
- runtime: `nginx:alpine` servuje `dist/` a proxuje `/api` na Railway API service

---

## 🌐 KROK 4: Premenné prostredia

V web service klikni na **"Variables"** a pridaj:

```
VITE_API_URL=/api
```

Pre current Railway setup je preferovaná same-origin proxy cesta `/api`, nie absolútna API doména. Tým pádom browser komunikuje s web service first-party a `nginx` request interne forwardne na API service.

**OPCIA:** Ak máš vlastnú doménu (napr. `marpex.sk`):

```
VITE_API_URL=/api
```

Ak potrebuješ API URL explicitne zobraziť alebo debugovať, Railway ju stále sprístupňuje do web service ako internú env premennú `RAILWAY_SERVICE_MARPEX_CRM_URL`, ktorú runtime proxy použije automaticky.

---

## 🚀 KROK 5: Start príkaz (automatický)

Start príkaz je definovaný v Dockerfile runtime image a servuje `dist/` cez `serve` na porte `${PORT:-3000}`.

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
const API_URL = import.meta.env.VITE_API_URL || "/api";

async function fetchCustomers() {
  const response = await fetch(`${API_URL}/customers`, {
    credentials: "include", // Cookies pre auth session
  });
  return response.json();
}
```

Alebo ak máš **API client triedu/funkciu** (napr. `lib/api.ts`):

```typescript
// apps/web/src/lib/api.ts
function resolveApiBase(rawBase = import.meta.env.VITE_API_URL || "/api") {
  const normalizedBase = rawBase.replace(/\/+$/, "");

  if (!normalizedBase || normalizedBase === "/api") {
    return "/api";
  }

  const apiBase = normalizedBase.endsWith("/api") ? normalizedBase : `${normalizedBase}/api`;
  return new URL(apiBase, window.location.origin).origin !== window.location.origin ? "/api" : apiBase;
}

const API_BASE = resolveApiBase();

export async function api(path: string, options?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
}
```

---

## 🎯 Výsledok

Keď je deployment hotový:

```
API:   https://marpexcrm-production.up.railway.app
Web:   https://web-production-c47f4.up.railway.app
```

Bratovi pošleš web Railway URL alebo vlastnú doménu.

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

Pre current Railway setup sú dôležité ešte dve veci:

- v production musí API bežať s `trustProxy: true`
- session cookie musí mať `SameSite=None` a `Secure`, ale Safari-safe cesta je dnes first-party `/api` proxy cez web runtime, nie priame cross-site fetch volania na API doménu

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
1. `VITE_API_URL` v Railway variables nastav na `/api`
2. API `CORS_ORIGIN` settings (má byť `https://marpex-web.railway.app`)
3. Fetch/axios call má `credentials: "include"`

### ❌ "Cannot GET /"

**Riešenie:** Port je špatný. Akúkoľvek chybu v console Railway logs.

---

## 📝 Checklist

- [ ] API service je deployment a live
- [ ] Vytvoril som nový web service v Railway
- [ ] Web service používa `06_IMPLEMENTATION/apps/web/Dockerfile`
- [ ] Build context obsahuje celý repo root s `06_IMPLEMENTATION/`
- [ ] `VITE_API_URL` je `/api` alebo prázdna, aby browser použil same-origin proxy
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
