import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

// Sprint 3: Dashboard completo com pizza chart e métricas
export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4 py-6">
        <Text className="text-2xl font-bold text-white mb-1">
          Olá, {user?.name?.split(' ')[0] ?? 'Estudante'} 👋
        </Text>
        <Text className="text-gray-400 mb-8">Vamos transformar seus erros em aprendizado</Text>

        {/* Placeholder — Sprint 3 implementa os widgets reais */}
        <View className="bg-surface-card rounded-2xl p-6 mb-4 items-center">
          <Text className="text-gray-500 text-center">
            Sprint 3: Pizza chart e métricas aparecem aqui
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
