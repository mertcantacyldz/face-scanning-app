/**
 * FreeUserRightsCard Component
 * Displays remaining free analysis rights for non-premium users
 */

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

// ============================================
// TYPES
// ============================================

export interface FreeUserRightsCardProps {
  /** Number of remaining free analysis rights */
  remainingRights: number;
  /** Total free rights allowed */
  totalRights?: number;
  /** Callback when spin button is pressed */
  onSpinPress: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function FreeUserRightsCard({
  remainingRights,
  totalRights = 3,
  onSpinPress,
}: FreeUserRightsCardProps) {
  const { t } = useTranslation('analysis');
  const hasRights = remainingRights > 0;

  return (
    <Card
      className={`mb-6 p-4 border-2 ${
        hasRights
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <View className="flex-row items-center justify-between">
        {/* Left: Counter and Info */}
        <View className="flex-row items-center flex-1">
          {/* Counter Circle */}
          <View
            className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
              hasRights ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <Text
              className={`text-xl font-bold ${
                hasRights ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {remainingRights}
            </Text>
          </View>

          {/* Text Info */}
          <View className="flex-1">
            <Text
              className={`font-bold text-lg ${
                hasRights ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {hasRights
                ? t('freeAnalysis.rightsAvailable')
                : t('freeAnalysis.noRights')}
            </Text>
            <Text
              className={`text-sm ${
                hasRights ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {hasRights
                ? t('freeAnalysis.rightsDescription', {
                    count: remainingRights,
                    total: totalRights,
                  })
                : t('freeAnalysis.upgradeDescription')}
            </Text>
          </View>
        </View>

        {/* Right: Spin Button (only if has rights) */}
        {hasRights && (
          <Pressable
            onPress={onSpinPress}
            className="bg-green-600 px-3 py-1.5 rounded-full active:opacity-80"
          >
            <Text className="text-white text-xs font-bold">
              {t('spinWheel.button')}
            </Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}
