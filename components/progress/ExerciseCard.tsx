import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { Exercise } from '@/lib/exercises';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { ExerciseCompletionBadge } from './ExerciseCompletionBadge';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  isCompleted?: boolean;
  compact?: boolean;
  showOnlyPreview?: boolean; // Show only first 2 steps for free users
  completionPercentage?: number; // Optional: show completion badge (0-100)
}

export function ExerciseCard({
  exercise,
  onPress,
  isCompleted = false,
  compact = false,
  showOnlyPreview = false,
  completionPercentage,
}: ExerciseCardProps) {
  const { i18n, t } = useTranslation('exercises');

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

  // Difficulty colors
  const difficultyColors = {
    easy: { bg: 'bg-green-100', text: 'text-green-800', label: t('list.difficulty.easy') },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('list.difficulty.medium') },
    hard: { bg: 'bg-red-100', text: 'text-red-800', label: t('list.difficulty.hard') },
  };

  const difficulty = difficultyColors[exercise.difficulty];

  if (compact) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        <Card
          className={`p-3 border ${isCompleted
            ? 'bg-green-50 border-green-200'
            : 'bg-card border-border'
            }`}
        >
          <View className="flex-row items-center">
            {/* Icon */}
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
              <Text className="text-xl">{exercise.icon}</Text>
            </View>

            {/* Content */}
            <View className="flex-1">
              <Text className="font-semibold text-foreground">
                {i18n.language === 'tr' ? exercise.titleTr : exercise.title}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-xs text-muted-foreground">
                  {translateExerciseText(exercise.duration)}
                </Text>
                <Text className="text-xs text-muted-foreground mx-1">•</Text>
                <Text className="text-xs text-muted-foreground">
                  {translateExerciseText(exercise.repetitions)}
                </Text>
              </View>
            </View>

            {/* Status */}
            {completionPercentage !== undefined ? (
              <ExerciseCompletionBadge completionPercentage={completionPercentage} compact />
            ) : isCompleted ? (
              <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center">
                <Text className="text-white text-lg">✓</Text>
              </View>
            ) : (
              <Text className="text-xl text-muted-foreground">›</Text>
            )}
          </View>
        </Card>
      </Pressable>
    );
  }

  // Determine which steps to show
  const steps = i18n.language === 'tr' ? exercise.stepsTr : exercise.steps;
  const stepsToShow = showOnlyPreview
    ? steps.slice(0, 2)
    : steps;
  const hasHiddenSteps = showOnlyPreview && steps.length > 2;

  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card
        className={`p-5 border ${isCompleted
          ? 'bg-success/10 border-success/30'
          : 'bg-card border-border'
          }`}
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View className="w-14 h-14 bg-primary/10 rounded-full items-center justify-center mr-4">
              <Text className="text-3xl">{exercise.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">
                {i18n.language === 'tr' ? exercise.titleTr : exercise.title}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className={`${difficulty.bg} px-2 py-0.5 rounded-full mr-2`}>
                  <Text className={`text-xs font-semibold ${difficulty.text}`}>
                    {difficulty.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {isCompleted && (
            <View className="w-8 h-8 bg-success rounded-full items-center justify-center">
              <Text className="text-success-foreground text-lg">✓</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text className="text-sm text-muted-foreground mb-3">
          {i18n.language === 'tr' ? exercise.descriptionTr : exercise.description}
        </Text>

        {/* Purpose - Why this exercise */}
        <View className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <View className="flex-row items-start">
            <Text className="text-base mr-2">🎯</Text>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground mb-1">
                {i18n.language === 'tr' ? 'Neden Bu Egzersiz?' : 'Why This Exercise?'}
              </Text>
              <Text className="text-xs text-muted-foreground leading-relaxed">
                {i18n.language === 'tr' ? exercise.purposeTr : exercise.purpose}
              </Text>
            </View>
          </View>
        </View>

        {/* Duration & Reps */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-muted/50 p-3 rounded-lg mr-2">
            <Text className="text-xs text-muted-foreground mb-1">{i18n.language === 'tr' ? 'Süre' : 'Duration'}</Text>
            <Text className="font-semibold text-foreground">
              {translateExerciseText(exercise.duration)}
            </Text>
          </View>
          <View className="flex-1 bg-muted/50 p-3 rounded-lg ml-2">
            <Text className="text-xs text-muted-foreground mb-1">{i18n.language === 'tr' ? 'Tekrar' : 'Reps'}</Text>
            <Text className="font-semibold text-foreground">
              {translateExerciseText(exercise.repetitions)}
            </Text>
          </View>
        </View>

        {/* Steps */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            {i18n.language === 'tr' ? 'Adımlar' : 'Steps'}
          </Text>
          <View className="gap-2">
            {stepsToShow.map((step, index) => (
              <View key={index} className="flex-row">
                <View className="w-6 h-6 bg-primary/20 rounded-full items-center justify-center mr-3">
                  <Text className="text-xs font-bold text-primary">
                    {index + 1}
                  </Text>
                </View>
                <Text className="flex-1 text-sm text-foreground leading-relaxed">
                  {step}
                </Text>
              </View>
            ))}

            {/* Hidden steps notice for free users */}
            {hasHiddenSteps && (
              <View className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <View className="flex-row items-center">
                  <Text className="text-xl mr-2">🔒</Text>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-yellow-900">
                      {i18n.language === 'tr'
                        ? `${steps.length - 2} Adım Daha Var`
                        : `${steps.length - 2} More Steps`
                      }
                    </Text>
                    <Text className="text-xs text-yellow-800">
                      {i18n.language === 'tr'
                        ? 'Tüm adımları görmek için Premium\'a geçin'
                        : 'Upgrade to Premium to see all steps'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Benefits */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">
            {i18n.language === 'tr' ? 'Faydaları' : 'Benefits'}
          </Text>
          <View className="gap-1">
            {(i18n.language === 'tr' ? exercise.benefitsTr : exercise.benefits).map((benefit, index) => (
              <View key={index} className="flex-row items-center">
                <Text className="text-green-500 mr-2">✓</Text>
                <Text className="text-sm text-muted-foreground">{benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default ExerciseCard;
