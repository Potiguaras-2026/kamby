# Infrastructure

```yaml
dev: compose.yaml        # docker compose up --build
demo: Vercel (API, admin and donor app web, two projects) + Neon (Postgres), free plans
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
- Android APK: `mobile/eas.json`, profile `preview`. `EXPO_PUBLIC_API_URL` points to the Vercel demo API; for the VPS, change it to the real domain. Then from `mobile/` run `npx eas login` once and `npx eas build -p android --profile preview`. A new domain needs a new build.
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

## Demo: Vercel + Neon

For showing the app before the VPS exists. Free plans, so demo data only: never real donors.

API (Vercel project `kamby-api`, Root Directory `backend`):
1. Vercel detects Django from `manage.py` and serves `config.wsgi` as a function. Python version comes from `backend/.python-version`.
2. Storage: add Neon from the Vercel Marketplace (free plan) and connect it to the project. It injects `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED`; `settings.py` reads `DATABASE_URL`, keeping `sslmode` from the query.
3. Environment variables: `DJANGO_SECRET_KEY` (long random), `SEED_SENHA`, `KAMBY_DEMO=1`. `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS` get the Vercel domains from `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_BRANCH_URL` and `VERCEL_URL`.
4. `backend/vercel.json` build: fails without `DATABASE_URL`, then `collectstatic`, `migrate` over the unpooled connection, and `seed_demo` when `KAMBY_DEMO=1`. Static files (admin CSS) go to the Vercel CDN.
5. Admin: `https://kamby-api.vercel.app/admin/`, login with e-mail and password (staff only; the seed's team account is `equipe@example.com` with `SEED_SENHA`). Phone login is for donors in the app.

Donor app (Vercel project `kamby`, Root Directory `mobile`, at `https://kamby-kappa.vercel.app`; `kamby.vercel.app` belongs to someone else):
1. Framework "Other". Keep "Include files outside the root directory" on: the install runs `npm ci` at the repo root for the workspaces.
2. `mobile/vercel.json` builds with `expo export -p web` and rewrites `/api/*` to the API project, so the app calls its own origin and needs no CORS. If the API project gets another domain, update it there and in `mobile/eas.json`.

Limits:
- Hobby plan is for non-commercial use. Functions start in about a second after idle; Neon free suspends compute when idle and resumes in about a second.
- Neon free has 0.5 GB of storage. Migrations run on every deploy, before the new code is live.

## Deploy

Manual until CI exists: on the server, pull `main` and run `docker compose -f compose.prod.yaml up -d --build`. Update this section when CI lands.

## Backups

Nightly `pg_dump` outside the container, 7 days kept, copied off the server encrypted. The database holds sensitive health data.
