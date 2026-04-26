# Marpex CRM – Launch Checklist

Tento dokument pokrýva všetky kroky potrebné na nasadenie Marpex CRM na VPS server a spustenie pilotu.

---

## 1. Prerekvizity na serveri

| Položka | Minimum | Odporúčané |
|---|---|---|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| CPU | 2 vCPU | 4 vCPU |
| Docker | 24+ | latest |
| Docker Compose | v2 CLI plugin | latest |
| Node.js | 22 LTS | latest 22.x LTS |
| npm | 10+ | latest |

---

## 2. Premenné prostredia (`.env`)

Vytvor súbor `06_IMPLEMENTATION/.env` (na serveri nikdy necommit do git):

```env
# Database
DATABASE_URL=postgresql://marpex:ZMEN_HESLO@localhost:5432/marpex_crm
DB_PASSWORD=ZMEN_HESLO

# API
API_PORT=3005
SESSION_SECRET=NAHODNY_RETAZEC_MIN_64_ZNAKOV
ANNUAL_REVENUE_TARGET_EUR=

# Web (vite build)
VITE_API_URL=https://crm.vasadomena.sk/api
```

`ANNUAL_REVENUE_TARGET_EUR` je voliteľný override pre coverage ratio. Ak ho nenastavíš, dashboard odvodí target z `currentRevenue` na zákazníkoch (`súčet currentRevenue × 1.3`).

**Generovanie SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 3. Docker – databáza

```bash
cd 06_IMPLEMENTATION
docker compose up -d db
# Overiť:
docker compose ps
docker compose logs db --tail=20
```

Počkaj kým Postgres hlási `ready to accept connections`.

---

## 4. DB migrácia a seed

```bash
# Inštalácia závislostí
npm install

# Spustenie migrácie
npm -w apps/api run db:migrate

# Seed (len pre prvé spustenie alebo reset)
npm -w apps/api run db:seed
```

**Seed vytvorí tieto používateľov:**

| Email | Heslo | Rola |
|---|---|---|
| manager@marpex.sk | manager123 | manager |
| obchodnik1@marpex.sk | sales123 | salesperson |
| obchodnik2@marpex.sk | sales123 | salesperson |

> ⚠️ Po pilote okamžite zmeň všetky heslá cez `/settings/users` alebo priamo v DB.

---

## 5. Produkčný build

```bash
# Build frontend (výstup: apps/web/dist/)
npm -w apps/web run build

# Build API (výstup: apps/api/dist/)
npm -w apps/api run build
```

---

## 6. Spustenie API

**Development (s hot-reload):**
```bash
cd apps/api
npx tsx src/server.ts
```

**Production:**
```bash
cd apps/api
node dist/server.js
```

**Ako systemd service** (`/etc/systemd/system/marpex-api.service`):
```ini
[Unit]
Description=Marpex CRM API
After=network.target postgresql.service

[Service]
Type=simple
User=marpex
WorkingDirectory=/opt/marpex-crm/06_IMPLEMENTATION/apps/api
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
EnvironmentFile=/opt/marpex-crm/06_IMPLEMENTATION/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable marpex-api
systemctl start marpex-api
systemctl status marpex-api
```

---

## 7. Nginx konfigurácia (HTTPS + reverse proxy)

### 7.1 Inštalácia Nginx a Certbot

```bash
apt install nginx certbot python3-certbot-nginx -y
```

### 7.2 Nginx site config (`/etc/nginx/sites-available/crm`)

```nginx
server {
    server_name crm.vasadomena.sk;

    # Statické súbory frontendu
    root /opt/marpex-crm/06_IMPLEMENTATION/apps/web/dist;
    index index.html;

    # SPA routing (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 7.3 SSL cert (Let's Encrypt)

```bash
certbot --nginx -d crm.vasadomena.sk
# Vyber možnosť redirect HTTP → HTTPS
```

---

## 8. Zálohovanie databázy

### 8.1 Manuálna záloha

```bash
docker exec marpex-crm-postgres-1 pg_dump -U marpex marpex_crm | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 8.2 Automatická záloha (cron)

