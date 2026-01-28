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

// Face constellation dots - coordinates for face outline
const FACE_DOTS = [
  // Head top
  { x: 100, y: 15, delay: 0 },
  { x: 75, y: 20, delay: 50 },
  { x: 125, y: 20, delay: 50 },
  { x: 55, y: 35, delay: 100 },
  { x: 145, y: 35, delay: 100 },

  // Forehead
  { x: 70, y: 50, delay: 150 },
  { x: 100, y: 45, delay: 150 },
  { x: 130, y: 50, delay: 150 },

  // Eyebrows
  { x: 60, y: 70, delay: 200 },
  { x: 75, y: 65, delay: 200 },
  { x: 90, y: 68, delay: 200 },
  { x: 110, y: 68, delay: 200 },
  { x: 125, y: 65, delay: 200 },
  { x: 140, y: 70, delay: 200 },

  // Eyes
  { x: 68, y: 85, delay: 250 },
  { x: 82, y: 85, delay: 250 },
  { x: 118, y: 85, delay: 250 },
  { x: 132, y: 85, delay: 250 },

  // Nose
  { x: 100, y: 95, delay: 300 },
  { x: 100, y: 110, delay: 300 },
  { x: 90, y: 120, delay: 350 },
  { x: 100, y: 125, delay: 350 },
  { x: 110, y: 120, delay: 350 },

  // Mouth
  { x: 80, y: 145, delay: 400 },
  { x: 95, y: 150, delay: 400 },
  { x: 100, y: 152, delay: 400 },
  { x: 105, y: 150, delay: 400 },
  { x: 120, y: 145, delay: 400 },

  // Jawline left
  { x: 45, y: 55, delay: 450 },
  { x: 40, y: 80, delay: 450 },
  { x: 42, y: 110, delay: 500 },
  { x: 50, y: 140, delay: 500 },
  { x: 65, y: 165, delay: 550 },
  { x: 85, y: 180, delay: 550 },

  // Chin
  { x: 100, y: 185, delay: 600 },

  // Jawline right
  { x: 115, y: 180, delay: 550 },
  { x: 135, y: 165, delay: 550 },
  { x: 150, y: 140, delay: 500 },
  { x: 158, y: 110, delay: 500 },
  { x: 160, y: 80, delay: 450 },
  { x: 155, y: 55, delay: 450 },
];

const SVG_WIDTH = 160;
const SVG_HEIGHT = 160;
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
    const scanY = interpolate(scanProgress.value, [0, 1], [0, SVG_HEIGHT]);
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
      [-10, SVG_HEIGHT + 10]
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
          width: SVG_WIDTH,
          height: SVG_HEIGHT,
          position: 'relative',
        }}
      >
        {/* SVG Face Constellation */}
        <Svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
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
