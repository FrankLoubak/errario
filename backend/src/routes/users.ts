import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

export const usersRouter = Router();

usersRouter.use(authMiddleware as never);

// Sprint 3+: endpoints de perfil de usuário
// GET   /api/v1/users/me          → perfil (alias de /auth/me)
// PATCH /api/v1/users/me          → atualizar perfil
// POST  /api/v1/users/me/device   → registrar device token (push notifications)
// DELETE /api/v1/users/me         → excluir conta (LGPD/GDPR)

usersRouter.get('/me', (_req, res) => {
  res.json({ success: true, data: null });
});
