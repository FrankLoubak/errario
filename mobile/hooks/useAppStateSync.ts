import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Usuários Pro têm dados no servidor — sincroniza ao voltar ao foreground.
// Usuários Free têm dados apenas no SQLite local — sem necessidade de sync.
// ADR: sem WebSocket/polling; sync acontece apenas em AppState 'active'.
export function useAppStateSync(onSync: () => Promise<void> | void) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const user = useAuthStore((state) => state.user);
  const isCloud = user?.storageMode === 'CLOUD';

  useEffect(() => {
    if (!isCloud) return;

    const subscription = AppState.addEventListener('change', async (nextState) => {
      const wasBackground =
        appState.current === 'background' || appState.current === 'inactive';
      const isNowActive = nextState === 'active';

      if (wasBackground && isNowActive) {
        await onSync();
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isCloud, onSync]);
}
