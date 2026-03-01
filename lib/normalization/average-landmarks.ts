/**
 * Landmark Averaging Module
 *
 * Combines normalized landmarks from multiple photos into a single
 * averaged landmark set. This reduces noise from individual photos
 * and produces more stable measurements.
 *
 * The averaging process:
 * 1. Takes 3 normalized landmark sets (all in same coordinate system)
 * 2. For each of 468 landmarks, calculates mean x, y, z
 * 3. Calculates variance to measure consistency
 * 4. Returns averaged landmarks with consistency score
 */

import { Point3D } from '../geometry';
import { NormalizedLandmarks } from './normalize-landmarks';
import { RELEVANT_LANDMARK_INDICES } from './relevant-landmarks';

// ============================================
// TYPES
// ============================================

export interface VarianceDetails {
  /** Maximum variance across all landmarks */
  maxVariance: number;
  /** Average variance across all landmarks */
  avgVariance: number;
  /** Indices of landmarks with unusually high variance */
  problematicIndices: number[];
  /** Per-landmark variance values */
  perLandmarkVariance: number[];
}

export interface AveragedResult {
  /** The averaged 468 landmarks */
  landmarks: Point3D[];
  /** Consistency score (0-100, higher is better) */
  consistencyScore: number;
  /** Detailed variance information */
  varianceDetails: VarianceDetails;
  /** Number of photos used for averaging */
  photoCount: number;
}

// ============================================
// CONSTANTS
// ============================================

/** Threshold for considering a landmark "problematic" (high variance) */
const PROBLEMATIC_VARIANCE_THRESHOLD = 100; // pixels squared

/** Maximum expected variance for perfect consistency (for scoring) */
const MAX_EXPECTED_VARIANCE = 400; // pixels squared

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate mean of an array of numbers
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate variance of an array of numbers
 */
function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  return values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / values.length;
}

/**
 * Calculate combined 2D variance for a set of points
 * Uses sum of X and Y variances
 */
function pointVariance(points: Point3D[]): number {
  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);
  return variance(xValues) + variance(yValues);
}

// ============================================
// MAIN AVERAGING FUNCTION
// ============================================

/**
 * Average multiple normalized landmark sets into one
 *
 * @param normalizedSets Array of normalized landmark sets (typically 3)
 * @returns Averaged landmarks with consistency metrics
 */
