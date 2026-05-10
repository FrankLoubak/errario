import { Router } from 'express';
import {
  handleRegister,
  handleLogin,
  handleRefresh,
  handleLogout,
  handleMe,
  handleGoogleMobileCallback,
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter';

export const authRouter = Router();

// Registro com email/senha
authRouter.post('/register', registerLimiter, handleRegister);

// Login com email/senha
authRouter.post('/login', loginLimiter, handleLogin);

// OAuth Google — mobile deep link (app envia o authorization code)
authRouter.post('/google/mobile', loginLimiter, handleGoogleMobileCallback);

// Renovação do access token via refresh token
authRouter.post('/refresh', handleRefresh);

// Logout (revoga o refresh token)
authRouter.post('/logout', handleLogout);

// Dados do usuário autenticado
authRouter.get('/me', authMiddleware as never, handleMe);
