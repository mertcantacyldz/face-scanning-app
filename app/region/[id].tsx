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
  getRegionIcon,
  getRegionTitle,
  type RegionId,
} from '@/lib/exercises';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

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

  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  console.log(selectedAnalysis?.raw_response, "selectedAnalysis -raw_response");
  console.log(selectedAnalysis?.overall_score, "selectedAnalysis -overall_score");

  // Premium check
  const { isPremium, freeAnalysisRegion } = usePremium();

  // Check if this is the free analysis region for non-premium users
  const isAccessible = isPremium || freeAnalysisRegion === regionId;

  const title = getRegionTitle(regionId);
  const icon = getRegionIcon(regionId);
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
        Alert.alert('Hata', 'Lütfen giriş yapın');
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

      // Always extract overall_score from raw_response (ignore DB field)
      const fixedData = (data || []).map((analysis) => {
        if (!analysis.raw_response) return analysis;

        // First, check if raw_response has raw_text (markdown wrapped)
        let parsedResponse = analysis.raw_response;
        if (analysis.raw_response.raw_text) {
          const cleanedText = analysis.raw_response.raw_text
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```$/g, '')
            .trim();

          try {
            parsedResponse = JSON.parse(cleanedText);
          } catch {
            // Keep original if parse fails
          }
        }

        // Extract score from parsed response (always override DB value)
        const realScore =
          parsedResponse.analysis_result?.overall_score ??
          parsedResponse.analysis_result?.confidence_score ??
          parsedResponse.overall_score ??
          analysis.overall_score; // Fallback to DB value if not found

        return { ...analysis, overall_score: realScore };
      });

      setAnalyses(fixedData);
    } catch (error) {
      console.error('Error loading region data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
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
        <Text className="mt-4 text-muted-foreground">Yükleniyor...</Text>
      </View>
    );
  }

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
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mr-4">
            <Text className="text-4xl">{icon}</Text>
          </View>
          <View>
            <Text className="text-2xl font-bold">{title}</Text>
            <Text className="text-muted-foreground">
              {analyses.length} analiz
            </Text>
          </View>
        </View>

        {/* Comparison Badge */}
        {comparison && (
          <View className="mb-6">
            <ComparisonBadge comparison={comparison} size="large" />
          </View>
        )}

        {/* Latest Score Card */}
        {latestAnalysis && (
          <Card className="p-6 mb-6 bg-primary/10 border-2 border-primary/20">
            <View className="items-center">
              <Text className="text-sm text-muted-foreground mb-2">
                Son Skor
              </Text>
              <View className="w-28 h-28 rounded-full bg-white shadow-lg items-center justify-center border-4 border-primary/20">
                <Text
                  className={`text-5xl font-bold ${latestAnalysis.overall_score >= 7
                    ? 'text-green-600'
                    : latestAnalysis.overall_score >= 4
                      ? 'text-yellow-600'
                      : 'text-red-600'
                    }`}
                >
                  {latestAnalysis.overall_score}
                </Text>
                <Text className="text-sm text-muted-foreground">/10</Text>
              </View>
              <Text className="text-xs text-muted-foreground mt-3">
                {new Date(latestAnalysis.created_at).toLocaleDateString(
                  'tr-TR',
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
              titleTr="Skor Geçmişi"
              color="#007AFF"
              height={180}
            />
          </View>
        )}

        {/* Exercises Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold">Önerilen Egzersizler</Text>
            <Pressable onPress={handleExercisesPress}>
              <Text className="text-primary font-semibold">Tümünü Gör →</Text>
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
              <Text className="text-xl font-bold">Analiz Geçmişi</Text>
              {!isPremium && (
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed-outline" size={16} color="#6B7280" />
                  <Text className="text-sm text-muted-foreground ml-1">Premium</Text>
                </View>
              )}
            </View>
            <View className="gap-3 ">
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
                        Analiz #{analyses.length - index}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString(
                          'tr-TR',
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
                        +{analyses.length - 1} analiz daha görmek için Premium&apos;a geç
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
            <Text className="text-5xl mb-4">{icon}</Text>
            <Text className="text-lg font-bold text-center mb-2">
              Henüz Analiz Yok
            </Text>
            <Text className="text-muted-foreground text-center mb-4">
              Bu bölge için henüz bir analiz yapmadınız. Analiz sayfasına
              giderek başlayabilirsiniz.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/analysis')}
              className="bg-primary px-6 py-3 rounded-lg"
            >
              <Text className="text-primary-foreground font-semibold">
                Analiz Yap
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
                <Text className="text-2xl font-bold">{title} Analizi</Text>
                <Text className="text-muted-foreground">
                  {new Date(selectedAnalysis.created_at).toLocaleDateString(
                    'tr-TR',
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
                <Text className="text-lg font-bold mb-4">Detaylı Analiz</Text>
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
        feature="Analiz Geçmişi"
        featureIconName="stats-chart-outline"
      />
    </View>
  );
};

export default RegionDetailScreen;
