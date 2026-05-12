import { View, Text, TouchableOpacity } from 'react-native';
import type { Note } from '../../../types/note';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onLongPress?: (note: Note) => void;
}

export function NoteCard({ note, onPress, onLongPress }: NoteCardProps) {
  return (
    <TouchableOpacity
      className="bg-surface-card rounded-2xl p-4 mb-3 active:opacity-80"
      onPress={() => onPress(note)}
      onLongPress={() => onLongPress?.(note)}
      activeOpacity={0.75}
    >
      {/* Header: matéria + favorito */}
      <View className="flex-row items-center justify-between mb-2">
        {note.subject ? (
          <View className="bg-primary-900 rounded-full px-3 py-1">
            <Text className="text-primary-300 text-xs font-medium">{note.subject}</Text>
          </View>
        ) : (
          <View />
        )}
        {note.favorite && <Text style={{ fontSize: 14 }}>⭐</Text>}
      </View>

      {/* Título */}
      <Text className="text-white font-semibold text-base mb-1" numberOfLines={2}>
        {note.title}
      </Text>

      {/* Preview do corpo */}
      <Text className="text-gray-400 text-sm leading-5" numberOfLines={2}>
        {note.body}
      </Text>

      {/* Tags */}
      {note.tags.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {note.tags.slice(0, 4).map((tag) => (
            <View key={tag} className="bg-surface rounded-full px-2 py-0.5">
              <Text className="text-gray-400 text-xs">#{tag}</Text>
            </View>
          ))}
          {note.tags.length > 4 && (
            <Text className="text-gray-500 text-xs self-center">
              +{note.tags.length - 4}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
