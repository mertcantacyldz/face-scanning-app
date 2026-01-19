// Nose Metrics Extractor
// Extracts comparison-relevant metrics from nose AI analysis

import type { NoseMetrics } from './index';
import { getNestedValue, normalizeScore, parseAsymmetryLevel } from './index';

export function extractNoseMetrics(rawResponse: Record<string, any>): NoseMetrics {
  const analysisResult = rawResponse.analysis_result || {};
  const detailedAnalysis = rawResponse.detailed_analysis || {};
  const symmetryAnalysis = detailedAnalysis.symmetry_analysis || rawResponse.symmetry_analysis || {};
  const bridgeAnalysis = detailedAnalysis.bridge_analysis || rawResponse.bridge_analysis || {};
  const tipAnalysis = detailedAnalysis.tip_analysis || rawResponse.tip_analysis || {};
  const nostrilAnalysis = detailedAnalysis.nostril_analysis || rawResponse.nostril_analysis || {};

  // Extract overall score
  const overallScore = normalizeScore(
    analysisResult.overall_score ??
    getNestedValue(rawResponse, 'overall_score') ??
    0
  );

  // Extract symmetry score
  const symmetryScore = normalizeScore(
    symmetryAnalysis.symmetry_score ??
    analysisResult.symmetry_score ??
    getNestedValue(rawResponse, 'symmetry_score')
  );

  // Extract asymmetry level
  const asymmetryLevel = parseAsymmetryLevel(
    analysisResult.asymmetry_level ??
    symmetryAnalysis.asymmetry_level ??
    getNestedValue(rawResponse, 'asymmetry_level')
  );

  // Extract deviation angle (specific to nose)
  const deviationAngle =
    symmetryAnalysis.deviation_angle ??
    bridgeAnalysis.deviation_angle ??
    analysisResult.deviation_angle ??
    getNestedValue(rawResponse, 'deviation_angle');

  // Extract bridge straightness
  const bridgeStraightness =
    bridgeAnalysis.straightness ??
    bridgeAnalysis.bridge_straightness ??
    symmetryAnalysis.bridge_alignment ??
    getNestedValue(rawResponse, 'bridge_straightness');

  // Extract tip position
  const tipPosition =
    tipAnalysis.position ??
    tipAnalysis.tip_position ??
    analysisResult.tip_position ??
    getNestedValue(rawResponse, 'tip_position');

  // Extract nostril symmetry
  const nostrilSymmetry =
    nostrilAnalysis.symmetry ??
    nostrilAnalysis.nostril_symmetry ??
    symmetryAnalysis.nostril_symmetry ??
    getNestedValue(rawResponse, 'nostril_symmetry');

  // Detect calculation source from metadata
  const calculationMethod = rawResponse.metadata?.calculation_method;
  const calculationSource =
    calculationMethod === 'typescript_precalculated' ? 'typescript' : 'ai';

  return {
    overall_score: overallScore,
    general_assessment: analysisResult.general_assessment,
    symmetry_score: symmetryScore || undefined,
    asymmetry_level: asymmetryLevel !== 'UNKNOWN' ? asymmetryLevel : undefined,
    deviation_angle: typeof deviationAngle === 'number' ? deviationAngle : undefined,
    bridge_straightness: bridgeStraightness,
    tip_position: tipPosition,
    nostril_symmetry: nostrilSymmetry,
    calculation_source: calculationSource as 'typescript' | 'ai',
  };
}
