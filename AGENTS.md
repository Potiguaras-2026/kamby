# Kamby

Connects mothers who donate breast milk with human milk banks in Natal, Brazil. Mothers use the mobile app to register, request sterilized bottles and schedule home pickups. Milk bank staff use the web panel.

```yaml
backend: Django 6, Django Ninja, PostgreSQL                    # backend/
mobile: Expo SDK 58, Expo Router, TanStack Query, openapi-fetch  # mobile/  donor app
web: Vite, React, React Router, TanStack Query, Tailwind         # web/     milk bank panel
api_types: generated from OpenAPI                                # packages/api/  do not edit schema.d.ts
js_workspaces: npm
naming:
  domain: Portuguese, no accents        # Doadora, agendar_coleta, a_caminho
  technical: English                    # models.py, services.py, hooks, screens
  ui_text: pt-BR

commands:  # from repo root; Docker is the default flow (compose.yaml = dev)
  up: docker compose up --build         # db, api :8000, web :5173 with hot reload
  manage: docker compose exec api python manage.py <cmd>
  seed: docker compose exec api python manage.py seed_demo
  test_backend: docker compose exec api python manage.py test
  migrations: docker compose exec api python manage.py makemigrations
  api_types: npm run api:tipos          # needs the stack up; after any API change
  install_js: npm install               # host only, for mobile and editor types
  mobile: npm run mobile                # outside Docker: Expo Go needs the LAN
  mobile_web: npm run mobile:web        # donor app in the browser at :8081, talks to the api on :8000
  typecheck_mobile: npm run typecheck -w mobile
  build_web: docker compose exec web npm run build -w web
  web_deps_changed: docker compose run --rm web npm ci -w web -w @kamby/api
```

## Read first

| Task touches | Read |
|---|---|
| backend, API, data, app structure | [docs/architecture.md](docs/architecture.md) |
| screens, copy, accessibility | [docs/design.md](docs/design.md) |
| servers, deploy, env vars | [docs/infra.md](docs/infra.md) |
| Expo APIs | [mobile/AGENTS.md](mobile/AGENTS.md) |

## Sources of truth

Read these instead of describing them in docs.

- Data model: `backend/*/models.py`
- API contract: `/api/v1/openapi.json` (UI at `/api/v1/docs`)
- Business rules: `backend/*/services.py` and `backend/*/tests.py`
- Screens: [Figma KAMBY V2](https://www.figma.com/design/uYRn0mrUuzEE1xWW5Kc9BI/KAMBY---V2)

## Rules

- Smallest change that solves the task. No dependency for what fits in a few lines.
- Real donor data (health answers, address, phone) never goes to logs, fixtures, commits or prompts.
- Code comments explain why, not what.
- Docs, commits and PRs: short and plain. No emojis, em dashes or marketing tone.

## Workflow

- MVP phase (until the first demo): commit straight to `main`.
- After that: branch from `main` (`feat/<nome>`, `fix/<nome>`), open a PR, merge into `main`.
- Commits: `type: mensagem em português`, no scope. Types: feat, fix, refactor, docs, test, chore. Ex.: `feat: agenda coleta domiciliar`
- No AI attribution anywhere: no `Co-Authored-By`, no "generated with" lines in commits or PRs.
- PRs: short title in the commit format, plain description of what and why. No emojis, no templates.
- Before a PR: backend tests, mobile typecheck, web build.
- User-visible change: one line in `CHANGELOG.md` under "Não lançado".
- API change: `npm run api:tipos` and commit the generated files.
- Changed a convention from `docs/`: update that doc in the same PR.
