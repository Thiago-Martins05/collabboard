import { NextRequest } from "next/server";
import { getSession } from "./session";

// In-memory store for rate limiting (em produção, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest, userId?: string) => string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Rate limiter para proteger endpoints sensíveis
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const session = await getSession();
  const userId = (session?.user as any)?.id;

  // Gerar chave única para o rate limit
  const key = config.keyGenerator
    ? config.keyGenerator(req, userId)
    : userId
    ? `user:${userId}`
    : `ip:${getClientIP(req)}`;

  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Limpar entradas expiradas
  const current = rateLimitStore.get(key);
  if (current && current.resetTime < now) {
    rateLimitStore.delete(key);
  }

  // Obter ou criar entrada atual
  const entry = rateLimitStore.get(key) || {
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
  rateLimitStore.set(key, entry);

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

/**
 * Rate limiter para ações específicas (criar board, card, etc.)
 */
export async function actionRateLimit(
  req: NextRequest,
  action: string,
  userId?: string
): Promise<RateLimitResult> {
  const configs: Record<string, RateLimitConfig> = {
    "create-board": { maxRequests: 5, windowMs: 60 * 1000 }, // 5 boards por minuto
    "create-card": { maxRequests: 20, windowMs: 60 * 1000 }, // 20 cards por minuto
    "create-column": { maxRequests: 10, windowMs: 60 * 1000 }, // 10 colunas por minuto
    "delete-board": { maxRequests: 3, windowMs: 60 * 1000 }, // 3 exclusões por minuto
    "delete-card": { maxRequests: 10, windowMs: 60 * 1000 }, // 10 exclusões por minuto
    "update-card": { maxRequests: 30, windowMs: 60 * 1000 }, // 30 atualizações por minuto
    reorder: { maxRequests: 50, windowMs: 60 * 1000 }, // 50 reordenações por minuto
    search: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 buscas por minuto
    auth: { maxRequests: 5, windowMs: 5 * 60 * 1000 }, // 5 tentativas de auth por 5 minutos
  };

  const config = configs[action] || { maxRequests: 10, windowMs: 60 * 1000 };

  return rateLimit(req, {
    ...config,
    keyGenerator: (req, userId) =>
      `action:${action}:${userId || getClientIP(req)}`,
  });
}

/**
 * Rate limiter para endpoints de API
 */
export async function apiRateLimit(
  req: NextRequest,
  endpoint: string
): Promise<RateLimitResult> {
  const configs: Record<string, RateLimitConfig> = {
    "/api/auth": { maxRequests: 10, windowMs: 5 * 60 * 1000 }, // 10 tentativas por 5 minutos
    "/api/webhooks": { maxRequests: 100, windowMs: 60 * 1000 }, // 100 webhooks por minuto
    "/api/boards": { maxRequests: 50, windowMs: 60 * 1000 }, // 50 requests por minuto
    "/api/cards": { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests por minuto
  };

  const config = configs[endpoint] || { maxRequests: 30, windowMs: 60 * 1000 };

  return rateLimit(req, {
    ...config,
    keyGenerator: (req) => `api:${endpoint}:${getClientIP(req)}`,
  });
}

/**
 * Obter IP do cliente
 */
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Middleware para aplicar rate limiting em server actions
 */
export function withRateLimit<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  rateLimitConfig: RateLimitConfig
) {
  return async (req: NextRequest, ...args: T): Promise<R> => {
    const result = await rateLimit(req, rateLimitConfig);

    if (!result.success) {
      throw new Error(
        `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`
      );
    }

    return action(...args);
  };
}

/**
 * Decorator para aplicar rate limiting em server actions
 */
export function rateLimited(config: RateLimitConfig) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Aqui você precisaria ter acesso ao request
      // Em server actions, isso é mais complexo
      // Por isso criamos a função withRateLimit acima
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
