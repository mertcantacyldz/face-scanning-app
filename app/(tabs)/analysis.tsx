/**
 * Analysis Screen
 * Face region analysis with AI-powered insights
 */

import {
  AnalysisResultModal,
  AttractivenessCard,
  FreeUserRightsCard,
  RegionButton,
} from '@/components/analysis';
import { PremiumModal } from '@/components/PremiumModal';
import { SpinWheel } from '@/components/SpinWheel';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { usePremium } from '@/hooks/use-premium';
import {
  applyRegionFilter,
  calculateMetricsForRegion,
  calculateOverallScore,
  preparePromptForRegion,
  validateAndCorrectScores,
} from '@/lib/analysis';
import { calculateAttractivenessScore, type RegionalScores } from '@/lib/attractiveness';
import type { RegionId } from '@/lib/exercises';
import { FACE_REGIONS, type FaceRegion, type SupportedLanguage } from '@/lib/face-prompts';
import { extractMetrics } from '@/lib/metrics';
import { analyzeFaceRegion, isOpenRouterConfigured } from '@/lib/openrouter';
import { checkRegionAccess, getRegionDisplayStatus } from '@/lib/premium/access-control';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============================================
// CONSTANTS
// ============================================

/**
 * TEST MODE: Skip AI call, only show TypeScript calculations
 * Set to true to avoid spending money on API calls during development
 */
const TEST_MODE = false;

// ============================================
// TYPES
// ============================================

interface FaceAnalysisData {
  id: string;
  landmarks: { x: number; y: number; z: number; index: number }[] | null;
  metrics: Record<string, any> | null;
  created_at: string;
}

// ============================================
// COMPONENT
// ============================================

