# Google OAuth para Vitória — passo a passo completo

> Use quando quiser o botão "Continuar com Google" funcionando com **suas próprias credenciais** (sem depender da Emergent). Faça uma vez e pronto.

## O que você precisa ter em mãos
- Os domínios onde o app vai rodar. Se já tem domínio próprio (ex: `vitoria.com.br`), liste todos aqui antes de começar:
  - **Domínio de produção:** `https://vitoria.com.br` (ajuste para o seu)
  - **Domínio de produção www:** `https://www.vitoria.com.br` (se usar)
  - **Preview Vercel:** `https://vitoria-app.vercel.app` (ou `https://vitoria-app-seu-user.vercel.app`)
  - **Preview Emergent (dev):** `https://75c38e40-ecce-413b-8a11-bccbd9913954.preview.emergentagent.com`
  - **Localhost (se for desenvolver na sua máquina):** `http://localhost:3000`
- Projeto Supabase: `uuovdyvfoufjmlnmhzse.supabase.co` (Callback URL do Supabase, **não muda nunca**): `https://uuovdyvfoufjmlnmhzse.supabase.co/auth/v1/callback`

---

## Parte 1 — Google Cloud Console

### 1.1 Criar projeto

1. Abra https://console.cloud.google.com/
2. Topo da página, clique no seletor de projetos → **New Project**
3. Nome: `Vitoria` → **Create**
4. Selecione o projeto recém-criado.

### 1.2 Configurar a tela de consentimento (OAuth consent screen)

1. Menu lateral → **APIs & Services → OAuth consent screen**
2. User Type: **External** → Create
3. Preencha:
   - **App name:** `Vitória`
   - **User support email:** seu email
   - **App logo:** (opcional) pode fazer upload da logo
   - **App domain > Application home page:** `https://vitoria.com.br` (ou seu domínio final)
   - **App domain > Authorized domains:** adicione **apenas o domínio raiz**, sem `https://` e sem `/`:
     - `vitoria.com.br`
     - `vercel.app` (se for usar deploy Vercel com subdomínio)
     - `supabase.co`
   - **Developer contact email:** seu email
4. Save and Continue → Scopes: deixe só os padrão (`email`, `profile`, `openid`) → Save
5. Test users: adicione `gustavomonteiro09g@gmail.com` e outros emails que queira testar → Save
6. Summary → Back to dashboard
7. Enquanto estiver em modo "Testing", apenas os "Test users" listados conseguem logar. Quando o app estiver pronto, clique em **"Publish App"** para liberar para todo mundo.

### 1.3 Criar OAuth Client ID

1. Menu → **APIs & Services → Credentials**
2. **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Vitoria Web`
5. **Authorized JavaScript origins** — clique **"+ Add URI"** para cada linha:
   ```
   https://vitoria.com.br
   https://www.vitoria.com.br
   https://vitoria-app.vercel.app
   https://75c38e40-ecce-413b-8a11-bccbd9913954.preview.emergentagent.com
   http://localhost:3000
   ```
   > ⚠️ Sem barra final. Apenas o `scheme://host[:port]`. Coloque só os domínios que você vai realmente usar.

6. **Authorized redirect URIs** — aqui vai **só uma URL** (a do Supabase):
   ```
   https://uuovdyvfoufjmlnmhzse.supabase.co/auth/v1/callback
   ```
   > Por quê? O Google redireciona o usuário para o Supabase primeiro, e o Supabase que repassa pro seu frontend. Você NÃO coloca as URLs do seu app aqui — só a do Supabase.

7. **Create** → vai abrir uma caixa com **Client ID** (termina em `.apps.googleusercontent.com`) e **Client Secret** (string longa). Copie os dois.

---

## Parte 2 — Supabase

1. Abra https://supabase.com/dashboard/project/uuovdyvfoufjmlnmhzse
2. Menu → **Authentication → Providers** → procure **Google** → clique para expandir
3. Toggle **Google enabled** → ON
4. Cole:
   - **Client ID (for OAuth):** o Client ID que você copiou
   - **Client Secret (for OAuth):** o Client Secret
5. (Não mexe no resto, deixa padrão)
6. **Save**

### 2.1 URL Configuration (importante!)

Ainda em **Authentication → URL Configuration**:

1. **Site URL:** `https://vitoria.com.br` (ou o domínio principal de produção)
2. **Redirect URLs** — clique "Add URL" para cada:
   ```
   https://vitoria.com.br/**
   https://www.vitoria.com.br/**
   https://vitoria-app.vercel.app/**
   https://75c38e40-ecce-413b-8a11-bccbd9913954.preview.emergentagent.com/**
   http://localhost:3000/**
   ```
   > O `/**` no fim é **obrigatório** para permitir qualquer rota interna após o callback.
3. **Save**

---

## Parte 3 — Testar

1. Abra o app no navegador.
2. Tab "Perfil" → "Entrar ou cadastrar" → "Continuar com Google".
3. Você é redirecionado para o Google, escolhe a conta, autoriza, e volta logado no Vitória.
4. Se der erro, abra o console do navegador (F12) e veja a mensagem. Os erros mais comuns são:

| Erro                                                | Causa                                                                 | Fix                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `redirect_uri_mismatch`                             | A URL de callback não está autorizada no Google.                      | Adicione **exatamente** `https://uuovdyvfoufjmlnmhzse.supabase.co/auth/v1/callback` em **Authorized redirect URIs** no Google Cloud. |
| `Error 400: invalid_request`                        | O domínio do app não está em Authorized JavaScript origins.           | Adicione o domínio no Google Cloud Console → Credentials.  |
| "Access blocked: Vitória has not completed the Google verification process" | App em modo Testing e você não é test user.                           | Adicione seu email em **OAuth consent screen → Test users**. Ou publique o app.   |
| Loga no Google, volta, mas não autentica no app     | Site URL do Supabase não bate com o domínio.                          | Em **Supabase → Authentication → URL Configuration**, coloque o domínio em **Site URL** e em **Redirect URLs** com `/**`. |

---

## Parte 4 — Quando trocar de domínio no futuro

**Em 3 lugares**, adicione/atualize o novo domínio:

1. **Google Cloud Console → Credentials → (seu OAuth client) → Authorized JavaScript origins** → adicione `https://novo-dominio.com`
2. **Supabase → Authentication → URL Configuration → Site URL + Redirect URLs** → adicione `https://novo-dominio.com` e `https://novo-dominio.com/**`
3. **Vercel → Settings → Environment Variables** → se o backend mudou de URL, atualize `VITE_BACKEND_URL` e `REACT_APP_BACKEND_URL` → Redeploy

A URL de callback do Supabase (`...supabase.co/auth/v1/callback`) **nunca muda**. Ela fica fixa lá no Google, não precisa mexer.
