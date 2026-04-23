# Technology Stack & Architecture Considerations
## Marpex CRM System

> **STATUS:** Draft — to be finalized after Phase 1 (Research) and Phase 2 (Planning) decisions.
> This document presents architecture options and recommendations. The final choice depends on the BUY vs BUILD vs HYBRID decision from Phase 1-2.

---

## ARCHITECTURE OPTIONS

### Option A: Progressive Web App (PWA) + Cloud Backend ⭐ Recommended if BUILD

**Pros:**
- Single codebase → web + mobile + tablet
- Offline-first (Service Workers + IndexedDB)
- Instant updates (no app store friction)
- Works on any device — laptop, iPad, Android, iPhone
- Low maintenance (one platform)
- Installable on home screen like native app

**Cons:**
- iOS PWA support has limitations (no push notifications pre-2025, limited background sync)
- Not a "real" app store presence
- Complex offline sync if data conflicts arise

**Best for:** Speed to market, small team, Apple-style simplicity.

### Option B: Native Mobile Apps (iOS + Android) + Cloud Backend

**Pros:**
- Best native UX, smooth animations
- Full push notification support
- App store presence (trust signal)

**Cons:**
- 2x development cost (iOS + Android OR React Native/Flutter)
- App store review delays updates
- Higher maintenance burden
- Overkill for 5 users

**Best for:** Consumer-facing apps, NOT internal tools for 5 people.

### Option C: Traditional Responsive Web App

**Pros:**
- Simplest development model
- Works everywhere with a browser
- Easiest to maintain

**Cons:**
- No offline capability (critical for field salespeople)
- Slower perceived performance on mobile
- No home screen install

**Best for:** Office-only tools. NOT suitable for field sales.

### Option D: Hybrid (Web + Native Companion)

**Pros:**
- Web for desktop, native for mobile
- Best of both worlds

**Cons:**
- 2 codebases to maintain
- Higher cost and complexity
- Overkill for 5 users

**Best for:** Larger teams (50+). Excessive for Marpex.

### Recommendation Summary

| Criterion | PWA (A) | Native (B) | Web (C) | Hybrid (D) |
|-----------|---------|------------|---------|------------|
| Speed to market | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| Offline support | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| Maintenance cost | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐ |
| Mobile UX | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Development cost | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Total** | **14** | **9** | **12** | **11** |

**If we build custom → PWA is the clear winner for a 5-person team.**

---

## IF BUILD: RECOMMENDED TECH STACK

> Only relevant if Phase 1-2 decides BUILD or HYBRID.

### Frontend (PWA)

| Layer | Option A (Recommended) | Option B (Alternative) | Rationale |
|-------|----------------------|----------------------|-----------|
| Framework | **React 19** | Vue 3 | Larger ecosystem, more hiring options |
| UI Library | **shadcn/ui + Tailwind CSS** | Radix + CSS Modules | Apple-style defaults, rapid prototyping |
| State | **TanStack Query** | Zustand | Server state + caching + offline |
| Offline | **Workbox (Service Workers)** | — | Industry standard for PWA |
| Charts | **Recharts** | Chart.js | React-native, simple API |
| Icons | **Lucide Icons** | Heroicons | Clean, minimal aesthetic |

### Backend (API)

| Layer | Recommendation | Rationale |
|-------|---------------|-----------|
| Runtime | **Node.js 22 LTS** | Fast, widely understood, TypeScript native |
| Framework | **Express or Fastify** | Minimal, battle-tested |
| Language | **TypeScript** | Type safety, catches bugs early |
| Database | **PostgreSQL via Supabase** | Relational (perfect for CRM), built-in REST API, auth, storage |
| Auth | **Supabase Auth** | Built-in OAuth2, email/password, role-based |
| File Storage | **Supabase Storage** | For visit notes, quotes, documents |

### Hosting & DevOps

| Component | Recommendation | Monthly Cost (5 users) |
|-----------|---------------|----------------------|
| Frontend | Vercel | $0 (free tier) |
| Backend + DB | Supabase Pro | $25 |
| Error monitoring | Sentry | $0 (free tier) |
| CI/CD | GitHub Actions | $0 (free tier) |
| **Total** | | **~$25-50/month** |

> **Note:** These are hosting costs only. Development time is the real cost — estimated at 40-80 hours.

---

## IF BUY: COST COMPARISON FRAMEWORK

> To be filled after Phase 1 research. Template:

