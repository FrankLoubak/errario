import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sprint 3: Pizza chart com breakdown de erros por matéria
export default function AnalyticsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-xl font-bold mb-2">Análise de Erros</Text>
        <Text className="text-gray-500 text-center px-8">
          Sprint 3: Pizza chart com victory-native
        </Text>
      </View>
    </SafeAreaView>
  );
}
