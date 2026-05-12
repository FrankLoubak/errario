import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import type { User, AuthTokens } from '../types/user';

// CRÍTICO: tokens armazenados em SecureStore (iOS Keychain / Android Keystore)
// NUNCA usar AsyncStorage — não é criptografado
const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<{ isNew: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Inicialização: verifica se há tokens salvos no SecureStore
  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
      if (!accessToken) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Token existe — busca dados atualizados do usuário
      const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
      set({
        user: response.data.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Token expirado ou inválido — limpa o storage
      await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
      await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
      set({ isLoading: false, isAuthenticated: false, user: null });
    }
  },

  login: async (email, password) => {
    const response = await api.post<{
      success: boolean;
      data: { user: User; accessToken: string; refreshToken: string };
    }>('/auth/login', { email, password });

    const { user, accessToken, refreshToken } = response.data.data;

    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, refreshToken);

    set({ user, isAuthenticated: true });
  },

  register: async (email, password, name) => {
    const response = await api.post<{
      success: boolean;
      data: { user: User; accessToken: string; refreshToken: string };
    }>('/auth/register', { email, password, name });

    const { user, accessToken, refreshToken } = response.data.data;

    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, refreshToken);

    set({ user, isAuthenticated: true });
  },

  loginWithGoogle: async (code) => {
    const response = await api.post<{
      success: boolean;
      data: { user: User; accessToken: string; refreshToken: string; isNew: boolean };
    }>('/auth/google/mobile', { code });

    const { user, accessToken, refreshToken, isNew } = response.data.data;

    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, refreshToken);

    set({ user, isAuthenticated: true });
    return { isNew };
  },

  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {
          // Falha silenciosa — tokens locais serão removidos de qualquer forma
        });
      }
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
      await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
      set({ user: null, isAuthenticated: false });
    }
  },

  refreshUser: async () => {
    const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    set({ user: response.data.data.user });
  },

  setUser: (user) => set({ user }),
}));
