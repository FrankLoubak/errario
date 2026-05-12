import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'nativewind';
import * as Sentry from '@sentry/react-native';
import { useAuthStore } from '../store/authStore';
import { usePushNotificationListener } from '../hooks/usePushNotifications';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV ?? 'development',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000,   // 10 minutos
    },
  },
});

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const { setColorScheme } = useColorScheme();

  usePushNotificationListener();

  useEffect(() => {
    initialize();
    // App é dark-only por design — força dark independente da preferência do sistema
    setColorScheme('dark');
  }, [initialize, setColorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="upgrade" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
