import React, { useEffect } from 'react';
import { Pressable, View, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

interface PulsingButtonProps {
  onPress: () => void;
  disabled?: boolean;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PulsingButton({
  onPress,
  disabled = false,
  title,
  subtitle,
  icon = 'scan-outline',
}: PulsingButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);
  const buttonScale = useSharedValue(1);
  const breatheScale = useSharedValue(1);

  useEffect(() => {
    if (!disabled) {
      // Glow ring animation
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1500, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
          withTiming(0.6, { duration: 0 })
        ),
        -1,
        false
      );

      // Subtle breathing animation
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [disabled]);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  // Animated styles - all hooks must be called unconditionally
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const secondGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(glowScale.value, [1, 1.2], [1, 1.3]) }],
    opacity: interpolate(glowOpacity.value, [0, 0.6], [0, 0.4]),
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value * breatheScale.value },
    ],
  }));

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Glow ring - behind the button */}
      {!disabled && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: '100%',
              height: 64,
              borderRadius: 32,
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: isDark ? '#818CF8' : '#6366F1',
            },
            glowStyle,
          ]}
        />
      )}

      {/* Second glow ring - slightly delayed */}
      {!disabled && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: '100%',
              height: 64,
              borderRadius: 32,
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: isDark ? '#A5B4FC' : '#818CF8',
            },
            secondGlowStyle,
          ]}
        />
      )}

      {/* Main button */}
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          {
            width: '100%',
            borderRadius: 32,
            overflow: 'hidden',
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: disabled ? 0.1 : 0.4,
            shadowRadius: 12,
            elevation: disabled ? 2 : 8,
          },
          buttonStyle,
        ]}
      >
        <LinearGradient
          colors={disabled
            ? ['#9CA3AF', '#6B7280']
            : ['#6366F1', '#8B5CF6']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: 18,
            paddingHorizontal: 32,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Ionicons
            name={disabled ? 'time-outline' : icon}
            size={24}
            color="#FFFFFF"
          />
          <View>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </LinearGradient>
      </AnimatedPressable>
    </View>
  );
}
