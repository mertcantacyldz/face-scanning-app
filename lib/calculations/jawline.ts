// Jawline Calculation Module
// Calculates ALL jawline metrics from MediaPipe Face Mesh landmarks
// AI will ONLY interpret these pre-calculated values

import type { Point3D } from '../geometry';
import { distance2D, distance3D } from '../geometry';

export interface JawlineCalculations {
  // === CHIN CENTERING (30% - most critical) ===
  chinTipX: number;                      // P_152.x
  chinTipY: number;                      // P_152.y
  faceCenterX: number;                   // reference
  chinDeviation: number;                 // horizontal offset (pixels)
  chinDeviationRatio: number;            // percentage of face width
  chinDirection: 'LEFT' | 'RIGHT' | 'CENTER';
  chinCenteringScore: number;            // 0-10 (strict)

  // === JAWLINE SYMMETRY (25% - length & position) ===
  leftJawLength: number;                 // left ear to chin distance
  rightJawLength: number;                // right ear to chin distance
  jawLengthDifference: number;           // absolute difference
  jawLengthDifferenceRatio: number;      // percentage
  leftJawAngleY: number;                 // P_234.y
  rightJawAngleY: number;                // P_454.y
  jawAngleYDifference: number;           // vertical misalignment
  jawlineSymmetryScore: number;          // 0-10

  // === JAW ANGLE SYMMETRY (35% - angle difference only, not sharpness) ===
  leftJawAngle: number;                  // degrees (mandibular angle)
  rightJawAngle: number;                 // degrees
  jawAngleDifference: number;            // absolute difference
  jawAngleSymmetryScore: number;         // 0-10

  // === JAW WIDTH (25% - proportionality) ===
  jawWidth: number;                      // distance between angle points
  faceWidth: number;                     // eye-to-eye distance
  jawWidthRatio: number;                 // percentage of face width
  jawWidthAssessment: 'NARROW' | 'IDEAL' | 'WIDE';
  jawWidthScore: number;                 // 0-10

  // === VERTICAL ALIGNMENT (10% - face balance) ===
  noseToChinDistance: number;            // P_4 to P_152
  expectedChinY: number;                 // based on face proportions
  verticalDeviation: number;             // deviation from ideal
  verticalAlignmentScore: number;        // 0-10

  // === OVERALL ===
  overallScore: number;                  // 0-10 (weighted, strict)
  asymmetryLevel: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

  // === METADATA ===
  faceHeight: number;
  landmarkIndices: {
    chinTip: 152;
    leftJawAngle: 234;
    rightJawAngle: 454;
    leftJawStart: 172;
    rightJawStart: 397;
    leftJawMid: 136;
    rightJawMid: 365;
  };
}

