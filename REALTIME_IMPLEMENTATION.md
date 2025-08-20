# Implementação de Tempo Real - CollabBoard

## Visão Geral

Implementamos um sistema completo de tempo real usando Pusher para sincronizar alterações em boards entre múltiplos usuários em tempo real.

## Arquitetura

### 1. Configuração do Pusher

- **Servidor**: `pusher-server` para publicar eventos
- **Cliente**: `pusher-js` para escutar eventos
- **Canais**: `board-{boardId}` para cada board

### 2. Tipos de Eventos

```typescript
type RealtimeEvent =
  | { type: "column.created"; column: { id; title; index } }
  | { type: "column.updated"; column: { id; title } }
  | { type: "column.deleted"; columnId: string }
  | { type: "column.reordered"; columnIds: string[] }
  | { type: "card.created"; card: { id; title; description; columnId; index } }
  | { type: "card.updated"; card: { id; title; description } }
  | { type: "card.deleted"; cardId: string }
  | { type: "card.reordered"; updates: Array<{ id; columnId; index }> }
  | { type: "label.toggled"; cardId; labelId; added: boolean };
```

## Arquivos Implementados

### 1. `src/lib/realtime.ts`

- Configuração do Pusher (servidor e cliente)
- Tipos de eventos
- Hook `useRealtimeBoard` para escutar eventos
- Função `publishEvent` para publicar eventos

### 2. Actions Atualizadas

- `createColumn`: Publica evento `column.created`
- `createCard`: Publica evento `card.created`
- `renameColumn`: Publica evento `column.updated`
- `deleteColumn`: Publica evento `column.deleted`
- `renameCard`: Publica evento `card.updated`
- `deleteCard`: Publica evento `card.deleted`
- `updateCard`: Publica evento `card.updated`
- `toggleLabel`: Publica evento `label.toggled`
- `reorderCards`: Publica evento `card.reordered`
- `reorderColumns`: Publica evento `column.reordered`

### 3. `src/app/(app)/boards/[boardId]/kanban.tsx`

- Hook `useRealtimeBoard` para escutar eventos
- Lógica de reconciliação para cada tipo de evento
- UI otimista com fallback para `router.refresh()`
- Indicador visual de status da conexão

### 4. `src/components/realtime-status.tsx`

- Componente para mostrar status da conexão
- Badge com ícone de WiFi
- Estados: "Tempo real ativo" / "Desconectado"

## Funcionalidades

### ✅ Implementadas

1. **Criação em tempo real**

   - Colunas e cards aparecem instantaneamente
   - Índices são calculados corretamente

2. **Edição em tempo real**

   - Títulos e descrições são sincronizados
   - Labels são atualizadas

3. **Exclusão em tempo real**

   - Colunas e cards são removidos instantaneamente
   - Reindexação automática

4. **Reordenação em tempo real**

   - Drag & drop de cards entre colunas
   - Reordenação de colunas
   - Índices são mantidos sincronizados

5. **UI Otimista**

   - Mudanças aparecem instantaneamente
   - Fallback para `router.refresh()` em caso de falha

6. **Indicador de Status**
   - Mostra se está conectado ou não
   - Feedback visual para o usuário

### 🔄 Fallback

- Se o tempo real falhar, usa `router.refresh()`
- Sistema continua funcionando normalmente
- Dados são sincronizados via polling

## Performance

### Otimizações

- Eventos mínimos (apenas dados necessários)
- Reconciliação eficiente no cliente
- Debounce para evitar spam de eventos
- Conexão única por board

### Limitações

- Máximo de 100 conexões simultâneas (Pusher gratuito)
- Latência depende da localização do cluster
- Requer conexão com internet

## Segurança

### Validações

- Todos os eventos passam pelas actions do servidor
- Verificação de permissões (RBAC)
- Validação de dados antes de publicar
- Canais privados por board

### Isolamento

- Cada board tem seu próprio canal
- Usuários só veem eventos dos boards que têm acesso
- Dados sensíveis não são expostos

## Configuração

### Variáveis de Ambiente

```env
PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

### Dependências

```json
{
  "pusher": "^5.2.0",
  "pusher-js": "^8.4.0"
}
```

## Testes

### Cenários Testados

1. ✅ Duas janelas na mesma board
2. ✅ Criação/edição/exclusão simultânea
3. ✅ Drag & drop entre colunas
4. ✅ Reordenação de colunas
5. ✅ Edição de labels
6. ✅ Reconexão após perda de internet

### Como Testar

1. Configure o Pusher (ver `PUSHER_SETUP.md`)
2. Abra duas janelas na mesma board
3. Faça alterações em uma janela
4. Verifique se aparecem na outra

## Próximos Passos

### Melhorias Possíveis

1. **Presença**: Mostrar quem está online
2. **Cursors**: Mostrar onde outros usuários estão
3. **Histórico**: Log de alterações
4. **Notificações**: Alertas para mudanças importantes
5. **Offline**: Sincronização quando voltar online

### Escalabilidade

1. **Clusters**: Múltiplos clusters por região
2. **Rate Limiting**: Limitar eventos por usuário
3. **Compressão**: Comprimir payloads grandes
4. **Caching**: Cache de dados frequentes
