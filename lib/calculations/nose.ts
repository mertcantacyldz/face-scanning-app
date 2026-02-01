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

  // === ROTATION (Simple atan2 - Nose axis tilt from vertical) ===
  // Measures how much the nose axis (bridge → tip) deviates from vertical
  // More intuitive and calibrated against real test cases
  rotationAngle: number; // degrees (signed: positive=tilted right, negative=tilted left)
  rotationDirection: 'TILTED_LEFT' | 'TILTED_RIGHT' | 'STRAIGHT';
  rotationScore: number; // 0-10 (used in overall score)

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
// CONTINUOUS SCORING FUNCTIONS (v3.0 - Calibrated)
// ============================================
// Linear interpolation for smooth score transitions
// Calibrated against real test cases for accurate perception matching

/**
 * Calculate tip deviation score using continuous linear interpolation
 * Ultra-aggressive scoring in %3-4.5 range to match human perception
 *
 * Calibration targets:
 * - %3.35 → 6.6 (Case 1: visible but mild)
 * - %3.94 → 4.2 (Case 2: more noticeable)
 * - %4.32 → 2.7 (Case 3: significant deviation)
 */
function calculateTipScore(ratio: number): number {
  const absRatio = Math.abs(ratio);
  if (absRatio <= 1.5) return 10;                                    // Symmetric
  if (absRatio <= 2.5) return 10 - ((absRatio - 1.5) * 0.5);        // 10 → 9.5
  if (absRatio <= 3.0) return 9.5 - ((absRatio - 2.5) * 3);         // 9.5 → 8
  if (absRatio <= 3.5) return 8 - ((absRatio - 3.0) * 4);           // 8 → 6
  if (absRatio <= 4.0) return 6 - ((absRatio - 3.5) * 4);           // 6 → 4
  if (absRatio <= 4.5) return 4 - ((absRatio - 4.0) * 4);           // 4 → 2
  if (absRatio <= 6.0) return 2 - ((absRatio - 4.5) * 0.5);         // 2 → 1.25
  return 1;
}

/**
 * Calculate rotation score using continuous linear interpolation
 */
function calculateRotationScore(angle: number): number {
  const absAngle = Math.abs(angle);
  if (absAngle <= 1.5) return 10;                                    // Straight
  if (absAngle <= 3.0) return 10 - ((absAngle - 1.5) / 1.5) * 2;    // 10 → 8
  if (absAngle <= 5.0) return 8 - ((absAngle - 3.0) / 2.0) * 3;     // 8 → 5
  if (absAngle <= 8.0) return 5 - ((absAngle - 5.0) / 3.0) * 2;     // 5 → 3
  if (absAngle <= 12.0) return 3 - ((absAngle - 8.0) / 4.0) * 2;    // 3 → 1
  return 1;
}

/**
 * Calculate nostril asymmetry score using continuous linear interpolation
 */
function calculateNostrilScore(ratio: number): number {
  const absRatio = Math.abs(ratio);
  if (absRatio <= 2.0) return 10;                                    // Equal
  if (absRatio <= 5.0) return 10 - ((absRatio - 2.0) / 3.0) * 3;    // 10 → 7
  if (absRatio <= 10.0) return 7 - ((absRatio - 5.0) / 5.0) * 4;    // 7 → 3
  return 3;
}

/**
 * Calculate depth difference score using continuous linear interpolation
 */
