import { ProgressChart } from '@/components/progress/ProgressChart';
import { RegionProgressCard } from '@/components/progress/RegionProgressCard';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { usePremium } from '@/hooks/use-premium';
import { calculateOverallProgress } from '@/lib/comparison';
import { getAllRegions, type RegionId } from '@/lib/exercises';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

interface RegionSummary {
  regionId: RegionId;
  latestScore: number | null;
  previousScore: number | null;
  analysisCount: number;
  lastAnalysisDate: string | null;
}

interface ChartDataPoint {
  value: number;
  date: string;
}

interface RegionAnalysisRow {
  id: string;
  region_id: string;
  overall_score: number;
  metrics: any;
  created_at: string;
}

const ProgressScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regionSummaries, setRegionSummaries] = useState<RegionSummary[]>([]);
  const [overallChartData, setOverallChartData] = useState<ChartDataPoint[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalAnalyses, setTotalAnalyses] = useState(0);

  // Premium check
  const { isPremium } = usePremium();

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadProgressData();
    }, [])
  );

  const loadProgressData = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Hata', 'Lütfen giriş yapın');
        router.replace('/(auth)/login');
        return;
      }

      // Fetch all region analyses for this user
      const { data, error } = await supabase
        .from('region_analysis')
        .select('id, region_id, overall_score, metrics, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const analyses = data as RegionAnalysisRow[] | null;

      if (error) {
        throw error;
      }

      // Process data by region
      const regions = getAllRegions();
      const summaries: RegionSummary[] = [];
      const allScoresWithDates: { score: number; date: string }[] = [];

      for (const regionId of regions) {
        const regionAnalyses = (analyses || []).filter(
          (a) => a.region_id === regionId
        );

        const latestScore = regionAnalyses[0]?.overall_score ?? null;
        const previousScore = regionAnalyses[1]?.overall_score ?? null;

        summaries.push({
          regionId,
          latestScore,
          previousScore,
          analysisCount: regionAnalyses.length,
          lastAnalysisDate: regionAnalyses[0]?.created_at ?? null,
        });

        // Collect scores for overall chart
        regionAnalyses.forEach((a) => {
          if (a.overall_score !== null) {
            allScoresWithDates.push({
              score: a.overall_score,
              date: a.created_at,
            });
          }
        });
      }

      // Sort by date and aggregate for chart (average scores per day)
      const scoresByDate = new Map<string, number[]>();
      allScoresWithDates.forEach(({ score, date }) => {
        const dateKey = new Date(date).toISOString().split('T')[0];
        if (!scoresByDate.has(dateKey)) {
          scoresByDate.set(dateKey, []);
        }
        scoresByDate.get(dateKey)!.push(score);
      });

      const chartData: ChartDataPoint[] = Array.from(scoresByDate.entries())
        .map(([date, scores]) => ({
          value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          date,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-10); // Last 10 data points

      // Calculate overall progress
      const progress = calculateOverallProgress(
        summaries.map((s) => ({
          regionId: s.regionId,
          records: (analyses || [])
            .filter((a) => a.region_id === s.regionId)
            .map((a) => ({
              id: a.id,
              overall_score: a.overall_score,
              metrics: a.metrics || {} as any,
              created_at: a.created_at,
            })),
        }))
      );

      setRegionSummaries(summaries);
      setOverallChartData(chartData);
      setOverallProgress(progress);
      setTotalAnalyses(analyses?.length || 0);
    } catch (error) {
      console.error('Error loading progress data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProgressData();
  };

  const handleRegionPress = (regionId: RegionId) => {
    router.push(`/region/${regionId}`);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-muted-foreground">Yükleniyor...</Text>
      </View>
    );
  }

  // Premium wall for non-premium users
  if (!isPremium) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold mb-2">Gelişim Takibi</Text>
            <Text className="text-muted-foreground">
              Yüz analizlerinizi ve ilerlemenizi takip edin
            </Text>
          </View>

          {/* Premium Lock Card */}
          <Card className="p-8 bg-primary/10 border-2 border-primary/20 items-center">
            <View className="w-24 h-24 bg-primary/20 rounded-full items-center justify-center mb-6">
              <Ionicons name="stats-chart-outline" size={56} color="#8B5CF6" />
            </View>
            <Text className="text-2xl font-bold text-center mb-2">
              Premium Özellik
            </Text>
            <Text className="text-muted-foreground text-center mb-6">
              Gelişim takibi, grafikler ve karşılaştırmalı analiz özellikleri Premium üyelere özeldir.
            </Text>

            {/* Benefits */}
            <View className="w-full gap-3 mb-6">
              {[
                'Tüm bölgelerin ilerleme grafikleri',
                'Önceki analizlerle karşılaştırma',
                'Detaylı skor dökümü',
                'Kişiselleştirilmiş öneriler',
              ].map((benefit, index) => (
                <View key={index} className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text className="text-foreground ml-2">{benefit}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => router.push('/paywall')}
              className="w-full bg-primary py-4 rounded-xl items-center active:opacity-80"
            >
              <View className="flex-row items-center">
                <Ionicons name="diamond-outline" size={20} color="#FFFFFF" />
                <Text className="text-primary-foreground font-bold text-base ml-2">
                  Premium&apos;a Geç
                </Text>
              </View>
            </Pressable>
          </Card>

          {/* Preview Card */}
          <Card className="mt-6 p-4 bg-muted/50 border-0">
            <Text className="text-xs text-muted-foreground text-center">
              Premium ile yüz analizlerinizi zaman içinde takip edebilir, gelişiminizi görebilir ve kişiselleştirilmiş egzersiz önerileri alabilirsiniz.
            </Text>
          </Card>

          <View className="h-8" />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold mb-2">Gelişim Takibi</Text>
          <Text className="text-muted-foreground">
            Yüz analizlerinizi ve ilerlemenizi takip edin
          </Text>
        </View>

        {/* Overall Stats Card */}
        <Card className="p-5 mb-6 bg-primary/10 border-2 border-primary/20">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-foreground">
                Genel İlerleme
              </Text>
              <Text className="text-sm text-muted-foreground">
                Tüm bölgeler
              </Text>
            </View>
            <View className="items-center">
              <Text
                className={`text-4xl font-bold ${overallProgress >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
              >
                {overallProgress >= 0 ? '+' : ''}
                {overallProgress}%
              </Text>
              <Text className="text-xs text-muted-foreground">ilerleme</Text>
            </View>
          </View>

          {/* Stats row */}
          <View className="flex-row">
            <View className="flex-1 bg-white/50 p-3 rounded-lg mr-2">
              <Text className="text-xs text-muted-foreground">
                Toplam Analiz
              </Text>
              <Text className="text-xl font-bold text-foreground">
                {totalAnalyses}
              </Text>
            </View>
            <View className="flex-1 bg-white/50 p-3 rounded-lg ml-2">
              <Text className="text-xs text-muted-foreground">
                Aktif Bölge
              </Text>
              <Text className="text-xl font-bold text-foreground">
                {regionSummaries.filter((r) => r.analysisCount > 0).length}/6
              </Text>
            </View>
          </View>
        </Card>

        {/* Overall Progress Chart */}
        {overallChartData.length >= 2 && (
          <View className="mb-6">
            <ProgressChart
              data={overallChartData}
              titleTr="Genel Skor Grafiği"
              color="#007AFF"
              height={180}
            />
          </View>
        )}

        {/* Region Cards */}
        <View className="mb-4">
          <Text className="text-xl font-bold mb-4">Bölgeler</Text>
          <View className="gap-3">
            {regionSummaries.map((summary) => (
              <RegionProgressCard
                key={summary.regionId}
                regionId={summary.regionId}
                latestScore={summary.latestScore}
                previousScore={summary.previousScore}
                analysisCount={summary.analysisCount}
                lastAnalysisDate={summary.lastAnalysisDate}
                onPress={() => handleRegionPress(summary.regionId)}
              />
            ))}
          </View>
        </View>

        {/* Empty State */}
        {totalAnalyses === 0 && (
          <Card className="p-6 bg-muted/50 border-0 items-center">
            <Ionicons name="stats-chart-outline" size={56} color="#8B5CF6" style={{ marginBottom: 16 }} />
            <Text className="text-lg font-bold text-center mb-2">
              Henüz Analiz Yok
            </Text>
            <Text className="text-muted-foreground text-center">
              Analiz sayfasına giderek yüz bölgelerinizi analiz edin ve
              gelişiminizi takip etmeye başlayın.
            </Text>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="mt-4 p-4 bg-blue-50 border border-blue-200">
          <View className="flex-row items-start">
            <Ionicons name="bulb-outline" size={16} color="#1E3A8A" style={{ marginTop: 2 }} />
            <Text className="text-sm text-blue-800 ml-2 flex-1">
              <Text className="font-semibold">İpucu:</Text> Düzenli egzersiz
              yaparak yüz kaslarınızı güçlendirebilir ve simetrinizi
              iyileştirebilirsiniz. Her bölgeye tıklayarak önerilen egzersizleri
              görüntüleyin.
            </Text>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
};

export default ProgressScreen;
