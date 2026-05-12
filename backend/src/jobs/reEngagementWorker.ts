import { prisma } from '../config/database';
import { sendReEngagementPush } from '../services/pushService';
import { logger } from '../utils/logger';
import { reEngagementQueue } from './queues';

// Detecta usuários silenciosos (sem novas notas há N dias) e envia push de re-engajamento.
// Agendado semanalmente pelo scheduler.
reEngagementQueue.process(async () => {
  const DAYS_SILENT = 7;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - DAYS_SILENT);

  // Usuários que não criaram nenhuma nota nos últimos 7 dias
  // mas têm pelo menos uma nota (usuário ativo, não novo)
  const silentUsers = await prisma.user.findMany({
    where: {
      notes: {
        // Tem pelo menos 1 nota no total
        some: {},
        // Mas nenhuma criada nos últimos 7 dias
        none: { createdAt: { gte: threshold } },
      },
    },
    select: { id: true },
    take: 200,
  });

  let sent = 0;
  for (const user of silentUsers) {
    await sendReEngagementPush(user.id, DAYS_SILENT).catch((err) =>
      logger.warn('Re-engagement push falhou', { userId: user.id, err })
    );
    sent++;
  }

  logger.info('Re-engagement pushes enviados', { sent, threshold });
});

reEngagementQueue.on('failed', (job, err) => {
  logger.error('Re-engagement job failed', { jobId: job.id, err });
});
