/**
 * PremiumPromotionCard Component
 * Displays premium upgrade promotion with benefits
 */

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { GlassCard } from './GlassCard';

// ============================================
// TYPES
// ============================================

export interface PremiumPromotionCardProps {
  /** Animation delay for entrance */
  delay?: number;
  /** Callback when upgrade button pressed */
  onUpgradePress?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function PremiumPromotionCard({
  delay = 400,
  onUpgradePress,
}: PremiumPromotionCardProps) {
  const { t } = useTranslation('home');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <GlassCard
      delay={delay}
      borderGradient="premium"
      intensity="medium"
      style={{ padding: 24, marginTop: 24 }}
    >
      <View className="items-center">
        {/* Header */}
        <View className="flex-row items-center justify-center gap-2 mb-3">
          <Ionicons name="diamond-outline" size={20} color="#F59E0B" />
          <Text
            style={{
              color: isDark ? '#FCD34D' : '#D97706',
              fontWeight: '700',
              fontSize: 18,
            }}
          >
            {t('premium.title')}
          </Text>
        </View>

        {/* Benefits */}
        <Text
          style={{
            color: isDark ? '#94A3B8' : '#64748B',
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t('premium.benefits')}
        </Text>

        {/* Upgrade Button */}
        <Button
          onPress={onUpgradePress}
          style={{
            backgroundColor: '#F59E0B',
            width: '100%',
          }}
        >
          <Text style={{ color: '#1E293B', fontWeight: '700' }}>
            {t('premium.button')}
          </Text>
        </Button>
      </View>
    </GlassCard>
  );
}
