# 🔧 Solução: Checkout não atualiza para PRO

## 🎯 Problema Identificado

O checkout do Stripe não está atualizando automaticamente para PRO porque:

1. **Webhook não configurado** - `STRIPE_WEBHOOK_SECRET` não está definido
2. **Webhook não está sendo chamado** - O Stripe não consegue notificar a aplicação
3. **Atualização manual necessária** - Em desenvolvimento, precisa simular o webhook

## 🚀 Soluções

### Solução 1: Simular Webhook (Desenvolvimento)

Após fazer o checkout, execute este script para simular o webhook:

```bash
npx tsx scripts/simulate-webhook-after-checkout.ts
```

**Ou use o script de auto-upgrade:**

```bash
npx tsx scripts/auto-upgrade-after-checkout.ts
```

**Ou use o script completo:**

```bash
npx tsx scripts/test-complete-checkout-flow.ts
```

### Solução 2: Configurar Webhook Real (Produção)

1. **Acesse o Stripe Dashboard:**

   ```
   https://dashboard.stripe.com/webhooks
   ```

2. **Adicione um endpoint:**

   - URL: `https://seu-dominio.com/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`

3. **Copie o webhook secret** e adicione ao `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Solução 3: Atualização Manual (Teste)

Para testar rapidamente, use este script:

```bash
npx tsx scripts/test-free-to-pro-upgrade.ts
```

## 📋 Fluxo de Teste Completo

### 1. Fazer Login

```
http://localhost:3000/sign-in
Email: teste1@collabboard.com
```

### 2. Acessar Billing

```
http://localhost:3000/billing
```

### 3. Fazer Checkout

- Clique em "Fazer Upgrade"
- Complete o pagamento no Stripe
- Use dados de teste: `4242 4242 4242 4242`

### 4. Simular Webhook

```bash
npx tsx scripts/simulate-webhook-after-checkout.ts
```

### 5. Verificar Resultado

- Acesse `/billing` novamente
- Deve mostrar plano PRO ativo

## 🔍 Verificação

### Status Esperado Após Webhook:

- ✅ `subscription.plan = "PRO"`
- ✅ `subscription.status = "PRO"`
- ✅ `featureLimit.maxBoards = -1` (Ilimitado)
- ✅ `featureLimit.maxMembers = 50`

### Scripts de Verificação:

```bash
# Verificar usuários e organizações
npx tsx scripts/check-user-org.ts

# Verificar status da subscription
npx tsx scripts/test-free-to-pro-upgrade.ts

# Testar fluxo completo
npx tsx scripts/test-complete-checkout-flow.ts
```

## 🐛 Troubleshooting

### Erro: "Nenhuma organização com checkout encontrada"

- Faça um checkout primeiro
- Verifique se o customer ID foi criado

### Erro: "Stripe não configurado"

- Verifique as variáveis de ambiente
- Execute: `npx tsx scripts/check-env.ts`

### Erro: "Webhook signature verification failed"

- Configure o `STRIPE_WEBHOOK_SECRET`
- Use o script de simulação em desenvolvimento

## 🎉 Resultado Esperado

Após o webhook simulado:

- Plano muda de FREE para PRO
- Limites aumentam (boards ilimitados, 50 membros)
- Página de billing mostra "Plano Atual: Pro"
- Botão muda para "Gerenciar Assinatura"

---

**Para desenvolvimento, use sempre o script de simulação após o checkout!** 🚀
