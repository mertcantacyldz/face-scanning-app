// Eyes Metrics Extractor
// Extracts comparison-relevant metrics from eyes AI analysis

import type { EyesMetrics } from './index';
import { getNestedValue, normalizeScore, parseAsymmetryLevel } from './index';

export function extractEyesMetrics(rawResponse: Record<string, any>): EyesMetrics {
  const analysisResult = rawResponse.analysis_result || {};
  const detailedAnalysis = rawResponse.detailed_analysis || {};
  const symmetryAnalysis = detailedAnalysis.symmetry_analysis || {};
  const leftEye = detailedAnalysis.left_eye || {};
  const rightEye = detailedAnalysis.right_eye || {};

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

  // Extract individual eye scores
  const leftEyeScore = normalizeScore(
    leftEye.eye_score ??
    leftEye.shape_score ??
    leftEye.openness_score ??
    getNestedValue(rawResponse, 'left_eye.eye_score')
  );

  const rightEyeScore = normalizeScore(
    rightEye.eye_score ??
    rightEye.shape_score ??
    rightEye.openness_score ??
    getNestedValue(rawResponse, 'right_eye.eye_score')
  );

  // Extract eye spacing
  const eyeSpacing =
    detailedAnalysis.eye_spacing ??
    symmetryAnalysis.eye_spacing ??
    getNestedValue(rawResponse, 'eye_spacing');

  // Extract eyelid condition
  const eyelidCondition =
    detailedAnalysis.eyelid_condition ??
    leftEye.eyelid_condition ??
    getNestedValue(rawResponse, 'eyelid_condition');

  // Detect calculation source from metadata
  const calculationMethod = rawResponse.metadata?.calculation_method;
  const calculationSource =
    calculationMethod === 'typescript_precalculated' ? 'typescript' : 'ai';

  return {
    overall_score: overallScore,
    general_assessment: analysisResult.general_assessment,
    symmetry_score: symmetryScore || undefined,
    asymmetry_level: asymmetryLevel !== 'UNKNOWN' ? asymmetryLevel : undefined,
    left_eye_score: leftEyeScore || undefined,
    right_eye_score: rightEyeScore || undefined,
    eye_spacing: eyeSpacing,
    eyelid_condition: eyelidCondition,
    calculation_source: calculationSource as 'typescript' | 'ai',
  };
}
