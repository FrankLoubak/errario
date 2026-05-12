import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { api } from '../lib/api';
import { logger } from '../utils/logger';

// Configura o comportamento das notificações quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─────────────────────────────────────────────
// Solicita permissão e registra o Expo push token
// ─────────────────────────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // Simuladores não têm push tokens
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID,
  });

  const token = tokenData.data;
  const platform = Platform.OS as 'ios' | 'android';

  // Registra no backend (fire-and-forget — falha não bloqueia o app)
  api.post('/users/me/device', { token, platform }).catch((err) => {
    logger.warn('Falha ao registrar push token', { err });
  });

  return token;
}

// ─────────────────────────────────────────────
// Hook de escuta de notificações (deep link ao tocar)
// ─────────────────────────────────────────────

export function usePushNotificationListener() {
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Resposta ao toque na notificação — navega para a tela correta
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string>;

        if (data?.screen === 'notes' && data?.noteId) {
          router.push(`/(tabs)/notes`);
        } else if (data?.screen === 'upgrade') {
          router.push('/upgrade');
        } else if (data?.screen === 'notes') {
          router.push('/(tabs)/notes');
        }
      }
    );

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);
}
