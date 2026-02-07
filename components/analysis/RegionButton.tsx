/**
 * RegionButton Component
 * Displays a face region analysis card with lock/unlock state
 */

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { FaceRegion } from '@/lib/face-prompts';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

// ============================================
// TYPES
// ============================================

export interface RegionButtonProps {
  /** The face region to display */
  region: FaceRegion;
  /** Whether this region is unlocked for the user */
  isUnlocked: boolean;
  /** Whether this region is currently being analyzed */
  isAnalyzing: boolean;
  /** Whether the user has premium access */
  isPremium: boolean;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Whether buttons are disabled (e.g., during any analysis) */
  disabled?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function RegionButton({
  region,
  isUnlocked,
  isAnalyzing,
  isPremium,
  onPress,
  disabled = false,
}: RegionButtonProps) {
  const { t } = useTranslation(['analysis', 'common']);
  const isLocked = !isUnlocked;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="active:opacity-70"
      style={{ width: '48%', marginBottom: 16 }}
    >
      <Card
        className={`p-3 border bg-card ${isLocked ? 'border-border/50 opacity-80' : 'border-border'}`}
        style={{ height: 205 }}
      >
        {/* Icon */}
        <View
          className={`w-14 h-14 rounded-full items-center justify-center mb-2 ${
            isLocked ? 'bg-muted' : 'bg-primary/10'
          }`}
        >
          {typeof region.icon === 'string' ? (
            <Text className="text-3xl">{region.icon}</Text>
          ) : (
            <Image
              source={region.icon}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Title Row */}
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="text-base font-bold flex-shrink"
              numberOfLines={1}
            >
              {t(`regions.${region.id}.title`)}
            </Text>

            {/* Status Icon */}
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : isLocked ? (
              <Ionicons name="diamond-outline" size={18} color="#9CA3AF" />
            ) : (
              <Ionicons name="scan" size={20} color="#8B5CF6" />
            )}
          </View>

          {/* Locked Badge */}
          {isLocked && (
            <View className="flex-row items-center mb-1">
              <Ionicons
                name="lock-closed"
                size={10}
                color="#9CA3AF"
                style={{ marginRight: 4 }}
              />
              <Text className="text-xs text-muted-foreground">
                {t('locked', { ns: 'common', defaultValue: 'Locked' })}
              </Text>
            </View>
          )}

          {/* Free Badge - Only show if unlocked but not premium */}
          {isUnlocked && !isPremium && (
            <View className="bg-green-100 px-2 py-0.5 rounded-full self-start mb-1">
              <Text className="text-xs text-green-700 font-medium">
                {t('freeBadge')}
              </Text>
            </View>
          )}

          {/* Description */}
          <Text
            className="text-xs text-muted-foreground"
            numberOfLines={2}
          >
            {t(`regions.${region.id}.description`)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
