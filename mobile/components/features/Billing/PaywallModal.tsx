import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface PaywallModalProps {
  visible: boolean;
  feature: string; // nome da feature bloqueada, ex: "Planner semanal"
  onClose: () => void;
}

export function PaywallModal({ visible, feature, onClose }: PaywallModalProps) {
  const router = useRouter();

  function handleUpgrade() {
    onClose();
    router.push('/upgrade');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 items-center justify-end pb-8 px-4">
        <View className="bg-surface-card rounded-3xl w-full p-6">
          {/* Ícone */}
          <View className="w-14 h-14 bg-primary-600 rounded-2xl items-center justify-center self-center mb-4">
            <Text style={{ fontSize: 28 }}>⭐</Text>
          </View>

          {/* Título */}
          <Text className="text-white text-xl font-bold text-center mb-2">
            Recurso Pro
          </Text>
          <Text className="text-gray-400 text-center text-sm mb-6 leading-5">
            <Text className="text-primary-400 font-medium">{feature}</Text>
            {' '}está disponível apenas no plano Pro.{'\n'}
            Experimente grátis por 7 dias, cancele quando quiser.
          </Text>

          {/* Benefícios rápidos */}
          <View className="mb-6 gap-2">
            {['Dados na nuvem, sem limite', 'Planner + Analytics completo', 'Sem anúncios'].map((b) => (
              <View key={b} className="flex-row items-center">
                <Text className="text-primary-400 mr-2">✓</Text>
                <Text className="text-gray-300 text-sm">{b}</Text>
              </View>
            ))}
          </View>

          {/* CTAs */}
          <TouchableOpacity
            className="bg-primary-600 rounded-2xl py-4 items-center mb-3"
            onPress={handleUpgrade}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">Ver planos Pro</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} className="items-center py-2">
            <Text className="text-gray-500 text-sm">Continuar no plano grátis</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
