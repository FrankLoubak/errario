import jwt from 'jsonwebtoken';
import axios from 'axios';
import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────
// Schemas de entrada
// ─────────────────────────────────────────────

export const validateAppleIAPSchema = z.object({
  transactionId: z.string().min(1, 'transactionId é obrigatório'),
  productId: z.string().min(1, 'productId é obrigatório'),
});

export const validateGoogleIAPSchema = z.object({
  purchaseToken: z.string().min(1, 'purchaseToken é obrigatório'),
  subscriptionId: z.string().min(1, 'subscriptionId é obrigatório'),
});

export type ValidateAppleInput = z.infer<typeof validateAppleIAPSchema>;
export type ValidateGoogleInput = z.infer<typeof validateGoogleIAPSchema>;

// Product IDs que conferem tier PRO
const PRO_PRODUCT_IDS = new Set([
  'com.errario.app.pro.monthly',
  'com.errario.app.pro.yearly',
]);

// ─────────────────────────────────────────────
// Apple StoreKit 2 — App Store Server API
// ─────────────────────────────────────────────

function buildAppleJWT(): string {
  if (!env.APPLE_KEY_ID || !env.APPLE_ISSUER_ID || !env.APPLE_PRIVATE_KEY) {
    throw new AppError(503, 'Credenciais Apple IAP não configuradas');
  }

  // JWT assinado com ES256 usando a chave privada .p8
  return jwt.sign({}, env.APPLE_PRIVATE_KEY, {
    algorithm: 'ES256',
    keyid: env.APPLE_KEY_ID,
    issuer: env.APPLE_ISSUER_ID,
    audience: 'appstoreconnect-v1',
    expiresIn: '10m',
  });
}

interface AppleTransactionPayload {
  bundleId: string;
  productId: string;
  purchaseDate: number;
  expiresDate?: number;
  transactionId: string;
  originalTransactionId: string;
  inAppOwnershipType: string;
}

async function fetchAppleTransaction(transactionId: string): Promise<AppleTransactionPayload> {
  const token = buildAppleJWT();

  // Em produção usa api.storekit.itunes.apple.com; sandbox usa api.storekit-sandbox.itunes.apple.com
  const baseUrl = env.NODE_ENV === 'production'
    ? 'https://api.storekit.itunes.apple.com'
    : 'https://api.storekit-sandbox.itunes.apple.com';

  const res = await axios.get<{ signedTransactionInfo: string }>(
    `${baseUrl}/inApps/v1/transactions/${transactionId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // signedTransactionInfo é um JWS — decodifica o payload sem verificar (Apple já assinou)
  const parts = res.data.signedTransactionInfo.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as AppleTransactionPayload;
  return payload;
}

export async function validateAppleIAP(userId: string, input: ValidateAppleInput): Promise<void> {
  let txPayload: AppleTransactionPayload;

  try {
    txPayload = await fetchAppleTransaction(input.transactionId);
  } catch (err) {
    logger.error('Falha ao validar IAP Apple', { userId, err });
    throw new AppError(400, 'Não foi possível validar a compra com a Apple');
  }

  // Verificações de segurança
  if (txPayload.bundleId !== env.APPLE_BUNDLE_ID) {
    throw new AppError(400, 'Bundle ID inválido');
  }

  if (!PRO_PRODUCT_IDS.has(txPayload.productId)) {
    throw new AppError(400, 'Produto inválido');
  }

  const isExpired = txPayload.expiresDate ? txPayload.expiresDate < Date.now() : false;
  if (isExpired) {
    throw new AppError(400, 'Assinatura expirada');
  }

  // Atualiza o usuário para PRO
  await prisma.user.update({
    where: { id: userId },
    data: {
      tier: 'PRO',
      storageMode: 'CLOUD',
      iapAppleToken: input.transactionId,
      upgradedToCloudAt: new Date(),
    },
  });

  logger.info('Upgrade PRO via Apple IAP', { userId, productId: txPayload.productId });
}

// ─────────────────────────────────────────────
// Google Play Billing — Play Developer API
// ─────────────────────────────────────────────

interface GoogleServiceAccountKey {
  client_email: string;
  private_key: string;
}

async function getGoogleAccessToken(): Promise<string> {
  if (!env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY) {
    throw new AppError(503, 'Credenciais Google Play não configuradas');
  }

  const sa = JSON.parse(env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY) as GoogleServiceAccountKey;

  // JWT para Google OAuth2 (RS256)
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const assertion = jwt.sign(claim, sa.private_key, { algorithm: 'RS256' });

  const res = await axios.post<{ access_token: string }>(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    })
  );

  return res.data.access_token;
}

interface GoogleSubscriptionPurchase {
  kind: string;
  paymentState?: number; // 1 = received, 2 = free trial
  expiryTimeMillis?: string;
  cancelReason?: number;
}

export async function validateGoogleIAP(userId: string, input: ValidateGoogleInput): Promise<void> {
  let purchase: GoogleSubscriptionPurchase;

  try {
    const accessToken = await getGoogleAccessToken();
    const pkg = env.GOOGLE_PLAY_PACKAGE_NAME;
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptions/${input.subscriptionId}/tokens/${input.purchaseToken}`;

    const res = await axios.get<GoogleSubscriptionPurchase>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    purchase = res.data;
  } catch (err) {
    logger.error('Falha ao validar IAP Google', { userId, err });
    throw new AppError(400, 'Não foi possível validar a compra com o Google');
  }

  if (!PRO_PRODUCT_IDS.has(input.subscriptionId)) {
    throw new AppError(400, 'Produto inválido');
  }

  // paymentState: 1 = pago, 2 = trial gratuito
  if (purchase.paymentState !== 1 && purchase.paymentState !== 2) {
    throw new AppError(400, 'Pagamento não confirmado');
  }

  if (purchase.expiryTimeMillis && parseInt(purchase.expiryTimeMillis) < Date.now()) {
    throw new AppError(400, 'Assinatura expirada');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      tier: 'PRO',
      storageMode: 'CLOUD',
      iapGoogleToken: input.purchaseToken,
      upgradedToCloudAt: new Date(),
    },
  });

  logger.info('Upgrade PRO via Google IAP', { userId, subscriptionId: input.subscriptionId });
}

