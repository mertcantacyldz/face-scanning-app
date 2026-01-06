// Month Selector Component
// Allows users to select different months to view exercise history

import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { parse, format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface MonthSelectorProps {
  availableMonths: string[]; // ['2026-01', '2025-12', ...] in descending order
  selectedMonth: string; // 'YYYY-MM'
  onMonthChange: (monthYear: string) => void;
}

// Turkish month names
const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

/**
 * Format month-year string to Turkish display format
 * '2026-01' -> 'Ocak 2026'
 */
function formatMonthYearTr(monthYear: string): string {
  const [year, month] = monthYear.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  return `${MONTH_NAMES_TR[monthIndex]} ${year}`;
}

export function MonthSelector({
  availableMonths,
  selectedMonth,
  onMonthChange,
}: MonthSelectorProps) {
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

      {/* Current Month Display */}
      <View className="flex-1 items-center px-2">
        <Text className="text-sm font-semibold text-foreground">
          {formatMonthYearTr(selectedMonth)}
        </Text>
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
