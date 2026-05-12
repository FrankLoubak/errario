import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';
import {
  getPlannerWeek,
  createPlannerCard,
  updatePlannerCard,
  deletePlannerCard,
  createPlannerCardSchema,
  updatePlannerCardSchema,
} from '../services/plannerService';

export async function handleGetPlannerWeek(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getPlannerWeek(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function handleCreatePlannerCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = createPlannerCardSchema.parse(req.body);
    const card = await createPlannerCard(req.user.id, input);
    res.status(201).json({ success: true, data: { card } });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdatePlannerCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = updatePlannerCardSchema.parse(req.body);
    const card = await updatePlannerCard(req.user.id, req.params.id, input);
    res.json({ success: true, data: { card } });
  } catch (error) {
    next(error);
  }
}

export async function handleDeletePlannerCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deletePlannerCard(req.user.id, req.params.id);
    res.json({ success: true, message: 'Card removido' });
  } catch (error) {
    next(error);
  }
}
