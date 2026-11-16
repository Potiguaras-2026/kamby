# Architecture

## Repository

```
backend/        Django project (config/) and one app per domain area
mobile/         Expo app
web/            Vite SPA
packages/api/   TS types generated from the backend OpenAPI
```

npm workspaces for the JS packages. No Turborepo or Nx: nothing is built across languages.

## Backend

Django Ninja over DRF: typed schemas produce an accurate OpenAPI, and both clients get their types from it.

Apps: `core` (base model, errors), `contas` (users, donors, screening), `bancos` (milk banks), `doacoes` (bottle kits, pickups). A new domain area gets its own app; `core` does not grow.

```
<app>/
  models.py     tables and field validation only
  schemas.py    Ninja input and output schemas
  api.py        router; HTTP only: parse, call a service or selector, return
  services.py   writes, business rules, status transitions
  selectors.py  reads, always scoped to the caller
  admin.py      staff panel until the web panel exists; status changes call services
  tests.py
```

- Status changes only through services, which reject invalid transitions.
- Invariants that a race could break also live in the database (`UniqueConstraint` with `condition`).
- Domain models inherit `core.ModeloBase`: UUID primary key, `criado_em`, `atualizado_em`.
- `TIME_ZONE = "America/Fortaleza"`, `USE_TZ = True`.

## API

- Base path `/api/v1`. JSON in snake_case; clients use fields as they come.
- Auth: JWT bearer (django-ninja-jwt), login with phone and password.
- Roles: `doadora` sees only her own records; `equipe_banco` sees only her bank's records, under `/painel`.
- Records the caller cannot see return 404, not 403.
- Business errors raise `ErroDominio(codigo, mensagem)`. Every error response has this shape:

```json
{ "codigo": "conflito", "mensagem": "Você já tem uma coleta agendada.", "campos": {} }
```

```yaml
# codigo: HTTP status
validacao: 422
nao_autenticado: 401
sem_permissao: 403
nao_encontrado: 404
conflito: 409
transicao_invalida: 409
limite_excedido: 429
```

- `mensagem` is pt-BR, ready to show to the user. Status enums carry a pt-BR label, sent as `status_rotulo`.
- The error shape is not in the OpenAPI (global handlers); its TS type is `ErroApi` in `packages/api`.
- Pagination: page number, 20 per page, max 100.
- Screen-shaped endpoints are fine when they save mobile round trips. `GET /inicio` returns everything the home screen needs, including `proxima_acao`.
- Throttle auth endpoints.

## Frontend (mobile and web)

```
src/
  app/                  mobile only: Expo Router routes; each file is a screen
  features/<feature>/   feature code; web pages live in features/<feature>/pages/
  components/           shared UI
  lib/                  api client, session, theme
```

- API calls through the typed `openapi-fetch` client in `lib/api.ts`, wrapped by `chamar()` for TanStack Query.
- Server state through TanStack Query only. No global store; the mobile session is a small external store in `lib/sessao.ts`.
- Response types come from `packages/api`; never write them by hand.
- Mobile renews the access token before it expires, so a donor never loses a flow mid-way.
- Web talks to the API on the same origin (Vite proxy locally, Caddy in production): no CORS.
- Status screens poll with `refetchInterval` (15 s). No websockets.
- Mobile: `StyleSheet` with tokens in `lib/tema.ts`. Web: Tailwind tokens in `src/index.css`; add shadcn/ui when the first real component is needed.

## Privacy

Donor health answers and addresses are sensitive personal data (LGPD art. 11). Keep them out of logs, error messages and analytics. Registration stores explicit consent (`consentimento_em`).
