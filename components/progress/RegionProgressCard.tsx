import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { RegionId } from '@/lib/exercises';
import { getRegionTitle, getRegionTitleEn } from '@/lib/exercises';
import { FACE_REGIONS } from '@/lib/face-prompts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, View } from 'react-native';

interface RegionProgressCardProps {
  regionId: RegionId;
  latestScore: number | null;
  previousScore: number | null;
  analysisCount: number;
  lastAnalysisDate: string | null;
  onPress: () => void;
}

export function RegionProgressCard({
  regionId,
  latestScore,
  previousScore,
  analysisCount,
  lastAnalysisDate,
  onPress,
}: RegionProgressCardProps) {
  const { t, i18n } = useTranslation('region');
  const title = i18n.language === 'tr' ? getRegionTitle(regionId) : getRegionTitleEn(regionId);
  const region = FACE_REGIONS.find((r) => r.id === regionId);

  // Calculate change
  const hasChange = latestScore !== null && previousScore !== null;
  const change = hasChange ? latestScore - previousScore : 0;
  const changePercent = hasChange && previousScore > 0
    ? Math.round((change / previousScore) * 100)
    : 0;

  // Score color
  const scoreColor =
    latestScore === null
      ? 'text-muted-foreground'
      : latestScore >= 7
        ? 'text-green-600'
        : latestScore >= 4
          ? 'text-yellow-600'
          : 'text-red-600';

  // Change color
  const changeColor =
    change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground';

  // Format last analysis date
  const formattedDate = lastAnalysisDate
    ? new Date(lastAnalysisDate).toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
    })
    : null;

  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card className="p-3 bg-card border border-border" style={{ minHeight: 216 }}>
        <View className="flex-col">
          {/* Title */}
          <Text className="text-sm font-bold text-foreground mb-2">{title}</Text>

          {/* Icon */}
          <View className="items-center mb-2">
            {region?.icon && (
              <Image
                source={region.icon}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Score */}
          <View className="items-center mb-2">
            {latestScore !== null ? (
              <View className="flex-row items-center">
                <Text className={`text-2xl font-bold ${scoreColor}`}>
                  {latestScore}
                </Text>
                <Text className="text-sm text-muted-foreground">/10</Text>

                {/* Change indicator */}
                {hasChange && change !== 0 && (
                  <Text className={`text-sm font-semibold ml-2 ${changeColor}`}>
                    {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}
                  </Text>
                )}
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground">
                {t('card.noAnalysis')}
              </Text>
            )}
          </View>

          {/* Meta info */}
          <View className="items-center">
            <Text className="text-xs text-muted-foreground text-center">
              {t('header.analysisCount', { count: analysisCount })}
            </Text>
            {formattedDate && (
              <Text className="text-xs text-muted-foreground text-center">
                {t('card.lastDate', { date: formattedDate })}
              </Text>
            )}
          </View>
        </View>

        {/* Progress bar */}
        {latestScore !== null && (
          <View className="mt-3">
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <View
                className={`h-full ${latestScore >= 7
                  ? 'bg-green-500'
                  : latestScore >= 4
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                  }`}
                style={{ width: `${latestScore * 10}%` }}
              />
            </View>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

export default RegionProgressCard;
