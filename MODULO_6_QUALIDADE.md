# Módulo 6 — Qualidade, Observabilidade e Deploy

## P10 — Sentry + Rate Limiting

### Objetivo

Monitorar erros e proteger endpoints contra abuso.

### Arquivos Implementados

#### 1. Configuração do Sentry

- **`sentry.client.config.ts`**: Configuração para o lado cliente
- **`sentry.server.config.ts`**: Configuração para o lado servidor
- **`next.config.ts`**: Integração do Sentry com Next.js

#### 2. Sistema de Rate Limiting

- **`src/lib/rate-limit.ts`**: Sistema completo de rate limiting
- **`src/middleware.ts`**: Middleware com rate limiting e monitoramento
- **`src/lib/error-boundary.tsx`**: Error boundary para React

#### 3. Scripts de Teste

- **`scripts/test-rate-limit.ts`**: Script para testar rate limiting

### Funcionalidades Implementadas

#### ✅ Monitoramento de Erros (Sentry)

- **Captura automática de erros** em server actions
- **Error boundary** para componentes React
- **Performance monitoring** com traces
- **Session replay** para debug
- **Filtros inteligentes** para evitar spam de erros
- **Contexto de usuário** nos erros

#### ✅ Rate Limiting

- **Rate limiting por IP e usuário**
- **Limites específicos por ação**:
  - Criar board: 5/minuto
  - Criar card: 20/minuto
  - Criar coluna: 10/minuto
  - Deletar board: 3/minuto
  - Deletar card: 10/minuto
  - Atualizar card: 30/minuto
  - Reordenar: 50/minuto
  - Buscar: 100/minuto
  - Autenticação: 5/5 minutos

#### ✅ Proteção de Endpoints

- **Rate limiting automático** em APIs
- **Headers de rate limit** informativos
- **Bloqueio inteligente** de abusos
- **Middleware centralizado** para proteção

### Como Usar

#### 1. Configurar Variáveis de Ambiente

```bash
# Sentry
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="your-sentry-project"
```

#### 2. Testar Rate Limiting

```bash
npm run test:rate-limit
```

#### 3. Monitorar Erros

- Os erros aparecem automaticamente no Sentry
- Performance monitoring ativo
- Session replay disponível

### Critérios Atendidos

#### ✅ Erros aparecem no Sentry

- Captura automática em server actions
- Error boundary para React
- Contexto completo dos erros
- Filtros para evitar spam

#### ✅ Ações bloqueiam abuso

- Rate limiting por ação específica
- Proteção de endpoints de API
- Limites por IP e usuário
- Headers informativos

### Benefícios

1. **Observabilidade Completa**: Todos os erros são capturados e monitorados
2. **Proteção Contra Abuso**: Rate limiting inteligente protege contra ataques
3. **Debugging Melhorado**: Session replay e contexto rico nos erros
4. **Performance Monitoring**: Traces automáticos para identificar gargalos
5. **Experiência do Usuário**: Error boundary elegante para erros inesperados

### Próximos Passos

1. **Configurar Sentry** com DSN real
2. **Implementar Redis** para rate limiting em produção
3. **Configurar alertas** no Sentry
4. **Monitorar métricas** de rate limiting
5. **Ajustar limites** baseado no uso real
