FROM node:24-alpine AS web
WORKDIR /repo
COPY . .
RUN npm ci -w web -w @kamby/api && npm run build -w web

FROM caddy:2-alpine
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=web /repo/web/dist /srv/web
