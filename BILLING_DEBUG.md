# Debug do Sistema de Billing

## Problema Identificado

O plano Pro não está sendo ativado após o pagamento bem-sucedido no Stripe. O usuário é redirecionado para `http://localhost:3000/billing?success=true`, mas o "Plano Atual" continua mostrando "Free" em vez de "Pro".

## Possíveis Causas

### 1. Webhook do Stripe não está sendo chamado

- O webhook pode não estar configurado corretamente no painel do Stripe
- O endpoint pode não estar acessível publicamente
- A assinatura do webhook pode estar incorreta

### 2. Problema na configuração do webhook

- `STRIPE_WEBHOOK_SECRET` pode estar incorreto
- O endpoint pode estar retornando erro 500
- O webhook pode estar sendo chamado mas falhando silenciosamente

### 3. Problema na atualização do banco de dados

- A subscription pode não estar sendo atualizada corretamente
- Os feature limits podem não estar sendo atualizados
- Pode haver erro na query do banco de dados

## Soluções Implementadas

### 1. Logs de Debug Adicionados

- Logs detalhados no webhook (`/api/webhooks/stripe/route.ts`)
- Logs na criação da sessão de checkout (`/billing/actions.ts`)
- Logs na página de billing (`/billing/page.tsx`)

### 2. Endpoints de Teste

- `GET /api/webhooks/stripe?action=config` - Verifica configuração
- `GET /api/webhooks/stripe?action=check&organizationId=xxx` - Verifica status da subscription
- `GET /api/webhooks/stripe?action=simulate&organizationId=xxx` - Simula webhook
- `GET /api/webhooks/stripe?organizationId=xxx` - Testa webhook manual

### 3. Botão de Teste

- Botão "🧪 Forçar Upgrade para PRO" na página de billing (apenas em desenvolvimento)
- Permite testar o upgrade sem pagamento

### 4. Script de Teste

- `test-webhook.js` - Script para testar o webhook automaticamente

## Como Debugar

### 1. Verificar Configuração

```bash
curl "http://localhost:3000/api/webhooks/stripe?action=config"
```

### 2. Testar Webhook Manualmente

```bash
node test-webhook.js
```

### 3. Verificar Logs

- Abra o console do servidor Next.js
- Procure por logs com emojis: 🔔, 🛒, ✅, ❌
- Verifique se o webhook está sendo chamado

### 4. Testar Upgrade Manual

- Acesse `/billing` em desenvolvimento
- Use o botão "🧪 Forçar Upgrade para PRO"
- Verifique se o plano muda para "Pro"

### 5. Verificar Banco de Dados

```sql
-- Verificar subscription
SELECT * FROM "Subscription" WHERE "organizationId" = 'your-org-id';

-- Verificar feature limits
SELECT * FROM "FeatureLimit" WHERE "organizationId" = 'your-org-id';
```

## Configuração do Webhook no Stripe

### 1. Criar Webhook no Painel do Stripe

- URL: `https://your-domain.com/api/webhooks/stripe`
- Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### 2. Configurar Variáveis de Ambiente

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXTAUTH_URL=http://localhost:3000
```

### 3. Testar Webhook

- Use o Stripe CLI para testar localmente:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Próximos Passos

1. **Verificar se o webhook está sendo chamado**: Use os logs para confirmar
2. **Testar manualmente**: Use o botão de teste ou script
3. **Verificar configuração**: Confirme todas as variáveis de ambiente
4. **Testar em produção**: Configure webhook público no Stripe
5. **Monitorar logs**: Acompanhe os logs em produção

## Comandos Úteis

```bash
# Testar webhook
node test-webhook.js

# Verificar configuração
curl "http://localhost:3000/api/webhooks/stripe?action=config"

# Verificar status da subscription
curl "http://localhost:3000/api/webhooks/stripe?organizationId=test&action=check"

# Simular webhook
curl "http://localhost:3000/api/webhooks/stripe?organizationId=test&action=simulate"
```
