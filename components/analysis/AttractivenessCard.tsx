/**
 * AttractivenessCard Component
 * Displays the overall attractiveness score
 */

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { getScoreLabelTr } from '@/lib/attractiveness';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

// ============================================
// TYPES
// ============================================

export interface AttractivenessCardProps {
  /** The attractiveness score (0-10) */
  score: number;
  /** Whether the user has premium access */
  isPremium: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function AttractivenessCard({
  score,
  isPremium,
}: AttractivenessCardProps) {
  const { t } = useTranslation('analysis');

  return (
    <Card className="mb-6 p-5 bg-primary/10 border border-primary/20">
      <View className="flex-row items-center justify-between">
        {/* Score Info */}
        <View>
          <Text className="text-sm text-muted-foreground mb-1">
            {t('score.overall')}
          </Text>
          <Text className="text-3xl font-bold text-foreground">
            {score.toFixed(1)}/10
          </Text>
          <Text className="text-sm text-primary font-medium">
            {getScoreLabelTr(score)}
          </Text>
        </View>

        {/* Icon */}
        <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center">
          <Ionicons name="sparkles-outline" size={40} color="#8B5CF6" />
        </View>
      </View>

      {/* Premium Upgrade Hint */}
      {!isPremium && (
        <View className="flex-row items-center mt-3">
          <Ionicons name="diamond-outline" size={12} color="#6B7280" />
          <Text className="text-xs text-muted-foreground ml-1">
            {t('score.upgradePremium')}
          </Text>
        </View>
      )}
    </Card>
  );
}
