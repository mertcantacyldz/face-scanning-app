import { HeroCard } from '@/components/analysis/HeroCard';
import { JsonRenderer } from '@/components/analysis/JsonRenderer';
import { MetadataSection } from '@/components/analysis/MetadataSection';
import { RecommendationsList } from '@/components/analysis/RecommendationsList';
import { UserFriendlySummary } from '@/components/analysis/UserFriendlySummary';
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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  const { t, i18n } = useTranslation('analysis');
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
        console.log('No user found in analysis screen');
        Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.noLandmarks'));
        return;
      }

      console.log('Loading face analysis for user:', user.id);

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
            t('noScanFound.title'),
            t('noScanFound.message'),
            [
              {
                text: t('buttons.done', { ns: 'common' }),
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
        // They already analyzed this region - navigate to exercises instead
        router.push(`/exercises/${region.id}`);
        return;
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
        language: i18n.language as 'en' | 'tr', // Pass current language
      });

      console.log('Analysis result for region', region.id, ':', result);

      if (result.success && result.analysis) {
        // Try to parse as JSON first, fallback to plain text
        let jsonResult: Record<string, any>;
        try {
          // First attempt: Direct parse
          jsonResult = JSON.parse(result.analysis);
        } catch {
          // Second attempt: Remove markdown code blocks and parse
          const cleanedText = result.analysis
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```$/g, '')
            .trim();

          try {
            jsonResult = JSON.parse(cleanedText);
          } catch {
            // If still fails, wrap as plain text
            jsonResult = { raw_text: result.analysis };
          }
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
          {t('noScanFound.title')}
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          {t('noScanFound.message')}
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)')}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-primary-foreground font-semibold">
            {t('noScanFound.button')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold mb-2">{t('header.title')}</Text>
          <Text className="text-muted-foreground">
            {t('header.subtitle')}
          </Text>
          <Text className="text-xs text-muted-foreground mt-2">
            {t('lastScan')}:{' '}
            {new Date(faceData.created_at).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', {
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
                  {t('score.overall')}
                </Text>
                <Text className="text-3xl font-bold text-foreground">
                  {attractivenessScore.toFixed(1)}/10
                </Text>
                <Text className="text-sm text-primary font-medium">
                  {getScoreLabelTr(attractivenessScore)}
                </Text>
              </View>
              <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center">
                <Ionicons name="sparkles-outline" size={40} color="#8B5CF6" />
              </View>
            </View>
            {!isPremium && (
              <View className="flex-row items-center mt-3">
                <Ionicons name="diamond-outline" size={12} color="#6B7280" />
                <Text className="text-xs text-muted-foreground ml-1">
                  {t('score.upgradePremium')}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Free User Spin Wheel CTA */}
        {!isPremium && !freeAnalysisUsed && (
          <Card className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200">
            <Pressable onPress={() => setShowSpinWheel(true)} className="active:opacity-70">
              <View className="flex-row items-center">
                <Ionicons name="disc-outline" size={40} color="#CA8A04" />
                <View className="flex-1 ml-3">
                  <Text className="font-bold text-yellow-800">
                    {t('freeAnalysis.title')}
                  </Text>
                  <Text className="text-sm text-yellow-700">
                    {t('freeAnalysis.subtitle')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CA8A04" />
              </View>
            </Pressable>
          </Card>
        )}

        {/* Free analysis region indicator */}
        {!isPremium && freeAnalysisUsed && freeAnalysisRegion && (
          <Card className="mb-6 p-3 bg-green-50 border border-green-200">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text className="text-sm text-green-700 ml-2">
                {t('freeAnalysisUsed', {
                  region: t(`regions.${freeAnalysisRegion}.title`)
                })}
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
                    {typeof region.icon === 'string' ? (
                      <Text className="text-4xl">{region.icon}</Text>
                    ) : (
                      <Image source={region.icon} style={{ width: 40, height: 40 }} resizeMode="contain" />
                    )}
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-lg font-bold mb-1">{t(`regions.${region.id}.title`)}</Text>
                      {isLocked && (
                        <Ionicons name="lock-closed" size={14} color="#9CA3AF" style={{ marginLeft: 8, marginBottom: 4 }} />
                      )}
                      {isUnlocked && !isPremium && (
                        <View className="ml-2 mb-1 bg-green-100 px-2 py-0.5 rounded-full">
                          <Text className="text-xs text-green-700 font-medium">{t('freeBadge')}</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-muted-foreground">
                      {t(`regions.${region.id}.description`)}
                    </Text>
                  </View>

                  {/* Loading or Arrow or Lock */}
                  <View className="ml-2">
                    {analyzingRegion === region.id ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : isLocked ? (
                      <Ionicons name="diamond-outline" size={24} color="#9CA3AF" />
                    ) : (
                      <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                    )}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {/* Info Card */}
        <Card className="mt-6 p-4 bg-primary/5 border border-primary/20">
          <View className="flex-row items-start">
            <Ionicons name="bulb-outline" size={16} color="#8B5CF6" style={{ marginTop: 2 }} />
            <Text className="text-sm text-muted-foreground ml-2 flex-1">
              <Text className="font-semibold">{t('infoCard.tip')}</Text> {t('infoCard.description')}
            </Text>
          </View>
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
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-xl font-bold">{t('spinWheel.title')}</Text>
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
        </SafeAreaView>
      </Modal>

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature={selectedRegion ? t(`regions.${selectedRegion.id}.title`) : t('thisFeature')}
        featureIconName="lock-closed-outline"
      />

      {/* Analysis Result Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeResultModal}
      >
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
          {/* Modal Header */}
          <View className="bg-primary p-4 pb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                {selectedRegion?.icon && (
                  typeof selectedRegion.icon === 'string' ? (
                    <Text className="text-5xl mr-3">{selectedRegion.icon}</Text>
                  ) : (
                    <Image source={selectedRegion.icon} style={{ width: 50, height: 50, marginRight: 12 }} resizeMode="contain" />
                  )
                )}
                <View>
                  <Text className="text-2xl font-bold text-primary-foreground">
                    {selectedRegion && t(`regions.${selectedRegion.id}.title`)}
                  </Text>
                  <Text className="text-primary-foreground/80 text-sm">
                    {t('result.title')}
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

                    {/* SECTION 2: User-Friendly Summary (NEW) */}
                    {analysisResult.user_friendly_summary && (
                      <UserFriendlySummary data={analysisResult.user_friendly_summary} />
                    )}

                    {/* SECTION 3-4: Generic sections (detailed_analysis, 3d_analysis, etc.) */}
                    {Object.entries(analysisResult).map(([key, value]) => {
                      // Skip special sections handled separately
                      if (
                        [
                          'analysis_result',
                          'user_friendly_summary',
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
                  {t('result.analyzing')}
                </Text>
              </View>
            )}

            {/* Bottom Info */}
            {analysisResult && (
              <Card className="mt-6 p-4 bg-muted border-0">
                <Text className="text-xs text-muted-foreground text-center">
                  {t('aiDisclaimer')}
                </Text>
              </Card>
            )}

            <View className="h-8" />
          </ScrollView>

          {/* Close Button / Navigate to Exercises */}
          <View className="p-6 border-t border-border">
            {!isPremium && selectedRegion && freeAnalysisUsed && freeAnalysisRegion === selectedRegion.id ? (
              <Pressable
                onPress={() => {
                  closeResultModal();
                  router.push(`/exercises/${selectedRegion.id}`);
                }}
                className="bg-green-600 py-4 rounded-lg items-center active:opacity-80"
              >
                <View className="flex-row items-center">
                  <Ionicons name="barbell-outline" size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Egzersizlere Git
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Pressable
                onPress={closeResultModal}
                className="bg-primary py-4 rounded-lg items-center active:opacity-80"
              >
                <Text className="text-primary-foreground font-semibold text-base">
                  {t('closeButton')}
                </Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default AnalysisScreen;
