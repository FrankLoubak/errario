import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

function createRedisStore(prefix: string) {
  try {
    return new RedisStore({
      sendCommand: (...args: [string, ...string[]]) => redis.call(...args) as Promise<number>,
      prefix: `rl:${prefix}:`,
    });
  } catch {
    logger.warn(`Rate limiter ${prefix}: usando memória local (Redis indisponível)`);
    return undefined;
  }
}

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('global'),
  message: { success: false, error: 'Muitas requisições, tente novamente em 15 minutos' },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('login'),
  message: { success: false, error: 'Muitas tentativas de login, tente novamente em 15 minutos' },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('register'),
  message: { success: false, error: 'Muitas tentativas de registro, tente novamente em 1 hora' },
});

export const notesLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('notes'),
  message: { success: false, error: 'Limite de requisições de notas atingido' },
});

export const billingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('billing'),
  message: { success: false, error: 'Limite de requisições de pagamento atingido' },
});

export const deviceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('device'),
  message: { success: false, error: 'Limite de registros de device atingido' },
});
