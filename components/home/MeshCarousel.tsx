/**
 * MeshCarousel Component
 * Displays mesh/original image carousel with navigation arrows
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { Text } from '@/components/ui/text';

// ============================================
// TYPES
// ============================================

export interface MeshCarouselProps {
  /** Mesh image URI */
  meshUri: string;
  /** Original image URI */
  originalUri: string;
  /** Callback when index changes */
  onIndexChange?: (index: number) => void;
}

// ============================================
// CONSTANTS
// ============================================

const { width: screenWidth } = Dimensions.get('window');
const CAROUSEL_SIZE = screenWidth - 80;

// ============================================
// COMPONENT
// ============================================

export function MeshCarousel({
  meshUri,
  originalUri,
  onIndexChange,
}: MeshCarouselProps) {
  const { t } = useTranslation('home');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const carouselRef = useRef<any>(null);

  // Animation values
  const arrowScale = useSharedValue(1);
  const arrowTranslateX = useSharedValue(0);

  // Enhanced arrow animation: pulse + slide
  useEffect(() => {
    if (!hasInteracted) {
      arrowScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );

      arrowTranslateX.value = withRepeat(
        withSequence(
          withTiming(12, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      arrowScale.value = withTiming(1, { duration: 200 });
      arrowTranslateX.value = withTiming(0, { duration: 200 });
    }

    return () => {
      arrowScale.value = 1;
      arrowTranslateX.value = 0;
    };
  }, [hasInteracted]);

  const animatedArrowStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: arrowScale.value },
      { translateX: arrowTranslateX.value },
    ],
  }));

  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    onIndexChange?.(index);
  };

  const renderCarouselItem = ({ item }: { item: string }) => (
    <View className="flex-1 justify-center items-center">
      <Image
        source={{ uri: item }}
        style={{
          width: CAROUSEL_SIZE,
          height: CAROUSEL_SIZE,
          borderRadius: 16,
        }}
        resizeMode="contain"
      />
    </View>
  );

  const images = [meshUri, originalUri];

  return (
    <View className="mt-4">
      {/* Carousel Container */}
      <View className="items-center mb-4">
        <View
          style={{
            width: CAROUSEL_SIZE,
            height: CAROUSEL_SIZE,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <Carousel
            ref={carouselRef}
            data={images}
            renderItem={renderCarouselItem}
            width={CAROUSEL_SIZE}
            height={CAROUSEL_SIZE}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.95,
              parallaxScrollingOffset: 50,
            }}
            defaultIndex={0}
            loop={false}
            enabled={true}
            onSnapToItem={handleIndexChange}
          />

          {/* Right Arrow */}
          {currentIndex === 0 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  marginTop: -20,
                  zIndex: 10,
                },
                animatedArrowStyle,
              ]}
            >
              <Pressable
                onPress={() => carouselRef.current?.next({ animated: true })}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="chevron-forward-outline"
                  size={24}
                  color="#FFFFFF"
                />
              </Pressable>
            </Animated.View>
          )}

          {/* Left Arrow */}
          {currentIndex === 1 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  marginTop: -20,
                  zIndex: 10,
                },
                animatedArrowStyle,
              ]}
            >
              <Pressable
                onPress={() => carouselRef.current?.prev({ animated: true })}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="chevron-back-outline"
                  size={24}
                  color="#FFFFFF"
                />
              </Pressable>
            </Animated.View>
          )}
        </View>

        <Text className="text-muted-foreground text-xs mt-2">
          {t('analysis.swipeHint')}
        </Text>
      </View>
    </View>
  );
}
