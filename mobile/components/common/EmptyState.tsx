import { View, Text, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text style={{ fontSize: 56 }}>{icon}</Text>
      <Text className="text-white text-lg font-bold text-center mt-4 mb-2">{title}</Text>
      {description && (
        <Text className="text-gray-400 text-sm text-center leading-5 mb-6">{description}</Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          className="bg-primary-600 rounded-xl px-8 py-3 mt-2"
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
