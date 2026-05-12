import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TagInput } from './TagInput';
import type { Note, CreateNoteInput } from '../../../types/note';

interface NoteEditorModalProps {
  visible: boolean;
  note?: Note | null; // null = criação, Note = edição
  onClose: () => void;
  onSave: (input: CreateNoteInput) => Promise<void>;
  isSaving?: boolean;
}

const SUBJECTS = ['Matemática', 'Português', 'História', 'Geografia', 'Biologia', 'Química', 'Física', 'Inglês'];

export function NoteEditorModal({
  visible,
  note,
  onClose,
  onSave,
  isSaving = false,
}: NoteEditorModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);

  const isEditing = !!note;

  useEffect(() => {
    if (visible) {
      setTitle(note?.title ?? '');
      setBody(note?.body ?? '');
      setSubject(note?.subject ?? '');
      setTags(note?.tags ?? []);
      setFavorite(note?.favorite ?? false);
    }
  }, [visible, note]);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'O título não pode estar vazio');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Campo obrigatório', 'O conteúdo não pode estar vazio');
      return;
    }

    await onSave({ title: title.trim(), body: body.trim(), subject, tags, favorite });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-surface"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-800">
          <TouchableOpacity onPress={onClose} disabled={isSaving}>
            <Text className="text-gray-400 text-base">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-white font-semibold text-base">
            {isEditing ? 'Editar erro' : 'Registrar erro'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} activeOpacity={0.7}>
            {isSaving ? (
              <ActivityIndicator color="#6366f1" size="small" />
            ) : (
              <Text className="text-primary-500 font-semibold text-base">Salvar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          {/* Título */}
          <TextInput
            className="text-white text-xl font-bold py-4 border-b border-gray-800"
            placeholder="O que você errou?"
            placeholderTextColor="#4b5563"
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={200}
          />

          {/* Corpo */}
          <TextInput
            className="text-gray-200 text-base py-4 border-b border-gray-800"
            placeholder="Descreva o erro, o que aprendeu, como evitar na próxima vez..."
            placeholderTextColor="#4b5563"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={6}
            maxLength={10000}
            textAlignVertical="top"
            style={{ minHeight: 120 }}
          />

          {/* Matéria */}
          <View className="py-4 border-b border-gray-800">
            <Text className="text-gray-400 text-sm mb-3">Matéria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSubject(subject === s ? '' : s)}
                  className={`px-4 py-2 rounded-full border ${
                    subject === s
                      ? 'bg-primary-600 border-primary-600'
                      : 'bg-transparent border-gray-600'
                  }`}
                >
                  <Text className={subject === s ? 'text-white text-sm font-medium' : 'text-gray-400 text-sm'}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Input custom para matéria não listada */}
            <TextInput
              className="bg-surface-card text-white rounded-xl px-4 py-3 mt-3 border border-gray-700 text-sm"
              placeholder="Outra matéria..."
              placeholderTextColor="#6b7280"
              value={SUBJECTS.includes(subject) ? '' : subject}
              onChangeText={(v) => setSubject(v)}
              maxLength={100}
            />
          </View>

          {/* Tags */}
          <View className="py-4 border-b border-gray-800">
            <Text className="text-gray-400 text-sm mb-3">Tags</Text>
            <TagInput tags={tags} onChange={setTags} />
          </View>

          {/* Favorito */}
          <TouchableOpacity
            className="flex-row items-center py-4"
            onPress={() => setFavorite((f) => !f)}
          >
            <Text style={{ fontSize: 20 }} className="mr-3">{favorite ? '⭐' : '☆'}</Text>
            <Text className="text-gray-300 text-base">Marcar como favorito</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
