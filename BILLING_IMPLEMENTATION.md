# Módulo 9 — Stripe (Checkout & Portal)

## 📋 Visão Geral

Implementação do sistema de billing com Stripe, incluindo checkout, portal do cliente e webhooks para gerenciar assinaturas.

## 🎯 Funcionalidades

### ✅ Implementado

1. **Sistema de Planos**

   - Plano Free (gratuito)
   - Plano Pro (R$ 29/mês)
   - Limites dinâmicos baseados no plano

2. **Checkout Stripe**

   - Sessão de checkout para upgrade
   - Integração com Stripe Checkout
   - Redirecionamento automático

3. **Portal do Cliente**

   - Gerenciamento de assinatura
   - Cancelamento/upgrade
   - Histórico de faturas

4. **Webhooks**
   - Processamento automático de eventos
   - Atualização de planos e limites
   - Sincronização com Stripe

## 🏗️ Arquitetura

### Arquivos Principais

```
src/
├── lib/
│   └── stripe.ts                    # Configuração do Stripe
├── app/(app)/billing/
│   ├── page.tsx                     # Página de billing
│   ├── billing-plans.tsx            # Componente de planos
│   └── actions.ts                   # Actions de checkout
├── app/api/webhooks/stripe/
│   └── route.ts                     # Webhook do Stripe
└── scripts/
    └── test-billing.ts              # Script de teste
```

### Fluxo de Billing

1. **Usuário acessa /billing**
2. **Escolhe plano** (Free/Pro)
3. **Clica em "Fazer Upgrade"**
4. **Redirecionado para Stripe Checkout**
5. **Após pagamento, webhook atualiza plano**
6. **Limites são atualizados automaticamente**

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NextAuth
NEXTAUTH_URL=http://localhost:3004
```

### Planos Configurados

| Plano    | Preço | Boards | Membros | Colunas  | Cards      | Labels    |
| -------- | ----- | ------ | ------- | -------- | ---------- | --------- |
| **Free** | R$ 0  | 5      | 5       | 10/board | 100/board  | 20/board  |
| **Pro**  | R$ 29 | ∞      | 50      | 50/board | 1000/board | 100/board |

## 🧪 Testes

### Script de Teste

```bash
# Testa upgrade simulado
npx tsx scripts/test-billing.ts
```

### Testes Manuais

1. **Acesse /billing**
2. **Verifique planos disponíveis**
3. **Clique em "Fazer Upgrade"**
4. **Complete checkout (ou simule)**
5. **Verifique se limites foram atualizados**

### Mock de Webhook

Para desenvolvimento, use a função `mockWebhookSuccess()`:

```typescript
import { mockWebhookSuccess } from "@/app/(app)/billing/actions";

// Simula upgrade para PRO
await mockWebhookSuccess(organizationId);
```

## 🎨 UI/UX

### Página de Billing

- **Status atual**: Plano, próxima cobrança, estatísticas
- **Planos disponíveis**: Cards com comparação
- **Botões de ação**: Upgrade e gerenciar assinatura

### Componentes

- **BillingPlans**: Exibe planos e gerencia checkout
- **LimitsBanner**: Redireciona para billing quando limite atingido

## 🔮 Próximos Passos

### Integração Completa

1. **Configurar Stripe**

   - Criar conta Stripe
   - Configurar produtos e preços
   - Configurar webhooks

2. **Testes de Produção**

   - Testar checkout real
   - Verificar webhooks
   - Testar cancelamento

3. **Melhorias**
   - Histórico de faturas
   - Métodos de pagamento
   - Cupons de desconto

### Funcionalidades Avançadas

1. **Métricas**

   - Dashboard de receita
   - Análise de conversão
   - Relatórios de uso

2. **Automação**
   - E-mails de cobrança
   - Lembretes de pagamento
   - Notificações de expiração

## 🚀 Deploy

### Preparação

1. **Configurar Stripe**

   ```bash
   # Criar produtos no Stripe Dashboard
   # Configurar webhook endpoint
   # Obter chaves de API
   ```

2. **Variáveis de Ambiente**

   ```env
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_PRO_PRICE_ID=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Webhook Endpoint**
   ```
   https://seu-dominio.com/api/webhooks/stripe
   ```

### Eventos do Webhook

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 📊 Monitoramento

### Logs Importantes

- Checkout sessions criadas
- Webhooks processados
- Mudanças de plano
- Erros de pagamento

### Métricas

- Taxa de conversão Free → Pro
- Churn rate
- Receita mensal
- Uso por plano

## 🔒 Segurança

### Validações

- Verificação de assinatura do webhook
- Validação de permissões de usuário
- Sanitização de dados de entrada

### Boas Práticas

- Usar HTTPS em produção
- Validar webhooks do Stripe
- Logs de auditoria
- Backup de dados de billing
