FROM node:22-alpine AS builder
WORKDIR /app/06_IMPLEMENTATION

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY 06_IMPLEMENTATION/package.json 06_IMPLEMENTATION/package-lock.json 06_IMPLEMENTATION/tsconfig.base.json ./
COPY 06_IMPLEMENTATION/apps/web/package.json apps/web/package.json
COPY 06_IMPLEMENTATION/packages/domain/package.json packages/domain/package.json
COPY 06_IMPLEMENTATION/apps/web/postcss.config.js apps/web/postcss.config.js
COPY 06_IMPLEMENTATION/apps/web/tailwind.config.js apps/web/tailwind.config.js
COPY 06_IMPLEMENTATION/apps/web/tsconfig.json apps/web/tsconfig.json
COPY 06_IMPLEMENTATION/apps/web/vite.config.ts apps/web/vite.config.ts

RUN npm ci

COPY 06_IMPLEMENTATION/apps/web ./apps/web
COPY 06_IMPLEMENTATION/packages/domain ./packages/domain

RUN npm -w packages/domain run build && npm -w apps/web run build

FROM node:22-alpine AS runtime
WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/06_IMPLEMENTATION/apps/web/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/ || exit 1

CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-3000}"]