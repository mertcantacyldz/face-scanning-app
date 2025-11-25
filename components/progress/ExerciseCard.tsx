import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import type { Exercise } from '@/lib/exercises';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  isCompleted?: boolean;
  compact?: boolean;
  showOnlyPreview?: boolean; // Show only first 2 steps for free users
}

export function ExerciseCard({
  exercise,
  onPress,
  isCompleted = false,
  compact = false,
  showOnlyPreview = false,
}: ExerciseCardProps) {
  // Difficulty colors
  const difficultyColors = {
    easy: { bg: 'bg-green-100', text: 'text-green-800', label: 'Kolay' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Orta' },
    hard: { bg: 'bg-red-100', text: 'text-red-800', label: 'Zor' },
  };

  const difficulty = difficultyColors[exercise.difficulty];

  if (compact) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        <Card
          className={`p-3 border ${
            isCompleted
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
                {exercise.titleTr}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-xs text-muted-foreground">
                  {exercise.duration}
                </Text>
                <Text className="text-xs text-muted-foreground mx-1">•</Text>
                <Text className="text-xs text-muted-foreground">
                  {exercise.repetitions}
                </Text>
              </View>
            </View>

            {/* Status */}
            {isCompleted ? (
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
  const stepsToShow = showOnlyPreview
    ? exercise.stepsTr.slice(0, 2)
    : exercise.stepsTr;
  const hasHiddenSteps = showOnlyPreview && exercise.stepsTr.length > 2;

  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card
        className={`p-5 border ${
          isCompleted
            ? 'bg-green-50 border-green-200'
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
                {exercise.titleTr}
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
            <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center">
              <Text className="text-white text-lg">✓</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text className="text-sm text-muted-foreground mb-3">
          {exercise.descriptionTr}
        </Text>

        {/* Purpose - Why this exercise */}
        <View className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <View className="flex-row items-start">
            <Text className="text-base mr-2">🎯</Text>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-purple-900 mb-1">
                Neden Bu Egzersiz?
              </Text>
              <Text className="text-xs text-purple-800 leading-relaxed">
                {exercise.purposeTr}
              </Text>
            </View>
          </View>
        </View>

        {/* Duration & Reps */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-muted/50 p-3 rounded-lg mr-2">
            <Text className="text-xs text-muted-foreground mb-1">Süre</Text>
            <Text className="font-semibold text-foreground">
              {exercise.duration}
            </Text>
          </View>
          <View className="flex-1 bg-muted/50 p-3 rounded-lg ml-2">
            <Text className="text-xs text-muted-foreground mb-1">Tekrar</Text>
            <Text className="font-semibold text-foreground">
              {exercise.repetitions}
            </Text>
          </View>
        </View>

        {/* Steps */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Adımlar
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
                      {exercise.stepsTr.length - 2} Adım Daha Var
                    </Text>
                    <Text className="text-xs text-yellow-800">
                      Tüm adımları görmek için Premium'a geçin
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
            Faydaları
          </Text>
          <View className="gap-1">
            {exercise.benefitsTr.map((benefit, index) => (
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
