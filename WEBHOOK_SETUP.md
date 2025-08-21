# Configuração do Webhook do Stripe

## Problema Identificado

O plano não está mudando de FREE para PRO após o pagamento porque o webhook do Stripe não está sendo chamado.

## Solução: Configurar Webhook no Stripe

### 1. Acesse o Painel do Stripe

1. Vá para [dashboard.stripe.com](https://dashboard.stripe.com)
2. Faça login na sua conta
3. Certifique-se de estar no modo de **teste** (toggle no canto superior direito)

### 2. Configure o Webhook

1. No menu lateral, clique em **"Developers"** → **"Webhooks"**
2. Clique em **"Add endpoint"**
3. Configure:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
     - Para desenvolvimento local: `http://localhost:3000/api/webhooks/stripe`
     - Para produção: `https://your-domain.com/api/webhooks/stripe`
   - **Events to send**: Selecione:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

### 3. Obtenha o Webhook Secret

1. Após criar o webhook, clique nele
2. Na seção **"Signing secret"**, clique em **"Reveal"**
3. Copie o secret (começa com `whsec_`)
4. Adicione ao seu arquivo `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### 4. Teste o Webhook

1. No painel do webhook, clique em **"Send test webhook"**
2. Selecione o evento `checkout.session.completed`
3. Clique em **"Send test webhook"**
4. Verifique se retorna status 200

### 5. Para Desenvolvimento Local

Se estiver testando localmente, use o Stripe CLI:

```bash
# Instalar Stripe CLI
# Windows: https://stripe.com/docs/stripe-cli#install
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escutar webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Verificação

### 1. Teste Manual

```bash
# Verificar configuração
curl "http://localhost:3000/api/webhooks/stripe?action=config"

# Testar webhook
node test-webhook.js
```

### 2. Teste Real

1. Faça um pagamento real no Stripe
2. Verifique os logs do servidor
3. Procure por logs com emojis: 🔔, 🛒, ✅
4. Verifique se o plano muda na interface

### 3. Logs Esperados

Quando o webhook funcionar, você deve ver:

```
🔔 Webhook Stripe recebido
✅ Evento Stripe verificado: checkout.session.completed
🛒 Checkout completado, processando...
✅ Subscription atualizada
✅ Feature limits atualizados
```

## Troubleshooting

### Webhook não está sendo chamado

1. Verifique se a URL está correta
2. Verifique se o webhook está ativo
3. Verifique se os eventos estão selecionados
4. Verifique se o endpoint está acessível

### Erro de assinatura

1. Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
2. Verifique se não há espaços extras
3. Reinicie o servidor após adicionar a variável

### Erro 500 no webhook

1. Verifique os logs do servidor
2. Verifique se o banco de dados está acessível
3. Verifique se todas as variáveis de ambiente estão configuradas

## Próximos Passos

1. **Configure o webhook no Stripe** seguindo o guia acima
2. **Teste com um pagamento real**
3. **Verifique os logs** para confirmar que está funcionando
4. **Monitore em produção** para garantir que continua funcionando
