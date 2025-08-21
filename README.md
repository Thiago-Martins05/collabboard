# CollabBoard

Kanban colaborativo SaaS com autenticação, billing e tempo real.

## Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Prisma, PostgreSQL
- **Autenticação**: NextAuth.js
- **Billing**: Stripe
- **Tempo Real**: Pusher
- **Testes**: Vitest + React Testing Library, Playwright

## Desenvolvimento

```bash
# Instalar dependências
yarn install

# Executar em desenvolvimento
yarn dev

# Executar testes
yarn test        # Unitários
yarn e2e         # E2E
yarn test:watch  # Unitários em modo watch
yarn e2e:ui      # E2E com UI

# Build
yarn build
yarn start
```

## Estrutura

```
src/
├── app/                 # App Router (Next.js 15)
├── components/          # Componentes React
├── lib/                 # Utilitários e configurações
├── __tests__/           # Testes unitários
└── test/                # Setup de testes
```

## Variáveis de Ambiente

```bash
# Banco de dados
DATABASE_URL="postgresql://..."

# Autenticação
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="..."

# Pusher
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
```