| Solution | Monthly (5 users) | Annual | Setup Cost | Customization | ABRA API | Simplicity |
|----------|-------------------|--------|------------|---------------|----------|------------|
| Pipedrive | ~€100-175 | ~€1,200-2,100 | Low | Medium | REST ✅ | 8/10 |
| HubSpot Free | €0 (limited) | €0 | Low | Low | REST ✅ | 7/10 |
| Custom Build | ~€25-50 hosting | ~€300-600 | HIGH (dev time) | Full | Full | 10/10 |
| *[Others TBD]* | | | | | | |

> **Key insight:** SaaS solutions cost €1,000-3,000/year but save 40-80 hours of development. Custom build costs ~€25-50/month but requires significant upfront effort. The right choice depends on how well existing tools match our specific requirements (mandatory fields, pipeline rules, ABRA integration).

---

## ABRA ERP INTEGRATION

### Sync Architecture (applies to both BUY and BUILD)

| Direction | What | Trigger | Priority |
|-----------|------|---------|----------|
| ABRA → CRM | Created order | Webhook or polling | Phase B |
| ABRA → CRM | Issued invoice | Webhook or polling | Phase B |
| ABRA → CRM | Quote document link | On creation | Phase B |
| CRM → ABRA | New opportunity | Manual trigger | Phase C |
| CRM → ABRA | Won deal | Automatic | Phase C |

### Integration Strategy
- **MVP (Phase A):** No ABRA integration. Manual Excel import as fallback.
- **Phase B:** REST API integration for read-only sync (ABRA → CRM)
- **Phase C:** Bidirectional sync (CRM → ABRA draft quotes/orders)
- **Fallback:** If ABRA API is limited → scheduled CSV/Excel import (hourly or daily)

### ABRA API Notes
- ABRA v26.1 supports REST API ([documentation](https://help.abra.eu/sk/26.1/G3/Content/Part50_TechDoc/tech_doc.htm))
- **Unknown:** API rate limits, authentication method, webhook support
- **Action needed:** Test ABRA API access before Phase 4 begins

---

## SYSTEM ARCHITECTURE (if BUILD)

```
┌──────────────────────────────────┐
│          USERS (6 total)         │
│   5 Salespeople + 1 Manager     │
└──────────┬───────────────────────┘
           │
    ┌──────┴──────┐
    │  PWA Client  │  ← React + Tailwind + shadcn/ui
    │  (any device) │  ← Offline: Service Worker + IndexedDB
    └──────┬──────┘
           │ HTTPS
    ┌──────┴──────┐
    │  API Server  │  ← Node.js + TypeScript + Express
    │  (Vercel)    │  ← Auth, CRUD, KPIs, ABRA sync
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │  Supabase    │  ← PostgreSQL + Auth + Storage
    │  (managed)   │  ← Daily automated backups
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │  ABRA ERP    │  ← REST API (quotes, orders, invoices)
    │  (on-prem)   │  ← Sync: webhook or scheduled polling
    └─────────────┘
```

---

## UI DESIGN GUIDELINES (Apple-Style)

### Rules
- **Max 3 colors**: primary (#0066CC), neutral (#555), alert (#FF3B30)
- **Max 2 fonts**: one sans-serif for all UI
- **Max 3 clicks** to any feature
- **Icons over text** where possible
- **Empty states** are designed (guidance, not blank)
- **Confirmation dialogs only for destructive actions**

### Core Screens (6 total)
1. **Dashboard** — KPI cards, semaphore (OK/POZOR/RIZIKO), stagnant deals
2. **Pipeline Board** — Kanban by stage, drag & drop
3. **Visit Form** — structured, 11 mandatory fields with smart defaults
4. **Customer Card** — overview, contacts, visit history, opportunities
5. **Opportunity List** — sortable, filterable, next step always visible
6. **Salesperson Report** — personal KPIs, top 10 deals

---

## SECURITY

- **Auth:** Email/password + OAuth2 option
- **Roles:** Salesperson (own data) vs Manager (all data)
- **Encryption:** TLS in transit, encrypted at rest
- **GDPR:** EU customer data, consent tracking, right to deletion
- **ABRA credentials:** Server-side only, never in client
- **Backups:** Daily automated, 30-day retention

---

## OPEN QUESTIONS (to resolve in Phase 1-2)

1. Can ABRA's REST API support real-time webhooks, or only polling?
2. Do salespeople primarily use laptops or phones in the field?
3. Is there existing customer data to migrate (Excel, ABRA export)?
4. What is the realistic monthly budget for SaaS tools?
5. Does the team have any developer capacity, or is this fully outsourced?
