import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { ComparisonResult } from '@/lib/comparison';
import { Ionicons } from '@expo/vector-icons';

interface ComparisonBadgeProps {
  comparison: ComparisonResult;
  size?: 'small' | 'medium' | 'large';
}

export function ComparisonBadge({
  comparison,
  size = 'medium',
}: ComparisonBadgeProps) {
  const { hasImproved, scoreChange, isFirstAnalysis, iconName, messageTr } = comparison;

  // Size variants
  const sizeClasses = {
    small: {
      container: 'px-3 py-1.5',
      iconSize: 18,
      text: 'text-xs',
      change: 'text-sm',
    },
    medium: {
      container: 'px-4 py-2',
      iconSize: 24,
      text: 'text-sm',
      change: 'text-base',
    },
    large: {
      container: 'px-5 py-3',
      iconSize: 32,
      text: 'text-base',
      change: 'text-xl',
    },
  };

  const classes = sizeClasses[size];

  // Background color based on status
  const bgColor = isFirstAnalysis
    ? 'bg-blue-100 border-blue-200'
    : hasImproved
      ? 'bg-green-100 border-green-200'
      : scoreChange === 0
        ? 'bg-yellow-100 border-yellow-200'
        : 'bg-orange-100 border-orange-200';

  // Text color
  const textColor = isFirstAnalysis
    ? 'text-blue-800'
    : hasImproved
      ? 'text-green-800'
      : scoreChange === 0
        ? 'text-yellow-800'
        : 'text-orange-800';

  // Icon color
  const iconColor = isFirstAnalysis
    ? '#1E40AF'
    : hasImproved
      ? '#15803D'
      : scoreChange === 0
        ? '#A16207'
        : '#C2410C';

  return (
    <View className={`${bgColor} border rounded-xl ${classes.container}`}>
      <View className="flex-row items-center">
        {/* Icon */}
        <Ionicons name={iconName as any} size={classes.iconSize} color={iconColor} />

        {/* Content */}
        <View className="ml-3 flex-1">
          {/* Change indicator */}
          {!isFirstAnalysis && scoreChange !== 0 && (
            <View className="flex-row items-center mb-0.5">
              <Text className={`font-bold ${textColor} ${classes.change}`}>
                {scoreChange > 0 ? '+' : ''}{scoreChange} puan
              </Text>
              <Text className={`${classes.text} text-muted-foreground ml-1`}>
                ({hasImproved ? 'artış' : 'düşüş'})
              </Text>
            </View>
          )}

          {/* Message */}
          <Text className={`${textColor} ${classes.text}`} numberOfLines={2}>
            {messageTr}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Inline badge for compact display
export function InlineComparisonBadge({
  comparison,
}: {
  comparison: ComparisonResult;
}) {
  const { hasImproved, scoreChange, isFirstAnalysis, iconName } = comparison;

  if (isFirstAnalysis) {
    return (
      <View className="flex-row items-center bg-blue-100 px-2 py-1 rounded-full">
        <Ionicons name={iconName as any} size={14} color="#1E40AF" />
        <Text className="text-xs text-blue-800 ml-1">İlk Analiz</Text>
      </View>
    );
  }

  if (scoreChange === 0) {
    return (
      <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full">
        <Ionicons name="arrow-forward-outline" size={14} color="#1F2937" />
        <Text className="text-xs text-gray-800 ml-1">Stabil</Text>
      </View>
    );
  }

  return (
    <View
      className={`flex-row items-center px-2 py-1 rounded-full ${
        hasImproved ? 'bg-green-100' : 'bg-red-100'
      }`}
    >
      <Ionicons
        name={hasImproved ? 'arrow-up-outline' : 'arrow-down-outline'}
        size={14}
        color={hasImproved ? '#15803D' : '#991B1B'}
      />
      <Text
        className={`text-xs font-semibold ml-1 ${
          hasImproved ? 'text-green-800' : 'text-red-800'
        }`}
      >
        {Math.abs(scoreChange)}
      </Text>
    </View>
  );
}

export default ComparisonBadge;
