# 🧪 Guia de Teste: Upgrade FREE para PRO

Este guia mostra como testar a funcionalidade de upgrade do plano FREE para PRO no CollabBoard.

## 📋 Pré-requisitos

- ✅ Servidor rodando em `http://localhost:3000`
- ✅ Stripe configurado com as variáveis de ambiente
- ✅ Banco de dados PostgreSQL funcionando

## 🚀 Passos para Testar

### 1. Criar Organização FREE de Teste

```bash
npx tsx scripts/create-free-org.ts
```

**Resultado esperado:**

```
🎉 Organização FREE criada com sucesso!
📊 Resumo:
   Organização: Organização Teste FREE
   Usuário: test-free@example.com
   Plano: FREE
   Role: OWNER
```

### 2. Verificar Status Inicial

```bash
npx tsx scripts/test-free-to-pro-upgrade.ts
```

**Resultado esperado:**

```
📊 Status atual:
   Plano: FREE
   Status: FREE
   Limites - Boards: 5
   Limites - Members: 5
```

### 3. Testar na Interface Web

1. **Acesse:** `http://localhost:3000/sign-in`
2. **Faça login com:** `test-free@example.com`
3. **Vá para:** `http://localhost:3000/billing`

**Você deve ver:**

- ✅ Plano FREE como "Atual"
- ✅ Botão "Fazer Upgrade" no plano PRO
- ✅ Limites: 5 boards, 5 membros

### 4. Testar Checkout Real

1. **Clique em "Fazer Upgrade"** no plano PRO
2. **Você será redirecionado** para o Stripe Checkout
3. **Use os dados de teste do Stripe:**
   - Número: `4242 4242 4242 4242`
   - Data: Qualquer data futura
   - CVC: Qualquer 3 dígitos
   - Nome: Qualquer nome

### 5. Simular Webhook (Desenvolvimento)

Após o checkout, execute para simular o webhook:

```bash
npx tsx scripts/simulate-complete-checkout.ts
```

### 6. Verificar Upgrade

```bash
npx tsx scripts/test-free-to-pro-upgrade.ts
```

**Resultado esperado:**

```
📊 Status após upgrade:
   Plano: PRO
   Status: PRO
   Próxima cobrança: [data futura]
   Limites - Boards: Ilimitado
   Limites - Members: 50
```

## 🔧 Scripts Disponíveis

### Criação e Setup

- `create-free-org.ts` - Cria organização FREE de teste
- `create-test-user.ts` - Cria usuário de teste

### Testes

- `test-free-to-pro-upgrade.ts` - Testa upgrade FREE → PRO
- `test-billing-action-final.ts` - Testa action de billing
- `simulate-complete-checkout.ts` - Simula webhook do Stripe

### Verificação

- `check-user-org.ts` - Verifica usuários e organizações
- `check-env.ts` - Verifica variáveis de ambiente

## 🎯 Cenários de Teste

### Cenário 1: Upgrade Normal

1. Usuário com plano FREE
2. Clica em "Fazer Upgrade"
3. Completa checkout no Stripe
4. Webhook atualiza para PRO
5. Limites aumentam

### Cenário 2: Gerenciamento de Assinatura

1. Usuário com plano PRO
2. Clica em "Gerenciar Assinatura"
3. Acessa portal do Stripe
4. Pode cancelar/modificar

### Cenário 3: Limites

1. Verificar limites FREE: 5 boards, 5 membros
2. Verificar limites PRO: Ilimitado boards, 50 membros
3. Testar criação de boards/membros

## 🐛 Troubleshooting

### Erro: "Stripe não configurado"

```bash
npx tsx scripts/check-env.ts
```

Verifique se `STRIPE_SECRET_KEY` e `STRIPE_PRO_PRICE_ID` estão configurados.

### Erro: "Organização não encontrada"

```bash
npx tsx scripts/create-free-org.ts
```

Crie uma nova organização FREE.

### Erro: "Porta em uso"

```bash
taskkill //IM node.exe //F
npm run dev
```

## 📊 Verificação Final

Após o upgrade, verifique:

1. **Página de Billing:**

   - Plano PRO como "Atual"
   - Botão "Gerenciar Assinatura"
   - Limites atualizados

2. **Dashboard:**

   - Pode criar mais de 5 boards
   - Pode adicionar mais de 5 membros

3. **Banco de Dados:**
   - `subscription.plan = "PRO"`
   - `subscription.status = "PRO"`
   - `featureLimit.maxBoards = -1`
   - `featureLimit.maxMembers = 50`

## 🎉 Sucesso!

Se todos os passos funcionaram, o sistema de upgrade está funcionando corretamente! 🚀
