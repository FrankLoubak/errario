import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter no mínimo 32 caracteres'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@errario.app'),

  SENTRY_DSN: z.string().optional(),

  FRONTEND_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:3001'),

  BCRYPT_ROUNDS: z.string().default('10').transform(Number),

  APPLE_BUNDLE_ID: z.string().default('com.errario.app'),
  APPLE_SHARED_SECRET: z.string().optional(),
  // App Store Connect API — necessário para validação IAP StoreKit 2
  APPLE_KEY_ID: z.string().optional(),             // Key ID do App Store Connect
  APPLE_ISSUER_ID: z.string().optional(),          // Issuer ID do App Store Connect
  APPLE_PRIVATE_KEY: z.string().optional(),        // Conteúdo do arquivo .p8 (PEM)

  GOOGLE_PLAY_PACKAGE_NAME: z.string().default('com.errario.app'),
  // JSON string da service account key do Google Cloud Console
  GOOGLE_PLAY_SERVICE_ACCOUNT_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
