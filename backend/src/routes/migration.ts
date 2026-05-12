import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { notesLimiter } from '../middleware/rateLimiter';
import { migrateLocalNotes, migrationPayloadSchema } from '../services/migrationService';
import type { AuthenticatedRequest } from '../types';

export const migrationRouter = Router();

migrationRouter.use(authMiddleware as never);
migrationRouter.use(notesLimiter);

// POST /api/v1/migrations/from-local
// Body: { notes: Note[], deviceId?: string }
// Importa notas do SQLite local para o PostgreSQL após upgrade para Pro
migrationRouter.post('/from-local', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payload = migrationPayloadSchema.parse(req.body);
    const result = await migrateLocalNotes(req.user.id, payload);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
