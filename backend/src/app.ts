import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { notesRouter } from './routes/notes';
import { plannerRouter } from './routes/planner';
import { billingRouter } from './routes/billing';
import { usersRouter } from './routes/users';
import { logger } from './utils/logger';

export function createApp(): express.Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  const allowedOrigins = env.NODE_ENV === 'production'
    ? ['https://errario.app', 'https://www.errario.app', 'https://app.errario.app']
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS bloqueado', { origin });
        callback(new Error('Origem não permitida pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(globalLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/notes', notesRouter);
  app.use('/api/v1/planner', plannerRouter);
  app.use('/api/v1/billing', billingRouter);
  app.use('/api/v1/users', usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
