import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useNoteAnalytics } from '../../hooks/useNotes';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: analytics } = useNoteAnalytics();

  const isPro = user?.tier === 'PRO' || user?.tier === 'ENTERPRISE';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

        {/* Header row */}
        <View className="flex-row items-center justify-between py-6">
          <View>
            <Text className="text-2xl font-bold text-white">
              Olá, {user?.name?.split(' ')[0] ?? 'Estudante'} 👋
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              Vamos transformar seus erros em aprendizado
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            className="w-10 h-10 rounded-full bg-primary-600 items-center justify-center"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">
              {(user?.name ?? user?.email ?? '?')[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tier badge — Free users see upgrade prompt */}
        {!isPro && (
          <TouchableOpacity
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-5 flex-row items-center justify-between"
            onPress={() => router.push('/upgrade')}
            activeOpacity={0.85}
          >
            <View className="flex-1">
              <Text className="text-yellow-400 font-semibold text-sm">Plano Gratuito</Text>
              <Text className="text-gray-400 text-xs mt-0.5">
                Atualize para Pro e sincronize em qualquer device
              </Text>
            </View>
            <Text className="text-yellow-400 font-bold text-sm ml-2">Ver Pro →</Text>
          </TouchableOpacity>
        )}

        {/* Stats cards */}
        <View className="flex-row gap-3 mb-5">
          <StatCard
            label="Total de erros"
            value={String(analytics?.total ?? 0)}
            icon="📝"
          />
          <StatCard
            label="Favoritos"
            value={String(analytics?.totalFavorites ?? 0)}
            icon="⭐"
          />
        </View>

        {/* Top subjects */}
        {analytics && analytics.bySubject.length > 0 && (
          <View className="bg-surface-card rounded-2xl p-4 mb-5">
            <Text className="text-white font-semibold mb-3">Matérias com mais erros</Text>
            {analytics.bySubject.slice(0, 4).map((item) => (
              <View key={item.subject} className="flex-row items-center mb-2">
                <View className="flex-1">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-300 text-sm">{item.subject}</Text>
                    <Text className="text-gray-500 text-xs">{item.count}</Text>
                  </View>
                  <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick actions */}
        <Text className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
          Ações rápidas
        </Text>
        <View className="gap-3">
          <QuickAction
            icon="📝"
            label="Nova anotação de erro"
            onPress={() => router.push('/(tabs)/notes')}
          />
          <QuickAction
            icon="📅"
            label="Ver planner da semana"
            onPress={() => router.push('/(tabs)/planner')}
          />
          <QuickAction
            icon="📊"
            label="Ver analytics completo"
            onPress={() => router.push('/(tabs)/analytics')}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View className="flex-1 bg-surface-card rounded-2xl p-4">
      <Text style={{ fontSize: 22 }} className="mb-2">{icon}</Text>
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-gray-400 text-xs mt-1">{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      className="bg-surface-card rounded-2xl p-4 flex-row items-center"
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={{ fontSize: 22 }} className="mr-4">{icon}</Text>
      <Text className="text-white font-medium flex-1">{label}</Text>
      <Text className="text-gray-600 text-lg">›</Text>
    </TouchableOpacity>
  );
}
