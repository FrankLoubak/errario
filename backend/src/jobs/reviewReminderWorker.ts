import { prisma } from '../config/database';
import { sendReviewReminder } from '../services/pushService';
import { logger } from '../utils/logger';
import { reviewReminderQueue } from './queues';

// Processa lembretes de revisão vencidos.
// Agendado diariamente pelo scheduler.
reviewReminderQueue.process(async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Busca ReviewDates vencidas e não concluídas
  const dueReviews = await prisma.reviewDate.findMany({
    where: {
      done: false,
      dueDate: { lt: tomorrow },
    },
    include: {
      note: {
        select: { id: true, title: true, userId: true, status: true },
      },
    },
    take: 500,
  });

  // Filtra notas ativas e agrupa por usuário para evitar spam
  const byUser = new Map<string, typeof dueReviews>();
  for (const review of dueReviews) {
    if (review.note.status !== 'active') continue;

    const userId = review.note.userId;
    if (!byUser.has(userId)) byUser.set(userId, []);
    byUser.get(userId)!.push(review);
  }

  let sent = 0;
  for (const [userId, reviews] of byUser.entries()) {
    // Máximo 1 push por usuário por dia, mesmo com múltiplas revisões
    const first = reviews[0];
    const title = reviews.length > 1
      ? `${reviews.length} revisões agendadas! 📒`
      : 'Hora de revisar! 📒';
    const body = reviews.length > 1
      ? `"${first.note.title}" e mais ${reviews.length - 1} nota${reviews.length - 1 > 1 ? 's' : ''}`
      : `"${first.note.title}"`;

    await sendReviewReminder(userId, body, first.note.id).catch((err) =>
      logger.warn('Push reminder falhou', { userId, err })
    );
    sent++;
  }

  logger.info('Review reminders enviados', { total: dueReviews.length, usersNotified: sent });
});

reviewReminderQueue.on('failed', (job, err) => {
  logger.error('Review reminder job failed', { jobId: job.id, err });
});
