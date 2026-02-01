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
import { FACE_REGIONS, METRIC_TRANSLATIONS, type FaceRegion, type SupportedLanguage } from '@/lib/face-prompts';
import { extractMetrics } from '@/lib/metrics';
import { analyzeFaceRegion, isOpenRouterConfigured } from '@/lib/openrouter';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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

// ============================================
// TEST MODE: AI çağrısını atla, sadece hesaplamaları test et
// Para harcamamak için true yap, AI'ı açmak için false yap
// ============================================
const TEST_MODE = true;

interface FaceAnalysisData {
  id: string;
  landmarks: { x: number; y: number; z: number; index: number }[];
  created_at: string;
}

const AnalysisScreen = () => {
  const { t, i18n } = useTranslation(['analysis', 'common']);
  const { faceAnalysisId } = useLocalSearchParams<{ faceAnalysisId?: string }>();
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

  // Premium hook
  const {
    isPremium,
    freeAnalysisCount,
    freeAnalysisRegion,
    remainingRights,
    incrementFreeAnalysisCount,
    setFreeAnalysisRegion,
    refreshPremiumStatus
  } = usePremium();

  useEffect(() => {
    loadLatestFaceAnalysis(faceAnalysisId);
  }, [faceAnalysisId]);

  // Calculate attractiveness score when face data is loaded
  // Now includes regional scores for more accurate assessment
  useEffect(() => {
    if (faceData?.landmarks) {
      calculateAttractivenessWithRegional();
    }
  }, [faceData, userGender]);

  // New function to calculate attractiveness with regional scores
  const calculateAttractivenessWithRegional = async () => {
    if (!faceData?.landmarks) return;

    try {
      // Calculate all regional scores
      const [eyebrowsCalc, noseCalc, eyesCalc, lipsCalc, jawlineCalc] = await Promise.all([
        import('@/lib/calculations/eyebrows').then(m => m.calculateEyebrowMetrics(faceData.landmarks)),
        import('@/lib/calculations/nose').then(m => m.calculateNoseMetrics(faceData.landmarks)),
        import('@/lib/calculations/eyes').then(m => m.calculateEyeMetrics(faceData.landmarks)),
        import('@/lib/calculations/lips').then(m => m.calculateLipMetrics(faceData.landmarks)),
        import('@/lib/calculations/jawline').then(m => m.calculateJawlineMetrics(faceData.landmarks)),
      ]);

      // Extract overall scores from each region
      const regionalScores = {
        eyebrows: eyebrowsCalc.overallScore,
        nose: noseCalc.overallScore,
        eyes: eyesCalc.overallScore,
        lips: lipsCalc.overallScore,
        jawline: jawlineCalc.overallScore,
      };

      console.log('📊 Regional Scores:', regionalScores);

      // Calculate attractiveness with regional integration
      const result = calculateAttractivenessScore(
        faceData.landmarks,
        userGender,
        regionalScores  // NEW: Pass regional scores
      );

      console.log('🎯 Attractiveness Result:', {
        score: result.overallScore,
        confidence: result.confidence,
        hasRegionalData: !!result.breakdown.regional,
        penaltyMultiplier: result.breakdown.regional?.penaltyMultiplier,
      });

      setAttractivenessScore(result.overallScore);
    } catch (error) {
      console.error('Error calculating attractiveness with regional scores:', error);
      // Fallback to simple calculation
      const result = calculateAttractivenessScore(faceData.landmarks, userGender);
      setAttractivenessScore(result.overallScore);
    }
  };

  const loadLatestFaceAnalysis = async (specificId?: string) => {
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

      console.log('Loading face analysis for user:', user.id, 'specificId:', specificId);

      // Fetch user's gender from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();

      if (profileData?.gender) {
        setUserGender(profileData.gender as 'female' | 'male' | 'other');
        console.log('User gender loaded:', profileData.gender);
      }

      // Fetch face analysis - by specific ID if provided, otherwise latest
      let query = supabase
        .from('face_analysis')
        .select('id, landmarks, created_at')
        .eq('user_id', user.id);

      if (specificId) {
        // Load specific face analysis by ID
        query = query.eq('id', specificId);
      } else {
        // Load latest face analysis
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query.single();

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

      // DEBUG-MIRROR: DB'den yüklenen veriyi kontrol et
      console.log('📥 [DEBUG-MIRROR] DB\'DEN YÜKLENDİ:', {
        faceAnalysisId: data?.id,
        requestedId: specificId || 'latest',
        P4_noseTip_x: data?.landmarks[4]?.x.toFixed(2),
        P33_rightEyeOuter_x: data?.landmarks[33]?.x.toFixed(2),
        P263_leftEyeOuter_x: data?.landmarks[263]?.x.toFixed(2),
        mirrorCheck: data?.landmarks[263]?.x > data?.landmarks[33]?.x ? 'NORMAL' : 'MIRRORED',
        createdAt: data?.created_at
      });

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
  const handleSpinComplete = async (regionId: string) => { // Using string to allow broader types, though effectively ID
    // 1. Set the won region and reset count (0)
    await setFreeAnalysisRegion(regionId);

    // 2. Close modal after delay
    setTimeout(() => {
      setShowSpinWheel(false);

      // 3. Show success alert
      Alert.alert(
        t('spinWheel.title'),
        t('freeAnalysisUsed', { region: t(`regions.${regionId}.title`) }),
        [
          { text: "OK" }
        ]
      );
    }, 1000);
  };

  /**
   * Calculate overall_score from sub-scores using weighted average
   * This overrides AI's calculation which is often incorrect
   */
  const calculateOverallScore = (jsonResult: Record<string, any>, regionId: string): number => {
    // Define weights for each region based on customPrompt formulas
    const weights: Record<string, Record<string, number>> = {
      eyebrows: {
        angle_score: 0.35,
        thickness_score: 0.25,
        height_score: 0.20,
        overall_symmetry_score: 0.20,
      },
      eyes: {
        size_score: 0.30,
        shape_score: 0.25,
        position_score: 0.20,
        inter_eye_score: 0.15,
        lid_score: 0.10,
      },
      nose: {
        nose_tip_score: 0.50,
        rotation_score: 0.30,
        nostril_score: 0.20,
      },
      lips: {
        upper_lower_ratio_score: 0.30,
        upper_lip_score: 0.25,
        lower_lip_score: 0.25,
        corner_score: 0.20,
      },
      jawline: {
        chin_tip_score: 0.35,
        symmetry_score: 0.30,
        length_score: 0.20,
        angle_score: 0.15,
      },
      /* face_shape: {
        // Face shape uses confidence_score, not overall_score
        // No calculation needed
      }, */
    };

    // Get weights for this region
    const regionWeights = weights[regionId];
    if (!regionWeights || Object.keys(regionWeights).length === 0) {
      // No weights defined (e.g., face_shape) - use AI's score
      return jsonResult.analysis_result?.overall_score ??
        jsonResult.analysis_result?.confidence_score ??
        0;
    }

    // Extract sub-scores from various possible locations in JSON
    const getScore = (key: string): number | null => {
      // Convert "nose_tip_score" → "nose_tip_analysis"
      const sectionName = key.replace('_score', '_analysis');

      // Check in top-level analysis sections (e.g., nose_tip_analysis.score)
      if (jsonResult[sectionName]?.score !== undefined) {
        return jsonResult[sectionName].score;
      }

      // Fallback: Check in nested structures
      if (jsonResult.symmetry_analysis?.[key] !== undefined) {
        return jsonResult.symmetry_analysis[key];
      }

      if (jsonResult.shape_analysis?.[key] !== undefined) {
        return jsonResult.shape_analysis[key];
      }

      return null;
    };

    // Calculate weighted average
    let weightedSum = 0;
    let totalWeight = 0;
    let missingScores: string[] = [];

    for (const [scoreKey, weight] of Object.entries(regionWeights)) {
      const score = getScore(scoreKey);

      if (score !== null && score !== undefined) {
        weightedSum += score * weight;
        totalWeight += weight;
      } else {
        missingScores.push(scoreKey);
      }
    }

    // If we found any scores, calculate average
    if (totalWeight > 0) {
      const calculated = Math.round(weightedSum / totalWeight);
      console.log(`✅ Calculated overall_score for ${regionId}: ${calculated} (from ${Object.keys(regionWeights).length - missingScores.length}/${Object.keys(regionWeights).length} sub-scores)`);

      if (missingScores.length > 0) {
        console.warn(`⚠️ Missing scores: ${missingScores.join(', ')}`);
      }

      return calculated;
    }

    // Fallback: Use AI's score if we couldn't find sub-scores
    console.warn(`⚠️ Could not calculate overall_score for ${regionId}, using AI's value`);
    return jsonResult.analysis_result?.overall_score ??
      jsonResult.analysis_result?.confidence_score ??
      0;
  };

  const handleRegionAnalysis = async (region: FaceRegion, bypassPremiumCheck = false) => {
    // 1. JIT (Just-In-Time) Premium Check
    // Force a sync with RevenueCat/DB and get the FRESH status
    const isStillPremium = await refreshPremiumStatus();

    // Premium check for non-premium users
    if (!isStillPremium) {
      // If manually bypassing (e.g. from spin wheel), check if we have remaining rights
      if (bypassPremiumCheck) {
        if (remainingRights <= 0) {
          // Should not happen if bypassed correctly, but failsafe
          setShowPremiumModal(true);
          return;
        }
        // Consuming a right happens AFTER successful analysis or when spin completes?
        // Plan said: Spin -> Win Region -> Consume 1 Right -> Analyze
        // Here we just proceed. We need to increment the counter.
        // Let's increment it NOW to ensure it's counted before analysis starts/fails
        await incrementFreeAnalysisCount(region.id);
      } else {
        // User clicked a card directly

        // 1. If we already have a won region
        if (freeAnalysisRegion) {
          if (region.id === freeAnalysisRegion && remainingRights > 0) {
            // Correct region and rights available -> Proceed directly
            await incrementFreeAnalysisCount(region.id);
            // Continue to analysis logic below...
          } else {
            // Wrong region or no rights left -> Locked
            setSelectedRegion(region);
            setShowPremiumModal(true);
            return;
          }
        }
        // 2. No region selected yet, but rights available
        else if (remainingRights > 0) {
          // Show spin wheel to win a region
          setShowSpinWheel(true);
          return;
        }
        // 3. No rights left at all
        else {
          setSelectedRegion(region);
          setShowPremiumModal(true);
          return;
        }
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

      // ============================================
      // 1. CALCULATE METRICS (TYPESCRIPT) - ALL REGIONS
      // ============================================
      let calculatedMetrics: any = null;

      if (region.id === 'nose') {
        // DEBUG-MIRROR: Nose analizi başlamadan önce kontrol
        console.log('🔢 [DEBUG-MIRROR] NOSE ANALİZİ BAŞLIYOR:', {
          landmarks_count: faceData.landmarks.length,
          P4_noseTip_x: faceData.landmarks[4]?.x.toFixed(2),
          P33_rightEyeOuter_x: faceData.landmarks[33]?.x.toFixed(2),
          P263_leftEyeOuter_x: faceData.landmarks[263]?.x.toFixed(2),
          mirrorCheck: faceData.landmarks[263]?.x > faceData.landmarks[33]?.x ? 'NORMAL' : 'MIRRORED'
        });

        // Import dynamically to avoid circular dependencies
        const { calculateNoseMetrics } = await import('@/lib/calculations/nose');
        calculatedMetrics = calculateNoseMetrics(faceData.landmarks);

        console.log('🔢 Calculated nose metrics (TypeScript):', calculatedMetrics);
      } else if (region.id === 'eyes') {
        // Import dynamically to avoid circular dependencies
        const { calculateEyeMetrics } = await import('@/lib/calculations/eyes');
        calculatedMetrics = calculateEyeMetrics(faceData.landmarks);

        console.log('🔢 Calculated eye metrics (TypeScript):', calculatedMetrics);
      } else if (region.id === 'lips') {
        // Import dynamically to avoid circular dependencies
        const { calculateLipMetrics } = await import('@/lib/calculations/lips');
        calculatedMetrics = calculateLipMetrics(faceData.landmarks);

        console.log('🔢 Calculated lip metrics (TypeScript):', calculatedMetrics);
      } else if (region.id === 'jawline') {
        // Import dynamically to avoid circular dependencies
        const { calculateJawlineMetrics } = await import('@/lib/calculations/jawline');
        calculatedMetrics = calculateJawlineMetrics(faceData.landmarks);

        console.log('🔢 Calculated jawline metrics (TypeScript):', calculatedMetrics);
      } else if (region.id === 'eyebrows') {
        // Import dynamically to avoid circular dependencies
        const { calculateEyebrowMetrics } = await import('@/lib/calculations/eyebrows');
        calculatedMetrics = calculateEyebrowMetrics(faceData.landmarks);

        console.log('🔢 Calculated eyebrow metrics (TypeScript):', calculatedMetrics);
      } /* else if (region.id === 'face_shape') {
        // Import dynamically to avoid circular dependencies
        const { calculateFaceShapeMetrics } = await import('@/lib/calculations/face-shape');
        calculatedMetrics = calculateFaceShapeMetrics(faceData.landmarks);

        console.log('🔢 Calculated face shape metrics (TypeScript):', calculatedMetrics);
      } */

      // ============================================
      // 2. PREPARE PROMPT (REPLACE TEMPLATE VARIABLES)
      // ============================================
      let finalPrompt = region.prompt;

      if (region.id === 'nose' && calculatedMetrics) {
        // Replace all template variables with calculated values
        finalPrompt = finalPrompt
          .replace(/{tipDeviation}/g, calculatedMetrics.tipDeviation.toFixed(2))
          .replace(/{tipDeviationRatio}/g, calculatedMetrics.tipDeviationRatio.toFixed(2))
          .replace(/{tipDirection}/g, calculatedMetrics.tipDirection)
          .replace(/{tipScore}/g, calculatedMetrics.tipScore.toString())

          .replace(/{nostrilAsymmetry}/g, calculatedMetrics.nostrilAsymmetry.toFixed(2))
          .replace(/{nostrilAsymmetryRatio}/g, calculatedMetrics.nostrilAsymmetryRatio.toFixed(2))
          .replace(/{nostrilScore}/g, calculatedMetrics.nostrilScore.toString())



          // v2.0 ROTATION METRICS (Hybrid Approach)
          .replace(/{geometricTilt}/g, calculatedMetrics.geometricTilt.toFixed(2))
          .replace(/{geometricTiltDirection}/g, calculatedMetrics.geometricTiltDirection)
          .replace(/{positionalDeviation}/g, calculatedMetrics.positionalDeviation.toFixed(2))
          .replace(/{positionalDeviationDirection}/g, calculatedMetrics.positionalDeviationDirection)
          .replace(/{combinedRotation}/g, calculatedMetrics.combinedRotation.toFixed(2))
          .replace(/{combinedRotationDirection}/g, calculatedMetrics.combinedRotationDirection)
          .replace(/{combinedRotationScore}/g, calculatedMetrics.combinedRotationScore.toString())

          .replace(/{depthDifference}/g, calculatedMetrics.depthDifference.toFixed(3))
          .replace(/{depthScore}/g, calculatedMetrics.depthScore.toString())

          .replace(/{noseWidth}/g, calculatedMetrics.noseWidth.toFixed(2))
          .replace(/{noseWidthRatio}/g, calculatedMetrics.noseWidthRatio.toFixed(2))
          .replace(/{widthScore}/g, calculatedMetrics.widthScore.toString())
          .replace(/{widthAssessment}/g, calculatedMetrics.widthAssessment)

          .replace(/{noseLength}/g, calculatedMetrics.noseLength.toFixed(2))
          .replace(/{noseLengthRatio}/g, calculatedMetrics.noseLengthRatio.toFixed(2))
          .replace(/{lengthScore}/g, calculatedMetrics.lengthScore.toString())
          .replace(/{lengthAssessment}/g, calculatedMetrics.lengthAssessment)

          .replace(/{tipProjection}/g, calculatedMetrics.tipProjection.toFixed(3))
          .replace(/{projectionScore}/g, calculatedMetrics.projectionScore.toString())
          .replace(/{projectionAssessment}/g, calculatedMetrics.projectionAssessment)

          .replace(/{nostrilHeightDiff}/g, calculatedMetrics.nostrilHeightDiff.toFixed(2))
          .replace(/{nostrilHeightDiffRatio}/g, calculatedMetrics.nostrilHeightDiffRatio.toFixed(2))
          .replace(/{nostrilSizeScore}/g, calculatedMetrics.nostrilSizeScore.toString())

          .replace(/{bridgeDeviation}/g, calculatedMetrics.bridgeDeviation.toFixed(2))
          .replace(/{bridgeDeviationRatio}/g, calculatedMetrics.bridgeDeviationRatio.toFixed(2))
          .replace(/{bridgeStraightnessScore}/g, calculatedMetrics.bridgeStraightnessScore.toString())
          .replace(/{bridgeAssessment}/g, calculatedMetrics.bridgeAssessment)

          .replace(/{overallScore}/g, calculatedMetrics.overallScore.toString())
          .replace(/{asymmetryLevel}/g, calculatedMetrics.asymmetryLevel);

        console.log('✅ Nose template variables replaced in prompt');
      } else if (region.id === 'eyes' && calculatedMetrics) {
        // Replace all template variables for eyes
        finalPrompt = finalPrompt
          // Size symmetry
          .replace(/{leftEyeWidth}/g, calculatedMetrics.leftEyeWidth.toFixed(2))
          .replace(/{leftEyeHeight}/g, calculatedMetrics.leftEyeHeight.toFixed(2))
          .replace(/{leftEyeArea}/g, calculatedMetrics.leftEyeArea.toFixed(2))
          .replace(/{rightEyeWidth}/g, calculatedMetrics.rightEyeWidth.toFixed(2))
          .replace(/{rightEyeHeight}/g, calculatedMetrics.rightEyeHeight.toFixed(2))
          .replace(/{rightEyeArea}/g, calculatedMetrics.rightEyeArea.toFixed(2))
          .replace(/{widthDifference}/g, calculatedMetrics.widthDifference.toFixed(2))
          .replace(/{widthDifferenceRatio}/g, calculatedMetrics.widthDifferenceRatio.toFixed(2))
          .replace(/{heightDifference}/g, calculatedMetrics.heightDifference.toFixed(2))
          .replace(/{heightDifferenceRatio}/g, calculatedMetrics.heightDifferenceRatio.toFixed(2))
          .replace(/{areaDifference}/g, calculatedMetrics.areaDifference.toFixed(2))
          .replace(/{areaDifferenceRatio}/g, calculatedMetrics.areaDifferenceRatio.toFixed(2))
          .replace(/{sizeSymmetryScore}/g, calculatedMetrics.sizeSymmetryScore.toString())

          // Position symmetry
          .replace(/{leftEyeCenterX}/g, calculatedMetrics.leftEyeCenterX.toFixed(2))
          .replace(/{leftEyeCenterY}/g, calculatedMetrics.leftEyeCenterY.toFixed(2))
          .replace(/{rightEyeCenterX}/g, calculatedMetrics.rightEyeCenterX.toFixed(2))
          .replace(/{rightEyeCenterY}/g, calculatedMetrics.rightEyeCenterY.toFixed(2))
          .replace(/{verticalMisalignment}/g, calculatedMetrics.verticalMisalignment.toFixed(2))
          .replace(/{verticalMisalignmentRatio}/g, calculatedMetrics.verticalMisalignmentRatio.toFixed(2))
          .replace(/{horizontalAsymmetry}/g, calculatedMetrics.horizontalAsymmetry.toFixed(2))
          .replace(/{positionSymmetryScore}/g, calculatedMetrics.positionSymmetryScore.toString())

          // Inter-eye distance
          .replace(/{interEyeDistance}/g, calculatedMetrics.interEyeDistance.toFixed(2))
          .replace(/{interEyeDistanceRatio}/g, calculatedMetrics.interEyeDistanceRatio.toFixed(2))
          .replace(/{interEyeAssessment}/g, calculatedMetrics.interEyeAssessment)
          .replace(/{interEyeScore}/g, calculatedMetrics.interEyeScore.toString())

          // Shape & canthal tilt
          .replace(/{leftEyeRatio}/g, calculatedMetrics.leftEyeRatio.toFixed(3))
          .replace(/{leftCanthalTilt}/g, calculatedMetrics.leftCanthalTilt.toFixed(2))
          .replace(/{leftCanthalTiltDirection}/g, calculatedMetrics.leftCanthalTiltDirection)
          .replace(/{rightEyeRatio}/g, calculatedMetrics.rightEyeRatio.toFixed(3))
          .replace(/{rightCanthalTilt}/g, calculatedMetrics.rightCanthalTilt.toFixed(2))
          .replace(/{rightCanthalTiltDirection}/g, calculatedMetrics.rightCanthalTiltDirection)
          .replace(/{tiltAsymmetry}/g, calculatedMetrics.tiltAsymmetry.toFixed(2))
          .replace(/{shapeSymmetryScore}/g, calculatedMetrics.shapeSymmetryScore.toString())

          // Eyebrow-to-eye distance
          .replace(/{leftBrowEyeDistance}/g, calculatedMetrics.leftBrowEyeDistance.toFixed(2))
          .replace(/{rightBrowEyeDistance}/g, calculatedMetrics.rightBrowEyeDistance.toFixed(2))
          .replace(/{browEyeAsymmetry}/g, calculatedMetrics.browEyeAsymmetry.toFixed(2))
          .replace(/{browEyeAsymmetryRatio}/g, calculatedMetrics.browEyeAsymmetryRatio.toFixed(2))
          .replace(/{browEyeScore}/g, calculatedMetrics.browEyeScore.toString())

          // Eyelid analysis
          .replace(/{leftUpperLidExposure}/g, calculatedMetrics.leftUpperLidExposure.toFixed(2))
          .replace(/{rightUpperLidExposure}/g, calculatedMetrics.rightUpperLidExposure.toFixed(2))
          .replace(/{upperLidAsymmetry}/g, calculatedMetrics.upperLidAsymmetry.toFixed(2))
          .replace(/{upperLidAsymmetryRatio}/g, calculatedMetrics.upperLidAsymmetryRatio.toFixed(2))
          .replace(/{lowerLidAsymmetry}/g, calculatedMetrics.lowerLidAsymmetry.toFixed(2))
          .replace(/{lowerLidAsymmetryRatio}/g, calculatedMetrics.lowerLidAsymmetryRatio.toFixed(2))
          .replace(/{eyelidScore}/g, calculatedMetrics.eyelidScore.toString())

          // 3D depth
          .replace(/{depthDifference}/g, calculatedMetrics.depthDifference.toFixed(3))
          .replace(/{depthScore}/g, calculatedMetrics.depthScore.toString())

          // Overall
          .replace(/{overallScore}/g, calculatedMetrics.overallScore.toString())
          .replace(/{asymmetryLevel}/g, calculatedMetrics.asymmetryLevel);

        console.log('✅ Eyes template variables replaced in prompt');
      } else if (region.id === 'lips' && calculatedMetrics) {
        // Replace all template variables for lips
        finalPrompt = finalPrompt
          // Corner alignment
          .replace(/{leftCornerX}/g, calculatedMetrics.leftCornerX.toFixed(2))
          .replace(/{leftCornerY}/g, calculatedMetrics.leftCornerY.toFixed(2))
          .replace(/{rightCornerX}/g, calculatedMetrics.rightCornerX.toFixed(2))
          .replace(/{rightCornerY}/g, calculatedMetrics.rightCornerY.toFixed(2))
          .replace(/{cornerYDifference}/g, calculatedMetrics.cornerYDifference.toFixed(2))
          .replace(/{cornerYDifferenceRatio}/g, calculatedMetrics.cornerYDifferenceRatio.toFixed(2))
          .replace(/{lipLineTilt}/g, calculatedMetrics.lipLineTilt.toFixed(2))
          .replace(/{lipLineTiltDirection}/g, calculatedMetrics.lipLineTiltDirection)
          .replace(/{cornerAlignmentScore}/g, calculatedMetrics.cornerAlignmentScore.toString())

          // Width symmetry
          .replace(/{lipWidth}/g, calculatedMetrics.lipWidth.toFixed(2))
          .replace(/{lipWidthRatio}/g, calculatedMetrics.lipWidthRatio.toFixed(2))
          .replace(/{leftHalfWidth}/g, calculatedMetrics.leftHalfWidth.toFixed(2))
          .replace(/{rightHalfWidth}/g, calculatedMetrics.rightHalfWidth.toFixed(2))
          .replace(/{widthAsymmetry}/g, calculatedMetrics.widthAsymmetry.toFixed(2))
          .replace(/{widthAsymmetryRatio}/g, calculatedMetrics.widthAsymmetryRatio.toFixed(2))
          .replace(/{lipWidthSymmetryScore}/g, calculatedMetrics.lipWidthSymmetryScore.toString())
          .replace(/{lipCenterDeviation}/g, calculatedMetrics.lipCenterDeviation.toFixed(2))
          .replace(/{lipCenterDeviationRatio}/g, calculatedMetrics.lipCenterDeviationRatio.toFixed(2))
          .replace(/{lipCenterScore}/g, calculatedMetrics.lipCenterScore.toString())

          // Upper lip symmetry
          .replace(/{leftUpperLipHeight}/g, calculatedMetrics.leftUpperLipHeight.toFixed(2))
          .replace(/{rightUpperLipHeight}/g, calculatedMetrics.rightUpperLipHeight.toFixed(2))
          .replace(/{upperLipHeightDifference}/g, calculatedMetrics.upperLipHeightDifference.toFixed(2))
          .replace(/{upperLipHeightDifferenceRatio}/g, calculatedMetrics.upperLipHeightDifferenceRatio.toFixed(2))
          .replace(/{upperLipSymmetryScore}/g, calculatedMetrics.upperLipSymmetryScore.toString())

          // Lower lip symmetry
          .replace(/{leftLowerLipHeight}/g, calculatedMetrics.leftLowerLipHeight.toFixed(2))
          .replace(/{rightLowerLipHeight}/g, calculatedMetrics.rightLowerLipHeight.toFixed(2))
          .replace(/{lowerLipHeightDifference}/g, calculatedMetrics.lowerLipHeightDifference.toFixed(2))
          .replace(/{lowerLipHeightDifferenceRatio}/g, calculatedMetrics.lowerLipHeightDifferenceRatio.toFixed(2))
          .replace(/{lowerLipSymmetryScore}/g, calculatedMetrics.lowerLipSymmetryScore.toString())

          // Cupid's bow
          .replace(/{leftCupidBowHeight}/g, calculatedMetrics.leftCupidBowHeight.toFixed(2))
          .replace(/{rightCupidBowHeight}/g, calculatedMetrics.rightCupidBowHeight.toFixed(2))
          .replace(/{cupidBowDifference}/g, calculatedMetrics.cupidBowDifference.toFixed(2))
          .replace(/{cupidBowDifferenceRatio}/g, calculatedMetrics.cupidBowDifferenceRatio.toFixed(2))
          .replace(/{cupidBowPresence}/g, calculatedMetrics.cupidBowPresence.toString())
          .replace(/{cupidBowSymmetryScore}/g, calculatedMetrics.cupidBowSymmetryScore.toString())

          // Upper/lower ratio
          .replace(/{upperLipHeight}/g, calculatedMetrics.upperLipHeight.toFixed(2))
          .replace(/{lowerLipHeight}/g, calculatedMetrics.lowerLipHeight.toFixed(2))
          .replace(/{totalLipHeight}/g, calculatedMetrics.totalLipHeight.toFixed(2))
          .replace(/{upperLowerRatio}/g, calculatedMetrics.upperLowerRatio.toFixed(3))
          .replace(/{ratioAssessment}/g, calculatedMetrics.ratioAssessment)
          .replace(/{upperLowerRatioScore}/g, calculatedMetrics.upperLowerRatioScore.toString())

          // Vermillion border
          .replace(/{leftLineY}/g, calculatedMetrics.leftLineY.toFixed(2))
          .replace(/{rightLineY}/g, calculatedMetrics.rightLineY.toFixed(2))
          .replace(/{lineYDifference}/g, calculatedMetrics.lineYDifference.toFixed(2))
          .replace(/{lineYDifferenceRatio}/g, calculatedMetrics.lineYDifferenceRatio.toFixed(2))
          .replace(/{lineSymmetryScore}/g, calculatedMetrics.lineSymmetryScore.toString())

          // 3D depth
          .replace(/{depthDifference}/g, calculatedMetrics.depthDifference.toFixed(3))
          .replace(/{depthScore}/g, calculatedMetrics.depthScore.toString())

          // Overall
          .replace(/{overallScore}/g, calculatedMetrics.overallScore.toString())
          .replace(/{asymmetryLevel}/g, calculatedMetrics.asymmetryLevel);

        console.log('✅ Lips template variables replaced in prompt');
      } else if (region.id === 'jawline' && calculatedMetrics) {
        // Replace all template variables for jawline
        finalPrompt = finalPrompt
          // Chin centering
          .replace(/{chinTipX}/g, calculatedMetrics.chinTipX.toFixed(2))
          .replace(/{chinTipY}/g, calculatedMetrics.chinTipY.toFixed(2))
          .replace(/{faceCenterX}/g, calculatedMetrics.faceCenterX.toFixed(2))
          .replace(/{chinDeviation}/g, calculatedMetrics.chinDeviation.toFixed(2))
          .replace(/{chinDeviationRatio}/g, calculatedMetrics.chinDeviationRatio.toFixed(2))
          .replace(/{chinDirection}/g, calculatedMetrics.chinDirection)
          .replace(/{chinCenteringScore}/g, calculatedMetrics.chinCenteringScore.toString())

          // Jawline symmetry
          .replace(/{leftJawLength}/g, calculatedMetrics.leftJawLength.toFixed(2))
          .replace(/{rightJawLength}/g, calculatedMetrics.rightJawLength.toFixed(2))
          .replace(/{jawLengthDifference}/g, calculatedMetrics.jawLengthDifference.toFixed(2))
          .replace(/{jawLengthDifferenceRatio}/g, calculatedMetrics.jawLengthDifferenceRatio.toFixed(2))
          .replace(/{leftJawAngleY}/g, calculatedMetrics.leftJawAngleY.toFixed(2))
          .replace(/{rightJawAngleY}/g, calculatedMetrics.rightJawAngleY.toFixed(2))
          .replace(/{jawAngleYDifference}/g, calculatedMetrics.jawAngleYDifference.toFixed(2))
          .replace(/{jawlineSymmetryScore}/g, calculatedMetrics.jawlineSymmetryScore.toString())

          // Jaw angle symmetry (angle only - sharpness removed)
          .replace(/{leftJawAngle}/g, calculatedMetrics.leftJawAngle.toFixed(2))
          .replace(/{rightJawAngle}/g, calculatedMetrics.rightJawAngle.toFixed(2))
          .replace(/{jawAngleDifference}/g, calculatedMetrics.jawAngleDifference.toFixed(2))
          .replace(/{jawAngleSymmetryScore}/g, calculatedMetrics.jawAngleSymmetryScore.toString())

          // Jaw width
          .replace(/{jawWidth}/g, calculatedMetrics.jawWidth.toFixed(2))
          .replace(/{faceWidth}/g, calculatedMetrics.faceWidth.toFixed(2))
          .replace(/{jawWidthRatio}/g, calculatedMetrics.jawWidthRatio.toFixed(2))
          .replace(/{jawWidthAssessment}/g, calculatedMetrics.jawWidthAssessment)
          .replace(/{jawWidthScore}/g, calculatedMetrics.jawWidthScore.toString())

          // Vertical alignment
          .replace(/{noseToChinDistance}/g, calculatedMetrics.noseToChinDistance.toFixed(2))
          .replace(/{expectedChinY}/g, calculatedMetrics.expectedChinY.toFixed(2))
          .replace(/{verticalDeviation}/g, calculatedMetrics.verticalDeviation.toFixed(2))
          .replace(/{verticalAlignmentScore}/g, calculatedMetrics.verticalAlignmentScore.toString())

          // Overall & metadata
          .replace(/{faceHeight}/g, calculatedMetrics.faceHeight.toFixed(2))
          .replace(/{overallScore}/g, calculatedMetrics.overallScore.toString())
          .replace(/{asymmetryLevel}/g, calculatedMetrics.asymmetryLevel);

        console.log('✅ Jawline template variables replaced in prompt');
      } else if (region.id === 'eyebrows' && calculatedMetrics) {
        // Replace all template variables for eyebrows
        finalPrompt = finalPrompt
          // Brow height symmetry
          .replace(/{leftBrowHighestY}/g, calculatedMetrics.leftBrowHighestY.toFixed(2))
          .replace(/{rightBrowHighestY}/g, calculatedMetrics.rightBrowHighestY.toFixed(2))
          .replace(/{browHeightDifference}/g, calculatedMetrics.browHeightDifference.toFixed(2))
          .replace(/{browHeightDifferenceRatio}/g, calculatedMetrics.browHeightDifferenceRatio.toFixed(2))
          .replace(/{browHeightDirection}/g, calculatedMetrics.browHeightDirection || 'EQUAL')
          .replace(/{browHeightSymmetryScore}/g, calculatedMetrics.browHeightSymmetryScore.toString())

          // Arch height symmetry
          .replace(/{leftArchHeight}/g, calculatedMetrics.leftArchHeight.toFixed(2))
          .replace(/{rightArchHeight}/g, calculatedMetrics.rightArchHeight.toFixed(2))
          .replace(/{archHeightDifference}/g, calculatedMetrics.archHeightDifference.toFixed(2))
          .replace(/{archHeightDifferenceRatio}/g, calculatedMetrics.archHeightDifferenceRatio.toFixed(2))
          .replace(/{archHeightSymmetryScore}/g, calculatedMetrics.archHeightSymmetryScore.toString())

          // Brow-eye distance
          .replace(/{leftBrowEyeDistance}/g, calculatedMetrics.leftBrowEyeDistance.toFixed(2))
          .replace(/{rightBrowEyeDistance}/g, calculatedMetrics.rightBrowEyeDistance.toFixed(2))
          .replace(/{browEyeDistanceAsymmetry}/g, calculatedMetrics.browEyeDistanceAsymmetry.toFixed(2))
          .replace(/{browEyeDistanceRatio}/g, calculatedMetrics.browEyeDistanceRatio.toFixed(2))
          .replace(/{browEyeDistanceAssessment}/g, calculatedMetrics.browEyeDistanceAssessment)
          .replace(/{browEyeDistanceScore}/g, calculatedMetrics.browEyeDistanceScore.toString())

          // Inner corner distance (between brow inner corners)
          .replace(/{innerCornerDistance}/g, calculatedMetrics.innerCornerDistance.toFixed(2))
          .replace(/{leftInnerCornerDistance}/g, calculatedMetrics.leftInnerCornerDistance.toFixed(2))
          .replace(/{rightInnerCornerDistance}/g, calculatedMetrics.rightInnerCornerDistance.toFixed(2))
          .replace(/{innerCornerDistanceAsymmetry}/g, calculatedMetrics.innerCornerDistanceAsymmetry.toFixed(2))
          .replace(/{innerCornerDistanceRatio}/g, calculatedMetrics.innerCornerDistanceRatio.toFixed(2))
          .replace(/{innerCornerAssessment}/g, calculatedMetrics.innerCornerAssessment)
          .replace(/{innerCornerDistanceAssessment}/g, calculatedMetrics.innerCornerAssessment)
          .replace(/{innerCornerDistanceScore}/g, calculatedMetrics.innerCornerDistanceScore.toString())

          // Brow angle
          .replace(/{leftBrowAngle}/g, calculatedMetrics.leftBrowAngle.toFixed(2))
          .replace(/{rightBrowAngle}/g, calculatedMetrics.rightBrowAngle.toFixed(2))
          .replace(/{browAngleDifference}/g, calculatedMetrics.browAngleDifference.toFixed(2))
          .replace(/{browAngleSymmetryScore}/g, calculatedMetrics.browAngleSymmetryScore.toString())

          // Brow thickness
          .replace(/{leftBrowThickness}/g, calculatedMetrics.leftBrowThickness.toFixed(2))
          .replace(/{rightBrowThickness}/g, calculatedMetrics.rightBrowThickness.toFixed(2))
          .replace(/{browThicknessDifference}/g, calculatedMetrics.browThicknessDifference.toFixed(2))
          .replace(/{browThicknessDifferenceRatio}/g, calculatedMetrics.browThicknessDifferenceRatio.toFixed(2))
          .replace(/{browThicknessSymmetryScore}/g, calculatedMetrics.browThicknessSymmetryScore.toString())

          // Brow length
          .replace(/{leftBrowLength}/g, calculatedMetrics.leftBrowLength.toFixed(2))
          .replace(/{rightBrowLength}/g, calculatedMetrics.rightBrowLength.toFixed(2))
          .replace(/{browLengthDifference}/g, calculatedMetrics.browLengthDifference.toFixed(2))
          .replace(/{browLengthDifferenceRatio}/g, calculatedMetrics.browLengthDifferenceRatio.toFixed(2))
          .replace(/{browLengthSymmetryScore}/g, calculatedMetrics.browLengthSymmetryScore.toString())

          // Individual brow scores & directions
          .replace(/{leftBrowScore}/g, calculatedMetrics.leftBrowScore.toString())
          .replace(/{rightBrowScore}/g, calculatedMetrics.rightBrowScore.toString())
          .replace(/{leftBrowDirection}/g, calculatedMetrics.leftBrowDirection)
          .replace(/{rightBrowDirection}/g, calculatedMetrics.rightBrowDirection)

          // Overall & metadata
          .replace(/{faceHeight}/g, calculatedMetrics.faceHeight.toFixed(2))
          .replace(/{overallScore}/g, calculatedMetrics.overallScore.toString())
          .replace(/{asymmetryLevel}/g, calculatedMetrics.asymmetryLevel);

        console.log('✅ Eyebrows template variables replaced in prompt');
      } /* else if (region.id === 'face_shape' && calculatedMetrics) {
        // Replace all template variables for face shape
        finalPrompt = finalPrompt
          // Face dimensions
          .replace(/{faceLength}/g, calculatedMetrics.faceLength.toFixed(2))
          .replace(/{faceWidth}/g, calculatedMetrics.faceWidth.toFixed(2))
          .replace(/{cheekboneWidth}/g, calculatedMetrics.cheekboneWidth.toFixed(2))
          .replace(/{jawlineWidth}/g, calculatedMetrics.jawlineWidth.toFixed(2))
          .replace(/{foreheadWidth}/g, calculatedMetrics.foreheadWidth.toFixed(2))

          // Face shape classification
          .replace(/{lengthWidthRatio}/g, calculatedMetrics.lengthWidthRatio.toFixed(2))
          .replace(/{jawCheekRatio}/g, calculatedMetrics.jawCheekRatio.toFixed(2))
          .replace(/{foreheadJawRatio}/g, calculatedMetrics.foreheadJawRatio.toFixed(2))
          .replace(/{faceShape}/g, calculatedMetrics.faceShape)
          .replace(/{shapeConfidence}/g, calculatedMetrics.shapeConfidence.toString())
          .replace(/{alternativeShape}/g, calculatedMetrics.alternativeShape || 'N/A')

          // Facial thirds
          .replace(/{upperThird}/g, calculatedMetrics.upperThird.toFixed(2))
          .replace(/{middleThird}/g, calculatedMetrics.middleThird.toFixed(2))
          .replace(/{lowerThird}/g, calculatedMetrics.lowerThird.toFixed(2))
          .replace(/{upperThirdRatio}/g, calculatedMetrics.upperThirdRatio.toFixed(2))
          .replace(/{middleThirdRatio}/g, calculatedMetrics.middleThirdRatio.toFixed(2))
          .replace(/{lowerThirdRatio}/g, calculatedMetrics.lowerThirdRatio.toFixed(2))
          .replace(/{thirdsDeviation}/g, calculatedMetrics.thirdsDeviation.toFixed(2))
          .replace(/{facialThirdsScore}/g, calculatedMetrics.facialThirdsScore.toString())

          // Horizontal symmetry
          .replace(/{leftFaceWidth}/g, calculatedMetrics.leftFaceWidth.toFixed(2))
          .replace(/{rightFaceWidth}/g, calculatedMetrics.rightFaceWidth.toFixed(2))
          .replace(/{horizontalAsymmetry}/g, calculatedMetrics.horizontalAsymmetry.toFixed(2))
          .replace(/{horizontalAsymmetryRatio}/g, calculatedMetrics.horizontalAsymmetryRatio.toFixed(2))
          .replace(/{horizontalSymmetryScore}/g, calculatedMetrics.horizontalSymmetryScore.toString())

          // Proportion scores
          .replace(/{goldenRatioDeviation}/g, calculatedMetrics.goldenRatioDeviation.toFixed(3))
          .replace(/{goldenRatioScore}/g, calculatedMetrics.goldenRatioScore.toString())
          .replace(/{proportionScore}/g, calculatedMetrics.proportionScore.toString())

          // Overall
          .replace(/{overallScore}/g, calculatedMetrics.overallScore.toString())
          .replace(/{proportionAssessment}/g, calculatedMetrics.proportionAssessment);

        console.log('✅ Face shape template variables replaced in prompt');
      } */

      // ============================================
      // 2.5. REPLACE LANGUAGE-SPECIFIC LABELS
      // ============================================
      const currentLang = (i18n.language || 'en') as SupportedLanguage;
      const labels = METRIC_TRANSLATIONS[currentLang] || METRIC_TRANSLATIONS.en;

      // Replace all label placeholders with localized strings
      finalPrompt = finalPrompt
        // Units
        .replace(/{unit_pixels}/g, labels.pixels)
        .replace(/{unit_degrees}/g, labels.degrees)
        // Eyebrow labels
        .replace(/{label_height_difference}/g, labels.height_difference)
        .replace(/{label_arch_difference}/g, labels.arch_difference)
        .replace(/{label_angle_difference}/g, labels.angle_difference)
        // Eye labels
        .replace(/{label_width_difference}/g, labels.width_difference)
        .replace(/{label_vertical_misalignment}/g, labels.vertical_misalignment)
        .replace(/{label_inter_eye_distance}/g, labels.inter_eye_distance)
        // Nose labels
        .replace(/{label_nose_tip_deviation}/g, labels.nose_tip_deviation)
        .replace(/{label_nostril_asymmetry}/g, labels.nostril_asymmetry)
        .replace(/{label_combined_rotation}/g, labels.combined_rotation)
        // Lip labels
        .replace(/{label_corner_alignment}/g, labels.corner_alignment)
        .replace(/{label_width_asymmetry}/g, labels.width_asymmetry)
        .replace(/{label_upper_lower_ratio}/g, labels.upper_lower_ratio)
        // Jawline labels
        .replace(/{label_chin_deviation}/g, labels.chin_deviation)
        .replace(/{label_jawline_difference}/g, labels.jawline_difference);

      console.log('✅ Language-specific labels replaced for:', currentLang);

      console.log(finalPrompt, "final prompt")

      // ============================================
      // 3. TEST MODE OR AI CALL
      // ============================================
      let result: { success: boolean; analysis?: string; error?: string };

      if (TEST_MODE) {
        // 🧪 TEST MODE: AI çağrısı atlanıyor, sadece hesaplanan değerler gösteriliyor
        console.log('🧪 ==========================================');
        console.log('🧪 TEST MODE ACTIVE - AI CALL SKIPPED');
        console.log('🧪 ==========================================');
        console.log('📊 Calculated metrics for', region.id, ':', calculatedMetrics);

        // Mock response - hesaplanan değerleri göster
        result = {
          success: true,
          analysis: JSON.stringify({
            analysis_result: {
              overall_score: calculatedMetrics?.overallScore ?? 0,
              asymmetry_level: calculatedMetrics?.asymmetryLevel ?? calculatedMetrics?.proportionAssessment ?? 'UNKNOWN',
              general_assessment: '🧪 TEST MODE - AI devre dışı. TypeScript hesaplamaları gösteriliyor.',
            },
            user_friendly_summary: {
              assessment: '🧪 Test Modu Aktif',
              explanation: 'AI çağrısı yapılmadı. Aşağıda TypeScript tarafından hesaplanan ham değerler gösterilmektedir. Console\'u kontrol edin.',
              key_findings: calculatedMetrics
                ? Object.entries(calculatedMetrics)
                  .filter(([_, value]) => typeof value === 'number' || typeof value === 'string')
                  .filter(([key]) => !key.includes('landmarkIndices'))
                  .slice(0, 12)
                  .map(([key, value]) => `${key}: ${typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value}`)
                : ['Hesaplama yapılamadı']
            },
            calculated_metrics: calculatedMetrics,
            metadata: {
              test_mode: true,
              calculation_method: 'typescript_precalculated',
              ai_skipped: true,
              region: region.id
            }
          })
        };

        console.log('🧪 Mock result created:', result);
      } else {
        // Normal AI call (para harcar)
        result = await analyzeFaceRegion({
          // landmarks: faceData.landmarks, // REMOVED for optimization
          region: region.id,
          customPrompt: finalPrompt,
          language: i18n.language as 'en' | 'tr',
          gender: userGender,
        });
      }

      console.log('Analysis result for region', region.id, ':', result);

      // Log detailed error if present
      if (!result.success) {
        console.error('❌ Analysis failed with details:', {
          error: result.error,
          // @ts-ignore - details might exist in error response
          details: result.details,
        });
      }

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

        // ============================================
        // 4. VALIDATE AI RESPONSE (NOSE, EYES, LIPS, JAWLINE, EYEBROWS, FACE_SHAPE)
        // ============================================
        if ((region.id === 'nose' || region.id === 'eyes' || region.id === 'lips' || region.id === 'jawline' || region.id === 'eyebrows' || region.id === 'face_shape') && calculatedMetrics) {
          const aiScore = jsonResult.analysis_result?.overall_score;

          if (aiScore !== calculatedMetrics.overallScore) {
            console.warn(`⚠️ AI returned wrong score for ${region.id}!`);
            console.warn(`  Expected: ${calculatedMetrics.overallScore}`);
            console.warn(`  AI returned: ${aiScore}`);
            console.warn(`  Forcing correct score...`);

            // Force correct score in response
            if (!jsonResult.analysis_result) {
              jsonResult.analysis_result = {};
            }
            jsonResult.analysis_result.overall_score = calculatedMetrics.overallScore;
            jsonResult.analysis_result.asymmetry_level = calculatedMetrics.asymmetryLevel;
          }

          // Ensure metadata is correct
          if (!jsonResult.metadata) {
            jsonResult.metadata = {};
          }
          jsonResult.metadata.calculation_method = 'typescript_precalculated';

          console.log(`✅ ${region.id} AI response validated and corrected if needed`);
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
        // Show error message
        Alert.alert(
          i18n.language === 'tr' ? 'Analiz Hatası' : 'Analysis Error',
          result.error || (i18n.language === 'tr'
            ? 'Analiz yapılırken bir hata oluştu'
            : 'An error occurred during analysis')
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

      // ✨ Calculate overall_score ourselves (don't trust AI)
      const calculatedScore = calculateOverallScore(rawResponse, regionId);

      // Override AI's overall_score with our calculation
      if (rawResponse.analysis_result) {
        const aiScore = rawResponse.analysis_result.overall_score ??
          rawResponse.analysis_result.confidence_score;

        if (aiScore !== calculatedScore) {
          console.warn(`🔧 Correcting AI score: ${aiScore} → ${calculatedScore}`);
        }

        rawResponse.analysis_result.overall_score = calculatedScore;
        rawResponse.analysis_result.confidence_score = calculatedScore;
      }

      // Extract metrics for comparison
      const metrics = extractMetrics(regionId, rawResponse);
      const overallScore = calculatedScore;

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
    <View className="flex-1 bg-background">
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

        {/* Free User Rights Status using Counter */}
        {!isPremium && (
          <Card className={`mb-6 p-4 border-2 ${remainingRights > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${remainingRights > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Text className={`text-xl font-bold ${remainingRights > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {remainingRights}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className={`font-bold text-lg ${remainingRights > 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {remainingRights > 0 ? t('freeAnalysis.rightsAvailable') : t('freeAnalysis.noRights')}
                  </Text>
                  <Text className={`text-sm ${remainingRights > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {remainingRights > 0
                      ? t('freeAnalysis.rightsDescription', { count: remainingRights, total: 3 })
                      : t('freeAnalysis.upgradeDescription')}
                  </Text>
                </View>
              </View>

              {remainingRights > 0 && (
                <Pressable onPress={() => setShowSpinWheel(true)} className="bg-green-600 px-3 py-1.5 rounded-full">
                  <Text className="text-white text-xs font-bold">{t('spinWheel.button')}</Text>
                </Pressable>
              )}
            </View>
          </Card>
        )}

        {/* Face Region Buttons */}
        <View className="flex-row flex-wrap justify-between">
          {FACE_REGIONS.filter(region => region.id !== 'face_shape').map((region) => {
            // Logic:
            // 1. Premium: Always unlocked
            // 2. Free & Region Won & Rights > 0: Unlocked if matches won region
            // 3. Free & Region Won & Rights == 0: Locked (expired)
            // 4. Free & No Region Won: Locked (must spin wheel)

            const isWonRegion = freeAnalysisRegion === region.id;
            const hasRights = remainingRights > 0;

            const isUnlocked = isPremium || (isWonRegion && hasRights);
            const isLocked = !isUnlocked;

            return (
              <Pressable
                key={region.id}
                onPress={() => handleRegionAnalysis(region)}
                disabled={analyzingRegion !== null}
                className="active:opacity-70"
                style={{ width: '48%', marginBottom: 16 }}
              >
                <Card className={`p-3 border bg-card ${isLocked ? 'border-border/50 opacity-80' : 'border-border'}`} style={{ height: 205 }}>
                  {/* Icon */}
                  <View className={`w-14 h-14 rounded-full items-center justify-center mb-2 ${isLocked ? 'bg-muted' : 'bg-primary/10'}`}>
                    {typeof region.icon === 'string' ? (
                      <Text className="text-3xl">{region.icon}</Text>
                    ) : (
                      <Image source={region.icon} style={{ width: 32, height: 32 }} resizeMode="contain" />
                    )}
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-base font-bold flex-shrink" numberOfLines={1}>{t(`regions.${region.id}.title`)}</Text>
                      {analyzingRegion === region.id ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                      ) : isLocked ? (
                        <Ionicons name="diamond-outline" size={18} color="#9CA3AF" />
                      ) : (
                        <Ionicons name="scan" size={20} color="#8B5CF6" />
                      )}
                    </View>
                    {isLocked && (
                      <View className="flex-row items-center mb-1">
                        <Ionicons name="lock-closed" size={10} color="#9CA3AF" style={{ marginRight: 4 }} />
                        <Text className="text-xs text-muted-foreground">{t('locked', { ns: 'common', defaultValue: 'Locked' })}</Text>
                      </View>
                    )}
                    {/* Only show 'Free' badge if user is not premium but has rights */}
                    {isUnlocked && !isPremium && (
                      <View className="bg-green-100 px-2 py-0.5 rounded-full self-start mb-1">
                        <Text className="text-xs text-green-700 font-medium">{t('freeBadge')}</Text>
                      </View>
                    )}
                    <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                      {t(`regions.${region.id}.description`)}
                    </Text>
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
              disabled={!!freeAnalysisRegion} // Disabled if user already has a region selected
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
            <Pressable
              onPress={closeResultModal}
              className="bg-primary py-4 rounded-lg items-center active:opacity-80"
            >
              <Text className="text-primary-foreground font-semibold text-base">
                {t('closeButton')}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default AnalysisScreen;
