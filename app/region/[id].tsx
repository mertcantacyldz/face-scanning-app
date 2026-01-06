import { JsonRenderer } from '@/components/analysis/JsonRenderer';
import { PremiumModal } from '@/components/PremiumModal';
import { ComparisonBadge } from '@/components/progress/ComparisonBadge';
import { ExerciseCard } from '@/components/progress/ExerciseCard';
import { ProgressChart } from '@/components/progress/ProgressChart';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { usePremium } from '@/hooks/use-premium';
import { compareAnalysis } from '@/lib/comparison';
import {
  getExercisesByRegion,
  getRegionTitle,
  type RegionId,
} from '@/lib/exercises';
import { FACE_REGIONS } from '@/lib/face-prompts';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AnalysisRecord {
  id: string;
  overall_score: number;
  raw_response: Record<string, any>;
  metrics: Record<string, any>;
  created_at: string;
}

const RegionDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const regionId = id as RegionId;
  const { t, i18n } = useTranslation('region');

  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Premium check
  const { isPremium, freeAnalysisRegion } = usePremium();

  // Check if this is the free analysis region for non-premium users
  const isAccessible = isPremium || freeAnalysisRegion === regionId;

  const title = getRegionTitle(regionId);
  const region = FACE_REGIONS.find((r) => r.id === regionId);
  const exercises = getExercisesByRegion(regionId);

  useEffect(() => {
    loadRegionData();
  }, [regionId]);

  const loadRegionData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(t('alerts.loginRequired.title'), t('alerts.loginRequired.message'));
        router.replace('/(auth)/login');
        return;
      }

      const { data, error } = await supabase
        .from('region_analysis')
        .select('id, overall_score, raw_response, metrics, created_at')
        .eq('user_id', user.id)
        .eq('region_id', regionId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setAnalyses(data || []);
    } catch (error) {
      console.error('Error loading region data:', error);
      Alert.alert(t('alerts.loadError.title'), t('alerts.loadError.message'));
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = analyses
    .map((a) => ({
      value: a.overall_score,
      date: a.created_at,
    }))
    .reverse();

  // Get comparison result
  const latestAnalysis = analyses[0] || null;
  const previousAnalysis = analyses[1] || null;
  const comparison = latestAnalysis
    ? compareAnalysis(
      {
        id: latestAnalysis.id,
        overall_score: latestAnalysis.overall_score,
        metrics: latestAnalysis.metrics as any,
        created_at: latestAnalysis.created_at,
      },
      previousAnalysis
        ? {
          id: previousAnalysis.id,
          overall_score: previousAnalysis.overall_score,
          metrics: previousAnalysis.metrics as any,
          created_at: previousAnalysis.created_at,
        }
        : null,
      false // TODO: Check if user completed exercises
    )
    : null;

  const handleExercisesPress = () => {
    router.push(`/exercises/${regionId}`);
  };

  const handleAnalysisPress = (analysis: AnalysisRecord) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setSelectedAnalysis(analysis);
    setShowHistoryDetail(true);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-muted-foreground">{t('loading')}</Text>
      </View>
    );
  }

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
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mr-4">
            {region?.icon && (
              <Image
                source={region.icon}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
            )}
          </View>
          <View>
            <Text className="text-2xl font-bold">{title}</Text>
            <Text className="text-muted-foreground">
              {t('header.analysisCount', { count: analyses.length })}
            </Text>
          </View>
        </View>

        {/* Comparison Badge */}
        {comparison && (
          <View className="mb-6">
            <ComparisonBadge comparison={comparison} size="medium" />
          </View>
        )}

        {/* Latest Score Card */}
        {latestAnalysis && (
          <Card className="p-4 mb-4 bg-primary/10 border-2 border-primary/20">
            <View className="items-center">
              <Text className="text-sm text-muted-foreground mb-2">
                {t('latestScore.title')}
              </Text>
              <View className="w-20 h-20 rounded-full bg-white shadow-md items-center justify-center border-2 border-primary/20">
                <Text
                  className={`text-3xl font-bold ${latestAnalysis.overall_score >= 7
                    ? 'text-green-600'
                    : latestAnalysis.overall_score >= 4
                      ? 'text-yellow-600'
                      : 'text-red-600'
                    }`}
                >
                  {latestAnalysis.overall_score}
                </Text>
                <Text className="text-xs text-muted-foreground">{t('latestScore.outOf')}</Text>
              </View>
              <Text className="text-xs text-muted-foreground mt-2">
                {new Date(latestAnalysis.created_at).toLocaleDateString(
                  i18n.language === 'tr' ? 'tr-TR' : 'en-US',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              </Text>
            </View>
          </Card>
        )}

        {/* Progress Chart */}
        {chartData.length >= 2 && (
          <View className="mb-6">
            <ProgressChart
              data={chartData}
              titleTr={t('chart.title')}
              color="#007AFF"
              height={180}
            />
          </View>
        )}

        {/* Exercises Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold">{t('exercises.title')}</Text>
            <Pressable onPress={handleExercisesPress}>
              <Text className="text-primary font-semibold">{t('exercises.viewAll')}</Text>
            </Pressable>
          </View>

          <View className="gap-3">
            {exercises.slice(0, 2).map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                compact
                onPress={handleExercisesPress}
              />
            ))}
          </View>
        </View>

        {/* Analysis History */}
        {analyses.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold">{t('history.title')}</Text>
              {!isPremium && (
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed-outline" size={16} color="#6B7280" />
                  <Text className="text-sm text-muted-foreground ml-1">{t('history.premiumBadge')}</Text>
                </View>
              )}
            </View>
            <View className="gap-3">
              {analyses.slice(0, isPremium ? 5 : 1).map((analysis, index) => (
                <Pressable
                  key={analysis.id}
                  onPress={() => handleAnalysisPress(analysis)}
                  className="active:opacity-70"
                >
                  <Card className="p-4 border border-border flex-row items-center">
                    {/* Score */}
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${analysis.overall_score >= 7
                        ? 'bg-green-100'
                        : analysis.overall_score >= 4
                          ? 'bg-yellow-100'
                          : 'bg-red-100'
                        }`}
                    >
                      <Text
                        className={`text-lg font-bold ${analysis.overall_score >= 7
                          ? 'text-green-800'
                          : analysis.overall_score >= 4
                            ? 'text-yellow-800'
                            : 'text-red-800'
                          }`}
                      >
                        {analysis.overall_score}
                      </Text>
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">
                        {t('history.analysisNumber', { number: analyses.length - index })}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString(
                          i18n.language === 'tr' ? 'tr-TR' : 'en-US',
                          {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </Text>
                    </View>

                    {/* Arrow or Lock */}
                    {isPremium ? (
                      <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                    ) : (
                      <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                    )}
                  </Card>
                </Pressable>
              ))}

              {/* Premium Upgrade CTA for More History */}
              {!isPremium && analyses.length > 1 && (
                <Pressable
                  onPress={() => setShowPremiumModal(true)}
                  className="active:opacity-70"
                >
                  <Card className="p-4 border-2 border-dashed border-primary/30 bg-primary/5 items-center">
                    <View className="flex-row items-center">
                      <Ionicons name="diamond-outline" size={18} color="#8B5CF6" />
                      <Text className="text-primary font-semibold ml-2">
                        {t('history.upgradeMessage', { count: analyses.length - 1 })}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Empty State */}
        {analyses.length === 0 && (
          <Card className="p-6 bg-muted/50 border-0 items-center">
            {region?.icon && (
              <Image
                source={region.icon}
                style={{ width: 64, height: 64, marginBottom: 16 }}
                resizeMode="contain"
              />
            )}
            <Text className="text-lg font-bold text-center mb-2">
              {t('emptyState.title')}
            </Text>
            <Text className="text-muted-foreground text-center mb-4">
              {t('emptyState.description')}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/analysis')}
              className="bg-primary px-6 py-3 rounded-lg"
            >
              <Text className="text-primary-foreground font-semibold">
                {t('emptyState.button')}
              </Text>
            </Pressable>
          </Card>
        )}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* History Detail Modal (Premium only) */}
      {showHistoryDetail && selectedAnalysis && isPremium && (
        <View className="absolute inset-0 bg-background">
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            {/* Header */}
            <View className="flex-row items-center mb-6">
              <Pressable
                onPress={() => setShowHistoryDetail(false)}
                className="w-10 h-10 items-center justify-center mr-3"
              >
                <Text className="text-2xl">←</Text>
              </Pressable>
              <View>
                <Text className="text-2xl font-bold">{t('detailModal.title', { region: title })}</Text>
                <Text className="text-muted-foreground">
                  {new Date(selectedAnalysis.created_at).toLocaleDateString(
                    i18n.language === 'tr' ? 'tr-TR' : 'en-US',
                    {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </Text>
              </View>
            </View>

            {/* Score */}
            <Card className="p-6 mb-6 items-center bg-primary/5 border-2 border-primary/20">
              <View className="w-24 h-24 rounded-full bg-white shadow-lg items-center justify-center border-4 border-primary/20">
                <Text
                  className={`text-4xl font-bold ${selectedAnalysis.overall_score >= 7
                    ? 'text-green-600'
                    : selectedAnalysis.overall_score >= 4
                      ? 'text-yellow-600'
                      : 'text-red-600'
                    }`}
                >
                  {selectedAnalysis.overall_score}
                </Text>
                <Text className="text-sm text-muted-foreground">/10</Text>
              </View>
            </Card>

            {/* Full Analysis */}
            {selectedAnalysis.raw_response && (
              <Card className="p-5 bg-card border border-border">
                <Text className="text-lg font-bold mb-4">{t('detailModal.detailedAnalysis')}</Text>
                <JsonRenderer
                  data={selectedAnalysis.raw_response}
                  excludeKeys={['metadata']}
                />
              </Card>
            )}

            <View className="h-8" />
          </ScrollView>
        </View>
      )}

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature={t('premiumModal.feature')}
        featureIconName="stats-chart-outline"
      />
    </SafeAreaView>
  );
};

export default RegionDetailScreen;
