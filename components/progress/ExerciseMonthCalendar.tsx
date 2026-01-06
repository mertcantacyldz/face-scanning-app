// Exercise Month Calendar Component
// Horizontal scrollable calendar showing 1-30/31 days with completion marks

import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { getDaysInMonthYear, getLocalDateString, getDayFromDateString } from '@/lib/exercise-tracking';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseMonthCalendarProps {
  monthYear: string; // 'YYYY-MM'
  completedDates: number[]; // [3, 4, 7, 15, ...] - day numbers
  onDayPress?: (dayNumber: number) => void; // Optional: for manual marking
  showOnlyCurrentMonth?: boolean; // If true, disable future days
}

export function ExerciseMonthCalendar({
  monthYear,
  completedDates,
  onDayPress,
  showOnlyCurrentMonth = true,
}: ExerciseMonthCalendarProps) {
  const { t } = useTranslation('progress');

  // Get total days in this month
  const totalDays = getDaysInMonthYear(monthYear);

  // Get today's info for highlighting
  const today = new Date();
  const todayString = getLocalDateString(today);
  const todayDayNumber = getDayFromDateString(todayString);
  const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = monthYear === currentMonthYear;

  // Create array of day numbers [1, 2, 3, ..., 30/31]
  const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <View className="bg-card rounded-lg border border-border p-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {dayNumbers.map((dayNumber) => {
          const isCompleted = completedDates.includes(dayNumber);
          const isToday = isCurrentMonth && dayNumber === todayDayNumber;
          const isFuture = isCurrentMonth && dayNumber > todayDayNumber;
          const isDisabled = showOnlyCurrentMonth && isFuture;

          return (
            <Pressable
              key={dayNumber}
              onPress={() => {
                if (!isDisabled && onDayPress) {
                  onDayPress(dayNumber);
                }
              }}
              disabled={isDisabled || !onDayPress}
              className="active:opacity-70"
            >
              <View
                className={`
                  w-12 h-12 rounded-full items-center justify-center
                  ${isCompleted ? 'bg-green-500' : 'bg-muted'}
                  ${isToday ? 'border-2 border-primary' : 'border border-border'}
                  ${isDisabled ? 'opacity-40' : 'opacity-100'}
                `}
              >
                {/* Day number */}
                <Text
                  className={`
                    text-sm font-semibold
                    ${isCompleted ? 'text-white' : isDisabled ? 'text-muted-foreground' : 'text-foreground'}
                  `}
                >
                  {dayNumber}
                </Text>

                {/* Checkmark for completed days */}
                {isCompleted && (
                  <View className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full items-center justify-center">
                    <Ionicons name="checkmark" size={12} color="white" />
                  </View>
                )}

                {/* Today indicator */}
                {isToday && !isCompleted && (
                  <View className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View className="flex-row items-center justify-center mt-3 pt-3 border-t border-border gap-4">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-green-500 mr-1.5" />
          <Text className="text-xs text-muted-foreground">{t('exerciseStats.calendar.completed')}</Text>
        </View>
        {isCurrentMonth && (
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full border-2 border-primary bg-muted mr-1.5" />
            <Text className="text-xs text-muted-foreground">{t('exerciseStats.calendar.today')}</Text>
          </View>
        )}
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-muted border border-border mr-1.5" />
          <Text className="text-xs text-muted-foreground">{t('exerciseStats.calendar.notDone')}</Text>
        </View>
      </View>
    </View>
  );
}

export default ExerciseMonthCalendar;
