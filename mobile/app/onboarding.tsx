import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const firstName = user?.name?.split(' ')[0] ?? 'Estudante';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ícone principal */}
        <View className="items-center mb-10">
          <View className="w-24 h-24 bg-primary-600 rounded-3xl items-center justify-center mb-6">
            <Text style={{ fontSize: 40 }}>📒</Text>
          </View>
          <Text className="text-3xl font-bold text-white text-center mb-3">
            Olá, {firstName}!
          </Text>
          <Text className="text-gray-400 text-center text-base leading-6">
            Bem-vindo ao Errário — o diário de erros que transforma o que você erra em aprendizado real.
          </Text>
        </View>

        {/* Features */}
        <View className="gap-5 mb-12">
          <FeatureRow
            icon="📝"
            title="Registre seus erros"
            description="Anote cada questão errada com contexto, matéria e o que aprendeu."
          />
          <FeatureRow
            icon="📅"
            title="Revise no momento certo"
            description="O planner organiza suas revisões pela semana para fixar o conteúdo."
          />
          <FeatureRow
            icon="📊"
            title="Veja sua evolução"
            description="Gráficos mostram onde você mais erra e como está melhorando."
          />
        </View>

        {/* CTA */}
        <TouchableOpacity
          className="bg-primary-600 rounded-2xl py-4 items-center"
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-lg">Começar a usar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start">
      <View className="w-12 h-12 bg-surface-card rounded-xl items-center justify-center mr-4 shrink-0">
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-base mb-1">{title}</Text>
        <Text className="text-gray-400 text-sm leading-5">{description}</Text>
      </View>
    </View>
  );
}
