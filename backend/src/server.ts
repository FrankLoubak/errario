import * as Sentry from '@sentry/node';
import { env } from './config/env';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, redis } from './config/redis';
import { startScheduler } from './jobs/scheduler';
import { logger } from './utils/logger';

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();
  await startScheduler();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Servidor Errário rodando na porta ${env.PORT}`, {
      env: env.NODE_ENV,
      port: env.PORT,
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} recebido, encerrando servidor...`);

    server.close(async () => {
      await disconnectDatabase();
      await redis.quit();
      logger.info('Servidor encerrado com sucesso');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Encerramento forçado após timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    logger.error('Exceção não capturada', { error: error.message, stack: error.stack });
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Promise rejeitada sem tratamento', { reason });
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  logger.error('Falha ao iniciar servidor', { error });
  process.exit(1);
});
