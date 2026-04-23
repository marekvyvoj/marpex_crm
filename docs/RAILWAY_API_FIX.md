# Railway API Deployment Guide – Oprava a deploy

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

Práve som vytvoril `06_IMPLEMENTATION/api.Procfile` a pushol na GitHub.

So týmito nastaveniami by to malo fungovať.

---

## 🎯 Výsledok

Keď je API deployment zelený:
- `https://marpex-api.railway.app/api/health` → `{"status":"ok"}`
- Web sa prihláša a volá túto URL

Skús to teraz! 🚀
