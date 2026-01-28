import React from 'react';
import { View, ViewProps, useColorScheme } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  borderGradient?: 'primary' | 'premium' | 'accent' | 'none';
  intensity?: 'light' | 'medium' | 'heavy';
}

export function GlassCard({
  children,
  delay = 0,
  borderGradient = 'primary',
  intensity = 'medium',
  style,
  ...props
}: GlassCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Background opacity based on intensity
  const bgOpacity = {
    light: isDark ? 0.03 : 0.5,
    medium: isDark ? 0.06 : 0.7,
    heavy: isDark ? 0.1 : 0.85,
  };

  // Border color based on gradient type
  const borderColors = {
    primary: 'rgba(99, 102, 241, 0.3)',
    premium: 'rgba(245, 158, 11, 0.3)',
    accent: 'rgba(20, 184, 166, 0.3)',
    none: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  };

  // Shadow color based on gradient type
  const shadowColors = {
    primary: '#6366F1',
    premium: '#F59E0B',
    accent: '#14B8A6',
    none: isDark ? '#000000' : '#6366F1',
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify()}
      style={[
        {
          backgroundColor: isDark
            ? `rgba(30, 41, 59, ${bgOpacity[intensity]})`
            : `rgba(255, 255, 255, ${bgOpacity[intensity]})`,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: borderColors[borderGradient],
          // Shadow for glow effect
          shadowColor: shadowColors[borderGradient],
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.15,
          shadowRadius: 24,
          elevation: 8,
          overflow: 'hidden',
        },
        style,
      ]}
      {...props}
    >
      {/* Inner glow effect */}
      {borderGradient !== 'none' && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(255, 255, 255, 0.8)',
          }}
        />
      )}
      {children}
    </Animated.View>
  );
}