```bash
# Edituj crontab pre používateľa marpex
crontab -e

# Záloha každý deň o 02:00, uchovaj 30 dní
0 2 * * * docker exec marpex-crm-postgres-1 pg_dump -U marpex marpex_crm | gzip > /opt/marpex-backups/backup_$(date +\%Y\%m\%d).sql.gz && find /opt/marpex-backups/ -name "*.sql.gz" -mtime +30 -delete
```

### 8.3 Restore test

```bash
# Obnovenie z backupu (TEST na staging prostredí, nie na produkciu!)
gunzip -c backup_20250101_020000.sql.gz | docker exec -i marpex-crm-postgres-1 psql -U marpex marpex_crm
```

> ⚠️ Restore test vykonaj minimálne raz pred go-live, aby si overil, že zálohy sú funkčné.

---

## 9. Smoke test scenáre

Po nasadení overif tieto toky:

### 9.1 Auth

- [ ] Login manager@marpex.sk → presmeruje na Dashboard
- [ ] Login obchodnik1@marpex.sk → presmeruje na Dashboard
- [ ] Nesprávne heslo → chybová hláška
- [ ] Logout → presmeruje na Login, session zmazaná

### 9.2 Zákazníci

- [ ] Zoznam zákazníkov sa načíta
- [ ] Vyhľadávanie podľa názvu funguje (`?q=`)
- [ ] Filter podľa segmentu funguje
- [ ] Vytvorenie nového zákazníka
- [ ] Detail zákazníka (`/customers/:id`) – kontakty, návštevy, príležitosti
- [ ] CSV import zákazníkov (`/import`)

### 9.3 Návštevy

- [ ] Zoznam návštev sa načíta
- [ ] Vytvorenie návštevy (všetky povinné polia)
- [ ] Filter podľa zákazníka
- [ ] Filter podľa dátumu (od/do)
- [ ] Filter "len meškajúce"

### 9.4 Pipeline

- [ ] Kanban board sa načíta
- [ ] Vytvorenie príležitosti
- [ ] Kliknutie na kartu → Detail (`/pipeline/:id`)
- [ ] Posun fáze dopredu + gate dáta
- [ ] Pokus o posun späť → chyba
- [ ] Stagnant karty sú červené

### 9.5 Dashboard (manager)

- [ ] KPI metriky sa zobrazia
- [ ] Semafór % funguje
- [ ] Top-10 príležitostí

### 9.6 Report (manager)

- [ ] Salesperson report (`/report`) sa načíta
- [ ] Risk farby (červená/žltá/zelená) sú správne

### 9.7 Používatelia (manager)

- [ ] Zoznam používateľov (`/settings/users`)
- [ ] Vytvorenie nového používateľa
- [ ] Zmena role

### 9.8 Bezpečnosť

- [ ] `/api/report/salesperson` vracia 403 pre salesperson
- [ ] `/api/users` vracia 403 pre salesperson
- [ ] Neautorizovaný GET `/api/customers` vracia 401
- [ ] Rate limiting: 6+ nesprávnych loginov → 429

---

## 10. Post-launch checklist

- [ ] Zmeniť všetky seed heslá
- [ ] Nastaviť zálohovanie (cron)
- [ ] Overiť restore test
- [ ] Nastaviť monitoring (napr. uptime check na `/api/health`)
- [ ] Informovať pilotných obchodníkov o URL a prihlasovacích údajoch
- [ ] Dohodnut pilot review dátum (odporúčame 2 týždne po go-live)
- [ ] Zálohovať `.env` súbor na bezpečné miesto (nie git)
- [ ] HTTPS certifikát si nastaviť auto-renewal (certbot timer je predvolene aktívny)

---

## 11. Monitoring endpointy

| Endpoint | Popis |
|---|---|
| `GET /api/health` | Zdravie API + DB ping |
| `GET /api/auth/me` | Aktuálna session (pri 401 = nie je prihlásený) |

Vhodné pre uptime monitor (napr. UptimeRobot, Betterstack).

---

## 12. Zhrnutie portov

| Služba | Port | Vystavený externe? |
|---|---|---|
| PostgreSQL | 5432 | ❌ nie (len localhost) |
| Fastify API | 3005 | ❌ nie (cez Nginx proxy) |
| Nginx HTTP | 80 | ✅ (redirect na 443) |
| Nginx HTTPS | 443 | ✅ |
| Vite dev server | 5173 | ❌ iba development |
