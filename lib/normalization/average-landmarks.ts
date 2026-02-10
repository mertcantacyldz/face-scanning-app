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

    // Mark as problematic if variance is too high
    if (v > PROBLEMATIC_VARIANCE_THRESHOLD) {
      problematicIndices.push(i);
    }

    averagedLandmarks.push({
      x: avgX,
      y: avgY,
      z: avgZ,
      index: i,
    });
  }

  // Calculate overall variance metrics
  const avgVariance = mean(perLandmarkVariance);
  const maxVariance = Math.max(...perLandmarkVariance);

  // Calculate consistency score (0-100)
  // Lower variance = higher score
  // Score = 100 when variance = 0
  // Score = 0 when variance >= MAX_EXPECTED_VARIANCE
  const consistencyScore = Math.max(
    0,
    Math.min(100, 100 - (avgVariance / MAX_EXPECTED_VARIANCE) * 100)
  );

  console.log('📊 [Averaging] Results:', {
    photoCount,
    avgVariance: avgVariance.toFixed(2),
    maxVariance: maxVariance.toFixed(2),
    consistencyScore: consistencyScore.toFixed(1),
    problematicCount: problematicIndices.length,
  });

  // Log top 5 highest variance landmarks
  const topVariances = perLandmarkVariance
    .map((v, i) => ({ index: i, variance: v }))
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 5);

  console.log('⚠️ [Averaging] Top 5 highest variance landmarks:',
    topVariances.map(t => `L${t.index}=${t.variance.toFixed(2)}`).join(', ')
  );

  // Log variance distribution
  const varianceRanges = {
    perfect: perLandmarkVariance.filter(v => v < 10).length,
    good: perLandmarkVariance.filter(v => v >= 10 && v < 50).length,
    acceptable: perLandmarkVariance.filter(v => v >= 50 && v < 100).length,
    problematic: perLandmarkVariance.filter(v => v >= 100).length,
  };

  console.log('📈 [Averaging] Variance distribution:', varianceRanges);

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
  return result.consistencyScore >= 60;
}

/**
 * Get human-readable consistency level
 */
export function getConsistencyLevel(
  score: number
): 'excellent' | 'good' | 'acceptable' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'acceptable';
  return 'poor';
}
