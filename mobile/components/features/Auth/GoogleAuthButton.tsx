import { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';

const GOOGLE_AUTH_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.errario.app/api/v1/auth/google'
  : 'http://localhost:3001/api/v1/auth/google';

WebBrowser.maybeCompleteAuthSession();

export function GoogleAuthButton() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleAuth() {
    setIsLoading(true);

    try {
      // Abre o navegador para o fluxo OAuth do Google
      // O backend redireciona de volta via deep link: errario://auth/callback?code=xxx
      const result = await WebBrowser.openAuthSessionAsync(
        GOOGLE_AUTH_URL,
        'errario://auth/callback'
      );

      if (result.type !== 'success') {
        // Usuário cancelou ou houve erro
        return;
      }

      // Extrai o code do deep link
      const url = Linking.parse(result.url);
      const code = url.queryParams?.code as string | undefined;

      if (!code) {
        Alert.alert('Erro', 'Código de autorização não recebido do Google');
        return;
      }

      const { isNew } = await loginWithGoogle(code);

      if (isNew) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Erro ao autenticar com Google';
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <TouchableOpacity
      className="bg-surface-card border border-gray-600 rounded-xl py-4 flex-row items-center justify-center"
      onPress={handleGoogleAuth}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#6366f1" />
      ) : (
        <>
          {/* Google "G" logo simplificado em texto */}
          <View className="w-6 h-6 rounded-full bg-white items-center justify-center mr-3">
            <Text className="text-blue-600 font-bold text-sm">G</Text>
          </View>
          <Text className="text-white font-medium text-base">
            Continuar com Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
