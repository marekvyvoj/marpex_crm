# ADR 0002: API Error Contract, Pagination a MVP tradeoffs

## Status

Accepted

## Rozhodnutie

- chybové odpovede API majú jednotný tvar `{ error, code, details? }`
- list endpointy vracajú kompatibilne pole položiek a pagination metadata posielajú v HTTP headeroch
- login rate limiting ostáva pre pilot in-memory, lebo nasadenie je single-instance
- cache vrstva sa pre current scope 5-20 používateľov nezavádza

## Prečo

- frontend a test suite už pracujú s poliami a nechceme rozbiť wire format
- header-based pagination dovolí zaviesť stránkovanie bez zmeny existujúcich obrazoviek
- distributed rate limiting a cache by v tomto štádiu zvýšili komplexitu viac než prinesú hodnoty

## Trigger na revisiting

- viac než jedna API inštancia
- citeľne väčší dataset alebo pomalé dashboard dotazy
- potreba shared cache alebo centralizovaného throttlingu