import { View, Text, TouchableOpacity } from 'react-native';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  message = 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
  onRetry,
  retryLabel = 'Tentar novamente',
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text style={{ fontSize: 48 }}>⚠️</Text>
      <Text className="text-white text-lg font-bold text-center mt-4 mb-2">{title}</Text>
      <Text className="text-gray-400 text-sm text-center leading-5 mb-6">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          className="bg-primary-600 rounded-xl px-8 py-3"
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Variante inline (para erros dentro de cards, sem ocupar tela inteira)
export function InlineError({ message }: { message: string }) {
  return (
    <View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 flex-row items-center">
      <Text className="text-red-400 mr-2">⚠</Text>
      <Text className="text-red-300 text-sm flex-1">{message}</Text>
    </View>
  );
}
