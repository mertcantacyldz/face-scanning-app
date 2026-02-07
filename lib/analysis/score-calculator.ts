/**
 * Score Calculator
 * Calculates overall scores from AI response sub-scores using weighted averages
 */

// ============================================
// REGION WEIGHTS
// ============================================

/**
 * Weight definitions for each region based on customPrompt formulas
 * These weights determine how sub-scores contribute to overall score
 */
export const REGION_WEIGHTS: Record<string, Record<string, number>> = {
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
    nose_tip_score: 0.60,
    bridge_straightness_score: 0.15,
    combined_rotation_score: 0.15,
    proportion_score: 0.10,
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
  // face_shape: No weights - uses confidence_score directly
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract a specific score from nested AI response structure
 * Searches in multiple possible locations
 */
export function extractSubScore(
  jsonResult: Record<string, any>,
  scoreKey: string
): number | null {
  // Convert "nose_tip_score" → "nose_tip_analysis"
  const sectionName = scoreKey.replace('_score', '_analysis');

  // Check in top-level analysis sections (e.g., nose_tip_analysis.score)
  if (jsonResult[sectionName]?.score !== undefined) {
    return jsonResult[sectionName].score;
  }

  // Fallback: Check in nested structures
  if (jsonResult.symmetry_analysis?.[scoreKey] !== undefined) {
    return jsonResult.symmetry_analysis[scoreKey];
  }

  if (jsonResult.shape_analysis?.[scoreKey] !== undefined) {
    return jsonResult.shape_analysis[scoreKey];
  }

  // Check in details section
  if (jsonResult.details) {
    for (const [, value] of Object.entries(jsonResult.details)) {
      if (typeof value === 'object' && value !== null) {
        const detail = value as Record<string, any>;
        if (detail.score !== undefined) {
          // Match by section name
          const detailSectionName = scoreKey.replace('_score', '');
          if (detail[detailSectionName] !== undefined ||
              scoreKey.includes(detailSectionName)) {
            return detail.score;
          }
        }
      }
    }
  }

  return null;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Calculate overall_score from sub-scores using weighted average
 * This overrides AI's calculation which is often incorrect
 *
 * @param jsonResult - The parsed AI response JSON
 * @param regionId - The face region ID
 * @returns The calculated overall score (0-10)
 */
export function calculateOverallScore(
  jsonResult: Record<string, any>,
  regionId: string
): number {
  // Get weights for this region
  const regionWeights = REGION_WEIGHTS[regionId];

  if (!regionWeights || Object.keys(regionWeights).length === 0) {
    // No weights defined (e.g., face_shape) - use AI's score
    return jsonResult.analysis_result?.overall_score ??
      jsonResult.analysis_result?.confidence_score ??
      0;
  }

  // Calculate weighted average
  let weightedSum = 0;
  let totalWeight = 0;
  const missingScores: string[] = [];

  for (const [scoreKey, weight] of Object.entries(regionWeights)) {
    const score = extractSubScore(jsonResult, scoreKey);

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
    console.log(
      `✅ Calculated overall_score for ${regionId}: ${calculated} ` +
      `(from ${Object.keys(regionWeights).length - missingScores.length}/${Object.keys(regionWeights).length} sub-scores)`
    );

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
}

/**
 * Validate and correct AI response scores
 * Ensures scores match TypeScript calculations
 *
 * @param jsonResult - The parsed AI response JSON
 * @param regionId - The face region ID
 * @param calculatedMetrics - Pre-calculated metrics from TypeScript
 * @returns The corrected JSON result
 */
export function validateAndCorrectScores(
  jsonResult: Record<string, any>,
  regionId: string,
  calculatedMetrics: { overallScore: number; asymmetryLevel: string } | null
): Record<string, any> {
  if (!calculatedMetrics) {
    return jsonResult;
  }

  const aiScore = jsonResult.analysis_result?.overall_score;

  if (aiScore !== calculatedMetrics.overallScore) {
    console.warn(`⚠️ AI returned wrong score for ${regionId}!`);
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

  return jsonResult;
}

/**
 * Apply hard filter for specific regions
 * For example, nose region only allows 4 specific detail categories
 *
 * @param jsonResult - The parsed AI response JSON
 * @param regionId - The face region ID
 * @returns The filtered JSON result
 */
export function applyRegionFilter(
  jsonResult: Record<string, any>,
  regionId: string
): Record<string, any> {
  // Hard filter for nose region: Only allow 4 categories
  if (regionId === 'nose' && jsonResult.details) {
    const allowed = [
      'tip_deviation',
      'bridge_straightness',
      'combined_rotation',
      'proportions',
    ];

    const filteredDetails: Record<string, any> = {};
    allowed.forEach((key) => {
      if (jsonResult.details[key]) {
        filteredDetails[key] = jsonResult.details[key];
      }
    });
    jsonResult.details = filteredDetails;

    // Also filter summary key_metrics if present
    if (jsonResult.summary?.key_metrics) {
      jsonResult.summary.key_metrics = jsonResult.summary.key_metrics.slice(0, 4);
    }
  }

  return jsonResult;
}
