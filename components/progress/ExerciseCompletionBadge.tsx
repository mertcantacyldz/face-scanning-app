// Exercise Completion Badge Component
// Shows completion percentage with color coding

import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

interface ExerciseCompletionBadgeProps {
  completionPercentage: number; // 0-100
  compact?: boolean; // Compact version for small spaces
}

/**
 * Get color classes based on completion percentage
 */
function getCompletionColors(percentage: number) {
  if (percentage >= 67) {
    // High completion (67-100%): Green/Success
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      ring: 'bg-green-500',
    };
  } else if (percentage >= 34) {
    // Medium completion (34-66%): Yellow/Warning
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      ring: 'bg-yellow-500',
    };
  } else {
    // Low completion (0-33%): Red/Danger
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      ring: 'bg-red-500',
    };
  }
}

export function ExerciseCompletionBadge({
  completionPercentage,
  compact = false,
}: ExerciseCompletionBadgeProps) {
  const colors = getCompletionColors(completionPercentage);

  if (compact) {
    // Compact version: just percentage in a small pill
    return (
      <View className={`${colors.bg} px-2 py-0.5 rounded-full border ${colors.border}`}>
        <Text className={`text-xs font-bold ${colors.text}`}>
          %{completionPercentage}
        </Text>
      </View>
    );
  }

  // Full version: circular progress indicator
  return (
    <View className="items-center">
      {/* Circular progress ring */}
      <View className="relative w-16 h-16 items-center justify-center">
        {/* Background circle */}
        <View className="absolute w-16 h-16 rounded-full bg-muted border-2 border-border" />

        {/* Progress arc (simplified with overlay) */}
        <View
          className={`absolute w-16 h-16 rounded-full ${colors.ring}`}
          style={{
            opacity: 0.2 + (completionPercentage / 100) * 0.6, // 0.2 to 0.8 opacity based on percentage
          }}
        />

        {/* Percentage text */}
        <View className="absolute items-center">
          <Text className="text-xl font-bold text-foreground">
            {completionPercentage}
          </Text>
          <Text className="text-xs text-muted-foreground">%</Text>
        </View>
      </View>

      {/* Label */}
      <Text className="text-xs text-muted-foreground mt-1">Tamamlanma</Text>
    </View>
  );
}

export default ExerciseCompletionBadge;
