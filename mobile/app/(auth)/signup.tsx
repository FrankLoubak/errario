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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { GoogleAuthButton } from '../../components/features/Auth/GoogleAuthButton';

const signupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormErrors = Partial<Record<keyof z.infer<typeof signupSchema>, string>>;

export default function SignupScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup() {
    const result = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await register(email, password, name);
      // Após cadastro, vai para o onboarding
      router.replace('/onboarding');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Erro ao criar conta. Tente novamente.';
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-white mb-2">Criar conta</Text>
        <Text className="text-base text-gray-400 mb-8">
          Comece a rastrear seus erros gratuitamente
        </Text>

        {/* Campo Nome */}
        <View className="mb-4">
          <Text className="text-sm text-gray-300 mb-2">Nome</Text>
          <TextInput
            className="bg-surface-card text-white rounded-xl px-4 py-4 text-base border border-gray-700"
            placeholder="Seu nome"
            placeholderTextColor="#6b7280"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
          {errors.name && (
            <Text className="text-red-400 text-sm mt-1">{errors.name}</Text>
          )}
        </View>

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
        <View className="mb-4">
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

        {/* Campo Confirmar Senha */}
        <View className="mb-6">
          <Text className="text-sm text-gray-300 mb-2">Confirmar senha</Text>
          <TextInput
            className="bg-surface-card text-white rounded-xl px-4 py-4 text-base border border-gray-700"
            placeholder="Repita a senha"
            placeholderTextColor="#6b7280"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {errors.confirmPassword && (
            <Text className="text-red-400 text-sm mt-1">{errors.confirmPassword}</Text>
          )}
        </View>

        {/* Botão de Cadastro */}
        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 items-center mb-4"
          onPress={handleSignup}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Criar conta grátis</Text>
          )}
        </TouchableOpacity>

        {/* Separador */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-px bg-gray-700" />
          <Text className="text-gray-500 mx-3 text-sm">ou</Text>
          <View className="flex-1 h-px bg-gray-700" />
        </View>

        {/* Cadastro com Google */}
        <GoogleAuthButton />

        {/* Termos */}
        <Text className="text-center text-gray-500 text-xs mt-6 leading-5">
          Ao criar uma conta, você concorda com nossos{' '}
          <Text className="text-primary-500">Termos de Uso</Text>
          {' '}e{' '}
          <Text className="text-primary-500">Política de Privacidade</Text>
        </Text>

        {/* Link para Login */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400">Já tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-primary-500 font-semibold">Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
