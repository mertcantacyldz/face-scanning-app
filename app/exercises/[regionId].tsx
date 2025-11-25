import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { ExerciseCard } from '@/components/progress/ExerciseCard';
import {
  getRegionTitle,
  getRegionIcon,
  getExercisesByRegion,
  type RegionId,
  type Exercise,
} from '@/lib/exercises';
import { usePremium } from '@/hooks/use-premium';
import { PremiumModal } from '@/components/PremiumModal';

const ExercisesScreen = () => {
  const { regionId } = useLocalSearchParams<{ regionId: string }>();
  const region = regionId as RegionId;

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Premium check
  const { isPremium, freeAnalysisRegion } = usePremium();

  const title = getRegionTitle(region);
  const icon = getRegionIcon(region);
  const exercises = getExercisesByRegion(region);

  // Check if this region is accessible for free users
  const hasAccess = isPremium || freeAnalysisRegion === region;

  const handleExercisePress = (exercise: Exercise, index: number) => {
    // First exercise is unlocked for free users who have access to this region
    if (!isPremium && index > 0) {
      setShowPremiumModal(true);
      return;
    }

    if (!isPremium && !hasAccess) {
      setShowPremiumModal(true);
      return;
    }

    setSelectedExercise(exercise);
  };

  const handleCompleteExercise = (exerciseId: string, index: number) => {
    // Only allow completing first exercise for free users with access
    if (!isPremium && index > 0) {
      setShowPremiumModal(true);
      return;
    }

    if (!isPremium && !hasAccess) {
      setShowPremiumModal(true);
      return;
    }

    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const handleCloseDetail = () => {
    setSelectedExercise(null);
  };

  // Calculate progress
  const completedCount = completedExercises.size;
  const totalCount = isPremium ? exercises.length : (hasAccess ? 1 : 0);
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View className="flex-1 bg-background">
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
            <Text className="text-3xl">{icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold">{title}</Text>
            <Text className="text-muted-foreground">Egzersizler</Text>
          </View>
        </View>

        {/* No Access Warning for Free Users */}
        {!hasAccess && !isPremium && (
          <Card className="p-5 mb-6 bg-red-50 border-2 border-red-200">
            <View className="items-center">
              <Text className="text-4xl mb-3">🔒</Text>
              <Text className="text-lg font-bold text-red-800 text-center mb-2">
                Bu Bölge Kilitli
              </Text>
              <Text className="text-sm text-red-700 text-center mb-4">
                {title} egzersizlerine erişmek için önce bu bölgenin analizini yapmalısınız veya Premium'a geçmelisiniz.
              </Text>
              <Pressable
                onPress={() => setShowPremiumModal(true)}
                className="bg-primary px-6 py-3 rounded-lg active:opacity-80"
              >
                <Text className="text-primary-foreground font-semibold">
                  👑 Premium'a Geç
                </Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Progress Card (Only if has access) */}
        {hasAccess && (
          <Card className="p-5 mb-6 bg-green-50 border-2 border-green-500/20">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-lg font-bold text-foreground">
                  Bugünkü İlerleme
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {completedCount}/{totalCount} egzersiz tamamlandı
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-bold text-green-600">
                  {progressPercent}%
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          </Card>
        )}

        {/* Motivation Card - Importance of Exercise Tracking */}
        {hasAccess && (
          <Card className="p-5 mb-6 bg-purple-50 border-2 border-purple-200">
            <View className="flex-row items-start">
              <Text className="text-3xl mr-3">🎯</Text>
              <View className="flex-1">
                <Text className="text-lg font-bold text-purple-900 mb-2">
                  Neden Düzenli Egzersiz Önemli?
                </Text>
                <Text className="text-sm text-purple-800 mb-2">
                  • <Text className="font-semibold">Tek egzersiz yetmez</Text> - Tüm bölge kaslarını çalıştırmalısınız
                </Text>
                <Text className="text-sm text-purple-800 mb-2">
                  • <Text className="font-semibold">Düzen sihirdir</Text> - Günlük 10 dakika, 3 ayda dramatik sonuçlar
                </Text>
                <Text className="text-sm text-purple-800 mb-2">
                  • <Text className="font-semibold">İlerlemeyi takip edin</Text> - Tamamlanan egzersizler motivasyonu artırır
                </Text>
                {!isPremium && (
                  <View className="mt-3 p-3 bg-purple-100 rounded-lg">
                    <Text className="text-xs text-purple-900 font-semibold">
                      💎 Premium'da: Tüm {exercises.length} egzersizi açın, ilerlemenizi grafiklerle takip edin
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Info Card */}
        {hasAccess && (
          <Card className="p-4 mb-6 bg-blue-50 border border-blue-200">
            <Text className="text-sm text-blue-800">
              💡 <Text className="font-semibold">İpucu:</Text> Egzersizleri
              sabah ve akşam olmak üzere günde 2 kez yapmanız önerilir. Her seans sadece 5-10 dakika sürer.
            </Text>
          </Card>
        )}

        {/* Exercises List */}
        {hasAccess && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold">
                Egzersizler ({isPremium ? exercises.length : `1/${exercises.length}`})
              </Text>
              {!isPremium && (
                <Pressable
                  onPress={() => setShowPremiumModal(true)}
                  className="bg-primary/10 px-3 py-1 rounded-full"
                >
                  <Text className="text-primary text-xs font-semibold">
                    + {exercises.length - 1} Daha
                  </Text>
                </Pressable>
              )}
            </View>

            <View className="gap-4">
              {exercises.map((exercise, index) => {
                // First exercise is unlocked for free users
                const isUnlocked = isPremium || index === 0;

                if (!isUnlocked) {
                  // Locked exercises - Blurred
                  return (
                    <Pressable
                      key={exercise.id}
                      onPress={() => setShowPremiumModal(true)}
                      className="active:opacity-70"
                    >
                      <Card className="p-5 border-2 border-border bg-muted/50 relative overflow-hidden">
                        {/* Blur overlay */}
                        <View className="absolute inset-0 bg-background/60 z-10 items-center justify-center">
                          <View className="items-center">
                            <Text className="text-4xl mb-2">🔒</Text>
                            <Text className="text-sm font-bold text-foreground">Premium</Text>
                          </View>
                        </View>

                        {/* Blurred content */}
                        <View style={{ opacity: 0.3 }}>
                          <View className="flex-row items-start">
                            <View className="w-14 h-14 bg-primary/10 rounded-full items-center justify-center mr-4">
                              <Text className="text-3xl">{exercise.icon}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-lg font-bold text-foreground blur-sm">
                                ████████████
                              </Text>
                              <Text className="text-sm text-muted-foreground mt-1 blur-sm">
                                ████████████████████
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  );
                }

                // Unlocked exercise
                return (
                  <View key={exercise.id}>
                    <ExerciseCard
                      exercise={exercise}
                      isCompleted={completedExercises.has(exercise.id)}
                      onPress={() => handleExercisePress(exercise, index)}
                      showOnlyPreview={!isPremium && index === 0} // Show first 2 steps for free
                    />

                    {/* Complete button */}
                    <Pressable
                      onPress={() => handleCompleteExercise(exercise.id, index)}
                      className={`mt-2 py-3 rounded-lg items-center ${
                        completedExercises.has(exercise.id)
                          ? 'bg-gray-200'
                          : 'bg-green-500'
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          completedExercises.has(exercise.id)
                            ? 'text-gray-600'
                            : 'text-white'
                        }`}
                      >
                        {completedExercises.has(exercise.id)
                          ? '✓ Tamamlandı'
                          : 'Tamamla'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* All Complete Card */}
        {hasAccess && completedCount === totalCount && totalCount > 0 && (
          <Card className="p-6 bg-green-50 border-2 border-green-200 items-center">
            <Text className="text-5xl mb-3">🎉</Text>
            <Text className="text-xl font-bold text-green-800 text-center mb-2">
              Tebrikler!
            </Text>
            <Text className="text-green-700 text-center">
              {isPremium
                ? 'Bugünkü tüm egzersizleri tamamladınız. Yarın tekrar görüşmek üzere!'
                : 'Ücretsiz egzersizi tamamladınız! Premium ile tüm egzersizleri açın.'}
            </Text>
            {!isPremium && (
              <Pressable
                onPress={() => setShowPremiumModal(true)}
                className="mt-4 bg-primary px-6 py-3 rounded-lg active:opacity-80"
              >
                <Text className="text-primary-foreground font-semibold">
                  👑 Premium'a Geç
                </Text>
              </Pressable>
            )}
          </Card>
        )}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Exercise Detail Modal (Premium only or first exercise) */}
      {selectedExercise && (
        <View className="absolute inset-0 bg-background">
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            {/* Header */}
            <View className="flex-row items-center mb-6">
              <Pressable
                onPress={handleCloseDetail}
                className="w-10 h-10 items-center justify-center mr-3"
              >
                <Text className="text-2xl">←</Text>
              </Pressable>
              <View>
                <Text className="text-2xl font-bold">
                  {selectedExercise.titleTr}
                </Text>
                <Text className="text-muted-foreground">{title}</Text>
              </View>
            </View>

            {/* Full Exercise Card */}
            <ExerciseCard
              exercise={selectedExercise}
              isCompleted={completedExercises.has(selectedExercise.id)}
            />

            {/* Action Button */}
            <Pressable
              onPress={() => {
                const index = exercises.findIndex(e => e.id === selectedExercise.id);
                handleCompleteExercise(selectedExercise.id, index);
                handleCloseDetail();
              }}
              className={`mt-6 py-4 rounded-lg items-center ${
                completedExercises.has(selectedExercise.id)
                  ? 'bg-gray-200'
                  : 'bg-green-500'
              }`}
            >
              <Text
                className={`text-lg font-semibold ${
                  completedExercises.has(selectedExercise.id)
                    ? 'text-gray-600'
                    : 'text-white'
                }`}
              >
                {completedExercises.has(selectedExercise.id)
                  ? '✓ Tamamlandı Olarak İşaretlendi'
                  : 'Egzersizi Tamamla'}
              </Text>
            </Pressable>

            <View className="h-8" />
          </ScrollView>
        </View>
      )}

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="Tüm Egzersizler"
        featureIcon="💪"
      />
    </View>
  );
};

export default ExercisesScreen;
