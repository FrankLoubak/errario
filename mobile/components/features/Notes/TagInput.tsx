import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

export function TagInput({ tags, onChange, maxTags = 10, placeholder = 'Adicionar tag...' }: TagInputProps) {
  const [value, setValue] = useState('');

  function addTag() {
    const trimmed = value.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) {
      setValue('');
      return;
    }
    onChange([...tags, trimmed]);
    setValue('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <View>
      {/* Tags existentes */}
      {tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2"
          contentContainerClassName="gap-2 py-1"
        >
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              className="bg-primary-900 border border-primary-700 rounded-full px-3 py-1 flex-row items-center"
              onPress={() => removeTag(tag)}
              activeOpacity={0.7}
            >
              <Text className="text-primary-300 text-xs mr-1">#{tag}</Text>
              <Text className="text-primary-400 text-xs">×</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      {tags.length < maxTags && (
        <TextInput
          className="bg-surface-card text-white rounded-xl px-4 py-3 text-sm border border-gray-700"
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          value={value}
          onChangeText={setValue}
          onSubmitEditing={addTag}
          blurOnSubmit={false}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
      )}
      {tags.length >= maxTags && (
        <Text className="text-gray-500 text-xs mt-1">Máximo de {maxTags} tags</Text>
      )}
    </View>
  );
}
