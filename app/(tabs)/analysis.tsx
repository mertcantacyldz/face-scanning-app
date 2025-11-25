import { HeroCard } from '@/components/analysis/HeroCard';
import { JsonRenderer } from '@/components/analysis/JsonRenderer';
import { MetadataSection } from '@/components/analysis/MetadataSection';
import { RecommendationsList } from '@/components/analysis/RecommendationsList';
import { PremiumModal } from '@/components/PremiumModal';
import { SpinWheel } from '@/components/SpinWheel';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { usePremium } from '@/hooks/use-premium';
import { calculateAttractivenessScore, getScoreLabelTr } from '@/lib/attractiveness';
import type { RegionId } from '@/lib/exercises';
import { FACE_REGIONS, type FaceRegion } from '@/lib/face-prompts';
import { extractMetrics } from '@/lib/metrics';
import { analyzeFaceRegion, isOpenRouterConfigured } from '@/lib/openrouter';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FaceAnalysisData {
  id: string;
  landmarks: { x: number; y: number; z: number; index: number }[];
  created_at: string;
}

const AnalysisScreen = () => {
  const [loading, setLoading] = useState(true);
  const [faceData, setFaceData] = useState<FaceAnalysisData | null>(null);
  const [analyzingRegion, setAnalyzingRegion] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<FaceRegion | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [attractivenessScore, setAttractivenessScore] = useState<number | null>(null);

  // Premium hook
  const { isPremium, freeAnalysisUsed, freeAnalysisRegion, markFreeAnalysisUsed } = usePremium();

  useEffect(() => {
    loadLatestFaceAnalysis();
  }, []);

  // Calculate attractiveness score when face data is loaded
  useEffect(() => {
    if (faceData?.landmarks) {
      const result = calculateAttractivenessScore(faceData.landmarks);
      setAttractivenessScore(result.overallScore);
    }
  }, [faceData]);

  const loadLatestFaceAnalysis = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Hata', 'Lütfen giriş yapın');
        router.replace('/(auth)/login');
        return;
      }

      // Fetch latest face analysis
      const { data, error } = await supabase
        .from('face_analysis')
        .select('id, landmarks, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          Alert.alert(
            'Yüz Taraması Bulunamadı',
            'Henüz bir yüz taraması yapmadınız. Lütfen önce bir tarama yapın.',
            [
              {
                text: 'Tamam',
                onPress: () => router.push('/(tabs)'),
              },
            ]
          );
          return;
        }
        throw error;
      }

      setFaceData(data);
    } catch (error) {
      console.error('Error loading face analysis:', error);
      Alert.alert(
        'Hata',
        'Yüz verisi yüklenirken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle spin wheel completion
  const handleSpinComplete = async (regionId: RegionId) => {
    // Find the region from FACE_REGIONS
    const region = FACE_REGIONS.find(r => r.id === regionId);
    if (region) {
      await markFreeAnalysisUsed(regionId);
      setShowSpinWheel(false);
      // Perform the analysis for the won region
      handleRegionAnalysis(region, true);
    }
  };

  const handleRegionAnalysis = async (region: FaceRegion, bypassPremiumCheck = false) => {
    // Premium check for non-premium users
    if (!isPremium && !bypassPremiumCheck) {
      // Check if this is the free analysis region they won
      if (freeAnalysisUsed && freeAnalysisRegion === region.id) {
        // Allow access to their won region
      } else if (!freeAnalysisUsed) {
        // Show spin wheel
        setShowSpinWheel(true);
        return;
      } else {
        // Show premium modal
        setSelectedRegion(region);
        setShowPremiumModal(true);
        return;
      }
    }

    // Check if OpenRouter is configured
    if (!isOpenRouterConfigured()) {
      Alert.alert(
        'API Anahtarı Bulunamadı',
        'OpenRouter API anahtarı yapılandırılmamış. Lütfen .env dosyasına EXPO_PUBLIC_OPENROUTER_API_KEY ekleyin.'
      );
      return;
    }

    if (!faceData || !faceData.landmarks) {
      Alert.alert('Hata', 'Yüz verisi bulunamadı');
      return;
    }

    try {
      setAnalyzingRegion(region.id);
      setSelectedRegion(region);

      // Call OpenRouter API with all 468 landmarks
      const result = await analyzeFaceRegion({
        landmarks: faceData.landmarks,
        region: region.id,
        customPrompt: region.prompt,
      });

      if (result.success && result.analysis) {
        // Try to parse as JSON first, fallback to plain text
        let jsonResult: Record<string, any>;
        try {
          jsonResult = JSON.parse(result.analysis);
        } catch {
          // If not JSON, wrap as plain text
          jsonResult = { raw_text: result.analysis };
        }

        // Show result immediately
        setAnalysisResult(jsonResult);
        setShowResultModal(true);

        // Save to database in background
        const savedRecord = await saveAnalysisToDatabase(region.id as RegionId, jsonResult);

        // If save failed, show warning to user
        if (!savedRecord) {
          Alert.alert(
            'Kayıt Uyarısı',
            'Analiz sonucu gösteriliyor ancak veritabanına kaydedilemedi. İnternet bağlantınızı kontrol edin.',
            [
              { text: 'Tamam' },
              {
                text: 'Tekrar Dene',
                onPress: () => saveAnalysisToDatabase(region.id as RegionId, jsonResult),
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'Analiz Hatası',
          result.error || 'Analiz yapılırken bir hata oluştu'
        );
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Hata', 'Analiz yapılırken bir hata oluştu');
    } finally {
      setAnalyzingRegion(null);
    }
  };

  // Save analysis result to database and return the saved record
  const saveAnalysisToDatabase = async (
    regionId: RegionId,
    rawResponse: Record<string, any>
  ): Promise<Record<string, any> | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error('User not authenticated');
        return null;
      }

      // Extract metrics for comparison
      const metrics = extractMetrics(regionId, rawResponse);

      // Get overall score
      const overallScore =
        rawResponse.analysis_result?.overall_score ??
        rawResponse.analysis_result?.confidence_score ??
        rawResponse.overall_score ??
        0;

      // Insert into region_analysis table and return the inserted record
      const { data, error } = await supabase
        .from('region_analysis')
        .insert({
          user_id: user.id,
          face_analysis_id: faceData?.id,
          region_id: regionId,
          raw_response: rawResponse,
          metrics: metrics,
          overall_score: overallScore,
        })
        .select('id, raw_response, overall_score, created_at')
        .single();

      if (error) {
        console.error('Error saving analysis:', error);
        return null;
      }

      console.log('Analysis saved to database successfully');
      return data;
    } catch (error) {
      console.error('Error saving analysis to database:', error);
      return null;
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    setAnalysisResult(null);
    setSelectedRegion(null);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-muted-foreground">Yükleniyor...</Text>
      </View>
    );
  }

  if (!faceData) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-2xl font-bold text-center mb-4">
          Yüz Taraması Bulunamadı
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          Analiz yapabilmek için önce bir yüz taraması yapmalısınız.
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)')}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-primary-foreground font-semibold">
            Tarama Yap
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold mb-2">Yüz Analizi</Text>
          <Text className="text-muted-foreground">
            Analizini yapmak istediğiniz bölgeyi seçin
          </Text>
          <Text className="text-xs text-muted-foreground mt-2">
            Son tarama:{' '}
            {new Date(faceData.created_at).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Attractiveness Score Card */}
        {attractivenessScore !== null && (
          <Card className="mb-6 p-5 bg-primary/10 border border-primary/20">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-muted-foreground mb-1">
                  Genel Çekicilik Puanı
                </Text>
                <Text className="text-3xl font-bold text-foreground">
                  {attractivenessScore.toFixed(1)}/10
                </Text>
                <Text className="text-sm text-primary font-medium">
                  {getScoreLabelTr(attractivenessScore)}
                </Text>
              </View>
              <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center">
                <Text className="text-4xl">✨</Text>
              </View>
            </View>
            {!isPremium && (
              <Text className="text-xs text-muted-foreground mt-3">
                💎 Detaylı puan dökümü için Premium'a geçin
              </Text>
            )}
          </Card>
        )}

        {/* Free User Spin Wheel CTA */}
        {!isPremium && !freeAnalysisUsed && (
          <Card className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200">
            <Pressable onPress={() => setShowSpinWheel(true)} className="active:opacity-70">
              <View className="flex-row items-center">
                <Text className="text-4xl mr-3">🎡</Text>
                <View className="flex-1">
                  <Text className="font-bold text-yellow-800">
                    Ücretsiz Analiz Hakkın Var!
                  </Text>
                  <Text className="text-sm text-yellow-700">
                    Çarkı çevir, 1 bölge analizi kazan
                  </Text>
                </View>
                <Text className="text-2xl text-yellow-600">›</Text>
              </View>
            </Pressable>
          </Card>
        )}

        {/* Free analysis region indicator */}
        {!isPremium && freeAnalysisUsed && freeAnalysisRegion && (
          <Card className="mb-6 p-3 bg-green-50 border border-green-200">
            <View className="flex-row items-center">
              <Text className="text-green-600 mr-2">✓</Text>
              <Text className="text-sm text-green-700">
                <Text className="font-semibold">
                  {FACE_REGIONS.find(r => r.id === freeAnalysisRegion)?.title}
                </Text>
                {' '}bölgesi için ücretsiz analiz hakkınız kullanıldı
              </Text>
            </View>
          </Card>
        )}

        {/* Face Region Buttons */}
        <View className="gap-4">
          {FACE_REGIONS.map((region) => {
            // Check if this region is accessible for free users
            const isUnlocked = isPremium || (freeAnalysisUsed && freeAnalysisRegion === region.id);
            const isLocked = !isPremium && freeAnalysisUsed && freeAnalysisRegion !== region.id;

            return (
              <Pressable
                key={region.id}
                onPress={() => handleRegionAnalysis(region)}
                disabled={analyzingRegion !== null}
                className="active:opacity-70"
              >
                <Card className={`p-4 flex-row items-center border bg-card ${isLocked ? 'border-border/50 opacity-80' : 'border-border'}`}>
                  {/* Icon */}
                  <View className={`w-16 h-16 rounded-full items-center justify-center mr-4 ${isLocked ? 'bg-muted' : 'bg-primary/10'}`}>
                    <Text className="text-4xl">{region.icon}</Text>
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-lg font-bold mb-1">{region.title}</Text>
                      {isLocked && (
                        <Text className="text-sm ml-2 mb-1">🔒</Text>
                      )}
                      {isUnlocked && !isPremium && (
                        <View className="ml-2 mb-1 bg-green-100 px-2 py-0.5 rounded-full">
                          <Text className="text-xs text-green-700 font-medium">Ücretsiz</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-muted-foreground">
                      {region.description}
                    </Text>
                  </View>

                  {/* Loading or Arrow or Lock */}
                  <View className="ml-2">
                    {analyzingRegion === region.id ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : isLocked ? (
                      <Text className="text-2xl text-muted-foreground">👑</Text>
                    ) : (
                      <Text className="text-2xl text-muted-foreground">›</Text>
                    )}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {/* Info Card */}
        <Card className="mt-6 p-4 bg-primary/5 border border-primary/20">
          <Text className="text-sm text-muted-foreground">
            💡 <Text className="font-semibold">İpucu:</Text> Her bölge için
            yapay zeka destekli detaylı analiz alacaksınız. Analiz sonuçları
            MediaPipe tarafından tespit edilen 468 yüz noktası verisi üzerinden
            hazırlanmaktadır.
          </Text>
        </Card>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Spin Wheel Modal */}
      <Modal
        visible={showSpinWheel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSpinWheel(false)}
      >
        <View className="flex-1 bg-background">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 pt-12 border-b border-border">
            <Text className="text-xl font-bold">Şans Çarkı</Text>
            <Pressable
              onPress={() => setShowSpinWheel(false)}
              className="w-10 h-10 rounded-full bg-muted items-center justify-center active:opacity-70"
            >
              <Text className="text-foreground text-xl">×</Text>
            </Pressable>
          </View>

          {/* Spin Wheel Content */}
          <ScrollView className="flex-1 p-6" contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
            <SpinWheel
              onSpinComplete={handleSpinComplete}
              disabled={freeAnalysisUsed}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature={selectedRegion?.title || 'Bu özellik'}
        featureIcon={selectedRegion?.icon || '🔒'}
      />

      {/* Analysis Result Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeResultModal}
      >
        <View className="flex-1 bg-background">
          {/* Modal Header */}
          <View className="bg-primary p-4 pt-12 pb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-5xl mr-3">{selectedRegion?.icon}</Text>
                <View>
                  <Text className="text-2xl font-bold text-primary-foreground">
                    {selectedRegion?.title}
                  </Text>
                  <Text className="text-primary-foreground/80 text-sm">
                    Analiz Sonucu
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={closeResultModal}
                className="w-10 h-10 rounded-full bg-primary-foreground/20 items-center justify-center active:opacity-70"
              >
                <Text className="text-primary-foreground text-2xl">×</Text>
              </Pressable>
            </View>
          </View>

          {/* Modal Content */}
          <ScrollView className="flex-1 p-6">
            {analysisResult ? (
              <View>
                {typeof analysisResult === 'object' ? (
                  // Render structured JSON with custom components
                  <View>
                    {/* SECTION 1: Hero Card (analysis_result) */}
                    {analysisResult.analysis_result && (
                      <HeroCard data={analysisResult.analysis_result} />
                    )}

                    {/* SECTION 2-3-4: Generic sections (detailed_analysis, 3d_analysis, etc.) */}
                    {Object.entries(analysisResult).map(([key, value]) => {
                      // Skip special sections handled separately
                      if (
                        [
                          'analysis_result',
                          'recommendations',
                          'metadata',
                        ].includes(key)
                      ) {
                        return null;
                      }

                      // Skip if value is not an object
                      if (!value || typeof value !== 'object') {
                        return null;
                      }

                      return (
                        <Card
                          key={key}
                          className="mb-4 p-5 bg-card border border-border"
                        >
                          <Text className="text-lg font-bold mb-3 text-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </Text>
                          <JsonRenderer data={value} depth={0} />
                        </Card>
                      );
                    })}

                    {/* SECTION 5: Recommendations */}
                    {analysisResult.recommendations && (
                      <RecommendationsList
                        data={analysisResult.recommendations}
                      />
                    )}

                    {/* SECTION 6: Metadata (collapsible) */}
                    {analysisResult.metadata && (
                      <MetadataSection data={analysisResult.metadata} />
                    )}
                  </View>
                ) : (
                  // Render plain text (fallback)
                  <Text className="text-base leading-7 text-foreground">
                    {String(analysisResult)}
                  </Text>
                )}
              </View>
            ) : (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color="#007AFF" />
                <Text className="mt-4 text-muted-foreground">
                  Analiz yapılıyor...
                </Text>
              </View>
            )}

            {/* Bottom Info */}
            {analysisResult && (
              <Card className="mt-6 p-4 bg-muted border-0">
                <Text className="text-xs text-muted-foreground text-center">
                  Bu analiz yapay zeka tarafından MediaPipe Face Mesh verisi
                  kullanılarak oluşturulmuştur. Sonuçlar bilgilendirme amaçlıdır.
                </Text>
              </Card>
            )}

            <View className="h-8" />
          </ScrollView>

          {/* Close Button */}
          <View className="p-6 border-t border-border">
            <Pressable
              onPress={closeResultModal}
              className="bg-primary py-4 rounded-lg items-center active:opacity-80"
            >
              <Text className="text-primary-foreground font-semibold text-base">
                Kapat
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AnalysisScreen;
