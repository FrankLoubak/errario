import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNotes } from '../../hooks/useNotes';
import { useAppStateSync } from '../../hooks/useAppStateSync';
import { useAuthStore } from '../../store/authStore';
import { NoteCard } from '../../components/features/Notes/NoteCard';
import { NoteEditorModal } from '../../components/features/Notes/NoteEditorModal';
import { SkeletonNoteList } from '../../components/common/SkeletonBox';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import type { Note } from '../../types/note';

const FREE_TIER_LIMIT = 100;

export default function NotesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null | undefined>(undefined);
  const [isEditorOpen, setEditorOpen] = useState(false);

  const { notes, total, isLoading, isError, refetch, createNote, updateNote, deleteNote, isCreating, isUpdating, sync } =
    useNotes();

  // Pro: sincroniza ao voltar ao app
  useAppStateSync(sync);

  const isPro = user?.tier === 'PRO' || user?.tier === 'ENTERPRISE';
  const atLimit = !isPro && total >= FREE_TIER_LIMIT;

  const filtered = search.trim()
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.subject.toLowerCase().includes(search.toLowerCase()) ||
          n.tags.some((t) => t.includes(search.toLowerCase()))
      )
    : notes;

  function openCreate() {
    if (atLimit) {
      router.push('/upgrade');
      return;
    }
    setSelectedNote(null);
    setEditorOpen(true);
  }

  function openEdit(note: Note) {
    setSelectedNote(note);
    setEditorOpen(true);
  }

  async function handleSave(input: Parameters<typeof createNote>[0]) {
    if (selectedNote) {
      await updateNote(selectedNote.id, input);
    } else {
      await createNote(input);
    }
  }

  if (isLoading) return <SkeletonNoteList count={5} />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-white">Meus Erros</Text>
          <TouchableOpacity
            className={`w-10 h-10 rounded-full items-center justify-center ${atLimit ? 'bg-gray-700' : 'bg-primary-600'}`}
            onPress={openCreate}
            activeOpacity={0.8}
          >
            <Text className="text-white text-2xl leading-none">+</Text>
          </TouchableOpacity>
        </View>

        {/* Limite Free tier */}
        {!isPro && total > 0 && (
          <TouchableOpacity
            className={`mb-3 rounded-xl px-3 py-2 flex-row items-center justify-between ${atLimit ? 'bg-red-500/15 border border-red-500/30' : 'bg-white/5'}`}
            onPress={() => router.push('/upgrade')}
            activeOpacity={0.8}
          >
            <Text className={`text-xs ${atLimit ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
              {atLimit
                ? 'Limite atingido — faça upgrade para continuar'
                : `${total} / ${FREE_TIER_LIMIT} anotações (plano gratuito)`}
            </Text>
            <Text className="text-primary-400 text-xs font-medium">Pro →</Text>
          </TouchableOpacity>
        )}

        {/* Busca */}
        <TextInput
          className="bg-surface-card text-white rounded-xl px-4 py-3 text-sm border border-gray-800"
          placeholder="Buscar por título, matéria ou tag..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📝"
          title={search ? 'Nenhum resultado' : 'Nenhum erro registrado ainda'}
          description={
            search
              ? 'Tente outros termos de busca'
              : 'Toque no + para registrar seu primeiro erro e começar a aprender com ele'
          }
          actionLabel={!search ? 'Registrar primeiro erro' : undefined}
          onAction={!search ? openCreate : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard note={item} onPress={openEdit} />
          )}
          contentContainerClassName="px-4 pb-8"
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={false}
        />
      )}

      {/* Modal de editor */}
      <NoteEditorModal
        visible={isEditorOpen}
        note={selectedNote}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        isSaving={isCreating || isUpdating}
      />
    </SafeAreaView>
  );
}
