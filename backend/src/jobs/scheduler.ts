import { reviewReminderQueue, reEngagementQueue } from './queues';
import { logger } from '../utils/logger';

// Importa os workers para que sejam registrados (efeito colateral dos process())
import './reviewReminderWorker';
import './reEngagementWorker';
import './emailSequenceWorker';

// ─────────────────────────────────────────────
// Jobs recorrentes (cron-style via Bull repeat)
// ─────────────────────────────────────────────

export async function startScheduler(): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;

  try {
    // Lembretes de revisão — diariamente às 09h
    await reviewReminderQueue.add(
      {},
      { repeat: { cron: '0 9 * * *' }, jobId: 'review-reminders-daily' }
    );

    // Re-engajamento — toda segunda-feira às 10h
    await reEngagementQueue.add(
      {},
      { repeat: { cron: '0 10 * * 1' }, jobId: 're-engagement-weekly' }
    );

    logger.info('Scheduler iniciado — review reminders (diário 09h) + re-engagement (seg 10h)');
  } catch (err) {
    logger.error('Falha ao iniciar scheduler', { err });
  }
}
