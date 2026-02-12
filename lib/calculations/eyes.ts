/**
 * Eyes Calculation Module
 *
 * Performs ALL mathematical calculations for eyes analysis using TypeScript.
 * AI will only INTERPRET these pre-calculated values, NOT calculate them.
 *
 * STRICT SCORING: Based on clinical visibility thresholds
 * - %3-5 is the "breaking point" for visible eye asymmetry
 * - Scoring designed to match what the human eye perceives
 * - NO score inflation - realistic assessment only
 *
 * Coordinate System: 1024x1024 canvas, frontal photos only
 */

import {
  getCenterX,
  toPercentageOfWidth,
  type Point3D
} from '../geometry';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface EyeCalculations {
  // === EYE SIZE SYMMETRY ===
  // Left eye dimensions
  leftEyeWidth: number; // pixels
  leftEyeHeight: number; // pixels
  leftEyeArea: number; // pixels²

  // Right eye dimensions
  rightEyeWidth: number; // pixels
  rightEyeHeight: number; // pixels
  rightEyeArea: number; // pixels²

  // Symmetry metrics
  widthDifference: number; // pixels
  widthDifferenceRatio: number; // percentage
  heightDifference: number; // pixels
  heightDifferenceRatio: number; // percentage
  areaDifference: number; // pixels²
  areaDifferenceRatio: number; // percentage
  sizeSymmetryScore: number; // 0-10 (strict)

  // === EYE POSITION SYMMETRY ===
  // Vertical alignment
  leftEyeCenterY: number; // Y coordinate
  rightEyeCenterY: number; // Y coordinate
  verticalMisalignment: number; // pixels
  verticalMisalignmentRatio: number; // percentage of face width

  // Horizontal alignment
  leftEyeCenterX: number; // X coordinate
  rightEyeCenterX: number; // X coordinate
  leftDistanceFromCenter: number; // pixels
  rightDistanceFromCenter: number; // pixels
  horizontalAsymmetry: number; // pixels
  positionSymmetryScore: number; // 0-10 (strict)

  // === INTER-EYE DISTANCE ===
  interEyeDistance: number; // pixels (inner corner to inner corner)
  interEyeDistanceRatio: number; // percentage of face width
  interEyeScore: number; // 0-10
  interEyeAssessment: 'CLOSE_SET' | 'IDEAL' | 'WIDE_SET';

  // === EYE SHAPE & CANTHAL TILT ===
  // Left eye shape
  leftEyeRatio: number; // height/width (roundness)
  leftCanthalTilt: number; // degrees
  leftCanthalTiltDirection: 'DOWNTURNED' | 'NEUTRAL' | 'UPTURNED';

  // Right eye shape
  rightEyeRatio: number; // height/width
  rightCanthalTilt: number; // degrees
  rightCanthalTiltDirection: 'DOWNTURNED' | 'NEUTRAL' | 'UPTURNED';

  // Shape symmetry
  ratioAsymmetry: number; // absolute difference
  tiltAsymmetry: number; // degrees difference
  shapeSymmetryScore: number; // 0-10

  // === EYEBROW-TO-EYE DISTANCE ===
  leftBrowEyeDistance: number; // pixels
  rightBrowEyeDistance: number; // pixels
  browEyeAsymmetry: number; // pixels
  browEyeAsymmetryRatio: number; // percentage
  browEyeScore: number; // 0-10

  // === EYELID ANALYSIS ===
  leftUpperLidExposure: number; // pixels
  rightUpperLidExposure: number; // pixels
  upperLidAsymmetry: number; // pixels
  upperLidAsymmetryRatio: number; // percentage

  leftLowerLidExposure: number; // pixels
  rightLowerLidExposure: number; // pixels
  lowerLidAsymmetry: number; // pixels
  lowerLidAsymmetryRatio: number; // percentage

  eyelidScore: number; // 0-10

  // === 3D DEPTH ===
  leftEyeDepth: number; // z-axis units
  rightEyeDepth: number; // z-axis units
  depthDifference: number; // z-axis units
  depthScore: number; // 0-10 (low weight)

  // === OVERALL SCORES ===
  overallScore: number; // 0-10 (weighted, strict)
  asymmetryLevel: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

  // === METADATA ===
  faceWidth: number;
  faceCenterX: number;
  landmarkIndices: {
    leftEyeOuter: 33;
    leftEyeInner: 133;
    leftEyeTop: 159;
    leftEyeBottom: 145;
    rightEyeOuter: 263;
    rightEyeInner: 362;
    rightEyeTop: 386;
    rightEyeBottom: 374;
    leftBrowTop: 107;
    leftBrowBottom: 66;
    rightBrowTop: 336;
    rightBrowBottom: 296;
    leftUpperLid: 246;
    leftLowerLid: 7;
    rightUpperLid: 466;
    rightLowerLid: 249;
    leftEyeOuterRef: 263;
    rightEyeOuterRef: 33;
  };
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate all eye metrics from MediaPipe Face Mesh landmarks
 *
 * IMPORTANT: This function assumes landmarks are correct (no validation)
 * All scoring uses STRICT clinical thresholds (no inflation)
 *
 * @param landmarks Array of 468 MediaPipe Face Mesh landmarks
 * @returns Complete eyes analysis with all metrics and scores
 */
export function calculateEyeMetrics(landmarks: Point3D[]): EyeCalculations {
  console.log('👁️ ==========================================');
  console.log('👁️ EYES CALCULATIONS START');
  console.log('👁️ ==========================================');
  console.log('👁️ Total landmarks received:', landmarks.length);

  // ============================================
  // A. EXTRACT LANDMARKS (NO VALIDATION)
  // ============================================

  // MediaPipe landmark indices (from camera's perspective):
  // P_33 = right eye outer corner (screen LEFT side)
  // P_263 = left eye outer corner (screen RIGHT side)
  // We use "left/right" from the VIEWER's perspective (mirrored)

  // Left eye landmarks (screen RIGHT side, viewer's left)
  const leftEyeOuter = landmarks[263]; // P_263 - outer corner
  const leftEyeInner = landmarks[362]; // P_362 - inner corner
  const leftEyeTop = landmarks[386]; // P_386
  const leftEyeBottom = landmarks[374]; // P_374

  // Right eye landmarks (screen LEFT side, viewer's right)
  const rightEyeOuter = landmarks[33]; // P_33 - outer corner
  const rightEyeInner = landmarks[133]; // P_133 - inner corner
  const rightEyeTop = landmarks[159]; // P_159
  const rightEyeBottom = landmarks[145]; // P_145

  // Eyebrow landmarks (same perspective fix)
  const leftBrowTop = landmarks[336]; // P_336 (viewer's left = screen RIGHT)
  const leftBrowBottom = landmarks[296]; // P_296
  const rightBrowTop = landmarks[107]; // P_107 (viewer's right = screen LEFT)
  const rightBrowBottom = landmarks[66]; // P_66

  // Eyelid landmarks (same perspective fix)
  const leftUpperLid = landmarks[466]; // P_466 (viewer's left = screen RIGHT)
  const leftLowerLid = landmarks[249]; // P_249
  const rightUpperLid = landmarks[246]; // P_246 (viewer's right = screen LEFT)
  const rightLowerLid = landmarks[7]; // P_7

  // Face reference points
  const rightEyeOuterRef = landmarks[33]; // P_33 (face left side)
  const leftEyeOuterRef = landmarks[263]; // P_263 (face right side)

  console.log('🔍 RAW LANDMARK DATA (EYES):');
  console.log('  P_33 (rightEyeOuter):', JSON.stringify({ x: rightEyeOuter.x, y: rightEyeOuter.y, z: rightEyeOuter.z }));
  console.log('  P_263 (leftEyeOuter):', JSON.stringify({ x: leftEyeOuter.x, y: leftEyeOuter.y, z: leftEyeOuter.z }));
  console.log('  P_362 (leftEyeInner):', JSON.stringify({ x: leftEyeInner.x, y: leftEyeInner.y }));
  console.log('  P_133 (rightEyeInner):', JSON.stringify({ x: rightEyeInner.x, y: rightEyeInner.y }));

  // Calculate face dimensions
  const faceWidth = leftEyeOuterRef.x - rightEyeOuterRef.x;
  const faceCenterX = getCenterX(rightEyeOuterRef, leftEyeOuterRef);

  console.log('📐 FACE DIMENSIONS:');
  console.log('  Face width:', faceWidth.toFixed(2), 'px');
  console.log('  Face center X:', faceCenterX.toFixed(2), 'px');
  console.log('  DEBUG - Reference Points X: P_33(RightEyeOuterRef)=', rightEyeOuterRef.x.toFixed(2), 'P_263(LeftEyeOuterRef)=', leftEyeOuterRef.x.toFixed(2));

  // ============================================
  // B. EYE SIZE SYMMETRY
  // ============================================

  // LEFT EYE DIMENSIONS
  const leftEyeWidth = Math.abs(leftEyeInner.x - leftEyeOuter.x);
  const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
  const leftEyeArea = leftEyeWidth * leftEyeHeight;

  // RIGHT EYE DIMENSIONS
  const rightEyeWidth = Math.abs(rightEyeInner.x - rightEyeOuter.x);
  const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
  const rightEyeArea = rightEyeWidth * rightEyeHeight;

  // SIZE ASYMMETRY CALCULATIONS
  const widthDifference = Math.abs(leftEyeWidth - rightEyeWidth);
  const widthDifferenceRatio = (widthDifference / Math.max(leftEyeWidth, rightEyeWidth)) * 100;

  const heightDifference = Math.abs(leftEyeHeight - rightEyeHeight);
  const heightDifferenceRatio =
    (heightDifference / Math.max(leftEyeHeight, rightEyeHeight)) * 100;

  const areaDifference = Math.abs(leftEyeArea - rightEyeArea);
  const areaDifferenceRatio = (areaDifference / Math.max(leftEyeArea, rightEyeArea)) * 100;

  // STRICT SCORING: %3 is threshold for visible size asymmetry
  // If BOTH width and height are symmetric → high score
  // If either is noticeably different → lower score
  const widthAsymmetryScore =
    widthDifferenceRatio < 2
      ? 10 // Nearly identical (10)
      : widthDifferenceRatio < 4
        ? 8 // Mild (7-8)
        : widthDifferenceRatio < 7
          ? 6 // Noticeable (4-6)
          : widthDifferenceRatio < 12
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  const heightAsymmetryScore =
    heightDifferenceRatio < 2
      ? 10
      : heightDifferenceRatio < 4
        ? 8
        : heightDifferenceRatio < 7
          ? 6
          : heightDifferenceRatio < 12
            ? 3
            : 1;

  // Combined size symmetry score (average of width/height)
  const sizeSymmetryScore = Math.round((widthAsymmetryScore + heightAsymmetryScore) / 2);

  // ============================================
  // C. EYE POSITION SYMMETRY
  // ============================================

  // VERTICAL ALIGNMENT (Y-axis)
  const leftEyeCenterY = (leftEyeTop.y + leftEyeBottom.y) / 2;
  const rightEyeCenterY = (rightEyeTop.y + rightEyeBottom.y) / 2;
  const verticalMisalignment = Math.abs(leftEyeCenterY - rightEyeCenterY);
  const verticalMisalignmentRatio = toPercentageOfWidth(verticalMisalignment, faceWidth);

  // HORIZONTAL ALIGNMENT (X-axis distance from face center)
  const leftEyeCenterX = (leftEyeOuter.x + leftEyeInner.x) / 2;
  const rightEyeCenterX = (rightEyeOuter.x + rightEyeInner.x) / 2;
  const leftDistanceFromCenter = Math.abs(leftEyeCenterX - faceCenterX);
  const rightDistanceFromCenter = Math.abs(rightEyeCenterX - faceCenterX);
  const horizontalAsymmetry = Math.abs(leftDistanceFromCenter - rightDistanceFromCenter);

  // STRICT SCORING: Eyes must be aligned both vertically AND horizontally
  // Vertical misalignment is more critical (more noticeable)
  const verticalScore =
    verticalMisalignmentRatio < 0.8
      ? 10 // Perfect alignment (10)
      : verticalMisalignmentRatio < 1.5
        ? 8 // Mild (7-8)
        : verticalMisalignmentRatio < 2.5
          ? 6 // Noticeable (4-6)
          : verticalMisalignmentRatio < 4
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  const horizontalScore =
    horizontalAsymmetry < 3
      ? 10 // Equal distance from center (10)
      : horizontalAsymmetry < 6
        ? 8 // Mild (7-8)
        : horizontalAsymmetry < 12
          ? 6 // Noticeable (4-6)
          : 3; // Prominent (0-3)

  // Position symmetry score (vertical weighted higher 70%, horizontal 30%)
  const positionSymmetryScore = Math.round(verticalScore * 0.7 + horizontalScore * 0.3);

  // ============================================
  // D. INTER-EYE DISTANCE
  // ============================================

  const interEyeDistance = Math.abs(rightEyeInner.x - leftEyeInner.x);
  const interEyeDistanceRatio = toPercentageOfWidth(interEyeDistance, faceWidth);

  // IDEAL RANGE: 30-35% of face width
  // Clinical reference: Inner canthi should be ~one eye-width apart
  const interEyeScore =
    interEyeDistanceRatio < 25
      ? 5 // Very close-set
      : interEyeDistanceRatio < 28
        ? 7 // Close-set but acceptable
        : interEyeDistanceRatio < 32
          ? 10 // Ideal range (28-32%)
          : interEyeDistanceRatio < 35
            ? 9 // Good range
            : interEyeDistanceRatio < 38
              ? 7 // Wide-set
              : interEyeDistanceRatio < 42
                ? 5
                : 3; // Very wide-set

  const interEyeAssessment =
    interEyeDistanceRatio < 28 ? 'CLOSE_SET' : interEyeDistanceRatio < 35 ? 'IDEAL' : 'WIDE_SET';

  // ============================================
  // E. EYE SHAPE & CANTHAL TILT
  // ============================================

  // LEFT EYE SHAPE
  const leftEyeRatio = leftEyeHeight / leftEyeWidth; // Roundness (0.3-0.5 typical)

  // Left canthal tilt (outer corner relative to inner corner)
  const leftDx = leftEyeOuter.x - leftEyeInner.x;
  const leftDy = leftEyeOuter.y - leftEyeInner.y; // Positive = outer corner lower
  const leftCanthalTilt = Math.atan2(leftDy, leftDx) * (180 / Math.PI);

  const leftCanthalTiltDirection =
    leftCanthalTilt < -3
      ? 'UPTURNED' // Outer corner higher (positive tilt)
      : leftCanthalTilt > 3
        ? 'DOWNTURNED' // Outer corner lower (negative tilt)
        : 'NEUTRAL'; // Horizontal

  // RIGHT EYE SHAPE
  const rightEyeRatio = rightEyeHeight / rightEyeWidth;

  // Right canthal tilt
  // For right eye: outer.x < inner.x (outer is on the left side of screen)
  // So we use inner-to-outer direction to get consistent angle
  const rightDx = rightEyeInner.x - rightEyeOuter.x;  // inner - outer (positive dx)
  const rightDy = rightEyeInner.y - rightEyeOuter.y;  // inner - outer
  // Negate dy because we reversed direction
  const rightCanthalTilt = Math.atan2(-rightDy, rightDx) * (180 / Math.PI);

  const rightCanthalTiltDirection =
    rightCanthalTilt < -3 ? 'UPTURNED' : rightCanthalTilt > 3 ? 'DOWNTURNED' : 'NEUTRAL';

  // SHAPE ASYMMETRY
  const ratioAsymmetry = Math.abs(leftEyeRatio - rightEyeRatio);
  const tiltAsymmetry = Math.abs(leftCanthalTilt - rightCanthalTilt);

  // STRICT SCORING: Both shape AND tilt must match
  const ratioAsymmetryScore =
    ratioAsymmetry < 0.03
      ? 10 // Nearly identical roundness
      : ratioAsymmetry < 0.06
        ? 8 // Mild difference
        : ratioAsymmetry < 0.10
          ? 6 // Noticeable
          : 3; // Prominent

  const tiltAsymmetryScore =
    tiltAsymmetry < 2
      ? 10 // Equal tilt (10)
      : tiltAsymmetry < 4
        ? 8 // Mild (7-8)
        : tiltAsymmetry < 7
          ? 6 // Noticeable (4-6)
          : 3; // Prominent (0-3)

  // Combined shape symmetry score (ratio 40%, tilt 60%)
  const shapeSymmetryScore = Math.round(ratioAsymmetryScore * 0.4 + tiltAsymmetryScore * 0.6);

  // ============================================
  // F. EYEBROW-TO-EYE DISTANCE
  // ============================================

  const leftBrowEyeDistance = Math.abs(leftBrowBottom.y - leftEyeTop.y);
  const rightBrowEyeDistance = Math.abs(rightBrowBottom.y - rightEyeTop.y);
  const browEyeAsymmetry = Math.abs(leftBrowEyeDistance - rightBrowEyeDistance);
  const browEyeAsymmetryRatio =
    (browEyeAsymmetry / Math.max(leftBrowEyeDistance, rightBrowEyeDistance)) * 100;

  // STRICT SCORING: Asymmetric eyebrow position is very noticeable
  const browEyeScore =
    browEyeAsymmetryRatio < 5
      ? 10 // Equal spacing (10)
      : browEyeAsymmetryRatio < 10
        ? 8 // Mild (7-8)
        : browEyeAsymmetryRatio < 18
          ? 6 // Noticeable (4-6)
          : browEyeAsymmetryRatio < 30
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  // ============================================
  // G. EYELID ANALYSIS
  // ============================================

  // UPPER EYELID EXPOSURE (distance from upper lid to pupil line)
  const leftUpperLidExposure = Math.abs(leftUpperLid.y - leftEyeCenterY);
  const rightUpperLidExposure = Math.abs(rightUpperLid.y - rightEyeCenterY);
  const upperLidAsymmetry = Math.abs(leftUpperLidExposure - rightUpperLidExposure);
  const upperLidAsymmetryRatio =
    (upperLidAsymmetry / Math.max(leftUpperLidExposure, rightUpperLidExposure)) * 100;

  // LOWER EYELID EXPOSURE
  const leftLowerLidExposure = Math.abs(leftLowerLid.y - leftEyeCenterY);
  const rightLowerLidExposure = Math.abs(rightLowerLid.y - rightEyeCenterY);
  const lowerLidAsymmetry = Math.abs(leftLowerLidExposure - rightLowerLidExposure);
  const lowerLidAsymmetryRatio =
    (lowerLidAsymmetry / Math.max(leftLowerLidExposure, rightLowerLidExposure)) * 100;

  // STRICT SCORING: Eyelid asymmetry is subtle but important
  const upperLidScore =
    upperLidAsymmetryRatio < 8
      ? 10 // Symmetric (10)
      : upperLidAsymmetryRatio < 15
        ? 8 // Mild (7-8)
        : upperLidAsymmetryRatio < 25
          ? 6 // Noticeable (4-6)
          : 3; // Prominent (0-3)

  const lowerLidScore =
    lowerLidAsymmetryRatio < 8
      ? 10
      : lowerLidAsymmetryRatio < 15
        ? 8
        : lowerLidAsymmetryRatio < 25
          ? 6
          : 3;

  // Combined eyelid score (upper 60%, lower 40%)
  const eyelidScore = Math.round(upperLidScore * 0.6 + lowerLidScore * 0.4);

  // ============================================
  // H. 3D DEPTH ANALYSIS
  // ============================================

  const leftEyeDepth = (leftEyeTop.z + leftEyeBottom.z + leftEyeOuter.z + leftEyeInner.z) / 4;
  const rightEyeDepth = (rightEyeTop.z + rightEyeBottom.z + rightEyeOuter.z + rightEyeInner.z) / 4;
  const depthDifference = Math.abs(leftEyeDepth - rightEyeDepth);

  // STRICT SCORING: Z-axis is photo-quality dependent, minimal weight
  const depthScore =
    depthDifference < 0.008
      ? 10 // Planar symmetry (10)
      : depthDifference < 0.015
        ? 8 // Mild depth diff (7-8)
        : 6; // Noticeable perspective shift (4-6)

  // ============================================
  // I. OVERALL SCORE (WEIGHTED)
  // ============================================

  // WEIGHTED SCORING: Size and position are most critical
  const overallScore = Math.round(
    sizeSymmetryScore * 0.28 + // Size symmetry (28% - most critical)
    positionSymmetryScore * 0.24 + // Position alignment (24%)
    interEyeScore * 0.18 + // Inter-eye distance (18%)
    shapeSymmetryScore * 0.14 + // Eye shape (14%)
    browEyeScore * 0.08 + // Eyebrow spacing (8%)
    eyelidScore * 0.06 + // Eyelid symmetry (6%)
    depthScore * 0.02 // Depth (2% - least reliable)
  );

  // REALISTIC ASYMMETRY LEVELS
  const asymmetryLevel =
    overallScore >= 9
      ? 'NONE' // 9-10: Symmetric
      : overallScore >= 7
        ? 'MILD' // 7-8: Mild, tolerable
        : overallScore >= 4
          ? 'MODERATE' // 4-6: Noticeable
          : 'SEVERE'; // 0-3: Severe asymmetry

  // ============================================
  // LOG ALL CALCULATED VALUES
  // ============================================

  console.log('📊 EYES CALCULATION RESULTS:');
  console.log('  ┌─────────────────────────────────────────────────────');
  console.log('  │ SIZE SYMMETRY (35% weight):');
  console.log('  │   Left eye:', leftEyeWidth.toFixed(2), 'x', leftEyeHeight.toFixed(2), 'px (area:', leftEyeArea.toFixed(2), 'px²)');
  console.log('  │   Right eye:', rightEyeWidth.toFixed(2), 'x', rightEyeHeight.toFixed(2), 'px (area:', rightEyeArea.toFixed(2), 'px²)');
  console.log('  │   Width diff:', widthDifference.toFixed(2), 'px (', widthDifferenceRatio.toFixed(2), '%)');
  console.log('  │   Height diff:', heightDifference.toFixed(2), 'px (', heightDifferenceRatio.toFixed(2), '%)');
  console.log('  │   Score:', sizeSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ POSITION SYMMETRY (25% weight):');
  console.log('  │   Vertical misalignment:', verticalMisalignment.toFixed(2), 'px (', verticalMisalignmentRatio.toFixed(2), '%)');
  console.log('  │   Horizontal asymmetry:', horizontalAsymmetry.toFixed(2), 'px');
  console.log('  │   Score:', positionSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ INTER-EYE DISTANCE (15% weight):');
  console.log('  │   Distance:', interEyeDistance.toFixed(2), 'px (', interEyeDistanceRatio.toFixed(2), '%)');
  console.log('  │   Assessment:', interEyeAssessment);
  console.log('  │   Score:', interEyeScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ SHAPE SYMMETRY (15% weight):');
  console.log('  │   Left canthal tilt:', leftCanthalTilt.toFixed(2), '° (', leftCanthalTiltDirection, ')');
  console.log('  │   Right canthal tilt:', rightCanthalTilt.toFixed(2), '° (', rightCanthalTiltDirection, ')');
  console.log('  │   Score:', shapeSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ EYELID (5% weight):');
  console.log('  │   Upper lid asymmetry:', upperLidAsymmetry.toFixed(2), 'px');
  console.log('  │   Lower lid asymmetry:', lowerLidAsymmetry.toFixed(2), 'px');
  console.log('  │   Score:', eyelidScore, '/10');
  console.log('  └─────────────────────────────────────────────────────');
  console.log('🏆 OVERALL SCORE:', overallScore, '/10');
  console.log('📋 ASYMMETRY LEVEL:', asymmetryLevel);
  console.log('👁️ ==========================================');
  console.log('👁️ EYES CALCULATIONS END');
  console.log('👁️ ==========================================');

  // ============================================
  // RETURN ALL CALCULATIONS
  // ============================================

  return {
    // Eye size symmetry
    leftEyeWidth,
    leftEyeHeight,
    leftEyeArea,
    rightEyeWidth,
    rightEyeHeight,
    rightEyeArea,
    widthDifference,
    widthDifferenceRatio,
    heightDifference,
    heightDifferenceRatio,
    areaDifference,
    areaDifferenceRatio,
    sizeSymmetryScore,

    // Eye position symmetry
    leftEyeCenterY,
    rightEyeCenterY,
    verticalMisalignment,
    verticalMisalignmentRatio,
    leftEyeCenterX,
    rightEyeCenterX,
    leftDistanceFromCenter,
    rightDistanceFromCenter,
    horizontalAsymmetry,
    positionSymmetryScore,

    // Inter-eye distance
    interEyeDistance,
    interEyeDistanceRatio,
    interEyeScore,
    interEyeAssessment,

    // Eye shape & canthal tilt
    leftEyeRatio,
    leftCanthalTilt,
    leftCanthalTiltDirection,
    rightEyeRatio,
    rightCanthalTilt,
    rightCanthalTiltDirection,
    ratioAsymmetry,
    tiltAsymmetry,
    shapeSymmetryScore,

    // Eyebrow-to-eye distance
    leftBrowEyeDistance,
    rightBrowEyeDistance,
    browEyeAsymmetry,
    browEyeAsymmetryRatio,
    browEyeScore,

    // Eyelid analysis
    leftUpperLidExposure,
    rightUpperLidExposure,
    upperLidAsymmetry,
    upperLidAsymmetryRatio,
    leftLowerLidExposure,
    rightLowerLidExposure,
    lowerLidAsymmetry,
    lowerLidAsymmetryRatio,
    eyelidScore,

    // 3D depth
    leftEyeDepth,
    rightEyeDepth,
    depthDifference,
    depthScore,

    // Overall scores
    overallScore,
    asymmetryLevel,

    // Metadata
    faceWidth,
    faceCenterX,
    landmarkIndices: {
      leftEyeOuter: 33,
      leftEyeInner: 133,
      leftEyeTop: 159,
      leftEyeBottom: 145,
      rightEyeOuter: 263,
      rightEyeInner: 362,
      rightEyeTop: 386,
      rightEyeBottom: 374,
      leftBrowTop: 107,
      leftBrowBottom: 66,
      rightBrowTop: 336,
      rightBrowBottom: 296,
      leftUpperLid: 246,
      leftLowerLid: 7,
      rightUpperLid: 466,
      rightLowerLid: 249,
      leftEyeOuterRef: 263,
      rightEyeOuterRef: 33,
    },
  };
}
