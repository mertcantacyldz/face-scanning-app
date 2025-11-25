import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import type { RegionId } from '@/lib/exercises';
import { getRegionTitle, getRegionIcon } from '@/lib/exercises';

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
  const title = getRegionTitle(regionId);
  const icon = getRegionIcon(regionId);

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
    ? new Date(lastAnalysisDate).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card className="p-4 bg-card border border-border">
        <View className="flex-row items-center">
          {/* Icon */}
          <View className="w-14 h-14 bg-primary/10 rounded-full items-center justify-center mr-4">
            <Text className="text-3xl">{icon}</Text>
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">{title}</Text>

            {/* Stats row */}
            <View className="flex-row items-center mt-1">
              {latestScore !== null ? (
                <>
                  <Text className={`text-2xl font-bold ${scoreColor}`}>
                    {latestScore}
                  </Text>
                  <Text className="text-sm text-muted-foreground">/10</Text>

                  {/* Change indicator */}
                  {hasChange && change !== 0 && (
                    <View className="flex-row items-center ml-3">
                      <Text className={`text-sm font-semibold ${changeColor}`}>
                        {change > 0 ? '↑' : '↓'} {Math.abs(change)}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text className="text-sm text-muted-foreground">
                  Henüz analiz yok
                </Text>
              )}
            </View>

            {/* Meta info */}
            <View className="flex-row items-center mt-1">
              <Text className="text-xs text-muted-foreground">
                {analysisCount} analiz
              </Text>
              {formattedDate && (
                <>
                  <Text className="text-xs text-muted-foreground mx-1">•</Text>
                  <Text className="text-xs text-muted-foreground">
                    Son: {formattedDate}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Arrow */}
          <View className="ml-2">
            <Text className="text-2xl text-muted-foreground">›</Text>
          </View>
        </View>

        {/* Progress bar */}
        {latestScore !== null && (
          <View className="mt-3">
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <View
                className={`h-full ${
                  latestScore >= 7
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