function calculateDepthScore(diff: number): number {
  const absDiff = Math.abs(diff);
  if (absDiff < 0.01) return 10;                                     // Planar
  if (absDiff < 0.025) return 10 - ((absDiff - 0.01) / 0.015) * 2;  // 10 → 8
  if (absDiff < 0.05) return 8 - ((absDiff - 0.025) / 0.025) * 2;   // 8 → 6
  return 6;
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
  const leftNostrilBottom = landmarks[2]; // P_2 (bottom reference)

  console.log('🔍 RAW LANDMARK DATA (NOSE):');
  console.log('  P_4 (noseTip):', JSON.stringify({ x: noseTip.x, y: noseTip.y, z: noseTip.z }));
  console.log('  P_6 (bridge):', JSON.stringify({ x: bridge.x, y: bridge.y, z: bridge.z }));
  console.log('  P_100 (leftNostril):', JSON.stringify({ x: leftNostril.x, y: leftNostril.y, z: leftNostril.z }));
  console.log('  P_329 (rightNostril):', JSON.stringify({ x: rightNostril.x, y: rightNostril.y, z: rightNostril.z }));
  console.log('  P_98 (leftWing):', JSON.stringify({ x: leftWing.x, y: leftWing.y, z: leftWing.z }));
  console.log('  P_327 (rightWing):', JSON.stringify({ x: rightWing.x, y: rightWing.y, z: rightWing.z }));
  console.log('  P_168 (midBridge):', JSON.stringify({ x: midBridge.x, y: midBridge.y, z: midBridge.z }));
  console.log('  P_2 (leftNostrilBottom):', JSON.stringify({ x: leftNostrilBottom.x, y: leftNostrilBottom.y, z: leftNostrilBottom.z }));

  console.log('🔍 RAW LANDMARK DATA (EYES):');
  console.log('  P_33 (rightEyeOuter):', JSON.stringify({ x: rightEyeOuter.x, y: rightEyeOuter.y, z: rightEyeOuter.z }));
  console.log('  P_263 (leftEyeOuter):', JSON.stringify({ x: leftEyeOuter.x, y: leftEyeOuter.y, z: leftEyeOuter.z }));

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
  console.log('  DEBUG - Reference Points X: P_33(RightEyeOuter)=', rightEyeOuter.x.toFixed(2), 'P_263(LeftEyeOuter)=', leftEyeOuter.x.toFixed(2));

  // DEBUG-MIRROR: Kritik hesaplama kontrolü
  console.log('🔍 [DEBUG-MIRROR] KRİTİK HESAPLAMA:');
  console.log('  rightEyeOuter (P33) x:', rightEyeOuter.x.toFixed(2));
  console.log('  leftEyeOuter (P263) x:', leftEyeOuter.x.toFixed(2));
  console.log('  faceWidth (P263.x - P33.x):', faceWidth.toFixed(2));
  console.log('  faceCenterX:', faceCenterX.toFixed(2));
  console.log('  AYNA KONTROLÜ:', rightEyeOuter.x < leftEyeOuter.x ? '✅ NORMAL (P33 < P263)' : '⚠️ AYNALI (P33 > P263)');

  // ============================================
  // B. NOSE TIP DEVIATION (HORIZONTAL CENTERING)
  // ============================================

  const tipDeviation = noseTip.x - faceCenterX; // Signed pixels
  const tipDeviationRatio = toPercentageOfWidth(tipDeviation, faceWidth);
  const tipDirection = getDirection(tipDeviation, 2);

  console.log('🔍 DEBUG TIP CALCULATION:');
  console.log('  noseTip.x:', noseTip.x.toFixed(2));
  console.log('  faceCenterX:', faceCenterX.toFixed(2));
  console.log('  tipDeviation (x - center):', tipDeviation.toFixed(2));
  console.log('  tipDirection assigned:', tipDirection);

  // DEBUG-MIRROR: Tip deviation sonucu
  console.log('👃 [DEBUG-MIRROR] TIP DEVIATION SONUCU:');
  console.log('  noseTip.x:', noseTip.x.toFixed(2));
  console.log('  faceCenterX:', faceCenterX.toFixed(2));
  console.log('  tipDeviation (noseTip.x - faceCenterX):', tipDeviation.toFixed(2));
  console.log('  tipDirection:', tipDirection);
  console.log('  BEKLENTİ: Aynalı resimde tipDirection TERSİNE dönmeli!');

  // CONTINUOUS SCORING: Smooth linear interpolation for accurate perception
  const tipScore = calculateTipScore(tipDeviationRatio);

  // ============================================
  // C. NOSTRIL ASYMMETRY
  // ============================================

  const leftNostrilDist = Math.abs(leftNostril.x - faceCenterX);
  const rightNostrilDist = Math.abs(rightNostril.x - faceCenterX);
  const nostrilAsymmetry = Math.abs(leftNostrilDist - rightNostrilDist);
  const nostrilAsymmetryRatio = toPercentageOfWidth(nostrilAsymmetry, faceWidth);

  // CONTINUOUS SCORING: Smooth linear interpolation
  const nostrilScore = calculateNostrilScore(nostrilAsymmetryRatio);

  // ============================================
  // D. ROTATION ANGLE (Simple atan2 - Nose axis tilt)
  // ============================================
  // Measures how much the nose axis (bridge → tip) deviates from vertical
  // dx = horizontal displacement, dy = vertical distance
  // atan2(dx, dy) gives angle from vertical axis

  const dx = bridge.x - noseTip.x;
  const dy = noseTip.y - bridge.y;
  const rotationAngle = Math.atan2(dx, dy) * (180 / Math.PI);

  // Direction: positive = tilted right (from person's perspective)
  const rotationDirection: 'TILTED_LEFT' | 'TILTED_RIGHT' | 'STRAIGHT' =
    Math.abs(rotationAngle) < 3
      ? 'STRAIGHT'
      : rotationAngle > 0
        ? 'TILTED_RIGHT'
        : 'TILTED_LEFT';

  // CONTINUOUS SCORING: Smooth linear interpolation
  const rotationScore = calculateRotationScore(rotationAngle);

  console.log('📐 ROTATION CALCULATION:');
  console.log('  dx (bridge.x - noseTip.x):', dx.toFixed(2));
  console.log('  dy (noseTip.y - bridge.y):', dy.toFixed(2));
  console.log('  Rotation angle:', rotationAngle.toFixed(2), '°');
  console.log('  Direction:', rotationDirection);
  console.log('  Score:', rotationScore.toFixed(1), '/10');

  // ============================================
  // E. 3D DEPTH DIFFERENCE
  // ============================================

  const depthDifference = Math.abs(leftNostril.z - rightNostril.z);

  // CONTINUOUS SCORING: Smooth linear interpolation
  const depthScore = calculateDepthScore(depthDifference);

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
  // F. OVERALL SCORE (WEIGHTED - v3.0 Calibrated)
  // ============================================

  // v3.0: Tip deviation is dominant (70%) - calibrated for accurate perception
  // No Math.round() - küsüratlı skor for precision
  const overallScore =
    tipScore * 0.70 +       // Tip deviation (70% - dominant factor)
    rotationScore * 0.15 +  // Rotation angle (15%)
    nostrilScore * 0.10 +   // Nostril asymmetry (10%)
    depthScore * 0.05;      // Depth difference (5% - least reliable)

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

  console.log('📊 NOSE CALCULATION RESULTS (v3.0 - Calibrated):');
  console.log('  ┌─────────────────────────────────────────────────────');
  console.log('  │ TIP DEVIATION (70% weight):');
  console.log('  │   Deviation:', tipDeviation.toFixed(2), 'px');
  console.log('  │   Ratio:', tipDeviationRatio.toFixed(2), '%');
  console.log('  │   Direction:', tipDirection);
  console.log('  │   Score:', tipScore.toFixed(1), '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ ROTATION (15% weight):');
  console.log('  │   Angle:', rotationAngle.toFixed(2), '°');
  console.log('  │   Direction:', rotationDirection);
  console.log('  │   Score:', rotationScore.toFixed(1), '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ NOSTRIL ASYMMETRY (10% weight):');
  console.log('  │   Asymmetry:', nostrilAsymmetry.toFixed(2), 'px');
  console.log('  │   Ratio:', nostrilAsymmetryRatio.toFixed(2), '%');
  console.log('  │   Score:', nostrilScore.toFixed(1), '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ DEPTH (5% weight):');
  console.log('  │   Difference:', depthDifference.toFixed(4));
  console.log('  │   Score:', depthScore.toFixed(1), '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ PROPORTIONS:');
  console.log('  │   Width:', noseWidth.toFixed(2), 'px (', noseWidthRatio.toFixed(2), '%) -', widthAssessment);
  console.log('  │   Length:', noseLength.toFixed(2), 'px (', noseLengthRatio.toFixed(2), '%) -', lengthAssessment);
  console.log('  │   Projection:', tipProjection.toFixed(4), '-', projectionAssessment);
  console.log('  │   Bridge:', bridgeDeviation.toFixed(2), 'px deviation -', bridgeAssessment);
  console.log('  └─────────────────────────────────────────────────────');
  console.log('🏆 OVERALL SCORE:', overallScore.toFixed(1), '/10');
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

    // Rotation metrics (simple atan2)
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