export function averageLandmarks(
  normalizedSets: NormalizedLandmarks[]
): AveragedResult {
  if (normalizedSets.length === 0) {
    throw new Error('No landmark sets provided for averaging');
  }

  if (normalizedSets.length === 1) {
    // Single photo - no averaging needed, perfect consistency
    return {
      landmarks: normalizedSets[0].landmarks,
      consistencyScore: 100,
      varianceDetails: {
        maxVariance: 0,
        avgVariance: 0,
        problematicIndices: [],
        perLandmarkVariance: new Array(normalizedSets[0].landmarks.length).fill(0),
      },
      photoCount: 1,
    };
  }

  // ============================================
  // 🔍 DIAGNOSTIC LOGGING - FACE SIZE COMPARISON
  // ============================================
  console.log('\n════════════════════════════════════════');
  console.log('📸 [FACE SIZE ANALYSIS] Starting comparison');
  console.log('════════════════════════════════════════');

  // Extract original face sizes (before normalization)
  const faceSizes = normalizedSets.map((set, idx) => ({
    photoIndex: idx + 1,
    eyeDistance: set.originalFaceWidth,
    scale: set.transformParams.scale,
  }));

  // Log individual photo metrics
  faceSizes.forEach(({ photoIndex, eyeDistance, scale }) => {
    const cameraDistance = eyeDistance < 250 ? 'FAR 📹➡️' : eyeDistance > 450 ? 'CLOSE 📹←' : 'NORMAL 📹';
    console.log(`📷 [Photo ${photoIndex}]:`, {
      originalEyeDistance: `${eyeDistance.toFixed(1)}px`,
      scaleFactor: scale.toFixed(4),
      estimatedCameraDistance: cameraDistance,
    });
  });

  // Calculate size differences (percentage)
  if (faceSizes.length >= 2) {
    console.log('\n📊 [SIZE DIFFERENCES]:');
    for (let i = 0; i < faceSizes.length - 1; i++) {
      for (let j = i + 1; j < faceSizes.length; j++) {
        const size1 = faceSizes[i].eyeDistance;
        const size2 = faceSizes[j].eyeDistance;
        const diffPercent = Math.abs((size1 - size2) / size1) * 100;
        const diffPx = Math.abs(size1 - size2);

        console.log(`  Photo ${i + 1} vs Photo ${j + 1}:`, {
          sizeDifference: `${diffPercent.toFixed(1)}%`,
          pixelDifference: `${diffPx.toFixed(1)}px`,
          warning: diffPercent > 20 ? '⚠️ LARGE DIFFERENCE!' : '✅ OK',
        });
      }
    }
  }

  // Calculate scale factor range
  const scales = faceSizes.map(f => f.scale);
  const minScale = Math.min(...scales);
  const maxScale = Math.max(...scales);
  const scaleRange = maxScale - minScale;
  const avgScale = scales.reduce((a, b) => a + b, 0) / scales.length;

  console.log('\n⚖️ [SCALE FACTOR ANALYSIS]:');
  console.log('  Range:', {
    min: minScale.toFixed(4),
    max: maxScale.toFixed(4),
    difference: scaleRange.toFixed(4),
    average: avgScale.toFixed(4),
    warning: scaleRange > 0.5 ? '⚠️ HIGH VARIANCE!' : '✅ CONSISTENT',
  });

  console.log('════════════════════════════════════════\n');

  const landmarkCount = normalizedSets[0].landmarks.length;
  const photoCount = normalizedSets.length;

  // Validate all sets have same landmark count
  for (const set of normalizedSets) {
    if (set.landmarks.length !== landmarkCount) {
      throw new Error(
        `Inconsistent landmark count: expected ${landmarkCount}, got ${set.landmarks.length}`
      );
    }
  }

  const averagedLandmarks: Point3D[] = [];
  const perLandmarkVariance: number[] = [];
  const problematicIndices: number[] = [];

  // For each landmark index (0-467)
  for (let i = 0; i < landmarkCount; i++) {
    // Collect this landmark from all photos
    const points = normalizedSets.map((set) => set.landmarks[i]);

    // Calculate mean position
    const avgX = mean(points.map((p) => p.x));
    const avgY = mean(points.map((p) => p.y));
    const avgZ = mean(points.map((p) => p.z));

    // Calculate variance for this landmark
    const v = pointVariance(points);
    perLandmarkVariance.push(v);

    // Log first 10 landmarks for verification
    if (i < 10) {
      const logData: Record<string, string> = {
        photo1: `(${normalizedSets[0].landmarks[i].x.toFixed(1)}, ${normalizedSets[0].landmarks[i].y.toFixed(1)})`,
        photo2: `(${normalizedSets[1].landmarks[i].x.toFixed(1)}, ${normalizedSets[1].landmarks[i].y.toFixed(1)})`,
      };
      if (normalizedSets[2]) {
        logData.photo3 = `(${normalizedSets[2].landmarks[i].x.toFixed(1)}, ${normalizedSets[2].landmarks[i].y.toFixed(1)})`;
      }
      logData.average = `(${avgX.toFixed(1)}, ${avgY.toFixed(1)})`;
      logData.variance = v.toFixed(2);
      console.log(`🔢 [Averaging] Landmark ${i}:`, logData);
    }

    // Mark as problematic if variance is too high (only for analysis-relevant landmarks)
    if (v > PROBLEMATIC_VARIANCE_THRESHOLD && RELEVANT_LANDMARK_INDICES.has(i)) {
      problematicIndices.push(i);
    }

    averagedLandmarks.push({
      x: avgX,
      y: avgY,
      z: avgZ,
      index: i,
    });
  }

  // Calculate overall variance metrics (only from analysis-relevant landmarks)
  const relevantVariances = perLandmarkVariance.filter(
    (_, i) => RELEVANT_LANDMARK_INDICES.has(i)
  );
  const avgVariance = mean(relevantVariances);
  const maxVariance = relevantVariances.length > 0 ? Math.max(...relevantVariances) : 0;

  // Calculate consistency score (0-100)
  // Using exponential decay formula for more natural score distribution
  // Formula: score = 100 * e^(-variance / scalingFactor)
  // 
  // Score behavior with scaling factor = 500:
  // - variance = 0     → score = 100 (perfect - identical photos)
  // - variance = 50    → score ≈ 90 (excellent - minimal differences)
  // - variance = 100   → score ≈ 82 (excellent - minor variations)
  // - variance = 200   → score ≈ 67 (good - noticeable but acceptable)
  // - variance = 340   → score ≈ 51 (acceptable - different expressions)
  // - variance = 500   → score ≈ 37 (poor - significant differences)
  // - variance = 1000+ → score ≈ 14- (very poor - different people/poses)
  //
  // Scaling factor of 500 balances sensitivity to real differences while
  // being forgiving of natural expression variations (mouth, eyebrows)
  const consistencyScore = Math.max(
    0,
    Math.min(100, 100 * Math.exp(-avgVariance / 500))
  );

  // Log the exponential formula calculation
  console.log('\n🧮 [EXPONENTIAL FORMULA]:');
  console.log('  Formula: score = 100 * e^(-variance / 500)');
  console.log('  Calculation:', {
    avgVariance: avgVariance.toFixed(2) + 'px²',
    exponent: `-(${avgVariance.toFixed(2)} / 500) = ${(-avgVariance / 500).toFixed(4)}`,
    eToThePower: `e^${(-avgVariance / 500).toFixed(4)} = ${Math.exp(-avgVariance / 500).toFixed(4)}`,
    finalScore: `100 * ${Math.exp(-avgVariance / 500).toFixed(4)} = ${consistencyScore.toFixed(1)}`,
  });


  // ============================================
  // 🔍 DIAGNOSTIC LOGGING - VARIANCE BREAKDOWN
  // ============================================
  console.log('\n════════════════════════════════════════');
  console.log('📊 [VARIANCE ANALYSIS] Results');
  console.log('════════════════════════════════════════');
  console.log('📊 Overall Metrics:', {
    photoCount,
    avgVariance: avgVariance.toFixed(2) + 'px²',
    maxVariance: maxVariance.toFixed(2) + 'px²',
    consistencyScore: consistencyScore.toFixed(1) + '/100',
    problematicCount: problematicIndices.length,
    threshold: MAX_EXPECTED_VARIANCE + 'px²',
  });

  // Log top 5 highest variance landmarks (relevant only)
  const topVariances = perLandmarkVariance
    .map((v, i) => ({ index: i, variance: v }))
    .filter(t => RELEVANT_LANDMARK_INDICES.has(t.index))
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 5);

  console.log('⚠️ [Averaging] Top 5 highest variance landmarks:',
    topVariances.map(t => `L${t.index}=${t.variance.toFixed(2)}`).join(', ')
  );

  // Log variance distribution (relevant landmarks only)
  const varianceRanges = {
    perfect: relevantVariances.filter(v => v < 10).length,
    good: relevantVariances.filter(v => v >= 10 && v < 50).length,
    acceptable: relevantVariances.filter(v => v >= 50 && v < 100).length,
    problematic: relevantVariances.filter(v => v >= 100).length,
    totalRelevant: relevantVariances.length,
  };

  console.log('\n📈 Variance Distribution:', varianceRanges);
  console.log('════════════════════════════════════════\n');

  return {
    landmarks: averagedLandmarks,
    consistencyScore: Math.round(consistencyScore * 10) / 10, // 1 decimal place
    varianceDetails: {
      maxVariance,
      avgVariance,
      problematicIndices,
      perLandmarkVariance,
    },
    photoCount,
  };
}

/**
 * Check if variance is too high for reliable analysis
 *
 * @param result Averaged result
 * @returns True if variance is acceptable
 */
export function isConsistencyAcceptable(result: AveragedResult): boolean {
  return result.consistencyScore >= 50;
}

/**
 * Get human-readable consistency level
 */
export function getConsistencyLevel(
  score: number
): 'excellent' | 'good' | 'acceptable' | 'poor' {
  // Updated thresholds for exponential scoring system (scaling factor = 500)
  // These thresholds match the natural distribution of exponential decay:
  // - excellent (85+): variance < 80px² (very minimal differences)
  // - good (70-84): variance 80-175px² (small acceptable variations)
  // - acceptable (50-69): variance 175-350px² (medium differences, e.g. different expressions)
  // - poor (<50): variance > 350px² (significant differences or different people)
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'acceptable';
  return 'poor';
}
