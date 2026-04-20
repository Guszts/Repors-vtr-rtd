# Vitória — PRD

## Original problem statement (summarized)
Atualizar o app do **Restaurante e Marmitaria Vitória** (sem mudar design/tipografias existentes) com:
- Bottom nav: Início | Histórico | Depoimentos | Perfil
- Login/cadastro (Supabase) + Google OAuth; admin `gustavomonteiro09g@gmail.com`
- Painel admin completo (produtos, uploads de imagens, badges, ingredientes, estoque, métricas, usuários, ajustes)
- Página de detalhe do produto com customização de ingredientes
- Programa fidelidade, filtros em produtos/depoimentos
- PWA com nome "Vitória" (favicon/OG/ícone a partir da logo enviada — **nunca dentro do app**)
- Tipografia Outfit (Google Fonts), ícones arredondados/animados
- Animações profissionais, scroll-to-hero ao navegar
- Localização, horários, entrega, retirada, métodos de pagamento configuráveis
- Depoimentos: cards com estrelas/autor/avatar → página detalhada; permite só estrelas sem comentário

## Tech stack
- Frontend: Vite + React 19 + TypeScript, TailwindCSS 4, Motion (framer-motion API)
- Backend: FastAPI em `/app/backend` (apenas endpoints de IA — `/api/ai/describe`, `/api/ai/badge`, `/api/ai/reply-testimonial` via Emergent LLM Key) + `/api/health`
- Dados / Auth / Storage: **Supabase** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- PWA: manifest + service worker simples (cache shell)

## Arquitetura de pastas
```
/app
├── backend/                  FastAPI (IA helpers + health)
├── frontend/
│   ├── public/logo.png       Favicon/OG/PWA
│   ├── public/manifest.webmanifest
│   ├── public/sw.js
│   └── src/
│       ├── App.tsx           Router + AppShell (BottomNav)
│       ├── context/
│       │   ├── AppContext.tsx   Produtos, carrinho, settings, depoimentos, pedidos
│       │   └── AuthContext.tsx  Supabase auth + profile
│       ├── components/
│       │   ├── layout/       BottomNav, TopBar, ScrollToHero
│       │   ├── auth/         AuthModal (email/senha + Google)
│       │   └── feature/      CartDrawer, OrderModal
│       └── pages/
│           ├── home/         Hero + Categories + FeaturedMenu (filtros) + …
│           ├── product/      ProductDetail (ingredientes customizáveis + estoque)
│           ├── historico/    Carrinho + Pedidos
│           ├── depoimentos/  Lista + filtros + compositor + detalhe
│           ├── perfil/       Avatar upload + apelido/@ + loyalty + settings preview
│           └── admin/        Painel completo
└── supabase_schema.sql       Schema + RLS + triggers + buckets (aplicar no Supabase)
```

## Status de implementação (19/04/2026 — atualizado)
### Concluído ✅
- Infraestrutura (frontend em `/app/frontend`, backend FastAPI mínimo, env vars)
- Tipografia Outfit + design arredondado preservando paleta vermelho/stone existente
- PWA "Vitória" — manifest, service worker, ícones via `/logo.png`; logo NUNCA dentro do app
- Bottom navigation **sticky (grudada no rodapé, não mais flutuante)** com 4 abas + badge de carrinho + indicador ativo animado
- Tela de autenticação (email/senha + botão Google) via Supabase
- Home: hero existente + filtros de categoria + busca + ordenação
- Cards de produto com botões "Detalhes" + "Adicionar" lado a lado
- Página detalhada de produto com customização de ingredientes (cobra preço extra, respeita estoque)
- Histórico com abas Carrinho/Pedidos (cria pedido no Supabase)
- Depoimentos: listagem, filtros por estrelas, busca, compositor (estrelas obrigatórias, texto opcional), página detalhada — **FK explícita entre testimonials.user_id e profiles.id adicionada (fix PGRST200)**
- Perfil: upload avatar (Supabase Storage), edição apelido/@username, programa fidelidade (níveis Bronze/Prata/Ouro), atalhos para admin/logout, preview das configurações do estabelecimento
- Admin Panel reformulado:
  - Produtos (CRUD + upload imagem Supabase + badge + cor do badge + estoque + IA de descrição/badge via backend)
  - Imagens do site (upload para bucket `site-images`)
  - Usuários (promover/rebaixar admin)
  - Métricas (totais de usuários, pedidos, receita, depoimentos, avaliação média)
  - Ajustes (localização, horários, tempo entrega/retirada, métodos de pagamento)
  - Ingredientes por produto (adicionar/remover/default/preço/estoque)
- **Fundo branco (stone-50) em todas as páginas** (removido texto escuro sobre fundo escuro)
- ScrollToHero: cada troca de rota leva ao topo da página
- Animações Motion em entradas, listas, modais e bottom nav
- Endpoints backend: `/api/health`, `/api/ai/describe`, `/api/ai/badge`, `/api/ai/reply-testimonial` (Emergent LLM Key já configurada)

### Supabase aplicado ✅
- Schema SQL aplicado via Management API (PAT) — 75 statements passaram, 11 produtos seedados, 3 buckets criados (avatars, product-images, site-images), RLS + triggers + FKs ativas
- Admin criado: `gustavomonteiro09g@gmail.com` (senha `Vitoria123!`) promovido automaticamente a `role='admin'`
- Cliente de teste: `cliente@vitoria.test` (senha `Teste123!`)
- 2 depoimentos de seed inseridos para validação

### Testes E2E ✅
- Backend: 100% verde (health + 3 endpoints IA + PWA assets + manifest)
- Frontend: 100% (após fix FK) — login admin+cliente, navegação entre abas, carrinho local, perfil, admin panel (5 abas), depoimentos listando corretamente

### Pendências (do usuário, opcional)
1. **Google OAuth próprio**: siga `/app/GOOGLE_OAUTH_SETUP.md` (passo-a-passo completo com suas credenciais). Enquanto não configurado, botão Google mostra erro explicativo.
2. **Deploy Vercel**: siga `/app/VERCEL_DEPLOY.md` (Root Dir `frontend`, `npm run build`, `dist`, env vars listadas).

### Atualizações 20/04/2026
- **Migrado de yarn → npm**: `package-lock.json` gerado, `yarn.lock` removido, `.gitignore` exclui yarn.lock
- **Categories.tsx**: corrigido warning React `whileInView` em `<a>` → agora `motion.a`
- **ProductDetail**: só consulta `product_ingredients` quando `id` for UUID válido (evita 400 em ids legacy)
- **Admin**: nova aba **"Depoimentos"** — lista, exclui, gera resposta com IA (Emergent LLM Key)
- **vercel.json** criado com rewrites SPA + headers corretos de cache e `manifest+json`
- Docs: `/app/GOOGLE_OAUTH_SETUP.md` (com tabela de erros comuns) e `/app/VERCEL_DEPLOY.md`

## Backlog / Próximas evoluções
- [P1] Realtime subscriptions para atualizar pedidos e depoimentos ao vivo
- [P1] Push notifications PWA quando status do pedido muda
- [P2] Checkout com integração de pagamento (Pix QR + Stripe/Mercado Pago)
- [P2] Sistema de cupons e campanhas no admin
- [P2] Upload múltiplo de imagens por produto (galeria)
- [P3] Exportar relatório de métricas (CSV/PDF)
