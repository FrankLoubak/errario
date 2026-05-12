import axios from 'axios';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Expo Push API — abstrai FCM (Android) e APNs (iOS) automaticamente.
// Não requer configuração de Firebase ou certificados APNs no backend;
// o Expo gerencia a entrega usando os serviços nativos das plataformas.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface PushMessage {
  to: string;          // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  categoryId?: string; // para action buttons iOS
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

// ─────────────────────────────────────────────
// Envio em lote (máx 100 por request — limite Expo)
// ─────────────────────────────────────────────

async function sendBatch(messages: PushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  const res = await axios.post<{ data: ExpoPushTicket[] }>(
    EXPO_PUSH_URL,
    messages,
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  );

  return res.data.data;
}

export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (tokens.length === 0) return;

  const BATCH_SIZE = 100;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    const messages: PushMessage[] = batch.map((to) => ({
      to,
      title,
      body,
      data,
      sound: 'default',
    }));

    const tickets = await sendBatch(messages);

    const errors = tickets.filter((t) => t.status === 'error');
    if (errors.length > 0) {
      logger.warn('Push tickets com erro', { count: errors.length, sample: errors[0] });
    }
  }
}

// ─────────────────────────────────────────────
// Helpers de alto nível
// ─────────────────────────────────────────────

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const devices = await prisma.userDevice.findMany({
    where: { userId },
    select: { token: true },
  });

  const tokens = devices.map((d) => d.token);
  await sendPushToTokens(tokens, title, body, data);
}

export async function sendReviewReminder(
  userId: string,
  noteTitle: string,
  noteId: string
): Promise<void> {
  await sendPushToUser(
    userId,
    'Hora de revisar! 📒',
    `Você agendou uma revisão de "${noteTitle}"`,
    { screen: 'notes', noteId }
  );
}

export async function sendReEngagementPush(userId: string, daysSilent: number): Promise<void> {
  await sendPushToUser(
    userId,
    `${daysSilent} dias sem registrar um erro 🤔`,
    'Errar faz parte — registre agora e transforme em aprendizado.',
    { screen: 'notes' }
  );
}

export async function sendSubscriptionExpiryWarning(
  userId: string,
  daysLeft: number
): Promise<void> {
  await sendPushToUser(
    userId,
    `Sua assinatura Pro expira em ${daysLeft} dia${daysLeft > 1 ? 's' : ''} ⚠️`,
    'Renove para continuar com acesso à nuvem e planner.',
    { screen: 'upgrade' }
  );
}
