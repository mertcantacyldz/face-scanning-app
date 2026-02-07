import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import Animated, {
  SlideInLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

interface StatusPillProps {
  isReady: boolean;
  readyText: string;
  loadingText: string;
}

export function StatusPill({ isReady, readyText, loadingText }: StatusPillProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Pulse animation for loading state
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (!isReady) {
      pulseOpacity.value = withRepeat(
        withTiming(0.3, { duration: 800 }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isReady]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      entering={SlideInLeft.duration(400).springify()}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: isDark
          ? 'rgba(30, 41, 59, 0.8)'
          : 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 8,
      }}
    >

      {/* Icon */}
      <Ionicons
        name={isReady ? 'checkmark-circle' : 'time-outline'}
        size={16}
        color={isReady ? '#10B981' : '#F59E0B'}
      />

      {/* Text */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: isDark ? '#E2E8F0' : '#334155',
        }}
      >
        {isReady ? readyText : loadingText}
      </Text>
    </Animated.View>
  );
}
