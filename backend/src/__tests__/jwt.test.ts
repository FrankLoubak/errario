import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt';

jest.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test_jwt_secret_minimo_32_caracteres_aqui',
    JWT_REFRESH_SECRET: 'test_refresh_secret_minimo_32_caracteres_aqui',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d',
  },
}));

const samplePayload = {
  sub: 'user_001',
  email: 'frank@errario.app',
  tier: 'FREE' as const,
  storageMode: 'LOCAL' as const,
};

describe('generateAccessToken + verifyAccessToken', () => {
  it('gera um token válido que pode ser verificado', () => {
    const token = generateAccessToken(samplePayload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT = header.payload.signature

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(samplePayload.sub);
    expect(decoded.email).toBe(samplePayload.email);
    expect(decoded.tier).toBe('FREE');
    expect(decoded.storageMode).toBe('LOCAL');
  });

  it('lança erro ao verificar com secret errado', () => {
    const token = generateAccessToken(samplePayload);

    // Força um verify com secret diferente (simula adulteração)
    const jwt = require('jsonwebtoken');
    expect(() =>
      jwt.verify(token, 'secret_errado')
    ).toThrow();
  });

  it('lança erro ao verificar token expirado', () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(samplePayload, 'test_jwt_secret_minimo_32_caracteres_aqui', {
      expiresIn: '-1s',
    });

    expect(() => verifyAccessToken(expiredToken)).toThrow();
  });
});

describe('generateRefreshToken + verifyRefreshToken', () => {
  it('gera um refresh token com type=refresh', () => {
    const token = generateRefreshToken('user_001');
    const decoded = verifyRefreshToken(token);

    expect(decoded.sub).toBe('user_001');
    expect(decoded.type).toBe('refresh');
  });

  it('access token e refresh token são independentes (secrets diferentes)', () => {
    const accessToken = generateAccessToken(samplePayload);
    const refreshToken = generateRefreshToken('user_001');

    // Refresh secret não valida access token e vice-versa
    expect(() => verifyRefreshToken(accessToken)).toThrow();
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });
});
