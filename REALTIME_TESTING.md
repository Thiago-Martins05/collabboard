# Testando a Funcionalidade de Tempo Real

## Pré-requisitos

1. Configure o Pusher conforme o arquivo `PUSHER_SETUP.md`
2. Inicie o servidor: `npm run dev`

## Testes Básicos

### 1. Teste de Conexão

1. Abra o navegador e acesse uma board
2. Verifique se o indicador "Tempo real ativo" aparece no topo
3. Se aparecer "Desconectado", verifique as configurações do Pusher

### 2. Teste de Sincronização

1. Abra duas janelas do navegador na mesma board
2. Em uma janela, crie uma nova coluna
3. Verifique se a coluna aparece automaticamente na outra janela
4. Repita o teste criando cards, editando títulos, etc.

### 3. Teste de Drag & Drop

1. Em uma janela, arraste um card para outra coluna
2. Verifique se o movimento é refletido na outra janela
3. Teste reordenar colunas também

### 4. Teste de Edição

1. Em uma janela, edite o título de um card
2. Verifique se a mudança aparece na outra janela
3. Teste editar descrições também

### 5. Teste de Exclusão

1. Em uma janela, delete um card ou coluna
2. Verifique se o item é removido na outra janela

## Testes Avançados

### 1. Teste de Reconexão

1. Desconecte a internet temporariamente
2. Faça alterações na board
3. Reconecte a internet
4. Verifique se as alterações são sincronizadas

### 2. Teste de Múltiplos Usuários

1. Abra a board em 3-4 janelas diferentes
2. Faça alterações simultâneas
3. Verifique se todas as janelas ficam sincronizadas

### 3. Teste de Performance

1. Crie muitas colunas e cards
2. Faça movimentos rápidos
3. Verifique se a performance permanece boa

## Debugging

### Logs do Console

Abra o console do navegador para ver logs de eventos:

```javascript
// Eventos recebidos
console.log("Evento recebido:", event);

// Status da conexão
console.log("Conectado:", isConnected);
```

### Problemas Comuns

1. **"Desconectado" sempre aparece**

   - Verifique as variáveis de ambiente do Pusher
   - Confirme se o app está ativo no dashboard do Pusher

2. **Eventos não chegam**

   - Verifique se o cluster está correto
   - Confirme se as chaves estão corretas

3. **Performance lenta**
   - Verifique a conexão de internet
   - Considere usar um cluster mais próximo

## Fallback

Se o tempo real falhar, o sistema automaticamente:

1. Mostra "Desconectado" no indicador
2. Usa `router.refresh()` para sincronizar dados
3. Continua funcionando normalmente (sem tempo real)
