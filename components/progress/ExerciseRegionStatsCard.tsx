// Exercise Region Stats Card Component
// Compact square card with modal for details

import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator, Modal, ScrollView, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getRegionMonthlyStats, type RegionMonthlyStats } from '@/lib/exercise-tracking';
import { getExercisesByRegion, getRegionTitle, type RegionId } from '@/lib/exercises';
import { ExerciseCompletionBadge } from './ExerciseCompletionBadge';

interface ExerciseRegionStatsCardProps {
  regionId: RegionId;
  monthYear: string;
}

const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - 48) / 2.5; // 2.5 cards visible

export function ExerciseRegionStatsCard({
  regionId,
  monthYear,
}: ExerciseRegionStatsCardProps) {
  const { t, i18n } = useTranslation('progress');
  const [stats, setStats] = useState<RegionMonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const regionTitle = getRegionTitle(regionId);
  const exercises = getExercisesByRegion(regionId);
  const currentLanguage = i18n.language;

  // Load stats on mount or when monthYear changes
  useEffect(() => {
    loadStats();
  }, [regionId, monthYear]);

  async function loadStats() {
    setLoading(true);
    try {
      const exerciseIds = exercises.map(ex => ex.id);
      const regionStats = await getRegionMonthlyStats(regionId, monthYear, exerciseIds);
      setStats(regionStats);
    } catch (error) {
      console.error('Error loading region stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-4 items-center justify-center" style={{ width: cardWidth, height: 190 }}>
        <ActivityIndicator size="small" color="#8B5CF6" />
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <>
      {/* Compact Square Card */}
      <Pressable onPress={() => setModalVisible(true)} className="active:opacity-70">
        <Card className="p-5" style={{ width: cardWidth, height: 190 }}>
          <View className="flex-1 justify-between">
            {/* Icon + Title */}
            <View className="items-center">
              <View className="w-11 h-11 bg-primary/10 rounded-full items-center justify-center mb-2">
                <Ionicons name="stats-chart" size={22} color="#8B5CF6" />
              </View>
              <Text className="text-sm font-bold text-foreground text-center" numberOfLines={1}>
                {regionTitle}
              </Text>
            </View>

            {/* Percentage */}
            <View className="items-center">
              <Text className="text-4xl font-bold text-foreground">
                {stats.averageCompletionPercentage}%
              </Text>
            </View>

            {/* Exercise count */}
            <View className="items-center">
              <Text className="text-xs text-muted-foreground">
                {exercises.length} {t('exerciseStats.exercises')}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl" style={{ maxHeight: '80%' }}>
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center flex-1">
                <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center mr-3">
                  <Ionicons name="stats-chart" size={16} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-foreground">
                    {regionTitle} {t('exerciseStats.modalTitle')}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {t('exerciseStats.averageLabel')} {stats.averageCompletionPercentage}%
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 items-center justify-center active:opacity-50"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Exercise List */}
            <ScrollView className="px-4 py-2">
              {stats.exerciseStats.map((exerciseStat) => {
                const exercise = exercises.find(ex => ex.id === exerciseStat.exerciseId);
                if (!exercise) return null;

                return (
                  <View
                    key={exerciseStat.exerciseId}
                    className="flex-row items-center justify-between py-3 border-b border-border"
                  >
                    {/* Exercise info */}
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                        {exercise.icon} {currentLanguage === 'tr' ? exercise.titleTr : exercise.title}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {exerciseStat.daysCompleted} / {exerciseStat.totalDaysInMonth} {t('exerciseStats.daysCompleted')}
                      </Text>
                    </View>

                    {/* Completion badge */}
                    <ExerciseCompletionBadge
                      completionPercentage={exerciseStat.completionPercentage}
                      compact
                    />
                  </View>
                );
              })}

              {/* Summary */}
              <View className="py-4">
                <View className="p-3 bg-muted/50 rounded-lg">
                  <Text className="text-xs text-center text-muted-foreground">
                    {t('exerciseStats.summaryText')}{' '}
                    <Text className="font-bold text-foreground">{stats.averageCompletionPercentage}%</Text>
                  </Text>
                </View>
              </View>

              {/* Bottom spacing for safe area */}
              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default ExerciseRegionStatsCard;
