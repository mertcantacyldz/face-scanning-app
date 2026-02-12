/**
 * Lips Calculation Module
 *
 * Performs ALL mathematical calculations for lips analysis using TypeScript.
 * AI will only INTERPRET these pre-calculated values, NOT calculate them.
 *
 * STRICT SCORING: Based on clinical visibility thresholds
 * - %3-5 is the "breaking point" for visible lip asymmetry
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

export interface LipCalculations {
  // === LIP CORNER ALIGNMENT (MOST CRITICAL) ===
  leftCornerX: number; // X coordinate
  leftCornerY: number; // Y coordinate
  rightCornerX: number; // X coordinate
  rightCornerY: number; // Y coordinate
  cornerYDifference: number; // pixels (vertical misalignment)
  cornerYDifferenceRatio: number; // percentage of lip width
  lipLineTilt: number; // degrees (positive = right side higher)
  lipLineTiltDirection: 'TILTED_LEFT' | 'TILTED_RIGHT' | 'LEVEL';
  cornerAlignmentScore: number; // 0-10 (strict)

  // === LIP WIDTH SYMMETRY ===
  lipWidth: number; // total width (corner to corner)
  lipWidthRatio: number; // percentage of face width
  leftHalfWidth: number; // left corner to center
  rightHalfWidth: number; // right corner to center
  widthAsymmetry: number; // pixels
  widthAsymmetryRatio: number; // percentage
  lipWidthSymmetryScore: number; // 0-10
  lipCenterDeviation: number; // pixels (deviation from face center)
  lipCenterDeviationRatio: number; // percentage
  lipCenterScore: number; // 0-10 (centering score)

  // === UPPER LIP SYMMETRY ===
  leftUpperLipHeight: number; // pixels
  rightUpperLipHeight: number; // pixels
  upperLipHeightDifference: number; // pixels
  upperLipHeightDifferenceRatio: number; // percentage
  upperLipSymmetryScore: number; // 0-10

  // === LOWER LIP SYMMETRY ===
  leftLowerLipHeight: number; // pixels
  rightLowerLipHeight: number; // pixels
  lowerLipHeightDifference: number; // pixels
  lowerLipHeightDifferenceRatio: number; // percentage
  lowerLipSymmetryScore: number; // 0-10

  // === CUPID'S BOW SYMMETRY ===
  leftCupidBowHeight: number; // pixels (left peak)
  rightCupidBowHeight: number; // pixels (right peak)
  cupidBowDifference: number; // pixels
  cupidBowDifferenceRatio: number; // percentage
  cupidBowSymmetryScore: number; // 0-10
  cupidBowPresence: number; // average height (aesthetic indicator)

  // === UPPER/LOWER LIP RATIO ===
  upperLipHeight: number; // center measurement
  lowerLipHeight: number; // center measurement
  totalLipHeight: number; // upper + lower
  upperLowerRatio: number; // upper / lower (ideal: ~0.7-1.0)
  upperLowerRatioScore: number; // 0-10
  ratioAssessment: 'UPPER_FULLER' | 'BALANCED' | 'LOWER_FULLER';

  // === VERMILLION BORDER (LIP LINE) ===
  leftLineY: number; // left vermillion center Y
  rightLineY: number; // right vermillion center Y
  lineYDifference: number; // pixels
  lineYDifferenceRatio: number; // percentage
  lineSymmetryScore: number; // 0-10

  // === 3D DEPTH ===
  leftSideDepth: number; // z-axis average (left side)
  rightSideDepth: number; // z-axis average (right side)
  depthDifference: number; // z-axis units
  depthScore: number; // 0-10 (low weight)

  // === OVERALL SCORES ===
  overallScore: number; // 0-10 (weighted, strict)
  asymmetryLevel: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

  // === METADATA ===
  faceWidth: number;
  faceCenterX: number;
  landmarkIndices: {
    leftCorner: 61;
    rightCorner: 291;
    upperLipCenter: 0;
    lowerLipCenter: 17;
    leftUpperLipCenter: 37;
    rightUpperLipCenter: 267;
    leftLowerLipCenter: 84;
    rightLowerLipCenter: 314;
    leftUpperOuter: 185;
    rightUpperOuter: 409;
    leftLowerOuter: 146;
    rightLowerOuter: 375;
  };
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate all lip metrics from MediaPipe Face Mesh landmarks
 *
 * IMPORTANT: This function assumes landmarks are correct (no validation)
 * All scoring uses STRICT clinical thresholds (no inflation)
 *
 * @param landmarks Array of 468 MediaPipe Face Mesh landmarks
 * @returns Complete lips analysis with all metrics and scores
 */