export function calculateJawlineMetrics(landmarks: Point3D[]): JawlineCalculations {
  console.log('🦴 ==========================================');
  console.log('🦴 JAWLINE CALCULATIONS START');
  console.log('🦴 ==========================================');
  console.log('🦴 Total landmarks received:', landmarks.length);

  // ========================================
  // REFERENCE POINTS
  // ========================================

  const chinTip = landmarks[152];           // P_152: Chin tip
  const leftJawAngle = landmarks[234];      // P_234: Left jaw angle
  const rightJawAngle = landmarks[454];     // P_454: Right jaw angle
  const leftJawStart = landmarks[172];      // P_172: Left jaw start (near ear)
  const rightJawStart = landmarks[397];     // P_397: Right jaw start (near ear)
  const leftJawMid = landmarks[136];        // P_136: Left jaw midpoint
  const rightJawMid = landmarks[365];       // P_365: Right jaw midpoint

  // Face reference points
  const noseTip = landmarks[4];             // P_4: Nose tip
  const bridge = landmarks[6];              // P_6: Nose bridge
  const leftEyeOuter = landmarks[263];      // P_263: Left eye outer corner
  const rightEyeOuter = landmarks[33];      // P_33: Right eye outer corner
  const forehead = landmarks[10];           // P_10: Forehead center

  console.log('🦴 JAWLINE LANDMARKS:');
  console.log('  P_152 (chinTip):', chinTip ? `x=${chinTip.x.toFixed(2)}, y=${chinTip.y.toFixed(2)}` : 'MISSING');
  console.log('  P_234 (leftJawAngle):', leftJawAngle ? `x=${leftJawAngle.x.toFixed(2)}, y=${leftJawAngle.y.toFixed(2)}` : 'MISSING');
  console.log('  P_454 (rightJawAngle):', rightJawAngle ? `x=${rightJawAngle.x.toFixed(2)}, y=${rightJawAngle.y.toFixed(2)}` : 'MISSING');
  console.log('  P_172 (leftJawStart):', leftJawStart ? `x=${leftJawStart.x.toFixed(2)}, y=${leftJawStart.y.toFixed(2)}` : 'MISSING');
  console.log('  P_397 (rightJawStart):', rightJawStart ? `x=${rightJawStart.x.toFixed(2)}, y=${rightJawStart.y.toFixed(2)}` : 'MISSING');

  // Face dimensions
  const faceWidth = leftEyeOuter.x - rightEyeOuter.x;
  const faceCenterX = (rightEyeOuter.x + leftEyeOuter.x) / 2;
  const faceHeight = chinTip.y - forehead.y;

  console.log('📐 FACE DIMENSIONS:');
  console.log('  Face width:', faceWidth.toFixed(2), 'px');
  console.log('  Face height:', faceHeight.toFixed(2), 'px');
  console.log('  Face center X:', faceCenterX.toFixed(2), 'px');

  // ========================================
  // 1. CHIN CENTERING (30% weight)
  // ========================================

  const chinTipX = chinTip.x;
  const chinTipY = chinTip.y;
  const chinDeviation = chinTip.x - faceCenterX;
  const chinDeviationRatio = (Math.abs(chinDeviation) / faceWidth) * 100;

  const chinDirection: 'LEFT' | 'RIGHT' | 'CENTER' =
    Math.abs(chinDeviation) < 2 ? 'CENTER' :
    chinDeviation > 0 ? 'RIGHT' : 'LEFT';

  // STRICT SCORING: Chin centering is most visible
  const chinCenteringScore =
    chinDeviationRatio < 1 ? 10 :        // Perfect (<1%)
    chinDeviationRatio < 2 ? 8 :         // Minimal (1-2%)
    chinDeviationRatio < 4 ? 6 :         // Noticeable (2-4%)
    chinDeviationRatio < 6 ? 3 : 1;      // Severe (>6%)

  // ========================================
  // 2. JAWLINE SYMMETRY (25% weight)
  // ========================================

  // Left jawline length (ear start to chin)
  const leftJawLength = distance2D(leftJawStart, chinTip);

  // Right jawline length (ear start to chin)
  const rightJawLength = distance2D(rightJawStart, chinTip);

  const jawLengthDifference = Math.abs(leftJawLength - rightJawLength);
  const jawLengthDifferenceRatio = (jawLengthDifference / Math.max(leftJawLength, rightJawLength)) * 100;

  // Jaw angle Y-coordinate comparison (vertical alignment)
  const leftJawAngleY = leftJawAngle.y;
  const rightJawAngleY = rightJawAngle.y;
  const jawAngleYDifference = Math.abs(leftJawAngleY - rightJawAngleY);

  // STRICT SCORING: Combined length + angle position
  const lengthScore =
    jawLengthDifferenceRatio < 2 ? 10 :
    jawLengthDifferenceRatio < 4 ? 8 :
    jawLengthDifferenceRatio < 7 ? 6 :
    jawLengthDifferenceRatio < 12 ? 3 : 1;

  const anglePositionScore =
    jawAngleYDifference < 3 ? 10 :
    jawAngleYDifference < 6 ? 8 :
    jawAngleYDifference < 10 ? 6 :
    jawAngleYDifference < 15 ? 3 : 1;

  const jawlineSymmetryScore = Math.round((lengthScore * 0.6) + (anglePositionScore * 0.4));

  // ========================================
  // 3. JAW ANGLE SYMMETRY (18% weight)
  // ========================================

  // Calculate jaw angles (mandibular angle)
  // Angle between jaw start -> jaw angle -> chin
  const leftVector1X = leftJawStart.x - leftJawAngle.x;
  const leftVector1Y = leftJawStart.y - leftJawAngle.y;
  const leftVector2X = chinTip.x - leftJawAngle.x;
  const leftVector2Y = chinTip.y - leftJawAngle.y;

  const leftJawAngleDegrees = Math.abs(
    Math.atan2(leftVector1Y, leftVector1X) - Math.atan2(leftVector2Y, leftVector2X)
  ) * (180 / Math.PI);

  const rightVector1X = rightJawStart.x - rightJawAngle.x;
  const rightVector1Y = rightJawStart.y - rightJawAngle.y;
  const rightVector2X = chinTip.x - rightJawAngle.x;
  const rightVector2Y = chinTip.y - rightJawAngle.y;

  const rightJawAngleDegrees = Math.abs(
    Math.atan2(rightVector1Y, rightVector1X) - Math.atan2(rightVector2Y, rightVector2X)
  ) * (180 / Math.PI);

  const jawAngleDifference = Math.abs(leftJawAngleDegrees - rightJawAngleDegrees);

  // STRICT SCORING: Angle difference (no sharpness classification - requires side profile)
  const jawAngleSymmetryScore =
    jawAngleDifference < 3 ? 10 :
    jawAngleDifference < 6 ? 8 :
    jawAngleDifference < 10 ? 6 :
    jawAngleDifference < 15 ? 3 : 1;

  // ========================================
  // 4. JAW WIDTH (12% weight)
  // ========================================

  // TEST: Compare 4 options for jaw width measurement
  const leftJawLower = landmarks[176];   // P_176: Lower jaw corner (near chin)
  const rightJawLower = landmarks[400];  // P_400: Lower jaw corner (near chin)
  const leftJawEar = landmarks[132];     // P_132: Ear lobe level (anatomically correct)
  const rightJawEar = landmarks[361];    // P_361: Ear lobe level (anatomically correct)

  const jawWidthStart = Math.abs(rightJawStart.x - leftJawStart.x);  // P_172 - P_397 (SARI/TURUNCU)
  const jawWidthMid = Math.abs(rightJawMid.x - leftJawMid.x);        // P_136 - P_365 (PEMBE/MOR)
  const jawWidthLower = Math.abs(rightJawLower.x - leftJawLower.x);  // P_176 - P_400 (MAVİ)
  const jawWidthEar = Math.abs(rightJawEar.x - leftJawEar.x);        // P_132 - P_361 (KAHVERENGİ) ✓ CORRECT

  const jawWidthStartRatio = (jawWidthStart / faceWidth) * 100;
  const jawWidthMidRatio = (jawWidthMid / faceWidth) * 100;
  const jawWidthLowerRatio = (jawWidthLower / faceWidth) * 100;
  const jawWidthEarRatio = (jawWidthEar / faceWidth) * 100;

  console.log('🔍 JAW WIDTH OPTIONS:');
  console.log('  Start (P_172-P_397 SARI/TURUNCU):', jawWidthStart.toFixed(2), 'px (', jawWidthStartRatio.toFixed(2), '%)');
  console.log('  ✓ Mid (P_136-P_365 PEMBE/MOR):', jawWidthMid.toFixed(2), 'px (', jawWidthMidRatio.toFixed(2), '%) [SELECTED]');
  console.log('  Lower (P_176-P_400 MAVİ):', jawWidthLower.toFixed(2), 'px (', jawWidthLowerRatio.toFixed(2), '%)');
  console.log('  Ear Level (P_132-P_361 KAHVERENGİ):', jawWidthEar.toFixed(2), 'px (', jawWidthEarRatio.toFixed(2), '%) - Too wide (cheek width)');

  // Use MID (P_136-P_365) as primary measurement - best for frontal view (jaw bone start)
  const jawWidth = jawWidthMid;
  const jawWidthRatio = jawWidthMidRatio;

  // IDEAL RANGE: 80-95% of face width
  const jawWidthScore =
    jawWidthRatio < 70 ? 5 :              // Too narrow
    jawWidthRatio < 80 ? 7 :              // Narrow but acceptable
    jawWidthRatio < 95 ? 10 :             // Ideal range
    jawWidthRatio < 105 ? 8 :             // Slightly wide
    jawWidthRatio < 115 ? 6 : 3;          // Wide/very wide

  const jawWidthAssessment: 'NARROW' | 'IDEAL' | 'WIDE' =
    jawWidthRatio < 80 ? 'NARROW' :
    jawWidthRatio < 95 ? 'IDEAL' : 'WIDE';

  // ========================================
  // 5. VERTICAL ALIGNMENT (10% weight)
  // ========================================

  const noseToChinDistance = distance2D(noseTip, chinTip);

  // Expected chin Y based on face height (chin should be at ~90% of face height)
  const expectedChinY = forehead.y + (faceHeight * 0.90);
  const verticalDeviation = Math.abs(chinTip.y - expectedChinY);
  const verticalDeviationRatio = (verticalDeviation / faceHeight) * 100;

  // STRICT SCORING: Usually normal, penalize only extreme cases
  const verticalAlignmentScore =
    verticalDeviationRatio < 2 ? 10 :
    verticalDeviationRatio < 4 ? 8 :
    verticalDeviationRatio < 7 ? 6 :
    verticalDeviationRatio < 10 ? 4 : 2;

  // ========================================
  // OVERALL SCORE (WEIGHTED)
  // ========================================

  // NEW WEIGHTS (frontal view only, total 100%):
  // - Chin Centering: 30%
  // - Jawline Symmetry: 25%
  // - Jaw Angle Symmetry: 35%
  // - Jaw Width: 25%
  // - Vertical Alignment: 10%
  const overallScore = Math.round(
    chinCenteringScore * 0.30 +
    jawlineSymmetryScore * 0.25 +
    jawAngleSymmetryScore * 0.20 +
    jawWidthScore * 0.15 +
    verticalAlignmentScore * 0.10
  );

  // ASYMMETRY LEVEL
  const asymmetryLevel: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE' =
    overallScore >= 9 ? 'NONE' :
    overallScore >= 7 ? 'MILD' :
    overallScore >= 4 ? 'MODERATE' : 'SEVERE';

  // ============================================
  // LOG ALL CALCULATED VALUES
  // ============================================

  console.log('📊 JAWLINE CALCULATION RESULTS:');
  console.log('  ┌─────────────────────────────────────────────────────');
  console.log('  │ CHIN CENTERING (30% weight):');
  console.log('  │   Chin X:', chinTipX.toFixed(2), ', Face center X:', faceCenterX.toFixed(2));
  console.log('  │   Deviation:', chinDeviation.toFixed(2), 'px (', chinDeviationRatio.toFixed(2), '%) -', chinDirection);
  console.log('  │   Score:', chinCenteringScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ JAWLINE SYMMETRY (25% weight):');
  console.log('  │   Left jaw length:', leftJawLength.toFixed(2), 'px');
  console.log('  │   Right jaw length:', rightJawLength.toFixed(2), 'px');
  console.log('  │   Difference:', jawLengthDifference.toFixed(2), 'px (', jawLengthDifferenceRatio.toFixed(2), '%)');
  console.log('  │   Score:', jawlineSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ JAW ANGLE SYMMETRY (20% weight):');
  console.log('  │   Left jaw angle:', leftJawAngleDegrees.toFixed(2), '°');
  console.log('  │   Right jaw angle:', rightJawAngleDegrees.toFixed(2), '°');
  console.log('  │   Difference:', jawAngleDifference.toFixed(2), '°');
  console.log('  │   Score:', jawAngleSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ JAW WIDTH (15% weight):');
  console.log('  │   Width:', jawWidth.toFixed(2), 'px (', jawWidthRatio.toFixed(2), '% of face) -', jawWidthAssessment);
  console.log('  │   Score:', jawWidthScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ VERTICAL ALIGNMENT (10% weight):');
  console.log('  │   Nose to chin:', noseToChinDistance.toFixed(2), 'px');
  console.log('  │   Deviation:', verticalDeviation.toFixed(2), 'px (', verticalDeviationRatio.toFixed(2), '%)');
  console.log('  │   Score:', verticalAlignmentScore, '/10');
  console.log('  └─────────────────────────────────────────────────────');
  console.log('🏆 OVERALL SCORE:', overallScore, '/10');
  console.log('📋 ASYMMETRY LEVEL:', asymmetryLevel);
  console.log('🦴 ==========================================');
  console.log('🦴 JAWLINE CALCULATIONS END');
  console.log('🦴 ==========================================');

  return {
    // Chin centering
    chinTipX,
    chinTipY,
    faceCenterX,
    chinDeviation,
    chinDeviationRatio,
    chinDirection,
    chinCenteringScore,

    // Jawline symmetry
    leftJawLength,
    rightJawLength,
    jawLengthDifference,
    jawLengthDifferenceRatio,
    leftJawAngleY,
    rightJawAngleY,
    jawAngleYDifference,
    jawlineSymmetryScore,

    // Jaw angle symmetry
    leftJawAngle: leftJawAngleDegrees,
    rightJawAngle: rightJawAngleDegrees,
    jawAngleDifference,
    jawAngleSymmetryScore,

    // Jaw width
    jawWidth,
    faceWidth,
    jawWidthRatio,
    jawWidthAssessment,
    jawWidthScore,

    // Vertical alignment
    noseToChinDistance,
    expectedChinY,
    verticalDeviation,
    verticalAlignmentScore,

    // Overall
    overallScore,
    asymmetryLevel,

    // Metadata
    faceHeight,
    landmarkIndices: {
      chinTip: 152,
      leftJawAngle: 234,
      rightJawAngle: 454,
      leftJawStart: 172,
      rightJawStart: 397,
      leftJawMid: 136,
      rightJawMid: 365,
    },
  };
}
