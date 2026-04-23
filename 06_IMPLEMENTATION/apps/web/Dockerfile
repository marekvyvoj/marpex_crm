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

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]