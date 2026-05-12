import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VictoryPie, VictoryLabel } from 'victory-native';
import { useNoteAnalytics } from '../../hooks/useNotes';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

// Paleta de cores para as fatias do pizza chart
const SLICE_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#818cf8', '#4f46e5', '#7c3aed', '#ddd6fe',
];

export default function AnalyticsScreen() {
  const { data, isLoading, isError, refetch } = useNoteAnalytics();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#6366f1" size="large" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (!data || data.total === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <EmptyState
          icon="📊"
          title="Sem dados ainda"
          description="Registre alguns erros para ver a análise de distribuição por matéria."
        />
      </SafeAreaView>
    );
  }

  const pieData = data.bySubject.map((item, i) => ({
    x: item.subject,
    y: item.count,
    color: SLICE_COLORS[i % SLICE_COLORS.length],
  }));

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-2 pb-4">
          <Text className="text-2xl font-bold text-white mb-1">Análise de Erros</Text>
          <Text className="text-gray-400 text-sm">{data.total} erros registrados</Text>
        </View>

        {/* Cards de resumo */}
        <View className="flex-row px-4 gap-3 mb-6">
          <SummaryCard label="Total" value={String(data.total)} icon="📝" />
          <SummaryCard label="Favoritos" value={String(data.totalFavorites)} icon="⭐" />
          <SummaryCard label="Matérias" value={String(data.bySubject.length)} icon="📚" />
        </View>

        {/* Pizza chart */}
        <View className="items-center mb-4">
          <VictoryPie
            data={pieData}
            width={280}
            height={280}
            colorScale={pieData.map((d) => d.color)}
            innerRadius={70}
            padAngle={2}
            style={{
              labels: { fill: 'transparent' },
            }}
            labelComponent={<VictoryLabel style={{ fill: 'transparent' }} />}
          />
          {/* Legenda central */}
          <View
            style={{
              position: 'absolute',
              top: 100,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text className="text-3xl font-bold text-white">{data.total}</Text>
            <Text className="text-gray-400 text-xs">erros</Text>
          </View>
        </View>

        {/* Legenda de matérias */}
        <View className="mx-4 mb-8">
          <Text className="text-white font-semibold mb-3">Por matéria</Text>
          {data.bySubject.map((item, i) => (
            <View key={item.subject} className="flex-row items-center mb-3">
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length],
                  marginRight: 10,
                }}
              />
              <Text className="text-gray-300 flex-1 text-sm">{item.subject}</Text>
              <Text className="text-gray-400 text-sm mr-2">{item.count}</Text>
              <View className="bg-surface-card rounded-full px-2 py-0.5">
                <Text className="text-gray-400 text-xs">{item.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View className="flex-1 bg-surface-card rounded-2xl p-4 items-center">
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text className="text-white font-bold text-xl mt-1">{value}</Text>
      <Text className="text-gray-400 text-xs mt-0.5">{label}</Text>
    </View>
  );
}
