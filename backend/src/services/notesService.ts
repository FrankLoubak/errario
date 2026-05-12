import { z } from 'zod';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200).trim(),
  body: z.string().min(1, 'Conteúdo é obrigatório').max(10000).trim(),
  subject: z.string().max(100).trim().default(''),
  tags: z.array(z.string().max(50).trim()).max(10).default([]),
  favorite: z.boolean().default(false),
  localId: z.string().uuid().optional(),
  deviceId: z.string().max(100).optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  body: z.string().min(1).max(10000).trim().optional(),
  subject: z.string().max(100).trim().optional(),
  tags: z.array(z.string().max(50).trim()).max(10).optional(),
  favorite: z.boolean().optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
});

export const listNotesSchema = z.object({
  status: z.enum(['active', 'archived']).default('active'),
  subject: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  limit: z.string().default('50').transform(Number).pipe(z.number().min(1).max(100)),
  offset: z.string().default('0').transform(Number).pipe(z.number().min(0)),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type ListNotesInput = z.infer<typeof listNotesSchema>;

// ─────────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────────

const CACHE_TTL = 60; // segundos

function cacheKey(userId: string, suffix: string): string {
  return `notes:${userId}:${suffix}`;
}

async function invalidateUserCache(userId: string): Promise<void> {
  const keys = await redis.keys(`notes:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

export async function listNotes(
  userId: string,
  input: ListNotesInput
) {
  const key = cacheKey(userId, `list:${JSON.stringify(input)}`);
  const cached = await redis.get(key).catch(() => null);
  if (cached) return JSON.parse(cached) as { notes: unknown[]; total: number; hasMore: boolean };

  const whereSubject = input.subject ? { subject: input.subject } : {};
  const whereSearch = input.search
    ? {
        OR: [
          { title: { contains: input.search } },
          { body: { contains: input.search } },
          { subject: { contains: input.search } },
        ],
      }
    : {};

  const where = {
    userId,
    status: input.status,
    ...whereSubject,
    ...whereSearch,
  };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: input.limit,
      skip: input.offset,
      select: {
        id: true,
        localId: true,
        title: true,
        body: true,
        subject: true,
        tags: true,
        favorite: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.note.count({ where }),
  ]);

  const result = {
    notes,
    total,
    hasMore: input.offset + input.limit < total,
  };

  await redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL).catch(() => null);
  return result;
}

export async function getNoteById(userId: string, noteId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId, status: { not: 'deleted' } },
    include: { reviews: true },
  });

  if (!note) throw new AppError(404, 'Nota não encontrada');
  return note;
}

export async function createNote(userId: string, input: CreateNoteInput) {
  // Usuários Pro não têm limite — Free não usa esta API (usa SQLite local)
  const note = await prisma.note.create({
    data: {
      userId,
      localId: input.localId,
      deviceId: input.deviceId,
      title: input.title,
      body: input.body,
      subject: input.subject,
      tags: input.tags,
      favorite: input.favorite,
      status: 'active',
    },
  });

  logger.info('Nota criada', { userId, noteId: note.id });
  await invalidateUserCache(userId);
  return note;
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: UpdateNoteInput
) {
  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId, status: { not: 'deleted' } },
  });

  if (!existing) throw new AppError(404, 'Nota não encontrada');

  const note = await prisma.note.update({
    where: { id: noteId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.body !== undefined && { body: input.body }),
      ...(input.subject !== undefined && { subject: input.subject }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.favorite !== undefined && { favorite: input.favorite }),
      ...(input.status !== undefined && { status: input.status }),
    },
  });

  await invalidateUserCache(userId);
  return note;
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!existing) throw new AppError(404, 'Nota não encontrada');

  // Soft delete — mantém o registro para auditoria e possível recovery
  await prisma.note.update({
    where: { id: noteId },
    data: { status: 'deleted' },
  });

  await invalidateUserCache(userId);
}

// ─────────────────────────────────────────────
// Analytics — dados para o pizza chart
// ─────────────────────────────────────────────

export async function getNoteAnalytics(userId: string) {
  const key = cacheKey(userId, 'analytics');
  const cached = await redis.get(key).catch(() => null);
  if (cached) return JSON.parse(cached) as unknown;

  const [bySubject, total, totalFavorites] = await Promise.all([
    prisma.note.groupBy({
      by: ['subject'],
      where: { userId, status: 'active' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.note.count({ where: { userId, status: 'active' } }),
    prisma.note.count({ where: { userId, status: 'active', favorite: true } }),
  ]);

  const result = {
    total,
    totalFavorites,
    bySubject: bySubject.map((s) => ({
      subject: s.subject || 'Sem matéria',
      count: s._count.id,
      percentage: total > 0 ? Math.round((s._count.id / total) * 100) : 0,
    })),
  };

  await redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL * 5).catch(() => null);
  return result;
}
