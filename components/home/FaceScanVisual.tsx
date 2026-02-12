import React, { useEffect } from 'react';
import { View, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// Face constellation dots - scaled to fit 160x160 viewBox with padding
// Original range X(40-160) Y(10-182) → scaled to center in 160x160
const FACE_DOTS = [
  // Head top
  { x: 80, y: 8, delay: 0 },
  { x: 60, y: 12, delay: 50 },
  { x: 100, y: 12, delay: 50 },
  { x: 44, y: 24, delay: 100 },
  { x: 116, y: 24, delay: 100 },

  // Forehead
  { x: 56, y: 38, delay: 150 },
  { x: 80, y: 34, delay: 150 },
  { x: 104, y: 38, delay: 150 },

  // Eyebrows
  { x: 48, y: 54, delay: 200 },
  { x: 60, y: 50, delay: 200 },
  { x: 72, y: 53, delay: 200 },
  { x: 88, y: 53, delay: 200 },
  { x: 100, y: 50, delay: 200 },
  { x: 112, y: 54, delay: 200 },

  // Eyes
  { x: 54, y: 66, delay: 250 },
  { x: 66, y: 66, delay: 250 },
  { x: 94, y: 66, delay: 250 },
  { x: 106, y: 66, delay: 250 },

  // Nose
  { x: 80, y: 74, delay: 300 },
  { x: 80, y: 86, delay: 300 },
  { x: 72, y: 94, delay: 350 },
  { x: 80, y: 98, delay: 350 },
  { x: 88, y: 94, delay: 350 },

  // Mouth
  { x: 64, y: 114, delay: 400 },
  { x: 76, y: 118, delay: 400 },
  { x: 80, y: 119, delay: 400 },
  { x: 84, y: 118, delay: 400 },
  { x: 96, y: 114, delay: 400 },

  // Jawline left
  { x: 36, y: 40, delay: 450 },
  { x: 32, y: 60, delay: 450 },
  { x: 34, y: 84, delay: 500 },
  { x: 40, y: 108, delay: 500 },
  { x: 52, y: 128, delay: 550 },
  { x: 68, y: 140, delay: 550 },

  // Chin
  { x: 80, y: 146, delay: 600 },

  // Jawline right
  { x: 92, y: 140, delay: 550 },
  { x: 108, y: 128, delay: 550 },
  { x: 120, y: 108, delay: 500 },
  { x: 126, y: 84, delay: 500 },
  { x: 128, y: 60, delay: 450 },
  { x: 124, y: 40, delay: 450 },
];

const SVG_SIZE = 160;
const SCAN_DURATION = 2500;

interface FaceDotProps {
  x: number;
  y: number;
  delay: number;
  scanProgress: Animated.SharedValue<number>;
  isDark: boolean;
}

function FaceDot({ x, y, delay, scanProgress, isDark }: FaceDotProps) {
  const baseRadius = 2.5;
  const baseOpacity = 0.4;

  const animatedProps = useAnimatedProps(() => {
    // Calculate distance from scan line
    const scanY = interpolate(scanProgress.value, [0, 1], [0, SVG_SIZE]);
    const distance = Math.abs(y - scanY);
    const activationThreshold = 30;

    // Activation based on proximity to scan line
    const activation = Math.max(0, 1 - distance / activationThreshold);

    return {
      r: baseRadius + activation * 3, // Grow when activated
      opacity: baseOpacity + activation * 0.6, // Brighten when activated
    };
  });

  return (
    <AnimatedCircle
      cx={x}
      cy={y}
      fill={isDark ? '#818CF8' : '#6366F1'}
      animatedProps={animatedProps}
    />
  );
}

export function FaceScanVisual() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scanProgress = useSharedValue(0);

  useEffect(() => {
    // Start scanning animation
    scanProgress.value = withRepeat(
      withTiming(1, {
        duration: SCAN_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  // Scan line animated style
  const scanLineStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scanProgress.value,
      [0, 1],
      [-10, SVG_SIZE + 10]
    );
    const opacity = interpolate(
      scanProgress.value,
      [0, 0.1, 0.9, 1],
      [0, 1, 1, 0]
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
      }}
    >
      <View
        style={{
          width: SVG_SIZE,
          height: SVG_SIZE,
          position: 'relative',
        }}
      >
        {/* SVG Face Constellation */}
        <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
          <Defs>
            <LinearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="transparent" />
              <Stop offset="50%" stopColor={isDark ? '#818CF8' : '#6366F1'} stopOpacity="0.8" />
              <Stop offset="100%" stopColor="transparent" />
            </LinearGradient>
          </Defs>

          {/* Face dots */}
          {FACE_DOTS.map((dot, index) => (
            <FaceDot
              key={index}
              x={dot.x}
              y={dot.y}
              delay={dot.delay}
              scanProgress={scanProgress}
              isDark={isDark}
            />
          ))}
        </Svg>

        {/* Scan line overlay */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              height: 40,
            },
            scanLineStyle,
          ]}
        >
          {/* Main scan line */}
          <View
            style={{
              height: 2,
              backgroundColor: isDark ? '#818CF8' : '#6366F1',
              marginTop: 19,
              shadowColor: isDark ? '#818CF8' : '#6366F1',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 10,
              elevation: 5,
            }}
          />
          {/* Glow effect above line */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 20,
              backgroundColor: isDark
                ? 'rgba(129, 140, 248, 0.1)'
                : 'rgba(99, 102, 241, 0.1)',
            }}
          />
          {/* Glow effect below line */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 20,
              backgroundColor: isDark
                ? 'rgba(129, 140, 248, 0.1)'
                : 'rgba(99, 102, 241, 0.1)',
            }}
          />
        </Animated.View>

        {/* Corner decorations */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 24,
            height: 24,
            borderLeftWidth: 2,
            borderTopWidth: 2,
            borderColor: isDark ? 'rgba(129, 140, 248, 0.5)' : 'rgba(99, 102, 241, 0.5)',
            borderTopLeftRadius: 8,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 24,
            height: 24,
            borderRightWidth: 2,
            borderTopWidth: 2,
            borderColor: isDark ? 'rgba(129, 140, 248, 0.5)' : 'rgba(99, 102, 241, 0.5)',
            borderTopRightRadius: 8,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 24,
            height: 24,
            borderLeftWidth: 2,
            borderBottomWidth: 2,
            borderColor: isDark ? 'rgba(129, 140, 248, 0.5)' : 'rgba(99, 102, 241, 0.5)',
            borderBottomLeftRadius: 8,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 24,
            height: 24,
            borderRightWidth: 2,
            borderBottomWidth: 2,
            borderColor: isDark ? 'rgba(129, 140, 248, 0.5)' : 'rgba(99, 102, 241, 0.5)',
            borderBottomRightRadius: 8,
          }}
        />
      </View>
    </Animated.View>
  );
}
