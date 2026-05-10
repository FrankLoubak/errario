import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { GoogleAuthButton } from '../../components/features/Auth/GoogleAuthButton';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

type FormErrors = Partial<Record<keyof z.infer<typeof loginSchema>, string>>;

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof FormErrors;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Erro ao fazer login. Tente novamente.';
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface"
    >
      <View className="flex-1 px-6 justify-center">
        <Text className="text-4xl font-bold text-white mb-2">Errário</Text>
        <Text className="text-base text-gray-400 mb-10">
          Transforme seus erros em aprendizado
        </Text>

        {/* Campo Email */}
        <View className="mb-4">
          <Text className="text-sm text-gray-300 mb-2">Email</Text>
          <TextInput
            className="bg-surface-card text-white rounded-xl px-4 py-4 text-base border border-gray-700"
            placeholder="seu@email.com"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
          {errors.email && (
            <Text className="text-red-400 text-sm mt-1">{errors.email}</Text>
          )}
        </View>

        {/* Campo Senha */}
        <View className="mb-6">
          <Text className="text-sm text-gray-300 mb-2">Senha</Text>
          <TextInput
            className="bg-surface-card text-white rounded-xl px-4 py-4 text-base border border-gray-700"
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#6b7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {errors.password && (
            <Text className="text-red-400 text-sm mt-1">{errors.password}</Text>
          )}
        </View>

        {/* Botão de Login */}
        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 items-center mb-4"
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Entrar</Text>
          )}
        </TouchableOpacity>

        {/* Separador */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-px bg-gray-700" />
          <Text className="text-gray-500 mx-3 text-sm">ou</Text>
          <View className="flex-1 h-px bg-gray-700" />
        </View>

        {/* Login com Google */}
        <GoogleAuthButton />

        {/* Link para Signup */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-400">Não tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text className="text-primary-500 font-semibold">Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
