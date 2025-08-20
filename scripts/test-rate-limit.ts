#!/usr/bin/env tsx

/**
 * Script para testar o rate limiting
 *
 * Uso: npm run test:rate-limit
 */

// Mock simples do rate limiting para teste
interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// In-memory store para teste
const testRateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

function testActionRateLimit(action: string, userId: string): RateLimitResult {
  const key = `action:${action}:${userId}`;
  const now = Date.now();

  // Configurações de teste
  const configs: Record<string, { maxRequests: number; windowMs: number }> = {
    "create-board": { maxRequests: 5, windowMs: 60 * 1000 },
    auth: { maxRequests: 5, windowMs: 5 * 60 * 1000 },
    search: { maxRequests: 100, windowMs: 60 * 1000 },
  };

  const config = configs[action] || { maxRequests: 10, windowMs: 60 * 1000 };

  // Limpar entradas expiradas
  const current = testRateLimitStore.get(key);
  if (current && current.resetTime < now) {
    testRateLimitStore.delete(key);
  }

  // Obter ou criar entrada atual
  const entry = testRateLimitStore.get(key) || {
    count: 0,
    resetTime: now + config.windowMs,
  };

  // Verificar se ainda está na janela de tempo
  if (entry.resetTime < now) {
    entry.count = 0;
    entry.resetTime = now + config.windowMs;
  }

  // Incrementar contador
  entry.count++;
  testRateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: entry.resetTime,
    retryAfter: success ? undefined : Math.ceil((entry.resetTime - now) / 1000),
  };
}

function testRateLimit() {
  console.log("🧪 Testando Rate Limiting...\n");

  // Teste 1: Rate limit normal
  console.log("1. Testando rate limit normal:");
  for (let i = 1; i <= 6; i++) {
    const result = testActionRateLimit("create-board", "user-123");
    console.log(
      `   Tentativa ${i}: ${result.success ? "✅ Sucesso" : "❌ Bloqueado"} (${
        result.remaining
      } restantes)`
    );

    if (!result.success) {
      console.log(`   ⏰ Aguarde ${result.retryAfter} segundos`);
      break;
    }
  }

  console.log("\n2. Testando rate limit de autenticação:");
  for (let i = 1; i <= 6; i++) {
    const result = testActionRateLimit("auth", "user-456");
    console.log(
      `   Tentativa ${i}: ${result.success ? "✅ Sucesso" : "❌ Bloqueado"} (${
        result.remaining
      } restantes)`
    );

    if (!result.success) {
      console.log(`   ⏰ Aguarde ${result.retryAfter} segundos`);
      break;
    }
  }

  console.log("\n3. Testando rate limit de busca:");
  for (let i = 1; i <= 101; i++) {
    const result = testActionRateLimit("search", "user-789");
    if (i % 20 === 0 || i === 101) {
      console.log(
        `   Tentativa ${i}: ${
          result.success ? "✅ Sucesso" : "❌ Bloqueado"
        } (${result.remaining} restantes)`
      );
    }

    if (!result.success) {
      console.log(`   ⏰ Aguarde ${result.retryAfter} segundos`);
      break;
    }
  }

  console.log("\n✅ Testes de rate limiting concluídos!");
}

// Executar teste
testRateLimit();
