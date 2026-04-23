# ADR 0001: MVP Monorepo a tenká API vrstva

## Status

Accepted

## Kontext

Marpex CRM je MVP pre malý interný tím. Scope je desktop-first web aplikácia s jedným backendom a zdieľanými domain pravidlami.

## Rozhodnutie

- monorepo ostáva rozdelené na `apps/api`, `apps/web`, `packages/domain`
- business validácie ostávajú v `packages/domain`
- API routes môžu pre MVP používať priame Drizzle queries, pokiaľ ostávajú tenké a bez duplicity business pravidiel

## Dôsledky

- nižší overhead a rýchlejší vývoj MVP
- jednoduchšie trasovanie request → query → response
- pri väčšej doméne alebo zložitejších transakciách bude treba vyčleniť service/repository layer