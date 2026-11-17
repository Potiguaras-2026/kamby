FROM node:24-alpine AS web
WORKDIR /repo
COPY . .
RUN npm ci -w web -w @kamby/api && npm run build -w web

# App da doadora em versão web, servido em /app. Fala com a API no mesmo domínio.
FROM node:24-alpine AS app
WORKDIR /repo
COPY . .
RUN npm ci -w mobile -w @kamby/api && cd mobile && EXPO_BASE_URL=/app npx expo export --platform web --output-dir dist

FROM caddy:2-alpine
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=web /repo/web/dist /srv/web
COPY --from=app /repo/mobile/dist /srv/app
