# Configuração do Stripe

## 🔧 Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Stripe (obtenha estas chaves no Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📋 Passos para Configurar

### 1. Criar Conta Stripe

1. Acesse [stripe.com](https://stripe.com)
2. Crie uma conta gratuita
3. Acesse o Dashboard

### 2. Obter Chaves de API

1. No Dashboard, vá em **Developers > API keys**
2. Copie a **Secret key** (começa com `sk_test_`)
3. Copie a **Publishable key** (começa com `pk_test_`)

### 3. Criar Produto e Preço

1. Vá em **Products**
2. Clique em **Add product**
3. Configure:
   - **Name**: CollabBoard Pro
   - **Price**: R$ 29.00
   - **Billing**: Recurring (monthly)
4. Copie o **Price ID** (começa com `price_`)

### 4. Configurar Webhook

1. Vá em **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://seu-dominio.com/api/webhooks/stripe`
4. Para desenvolvimento: use ngrok ou similar
5. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copie o **Webhook secret** (começa com `whsec_`)

## 🧪 Para Desenvolvimento

### Usando ngrok (para testar webhooks localmente)

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local
ngrok http 3004

# Use a URL do ngrok no webhook do Stripe
# Ex: https://abc123.ngrok.io/api/webhooks/stripe
```

### Testando sem Stripe

Para desenvolvimento sem configurar o Stripe, você pode:

1. **Usar o mock de webhook**:

   ```bash
   npx tsx scripts/test-billing.ts
   ```

2. **Simular upgrade manualmente**:
   ```typescript
   import { mockWebhookSuccess } from "@/app/(app)/billing/actions";
   await mockWebhookSuccess(organizationId);
   ```

## 🚀 Para Produção

1. **Mude para chaves live**:

   ```env
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Configure webhook de produção**:

   ```
   https://seu-dominio.com/api/webhooks/stripe
   ```

3. **Teste o fluxo completo**:
   - Checkout
   - Pagamento
   - Webhook
   - Atualização de plano

## 🔍 Verificação

Após configurar, verifique se:

1. **Página de billing carrega** sem erros
2. **Botão "Fazer Upgrade"** funciona
3. **Webhook processa** eventos corretamente
4. **Limites são atualizados** após upgrade

## ❗ Troubleshooting

### Erro: "Stripe não configurado"

- Verifique se as variáveis de ambiente estão corretas
- Reinicie o servidor após adicionar as variáveis

### Erro: "Invalid signature" no webhook

- Verifique se o webhook secret está correto
- Confirme se a URL do webhook está correta

### Erro: "Price not found"

- Verifique se o STRIPE_PRO_PRICE_ID está correto
- Confirme se o preço existe no Stripe Dashboard
