/**
 * Consistency Calculator Module
 *
 * Provides detailed consistency analysis and recommendations
 * for multi-photo face analysis.
 */

import { AveragedResult, getConsistencyLevel } from './average-landmarks';
import { NormalizedLandmarks } from './normalize-landmarks';
import { FACE_REGIONS } from './relevant-landmarks';

// ============================================
// TYPES
// ============================================

export type ConsistencyLevel = 'excellent' | 'good' | 'acceptable' | 'poor';

export interface ConsistencyResult {
  /** Overall consistency score (0-100) */
  score: number;
  /** Human-readable level */
  level: ConsistencyLevel;
  /** Recommendation message for user */
  recommendation: string;
  /** Detailed analysis */
  details: {
    /** How many landmarks have high variance */
    problematicLandmarkCount: number;
    /** Which face regions are most inconsistent */
    inconsistentRegions: string[];
    /** Whether photos appear to be from same person */
    samePerson: boolean;
    /** Whether face poses are similar enough */
    similarPose: boolean;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate region-specific variance
 */
function calculateRegionVariance(
  perLandmarkVariance: number[],
  regionIndices: number[]
): number {
  const regionVariances = regionIndices
    .filter((idx) => idx < perLandmarkVariance.length)
    .map((idx) => perLandmarkVariance[idx]);

  if (regionVariances.length === 0) return 0;
  return regionVariances.reduce((sum, v) => sum + v, 0) / regionVariances.length;
}

/**
 * Identify which regions have highest variance
 */
function findInconsistentRegions(
  perLandmarkVariance: number[],
  threshold: number = 50
): string[] {
  const inconsistent: string[] = [];

  for (const [regionName, indices] of Object.entries(FACE_REGIONS)) {
    const regionVariance = calculateRegionVariance(perLandmarkVariance, indices);
    if (regionVariance > threshold) {
      inconsistent.push(regionName);
    }
  }

  return inconsistent;
}

/**
 * Check if photos appear to be from same person
 * (Based on very high variance suggesting different faces)
 */
function checkSamePerson(avgVariance: number): boolean {
  // If average variance is extremely high, might be different people
  return avgVariance < 500;
}

/**
 * Check if face poses are similar enough
 */
function checkSimilarPose(normalizedSets: NormalizedLandmarks[]): boolean {
  if (normalizedSets.length < 2) return true;

  // Compare rotation angles - if too different, poses are not similar
  const rotations = normalizedSets.map((s) => s.transformParams.rotationAngle);
  const rotationRange =
    Math.max(...rotations) - Math.min(...rotations);

  // Convert to degrees for comparison
  const rotationRangeDegrees = (rotationRange * 180) / Math.PI;

  // Allow up to 15 degrees difference
  return rotationRangeDegrees < 15;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Calculate detailed consistency analysis
 *
 * @param averagedResult Result from averageLandmarks()
 * @param normalizedSets Original normalized sets (for pose comparison)
 * @param language Language for recommendations ('en' | 'tr')
 */
export function calculateConsistency(
  averagedResult: AveragedResult,
  normalizedSets: NormalizedLandmarks[],
  language: 'en' | 'tr' = 'en'
): ConsistencyResult {
  const { consistencyScore, varianceDetails } = averagedResult;
  const level = getConsistencyLevel(consistencyScore);

  // Detailed analysis
  const inconsistentRegions = findInconsistentRegions(
    varianceDetails.perLandmarkVariance
  );
  const samePerson = checkSamePerson(varianceDetails.avgVariance);
  const similarPose = checkSimilarPose(normalizedSets);

  // Generate recommendation based on analysis
  const recommendation = getRecommendation(
    level,
    inconsistentRegions,
    samePerson,
    similarPose,
    language
  );

  // ============================================
  // 🔍 DIAGNOSTIC LOGGING - CONSISTENCY ANALYSIS
  // ============================================
  console.log('\n════════════════════════════════════════');
  console.log('🎯 [CONSISTENCY ANALYSIS]');
  console.log('════════════════════════════════════════');
  console.log('🎯 Main Metrics:', {
    score: consistencyScore.toFixed(1) + '/100',
    level,
    avgVariance: varianceDetails.avgVariance.toFixed(2) + 'px²',
    problematicLandmarks: varianceDetails.problematicIndices.length,
  });

  console.log('\n🔍 Detailed Checks:', {
    samePerson: samePerson ? '✅ YES' : '❌ NO',
    similarPose: similarPose ? '✅ YES' : '❌ NO',
    inconsistentRegions: inconsistentRegions.length > 0 ? inconsistentRegions.join(', ') : '✅ None',
  });


  // ============================================
  // 🔍 DIAGNOSTIC LOGGING - POSE COMPARISON
  // ============================================
  const rotations = normalizedSets.map(s => s.transformParams.rotationAngle);
  const rotationsDegrees = rotations.map(r => r * 180 / Math.PI);
  const minRotation = Math.min(...rotationsDegrees);
  const maxRotation = Math.max(...rotationsDegrees);
  const rotationRange = maxRotation - minRotation;

  console.log('\n📐 [POSE COMPARISON]:');

  // Log each photo's rotation
  rotationsDegrees.forEach((deg, idx) => {
    console.log(`  Photo ${idx + 1} Rotation: ${deg.toFixed(2)}°`);
  });

  console.log('\n  Summary:', {
    minRotation: `${minRotation.toFixed(2)}°`,
    maxRotation: `${maxRotation.toFixed(2)}°`,
    rotationRange: `${rotationRange.toFixed(2)}°`,
    threshold: '15.00°',
    status: rotationRange < 15 ? '✅ CONSISTENT' : '⚠️ INCONSISTENT',
    similarPose: similarPose ? '✅ YES' : '❌ NO',
  });



  // ============================================
  // 🔍 DIAGNOSTIC LOGGING - SCALE COMPARISON
  // ============================================
  const scales = normalizedSets.map(s => s.transformParams.scale);
  const minScale = Math.min(...scales);
  const maxScale = Math.max(...scales);
  const scaleRange = maxScale - minScale;
  const avgScale = scales.reduce((a, b) => a + b, 0) / scales.length;

  console.log('\n📏 [SCALE COMPARISON]:');

  // Log each photo's scale
  scales.forEach((s, idx) => {
    console.log(`  Photo ${idx + 1} Scale: ${s.toFixed(4)}`);
  });

  console.log('\n  Summary:', {
    minScale: minScale.toFixed(4),
    maxScale: maxScale.toFixed(4),
    scaleRange: scaleRange.toFixed(4),
    avgScale: avgScale.toFixed(4),
    status: scaleRange > 0.5 ? '⚠️ HIGH VARIANCE' : '✅ CONSISTENT',
  });

  console.log('════════════════════════════════════════\n');


  return {
    score: consistencyScore,
    level,
    recommendation,
    details: {
      problematicLandmarkCount: varianceDetails.problematicIndices.length,
      inconsistentRegions,
      samePerson,
      similarPose,
    },
  };
}

/**
 * Generate human-readable recommendation
 */
function getRecommendation(
  level: ConsistencyLevel,
  inconsistentRegions: string[],
  samePerson: boolean,
  similarPose: boolean,
  language: 'en' | 'tr'
): string {
  const messages = {
    en: {
      excellent: 'Excellent photo consistency! Results will be highly accurate.',
      good: 'Good consistency. Results should be reliable.',
      acceptable:
        'Acceptable consistency. Consider retaking if you want more accurate results.',
      poor: 'Low consistency. Photos may have different lighting, expressions, or angles.',
      differentPerson:
        'Photos appear to show different faces. Please use photos of the same person.',
      differentPose:
        'Face angles are too different. Try to keep a similar head position in all photos.',
      regionIssue: (regions: string[]) =>
        `Inconsistency detected in: ${regions.join(', ')}. Try to keep expressions consistent.`,
    },
    tr: {
      excellent: 'Mükemmel tutarlılık! Sonuçlar çok güvenilir olacak.',
      good: 'İyi tutarlılık. Sonuçlar güvenilir olmalı.',
      acceptable:
        'Kabul edilebilir tutarlılık. Daha doğru sonuçlar için tekrar çekebilirsiniz.',
      poor: 'Düşük tutarlılık. Fotoğraflar farklı ışık, ifade veya açıda olabilir.',
      differentPerson:
        'Fotoğraflar farklı yüzler gösteriyor olabilir. Lütfen aynı kişinin fotoğraflarını kullanın.',
      differentPose:
        'Yüz açıları çok farklı. Tüm fotoğraflarda benzer baş pozisyonu korumaya çalışın.',
      regionIssue: (regions: string[]) =>
        `Tutarsızlık tespit edildi: ${regions.join(', ')}. İfadenizi tutarlı tutmaya çalışın.`,
    },
  };

  const msg = messages[language];

  // Priority order of messages
  if (!samePerson) {
    return msg.differentPerson;
  }

  if (!similarPose) {
    return msg.differentPose;
  }

  if (level === 'poor' && inconsistentRegions.length > 0) {
    return msg.regionIssue(inconsistentRegions);
  }

  return msg[level];
}

/**
 * Quick consistency check without full analysis
 * Useful for UI to show simple status
 */
export function getQuickConsistencyStatus(score: number): {
  level: ConsistencyLevel;
  color: string;
  icon: string;
} {
  if (score >= 90) {
    return { level: 'excellent', color: '#10B981', icon: 'checkmark-circle' };
  }
  if (score >= 75) {
    return { level: 'good', color: '#3B82F6', icon: 'checkmark-circle-outline' };
  }
  if (score >= 60) {
    return { level: 'acceptable', color: '#F59E0B', icon: 'alert-circle' };
  }
  return { level: 'poor', color: '#EF4444', icon: 'close-circle' };
}
