# Vitória — Deploy Plano B

**Arquitetura:** Frontend no **Vercel** (Vite estático, grátis) + Backend no **Render** (FastAPI, grátis 750h/mês). Comunicam via CORS.

---

## Passo 1 — Push pro GitHub

No chat Emergent → **"Save to GitHub"** → cria o repo `vitoria-app`.

---

## Passo 2 — Deploy do backend no Render

1. https://dashboard.render.com/ → **New → Blueprint**
2. Connect o repositório `vitoria-app`
3. O Render detecta automaticamente o `/app/render.yaml` → clica **Apply**
4. Depois de criado, vá no serviço `vitoria-backend` → **Environment** → edite:
   - `EMERGENT_LLM_KEY` = `sk-emergent-7Ea75A099F5FfEc8fE`
5. Deploy começa sozinho. Em ~3 min tem URL tipo `https://vitoria-backend.onrender.com`.
6. Teste: abre `https://vitoria-backend.onrender.com/api/health` → deve responder `{"status":"ok"}`.

> ⚠️ Plano free do Render hiberna após 15 min sem request. Primeira request depois volta em ~30s. Aceitável para admin/IA. Pra produção 24/7 sem cold-start, suba pro plano Starter (US$ 7/mês).

---

## Passo 3 — Deploy do frontend no Vercel

1. https://vercel.com/new → importa o repo `vitoria-app`
2. **Root Directory:** clica **Edit** e seleciona `frontend`
3. Framework Preset: **Vite** (auto-detectado)
4. Build & Output: já vem preenchido pelo `vercel.json`:
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: `dist`
5. Expande **Environment Variables** e adicione (Production + Preview + Development):

   | Key                     | Value                                                       |
   | ----------------------- | ----------------------------------------------------------- |
   | `VITE_SUPABASE_URL`     | `https://uuovdyvfoufjmlnmhzse.supabase.co`                  |
   | `VITE_SUPABASE_ANON_KEY`| (copie do Supabase Settings → API)                          |
   | `VITE_ADMIN_EMAIL`      | `gustavomonteiro09g@gmail.com`                              |
   | `VITE_BACKEND_URL`      | `https://vitoria-backend.onrender.com` (URL do passo 2)     |
   | `REACT_APP_BACKEND_URL` | `https://vitoria-backend.onrender.com`                      |

6. Clique **Deploy**. Em ~1 min você tem `https://vitoria-app.vercel.app`.

---

## Passo 4 — Configurações pós-deploy

### Supabase
**Authentication → URL Configuration** → adicione:
- **Site URL:** `https://vitoria-app.vercel.app` (ou seu domínio custom)
- **Redirect URLs:** `https://vitoria-app.vercel.app/**` + seu domínio custom com `/**`

### Google OAuth (opcional, se quiser login Google)
Siga `/app/GOOGLE_OAUTH_SETUP.md` usando `https://vitoria-app.vercel.app` como domínio inicial.

### CORS no backend (Render)
Se quiser restringir CORS ao seu frontend (em vez de `*`):
- Render → Environment → `CORS_ORIGINS` = `https://vitoria-app.vercel.app,https://vitoria.com.br`
- (atualize `/app/backend/server.py` para ler essa env var — hoje já está com `allow_origins=["*"]` hardcoded; é OK pra começar)

---

## Passo 5 — Domínio custom

No Vercel: **Project → Settings → Domains** → adicione `vitoria.com.br` (ou o seu) → aponte os DNS records. Repita o mesmo passo para `www.vitoria.com.br` se usar.

Depois atualize os 3 lugares com o novo domínio:
1. Supabase → URL Configuration (Site URL + Redirect URLs com `/**`)
2. Google Cloud Console → Authorized JavaScript origins (veja `/app/GOOGLE_OAUTH_SETUP.md`)
3. Render → CORS_ORIGINS (se restringiu)

---

## Troubleshooting

| Erro                                         | Fix                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| Vercel: `vite: command not found`            | Root Directory tem que ser `frontend`, não `.`                                  |
| Vercel: build falha no `tsc`                 | Confirme que `typescript` está em `dependencies` (já está)                      |
| Frontend carrega mas botões IA dão CORS      | Em dev ponha `CORS_ORIGINS=*` no Render; em prod liste os domínios separados por vírgula |
| Admin panel IA dá 502 depois de 15 min ocioso| Cold-start do Render free — primeira request demora ~30s. Upgrade Starter resolve |
| Render: build falha `emergentintegrations`   | `backend/requirements.txt` já tem `--extra-index-url` correta — garanta que subiu |
