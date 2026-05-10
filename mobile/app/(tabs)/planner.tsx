import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sprint 3: Planner semanal com arrastar e soltar
export default function PlannerScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-xl font-bold mb-2">Planner Semanal</Text>
        <Text className="text-gray-500 text-center px-8">
          Sprint 3: Organização de revisões por dia da semana
        </Text>
      </View>
    </SafeAreaView>
  );
}
