# Infrastructure

```yaml
dev: compose.yaml        # docker compose up --build
production: compose.prod.yaml on one Hostinger KVM 1 VPS
domain: pending          # one domain; Caddy splits by path
```

Docker is the default for backend and web from day 1, so every developer runs the same Postgres and Python as production. Running Django on the host still works (SQLite when `POSTGRES_DB` is unset) but is not the supported flow.

## Development (`compose.yaml`)

- `db`: Postgres with dev credentials inline; data in the `pgdata_dev` volume. Reset with `docker compose down -v`.
- `api`: same image as production, but `runserver` with `./backend` mounted for hot reload. Migrates on start. Port 8000.
- `web`: Vite dev server on port 5173, proxying `/api`, `/admin` and `/static` to `api`. Its `node_modules` live in Docker volumes, never shared with the host (Linux vs Windows binaries). File polling is on because Windows bind mounts do not emit change events.
- `mobile` stays on the host: Expo Go needs the LAN. `EXPO_PUBLIC_API_URL` points to the computer's port 8000.
- `npm run mobile:web` serves the donor app in the browser on port 8081. It calls the API on port 8000 of the same host; `DJANGO_CORS_DEV` lists the allowed origins, and the CORS middleware only runs with `DJANGO_DEBUG=1`.

## Production (`compose.prod.yaml`)

- `db`: Postgres, data in the `pgdata` volume, port not exposed.
- `api`: Django on Gunicorn (`backend/Dockerfile`); runs migrations and collectstatic on start.
- `caddy`: automatic TLS on `DOMINIO`. Builds the web panel and the donor app web export (`infra/caddy.Dockerfile`) and routes by path (`infra/Caddyfile`): `/api` and `/admin` to Django, `/static` to collected static files, `/app` to the donor app, everything else to the panel.

Donor app:
- Web: `https://<DOMINIO>/app`, same origin as the API, so no production CORS. Also the iPhone option without an Apple account (Safari, "Adicionar à Tela de Início"). `mobile/app.config.js` sets the `/app` base only when `EXPO_BASE_URL` is set.
- Android APK: `mobile/eas.json`, profile `preview`. Replace `DOMINIO` in `EXPO_PUBLIC_API_URL` with the real domain, then from `mobile/` run `npx eas login` once and `npx eas build -p android --profile preview`. A new domain needs a new build.
- iOS: needs an Apple Developer account; `npx eas build -p ios` and `npx eas submit -p ios` to TestFlight.

The VPS is small (1 vCPU). Keep 3 Gunicorn workers at most. Add no service (Redis, Celery, monitoring stack) without a concrete need.

## Configuration

- Dev needs no `.env` for Docker; values are in `compose.yaml`.
- Production root `.env`: `DOMINIO`, read by compose.
- Production `backend/.env`: Django and Postgres variables, listed in `backend/.env.example`. Postgres reads the same file.
- `mobile/.env`: `EXPO_PUBLIC_API_URL`.
- `.env` files are never committed.
- Production: `DJANGO_DEBUG` unset, a long random `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` and `DJANGO_CSRF_TRUSTED_ORIGINS` set to the real domain.

## Deploy

Manual until CI exists: on the server, pull `main` and run `docker compose -f compose.prod.yaml up -d --build`. Update this section when CI lands.

## Backups

Nightly `pg_dump` outside the container, 7 days kept, copied off the server encrypted. The database holds sensitive health data.
