import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { notesLimiter } from '../middleware/rateLimiter';
import {
  handleGetPlannerWeek,
  handleCreatePlannerCard,
  handleUpdatePlannerCard,
  handleDeletePlannerCard,
} from '../controllers/plannerController';

export const plannerRouter = Router();

plannerRouter.use(authMiddleware as never);
plannerRouter.use(notesLimiter);

// GET    /api/v1/planner           → semana completa agrupada por dia (0–6)
// POST   /api/v1/planner           → adicionar nota a um dia
// PATCH  /api/v1/planner/:id       → marcar como concluído / mover de dia
// DELETE /api/v1/planner/:id       → remover card do planner

plannerRouter.get('/', handleGetPlannerWeek as never);
plannerRouter.post('/', handleCreatePlannerCard as never);
plannerRouter.patch('/:id', handleUpdatePlannerCard as never);
plannerRouter.delete('/:id', handleDeletePlannerCard as never);
