import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../types';

export const usersRouter = Router();

usersRouter.use(authMiddleware as never);

// ─────────────────────────────────────────────
// POST /api/v1/users/me/device
// Registra ou atualiza o Expo push token do device atual
// ─────────────────────────────────────────────

const deviceSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório').max(500),
  platform: z.enum(['ios', 'android']),
});

usersRouter.post(
  '/me/device',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { token, platform } = deviceSchema.parse(req.body);

      // Upsert: token único — atualiza o userId se o device mudou de conta
      await prisma.userDevice.upsert({
        where: { token },
        create: { userId: req.user.id, token, platform },
        update: { userId: req.user.id, platform },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────────────────────────────────
// DELETE /api/v1/users/me/device
// Remove o token do device atual (logout)
// ─────────────────────────────────────────────

usersRouter.delete(
  '/me/device',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { token } = z.object({ token: z.string().min(1) }).parse(req.body);

      await prisma.userDevice.deleteMany({
        where: { userId: req.user.id, token },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────────────────────────────────
// PATCH /api/v1/users/me
// Atualiza nome do perfil
// ─────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
});

usersRouter.patch(
  '/me',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = updateProfileSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: input,
        select: { id: true, email: true, name: true, tier: true, storageMode: true, credits: true },
      });

      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────────────────────────────────
// DELETE /api/v1/users/me
// Exclusão de conta (LGPD/GDPR)
// ─────────────────────────────────────────────

usersRouter.delete(
  '/me',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { confirm } = z.object({ confirm: z.literal('EXCLUIR') }).parse(req.body);
      if (!confirm) throw new AppError(400, 'Confirmação inválida');

      // Soft delete via flag — mantém dados por 30 dias antes de purge (compliance)
      await prisma.user.update({
        where: { id: req.user.id },
        data: { email: `deleted+${req.user.id}@errario.app`, name: 'Conta excluída' },
      });

      await prisma.session.updateMany({
        where: { userId: req.user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      res.json({ success: true, message: 'Conta excluída' });
    } catch (error) {
      next(error);
    }
  }
);
