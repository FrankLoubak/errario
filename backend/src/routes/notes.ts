import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { notesLimiter } from '../middleware/rateLimiter';
import {
  handleListNotes,
  handleGetNote,
  handleCreateNote,
  handleUpdateNote,
  handleDeleteNote,
  handleGetAnalytics,
} from '../controllers/notesController';

export const notesRouter = Router();

notesRouter.use(authMiddleware as never);
notesRouter.use(notesLimiter);

// GET  /api/v1/notes           → listar notas (paginado, filtro por status/subject/search)
// GET  /api/v1/notes/analytics → dados de distribuição por matéria (pizza chart)
// GET  /api/v1/notes/:id       → buscar nota específica
// POST /api/v1/notes           → criar nota
// PATCH /api/v1/notes/:id      → atualizar nota
// DELETE /api/v1/notes/:id     → soft delete

notesRouter.get('/analytics', handleGetAnalytics as never);
notesRouter.get('/', handleListNotes as never);
notesRouter.get('/:id', handleGetNote as never);
notesRouter.post('/', handleCreateNote as never);
notesRouter.patch('/:id', handleUpdateNote as never);
notesRouter.delete('/:id', handleDeleteNote as never);
