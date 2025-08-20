# Módulo 5 — Billing & Limites (Stripe)

## 📋 Visão Geral

Implementação do sistema de limites para o plano Free, bloqueando a criação de recursos quando os limites são atingidos.

## 🎯 Funcionalidades

### ✅ Implementado

1.  **Sistema de Limites**

    - Verificação automática de limites antes de criar recursos
    - Limites configuráveis por organização
    - Toasts informativos quando limites são atingidos

2.  **Limites Configurados**

        - **Boards**: 5 boards (Free)

    - **Membros**: 5 membros (Free)
    - **Colunas**: 10 por board (Free)
    - **Cards**: 100 por board (Free)
    - **Labels**: 20 por board (Free)

3.  **Banners de Limite**

    - Banner amarelo quando próximo do limite (80%+)
    - Banner vermelho quando limite atingido
    - Botão "Upgrade Pro" nos banners

4.  **Verificações Implementadas**
    - ✅ Criação de boards
    - ✅ Criação de colunas
    - ✅ Criação de cards
    - ✅ Criação de labels
    - ✅ Convite de membros

## 🏗️ Arquitetura

### Arquivos Principais

```
src/
├── lib/
│   ├── limits.ts              # Sistema de limites
│   └── test-limits.ts         # Scripts de teste
├── components/
│   └── limits-banner.tsx      # Banner de limites
├── app/(app)/
│   ├── dashboard/
│   │   └── actions.ts         # Verificação em criar board
│   ├── boards/[boardId]/
│   │   ├── actions.ts         # Verificação em criar coluna/card
│   │   └── label-actions.ts   # Verificação em criar label
│   └── settings/members/
│       └── actions.ts         # Verificação em convidar membro
└── scripts/
    └── test-limits.ts         # Script de teste
```

### Fluxo de Verificação

1. **Ação do usuário** (criar board, coluna, etc.)
2. **Verificação de limites** (`enforceFeatureLimit`)
3. **Se limite atingido**: Toast de erro + retorno
4. **Se permitido**: Continua com a criação
5. **Banner exibido** no dashboard se próximo/atingido

## 🔧 Como Usar

### Verificação Básica

```typescript
import { enforceFeatureLimit } from "@/lib/limits";

// Em uma action
const canCreate = await enforceFeatureLimit(organizationId, "boards");
if (!canCreate) {
  return { ok: false, error: "Limite atingido" };
}
```

### Obter Estatísticas

```typescript
import { getOrganizationUsage } from "@/lib/limits";

const usage = await getOrganizationUsage(organizationId);
console.log(usage.boards); // { current: 2, max: 3 }
```

### Verificar se Próximo do Limite

```typescript
import { isNearLimit } from "@/lib/limits";

const nearLimit = await isNearLimit(organizationId, "boards");
if (nearLimit) {
  // Mostrar aviso
}
```

## 🧪 Testes

### Configurar Limites de Teste

```typescript
import { setupTestLimits } from "@/lib/test-limits";

// Configura limites baixos para teste
await setupTestLimits(organizationId);
// maxBoards: 1, maxMembers: 2
```

### Executar Script de Teste

```bash
# No terminal
npx tsx scripts/test-limits.ts
```

### Testes Manuais

1. **Criar Board**

   - Acesse o dashboard
   - Tente criar um segundo board (deve falhar)

2. **Convidar Membro**

   - Vá em Settings > Members
   - Tente convidar um terceiro membro (deve falhar)

3. **Verificar Banners**
   - Dashboard deve mostrar banners quando próximo/atingido

## 🎨 UI/UX

### Banners

- **Amarelo**: Próximo do limite (80%+)
- **Vermelho**: Limite atingido
- **Botão**: "Upgrade Pro" (preparado para integração)

### Toasts

- **Erro**: "Limite atingido! Você atingiu o máximo de X no plano Free."
- **Ação**: "Ver planos" (preparado para integração)

## 🔮 Próximos Passos

### Integração com Stripe

1. **Página de Billing**

   - `/billing` - Lista de planos
   - Integração com Stripe Checkout

2. **Webhooks**

   - Atualizar limites quando plano mudar
   - Cancelamento/upgrade automático

3. **Planos Pro**
   - Limites maiores
   - Recursos premium

### Melhorias

1. **Métricas**

   - Dashboard de uso
   - Gráficos de consumo

2. **Notificações**

   - E-mail quando próximo do limite
   - Alertas em tempo real

3. **Flexibilidade**
   - Limites customizados por plano
   - Override para organizações especiais

## 📊 Limites Atuais

| Recurso | Free      | Pro (Futuro) |
| ------- | --------- | ------------ |
| Boards  | 5         | Ilimitado    |
| Membros | 5         | 50           |
| Colunas | 10/board  | 50/board     |
| Cards   | 100/board | 1000/board   |
| Labels  | 20/board  | 100/board    |

## 🚀 Deploy

O sistema de limites está pronto para produção e será ativado automaticamente para todas as organizações.

### Variáveis de Ambiente

Nenhuma variável adicional necessária. O sistema usa os limites padrão definidos no código.

### Migração

O sistema cria automaticamente os registros `FeatureLimit` para organizações existentes com limites padrão.
