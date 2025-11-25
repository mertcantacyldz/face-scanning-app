// Jawline Metrics Extractor
// Extracts comparison-relevant metrics from jawline AI analysis

import type { JawlineMetrics } from './index';
import { getNestedValue, normalizeScore, parseAsymmetryLevel } from './index';

export function extractJawlineMetrics(rawResponse: Record<string, any>): JawlineMetrics {
  const analysisResult = rawResponse.analysis_result || {};
  const detailedAnalysis = rawResponse.detailed_analysis || {};
  const symmetryAnalysis = detailedAnalysis.symmetry_analysis || rawResponse.symmetry_analysis || {};
  const leftJaw = detailedAnalysis.left_jaw || rawResponse.left_jaw || {};
  const rightJaw = detailedAnalysis.right_jaw || rawResponse.right_jaw || {};
  const chinAnalysis = detailedAnalysis.chin_analysis || rawResponse.chin_analysis || {};

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

  // Extract left jaw score
  const leftJawScore = normalizeScore(
    leftJaw.score ??
    leftJaw.jaw_score ??
    leftJaw.definition_score ??
    getNestedValue(rawResponse, 'left_jaw.score')
  );

  // Extract right jaw score
  const rightJawScore = normalizeScore(
    rightJaw.score ??
    rightJaw.jaw_score ??
    rightJaw.definition_score ??
    getNestedValue(rawResponse, 'right_jaw.score')
  );

  // Extract chin alignment
  const chinAlignment =
    chinAnalysis.alignment ??
    chinAnalysis.chin_alignment ??
    symmetryAnalysis.chin_alignment ??
    getNestedValue(rawResponse, 'chin_alignment');

  // Extract jaw definition
  const jawDefinition =
    detailedAnalysis.jaw_definition ??
    analysisResult.jaw_definition ??
    symmetryAnalysis.jaw_definition ??
    getNestedValue(rawResponse, 'jaw_definition');

  return {
    overall_score: overallScore,
    general_assessment: analysisResult.general_assessment,
    symmetry_score: symmetryScore || undefined,
    asymmetry_level: asymmetryLevel !== 'UNKNOWN' ? asymmetryLevel : undefined,
    left_jaw_score: leftJawScore || undefined,
    right_jaw_score: rightJawScore || undefined,
    chin_alignment: chinAlignment,
    jaw_definition: jawDefinition,
  };
}
