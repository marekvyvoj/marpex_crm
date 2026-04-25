FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY apps/web/postcss.config.js apps/web/postcss.config.js
COPY apps/web/tailwind.config.js apps/web/tailwind.config.js
COPY apps/web/tsconfig.json apps/web/tsconfig.json
COPY apps/web/vite.config.ts apps/web/vite.config.ts

RUN npm ci

COPY apps/web ./apps/web
COPY packages/domain ./packages/domain

RUN npm -w packages/domain run build && npm -w apps/web run build

FROM node:22-alpine AS runtime
WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/apps/web/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://0.0.0.0:3000/ || exit 1

CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]