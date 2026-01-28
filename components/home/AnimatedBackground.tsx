import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

// Generate random particles
const generateParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT * 0.6, // Keep in upper portion
    size: Math.random() * 3 + 2, // 2-5px
    duration: Math.random() * 2000 + 3000, // 3-5s
    delay: Math.random() * 2000, // 0-2s delay
  }));
};

interface ParticleProps {
  particle: Particle;
  isDark: boolean;
}

function FloatingParticle({ particle, isDark }: ParticleProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    translateY.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(-20, {
          duration: particle.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(0.7, {
          duration: particle.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: isDark ? '#818CF8' : '#6366F1',
        },
        animatedStyle,
      ]}
    />
  );
}

export function AnimatedBackground() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Memoize particles to prevent regeneration on re-renders
  const particles = useMemo(() => generateParticles(12), []);

  // Gradient colors based on theme
  const gradientColors = isDark
    ? ['#0F172A', '#1E1B4B', '#0F172A'] // Dark: deep space
    : ['#EEF2FF', '#E0E7FF', '#EEF2FF']; // Light: soft indigo

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base gradient */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Radial glow effect at top */}
      <View
        style={{
          position: 'absolute',
          top: -100,
          left: SCREEN_WIDTH / 2 - 150,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: isDark
            ? 'rgba(99, 102, 241, 0.15)'
            : 'rgba(99, 102, 241, 0.1)',
        }}
      />

      {/* Secondary glow */}
      <View
        style={{
          position: 'absolute',
          top: 100,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: isDark
            ? 'rgba(20, 184, 166, 0.1)'
            : 'rgba(20, 184, 166, 0.08)',
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <FloatingParticle
          key={particle.id}
          particle={particle}
          isDark={isDark}
        />
      ))}
    </View>
  );
}
