# Railway API Deployment Guide – Oprava a deploy

Overené 2026-04-26 cez Railway CLI:

- live API service je `marpex_crm`
- service beží v `production` prostredí projektu `ravishing-flow`
- Railway builduje z workspace rootu `06_IMPLEMENTATION/`
- build používa Node `22.22.2`
- build command je `npm -w packages/domain run build && npm -w apps/api run build`
- start command je `npm -w apps/api run start`

Keď ti Railway padá na Dockerfile, je to preto, že Root Directory je špatne nastavený.

## 🔧 Ako to opraviť:

### V Railway dashboard pre API service:

1. Klikni na **API service** (ktorý teraz padá)
2. Choď na **Settings**

#### Nastav takto:

```
Root Directory: 06_IMPLEMENTATION
(NE: 06_IMPLEMENTATION/apps/api ❌)

Procfile: api.Procfile

Build Command: npm -w packages/domain run build && npm -w apps/api run build

Start Command: npm -w apps/api run start
```

#### Deploy > Redeploy

Railway teraz:
- Pracuje z `06_IMPLEMENTATION/` (kde je root `package.json`)
- Nájde `api.Procfile` v `06_IMPLEMENTATION/`
- Builduje správne (packages/domain aj apps/api)
- Startuje len API

---

## 📋 Čo je v repo:

`06_IMPLEMENTATION/api.Procfile` ostáva správny referenčný súbor pre API service flow.

Tieto nastavenia zodpovedajú aktuálne bežiacemu production deploymentu.

---

## 🎯 Výsledok

Keď je API deployment zelený:
- `https://marpex-api.railway.app/api/health` → `{"status":"ok"}`
- Web sa prihláša a volá túto URL

Skús to teraz! 🚀
