// Eyebrows Metrics Extractor
// Extracts comparison-relevant metrics from eyebrows AI analysis

import type { EyebrowsMetrics } from './index';
import { getNestedValue, normalizeScore, parseAsymmetryLevel } from './index';

export function extractEyebrowsMetrics(rawResponse: Record<string, any>): EyebrowsMetrics {
  const analysisResult = rawResponse.analysis_result || {};
  const detailedAnalysis = rawResponse.detailed_analysis || {};
  const symmetryAnalysis = detailedAnalysis.symmetry_analysis || {};
  const leftBrow = detailedAnalysis.left_eyebrow || {};
  const rightBrow = detailedAnalysis.right_eyebrow || {};

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

  // Extract individual brow scores
  const leftArchScore = normalizeScore(
    leftBrow.arch_score ??
    leftBrow.shape_score ??
    getNestedValue(rawResponse, 'left_eyebrow.arch_score')
  );

  const rightArchScore = normalizeScore(
    rightBrow.arch_score ??
    rightBrow.shape_score ??
    getNestedValue(rawResponse, 'right_eyebrow.arch_score')
  );

  // Extract thickness uniformity
  const thicknessUniformity =
    symmetryAnalysis.thickness_uniformity ??
    getNestedValue(rawResponse, 'thickness_uniformity') ??
    'UNKNOWN';

  // Detect calculation source from metadata
  const calculationMethod = rawResponse.metadata?.calculation_method;
  const calculationSource =
    calculationMethod === 'typescript_precalculated' ? 'typescript' : 'ai';

  return {
    overall_score: overallScore,
    general_assessment: analysisResult.general_assessment,
    symmetry_score: symmetryScore || undefined,
    asymmetry_level: asymmetryLevel !== 'UNKNOWN' ? asymmetryLevel : undefined,
    left_arch_score: leftArchScore || undefined,
    right_arch_score: rightArchScore || undefined,
    thickness_uniformity: thicknessUniformity !== 'UNKNOWN' ? thicknessUniformity : undefined,
    calculation_source: calculationSource as 'typescript' | 'ai',
  };
}
