/**
 * Nose Calculation Module
 *
 * Performs ALL mathematical calculations for nose analysis using TypeScript.
 * AI will only INTERPRET these pre-calculated values, NOT calculate them.
 *
 * STRICT SCORING: Based on clinical visibility thresholds
 * - %4 is the "breaking point" for visible asymmetry
 * - Scoring designed to match what the human eye perceives
 * - NO score inflation - realistic assessment only
 *
 * Coordinate System: 1024x1024 canvas, frontal photos only
 */

import {
  distance2D,
  getCenterX,
  getDirection,
  toPercentageOfWidth,
  type Point3D,
} from '../geometry';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface NoseCalculations {
  // === CORE ASYMMETRY METRICS ===
  // Tip deviation (horizontal)
  tipDeviation: number; // pixels (signed: positive=right, negative=left)
  tipDeviationRatio: number; // percentage
  tipDirection: 'LEFT' | 'RIGHT' | 'CENTER';
  tipScore: number; // 0-10 (strict scale)

  // Nostril asymmetry
  nostrilAsymmetry: number; // pixels
  nostrilAsymmetryRatio: number; // percentage
  nostrilScore: number; // 0-10

  // Rotation (tilt)
  rotationAngle: number; // degrees (signed: positive=tilted right)
  rotationDirection: 'TILTED_LEFT' | 'TILTED_RIGHT' | 'STRAIGHT';
  rotationScore: number; // 0-10

  // 3D Depth
  depthDifference: number; // z-axis units
  depthScore: number; // 0-10

  // === PROPORTIONAL METRICS ===
  // Nose width (alar base)
  noseWidth: number; // pixels
  noseWidthRatio: number; // percentage of face width
  widthScore: number; // 0-10
  widthAssessment: 'NARROW' | 'IDEAL' | 'WIDE';

  // Nose length
  noseLength: number; // pixels (bridge to tip)
  noseLengthRatio: number; // percentage of face width
  lengthScore: number; // 0-10
  lengthAssessment: 'SHORT' | 'PROPORTIONATE' | 'LONG';

  // Tip projection (3D)
  tipProjection: number; // z-axis difference
  projectionScore: number; // 0-10
  projectionAssessment: 'LOW' | 'IDEAL' | 'HIGH' | 'PROMINENT';

  // === DETAILED FEATURES ===
  // Nostril size
  nostrilHeightDiff: number; // pixel difference
  nostrilHeightDiffRatio: number; // percentage
  nostrilSizeScore: number; // 0-10

  // Bridge straightness
  bridgeDeviation: number; // pixels from straight line
  bridgeDeviationRatio: number; // percentage
  bridgeStraightnessScore: number; // 0-10
  bridgeAssessment: 'STRAIGHT' | 'SLIGHTLY_CURVED' | 'CURVED';

  // === OVERALL SCORES ===
  overallScore: number; // 0-10 (weighted, strict)
  asymmetryLevel: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

  // === METADATA ===
  faceWidth: number;
  faceCenterX: number;
  landmarkIndices: {
    noseTip: 4;
    bridge: 6;
    leftNostril: 100;
    rightNostril: 329;
    leftWing: 98;
    rightWing: 327;
    midBridge: 168;
    rightEyeOuter: 33;
    leftEyeOuter: 263;
  };
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate all nose metrics from MediaPipe Face Mesh landmarks
 *
 * IMPORTANT: This function assumes landmarks are correct (no validation)
 * All scoring uses STRICT clinical thresholds (no inflation)
 *
 * @param landmarks Array of 468 MediaPipe Face Mesh landmarks
 * @returns Complete nose analysis with all metrics and scores
 */
export function calculateNoseMetrics(landmarks: Point3D[]): NoseCalculations {
  console.log('🔢 ==========================================');
  console.log('🔢 NOSE CALCULATIONS START');
  console.log('🔢 ==========================================');
  console.log('🔢 Total landmarks received:', landmarks.length);

  // ============================================
  // A. EXTRACT LANDMARKS (NO VALIDATION)
  // ============================================

  const noseTip = landmarks[4]; // P_4
  const bridge = landmarks[6]; // P_6 (nasion)
  const leftNostril = landmarks[100]; // P_100
  const rightNostril = landmarks[329]; // P_329
  const rightEyeOuter = landmarks[33]; // P_33
  const leftEyeOuter = landmarks[263]; // P_263
  const leftWing = landmarks[98]; // P_98 (left wing outer)
  const rightWing = landmarks[327]; // P_327 (right wing outer)
  const midBridge = landmarks[168]; // P_168 (mid bridge point)

  console.log('👃 NOSE LANDMARKS:');
  console.log('  P_4 (noseTip):', noseTip ? `x=${noseTip.x.toFixed(2)}, y=${noseTip.y.toFixed(2)}, z=${noseTip.z.toFixed(4)}` : 'MISSING');
  console.log('  P_6 (bridge):', bridge ? `x=${bridge.x.toFixed(2)}, y=${bridge.y.toFixed(2)}, z=${bridge.z.toFixed(4)}` : 'MISSING');
  console.log('  P_100 (leftNostril):', leftNostril ? `x=${leftNostril.x.toFixed(2)}, y=${leftNostril.y.toFixed(2)}` : 'MISSING');
  console.log('  P_329 (rightNostril):', rightNostril ? `x=${rightNostril.x.toFixed(2)}, y=${rightNostril.y.toFixed(2)}` : 'MISSING');
  console.log('  P_98 (leftWing):', leftWing ? `x=${leftWing.x.toFixed(2)}, y=${leftWing.y.toFixed(2)}` : 'MISSING');
  console.log('  P_327 (rightWing):', rightWing ? `x=${rightWing.x.toFixed(2)}, y=${rightWing.y.toFixed(2)}` : 'MISSING');
  console.log('  P_168 (midBridge):', midBridge ? `x=${midBridge.x.toFixed(2)}, y=${midBridge.y.toFixed(2)}` : 'MISSING');
  console.log('👁️ EYE REFERENCE:');
  console.log('  P_33 (rightEyeOuter):', rightEyeOuter ? `x=${rightEyeOuter.x.toFixed(2)}, y=${rightEyeOuter.y.toFixed(2)}` : 'MISSING');
  console.log('  P_263 (leftEyeOuter):', leftEyeOuter ? `x=${leftEyeOuter.x.toFixed(2)}, y=${leftEyeOuter.y.toFixed(2)}` : 'MISSING');

  // Calculate face dimensions
  const faceWidth = leftEyeOuter.x - rightEyeOuter.x;
  const faceCenterX = getCenterX(rightEyeOuter, leftEyeOuter);

  console.log('📐 FACE DIMENSIONS:');
  console.log('  Face width:', faceWidth.toFixed(2), 'px');
  console.log('  Face center X:', faceCenterX.toFixed(2), 'px');

  // ============================================
  // B. NOSE TIP DEVIATION (HORIZONTAL CENTERING)
  // ============================================

  const tipDeviation = noseTip.x - faceCenterX; // Signed pixels
  const tipDeviationRatio = toPercentageOfWidth(tipDeviation, faceWidth);
  const tipDirection = getDirection(tipDeviation, 2);

  // STRICT SCORING: %4 is the "breaking point" for visible asymmetry
  const tipScore =
    tipDeviationRatio < 1.5
      ? 10 // Symmetric (9-10)
      : tipDeviationRatio < 3.5
        ? 8 // Mild (7-8) - Tolerable
        : tipDeviationRatio < 5
          ? 6 // Noticeable (4-6) - Visible
          : tipDeviationRatio < 8
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  // ============================================
  // C. NOSTRIL ASYMMETRY
  // ============================================

  const leftNostrilDist = Math.abs(leftNostril.x - faceCenterX);
  const rightNostrilDist = Math.abs(rightNostril.x - faceCenterX);
  const nostrilAsymmetry = Math.abs(leftNostrilDist - rightNostrilDist);
  const nostrilAsymmetryRatio = toPercentageOfWidth(nostrilAsymmetry, faceWidth);

  // STRICT SCORING: Nostril asymmetry is usually a consequence of tip deviation
  const nostrilScore =
    nostrilAsymmetryRatio < 2
      ? 10 // Equal (10)
      : nostrilAsymmetryRatio < 5
        ? 8 // Mild (7-8)
        : nostrilAsymmetryRatio < 10
          ? 6 // Noticeable (4-6)
          : 3; // Prominent (0-3)

  // ============================================
  // D. ROTATION ANGLE (TILT)
  // ============================================

  const dx = bridge.x - noseTip.x;
  const dy = noseTip.y - bridge.y;
  const rotationAngle = Math.atan2(dx, dy) * (180 / Math.PI);
  const rotationDirection =
    Math.abs(rotationAngle) < 3
      ? 'STRAIGHT'
      : rotationAngle > 0
        ? 'TILTED_RIGHT'
        : 'TILTED_LEFT';

  // STRICT SCORING: Human eye perceives 2-3° as "tilted"
  const rotationScore =
    Math.abs(rotationAngle) < 1.5
      ? 10 // Straight (10)
      : Math.abs(rotationAngle) < 3
        ? 8 // Minimal (7-8)
        : Math.abs(rotationAngle) < 6
          ? 6 // Noticeable (4-6)
          : Math.abs(rotationAngle) < 10
            ? 3 // Severe (2-3)
            : 1; // Very Severe (0-1)

  // ============================================
  // E. 3D DEPTH DIFFERENCE
  // ============================================

  const depthDifference = Math.abs(leftNostril.z - rightNostril.z);

  // STRICT SCORING: Z-axis is photo-quality dependent, lower weight
  const depthScore =
    depthDifference < 0.01
      ? 10 // Planar symmetry (10)
      : depthDifference < 0.025
        ? 8 // Mild depth diff (7-8)
        : 6; // Noticeable perspective shift (4-6)

  // ============================================
  // G. ADDITIONAL METRICS
  // ============================================

  // G1. Nose Width (Alar Base)
  const noseWidth = Math.abs(leftWing.x - rightWing.x);
  const noseWidthRatio = toPercentageOfWidth(noseWidth, faceWidth);

  // IDEAL RANGE: 30-40% of face width
  const widthScore =
    noseWidthRatio < 25
      ? 5 // Too narrow
      : noseWidthRatio < 30
        ? 7 // Narrow but acceptable
        : noseWidthRatio < 35
          ? 10 // Ideal range (30-35%)
          : noseWidthRatio < 40
            ? 9 // Good range
            : noseWidthRatio < 45
              ? 7 // Wide
              : noseWidthRatio < 50
                ? 5
                : 3; // Very wide

  const widthAssessment =
    noseWidthRatio < 30 ? 'NARROW' : noseWidthRatio < 40 ? 'IDEAL' : 'WIDE';

  // G2. Nose Length
  const noseLength = distance2D(bridge, noseTip);
  const noseLengthRatio = toPercentageOfWidth(noseLength, faceWidth);

  // IDEAL RANGE: ~35-45% of face width
  const lengthScore =
    noseLengthRatio < 30
      ? 6 // Short nose
      : noseLengthRatio < 35
        ? 8 // Slightly short
        : noseLengthRatio < 45
          ? 10 // Ideal
          : noseLengthRatio < 50
            ? 8 // Slightly long
            : 6; // Long nose

  const lengthAssessment =
    noseLengthRatio < 35
      ? 'SHORT'
      : noseLengthRatio < 45
        ? 'PROPORTIONATE'
        : 'LONG';

  // G3. Nose Tip Projection (Z-axis)
  const tipProjection = Math.abs(noseTip.z - bridge.z);

  // IDEAL RANGE: 0.06-0.09 units (from 1024x1024 real data analysis)
  const projectionScore =
    tipProjection < 0.04
      ? 5 // Flat/button nose
      : tipProjection < 0.06
        ? 7 // Low projection
        : tipProjection < 0.09
          ? 10 // Ideal projection
          : tipProjection < 0.12
            ? 8 // High projection
            : tipProjection < 0.15
              ? 6
              : 4; // Very prominent

  const projectionAssessment =
    tipProjection < 0.06
      ? 'LOW'
      : tipProjection < 0.09
        ? 'IDEAL'
        : tipProjection < 0.12
          ? 'HIGH'
          : 'PROMINENT';

  // G4. Nostril Size & Shape
  const leftNostrilBottom = landmarks[2]; // P_2 (bottom reference)
  const leftNostrilHeight = Math.abs(leftNostrilBottom.y - leftWing.y);
  const rightNostrilHeight = Math.abs(leftNostrilBottom.y - rightWing.y);

  const nostrilHeightDiff = Math.abs(leftNostrilHeight - rightNostrilHeight);
  const nostrilHeightDiffRatio =
    (nostrilHeightDiff / Math.max(leftNostrilHeight, rightNostrilHeight)) * 100;

  const nostrilSizeScore =
    nostrilHeightDiffRatio < 5
      ? 10 // Symmetric
      : nostrilHeightDiffRatio < 10
        ? 8 // Mild difference
        : nostrilHeightDiffRatio < 20
          ? 6
          : 4; // Noticeable difference

  // G5. Nasal Bridge Straightness (Dorsum)
  const expectedMidX = (bridge.x + noseTip.x) / 2;
  const bridgeDeviation = Math.abs(midBridge.x - expectedMidX);
  const bridgeDeviationRatio = toPercentageOfWidth(bridgeDeviation, faceWidth);

  const bridgeStraightnessScore =
    bridgeDeviationRatio < 1
      ? 10 // Perfectly straight
      : bridgeDeviationRatio < 2
        ? 8 // Slightly curved
        : bridgeDeviationRatio < 4
          ? 6
          : 4; // Noticeably curved/bumpy

  const bridgeAssessment =
    bridgeDeviationRatio < 1
      ? 'STRAIGHT'
      : bridgeDeviationRatio < 3
        ? 'SLIGHTLY_CURVED'
        : 'CURVED';

  // ============================================
  // F. OVERALL SCORE (WEIGHTED)
  // ============================================

  // WEIGHTED SCORING: Tip deviation is most critical
  const overallScore = Math.round(
    tipScore * 0.4 + // Tip deviation (40% - most critical)
      rotationScore * 0.3 + // Rotation angle (30%)
      nostrilScore * 0.2 + // Nostril asymmetry (20%)
      depthScore * 0.1 // Depth difference (10% - least reliable)
  );

  // REALISTIC ASYMMETRY LEVELS
  const asymmetryLevel =
    overallScore >= 9
      ? 'NONE' // 9-10: Symmetric
      : overallScore >= 7
        ? 'MILD' // 7-8: Mild, tolerable
        : overallScore >= 4
          ? 'MODERATE' // 4-6: Noticeable
          : 'SEVERE'; // 0-3: Severe deviation

  // ============================================
  // LOG ALL CALCULATED VALUES
  // ============================================

  console.log('📊 NOSE CALCULATION RESULTS:');
  console.log('  ┌─────────────────────────────────────────────────────');
  console.log('  │ TIP DEVIATION (40% weight):');
  console.log('  │   Deviation:', tipDeviation.toFixed(2), 'px');
  console.log('  │   Ratio:', tipDeviationRatio.toFixed(2), '%');
  console.log('  │   Direction:', tipDirection);
  console.log('  │   Score:', tipScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ ROTATION (30% weight):');
  console.log('  │   Angle:', rotationAngle.toFixed(2), '°');
  console.log('  │   Direction:', rotationDirection);
  console.log('  │   Score:', rotationScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ NOSTRIL ASYMMETRY (20% weight):');
  console.log('  │   Asymmetry:', nostrilAsymmetry.toFixed(2), 'px');
  console.log('  │   Ratio:', nostrilAsymmetryRatio.toFixed(2), '%');
  console.log('  │   Score:', nostrilScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ DEPTH (10% weight):');
  console.log('  │   Difference:', depthDifference.toFixed(4));
  console.log('  │   Score:', depthScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ PROPORTIONS:');
  console.log('  │   Width:', noseWidth.toFixed(2), 'px (', noseWidthRatio.toFixed(2), '%) -', widthAssessment);
  console.log('  │   Length:', noseLength.toFixed(2), 'px (', noseLengthRatio.toFixed(2), '%) -', lengthAssessment);
  console.log('  │   Projection:', tipProjection.toFixed(4), '-', projectionAssessment);
  console.log('  │   Bridge:', bridgeDeviation.toFixed(2), 'px deviation -', bridgeAssessment);
  console.log('  └─────────────────────────────────────────────────────');
  console.log('🏆 OVERALL SCORE:', overallScore, '/10');
  console.log('📋 ASYMMETRY LEVEL:', asymmetryLevel);
  console.log('🔢 ==========================================');
  console.log('🔢 NOSE CALCULATIONS END');
  console.log('🔢 ==========================================');

  // ============================================
  // RETURN ALL CALCULATIONS
  // ============================================

  return {
    // Core asymmetry metrics
    tipDeviation,
    tipDeviationRatio,
    tipDirection,
    tipScore,

    nostrilAsymmetry,
    nostrilAsymmetryRatio,
    nostrilScore,

    rotationAngle,
    rotationDirection,
    rotationScore,

    depthDifference,
    depthScore,

    // Proportional metrics
    noseWidth,
    noseWidthRatio,
    widthScore,
    widthAssessment,

    noseLength,
    noseLengthRatio,
    lengthScore,
    lengthAssessment,

    tipProjection,
    projectionScore,
    projectionAssessment,

    // Detailed features
    nostrilHeightDiff,
    nostrilHeightDiffRatio,
    nostrilSizeScore,

    bridgeDeviation,
    bridgeDeviationRatio,
    bridgeStraightnessScore,
    bridgeAssessment,

    // Overall scores
    overallScore,
    asymmetryLevel,

    // Metadata
    faceWidth,
    faceCenterX,
    landmarkIndices: {
      noseTip: 4,
      bridge: 6,
      leftNostril: 100,
      rightNostril: 329,
      leftWing: 98,
      rightWing: 327,
      midBridge: 168,
      rightEyeOuter: 33,
      leftEyeOuter: 263,
    },
  };
}
