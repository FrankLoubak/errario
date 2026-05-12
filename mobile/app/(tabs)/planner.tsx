import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useStorageMode } from '../../hooks/useStorageMode';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const TODAY = new Date().getDay(); // 0=Dom, ajustado: 0=Seg

interface PlannerCard {
  id: string;
  assignedDay: number;
  completed: boolean;
  note: { id: string; title: string; subject: string; tags: string[] };
}

interface WeekData {
  week: Record<number, PlannerCard[]>;
  total: number;
}

async function fetchPlannerWeek(): Promise<WeekData> {
  const res = await api.get<{ success: boolean; data: WeekData }>('/planner');
  return res.data.data;
}

export default function PlannerScreen() {
  const mode = useStorageMode();
  const isCloud = mode === 'CLOUD';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['planner'],
    queryFn: fetchPlannerWeek,
    enabled: isCloud,
    staleTime: 2 * 60 * 1000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ cardId, completed }: { cardId: string; completed: boolean }) =>
      api.patch(`/planner/${cardId}`, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planner'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (cardId: string) => api.delete(`/planner/${cardId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planner'] }),
  });

  // Free tier: planner requer Pro
  if (!isCloud) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <EmptyState
          icon="📅"
          title="Planner disponível no Pro"
          description="Organize suas revisões por dia da semana e nunca perca uma revisão importante."
          actionLabel="Ver planos"
        />
      </SafeAreaView>
    );
  }

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#6366f1" size="large" />
      </SafeAreaView>
    );
  }

  if (query.isError) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <ErrorState onRetry={query.refetch} />
      </SafeAreaView>
    );
  }

  const week = query.data?.week ?? {};
  const totalCards = query.data?.total ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 pt-2 pb-3">
        <Text className="text-2xl font-bold text-white">Planner Semanal</Text>
        <Text className="text-gray-400 text-sm mt-1">
          {totalCards > 0 ? `${totalCards} revisões programadas` : 'Adicione notas para revisar'}
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {DAYS.map((dayLabel, index) => {
          const cards: PlannerCard[] = week[index] ?? [];
          // Domingo no sistema JS = 0, mas no nosso 0=Seg, logo ajustamos
          const isToday = (TODAY === 0 ? 6 : TODAY - 1) === index;

          return (
            <View key={index} className="mx-4 mb-4">
              {/* Label do dia */}
              <View className="flex-row items-center mb-2">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
                    isToday ? 'bg-primary-600' : 'bg-surface-card'
                  }`}
                >
                  <Text className={`text-xs font-bold ${isToday ? 'text-white' : 'text-gray-400'}`}>
                    {dayLabel}
                  </Text>
                </View>
                {cards.length > 0 && (
                  <Text className="text-gray-500 text-xs">{cards.length} nota{cards.length > 1 ? 's' : ''}</Text>
                )}
              </View>

              {/* Cards do dia */}
              {cards.length === 0 ? (
                <View className="bg-surface-card rounded-xl px-4 py-3 border border-dashed border-gray-700">
                  <Text className="text-gray-600 text-sm text-center">Nenhuma revisão</Text>
                </View>
              ) : (
                cards.map((card) => (
                  <View
                    key={card.id}
                    className={`bg-surface-card rounded-xl p-3 mb-2 flex-row items-center ${
                      card.completed ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <TouchableOpacity
                      className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                        card.completed ? 'bg-primary-600 border-primary-600' : 'border-gray-600'
                      }`}
                      onPress={() =>
                        toggleMutation.mutate({ cardId: card.id, completed: !card.completed })
                      }
                    >
                      {card.completed && <Text className="text-white text-xs">✓</Text>}
                    </TouchableOpacity>

                    {/* Conteúdo */}
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-medium ${card.completed ? 'line-through text-gray-500' : 'text-white'}`}
                        numberOfLines={1}
                      >
                        {card.note.title}
                      </Text>
                      {card.note.subject && (
                        <Text className="text-primary-400 text-xs mt-0.5">{card.note.subject}</Text>
                      )}
                    </View>

                    {/* Remover */}
                    <TouchableOpacity
                      className="ml-2 p-1"
                      onPress={() => removeMutation.mutate(card.id)}
                    >
                      <Text className="text-gray-600 text-base">×</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          );
        })}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
