import Bull from 'bull';
import { env } from '../config/env';

// Instâncias únicas das filas (singleton por nome)
// Todas compartilham a mesma conexão Redis

function createQueue<T = unknown>(name: string): Bull.Queue<T> {
  return new Bull<T>(name, env.REDIS_URL, {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60_000 }, // 1min, 2min, 4min
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });
}

export const reviewReminderQueue  = createQueue('review-reminders');
export const reEngagementQueue    = createQueue('re-engagement');
export const emailSequenceQueue   = createQueue<EmailSequenceJob>('email-sequences');
export const pushQueue            = createQueue<PushJob>('push-notifications');

// ─────────────────────────────────────────────
// Tipos dos jobs
// ─────────────────────────────────────────────

export interface EmailSequenceJob {
  userId: string;
  email: string;
  name: string;
  emailNumber: 1 | 2 | 3; // D0, D2, D7
}

export interface PushJob {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
