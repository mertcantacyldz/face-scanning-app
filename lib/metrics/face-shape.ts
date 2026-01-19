// Face Shape Metrics Extractor
// Extracts comparison-relevant metrics from face shape AI analysis

import type { FaceShapeMetrics } from './index';
import { getNestedValue, normalizeScore } from './index';

export function extractFaceShapeMetrics(rawResponse: Record<string, any>): FaceShapeMetrics {
  const analysisResult = rawResponse.analysis_result || {};
  const detailedAnalysis = rawResponse.detailed_analysis || {};
  const proportionAnalysis = detailedAnalysis.proportion_analysis || rawResponse.proportion_analysis || {};
  const symmetryAnalysis = detailedAnalysis.symmetry_analysis || rawResponse.symmetry_analysis || {};

  // Extract overall score (or confidence score for face shape)
  const overallScore = normalizeScore(
    analysisResult.overall_score ??
    analysisResult.confidence_score ??
    getNestedValue(rawResponse, 'overall_score') ??
    0
  );

  // Extract face shape type
  const faceShape =
    analysisResult.face_shape ??
    detailedAnalysis.face_shape ??
    getNestedValue(rawResponse, 'face_shape');

  // Extract confidence score
  const confidenceScore = normalizeScore(
    analysisResult.confidence_score ??
    detailedAnalysis.confidence_score ??
    getNestedValue(rawResponse, 'confidence_score')
  );

  // Extract symmetry score
  const symmetryScore = normalizeScore(
    symmetryAnalysis.symmetry_score ??
    analysisResult.symmetry_score ??
    getNestedValue(rawResponse, 'symmetry_score')
  );

  // Extract proportion score
  const proportionScore = normalizeScore(
    proportionAnalysis.proportion_score ??
    proportionAnalysis.overall_proportion ??
    analysisResult.proportion_score ??
    getNestedValue(rawResponse, 'proportion_score')
  );

  // Extract facial thirds balance
  const facialThirdsBalance =
    proportionAnalysis.facial_thirds_balance ??
    proportionAnalysis.thirds_balance ??
    detailedAnalysis.facial_thirds_balance ??
    getNestedValue(rawResponse, 'facial_thirds_balance');

  // Detect calculation source from metadata
  const calculationMethod = rawResponse.metadata?.calculation_method;
  const calculationSource =
    calculationMethod === 'typescript_precalculated' ? 'typescript' : 'ai';

  return {
    overall_score: overallScore,
    general_assessment: analysisResult.general_assessment,
    face_shape: faceShape,
    confidence_score: confidenceScore || undefined,
    symmetry_score: symmetryScore || undefined,
    proportion_score: proportionScore || undefined,
    facial_thirds_balance: facialThirdsBalance,
    calculation_source: calculationSource as 'typescript' | 'ai',
  };
}
