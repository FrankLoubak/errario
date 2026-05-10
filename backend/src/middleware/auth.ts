import type { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import type { AuthenticatedRequest } from '../types';

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token de acesso não fornecido' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, tier: true, storageMode: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.debug('Token inválido ou expirado', { error });
    res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
  }
}

export function requirePro(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user.tier !== 'PRO' && req.user.tier !== 'ENTERPRISE') {
    res.status(403).json({
      success: false,
      error: 'Funcionalidade disponível apenas no plano Pro',
      upgradeRequired: true,
    });
    return;
  }
  next();
}
