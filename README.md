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

Pré-requisitos: Python 3.13, Node 24, app Expo Go no celular.

```bash
npm install
cd backend
python -m venv .venv
.venv\Scripts\activate          # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # Linux/macOS: cp
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000
```

Em outro terminal, na raiz:

```bash
npm run mobile    # escaneie o QR code com o Expo Go
npm run web       # painel em http://localhost:5173
```

No celular físico, ajuste `EXPO_PUBLIC_API_URL` em `mobile/.env` para o IP do computador na rede.

Usuários do `seed_demo` (senha em `SEED_SENHA`): equipe `84900000000` (admin em `/admin`), doadora apta `84911111111`.

Convenções: [AGENTS.md](AGENTS.md). Mudanças: [CHANGELOG.md](CHANGELOG.md).
