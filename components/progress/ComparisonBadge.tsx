import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { ComparisonResult } from '@/lib/comparison';

interface ComparisonBadgeProps {
  comparison: ComparisonResult;
  size?: 'small' | 'medium' | 'large';
}

export function ComparisonBadge({
  comparison,
  size = 'medium',
}: ComparisonBadgeProps) {
  const { hasImproved, scoreChange, isFirstAnalysis, emoji, messageTr } = comparison;

  // Size variants
  const sizeClasses = {
    small: {
      container: 'px-3 py-1.5',
      emoji: 'text-lg',
      text: 'text-xs',
      change: 'text-sm',
    },
    medium: {
      container: 'px-4 py-2',
      emoji: 'text-2xl',
      text: 'text-sm',
      change: 'text-base',
    },
    large: {
      container: 'px-5 py-3',
      emoji: 'text-3xl',
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

  return (
    <View className={`${bgColor} border rounded-xl ${classes.container}`}>
      <View className="flex-row items-center">
        {/* Emoji */}
        <Text className={classes.emoji}>{emoji}</Text>

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
  const { hasImproved, scoreChange, isFirstAnalysis, emoji } = comparison;

  if (isFirstAnalysis) {
    return (
      <View className="flex-row items-center bg-blue-100 px-2 py-1 rounded-full">
        <Text className="text-sm">{emoji}</Text>
        <Text className="text-xs text-blue-800 ml-1">İlk Analiz</Text>
      </View>
    );
  }

  if (scoreChange === 0) {
    return (
      <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full">
        <Text className="text-sm">➡️</Text>
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
      <Text className="text-sm">{hasImproved ? '↑' : '↓'}</Text>
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
