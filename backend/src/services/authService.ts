import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import type { TokenPair } from '../types';

// ─────────────────────────────────────────────
// Schemas de validação
// ─────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório').max(100).trim(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const googleMobileSchema = z.object({
  code: z.string().min(1, 'Código de autorização é obrigatório'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────
// Google OAuth — URL de autorização
// ─────────────────────────────────────────────

// redirect_uri = deep link do app (interceptado pelo WebBrowser.openAuthSessionAsync)
// Deve ser registrado exatamente assim no Google Cloud Console como URI autorizado
const GOOGLE_MOBILE_REDIRECT_URI = 'com.errario.app://auth/callback';

export function buildGoogleAuthUrl(): string {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID não configurada');
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', GOOGLE_MOBILE_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'select_account');

  return url.toString();
}

// ─────────────────────────────────────────────
// Funções auxiliares
// ─────────────────────────────────────────────

async function buildTokenPair(userId: string, email: string, tier: string, storageMode: string): Promise<TokenPair> {
  const accessToken = generateAccessToken({
    sub: userId,
    email,
    tier: tier as never,
    storageMode: storageMode as never,
  });

  const refreshToken = generateRefreshToken(userId);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.session.create({
    data: { userId, refreshToken, expiresAt },
  });

  return { accessToken, refreshToken };
}

// ─────────────────────────────────────────────
// Registro com email/senha
// ─────────────────────────────────────────────

export async function register(input: RegisterInput): Promise<{
  user: { id: string; email: string; name: string | null };
  tokens: TokenPair;
}> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'Email já cadastrado');
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
    select: { id: true, email: true, name: true, tier: true, storageMode: true },
  });

  logger.info('Novo usuário registrado', { userId: user.id, email: user.email });

  const tokens = await buildTokenPair(user.id, user.email, user.tier, user.storageMode);

  return { user: { id: user.id, email: user.email, name: user.name }, tokens };
}

// ─────────────────────────────────────────────
// Login com email/senha
// ─────────────────────────────────────────────

export async function login(input: LoginInput): Promise<{
  user: { id: string; email: string; name: string | null; tier: string; storageMode: string };
  tokens: TokenPair;
}> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      tier: true,
      storageMode: true,
    },
  });

  // Mesma mensagem de erro para email não encontrado e senha incorreta (previne user enumeration)
  if (!user || !user.passwordHash) {
    throw new AppError(401, 'Email ou senha incorretos');
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError(401, 'Email ou senha incorretos');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  logger.info('Login realizado', { userId: user.id });

  const tokens = await buildTokenPair(user.id, user.email, user.tier, user.storageMode);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      storageMode: user.storageMode,
    },
    tokens,
  };
}

// ─────────────────────────────────────────────
// Refresh token
// ─────────────────────────────────────────────

export async function refreshTokens(token: string): Promise<TokenPair> {
  let payload: ReturnType<typeof verifyRefreshToken>;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, 'Refresh token inválido ou expirado');
  }

  const session = await prisma.session.findUnique({
    where: { refreshToken: token },
    include: { user: { select: { id: true, email: true, tier: true, storageMode: true } } },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token inválido, revogado ou expirado');
  }

  if (session.userId !== payload.sub) {
    throw new AppError(401, 'Refresh token inválido');
  }

  // Rotaciona o refresh token (revoga o antigo, cria novo)
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await buildTokenPair(
    session.user.id,
    session.user.email,
    session.user.tier,
    session.user.storageMode
  );

  logger.info('Tokens renovados', { userId: session.user.id });

  return tokens;
}

// ─────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────

export async function logout(refreshToken: string): Promise<void> {
  await prisma.session.updateMany({
    where: { refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ─────────────────────────────────────────────
// Google OAuth (mobile deep link — authorization code)
// ─────────────────────────────────────────────

export async function loginWithGoogleCode(code: string): Promise<{
  user: { id: string; email: string; name: string | null; tier: string; storageMode: string; isNew: boolean };
  tokens: TokenPair;
}> {
  // Troca o code pelo access token do Google
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? '',
      client_secret: env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: GOOGLE_MOBILE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    throw new AppError(400, 'Falha ao trocar código Google por tokens');
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new AppError(400, 'Token do Google não recebido');
  }

  // Busca dados do usuário no Google
  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileResponse.ok) {
    throw new AppError(400, 'Falha ao obter perfil do Google');
  }

  const profile = (await profileResponse.json()) as {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };

  // Busca ou cria o usuário
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.id }, { email: profile.email }] },
    select: { id: true, email: true, name: true, googleId: true, tier: true, storageMode: true },
  });

  const isNew = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        googleId: profile.id,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, email: true, name: true, googleId: true, tier: true, storageMode: true },
    });
    logger.info('Novo usuário via Google OAuth', { userId: user.id });
  } else if (!user.googleId) {
    // Vincula conta existente ao Google ID
    await prisma.user.update({
      where: { id: user.id },
      data: { googleId: profile.id, emailVerified: true },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await buildTokenPair(user.id, user.email, user.tier, user.storageMode);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      storageMode: user.storageMode,
      isNew,
    },
    tokens,
  };
}
