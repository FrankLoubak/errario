export type Tier = 'FREE' | 'PRO' | 'ENTERPRISE';
export type StorageMode = 'LOCAL' | 'CLOUD';

export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  tier: Tier;
  storageMode: StorageMode;
  credits: number;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
