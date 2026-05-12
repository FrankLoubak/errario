import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────
// Schema — payload enviado pelo app ao migrar
// ─────────────────────────────────────────────

const notePayloadSchema = z.object({
  localId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  subject: z.string().max(100).default(''),
  tags: z.array(z.string().max(50)).max(10).default([]),
  favorite: z.boolean().default(false),
  status: z.enum(['active', 'archived', 'deleted']).default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const migrationPayloadSchema = z.object({
  notes: z.array(notePayloadSchema).max(100, 'Máximo de 100 notas por migração'),
  deviceId: z.string().max(100).optional(),
});

export type MigrationPayload = z.infer<typeof migrationPayloadSchema>;

// ─────────────────────────────────────────────
// Serviço
// ─────────────────────────────────────────────

export interface MigrationResult {
  imported: number;
  skipped: number;   // notas já existentes (mesmo localId)
  failed: number;
}

export async function migrateLocalNotes(
  userId: string,
  payload: MigrationPayload
): Promise<MigrationResult> {
  // Apenas usuários PRO podem migrar para a cloud
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  if (!user || (user.tier !== 'PRO' && user.tier !== 'ENTERPRISE')) {
    throw new AppError(403, 'Migração disponível apenas para usuários Pro');
  }

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const note of payload.notes) {
    try {
      // localId único por usuário — evita duplicata ao migrar duas vezes
      const existing = await prisma.note.findFirst({
        where: { userId, localId: note.localId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.note.create({
        data: {
          userId,
          localId: note.localId,
          deviceId: payload.deviceId,
          migratedFromLocal: true,
          title: note.title,
          body: note.body,
          subject: note.subject,
          tags: note.tags,
          favorite: note.favorite,
          status: note.status,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        },
      });

      imported++;
    } catch (err) {
      logger.error('Falha ao migrar nota', { userId, localId: note.localId, err });
      failed++;
    }
  }

  logger.info('Migração concluída', { userId, imported, skipped, failed });
  return { imported, skipped, failed };
}
