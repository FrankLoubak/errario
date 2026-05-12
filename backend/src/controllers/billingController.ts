import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';
import {
  validateAppleIAP,
  validateGoogleIAP,
  handleAppleNotification,
  handleGoogleNotification,
  getBillingSession,
  validateAppleIAPSchema,
  validateGoogleIAPSchema,
} from '../services/billingService';
import { logger } from '../utils/logger';

export async function handleValidateApple(
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const input = validateAppleIAPSchema.parse(req.body);
    await validateAppleIAP(req.user.id, input);
    res.json({ success: true, message: 'Assinatura Pro ativada' });
  } catch (error) {
    next(error);
  }
}

export async function handleValidateGoogle(
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const input = validateGoogleIAPSchema.parse(req.body);
    await validateGoogleIAP(req.user.id, input);
    res.json({ success: true, message: 'Assinatura Pro ativada' });
  } catch (error) {
    next(error);
  }
}

export async function handleGetBillingSession(
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const session = await getBillingSession(req.user.id);
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
}

// Webhook Apple — sem autenticação JWT (Apple assina o body)
export async function handleAppleWebhook(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    // Recebe o JWS diretamente no body (Content-Type: text/plain ou application/json)
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    await handleAppleNotification(rawBody);
    res.status(200).send('OK');
  } catch (err) {
    logger.error('Erro no webhook Apple', { err });
    // Retorna 200 mesmo em caso de erro interno — Apple não deve retentar por falha nossa
    res.status(200).send('OK');
  }
}

// Webhook Google Pub/Sub — sem autenticação JWT
export async function handleGoogleWebhook(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    await handleGoogleNotification(req.body as { message: { data: string } });
    res.status(200).send('OK');
  } catch (err) {
    logger.error('Erro no webhook Google', { err });
    res.status(200).send('OK');
  }
}
