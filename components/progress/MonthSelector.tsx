// Month Selector Component
// Allows users to select different months to view exercise history

import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { format, parse } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

interface MonthSelectorProps {
  availableMonths: string[]; // ['2026-01', '2025-12', ...] in descending order
  selectedMonth: string; // 'YYYY-MM'
  onMonthChange: (monthYear: string) => void;
  // Optional completion stats to display
  completionPercentage?: number;
  daysCompleted?: number;
  totalDays?: number;
}

/**
 * Format month-year string to display format based on language
 * '2026-01' -> 'January 2026' (en) or 'Ocak 2026' (tr)
 */
function formatMonthYear(monthYear: string, language: string): string {
  const date = parse(monthYear, 'yyyy-MM', new Date());
  const locale = language === 'tr' ? tr : enUS;
  return format(date, 'MMMM yyyy', { locale });
}

export function MonthSelector({
  availableMonths,
  selectedMonth,
  onMonthChange,
  completionPercentage,
  daysCompleted,
  totalDays,
}: MonthSelectorProps) {
  const { i18n } = useTranslation();

  // Find current index in available months
  const currentIndex = availableMonths.indexOf(selectedMonth);
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;

  const goToPreviousMonth = () => {
    if (hasPrevious) {
      onMonthChange(availableMonths[currentIndex + 1]);
    }
  };

  const goToNextMonth = () => {
    if (hasNext) {
      onMonthChange(availableMonths[currentIndex - 1]);
    }
  };

  return (
    <View className="flex-row items-center bg-muted/50 rounded-lg px-2 py-1.5">
      {/* Previous Month Button */}
      <Pressable
        onPress={goToPreviousMonth}
        disabled={!hasPrevious}
        className="w-8 h-8 items-center justify-center active:opacity-50"
      >
        <Ionicons
          name="chevron-back"
          size={18}
          color={hasPrevious ? '#6B7280' : '#D1D5DB'}
        />
      </Pressable>

      {/* Current Month Display with Stats */}
      <View className="flex-1 items-center px-2">
        <Text className="text-sm font-semibold text-foreground">
          {formatMonthYear(selectedMonth, i18n.language)}
        </Text>
        {/* Show completion stats if provided */}
        {(completionPercentage !== undefined || (daysCompleted !== undefined && totalDays !== undefined)) && (
          <View className="flex-row items-center gap-2 mt-0.5">
            {completionPercentage !== undefined && (
              <Text className="text-xs font-bold text-primary">
                {completionPercentage}%
              </Text>
            )}
            {daysCompleted !== undefined && totalDays !== undefined && (
              <Text className="text-xs text-muted-foreground">
                {daysCompleted}/{totalDays}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Next Month Button */}
      <Pressable
        onPress={goToNextMonth}
        disabled={!hasNext}
        className="w-8 h-8 items-center justify-center active:opacity-50"
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={hasNext ? '#6B7280' : '#D1D5DB'}
        />
      </Pressable>
    </View>
  );
}

export default MonthSelector;
