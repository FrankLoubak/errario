import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { deviceLimiter } from '../middleware/rateLimiter';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../types';

export const usersRouter = Router();

usersRouter.use(authMiddleware as never);

const deviceSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório').max(500),
  platform: z.enum(['ios', 'android']),
});

usersRouter.post(
  '/me/device',
  deviceLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as AuthenticatedRequest;
    try {
      const { token, platform } = deviceSchema.parse(req.body);
      await prisma.userDevice.upsert({
        where: { token },
        create: { userId: user.id, token, platform },
        update: { userId: user.id, platform },
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.delete(
  '/me/device',
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as AuthenticatedRequest;
    try {
      const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
      await prisma.userDevice.deleteMany({ where: { userId: user.id, token } });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
});

usersRouter.patch(
  '/me',
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as AuthenticatedRequest;
    try {
      const input = updateProfileSchema.parse(req.body);
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: input,
        select: { id: true, email: true, name: true, tier: true, storageMode: true, credits: true },
      });
      res.json({ success: true, data: { user: updated } });
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.delete(
  '/me',
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as AuthenticatedRequest;
    try {
      const { confirm } = z.object({ confirm: z.literal('EXCLUIR') }).parse(req.body);
      if (!confirm) throw new AppError(400, 'Confirmação inválida');

      await prisma.user.update({
        where: { id: user.id },
        data: { email: `deleted+${user.id}@errario.app`, name: 'Conta excluída' },
      });
      await prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      res.json({ success: true, message: 'Conta excluída' });
    } catch (error) {
      next(error);
    }
  }
);
