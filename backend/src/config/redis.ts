import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis: máximo de tentativas atingido, desistindo');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis conectado'));
redis.on('error', (err) => logger.error('Erro no Redis', { error: err.message }));
redis.on('close', () => logger.warn('Conexão Redis encerrada'));

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error) {
    logger.warn('Redis indisponível — rate limiting usará memória local', { error });
  }
}
