import bcrypt from 'bcryptjs';
import { register, login, refreshTokens, logout } from '../services/authService';
import * as jwtUtils from '../utils/jwt';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../utils/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock_access_token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../config/env', () => ({
  env: {
    BCRYPT_ROUNDS: 10,
    JWT_SECRET: 'test_secret',
    JWT_REFRESH_SECRET: 'test_refresh_secret',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d',
    NODE_ENV: 'test',
  },
}));

// ─── Import após mocks ─────────────────────────────────────────────────────────
import { prisma } from '../config/database';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeUser = {
  id: 'user_cuid_001',
  email: 'teste@errario.app',
  name: 'Teste User',
  passwordHash: 'hashed_password',
  tier: 'FREE' as const,
  storageMode: 'LOCAL' as const,
  googleId: null,
};

const fakeSession = {
  id: 'session_cuid_001',
  userId: fakeUser.id,
  refreshToken: 'mock_refresh_token',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  revokedAt: null,
  user: fakeUser,
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────

describe('register()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.user.create as jest.Mock).mockResolvedValue(fakeUser);
    (mockPrisma.session.create as jest.Mock).mockResolvedValue(fakeSession);
  });

  it('cria o usuário e retorna tokens quando email é novo', async () => {
    const result = await register({
      email: 'novo@errario.app',
      password: 'senha1234',
      name: 'Novo User',
    });

    expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.session.create).toHaveBeenCalledTimes(1);
    expect(result.tokens.accessToken).toBe('mock_access_token');
    expect(result.tokens.refreshToken).toBe('mock_refresh_token');
  });

  it('faz hash da senha antes de salvar — nunca salva texto puro', async () => {
    await register({
      email: 'novo@errario.app',
      password: 'senha1234',
      name: 'Novo User',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('senha1234', 10);
    const createCall = (mockPrisma.user.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.passwordHash).toBe('hashed_password');
    expect(createCall.data.password).toBeUndefined();
  });

  it('lança 409 se o email já existe', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(fakeUser);

    await expect(
      register({ email: fakeUser.email, password: 'senha1234', name: 'X' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('retorna o id e email do usuário criado', async () => {
    const result = await register({
      email: 'novo@errario.app',
      password: 'senha1234',
      name: 'Frank',
    });

    expect(result.user.id).toBe(fakeUser.id);
    expect(result.user.email).toBe(fakeUser.email);
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

describe('login()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(fakeUser);
    (mockPrisma.user.update as jest.Mock).mockResolvedValue(fakeUser);
    (mockPrisma.session.create as jest.Mock).mockResolvedValue(fakeSession);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('retorna tokens quando email e senha estão corretos', async () => {
    const result = await login({
      email: fakeUser.email,
      password: 'senha1234',
    });

    expect(result.tokens.accessToken).toBe('mock_access_token');
    expect(result.tokens.refreshToken).toBe('mock_refresh_token');
  });

  it('retorna dados do usuário no login', async () => {
    const result = await login({ email: fakeUser.email, password: 'senha1234' });

    expect(result.user.email).toBe(fakeUser.email);
    expect(result.user.tier).toBe('FREE');
    expect(result.user.storageMode).toBe('LOCAL');
  });

  it('lança 401 com mesma mensagem para email inexistente e senha incorreta (previne user enumeration)', async () => {
    // Caso 1: email não encontrado
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(
      login({ email: 'inexistente@errario.app', password: 'qualquer' })
    ).rejects.toMatchObject({ statusCode: 401, message: 'Email ou senha incorretos' });

    // Caso 2: senha incorreta (mesmo usuário real)
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(fakeUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(
      login({ email: fakeUser.email, password: 'senha_errada' })
    ).rejects.toMatchObject({ statusCode: 401, message: 'Email ou senha incorretos' });
  });

  it('lança 401 quando usuário não tem passwordHash (cadastro via OAuth)', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...fakeUser,
      passwordHash: null,
    });

    await expect(
      login({ email: fakeUser.email, password: 'senha1234' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('atualiza lastLoginAt após login bem-sucedido', async () => {
    await login({ email: fakeUser.email, password: 'senha1234' });

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: fakeUser.id },
        data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      })
    );
  });

  it('cria sessão (refresh token) no banco após login', async () => {
    await login({ email: fakeUser.email, password: 'senha1234' });

    expect(mockPrisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: fakeUser.id,
          refreshToken: 'mock_refresh_token',
        }),
      })
    );
  });
});

// ─── REFRESH TOKENS ───────────────────────────────────────────────────────────

describe('refreshTokens()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({
      sub: fakeUser.id,
      type: 'refresh',
    });
    (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue(fakeSession);
    (mockPrisma.session.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.session.create as jest.Mock).mockResolvedValue(fakeSession);
  });

  it('retorna novos tokens quando refresh token é válido', async () => {
    const result = await refreshTokens('valid_refresh_token');

    expect(result.accessToken).toBe('mock_access_token');
    expect(result.refreshToken).toBe('mock_refresh_token');
  });

  it('rotaciona o refresh token — revoga o antigo e cria um novo', async () => {
    await refreshTokens('valid_refresh_token');

    expect(mockPrisma.session.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      })
    );
    expect(mockPrisma.session.create).toHaveBeenCalledTimes(1);
  });

  it('lança 401 se o token JWT é inválido', async () => {
    (jwtUtils.verifyRefreshToken as jest.Mock).mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(refreshTokens('token_invalido')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('lança 401 se a sessão não existe no banco', async () => {
    (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(refreshTokens('valid_refresh_token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('lança 401 se a sessão foi revogada', async () => {
    (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
      ...fakeSession,
      revokedAt: new Date(),
    });

    await expect(refreshTokens('valid_refresh_token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('lança 401 se a sessão está expirada', async () => {
    (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue({
      ...fakeSession,
      expiresAt: new Date(Date.now() - 1000), // 1 segundo atrás
    });

    await expect(refreshTokens('valid_refresh_token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('lança 401 se userId da sessão não bate com o sub do JWT (token substituído)', async () => {
    (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({
      sub: 'outro_user_id',
      type: 'refresh',
    });

    await expect(refreshTokens('valid_refresh_token')).rejects.toMatchObject({ statusCode: 401 });
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

describe('logout()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
  });

  it('revoga a sessão no banco pelo refresh token', async () => {
    await logout('mock_refresh_token');

    expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
      where: { refreshToken: 'mock_refresh_token', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('não lança erro se o refresh token não existe (idempotente)', async () => {
    (mockPrisma.session.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    await expect(logout('token_inexistente')).resolves.toBeUndefined();
  });
});

// ─── VALIDAÇÃO DE ENTRADA ─────────────────────────────────────────────────────

describe('registerSchema validação', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerSchema } = require('../services/authService');

  it('aceita email, password e name válidos', () => {
    const result = registerSchema.safeParse({
      email: 'frank@errario.app',
      password: 'minimo8chars',
      name: 'Frank Loubak',
    });
    expect(result.success).toBe(true);
  });

  it('normaliza o email para lowercase', () => {
    const result = registerSchema.safeParse({
      email: 'FRANK@ERRARIO.APP',
      password: 'minimo8chars',
      name: 'Frank',
    });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('frank@errario.app');
  });

  it('rejeita email inválido', () => {
    const result = registerSchema.safeParse({
      email: 'nao-e-email',
      password: 'minimo8chars',
      name: 'Frank',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = registerSchema.safeParse({
      email: 'frank@errario.app',
      password: '1234567',
      name: 'Frank',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita nome vazio', () => {
    const result = registerSchema.safeParse({
      email: 'frank@errario.app',
      password: 'minimo8chars',
      name: '',
    });
    expect(result.success).toBe(false);
  });
});
