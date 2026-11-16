# Infrastructure

```yaml
local:
  backend: runserver with SQLite (no POSTGRES_DB in backend/.env)
  mobile: Expo Go, EXPO_PUBLIC_API_URL points to the computer running the backend
  web: Vite dev server, proxies /api, /admin and /static to localhost:8000
production: one Hostinger KVM 1 VPS, docker-compose.yml at the repo root
domain: pending   # one domain; Caddy splits by path
```

## Production

`docker-compose.yml` runs three services:

- `db`: Postgres, data in the `pgdata` volume, port not exposed.
- `api`: Django on Gunicorn (`backend/Dockerfile`); runs migrations and collectstatic on start.
- `caddy`: automatic TLS on `DOMINIO`. Builds the web panel (`infra/caddy.Dockerfile`) and routes by path (`infra/Caddyfile`): `/api` and `/admin` to Django, `/static` to collected static files, everything else to the panel.

The mobile app is not hosted: Expo Go for demos, EAS Build for APK and stores.

The VPS is small (1 vCPU). Keep 3 Gunicorn workers at most. Add no service (Redis, Celery, monitoring stack) without a concrete need.

## Configuration

- Root `.env`: `DOMINIO`, read by compose.
- `backend/.env`: Django and Postgres variables, listed in `backend/.env.example`. Postgres reads the same file.
- `mobile/.env`: `EXPO_PUBLIC_API_URL`.
- `.env` files are never committed.
- Production: `DJANGO_DEBUG` unset, a long random `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` and `DJANGO_CSRF_TRUSTED_ORIGINS` set to the real domain.

## Deploy

Manual until CI exists: on the server, pull `main` and run `docker compose up -d --build`. Update this section when CI lands.

## Backups

Nightly `pg_dump` outside the container, 7 days kept, copied off the server encrypted. The database holds sensitive health data.
