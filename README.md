# Kamby

Conecta mães doadoras de leite humano aos bancos de leite. A mãe agenda a coleta pelo app e a equipe do banco busca o leite em casa.

Projeto da equipe Potiguaras (IFRN Natal).

| Pasta | O quê |
|---|---|
| `backend/` | API em Django Ninja e admin |
| `mobile/` | App da doadora (Expo) |
| `web/` | Painel do banco de leite |
| `packages/api/` | Tipos TypeScript gerados da API |
| `docs/` | Arquitetura, design e infraestrutura |

## Rodar local

Pré-requisitos: Docker, Node 24, app Expo Go no celular.

```bash
docker compose up --build                          # API em :8000, painel em :5173
docker compose exec api python manage.py seed_demo # dados de demonstração
```

O mobile roda fora do Docker, porque o Expo Go precisa da rede local:

```bash
npm install
copy mobile\.env.example mobile\.env   # Linux/macOS: cp mobile/.env.example mobile/.env
npm run mobile                         # escaneie o QR code com o Expo Go
```

No celular físico, ajuste `EXPO_PUBLIC_API_URL` em `mobile/.env` para o IP do computador na rede.

Testes do backend: `docker compose exec api python manage.py test`. Mais comandos em [AGENTS.md](AGENTS.md).

Usuários do `seed_demo` (senha em `SEED_SENHA`): equipe `84900000000` (admin em `/admin`), doadora apta `84911111111`.

Convenções: [AGENTS.md](AGENTS.md). Mudanças: [CHANGELOG.md](CHANGELOG.md).
