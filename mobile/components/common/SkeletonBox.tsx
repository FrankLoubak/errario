import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function SkeletonBox({
  width,
  height = 16,
  borderRadius = 8,
  className,
}: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius,
          backgroundColor: '#2d3561',
          opacity,
        },
      ]}
      className={className}
    />
  );
}

// ─── Compostos prontos para uso ───────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <View className="bg-surface-card rounded-2xl p-4 mb-3">
      <SkeletonBox height={14} width="60%" borderRadius={6} />
      <View className="h-2" />
      <SkeletonBox height={11} width="85%" borderRadius={6} />
      <View className="h-1" />
      <SkeletonBox height={11} width="70%" borderRadius={6} />
      <View className="h-4" />
      <View className="flex-row gap-2">
        <SkeletonBox height={22} width={64} borderRadius={11} />
        <SkeletonBox height={22} width={48} borderRadius={11} />
      </View>
    </View>
  );
}

export function SkeletonNoteList({ count = 4 }: { count?: number }) {
  return (
    <View className="px-4 pt-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
