// Exercise Month Calendar Component
// Horizontal scrollable calendar showing 1-30/31 days with completion marks

import { Text } from '@/components/ui/text';
import { getDayFromDateString, getDaysInMonthYear, getLocalDateString } from '@/lib/exercise-tracking';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';

interface ExerciseMonthCalendarProps {
  monthYear: string; // 'YYYY-MM'
  completedDates: number[]; // [3, 4, 7, 15, ...] - day numbers
  onDayPress?: (dayNumber: number) => void; // Optional: for manual marking
  showOnlyCurrentMonth?: boolean; // If true, disable future days
  isVisible?: boolean; // If true, component is visible in carousel
}

export function ExerciseMonthCalendar({
  monthYear,
  completedDates,
  onDayPress,
  showOnlyCurrentMonth = true,
  isVisible = true,
}: ExerciseMonthCalendarProps) {
  const { t } = useTranslation('progress');
  const scrollViewRef = useRef<ScrollView>(null);
  const hasScrolledRef = useRef(false);
const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Calculate initial scroll position
  const getInitialScrollPosition = () => {
    if (!isCurrentMonth || !todayDayNumber || !isVisible) {
      return 0;
    }

    const itemWidth = 56;
    const screenWidth = Dimensions.get('window').width;
    const contentWidth = totalDays * itemWidth;
    const maxScrollX = Math.max(0, contentWidth - screenWidth);
    const scrollPosition = (todayDayNumber - 1) * itemWidth - screenWidth / 2 + itemWidth / 2;
    const clampedScrollPosition = Math.min(Math.max(0, scrollPosition), maxScrollX);

    console.log('📍 Initial scroll position calculated:', { clampedScrollPosition, todayDayNumber });

    return clampedScrollPosition;
  };

  // Scroll handler triggered by onLayout
  const handleScrollViewLayout = useCallback(() => {
    if (!isCurrentMonth || !todayDayNumber || hasScrolledRef.current || !isVisible) {
      return;
    }

    console.log('📐 ScrollView onLayout (isVisible=true), scheduling scroll...');

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Wait for layout to fully complete - try with longer delay
    scrollTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Timeout fired, checking ref...', {
        hasRef: !!scrollViewRef.current,
        refType: typeof scrollViewRef.current,
      });

      if (!scrollViewRef.current) {
        console.log('❌ Ref null in timeout - retrying in 200ms');
        // One more retry with longer delay
        scrollTimeoutRef.current = setTimeout(() => {
          console.log('🔁 Retry - checking ref again...', {
            hasRef: !!scrollViewRef.current,
          });

          if (!scrollViewRef.current) {
            console.log('❌ Ref still null after retry - giving up');
            return;
          }

          if (hasScrolledRef.current) {
            return;
          }

          const itemWidth = 56;
          const screenWidth = Dimensions.get('window').width;
          const contentWidth = totalDays * itemWidth;
          const maxScrollX = Math.max(0, contentWidth - screenWidth);
          const scrollPosition = (todayDayNumber - 1) * itemWidth - screenWidth / 2 + itemWidth / 2;
          const clampedScrollPosition = Math.min(Math.max(0, scrollPosition), maxScrollX);

          console.log('✅ SCROLLING (after retry):', { clampedScrollPosition, maxScrollX, todayDayNumber });

          scrollViewRef.current.scrollTo({
            x: clampedScrollPosition,
            animated: true,
          });

          hasScrolledRef.current = true;
        }, 200);
        return;
      }

      if (hasScrolledRef.current) {
        return;
      }

      const itemWidth = 56;
      const screenWidth = Dimensions.get('window').width;
      const contentWidth = totalDays * itemWidth;
      const maxScrollX = Math.max(0, contentWidth - screenWidth);
      const scrollPosition = (todayDayNumber - 1) * itemWidth - screenWidth / 2 + itemWidth / 2;
      const clampedScrollPosition = Math.min(Math.max(0, scrollPosition), maxScrollX);

      console.log('✅ SCROLLING:', { clampedScrollPosition, maxScrollX, todayDayNumber });

      scrollViewRef.current.scrollTo({
        x: clampedScrollPosition,
        animated: true,
      });

      hasScrolledRef.current = true;
    }, 100);
  }, [isCurrentMonth, todayDayNumber, isVisible, totalDays]);

  // Reset scroll flag when month changes
  useEffect(() => {
    hasScrolledRef.current = false;

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [monthYear]);

  // Trigger scroll when component becomes visible
  useEffect(() => {
    if (isVisible && isCurrentMonth && todayDayNumber && !hasScrolledRef.current) {
      console.log('👁️ Component became visible, triggering scroll...');
      // Trigger layout to initiate scroll
      handleScrollViewLayout();
    }
  }, [isVisible, isCurrentMonth, todayDayNumber, handleScrollViewLayout]);

  return (
    <View className="bg-card rounded-lg border border-border p-3">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 0, flexDirection: 'row', gap: 8 }}
        contentOffset={{ x: getInitialScrollPosition(), y: 0 }}
        onLayout={handleScrollViewLayout}
        collapsable={false}
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
