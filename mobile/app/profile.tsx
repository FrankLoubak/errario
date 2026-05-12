import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const isPro = user?.tier === 'PRO' || user?.tier === 'ENTERPRISE';

  async function handleSaveName() {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await api.patch('/users/me', { name: name.trim() });
      await refreshUser();
      setEditingName(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o nome.');
    } finally {
      setSavingName(false);
    }
  }

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Excluir conta',
      'Esta ação é irreversível. Seus dados serão removidos em até 30 dias (LGPD). Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Confirmar exclusão',
              'Digite EXCLUIR para confirmar.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Confirmar',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.delete('/users/me', { data: { confirm: 'EXCLUIR' } });
                      await logout();
                      router.replace('/(auth)/login');
                    } catch {
                      Alert.alert('Erro', 'Não foi possível excluir a conta. Tente novamente.');
                    }
                  },
                },
              ]
            ),
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-white/10">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Text className="text-primary-400 text-base font-medium">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Perfil</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        {/* Avatar + plano */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-primary-600 items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">
              {(user?.name ?? user?.email ?? '?')[0].toUpperCase()}
            </Text>
          </View>
          <Text className="text-white text-xl font-bold mb-1">{user?.name ?? 'Sem nome'}</Text>
          <Text className="text-gray-400 text-sm mb-3">{user?.email}</Text>
          <View className={`px-4 py-1 rounded-full ${isPro ? 'bg-yellow-500/20' : 'bg-gray-700'}`}>
            <Text className={`text-xs font-semibold ${isPro ? 'text-yellow-400' : 'text-gray-300'}`}>
              {isPro ? '⭐ PRO' : 'Plano Gratuito'}
            </Text>
          </View>
        </View>

        {/* Editar nome */}
        <Section title="Informações">
          {editingName ? (
            <View className="gap-3">
              <TextInput
                className="bg-surface-card text-white rounded-xl px-4 py-3 text-base"
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                placeholderTextColor="#6b7280"
                autoFocus
                maxLength={100}
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-surface-card rounded-xl py-3 items-center"
                  onPress={() => { setEditingName(false); setName(user?.name ?? ''); }}
                >
                  <Text className="text-gray-400 font-medium">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary-600 rounded-xl py-3 items-center"
                  onPress={handleSaveName}
                  disabled={savingName}
                >
                  {savingName
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text className="text-white font-semibold">Salvar</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Row
              label="Nome"
              value={user?.name ?? 'Não informado'}
              onPress={() => setEditingName(true)}
              actionLabel="Editar"
            />
          )}
          <Row label="Email" value={user?.email ?? ''} />
          <Row label="Membro desde" value={user?.createdAt ? formatDate(user.createdAt) : '—'} />
        </Section>

        {/* Assinatura */}
        <Section title="Assinatura">
          <Row label="Plano atual" value={isPro ? 'Pro' : 'Gratuito'} />
          {isPro && (
            <Row label="Armazenamento" value="Nuvem (sincronizado)" />
          )}
          {!isPro && (
            <TouchableOpacity
              className="bg-primary-600 rounded-xl py-3 items-center mt-2"
              onPress={() => router.push('/upgrade')}
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold">Fazer upgrade para Pro</Text>
            </TouchableOpacity>
          )}
        </Section>

        {/* Sessão */}
        <Section title="Conta">
          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text className="text-red-400 font-medium text-base">Sair</Text>
            <Text className="text-gray-600">›</Text>
          </TouchableOpacity>

          <View className="h-px bg-white/5 my-1" />

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text className="text-red-600 font-medium text-base">Excluir conta</Text>
            <Text className="text-gray-600">›</Text>
          </TouchableOpacity>
        </Section>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
        {title}
      </Text>
      <View className="bg-surface-card rounded-2xl px-4 py-1">
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  actionLabel,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  actionLabel?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-white/5 last:border-0">
      <Text className="text-gray-400 text-sm">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-white text-sm max-w-48" numberOfLines={1}>{value}</Text>
        {onPress && (
          <TouchableOpacity onPress={onPress}>
            <Text className="text-primary-400 text-sm font-medium">{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
