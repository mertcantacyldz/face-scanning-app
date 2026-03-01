/**
 * Metric Calculator
 * Centralized metric calculation dispatch for all face regions
 */

import { calculateAttractivenessScore } from '@/lib/attractiveness';
import type { RegionId } from '@/lib/exercises';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Point3D {
  x: number;
  y: number;
  z: number;
  index: number;
}

export interface CalculatedMetrics {
  overallScore: number;
  asymmetryLevel: string;
  [key: string]: any;
}

// ============================================
// CALCULATION MODULE PATHS
// ============================================

/**
 * Map region IDs to their calculation module paths
 * Used for dynamic imports
 */
const CALCULATION_MODULES: Record<string, string> = {
  nose: '@/lib/calculations/nose',
  eyes: '@/lib/calculations/eyes',
  lips: '@/lib/calculations/lips',
  jawline: '@/lib/calculations/jawline',
  eyebrows: '@/lib/calculations/eyebrows',
  // face_shape: '@/lib/calculations/face-shape', // Disabled
};

/**
 * Map region IDs to their calculation function names
 */
const CALCULATION_FUNCTIONS: Record<string, string> = {
  nose: 'calculateNoseMetrics',
  eyes: 'calculateEyeMetrics',
  lips: 'calculateLipMetrics',
  jawline: 'calculateJawlineMetrics',
  eyebrows: 'calculateEyebrowMetrics',
  // face_shape: 'calculateFaceShapeMetrics', // Disabled
};

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Calculate metrics for any region using dynamic import
 * Replaces the 5 if/else branches with a single dispatch
 *
 * @param regionId - The face region ID
 * @param landmarks - Array of 468 face landmarks
 * @returns Calculated metrics or null if region not supported
 */
export async function calculateMetricsForRegion(
  regionId: RegionId | string,
  landmarks: Point3D[]
): Promise<CalculatedMetrics | null> {
  const modulePath = CALCULATION_MODULES[regionId];
  const functionName = CALCULATION_FUNCTIONS[regionId];

  if (!modulePath || !functionName) {
    console.warn(`⚠️ No calculation module found for region: ${regionId}`);
    return null;
  }

  try {
    // Dynamic import based on region
    let module: any;

    switch (regionId) {
      case 'nose':
        module = await import('@/lib/calculations/nose');
        break;
      case 'eyes':
        module = await import('@/lib/calculations/eyes');
        break;
      case 'lips':
        module = await import('@/lib/calculations/lips');
        break;
      case 'jawline':
        module = await import('@/lib/calculations/jawline');
        break;
      case 'eyebrows':
        module = await import('@/lib/calculations/eyebrows');
        break;
      default:
        console.warn(`⚠️ Unsupported region: ${regionId}`);
        return null;
    }

    // Call the calculation function
    const calculateFunction = module[functionName];
    if (typeof calculateFunction !== 'function') {
      console.error(`❌ Function ${functionName} not found in module`);
      return null;
    }

    const metrics = calculateFunction(landmarks);
    console.log(`🔢 Calculated ${regionId} metrics (TypeScript):`, metrics);

    return metrics as CalculatedMetrics;
  } catch (error) {
    console.error(`❌ Error calculating metrics for ${regionId}:`, error);
    return null;
  }
}

/**
 * Calculate all regional metrics for storage in the database.
 * This function handles all regions on the device to avoid storing raw landmarks.
 * 
 * @param landmarks - Array of 468 face landmarks
 * @returns Object with metrics for all supported regions
 */
export async function calculateAllRegionalMetrics(
  landmarks: Point3D[]
): Promise<Record<string, CalculatedMetrics>> {
  try {
    const [eyebrows, nose, eyes, lips, jawline] = await Promise.all([
      import('@/lib/calculations/eyebrows').then(m => m.calculateEyebrowMetrics(landmarks)),
      import('@/lib/calculations/nose').then(m => m.calculateNoseMetrics(landmarks)),
      import('@/lib/calculations/eyes').then(m => m.calculateEyeMetrics(landmarks)),
      import('@/lib/calculations/lips').then(m => m.calculateLipMetrics(landmarks)),
      import('@/lib/calculations/jawline').then(m => m.calculateJawlineMetrics(landmarks)),
    ]);

    // KVKK: Genel çekicilik skorunu da (simetri, oranlar vb.) hesapla ve sakla
    // Bu sayede landmarklar silinse bile analiz ekranı tüm veriyi hazır bulur.
    const attractiveness = calculateAttractivenessScore(
      landmarks,
      null, // Cinsiyet bilgisi gerekirse sonra eklenebilir
      {
        eyebrows: eyebrows.overallScore,
        nose: nose.overallScore,
        eyes: eyes.overallScore,
        lips: lips.overallScore,
        jawline: jawline.overallScore,
      }
    );

    const allMetrics = {
      eyebrows: eyebrows as CalculatedMetrics,
      nose: nose as CalculatedMetrics,
      eyes: eyes as CalculatedMetrics,
      lips: lips as CalculatedMetrics,
      jawline: jawline as CalculatedMetrics,
      attractiveness: attractiveness as any, // AttractivenesResult tipinde
    };

    console.log('📊 Calculated all regional metrics and attractiveness for storage');
    return allMetrics;
  } catch (error) {
    console.error('❌ Error calculating all regional metrics:', error);
    return {};
  }
}

/**
 * Calculate all regional scores for attractiveness calculation
 * Used when computing overall attractiveness score
 *
 * @param landmarks - Array of 468 face landmarks
 * @returns Object with scores for each region
 */
export async function calculateAllRegionalScores(
  landmarks: Point3D[]
): Promise<Record<string, number>> {
  try {
    const [eyebrowsCalc, noseCalc, eyesCalc, lipsCalc, jawlineCalc] = await Promise.all([
      import('@/lib/calculations/eyebrows').then(m => m.calculateEyebrowMetrics(landmarks)),
      import('@/lib/calculations/nose').then(m => m.calculateNoseMetrics(landmarks)),
      import('@/lib/calculations/eyes').then(m => m.calculateEyeMetrics(landmarks)),
      import('@/lib/calculations/lips').then(m => m.calculateLipMetrics(landmarks)),
      import('@/lib/calculations/jawline').then(m => m.calculateJawlineMetrics(landmarks)),
    ]);

    const regionalScores = {
      eyebrows: eyebrowsCalc.overallScore,
      nose: noseCalc.overallScore,
      eyes: eyesCalc.overallScore,
      lips: lipsCalc.overallScore,
      jawline: jawlineCalc.overallScore,
    };

    console.log('📊 Regional Scores:', regionalScores);

    return regionalScores;
  } catch (error) {
    console.error('❌ Error calculating all regional scores:', error);
    return {};
  }
}

/**
 * Check if a region has calculation support
 *
 * @param regionId - The face region ID
 * @returns true if calculation is supported
 */
export function isRegionCalculationSupported(regionId: string): boolean {
  return regionId in CALCULATION_MODULES;
}

/**
 * Get list of supported regions for calculation
 *
 * @returns Array of supported region IDs
 */
export function getSupportedRegions(): string[] {
  return Object.keys(CALCULATION_MODULES);
}
