import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { notesLimiter } from '../middleware/rateLimiter';
import { migrateLocalNotes, migrationPayloadSchema } from '../services/migrationService';
import type { AuthenticatedRequest } from '../types';

export const migrationRouter = Router();

migrationRouter.use(authMiddleware as never);
migrationRouter.use(notesLimiter);

migrationRouter.post('/from-local', async (req: Request, res: Response, next: NextFunction) => {
  const { user } = req as AuthenticatedRequest;
  try {
    const payload = migrationPayloadSchema.parse(req.body);
    const result = await migrateLocalNotes(user.id, payload);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
