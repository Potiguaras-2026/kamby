# Infrastructure

```yaml
dev: compose.yaml        # docker compose up --build
demo: Vercel (donor app web) + Render (API, admin, Postgres), free plans
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
- Android APK: `mobile/eas.json`, profile `preview`. `EXPO_PUBLIC_API_URL` points to the Render demo; for the VPS, change it to the real domain. Then from `mobile/` run `npx eas login` once and `npx eas build -p android --profile preview`. A new domain needs a new build.
- iOS: needs an Apple Developer account; `npx eas build -p ios` and `npx eas submit -p ios` to TestFlight.

The VPS is small (1 vCPU). Keep 3 Gunicorn workers at most. Add no service (Redis, Celery, monitoring stack) without a concrete need.

## Configuration

- Dev needs no `.env` for Docker; values are in `compose.yaml`.
- Production root `.env`: `DOMINIO`, read by compose.
- Production `backend/.env`: Django and Postgres variables, listed in `backend/.env.example`. Postgres reads the same file.
- `mobile/.env`: `EXPO_PUBLIC_API_URL`.
- `.env` files are never committed.
- `KAMBY_DEMO=1` (on in dev): signups are approved at once, the app shows the demo banner on every screen (read from the public `GET /api/v1/demo`), the sign-in screen offers "Entrar sem cadastro" into the seeded donor account, and a button plays the milk bank's part, step by step. Turn it off once the bank reviews donors for real.
- Production: `DJANGO_DEBUG` unset, a long random `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` and `DJANGO_CSRF_TRUSTED_ORIGINS` set to the real domain.

## Demo: Vercel + Render

For showing the app before the VPS exists. Free plans, so demo data only: never real donors.

API (Render, `render.yaml`):
1. Render dashboard: New, Blueprint, pick this repository. It creates `kamby-db` (Postgres) and `kamby-api` (Docker, `backend/Dockerfile`).
2. Fill `SEED_SENHA` when asked. The other variables come from the blueprint; `RENDER_EXTERNAL_HOSTNAME` adds the service domain to `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`.
3. On start the container migrates, collects static files (served by WhiteNoise, so the admin has CSS), runs `seed_demo` because `KAMBY_DEMO=1`, and starts Gunicorn on `$PORT` with `WEB_CONCURRENCY` workers.
4. Admin: `https://kamby-api.onrender.com/admin/`, login with e-mail and password (staff only; the seed's team account is `equipe@example.com` with `SEED_SENHA`). Phone login is for donors in the app. If Render gives the service another domain, update it in `mobile/vercel.json` and `mobile/eas.json`.

Donor app (Vercel, `mobile/vercel.json`):
1. Vercel dashboard: New Project, this repository, Root Directory `mobile`, framework "Other". Keep "Include files outside the root directory" on: the install runs `npm ci` at the repo root for the workspaces.
2. `vercel.json` builds with `expo export -p web` and rewrites `/api/*` to Render, so the app calls its own origin and needs no CORS.

Limits:
- Render free sleeps after about 15 minutes idle. The first request takes up to a minute and may time out through the Vercel rewrite; open the admin once before a demo to wake it.
- Render free Postgres expires after about 30 days and has no backups. Recreate it from the blueprint; the seed runs again on start.

## Deploy

Manual until CI exists: on the server, pull `main` and run `docker compose -f compose.prod.yaml up -d --build`. Update this section when CI lands.

## Backups

Nightly `pg_dump` outside the container, 7 days kept, copied off the server encrypted. The database holds sensitive health data.
