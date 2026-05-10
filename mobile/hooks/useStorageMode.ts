import { useAuthStore } from '../store/authStore';
import type { StorageMode } from '../types/user';

// Hook central que determina qual storage usar
// FREE = SQLite local (expo-sqlite)
// PRO = PostgreSQL via REST API (lib/api.ts) + SQLite como cache offline
export function useStorageMode(): StorageMode {
  const user = useAuthStore((state) => state.user);
  return user?.storageMode ?? 'LOCAL';
}

export function useIsCloud(): boolean {
  return useStorageMode() === 'CLOUD';
}

export function useIsLocal(): boolean {
  return useStorageMode() === 'LOCAL';
}
