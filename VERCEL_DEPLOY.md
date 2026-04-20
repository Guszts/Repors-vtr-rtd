# Vitória — Deploy no Vercel (com Services)

> Este projeto usa a feature **`experimentalServices`** do Vercel — deploya **frontend e backend juntos num único projeto**, no mesmo domínio. Config validada contra `https://vercel.com/docs/services`.

## Estrutura no repositório

```
/
├── vercel.json                    ← Services config (na raiz)
├── frontend/                      ← Vite + React (entrypoint: "frontend")
│   ├── src/...
│   ├── package.json
│   └── .env                       ← não commitar (ignorado em .gitignore)
└── backend/                       ← FastAPI (entrypoint: "backend")
    ├── server.py                  ← app = FastAPI()
    ├── requirements.txt
    └── .env                       ← não commitar
```

`/app/vercel.json`:
```json
{
  "experimentalServices": {
    "frontend": { "entrypoint": "frontend", "routePrefix": "/",           "framework": "vite" },
    "backend":  { "entrypoint": "backend",  "routePrefix": "/_/backend" }
  }
}
```

## 1. Subir pro GitHub

No chat Emergent → **"Save to GitHub"** → autoriza → nomeia o repo (ex: `vitoria-app`).

## 2. Importar no Vercel

1. https://vercel.com/new → importa o repositório.
2. **Framework Preset** → escolha **"Services"** (essa é a condição nova; sem isso o `experimentalServices` é ignorado).
3. **Root Directory**: deixe na raiz (`.`). Não selecione `frontend/` — o próprio vercel.json aponta para os serviços.
4. Não precisa preencher Build Command / Output Directory (cada serviço detecta sozinho).

## 3. Environment Variables

**Production, Preview e Development**, todas:

| Key                      | Value                                                                       | Onde                    |
| ------------------------ | --------------------------------------------------------------------------- | ----------------------- |
| `VITE_SUPABASE_URL`      | `https://uuovdyvfoufjmlnmhzse.supabase.co`                                  | frontend (build-time)   |
| `VITE_SUPABASE_ANON_KEY` | (copie do Supabase Settings → API)                                          | frontend (build-time)   |
| `VITE_ADMIN_EMAIL`       | `gustavomonteiro09g@gmail.com`                                              | frontend (build-time)   |
| `VITE_BACKEND_URL`       | `/_/backend`                                                                | frontend (**mudou!**)   |
| `REACT_APP_BACKEND_URL`  | `/_/backend`                                                                | frontend (alias)        |
| `EMERGENT_LLM_KEY`       | `sk-emergent-7Ea75A099F5FfEc8fE`                                            | backend (runtime)       |
| `CORS_ORIGINS`           | `*`                                                                         | backend (runtime)       |

> ⚠️ **Nunca** commite a `SERVICE_ROLE_KEY` nem o `PAT` do Supabase aqui — são chaves server-only e não vão para o Vercel.

## 4. Deploy

Clique **Deploy**. Em ~2-3 min o Vercel constrói os dois serviços e te dá uma URL tipo `https://vitoria-app.vercel.app` onde:
- `/` → frontend Vite
- `/_/backend/api/health` → FastAPI responde
- `/_/backend/api/ai/describe` → endpoint de IA funciona

## 5. Domínio custom

Em **Settings → Domains** adicione seu domínio (ex: `vitoria.com.br`). O Vercel te dá os DNS records (CNAME ou A+AAAA) para apontar no seu registrador.

Depois de ativar o domínio, atualize também:
1. **Supabase → Authentication → URL Configuration** → Site URL e Redirect URLs com `https://vitoria.com.br` e `https://vitoria.com.br/**`
2. **Google Cloud Console → OAuth client → Authorized JavaScript origins** → `https://vitoria.com.br` (passo completo em `/app/GOOGLE_OAUTH_SETUP.md`)

## 6. Rodar local com o Vercel CLI

```bash
npm i -g vercel
cd /seu-repo
vercel dev -L
```

`-L` local (sem autenticar na Vercel Cloud). Os dois serviços sobem no mesmo domínio local: `http://localhost:3000` (frontend) e `http://localhost:3000/_/backend/api/health` (backend).

## Troubleshooting

| Erro                                                | Causa                                                             | Fix                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| `experimentalServices` ignorado, deploy sem backend | Framework Preset não é "Services"                                 | Settings → General → Framework Preset = **Services** → Redeploy   |
| Backend 404 em `/_/backend/api/health`              | Python/FastAPI não detectado                                      | Garanta `backend/requirements.txt` com `fastapi` e `backend/server.py` com `app = FastAPI(...)` |
| `emergentintegrations` falha na build do backend    | Índice PyPI padrão não tem o pacote                               | `backend/requirements.txt` já inclui `--extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/` — mantenha |
| Frontend bate em `/api/ai/*` e dá 404               | `VITE_BACKEND_URL` não está apontando para `/_/backend`           | Settings → Env vars → `VITE_BACKEND_URL=/_/backend` → Redeploy    |
