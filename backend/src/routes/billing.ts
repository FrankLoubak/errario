import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { billingLimiter } from '../middleware/rateLimiter';

export const billingRouter = Router();

billingRouter.use(authMiddleware as never);
billingRouter.use(billingLimiter);

// Sprint 4-5: endpoints de IAP (In-App Purchase)
// POST /api/v1/billing/validate-iap/apple   → valida compra iOS
// POST /api/v1/billing/validate-iap/google  → valida compra Android
// POST /api/v1/billing/apple/notifications  → webhook Apple ASSN
// POST /api/v1/billing/google/notifications → webhook Google Pub/Sub
// GET  /api/v1/billing/session              → dados de assinatura atual
// POST /api/v1/migrations/from-local        → migração SQLite → Cloud

billingRouter.get('/session', (_req, res) => {
  res.json({ success: true, data: { tier: 'FREE', credits: 0 } });
});
