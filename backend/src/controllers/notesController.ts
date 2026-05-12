import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';
import {
  createNote,
  updateNote,
  deleteNote,
  getNoteById,
  listNotes,
  getNoteAnalytics,
  createNoteSchema,
  updateNoteSchema,
  listNotesSchema,
} from '../services/notesService';

export async function handleListNotes(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = listNotesSchema.parse(req.query);
    const result = await listNotes(req.user.id, input);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleGetNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const note = await getNoteById(req.user.id, req.params.id);
    res.json({ success: true, data: { note } });
  } catch (error) {
    next(error);
  }
}

export async function handleCreateNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = createNoteSchema.parse(req.body);
    const note = await createNote(req.user.id, input);
    res.status(201).json({ success: true, data: { note } });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = updateNoteSchema.parse(req.body);
    const note = await updateNote(req.user.id, req.params.id, input);
    res.json({ success: true, data: { note } });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteNote(req.user.id, req.params.id);
    res.json({ success: true, message: 'Nota removida' });
  } catch (error) {
    next(error);
  }
}

export async function handleGetAnalytics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const analytics = await getNoteAnalytics(req.user.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
}