const AnalysisScreen = () => {
  const { t, i18n } = useTranslation(['analysis', 'common']);
  const { faceAnalysisId } = useLocalSearchParams<{ faceAnalysisId?: string }>();

  // ============================================
  // STATE
  // ============================================
  const [loading, setLoading] = useState(true);
  const [faceData, setFaceData] = useState<FaceAnalysisData | null>(null);
  const [analyzingRegion, setAnalyzingRegion] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<FaceRegion | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [attractivenessScore, setAttractivenessScore] = useState<number | null>(null);
  const [userGender, setUserGender] = useState<'female' | 'male' | 'other' | null>(null);

  // ============================================
  // PREMIUM CONTEXT
  // ============================================
  const {
    isPremium,
    freeAnalysisRegion,
    remainingRights,
    incrementFreeAnalysisCount,
    setFreeAnalysisRegion,
    refreshPremiumStatus,
  } = usePremium();

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    loadLatestFaceAnalysis(faceAnalysisId);
  }, [faceAnalysisId]);

  useEffect(() => {
    if (faceData) {
      calculateAttractivenessWithRegional();
    }
  }, [faceData, userGender]);

  // ============================================
  // DATA LOADING
  // ============================================

  const loadLatestFaceAnalysis = async (specificId?: string) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('No user found in analysis screen');
        Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.noLandmarks'));
        return;
      }

      // Fetch user's gender from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();

      if (profileData?.gender) {
        setUserGender(profileData.gender as 'female' | 'male' | 'other');
      }

      // Fetch face analysis
      let query = supabase
        .from('face_analysis')
        .select('id, landmarks, metrics, created_at')
        .eq('user_id', user.id);

      if (specificId) {
        query = query.eq('id', specificId);
      } else {
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          Alert.alert(
            t('noScanFound.title'),
            t('noScanFound.message'),
            [{ text: t('buttons.done', { ns: 'common' }), onPress: () => router.push('/(tabs)') }]
          );
          return;
        }
        throw error;
      }

      setFaceData(data);
      console.log('📡 [ANALYSIS_LOAD] Face data loaded:', {
        id: data.id,
        hasMetrics: !!data.metrics,
        hasLandmarks: !!data.landmarks,
        metricsKeys: data.metrics ? Object.keys(data.metrics) : []
      });
    } catch (error) {
      console.error('Error loading face analysis:', error);
      Alert.alert(t('errors.title', { ns: 'errors' }), t('alerts.saveError.message', { ns: 'home' }));
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ATTRACTIVENESS CALCULATION
  // ============================================

  const calculateAttractivenessWithRegional = async () => {
    if (!faceData) return;

    try {
      let regionalScores: RegionalScores;

      if (faceData.metrics) {
        // Yeni sistem: Hazır metriklerden skorları al
        regionalScores = {
          eyebrows: faceData.metrics.eyebrows?.overallScore ?? 0,
          nose: faceData.metrics.nose?.overallScore ?? 0,
          eyes: faceData.metrics.eyes?.overallScore ?? 0,
          lips: faceData.metrics.lips?.overallScore ?? 0,
          jawline: faceData.metrics.jawline?.overallScore ?? 0,
        };
        console.log('📊 [ANALYSIS] Using stored regional scores for overall calculation');

        // KVKK Geliştirmesi: Eğer genel çekicilik skoru zaten hesaplanmışsa landmarklara hiç bakma
        if (faceData.metrics.attractiveness) {
          const attr = faceData.metrics.attractiveness;
          console.log('✨ [ANALYSIS] Using pre-calculated overall attractiveness:', attr.overallScore);
          setAttractivenessScore(attr.overallScore);
          return;
        }
      } else if (faceData.landmarks) {
        // Eski sistem: Landmarklardan hesapla
        console.log('🔄 [ANALYSIS] Calculating metrics from legacy landmarks');
        const [eyebrowsCalc, noseCalc, eyesCalc, lipsCalc, jawlineCalc] = await Promise.all([
          import('@/lib/calculations/eyebrows').then(m => m.calculateEyebrowMetrics(faceData.landmarks!)),
          import('@/lib/calculations/nose').then(m => m.calculateNoseMetrics(faceData.landmarks!)),
          import('@/lib/calculations/eyes').then(m => m.calculateEyeMetrics(faceData.landmarks!)),
          import('@/lib/calculations/lips').then(m => m.calculateLipMetrics(faceData.landmarks!)),
          import('@/lib/calculations/jawline').then(m => m.calculateJawlineMetrics(faceData.landmarks!)),
        ]);

        regionalScores = {
          eyebrows: eyebrowsCalc.overallScore,
          nose: noseCalc.overallScore,
          eyes: eyesCalc.overallScore,
          lips: lipsCalc.overallScore,
          jawline: jawlineCalc.overallScore,
        };
      } else {
        return;
      }

      const result = calculateAttractivenessScore(
        (faceData.landmarks || []).map((l, i) => ({ ...l, index: l.index ?? i })),
        userGender,
        regionalScores
      );
      setAttractivenessScore(result.overallScore);
    } catch (error) {
      console.error('Error calculating attractiveness:', error);
      const result = calculateAttractivenessScore(faceData.landmarks || [], userGender);
      setAttractivenessScore(result.overallScore);
    }
  };

  // ============================================
  // SPIN WHEEL HANDLER
  // ============================================

  const handleSpinComplete = async (regionId: string) => {
    await setFreeAnalysisRegion(regionId);

    setTimeout(() => {
      setShowSpinWheel(false);
      Alert.alert(
        t('spinWheel.title'),
        t('freeAnalysisUsed', { region: t(`regions.${regionId}.title`) }),
        [{ text: t('buttons.done', { ns: 'common' }) }]
      );
    }, 1000);
  };

  // ============================================
  // REGION ANALYSIS
  // ============================================

  const handleRegionAnalysis = async (region: FaceRegion, bypassPremiumCheck = false) => {
    // 1. JIT Premium Check
    const isStillPremium = await refreshPremiumStatus();

    // 2. Check access using extracted logic
    const accessResult = checkRegionAccess(
      region.id,
      { isPremium: isStillPremium, freeAnalysisRegion, remainingRights },
      bypassPremiumCheck
    );

    if (!accessResult.canAccess) {
      if (accessResult.action === 'show_spin_wheel') {
        setShowSpinWheel(true);
      } else if (accessResult.action === 'show_premium_modal') {
        setSelectedRegion(region);
        setShowPremiumModal(true);
      }
      return;
    }

    if (accessResult.action === 'increment_count') {
      await incrementFreeAnalysisCount(region.id);
    }

    console.log(`🔍 [REGION_START] Analyzing ${region.id}`, {
      hasMetrics: !!faceData?.metrics?.[region.id],
      hasLandmarks: !!faceData?.landmarks
    });

    // 3. Check OpenRouter configuration
    if (!isOpenRouterConfigured()) {
      Alert.alert(
        t('alerts.apiError.title', { ns: 'home' }),
        t('alerts.apiError.message', { ns: 'home' })
      );
      return;
    }

    if (!faceData?.landmarks && !faceData?.metrics) {
      Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.noLandmarks', { ns: 'errors' }));
      return;
    }

    try {
      setAnalyzingRegion(region.id);
      setSelectedRegion(region);

      // 4. Calculate or fetch metrics
      let calculatedMetrics: any = null;

      if (faceData.metrics?.[region.id]) {
        // Yeni sistem: Kayıtlı metriği kullan
        console.log(`📊 [ANALYSIS] Using stored metrics for region: ${region.id}`);
        calculatedMetrics = faceData.metrics[region.id];
      } else if (faceData.landmarks) {
        // Eski sistem: Landmarklardan hesapla
        console.log(`🔄 [ANALYSIS] Calculating metrics for legacy landmarks: ${region.id}`);
        calculatedMetrics = await calculateMetricsForRegion(region.id, faceData.landmarks);
      }

      console.log(`📊 [METRICS_READY] Metrics for ${region.id}:`, {
        score: calculatedMetrics?.overallScore,
        asymmetry: calculatedMetrics?.asymmetryLevel,
        isFromStored: !!faceData.metrics?.[region.id]
      });

      // 5. Prepare prompt using extracted utility
      const currentLang = (i18n.language || 'en') as SupportedLanguage;
      const finalPrompt = calculatedMetrics
        ? preparePromptForRegion(region, calculatedMetrics, currentLang, userGender)
        : region.prompt;

      console.log('📝 Final prompt prepared for', region.id);

      // 6. Call AI or use test mode
      let result: { success: boolean; analysis?: string; error?: string };

      if (TEST_MODE) {
        console.log('🧪 TEST MODE ACTIVE - AI CALL SKIPPED');
        result = createTestModeResponse(region, calculatedMetrics);
      } else {
        result = await analyzeFaceRegion({
          region: region.id,
          customPrompt: finalPrompt,
          language: i18n.language as 'en' | 'tr',
          gender: userGender,
        });
      }

      if (result.success && result.analysis) {
        // Parse JSON response
        let jsonResult = parseAnalysisResponse(result.analysis);

        // Validate and correct scores
        jsonResult = validateAndCorrectScores(jsonResult, region.id, calculatedMetrics);

        // Apply region-specific filters
        jsonResult = applyRegionFilter(jsonResult, region.id);

        // Show result
        setAnalysisResult(jsonResult);
        setShowResultModal(true);

        // Save to database
        await saveAnalysisToDatabase(region.id as RegionId, jsonResult);
      } else {
        Alert.alert(
          i18n.language === 'tr' ? 'Analiz Hatası' : 'Analysis Error',
          result.error || (i18n.language === 'tr' ? 'Bir hata oluştu' : 'An error occurred')
        );
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.somethingWentWrong', { ns: 'errors' }));
    } finally {
      setAnalyzingRegion(null);
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const parseAnalysisResponse = (analysis: string): Record<string, any> => {
    try {
      return JSON.parse(analysis);
    } catch {
      const cleanedText = analysis
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/g, '')
        .trim();

      try {
        return JSON.parse(cleanedText);
      } catch {
        return { raw_text: analysis };
      }
    }
  };

  const createTestModeResponse = (
    region: FaceRegion,
    calculatedMetrics: any
  ): { success: boolean; analysis: string } => {
    return {
      success: true,
      analysis: JSON.stringify({
        analysis_result: {
          overall_score: calculatedMetrics?.overallScore ?? 0,
          asymmetry_level: calculatedMetrics?.asymmetryLevel ?? 'UNKNOWN',
          general_assessment: '🧪 TEST MODE - AI devre dışı.',
        },
        user_friendly_summary: {
          assessment: '🧪 Test Modu Aktif',
          explanation: 'AI devre dışı. TypeScript hesaplamaları gösteriliyor.',
          key_findings: calculatedMetrics
            ? Object.entries(calculatedMetrics)
              .filter(([_, v]) => typeof v === 'number' || typeof v === 'string')
              .filter(([k]) => !k.includes('landmarkIndices'))
              .slice(0, 12)
              .map(([k, v]) => `${k}: ${typeof v === 'number' ? (Number.isInteger(v) ? v : (v as number).toFixed(2)) : v}`)
            : ['Hesaplama yapılamadı'],
        },
        metadata: {
          test_mode: true,
          calculation_method: 'typescript_precalculated',
          region: region.id,
        },
      }),
    };
  };

  const saveAnalysisToDatabase = async (
    regionId: RegionId,
    rawResponse: Record<string, any>
  ): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const calculatedScore = calculateOverallScore(rawResponse, regionId);

      if (rawResponse.analysis_result) {
        rawResponse.analysis_result.overall_score = calculatedScore;
        rawResponse.analysis_result.confidence_score = calculatedScore;
      }

      const metrics = extractMetrics(regionId, rawResponse);

      await supabase.from('region_analysis').insert({
        user_id: user.id,
        face_analysis_id: faceData?.id,
        region_id: regionId,
        raw_response: rawResponse,
        metrics,
        overall_score: calculatedScore,
      });

      console.log('✅ Analysis saved to database');
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    setAnalysisResult(null);
    setSelectedRegion(null);
  };

  // ============================================
  // RENDER: LOADING STATE
  // ============================================

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-muted-foreground">Yükleniyor...</Text>
      </View>
    );
  }

  // ============================================
  // RENDER: NO DATA STATE
  // ============================================

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

  // ============================================
  // RENDER: MAIN CONTENT
  // ============================================

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold mb-2">{t('header.title')}</Text>
          <Text className="text-muted-foreground">{t('header.subtitle')}</Text>
          <Text className="text-xs text-muted-foreground mt-2">
            {t('lastScan')}: {new Date(faceData.created_at).toLocaleDateString(
              i18n.language === 'tr' ? 'tr-TR' : 'en-US',
              { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
            )}
          </Text>
        </View>

        {/* Attractiveness Score Card */}
        {attractivenessScore !== null && (
          <AttractivenessCard score={attractivenessScore} isPremium={isPremium} />
        )}

        {/* Free User Rights Card */}
        {!isPremium && (
          <FreeUserRightsCard
            remainingRights={remainingRights}
            onSpinPress={() => setShowSpinWheel(true)}
          />
        )}

        {/* Face Region Buttons */}
        <View className="flex-row flex-wrap justify-between">
          {FACE_REGIONS.filter(region => region.id !== 'face_shape').map((region) => {
            const displayStatus = getRegionDisplayStatus(region.id, {
              isPremium,
              freeAnalysisRegion,
              remainingRights,
            });

            return (
              <RegionButton
                key={region.id}
                region={region}
                isUnlocked={displayStatus.isUnlocked}
                isAnalyzing={analyzingRegion === region.id}
                isPremium={isPremium}
                onPress={() => handleRegionAnalysis(region)}
                disabled={analyzingRegion !== null}
              />
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
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-xl font-bold">{t('spinWheel.title')}</Text>
            <Pressable
              onPress={() => setShowSpinWheel(false)}
              className="w-10 h-10 rounded-full bg-muted items-center justify-center"
            >
              <Text className="text-foreground text-xl">×</Text>
            </Pressable>
          </View>
          <ScrollView
            className="flex-1 p-6"
            contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}
          >
            <SpinWheel
              onSpinComplete={handleSpinComplete}
              disabled={!!freeAnalysisRegion}
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
      <AnalysisResultModal
        visible={showResultModal}
        onClose={closeResultModal}
        selectedRegion={selectedRegion}
        analysisResult={analysisResult}
      />
    </View>
  );
};

export default AnalysisScreen;
