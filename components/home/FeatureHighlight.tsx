import React from 'react';
import { View, useColorScheme } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

interface FeatureHighlightProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  delay?: number;
  color?: 'primary' | 'accent' | 'premium';
}

export function FeatureHighlight({
  icon,
  label,
  delay = 0,
  color = 'primary',
}: FeatureHighlightProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    primary: {
      icon: '#6366F1',
      bg: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
      border: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
    },
    accent: {
      icon: '#14B8A6',
      bg: isDark ? 'rgba(20, 184, 166, 0.15)' : 'rgba(20, 184, 166, 0.1)',
      border: isDark ? 'rgba(20, 184, 166, 0.3)' : 'rgba(20, 184, 166, 0.2)',
    },
    premium: {
      icon: '#F59E0B',
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      border: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
    },
  };

  const colorConfig = colors[color];

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(delay).springify()}
      style={{
        alignItems: 'center',
        flex: 1,
      }}
    >
      {/* Icon container */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: colorConfig.bg,
          borderWidth: 1,
          borderColor: colorConfig.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <Ionicons name={icon} size={24} color={colorConfig.icon} />
      </View>

      {/* Label */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: isDark ? '#94A3B8' : '#64748B',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

// Container for multiple feature highlights
interface FeatureHighlightsRowProps {
  children: React.ReactNode;
}

export function FeatureHighlightsRow({ children }: FeatureHighlightsRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      {children}
    </View>
  );
}
