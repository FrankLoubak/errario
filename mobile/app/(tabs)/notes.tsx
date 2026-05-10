import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sprint 3: CRUD completo de notas (SQLite Free / API Pro)
export default function NotesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-xl font-bold mb-2">Meus Erros</Text>
        <Text className="text-gray-500 text-center px-8">
          Sprint 3: Lista de notas com CRUD completo
        </Text>
      </View>
    </SafeAreaView>
  );
}