// ─────────────────────────────────────────────
// Apple App Store Server Notifications (webhooks)
// ─────────────────────────────────────────────

interface AppleNotificationPayload {
  notificationType: string;
  subtype?: string;
  data?: {
    signedTransactionInfo?: string;
  };
}

export async function handleAppleNotification(rawBody: string): Promise<void> {
  // O body é um JWS assinado pela Apple
  const parts = rawBody.split('.');
  if (parts.length !== 3) {
    logger.warn('Apple notification: formato inválido');
    return;
  }

  const payload = JSON.parse(
    Buffer.from(parts[1], 'base64url').toString()
  ) as AppleNotificationPayload;

  logger.info('Apple ASSN notification', { type: payload.notificationType, subtype: payload.subtype });

  // Trata revogação/expiração
  if (
    payload.notificationType === 'EXPIRED' ||
    payload.notificationType === 'REVOKE' ||
    (payload.notificationType === 'DID_FAIL_TO_RENEW' && payload.subtype !== 'GRACE_PERIOD')
  ) {
    if (!payload.data?.signedTransactionInfo) return;

    const txParts = payload.data.signedTransactionInfo.split('.');
    const tx = JSON.parse(Buffer.from(txParts[1], 'base64url').toString()) as { originalTransactionId: string };

    await prisma.user.updateMany({
      where: { iapAppleToken: tx.originalTransactionId },
      data: { tier: 'FREE', storageMode: 'LOCAL' },
    });

    logger.info('Downgrade FREE via Apple ASSN', { originalTransactionId: tx.originalTransactionId });
  }
}

// ─────────────────────────────────────────────
// Google Play Developer Notifications (Pub/Sub)
// ─────────────────────────────────────────────

interface GooglePubSubMessage {
  message: { data: string };
}

interface GoogleRTDN {
  subscriptionNotification?: {
    notificationType: number; // 3 = canceled, 13 = expired
    purchaseToken: string;
    subscriptionId: string;
  };
}

export async function handleGoogleNotification(body: GooglePubSubMessage): Promise<void> {
  const data = JSON.parse(Buffer.from(body.message.data, 'base64').toString()) as GoogleRTDN;

  if (!data.subscriptionNotification) return;

  const { notificationType, purchaseToken } = data.subscriptionNotification;

  logger.info('Google Play RTDN', { notificationType, purchaseToken: purchaseToken.slice(0, 20) });

  // 3 = SUBSCRIPTION_CANCELED, 13 = SUBSCRIPTION_EXPIRED
  if (notificationType === 3 || notificationType === 13) {
    await prisma.user.updateMany({
      where: { iapGoogleToken: purchaseToken },
      data: { tier: 'FREE', storageMode: 'LOCAL' },
    });

    logger.info('Downgrade FREE via Google RTDN', { notificationType });
  }
}

// ─────────────────────────────────────────────
// Sessão de assinatura atual do usuário
// ─────────────────────────────────────────────

export async function getBillingSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, storageMode: true, credits: true, upgradedToCloudAt: true },
  });

  return {
    tier: user?.tier ?? 'FREE',
    storageMode: user?.storageMode ?? 'LOCAL',
    credits: user?.credits ?? 0,
    upgradedAt: user?.upgradedToCloudAt ?? null,
    isPro: user?.tier === 'PRO' || user?.tier === 'ENTERPRISE',
  };
}
