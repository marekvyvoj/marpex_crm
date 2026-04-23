FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/domain/package.json packages/domain/package.json

RUN npm ci

COPY apps/api ./apps/api
COPY packages/domain ./packages/domain

RUN npm -w packages/domain run build && npm -w apps/api run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/domain/package.json ./packages/domain/package.json
COPY --from=builder /app/packages/domain/dist ./packages/domain/dist

EXPOSE 3005
WORKDIR /app/apps/api

CMD ["node", "dist/server.js"]