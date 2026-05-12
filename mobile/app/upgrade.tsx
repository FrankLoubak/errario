import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useIAP } from '../hooks/useIAP';
import { useAuth } from '../hooks/useAuth';

const PRO_FEATURES = [
  { icon: '☁️', title: 'Dados na nuvem', desc: 'Acesso em qualquer dispositivo, sem limite de notas' },
  { icon: '📅', title: 'Planner semanal', desc: 'Organize revisões por dia da semana' },
  { icon: '🔄', title: 'Sincronização automática', desc: 'Sync ao abrir o app, sem perder nada' },
  { icon: '📊', title: 'Analytics completo', desc: 'Evolução detalhada por matéria e período' },
  { icon: '🔔', title: 'Lembretes inteligentes', desc: 'Push notifications de revisão no momento certo' },
  { icon: '🚫', title: 'Sem anúncios', desc: 'Experiência limpa e focada nos estudos' },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { monthlyProduct, yearlyProduct, isPurchasing, error, subscribe, restorePurchases, isLoading } = useIAP();
  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  const isPro = user?.tier === 'PRO' || user?.tier === 'ENTERPRISE';

  async function handleSubscribe() {
    if (!selectedSku) {
      Alert.alert('Escolha um plano', 'Selecione mensal ou anual para continuar.');
      return;
    }
    await subscribe(selectedSku);
  }

  if (isPro) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-8">
        <Text style={{ fontSize: 56 }}>🎉</Text>
        <Text className="text-white text-2xl font-bold text-center mt-4 mb-2">Você já é Pro!</Text>
        <Text className="text-gray-400 text-center mb-8">
          Aproveite todos os recursos sem limitação.
        </Text>
        <TouchableOpacity
          className="bg-primary-600 rounded-2xl px-10 py-4"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold text-base">Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4 items-center">
          <TouchableOpacity className="self-end mb-4" onPress={() => router.back()}>
            <Text className="text-gray-400 text-base">✕</Text>
          </TouchableOpacity>
          <View className="w-16 h-16 bg-primary-600 rounded-2xl items-center justify-center mb-4">
            <Text style={{ fontSize: 32 }}>⭐</Text>
          </View>
          <Text className="text-3xl font-bold text-white text-center">Errário Pro</Text>
          <Text className="text-gray-400 text-center mt-2 text-base">
            Leve seus estudos para outro nível
          </Text>
        </View>

        {/* Features */}
        <View className="px-6 mb-6">
          {PRO_FEATURES.map((f) => (
            <View key={f.title} className="flex-row items-start mb-4">
              <Text style={{ fontSize: 24 }} className="mr-4 mt-0.5">{f.icon}</Text>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">{f.title}</Text>
                <Text className="text-gray-400 text-sm mt-0.5">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Planos */}
        <View className="px-6 mb-6">
          <Text className="text-white font-semibold text-base mb-3">Escolha seu plano</Text>

          {isLoading ? (
            <ActivityIndicator color="#6366f1" />
          ) : (
            <>
              {/* Plano mensal */}
              {monthlyProduct && (
                <TouchableOpacity
                  onPress={() => setSelectedSku(monthlyProduct.sku)}
                  className={`rounded-2xl p-4 mb-3 border-2 ${
                    selectedSku === monthlyProduct.sku
                      ? 'bg-primary-900 border-primary-500'
                      : 'bg-surface-card border-gray-700'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-semibold text-base">Mensal</Text>
                      <Text className="text-gray-400 text-sm">Cancele quando quiser</Text>
                    </View>
                    <Text className="text-white font-bold text-lg">
                      {monthlyProduct.localizedPrice}/mês
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Plano anual */}
              {yearlyProduct && (
                <TouchableOpacity
                  onPress={() => setSelectedSku(yearlyProduct.sku)}
                  className={`rounded-2xl p-4 border-2 ${
                    selectedSku === yearlyProduct.sku
                      ? 'bg-primary-900 border-primary-500'
                      : 'bg-surface-card border-gray-700'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <View className="flex-row items-center">
                        <Text className="text-white font-semibold text-base mr-2">Anual</Text>
                        <View className="bg-green-700 rounded-full px-2 py-0.5">
                          <Text className="text-green-200 text-xs font-medium">2 meses grátis</Text>
                        </View>
                      </View>
                      <Text className="text-gray-400 text-sm">Melhor custo-benefício</Text>
                    </View>
                    <Text className="text-white font-bold text-lg">
                      {yearlyProduct.localizedPrice}/ano
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Sem produtos (simulador) */}
              {!monthlyProduct && !yearlyProduct && (
                <View className="bg-surface-card rounded-2xl p-4 items-center">
                  <Text className="text-gray-400 text-sm text-center">
                    Produtos IAP indisponíveis neste ambiente.{'\n'}
                    Teste em um device físico com conta de loja configurada.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Erro */}
        {error && (
          <View className="mx-6 mb-4 bg-red-950 border border-red-800 rounded-xl p-3">
            <Text className="text-red-300 text-sm text-center">{error}</Text>
          </View>
        )}

        {/* CTA */}
        <View className="px-6 mb-4">
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${
              isPurchasing || !selectedSku ? 'bg-gray-700' : 'bg-primary-600'
            }`}
            onPress={handleSubscribe}
            disabled={isPurchasing || !selectedSku}
            activeOpacity={0.85}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                {selectedSku ? 'Assinar agora · 7 dias grátis' : 'Selecione um plano'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Restaurar + Termos */}
        <View className="px-6 pb-8 items-center">
          <TouchableOpacity onPress={restorePurchases} className="mb-3">
            <Text className="text-primary-400 text-sm">Restaurar compras anteriores</Text>
          </TouchableOpacity>
          <Text className="text-gray-600 text-xs text-center leading-5">
            A assinatura é cobrada pela App Store / Google Play.{'\n'}
            A renovação automática pode ser cancelada a qualquer momento nas configurações da loja.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
