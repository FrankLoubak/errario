import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { billingLimiter } from '../middleware/rateLimiter';
import {
  handleValidateApple,
  handleValidateGoogle,
  handleGetBillingSession,
  handleAppleWebhook,
  handleGoogleWebhook,
} from '../controllers/billingController';

export const billingRouter = Router();

// ── Webhooks das lojas (sem auth JWT — as lojas assinam o payload) ────────────
// POST /api/v1/billing/apple/notifications  → Apple App Store Server Notifications
// POST /api/v1/billing/google/notifications → Google Play RTDN (Pub/Sub)
billingRouter.post('/apple/notifications', handleAppleWebhook);
billingRouter.post('/google/notifications', handleGoogleWebhook);

// ── Rotas autenticadas ────────────────────────────────────────────────────────
billingRouter.use(authMiddleware as never);
billingRouter.use(billingLimiter);

// GET  /api/v1/billing/session             → tier, storageMode, credits, isPro
billingRouter.get('/session', handleGetBillingSession as never);

// POST /api/v1/billing/validate-iap/apple  → valida JWS transactionId (StoreKit 2)
billingRouter.post('/validate-iap/apple', handleValidateApple as never);

// POST /api/v1/billing/validate-iap/google → valida purchaseToken (Play Billing)
billingRouter.post('/validate-iap/google', handleValidateGoogle as never);
