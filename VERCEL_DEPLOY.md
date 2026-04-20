# Vitória — Deploy no Vercel

> O Vercel hospeda só o **frontend** (Vite/React). O backend FastAPI roda em outro lugar (Railway, Render, Fly.io). Como o backend só tem endpoints de IA (opcional), o app funciona 100% sem ele — mas aí o admin perde os botões de "IA desc" / "IA badge" / "IA reply".

---

## 1. Subir o projeto para o GitHub

1. No chat Emergent, clique **"Save to GitHub"** → autorize → escolha nome (ex: `vitoria-app`).
2. Após o push, você terá um repo tipo `https://github.com/seu-usuario/vitoria-app`.

---

## 2. Importar no Vercel

1. Acesse https://vercel.com/new
2. Selecione o repositório `vitoria-app`.
3. Em **"Root Directory"** clique **Edit** e escolha `frontend` (seu código frontend está em `/frontend`).
4. Framework preset: o Vercel detecta **Vite** automaticamente.

### Build & Output (o Vercel preenche, só confirme)

| Campo              | Valor            |
| ------------------ | ---------------- |
| Framework          | Vite             |
| Build Command      | `npm run build`  |
| Output Directory   | `dist`           |
| Install Command    | `npm install`    |
| Development Command| `npm run dev`    |

> O arquivo `/frontend/vercel.json` já está configurado com rewrites SPA, headers de cache e content-type correto do manifest PWA. Nada mais a fazer.

---

## 3. Environment Variables (no painel do Vercel)

Settings → Environment Variables. Adicione para **Production + Preview + Development**:

| Key                         | Value                                                               |
| --------------------------- | ------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | `https://uuovdyvfoufjmlnmhzse.supabase.co`                          |
| `VITE_SUPABASE_ANON_KEY`    | (a anon key que você copiou do Supabase > Settings > API)           |
| `VITE_ADMIN_EMAIL`          | `gustavomonteiro09g@gmail.com`                                      |
| `VITE_BACKEND_URL`          | URL do backend FastAPI (ex: `https://vitoria-api.onrender.com`) — deixe em branco se ainda não deployou backend |
| `REACT_APP_BACKEND_URL`     | mesmo valor que `VITE_BACKEND_URL` (alias por segurança)            |

> ⚠️ **Nunca** coloque a `SERVICE_ROLE_KEY` nem o `PAT` do Supabase aqui — essas são chaves server-only e não vão para o frontend.

---

## 4. Deploy

Clique em **Deploy**. Em ~1 minuto você tem uma URL tipo `https://vitoria-app.vercel.app`.

Depois de pronto:
- Em **Domains** configure seu domínio custom (ex: `vitoria.com.br`) — o Vercel gera DNS records pra você apontar.
- Em **Supabase > Authentication > URL Configuration** adicione seu domínio Vercel (e o custom) em:
  - **Site URL:** `https://vitoria.com.br` (ou o `.vercel.app`)
  - **Redirect URLs:** `https://vitoria.com.br/**` (o `**` cobre todas as rotas)
- Em **Google Cloud Console** (se usar Google Auth) adicione os mesmos domínios em Authorized JavaScript origins — veja `GOOGLE_OAUTH_SETUP.md`.

---

## 5. (Opcional) Deploy do backend FastAPI

Se quiser os endpoints de IA funcionando:

**Render.com** (grátis até 750h/mês):
1. https://render.com/ → New → **Web Service**
2. Connect o mesmo repositório
3. Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Env vars:
   - `EMERGENT_LLM_KEY` = `sk-emergent-7Ea75A099F5FfEc8fE`
   - (MONGO_URL e DB_NAME não são usadas — o backend atual não precisa de Mongo)
7. Pegue a URL (ex: `https://vitoria-api.onrender.com`) e atualize `VITE_BACKEND_URL` no Vercel → Redeploy frontend.

**Railway**, **Fly.io** e **Cloud Run** funcionam igual.
