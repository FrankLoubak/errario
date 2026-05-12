import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────

export const createPlannerCardSchema = z.object({
  noteId: z.string().uuid('ID de nota inválido'),
  assignedDay: z.number().int().min(0).max(6), // 0 = Segunda … 6 = Domingo
});

export const updatePlannerCardSchema = z.object({
  completed: z.boolean().optional(),
  assignedDay: z.number().int().min(0).max(6).optional(),
});

export type CreatePlannerCardInput = z.infer<typeof createPlannerCardSchema>;
export type UpdatePlannerCardInput = z.infer<typeof updatePlannerCardSchema>;

// ─────────────────────────────────────────────
// Serviço
// ─────────────────────────────────────────────

export async function getPlannerWeek(userId: string) {
  const cards = await prisma.plannerCard.findMany({
    where: { userId },
    include: {
      note: {
        select: { id: true, title: true, subject: true, tags: true, favorite: true },
      },
    },
    orderBy: { assignedDay: 'asc' },
  });

  // Agrupa por dia (0–6)
  const week: Record<number, typeof cards> = {};
  for (let day = 0; day <= 6; day++) {
    week[day] = cards.filter((c) => c.assignedDay === day);
  }

  return { week, total: cards.length };
}

export async function createPlannerCard(
  userId: string,
  input: CreatePlannerCardInput
) {
  // Verifica que a nota pertence ao usuário
  const note = await prisma.note.findFirst({
    where: { id: input.noteId, userId, status: { not: 'deleted' } },
  });
  if (!note) throw new AppError(404, 'Nota não encontrada');

  // Impede duplicata no mesmo dia
  const existing = await prisma.plannerCard.findFirst({
    where: { userId, noteId: input.noteId, assignedDay: input.assignedDay },
  });
  if (existing) throw new AppError(409, 'Nota já adicionada neste dia');

  return prisma.plannerCard.create({
    data: { userId, noteId: input.noteId, assignedDay: input.assignedDay },
    include: {
      note: { select: { id: true, title: true, subject: true, tags: true } },
    },
  });
}

export async function updatePlannerCard(
  userId: string,
  cardId: string,
  input: UpdatePlannerCardInput
) {
  const card = await prisma.plannerCard.findFirst({ where: { id: cardId, userId } });
  if (!card) throw new AppError(404, 'Card não encontrado');

  return prisma.plannerCard.update({
    where: { id: cardId },
    data: input,
  });
}

export async function deletePlannerCard(userId: string, cardId: string): Promise<void> {
  const card = await prisma.plannerCard.findFirst({ where: { id: cardId, userId } });
  if (!card) throw new AppError(404, 'Card não encontrado');
  await prisma.plannerCard.delete({ where: { id: cardId } });
}