export function calculateLipMetrics(landmarks: Point3D[]): LipCalculations {
  console.log('👄 ==========================================');
  console.log('👄 LIPS CALCULATIONS START');
  console.log('👄 ==========================================');
  console.log('👄 Total landmarks received:', landmarks.length);

  // ============================================
  // A. EXTRACT LANDMARKS (NO VALIDATION)
  // ============================================

  // Lip corners
  const leftCorner = landmarks[61]; // P_61
  const rightCorner = landmarks[291]; // P_291

  // Upper lip landmarks
  const upperLipCenter = landmarks[0]; // P_0 (philtrum)
  const leftUpperLipCenter = landmarks[37]; // P_37
  const rightUpperLipCenter = landmarks[267]; // P_267
  const leftUpperOuter = landmarks[185]; // P_185 (outer contour)
  const rightUpperOuter = landmarks[409]; // P_409

  // Lower lip landmarks
  const lowerLipCenter = landmarks[17]; // P_17
  const leftLowerLipCenter = landmarks[84]; // P_84
  const rightLowerLipCenter = landmarks[314]; // P_314
  const leftLowerOuter = landmarks[146]; // P_146 (outer contour)
  const rightLowerOuter = landmarks[375]; // P_375

  // Face reference points
  const rightEyeOuter = landmarks[33]; // P_33
  const leftEyeOuter = landmarks[263]; // P_263

  console.log('🔍 RAW LANDMARK DATA (LIPS):');
  console.log('  P_61 (leftCorner):', JSON.stringify({ x: leftCorner.x, y: leftCorner.y }));
  console.log('  P_291 (rightCorner):', JSON.stringify({ x: rightCorner.x, y: rightCorner.y }));
  console.log('  P_33 (rightEyeOuter):', JSON.stringify({ x: rightEyeOuter.x, y: rightEyeOuter.y }));
  console.log('  P_263 (leftEyeOuter):', JSON.stringify({ x: leftEyeOuter.x, y: leftEyeOuter.y }));

  console.log('👄 LIP LANDMARKS:');
  console.log('  P_61 (leftCorner):', leftCorner ? `x=${leftCorner.x.toFixed(2)}, y=${leftCorner.y.toFixed(2)}` : 'MISSING');
  console.log('  P_291 (rightCorner):', rightCorner ? `x=${rightCorner.x.toFixed(2)}, y=${rightCorner.y.toFixed(2)}` : 'MISSING');
  console.log('  P_0 (upperLipCenter):', upperLipCenter ? `x=${upperLipCenter.x.toFixed(2)}, y=${upperLipCenter.y.toFixed(2)}` : 'MISSING');
  console.log('  P_17 (lowerLipCenter):', lowerLipCenter ? `x=${lowerLipCenter.x.toFixed(2)}, y=${lowerLipCenter.y.toFixed(2)}` : 'MISSING');

  // Calculate face dimensions
  const faceWidth = leftEyeOuter.x - rightEyeOuter.x;
  const faceCenterX = getCenterX(rightEyeOuter, leftEyeOuter);

  console.log('📐 FACE DIMENSIONS:');
  console.log('  Face width:', faceWidth.toFixed(2), 'px');
  console.log('  Face center X:', faceCenterX.toFixed(2), 'px');
  console.log('  DEBUG - Reference Points X: P_33(RightEyeOuter)=', rightEyeOuter.x.toFixed(2), 'P_263(LeftEyeOuter)=', leftEyeOuter.x.toFixed(2));

  // ============================================
  // B. LIP CORNER ALIGNMENT (MOST CRITICAL)
  // ============================================

  const leftCornerY = leftCorner.y;
  const rightCornerY = rightCorner.y;
  const cornerYDifference = Math.abs(leftCornerY - rightCornerY);

  const lipWidth = Math.abs(rightCorner.x - leftCorner.x);
  const cornerYDifferenceRatio = (cornerYDifference / lipWidth) * 100;

  // Calculate tilt angle for metadata (keeping atan2 for degree value)
  const dx = rightCorner.x - leftCorner.x;
  const dy = rightCorner.y - leftCorner.y;
  const lipLineTilt = Math.atan2(dy, dx) * (180 / Math.PI);

  // Kişinin kendi perspektifindne Yönlendirme:
  // leftCorner = Anatomik SOL (Ekranın Sağı)
  // rightCorner = Anatomik SAĞ (Ekranın Solu)
  // Y değeri aşağı indikçe artar.
  // Hangi Y daha büyükse o köşe daha AŞAĞIDADIR.
  const lipLineTiltDirection =
    Math.abs(leftCornerY - rightCornerY) < 1.5
      ? 'LEVEL'
      : leftCornerY > rightCornerY
        ? 'TILTED_LEFT'  // Sol köşe (Y daha büyük) aşağıda
        : 'TILTED_RIGHT'; // Sağ köşe (Y daha büyük) aşağıda

  // STRICT SCORING: Corner misalignment is extremely noticeable
  // Even 1-2 pixels can create visible asymmetry
  const cornerAlignmentScore =
    cornerYDifference < 1.5
      ? 10 // Perfect alignment (10)
      : cornerYDifference < 3
        ? 8 // Minimal (7-8)
        : cornerYDifference < 5
          ? 6 // Noticeable (4-6)
          : cornerYDifference < 8
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  // ============================================
  // C. LIP WIDTH SYMMETRY
  // ============================================

  const lipWidthRatio = toPercentageOfWidth(lipWidth, faceWidth);

  const leftHalfWidth = Math.abs(leftCorner.x - faceCenterX);
  const rightHalfWidth = Math.abs(rightCorner.x - faceCenterX);
  const widthAsymmetry = Math.abs(leftHalfWidth - rightHalfWidth);
  const widthAsymmetryRatio = (widthAsymmetry / lipWidth) * 100;

  // Lip center deviation (how far lip center is from face center)
  const lipCenterX = (leftCorner.x + rightCorner.x) / 2;
  const lipCenterDeviation = Math.abs(lipCenterX - faceCenterX);
  const lipCenterDeviationRatio = (lipCenterDeviation / faceWidth) * 100;

  console.log('🔍 DEBUG LIPS CALCULATION:');
  console.log('  lipCenterX:', lipCenterX.toFixed(2));
  console.log('  faceCenterX:', faceCenterX.toFixed(2));
  console.log('  lipCenterDeviation (lipCenterX - faceCenterX):', (lipCenterX - faceCenterX).toFixed(2));
  console.log('  lipCenterDeviationRatio:', lipCenterDeviationRatio.toFixed(2));

  // STRICT SCORING: Center deviation
  const lipCenterScore =
    lipCenterDeviationRatio < 1
      ? 10 // Centered (10)
      : lipCenterDeviationRatio < 2
        ? 8 // Minimal deviation (7-8)
        : lipCenterDeviationRatio < 3
          ? 6 // Noticeable (4-6)
          : lipCenterDeviationRatio < 5
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  // STRICT SCORING: Width asymmetry threshold ~3-5%
  const lipWidthSymmetryScore =
    widthAsymmetryRatio < 2
      ? 10 // Symmetric (10)
      : widthAsymmetryRatio < 4
        ? 8 // Mild (7-8)
        : widthAsymmetryRatio < 7
          ? 6 // Noticeable (4-6)
          : widthAsymmetryRatio < 12
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  // ============================================
  // D. UPPER LIP SYMMETRY
  // ============================================

  // Measure height from vermillion border to outer contour
  const leftUpperLipHeight = Math.abs(leftUpperLipCenter.y - leftUpperOuter.y);
  const rightUpperLipHeight = Math.abs(rightUpperLipCenter.y - rightUpperOuter.y);
  const upperLipHeightDifference = Math.abs(leftUpperLipHeight - rightUpperLipHeight);
  const upperLipHeightDifferenceRatio =
    (upperLipHeightDifference / Math.max(leftUpperLipHeight, rightUpperLipHeight)) * 100;

  // STRICT SCORING
  const upperLipSymmetryScore =
    upperLipHeightDifferenceRatio < 5
      ? 10 // Symmetric (10)
      : upperLipHeightDifferenceRatio < 10
        ? 8 // Mild (7-8)
        : upperLipHeightDifferenceRatio < 18
          ? 6 // Noticeable (4-6)
          : upperLipHeightDifferenceRatio < 30
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  // ============================================
  // E. LOWER LIP SYMMETRY
  // ============================================

  const leftLowerLipHeight = Math.abs(leftLowerOuter.y - leftLowerLipCenter.y);
  const rightLowerLipHeight = Math.abs(rightLowerOuter.y - rightLowerLipCenter.y);
  const lowerLipHeightDifference = Math.abs(leftLowerLipHeight - rightLowerLipHeight);
  const lowerLipHeightDifferenceRatio =
    (lowerLipHeightDifference / Math.max(leftLowerLipHeight, rightLowerLipHeight)) * 100;

  // STRICT SCORING
  const lowerLipSymmetryScore =
    lowerLipHeightDifferenceRatio < 5
      ? 10 // Symmetric (10)
      : lowerLipHeightDifferenceRatio < 10
        ? 8 // Mild (7-8)
        : lowerLipHeightDifferenceRatio < 18
          ? 6 // Noticeable (4-6)
          : lowerLipHeightDifferenceRatio < 30
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  // ============================================
  // F. CUPID'S BOW SYMMETRY
  // ============================================

  // Cupid's bow peaks: distance from philtrum center to vermillion border peaks
  const leftCupidBowHeight = Math.abs(leftUpperLipCenter.y - upperLipCenter.y);
  const rightCupidBowHeight = Math.abs(rightUpperLipCenter.y - upperLipCenter.y);
  const cupidBowDifference = Math.abs(leftCupidBowHeight - rightCupidBowHeight);
  const cupidBowDifferenceRatio =
    (cupidBowDifference / Math.max(leftCupidBowHeight, rightCupidBowHeight)) * 100;

  const cupidBowPresence = (leftCupidBowHeight + rightCupidBowHeight) / 2;

  // STRICT SCORING: Cupid's bow is an aesthetic detail
  const cupidBowSymmetryScore =
    cupidBowDifferenceRatio < 8
      ? 10 // Symmetric (10)
      : cupidBowDifferenceRatio < 15
        ? 8 // Mild (7-8)
        : cupidBowDifferenceRatio < 25
          ? 6 // Noticeable (4-6)
          : cupidBowDifferenceRatio < 40
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  // ============================================
  // G. UPPER/LOWER LIP RATIO
  // ============================================

  // Measure lip THICKNESS for ratio
  // LANDMARKS: P_0 → P_13 (upper) and P_14 → P_17 (lower)
  const upperLipTop = landmarks[0]; // P_0 - Philtrum junction
  const upperLipBottom = landmarks[13]; // P_13 - Upper lip vermillion border
  const lowerLipTop = landmarks[14]; // P_14 - Lower lip vermillion border
  const lowerLipBottom = landmarks[17]; // P_17 - Lower lip to chin junction

  console.log('🔍 LIP RATIO DEBUG:');
  console.log('  P_0 (philtrum):', upperLipTop.y.toFixed(2));
  console.log('  P_13 (upper vermillion):', upperLipBottom.y.toFixed(2));
  console.log('  P_14 (lower vermillion):', lowerLipTop.y.toFixed(2));
  console.log('  P_17 (chin):', lowerLipBottom.y.toFixed(2));
  console.log('  Gap between P_13 and P_14:', Math.abs(lowerLipTop.y - upperLipBottom.y).toFixed(2), 'px');

  // Upper lip THICKNESS: P_0 to P_13
  const upperLipHeight = Math.abs(upperLipBottom.y - upperLipTop.y);

  // Lower lip THICKNESS: P_14 to P_17
  const lowerLipHeight = Math.abs(lowerLipBottom.y - lowerLipTop.y);

  console.log('  → upperLipHeight (P_0 to P_13):', upperLipHeight.toFixed(2), 'px');
  console.log('  → lowerLipHeight (P_14 to P_17):', lowerLipHeight.toFixed(2), 'px');
  console.log('  → Ratio (upper/lower):', (upperLipHeight / lowerLipHeight).toFixed(3));

  const totalLipHeight = upperLipHeight + lowerLipHeight;

  // Calculate ratio (upper / lower)
  const upperLowerRatio = lowerLipHeight > 0 ? upperLipHeight / lowerLipHeight : 1;

  // ADJUSTED RANGE for MediaPipe landmarks (includes philtrum + chin skin)
  // MediaPipe measures "full anatomical lip" not just "visible vermillion"
  // IDEAL RANGE: 0.45-0.60 (based on real data from P_0 to P_13 / P_14 to P_17)
  // TOLERABLE: 0.35-0.70
  // PATHOLOGICAL: <0.30 or >0.80
  const upperLowerRatioScore =
    upperLowerRatio >= 0.45 && upperLowerRatio <= 0.60
      ? 10 // Ideal (10) - Balanced anatomical lip
      : (upperLowerRatio >= 0.40 && upperLowerRatio < 0.45) ||
        (upperLowerRatio > 0.60 && upperLowerRatio <= 0.65)
        ? 8 // Acceptable (7-8)
        : (upperLowerRatio >= 0.35 && upperLowerRatio < 0.40) ||
          (upperLowerRatio > 0.65 && upperLowerRatio <= 0.75)
          ? 6 // Noticeable (4-6)
          : upperLowerRatio < 0.30 || upperLowerRatio > 0.80
            ? 3 // Pathological (0-3) - Extreme imbalance
            : 5;

  const ratioAssessment =
    upperLowerRatio < 0.45
      ? 'LOWER_FULLER' // Lower lip significantly thicker
      : upperLowerRatio > 0.65
        ? 'UPPER_FULLER' // Upper lip thicker (rare)
        : 'BALANCED'; // Ideal balance (0.45-0.65)

  // ============================================
  // H. VERMILLION BORDER (LIP LINE)
  // ============================================

  // Center point between upper and lower lip on each side
  const leftLineY = (leftUpperLipCenter.y + leftLowerLipCenter.y) / 2;
  const rightLineY = (rightUpperLipCenter.y + rightLowerLipCenter.y) / 2;
  const lineYDifference = Math.abs(leftLineY - rightLineY);
  const lineYDifferenceRatio = (lineYDifference / lipWidth) * 100;

  // STRICT SCORING
  const lineSymmetryScore =
    lineYDifference < 2
      ? 10 // Symmetric (10)
      : lineYDifference < 4
        ? 8 // Mild (7-8)
        : lineYDifference < 7
          ? 6 // Noticeable (4-6)
          : lineYDifference < 12
            ? 3 // Moderate-Severe (2-3)
            : 1; // Severe (0-1)

  // ============================================
  // I. 3D DEPTH ANALYSIS
  // ============================================

  // Calculate average Z depth for each side
  const leftSideDepth =
    (leftCorner.z + leftUpperLipCenter.z + leftLowerLipCenter.z + leftUpperOuter.z + leftLowerOuter.z) /
    5;
  const rightSideDepth =
    (rightCorner.z +
      rightUpperLipCenter.z +
      rightLowerLipCenter.z +
      rightUpperOuter.z +
      rightLowerOuter.z) /
    5;
  const depthDifference = Math.abs(leftSideDepth - rightSideDepth);

  // STRICT SCORING: Z-axis is photo-quality dependent, minimal weight
  const depthScore =
    depthDifference < 0.008
      ? 10 // Planar symmetry (10)
      : depthDifference < 0.015
        ? 8 // Mild depth diff (7-8)
        : 6; // Noticeable perspective shift (4-6)

  // ============================================
  // J. OVERALL SCORE (WEIGHTED)
  // ============================================

  // WEIGHTED SCORING: Corner alignment most critical
  const overallScore = Math.round(
    cornerAlignmentScore * 0.25 + // Corner alignment (25% - most visible)
    lipCenterScore * 0.20 + // Center deviation (20% - very visible)
    lipWidthSymmetryScore * 0.20 + // Width symmetry (20%)
    upperLipSymmetryScore * 0.15 + // Upper lip (15%)
    lowerLipSymmetryScore * 0.12 + // Lower lip (12%)
    cupidBowSymmetryScore * 0.05 + // Cupid's bow (5% - aesthetic)
    upperLowerRatioScore * 0.03 // Upper/lower ratio (3%)
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

  console.log('📊 LIPS CALCULATION RESULTS:');
  console.log('  ┌─────────────────────────────────────────────────────');
  console.log('  │ CORNER ALIGNMENT (35% weight):');
  console.log('  │   Y difference:', cornerYDifference.toFixed(2), 'px (', cornerYDifferenceRatio.toFixed(2), '%)');
  console.log('  │   Lip line tilt:', lipLineTilt.toFixed(2), '° (', lipLineTiltDirection, ')');
  console.log('  │   Score:', cornerAlignmentScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ WIDTH & CENTERING (25% weight):');
  console.log('  │   Lip width:', lipWidth.toFixed(2), 'px (', lipWidthRatio.toFixed(2), '% of face)');
  console.log('  │   Center deviation:', lipCenterDeviation.toFixed(2), 'px (', lipCenterDeviationRatio.toFixed(2), '%)');
  console.log('  │   Center score:', lipCenterScore, '/10');
  console.log('  │   Width asymmetry:', widthAsymmetry.toFixed(2), 'px (', widthAsymmetryRatio.toFixed(2), '%)');
  console.log('  │   Score:', lipWidthSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ UPPER LIP (18% weight):');
  console.log('  │   Height:', upperLipHeight.toFixed(2), 'px');
  console.log('  │   Left-Right asymmetry:', upperLipHeightDifference.toFixed(2), 'px (', upperLipHeightDifferenceRatio.toFixed(2), '%)');
  console.log('  │   Score:', upperLipSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ LOWER LIP (15% weight):');
  console.log('  │   Height:', lowerLipHeight.toFixed(2), 'px');
  console.log('  │   Left-Right asymmetry:', lowerLipHeightDifference.toFixed(2), 'px (', lowerLipHeightDifferenceRatio.toFixed(2), '%)');
  console.log('  │   Score:', lowerLipSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ PROPORTIONS (5% weight):');
  console.log('  │   Upper/Lower ratio:', upperLowerRatio.toFixed(2), '(ideal: 0.7-1.0)');
  console.log('  │   Assessment:', ratioAssessment);
  console.log('  │   Score:', upperLowerRatioScore, '/10');
  console.log('  └─────────────────────────────────────────────────────');
  console.log('🏆 OVERALL SCORE:', overallScore, '/10');
  console.log('📋 ASYMMETRY LEVEL:', asymmetryLevel);
  console.log('👄 ==========================================');
  console.log('👄 LIPS CALCULATIONS END');
  console.log('👄 ==========================================');

  // ============================================
  // RETURN ALL CALCULATIONS
  // ============================================

  return {
    // Corner alignment
    leftCornerX: leftCorner.x,
    leftCornerY,
    rightCornerX: rightCorner.x,
    rightCornerY,
    cornerYDifference,
    cornerYDifferenceRatio,
    lipLineTilt,
    lipLineTiltDirection,
    cornerAlignmentScore,

    // Width symmetry
    lipWidth,
    lipWidthRatio,
    leftHalfWidth,
    rightHalfWidth,
    widthAsymmetry,
    widthAsymmetryRatio,
    lipWidthSymmetryScore,
    lipCenterDeviation,
    lipCenterDeviationRatio,
    lipCenterScore,

    // Upper lip symmetry
    leftUpperLipHeight,
    rightUpperLipHeight,
    upperLipHeightDifference,
    upperLipHeightDifferenceRatio,
    upperLipSymmetryScore,

    // Lower lip symmetry
    leftLowerLipHeight,
    rightLowerLipHeight,
    lowerLipHeightDifference,
    lowerLipHeightDifferenceRatio,
    lowerLipSymmetryScore,

    // Cupid's bow
    leftCupidBowHeight,
    rightCupidBowHeight,
    cupidBowDifference,
    cupidBowDifferenceRatio,
    cupidBowSymmetryScore,
    cupidBowPresence,

    // Upper/lower ratio
    upperLipHeight,
    lowerLipHeight,
    totalLipHeight,
    upperLowerRatio,
    upperLowerRatioScore,
    ratioAssessment,

    // Vermillion border
    leftLineY,
    rightLineY,
    lineYDifference,
    lineYDifferenceRatio,
    lineSymmetryScore,

    // 3D depth
    leftSideDepth,
    rightSideDepth,
    depthDifference,
    depthScore,

    // Overall scores
    overallScore,
    asymmetryLevel,

    // Metadata
    faceWidth,
    faceCenterX,
    landmarkIndices: {
      leftCorner: 61,
      rightCorner: 291,
      upperLipCenter: 0,
      lowerLipCenter: 17,
      leftUpperLipCenter: 37,
      rightUpperLipCenter: 267,
      leftLowerLipCenter: 84,
      rightLowerLipCenter: 314,
      leftUpperOuter: 185,
      rightUpperOuter: 409,
      leftLowerOuter: 146,
      rightLowerOuter: 375,
    },
  };
}
