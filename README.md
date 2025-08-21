# CollabBoard — Kanban colaborativo (SaaS)

![cover](./public/readme/cover.png)

**Demo:** https://SEU-LINK-DEMO.vercel.app  
**Stack:** Next.js (App Router) · TypeScript · Prisma · PostgreSQL (Neon) · shadcn/ui · Tailwind · NextAuth · @dnd-kit · Sonner

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge)](https://www.prisma.io/)
[![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?style=for-the-badge)](https://neon.tech/)
[![License](https://img.shields.io/badge/license-MIT-64748b?style=for-the-badge)](./LICENSE)

---

## ✨ Features

- **Organizações, membros e papéis:** OWNER / ADMIN / MEMBER
- **Boards → Colunas → Cards** com drag-and-drop
- **Criação/edição/remoção** com toasts e loading states
- **Filtros e busca** de boards, rename inline, empty states
- **Server Actions** com validação (zod) e RBAC
- **Testes base:** Vitest/RTL (unit/comp) + Playwright (e2e smoke)
- **Preparado para Stripe** (limites por plano) — *opcional*

---

## 🖼 Screenshots

**Dashboard**  
![dashboard](./public/readme/dashboard.png)

**Board**  
![board](./public/readme/board.png)

**Fluxo (GIF)**  
![flow](./public/readme/flow.gif)

> Substitua as imagens em `public/readme/` pelos seus prints/GIF.

---

## 🚀 Como rodar localmente

### 1) Clonar e instalar
```bash
git clone https://github.com/SEU-USUARIO/SEU-REPO.git
cd SEU-REPO
yarn
```

### 2) Variáveis de ambiente

Crie `.env` a partir do `.env.example`:

```bash
cp .env.example .env
```

Preencha:
- `DATABASE_URL` (Neon, use `?sslmode=require`)
- `AUTH_SECRET` (ex.: `openssl rand -hex 32`)
- (Opcional) OAuth `GITHUB_*` / `GOOGLE_*`
- (Opcional) Stripe `STRIPE_*`

### 3) Prisma
```bash
yarn db:generate
yarn prisma migrate dev -n "init"
```

### 4) Rodar
```bash
yarn dev
# http://localhost:3000
```

---

## 🧱 Stack técnica

- **Next.js 15** (App Router) + TypeScript
- **Prisma** + PostgreSQL (Neon)
- **Tailwind** + shadcn/ui + sonner
- **NextAuth** (e/ou providers OAuth)
- **@dnd-kit** para DnD
- **Vitest** / RTL / Playwright (smoke)

---

## 🔐 Variáveis de ambiente (produção)

Veja `.env.example`. Principais:

```
DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require"
AUTH_SECRET="..."
NEXTAUTH_URL="https://SEU-LINK-DEMO.vercel.app"
```

Configure todas em **Vercel → Project Settings → Environment Variables**.

---

## ☁️ Deploy (Vercel + Neon)

### 1) Banco no Neon

1. Crie conta em https://neon.tech/
2. Crie um **Project** e **Branch**
3. Copie a **Connection String** (pooler recomendado) com `sslmode=require`
4. Use no `DATABASE_URL` (local e na Vercel)

### 2) Vercel

1. Importe o repositório no dashboard da Vercel
2. Em **Project Settings → Environment Variables**, adicione:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (ex.: `https://SEU-LINK-DEMO.vercel.app`)
   - (opcional) `GITHUB_ID/SECRET`, `GOOGLE_*`, `STRIPE_*`, etc.
3. **Build Command:** `next build` (padrão)

Após o primeiro deploy, aplique as migrações:

```bash
# Via CLI, com DATABASE_URL de produção exportada localmente:
yarn db:generate
yarn db:migrate
```

(ou configure um job manual/cron para isso)

> **Dica:** Se usar connection pooling no Neon, pegue a URL do pooler para a Vercel.

---

## 🧪 Testes

```bash
yarn test   # Vitest/RTL
yarn e2e    # Playwright (smoke)
```

---

## 🔒 Segurança & Observabilidade (opcional)

- **Sentry** para erros
- **Rate-limit** em server actions sensíveis
- **Sanitização** de Markdown/HTML (se habilitar rich text)
- **Webhooks** (Stripe) com verificação de assinatura

---

## 📦 Roadmap

- [ ] **Realtime** (Pusher/Ably)
- [ ] **Labels**, due date, checklist, anexos
- [ ] **Billing Stripe** (Free/Pro) com limites
- [ ] **Testes e2e** do fluxo completo (criar board → coluna → card)

---

## 📄 Licença

MIT — veja [LICENSE](./LICENSE)

---

## 🙌 Autor

**Thiago Martins** — 
- **LinkedIn:** [Ainda vou incluir]
- **Portfólio:** [ainda vou incluir]
- **Github:** [Thiago-Martins05](https://github.com/Thiago-Martins05)
