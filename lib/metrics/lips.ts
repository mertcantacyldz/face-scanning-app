// Lips Metrics Extractor
// Extracts comparison-relevant metrics from lips AI analysis

import type { LipsMetrics } from './index';
import { getNestedValue, normalizeScore, parseAsymmetryLevel } from './index';

export function extractLipsMetrics(rawResponse: Record<string, any>): LipsMetrics {
  const analysisResult = rawResponse.analysis_result || {};
  const detailedAnalysis = rawResponse.detailed_analysis || {};
  const symmetryAnalysis = detailedAnalysis.symmetry_analysis || rawResponse.symmetry_analysis || {};
  const upperLip = detailedAnalysis.upper_lip || rawResponse.upper_lip || {};
  const lowerLip = detailedAnalysis.lower_lip || rawResponse.lower_lip || {};

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

  // Extract upper lip score
  const upperLipScore = normalizeScore(
    upperLip.score ??
    upperLip.upper_lip_score ??
    upperLip.shape_score ??
    getNestedValue(rawResponse, 'upper_lip.score')
  );

  // Extract lower lip score
  const lowerLipScore = normalizeScore(
    lowerLip.score ??
    lowerLip.lower_lip_score ??
    lowerLip.shape_score ??
    getNestedValue(rawResponse, 'lower_lip.score')
  );

  // Extract lip ratio
  const lipRatio =
    detailedAnalysis.lip_ratio ??
    analysisResult.lip_ratio ??
    getNestedValue(rawResponse, 'lip_ratio');

  // Extract cupid bow definition
  const cupidBowDefinition =
    upperLip.cupid_bow ??
    upperLip.cupid_bow_definition ??
    detailedAnalysis.cupid_bow_definition ??
    getNestedValue(rawResponse, 'cupid_bow_definition');

  return {
    overall_score: overallScore,
    general_assessment: analysisResult.general_assessment,
    symmetry_score: symmetryScore || undefined,
    asymmetry_level: asymmetryLevel !== 'UNKNOWN' ? asymmetryLevel : undefined,
    upper_lip_score: upperLipScore || undefined,
    lower_lip_score: lowerLipScore || undefined,
    lip_ratio: typeof lipRatio === 'number' ? lipRatio : undefined,
    cupid_bow_definition: cupidBowDefinition,
  };
}
