/**
 * Normalization Module
 *
 * Provides landmark normalization, averaging, and consistency calculation
 * for multi-photo face analysis.
 *
 * Usage:
 * ```typescript
 * import {
 *   normalizeLandmarks,
 *   averageLandmarks,
 *   calculateConsistency,
 *   getQuickConsistencyStatus
 * } from '@/lib/normalization';
 *
 * // Normalize each photo's landmarks
 * const normalized1 = normalizeLandmarks(landmarks1);
 * const normalized2 = normalizeLandmarks(landmarks2);
 * const normalized3 = normalizeLandmarks(landmarks3);
 *
 * // Average them together
 * const averaged = averageLandmarks([normalized1, normalized2, normalized3]);
 *
 * // Get detailed consistency analysis
 * const consistency = calculateConsistency(
 *   averaged,
 *   [normalized1, normalized2, normalized3],
 *   'en'
 * );
 *
 * // Use averaged.landmarks for face analysis calculations
 * ```
 */

// Normalization
export {
  normalizeLandmarks,
  validateLandmarksForNormalization,
  type NormalizedLandmarks,
  type TransformParams,
} from './normalize-landmarks';

// Averaging
export {
  averageLandmarks,
  isConsistencyAcceptable,
  getConsistencyLevel,
  type AveragedResult,
  type VarianceDetails,
} from './average-landmarks';

// Consistency
export {
  calculateConsistency,
  getQuickConsistencyStatus,
  type ConsistencyResult,
  type ConsistencyLevel,
} from './consistency-calculator';
