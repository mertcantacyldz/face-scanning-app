import ExerciseGuideCard from '@/components/ExerciseGuideCard';
import { PremiumModal } from '@/components/PremiumModal';
import { ExerciseCard } from '@/components/progress/ExerciseCard';
import { ExerciseMonthCalendar } from '@/components/progress/ExerciseMonthCalendar';
import { MonthSelector } from '@/components/progress/MonthSelector';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { usePremium } from '@/hooks/use-premium';
import {
  getAvailableMonths,
  getRegionMonthlyStats,
  getTodayCompletedExercises,
  toggleExerciseCompletion,
  type MonthlyStats,
} from '@/lib/exercise-tracking';
import {
  getExercisesByRegion,
  getRegionIcon,
  getRegionTitle,
  type Exercise,
  type RegionId,
} from '@/lib/exercises';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, getDaysInMonth } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, FlatList, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;
const GUIDE_MODAL_STORAGE_KEY = 'exercise_guide_modal_shown';

const ExercisesScreen = () => {
  const { regionId } = useLocalSearchParams<{ regionId: string }>();
  const region = regionId as RegionId;
  const { t, i18n } = useTranslation('exercises');
  const { t: tRegion } = useTranslation('region');

  // Helper function to translate Turkish exercise text to English
  const translateExerciseText = (turkishText: string): string => {
    if (i18n.language === 'tr') return turkishText;

    return turkishText
      .replace(/saniye/g, 'seconds')
      .replace(/dakika/g, 'minute')
      .replace(/tekrar/g, 'reps')
      .replace(/tur/g, 'rounds')
      .replace(/döngü/g, 'cycles')
      .replace(/set/g, 'sets')
      .replace(/\(her taraf\)/g, '(each side)')
      .replace(/\(her yön\)/g, '(each direction)');
  };

  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollHintScale = useRef(new Animated.Value(1)).current;

  // Monthly tracking state
  const [monthlyStats, setMonthlyStats] = useState<Map<string, MonthlyStats>>(new Map());
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Premium check
  const { isPremium, freeAnalysisRegion } = usePremium();

  const title = getRegionTitle(region); // Keep for backwards compatibility
  const translatedTitle = tRegion(`names.${region}`); // Translated region name
  const icon = getRegionIcon(region);
  const exercises = getExercisesByRegion(region);

  // Check if this region is accessible for free users
  const hasAccess = isPremium || freeAnalysisRegion === region;

  // Check if guide modal should be shown on first visit
  useEffect(() => {
    checkFirstVisit();
  }, []);

  // Load monthly data on mount and when month changes
  useEffect(() => {
    loadMonthlyData();
  }, [selectedMonth, region]);

  async function checkFirstVisit() {
    try {
      const hasShown = await AsyncStorage.getItem(GUIDE_MODAL_STORAGE_KEY);
      if (!hasShown) {
        // Small delay to let the page load first
        setTimeout(() => {
          setShowGuideModal(true);
        }, 500);
      }
    } catch (error) {
      console.log('Error checking guide modal state:', error);
    }
  }

  async function handleCloseGuideModal(dontShowAgain: boolean = false) {
    setShowGuideModal(false);
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem(GUIDE_MODAL_STORAGE_KEY, 'true');
      } catch (error) {
        console.log('Error saving guide modal state:', error);
      }
    }
  }

  async function loadMonthlyData() {
    setLoadingStats(true);
    try {
      const exerciseIds = exercises.map(ex => ex.id);
      const stats = await getRegionMonthlyStats(region, selectedMonth, exerciseIds);
      const months = await getAvailableMonths();

      // Convert to Map for easy lookup
      const statsMap = new Map(stats.exerciseStats.map(s => [s.exerciseId, s]));
      setMonthlyStats(statsMap);
      setAvailableMonths(months);

      // Load today's completed exercises
      const todayCompleted = await getTodayCompletedExercises(region);
      setCompletedExercises(todayCompleted);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoadingStats(false);
    }
  }

  // Pulse animation for scroll hint
  useEffect(() => {
    if (!hasScrolled && exercises.length > 1) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scrollHintScale, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scrollHintScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [hasScrolled, exercises.length]);

  const handleExercisePress = (_exercise: Exercise, index: number) => {
    // Allow viewing detail even for locked exercises (they'll see premium CTA in carousel)
    setSelectedExerciseIndex(index);
    setCurrentIndex(index);
    // Scroll will happen in useEffect after modal opens
  };

  // Scroll to selected exercise when modal opens
  useEffect(() => {
    if (selectedExerciseIndex !== null && flatListRef.current) {
      // Small delay to ensure FlatList is mounted
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedExerciseIndex,
          animated: false,
        });
      }, 100);
    }
  }, [selectedExerciseIndex]);

  const handleCompleteExercise = async (exerciseId: string, index: number) => {
    // Only allow completing first exercise for free users with access
    if (!isPremium && index > 0) {
      setShowPremiumModal(true);
      return;
    }

    if (!isPremium && !hasAccess) {
      setShowPremiumModal(true);
      return;
    }

    // Prevent completing if already completed today
    if (completedExercises.has(exerciseId)) {
      // Already completed today, do nothing
      return;
    }

    try {
      // Complete in database (not toggle anymore, only add)
      const wasCompleted = await toggleExerciseCompletion(exerciseId, region);

      // Update UI state immediately (optimistic update)
      if (wasCompleted) {
        setCompletedExercises((prev) => {
          const next = new Set(prev);
          next.add(exerciseId);
          return next;
        });
      }

      // Reload monthly stats to update counts
      await loadMonthlyData();
    } catch (error) {
      console.error('Error completing exercise:', error);
      // Revert optimistic update on error
      await loadMonthlyData();
    }
  };

  const handleCloseDetail = () => {
    setSelectedExerciseIndex(null);
  };

  // Calculate progress
  const completedCount = completedExercises.size;
  const totalCount = isPremium ? exercises.length : (hasAccess ? 1 : 0);
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center mr-3"
          >
            <Text className="text-2xl">←</Text>
          </Pressable>
          <View className="w-14 h-14 bg-primary/10 rounded-full items-center justify-center mr-4">
            <Image source={icon} style={{ width: 32, height: 32 }} resizeMode="contain" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold">{translatedTitle}</Text>
            <Text className="text-muted-foreground">{t('header.subtitle')}</Text>
          </View>
        </View>

        {/* No Access Warning for Free Users */}
        {!hasAccess && !isPremium && (
          <Card className="p-5 mb-6 bg-red-50 border-2 border-red-200">
            <View className="items-center">
              <Ionicons name="lock-closed-outline" size={48} color="#991B1B" style={{ marginBottom: 12 }} />
              <Text className="text-lg font-bold text-red-800 text-center mb-2">
                {t('noAccess.title')}
              </Text>
              <Text className="text-sm text-red-700 text-center mb-4">
                {t('noAccess.description', { region: translatedTitle })}
              </Text>
              <Pressable
                onPress={() => setShowPremiumModal(true)}
                className="bg-primary px-6 py-3 rounded-lg active:opacity-80"
              >
                <View className="flex-row items-center">
                  <Ionicons name="diamond-outline" size={18} color="#FFFFFF" />
                  <Text className="text-primary-foreground font-semibold ml-2">
                    {t('noAccess.upgradeButton')}
                  </Text>
                </View>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Progress Card (Only if has access) */}
        {hasAccess && (
          <Card className="p-3 mb-4 bg-primary/5 border border-primary/20">
            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-base font-bold text-foreground">
                  {t('progress.title')}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {t('progress.completed', { completed: completedCount, total: totalCount })}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">
                  {progressPercent}%
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          </Card>
        )}

        {/* Exercise Guide Info Card */}
        {hasAccess && (
          <ExerciseGuideCard />
        )}

        {/* Exercises List */}
        {hasAccess && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold">
                {isPremium
                  ? t('list.title', { count: exercises.length })
                  : t('list.titleFree', { current: 1, total: exercises.length })
                }
              </Text>
              {!isPremium && (
                <Pressable
                  onPress={() => setShowPremiumModal(true)}
                  className="bg-primary/10 px-3 py-1 rounded-full"
                >
                  <Text className="text-primary text-xs font-semibold">
                    {t('list.premiumBadge', { count: exercises.length - 1 })}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Horizontal scroll layout for both Premium and Freemium */}
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16, gap: 16 }}
                onScroll={() => !hasScrolled && setHasScrolled(true)}
                scrollEventThrottle={16}
              >
                {exercises.map((exercise, index) => {
                  const isUnlocked = isPremium || index === 0;
                  const difficultyColors = {
                    easy: { bg: 'bg-green-100', text: 'text-green-800', label: t('list.difficulty.easy') },
                    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('list.difficulty.medium') },
                    hard: { bg: 'bg-red-100', text: 'text-red-800', label: t('list.difficulty.hard') },
                  };
                  const difficulty = difficultyColors[exercise.difficulty];
                  const steps = i18n.language === 'tr' ? exercise.stepsTr : exercise.steps;
                  const firstTwoSteps = steps.slice(0, 2);
                  const hasMoreSteps = steps.length > 2;

                  return (
                    <View key={exercise.id} style={{ width: screenWidth - 80 }}>
                      {isUnlocked ? (
                        // Unlocked exercise with detailed preview
                        <Pressable onPress={() => handleExercisePress(exercise, index)} className="active:opacity-70">
                          <Card className={`p-4 border ${completedExercises.has(exercise.id) ? 'bg-success/10 border-success/30' : 'bg-card border-border'}`}>
                            {/* Icon */}
                            <View className="items-center mb-3">
                              <Text className="text-5xl">{exercise.icon}</Text>
                            </View>

                            {/* Title + Difficulty */}
                            <Text className="text-lg font-bold text-center mb-2 text-foreground">
                              {i18n.language === 'tr' ? exercise.titleTr : exercise.title}
                            </Text>
                            <View className="flex-row items-center justify-center mb-3">
                              <View className={`${difficulty.bg} px-2 py-0.5 rounded-full`}>
                                <Text className={`text-xs font-semibold ${difficulty.text}`}>
                                  {difficulty.label}
                                </Text>
                              </View>
                              <Text className="text-xs text-muted-foreground ml-2">
                                {translateExerciseText(exercise.duration)} • {translateExerciseText(exercise.repetitions)}
                              </Text>
                            </View>

                            {/* Description */}
                            <Text className="text-sm text-muted-foreground text-center mb-3">
                              {i18n.language === 'tr' ? exercise.descriptionTr : exercise.description}
                            </Text>

                            {/* First 2 steps preview */}
                            <View className="bg-muted/50 rounded-lg p-3 mb-3">
                              <Text className="text-xs font-semibold text-foreground mb-2">{t('list.stepsLabel')}</Text>
                              <Text className="text-xs text-foreground">1. {firstTwoSteps[0]}</Text>
                              <Text className="text-xs text-foreground mt-1">2. {firstTwoSteps[1]}</Text>
                              {hasMoreSteps && (
                                <Text className="text-xs text-primary mt-1">{t('list.moreSteps', { count: steps.length - 2 })}</Text>
                              )}
                            </View>

                            {/* Call to action */}
                            <View className="flex-row items-center justify-center bg-primary/10 py-2 rounded-lg">
                              <Text className="text-primary font-semibold text-sm">{t('list.viewDetails')}</Text>
                              <Ionicons name="chevron-forward" size={16} color="#8B5CF6" style={{ marginLeft: 4 }} />
                            </View>

                            {/* Completed badge */}
                            {completedExercises.has(exercise.id) && (
                              <View className="absolute top-4 right-4 w-8 h-8 bg-success rounded-full items-center justify-center">
                                <Text className="text-success-foreground text-lg">✓</Text>
                              </View>
                            )}
                          </Card>
                        </Pressable>
                      ) : (
                        // Locked exercise - Bigger version
                        <Pressable
                          onPress={() => handleExercisePress(exercise, index)}
                          className="active:opacity-70"
                        >
                          <Card className="p-4 border-2 border-border bg-muted/50 relative" style={{ height: 320 }}>
                            {/* Lock overlay */}
                            <View className="absolute inset-0 bg-background/85 z-10 items-center justify-center">
                              <View className="items-center">
                                <Ionicons name="lock-closed-outline" size={40} color="#6B7280" style={{ marginBottom: 8 }} />
                                <Text className="font-bold text-foreground mb-1">Premium</Text>
                                <Text className="text-xs text-muted-foreground text-center px-4">{t('list.clickToView')}</Text>
                              </View>
                            </View>

                            {/* Blurred preview */}
                            <View style={{ opacity: 0.15 }}>
                              <Text className="text-4xl text-center mb-3">{exercise.icon}</Text>
                              <Text className="font-bold text-center mb-2">████████</Text>
                              <Text className="text-xs text-center mb-2">████████████</Text>
                            </View>
                          </Card>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Scroll hint indicator - shows when there are more than 1 exercise and user hasn't scrolled yet */}
              {exercises.length > 1 && !hasScrolled && (
                <Animated.View
                  className="absolute right-2 top-1/3 pointer-events-none"
                  style={{
                    transform: [{ scale: scrollHintScale }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5
                  }}
                >
                  <View className="bg-primary w-10 h-10 rounded-full items-center justify-center">
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
        )}

        {/* Motivation Card - Importance of Exercise Tracking */}
        {hasAccess && (
          <Card className="p-4 mb-6 bg-primary/5 border border-primary/20">
            <View className="flex-row items-start">
              <Ionicons name="trophy-outline" size={24} color="#8B5CF6" style={{ marginRight: 10 }} />
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground mb-2">
                  {t('motivation.title')}
                </Text>
                <View className="gap-1.5">
                  <View className="flex-row items-start">
                    <Text className="text-muted-foreground mr-1.5">•</Text>
                    <Text className="flex-1 text-sm text-muted-foreground">
                      <Text className="font-semibold text-foreground">{t('motivation.point1.highlight')}</Text>
                      {t('motivation.point1.text')}
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-muted-foreground mr-1.5">•</Text>
                    <Text className="flex-1 text-sm text-muted-foreground">
                      <Text className="font-semibold text-foreground">{t('motivation.point2.highlight')}</Text>
                      {t('motivation.point2.text')}
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-muted-foreground mr-1.5">•</Text>
                    <Text className="flex-1 text-sm text-muted-foreground">
                      <Text className="font-semibold text-foreground">{t('motivation.point3.highlight')}</Text>
                      {t('motivation.point3.text')}
                    </Text>
                  </View>
                </View>
                {!isPremium && (
                  <View className="mt-2.5 p-2.5 bg-muted rounded-lg">
                    <View className="flex-row items-center">
                      <Ionicons name="diamond-outline" size={12} color="#8B5CF6" style={{ marginRight: 6 }} />
                      <Text className="text-xs text-muted-foreground font-semibold flex-1">
                        {t('motivation.premiumNote', { count: exercises.length })}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}


        {/* All Complete Card */}
        {hasAccess && completedCount === totalCount && totalCount > 0 && (
          <Card className="p-6 bg-success/10 border-2 border-success/30 items-center">
            <Ionicons name="trophy-outline" size={56} color="#10B981" style={{ marginBottom: 12 }} />
            <Text className="text-xl font-bold text-foreground text-center mb-2">
              {t('completion.title')}
            </Text>
            <Text className="text-muted-foreground text-center">
              {isPremium
                ? t('completion.messagePremium')
                : t('completion.messageFree')}
            </Text>
            {!isPremium && (
              <Pressable
                onPress={() => setShowPremiumModal(true)}
                className="mt-4 bg-primary px-6 py-3 rounded-lg active:opacity-80"
              >
                <View className="flex-row items-center">
                  <Ionicons name="diamond-outline" size={18} color="#FFFFFF" />
                  <Text className="text-primary-foreground font-semibold ml-2">
                    {t('completion.upgradeButton')}
                  </Text>
                </View>
              </Pressable>
            )}
          </Card>
        )}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Exercise Detail Carousel */}
      {selectedExerciseIndex !== null && (
        <SafeAreaView className="absolute inset-0 bg-background" edges={['top']}>
          <View className="flex-1">
            {/* Header with pagination */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Pressable onPress={handleCloseDetail} className="w-10 h-10 items-center justify-center">
                <Text className="text-2xl">←</Text>
              </Pressable>
              <Text className="text-sm text-muted-foreground">
                {currentIndex + 1} / {exercises.length}
              </Text>
            </View>

            {/* Swipeable carousel */}
            <FlatList
              style={{ flex: 1 }}
              ref={flatListRef}
              data={exercises}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              getItemLayout={(data, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                setCurrentIndex(index);
              }}
              keyExtractor={(item) => item.id}
              renderItem={({ item: exercise, index }) => {
                const isUnlocked = isPremium || index === 0;

                return (

                  <ScrollView style={{ width: screenWidth }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}>
                    {isUnlocked ? (
                      // Unlocked exercise detail
                      <>
                        <Text className="text-2xl font-bold text-foreground mb-1">
                          {i18n.language === 'tr' ? exercise.titleTr : exercise.title}
                        </Text>
                        <Text className="text-muted-foreground mb-6">{t('detail.subtitle', { region: translatedTitle })}</Text>

                        {/* Monthly Progress Calendar */}
                        <View className="mb-6  flex  gap-4">
                          <MonthSelector
                            availableMonths={availableMonths}
                            selectedMonth={selectedMonth}
                            onMonthChange={setSelectedMonth}
                            completionPercentage={monthlyStats.get(exercise.id)?.completionPercentage || 0}
                            daysCompleted={monthlyStats.get(exercise.id)?.daysCompleted || 0}
                            totalDays={monthlyStats.get(exercise.id)?.totalDaysInMonth || getDaysInMonth(new Date())}
                          />

                          <ExerciseMonthCalendar
                            monthYear={selectedMonth}
                            completedDates={monthlyStats.get(exercise.id)?.completedDates || []}
                            isVisible={currentIndex === index}
                          />
                        </View>

                        <ExerciseCard exercise={exercise} isCompleted={completedExercises.has(exercise.id)} />

                        {/* Daily Recommendation Notice */}
                        <View className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <View className="flex-row items-start">
                            <Ionicons name="calendar-outline" size={16} color="#8B5CF6" />
                            <Text className="text-sm text-muted-foreground ml-2 flex-1">
                              {i18n.language === 'tr'
                                ? <>Bu egzersizi günde <Text className="font-bold text-foreground">{exercise.repetitions}</Text> yapmanız önerilir.</>
                                : <>It's recommended to do this exercise <Text className="font-bold text-foreground">{translateExerciseText(exercise.repetitions)}</Text> per day.</>
                              }
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      // Locked exercise detail
                      <Card className="p-6 bg-muted/50 border-2 border-border" style={{ minHeight: 400 }}>
                        <View className="items-center">
                          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
                            <Ionicons name="lock-closed-outline" size={40} color="#8B5CF6" />
                          </View>

                          <Text className="text-2xl font-bold text-foreground mb-2">{i18n.language === 'tr' ? exercise.titleTr : exercise.title}</Text>
                          <Text className="text-muted-foreground text-center mb-6">
                            {t('detail.premiumOnly')}
                          </Text>

                          {/* Preview blur */}
                          <View className="w-full bg-background/50 rounded-lg p-4 mb-6" style={{ opacity: 0.5 }}>
                            <Text className="text-sm text-foreground">████████████████</Text>
                            <Text className="text-sm text-foreground mt-2">████████████████</Text>
                            <Text className="text-sm text-foreground mt-2">████████████████</Text>
                          </View>

                          {/* Premium CTA */}
                          <Pressable
                            onPress={() => setShowPremiumModal(true)}
                            className="bg-primary px-8 py-4 rounded-lg active:opacity-80"
                          >
                            <View className="flex-row items-center">
                              <Ionicons name="diamond-outline" size={20} color="#FFFFFF" />
                              <Text className="text-primary-foreground font-bold ml-2">{t('completion.upgradeButton')}</Text>
                            </View>
                          </Pressable>

                          <Text className="text-xs text-muted-foreground text-center mt-4">
                            {t('detail.unlockAll', { count: exercises.length })}
                          </Text>
                        </View>
                      </Card>
                    )}

                    <View className="h-24" />
                  </ScrollView>

                );
              }}
            />

            {/* Sticky bottom button (only for unlocked exercises) */}
            {(isPremium || currentIndex === 0) && (
              <View className="p-4 border-t border-border bg-background">
                <Pressable
                  onPress={() => {
                    handleCompleteExercise(exercises[currentIndex].id, currentIndex);
                  }}
                  disabled={completedExercises.has(exercises[currentIndex].id)}
                  className={`py-4 rounded-lg items-center ${completedExercises.has(exercises[currentIndex].id)
                    ? 'bg-muted opacity-60'
                    : 'bg-success active:opacity-80'
                    }`}
                >
                  <View className="flex-row items-center">
                    {completedExercises.has(exercises[currentIndex].id) && (
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 8 }} />
                    )}
                    <Text
                      className={`font-bold ${completedExercises.has(exercises[currentIndex].id)
                        ? 'text-muted-foreground'
                        : 'text-success-foreground'
                        }`}
                    >
                      {completedExercises.has(exercises[currentIndex].id)
                        ? t('detail.completedToday')
                        : t('detail.complete')}
                    </Text>
                  </View>
                </Pressable>

                {/* Info message when completed */}
                {completedExercises.has(exercises[currentIndex].id) && (
                  <View className="mt-2 px-2">
                    <Text className="text-xs text-center text-muted-foreground">
                      {t('detail.alreadyCompleted')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      )}

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature={t('premiumModal.feature')}
        featureIconName="barbell-outline"
      />

      {/* Exercise Guide Modal - First Time Visit */}
      <Modal
        visible={showGuideModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => handleCloseGuideModal()}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View
            className="bg-background rounded-2xl w-full"
            style={{
              maxWidth: 500,
              height: Dimensions.get('window').height * 0.85
            }}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={24} color="#8B5CF6" />
                <Text className="text-lg font-bold text-foreground ml-2">
                  {t('guide.modalTitle', { defaultValue: 'Welcome!' })}
                </Text>
              </View>
              <Pressable onPress={() => handleCloseGuideModal()} className="w-8 h-8 items-center justify-center">
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Modal Content - Scrollable */}
            <ScrollView
              className="flex-1 p-4"
              showsVerticalScrollIndicator={true}
            >
              <ExerciseGuideCard hideHeader={true} />
            </ScrollView>

            {/* Modal Footer */}
            <View className="p-4 border-t border-border gap-3">
              <Pressable
                onPress={() => handleCloseGuideModal(true)}
                className="bg-primary py-3 rounded-lg active:opacity-80"
              >
                <Text className="text-primary-foreground font-semibold text-center">
                  {t('guide.modalDontShowAgain', { defaultValue: "Got it, don't show again" })}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleCloseGuideModal(false)}
                className="bg-muted py-3 rounded-lg active:opacity-80"
              >
                <Text className="text-foreground font-semibold text-center">
                  {t('guide.modalClose', { defaultValue: 'Close' })}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ExercisesScreen;
