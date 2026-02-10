/**
 * HeroLayout Component
 * Initial hero screen with face scan visual and CTA button
 */

import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { Dimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FaceScanVisual } from './FaceScanVisual';
import { FeatureHighlight, FeatureHighlightsRow } from './FeatureHighlight';
import { GlassCard } from './GlassCard';
import { PulsingButton } from './PulsingButton';
import { StatusPill } from './StatusPill';

// ============================================
// TYPES
// ============================================

export interface HeroLayoutProps {
  /** Whether MediaPipe is ready */
  mediaPipeReady: boolean;
  /** Tab bar height for bottom spacing */
  tabBarHeight: number;
  /** Callback when scan button is pressed */
  onStartScan: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;

// ============================================
// COMPONENT
// ============================================

export function HeroLayout({
  mediaPipeReady,
  tabBarHeight,
  onStartScan,
}: HeroLayoutProps) {
  const { t } = useTranslation('home');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-1 px-4 pb-5 justify-between">
      <View className="flex-1 pt-2">
        {/* Status Pill */}
        <View className="mb-4">
          <StatusPill
            isReady={mediaPipeReady}
            readyText={t('aiStatus.ready')}
            loadingText={t('aiStatus.loading')}
          />
        </View>

        {/* Face Scan Visual */}
        <FaceScanVisual />

        {/* Hero Text - Responsive margins */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          style={{
            alignItems: 'center',
            marginTop: isSmallScreen ? 16 : 32,
            marginBottom: isSmallScreen ? 8 : 12,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: isDark ? '#F1F5F9' : '#1E293B',
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            {t('hero.tagline')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: isDark ? '#94A3B8' : '#64748B',
              textAlign: 'center',
            }}
          >
            {t('hero.subtitle')}
          </Text>
        </Animated.View>

        {/* Feature Highlights */}
        <View className="mt-2">
          <FeatureHighlightsRow>
            <FeatureHighlight
              icon="git-network-outline"
              label={t('features.points')}
              color="primary"
              delay={300}
            />
            <FeatureHighlight
              icon="shield-checkmark-outline"
              label={t('features.privacy')}
              color="accent"
              delay={400}
            />
            <FeatureHighlight
              icon="sparkles-outline"
              label={t('features.aiPowered')}
              color="premium"
              delay={500}
            />
          </FeatureHighlightsRow>
        </View>
      </View>

      {/* CTA Section - Pushed to bottom with dynamic tab bar spacing */}
      <View style={{ marginBottom: tabBarHeight + 20 }}>
        <GlassCard
          delay={600}
          borderGradient="primary"
          intensity="medium"
          style={{ padding: 24 }}
        >
          <Text
            style={{
              fontSize: 15,
              color: isDark ? '#94A3B8' : '#64748B',
              textAlign: 'center',
              marginBottom: 20,
              lineHeight: 22,
            }}
          >
            {t('cta.description')}
          </Text>

          {/* Single Scan Button */}
          <PulsingButton
            onPress={onStartScan}
            disabled={!mediaPipeReady}
            title={mediaPipeReady ? t('cta.button') : t('cta.buttonLoading')}
            icon="scan"
          />

          {/* Privacy note */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 16,
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={14}
              color={isDark ? '#64748B' : '#94A3B8'}
            />
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#64748B' : '#94A3B8',
                marginLeft: 6,
              }}
            >
              {t('cta.disclaimer')}
            </Text>
          </View>
        </GlassCard>
      </View>
    </View>
  );
}
