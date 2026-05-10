import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { notesLimiter } from '../middleware/rateLimiter';

export const notesRouter = Router();

// Todas as rotas de notas requerem autenticação
notesRouter.use(authMiddleware as never);
notesRouter.use(notesLimiter);

// Sprint 3: implementação completa das rotas de notas
// GET    /api/v1/notes         → listar notas do usuário (paginado)
// GET    /api/v1/notes/:id     → buscar nota específica
// POST   /api/v1/notes         → criar nota
// PATCH  /api/v1/notes/:id     → atualizar nota
// DELETE /api/v1/notes/:id     → soft delete (status = deleted)

notesRouter.get('/', (_req, res) => {
  res.json({ success: true, data: { notes: [], total: 0, hasMore: false } });
});
