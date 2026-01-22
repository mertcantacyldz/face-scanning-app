/* ============================================
   FACE SHAPE CALCULATIONS - TEMPORARILY DISABLED
   ============================================

   This module is temporarily disabled because:
   - MediaPipe Face Mesh does not detect hairline
   - Face length calculation is inaccurate (uses P_10 forehead center)
   - Face shape classification becomes unreliable

   Current State: All code commented out but preserved

   To re-enable:
   1. Uncomment all functions below
   2. Update face length calculation with hairline estimation
   3. Add "frontal view limitation" warning to results
   4. Re-enable in face-prompts.ts
   5. Re-enable in analysis.tsx

   Alternative approaches for future:
   - Estimate hairline position (foreheadTop.y - faceHeight * 0.15)
   - Use only width ratios (forehead/cheekbone/jaw)
   - Remove length-based classification entirely

   Last modified: 2026-01-21
   ============================================ */

/*
// Face Shape Calculation Module
// Calculates ALL face shape metrics from MediaPipe Face Mesh landmarks
// AI will ONLY interpret these pre-calculated values

import type { Point3D } from '../geometry';
import { distance2D } from '../geometry';

export interface FaceShapeCalculations {
  // === FACE DIMENSIONS (basic measurements) ===
  faceLength: number;                    // forehead to chin
  faceWidth: number;                     // eye-to-eye distance (widest)
  cheekboneWidth: number;                // distance at cheekbone level
  jawlineWidth: number;                  // distance at jaw angle level
  foreheadWidth: number;                 // distance at forehead level

  // === FACE SHAPE CLASSIFICATION (40% weight) ===
  lengthWidthRatio: number;              // length / width
  jawCheekRatio: number;                 // jawline / cheekbone
  foreheadJawRatio: number;              // forehead / jawline
  faceShape: 'OVAL' | 'ROUND' | 'SQUARE' | 'HEART' | 'DIAMOND' | 'OBLONG' | 'TRIANGLE';
  shapeConfidence: number;               // 0-10 (how confident in classification)
  alternativeShape?: string;             // Second best match if confidence < 8

  // === FACIAL THIRDS BALANCE (30% weight - vertical proportions) ===
  upperThird: number;                    // hairline to eyebrows
  middleThird: number;                   // eyebrows to nose base
  lowerThird: number;                    // nose base to chin
  upperThirdRatio: number;               // percentage of total
  middleThirdRatio: number;              // percentage of total
  lowerThirdRatio: number;               // percentage of total
  thirdsDeviation: number;               // deviation from ideal 33-33-33
  facialThirdsScore: number;             // 0-10

  // === HORIZONTAL SYMMETRY (20% weight) ===
  leftFaceWidth: number;                 // center to left edge
  rightFaceWidth: number;                // center to right edge
  horizontalAsymmetry: number;           // difference in pixels
  horizontalAsymmetryRatio: number;      // percentage
  horizontalSymmetryScore: number;       // 0-10

  // === PROPORTION SCORES (10% weight) ===
  goldenRatioDeviation: number;          // deviation from 1.618
  goldenRatioScore: number;              // 0-10
  proportionScore: number;               // 0-10 (overall proportionality)

  // === OVERALL ===
  overallScore: number;                  // 0-10 (weighted)
  proportionAssessment: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_ATTENTION';

  // === METADATA ===
  faceCenterX: number;
  faceCenterY: number;
  landmarkIndices: {
    forehead: 10;
    chin: 152;
    leftEyeOuter: 263;
    rightEyeOuter: 33;
    leftCheekbone: 234;
    rightCheekbone: 454;
    leftJaw: 172;
    rightJaw: 397;
    leftEyebrow: 107;
    rightEyebrow: 336;
    noseBase: 2;
  };
}

export function calculateFaceShapeMetrics(landmarks: Point3D[]): FaceShapeCalculations {
  console.log('🔷 ==========================================');
  console.log('🔷 FACE SHAPE CALCULATIONS START');
  console.log('🔷 ==========================================');
  console.log('🔷 Total landmarks received:', landmarks.length);

  // ========================================
  // REFERENCE POINTS
  // ========================================

  const forehead = landmarks[10];           // P_10: Forehead center
  const chin = landmarks[152];              // P_152: Chin tip
  const leftEyeOuter = landmarks[263];      // P_263: Left eye outer corner
  const rightEyeOuter = landmarks[33];      // P_33: Right eye outer corner
  const leftCheekbone = landmarks[234];     // P_234: Left cheekbone/jaw angle
  const rightCheekbone = landmarks[454];    // P_454: Right cheekbone/jaw angle
  const leftJaw = landmarks[172];           // P_172: Left jaw near ear
  const rightJaw = landmarks[397];          // P_397: Right jaw near ear
  const leftEyebrow = landmarks[107];       // P_107: Left eyebrow inner
  const rightEyebrow = landmarks[336];      // P_336: Right eyebrow inner
  const noseBase = landmarks[2];            // P_2: Nose base

  console.log('🔷 FACE SHAPE LANDMARKS:');
  console.log('  P_10 (forehead):', forehead ? `x=${forehead.x.toFixed(2)}, y=${forehead.y.toFixed(2)}` : 'MISSING');
  console.log('  P_152 (chin):', chin ? `x=${chin.x.toFixed(2)}, y=${chin.y.toFixed(2)}` : 'MISSING');
  console.log('  P_263 (leftEyeOuter):', leftEyeOuter ? `x=${leftEyeOuter.x.toFixed(2)}, y=${leftEyeOuter.y.toFixed(2)}` : 'MISSING');
  console.log('  P_33 (rightEyeOuter):', rightEyeOuter ? `x=${rightEyeOuter.x.toFixed(2)}, y=${rightEyeOuter.y.toFixed(2)}` : 'MISSING');
  console.log('  P_234 (leftCheekbone):', leftCheekbone ? `x=${leftCheekbone.x.toFixed(2)}, y=${leftCheekbone.y.toFixed(2)}` : 'MISSING');
  console.log('  P_454 (rightCheekbone):', rightCheekbone ? `x=${rightCheekbone.x.toFixed(2)}, y=${rightCheekbone.y.toFixed(2)}` : 'MISSING');
  console.log('  P_172 (leftJaw):', leftJaw ? `x=${leftJaw.x.toFixed(2)}, y=${leftJaw.y.toFixed(2)}` : 'MISSING');
  console.log('  P_397 (rightJaw):', rightJaw ? `x=${rightJaw.x.toFixed(2)}, y=${rightJaw.y.toFixed(2)}` : 'MISSING');
  console.log('  P_107 (leftEyebrow):', leftEyebrow ? `x=${leftEyebrow.x.toFixed(2)}, y=${leftEyebrow.y.toFixed(2)}` : 'MISSING');
  console.log('  P_336 (rightEyebrow):', rightEyebrow ? `x=${rightEyebrow.x.toFixed(2)}, y=${rightEyebrow.y.toFixed(2)}` : 'MISSING');
  console.log('  P_2 (noseBase):', noseBase ? `x=${noseBase.x.toFixed(2)}, y=${noseBase.y.toFixed(2)}` : 'MISSING');

  // Face center
  const faceCenterX = (rightEyeOuter.x + leftEyeOuter.x) / 2;
  const faceCenterY = (forehead.y + chin.y) / 2;

  console.log('📐 FACE CENTER:');
  console.log('  Center X:', faceCenterX.toFixed(2), 'px');
  console.log('  Center Y:', faceCenterY.toFixed(2), 'px');

  // ========================================
  // 1. BASIC FACE DIMENSIONS
  // ========================================

  const faceLength = chin.y - forehead.y;
  const faceWidth = leftEyeOuter.x - rightEyeOuter.x;  // At eye level (widest)
  const cheekboneWidth = leftCheekbone.x - rightCheekbone.x;
  const jawlineWidth = leftJaw.x - rightJaw.x;
  const foreheadWidth = faceWidth * 0.95;  // Approximate (no forehead landmarks at widest)

  // ========================================
  // 2. FACE SHAPE CLASSIFICATION (40% weight)
  // ========================================

  const lengthWidthRatio = faceLength / faceWidth;
  const jawCheekRatio = jawlineWidth / cheekboneWidth;
  const foreheadJawRatio = foreheadWidth / jawlineWidth;

  // Classify face shape based on ratios
  let faceShape: 'OVAL' | 'ROUND' | 'SQUARE' | 'HEART' | 'DIAMOND' | 'OBLONG' | 'TRIANGLE';
  let shapeConfidence: number;
  let alternativeShape: string | undefined;

  // OVAL: Balanced proportions, length > width, forehead ≈ cheekbones ≈ jaw
  if (lengthWidthRatio > 1.3 && lengthWidthRatio < 1.6 &&
      Math.abs(jawCheekRatio - 1) < 0.15 &&
      Math.abs(foreheadJawRatio - 1) < 0.15) {
    faceShape = 'OVAL';
    shapeConfidence = 9;
  }
  // ROUND: Length ≈ width, soft curves
  else if (lengthWidthRatio < 1.2 && jawCheekRatio > 0.9) {
    faceShape = 'ROUND';
    shapeConfidence = 8;
    if (lengthWidthRatio > 1.05) alternativeShape = 'OVAL';
  }
  // SQUARE: Length ≈ width, strong jawline
  else if (lengthWidthRatio < 1.25 && jawCheekRatio > 0.95 && jawCheekRatio < 1.1) {
    faceShape = 'SQUARE';
    shapeConfidence = 8;
  }
  // HEART: Wide forehead, narrow jaw
  else if (foreheadJawRatio > 1.15 && jawCheekRatio < 0.85) {
    faceShape = 'HEART';
    shapeConfidence = 8;
    if (lengthWidthRatio > 1.4) alternativeShape = 'DIAMOND';
  }
  // DIAMOND: Wide cheekbones, narrow forehead and jaw
  else if (jawCheekRatio < 0.85 && foreheadJawRatio < 1.05 && lengthWidthRatio > 1.3) {
    faceShape = 'DIAMOND';
    shapeConfidence = 7;
  }
  // OBLONG: Very long face, length >> width
  else if (lengthWidthRatio > 1.6) {
    faceShape = 'OBLONG';
    shapeConfidence = 8;
    alternativeShape = 'OVAL';
  }
  // TRIANGLE: Narrow forehead, wide jaw
  else if (foreheadJawRatio < 0.9 && jawCheekRatio > 1.0) {
    faceShape = 'TRIANGLE';
    shapeConfidence = 7;
  }
  // Default fallback
  else {
    faceShape = 'OVAL';  // Most common, safest guess
    shapeConfidence = 5;  // Low confidence
    alternativeShape = 'ROUND';
  }

  // ========================================
  // 3. FACIAL THIRDS BALANCE (30% weight)
  // ========================================

  // Upper third: forehead to eyebrows
  const eyebrowY = (leftEyebrow.y + rightEyebrow.y) / 2;
  const upperThird = eyebrowY - forehead.y;

  // Middle third: eyebrows to nose base
  const middleThird = noseBase.y - eyebrowY;

  // Lower third: nose base to chin
  const lowerThird = chin.y - noseBase.y;

  // Total face length (for ratios)
  const totalLength = upperThird + middleThird + lowerThird;

  // Percentages
  const upperThirdRatio = (upperThird / totalLength) * 100;
  const middleThirdRatio = (middleThird / totalLength) * 100;
  const lowerThirdRatio = (lowerThird / totalLength) * 100;

  // Deviation from ideal (33-33-33)
  const upperDeviation = Math.abs(upperThirdRatio - 33.33);
  const middleDeviation = Math.abs(middleThirdRatio - 33.33);
  const lowerDeviation = Math.abs(lowerThirdRatio - 33.33);
  const thirdsDeviation = (upperDeviation + middleDeviation + lowerDeviation) / 3;

  // STRICT SCORING: Facial thirds balance is key to beauty
  const facialThirdsScore =
    thirdsDeviation < 2 ? 10 :          // Perfect balance (<2% deviation)
    thirdsDeviation < 4 ? 8 :           // Good balance (2-4%)
    thirdsDeviation < 6 ? 6 :           // Fair balance (4-6%)
    thirdsDeviation < 8 ? 4 : 2;        // Poor balance (>8%)

  // ========================================
  // 4. HORIZONTAL SYMMETRY (20% weight)
  // ========================================

  const leftFaceWidth = leftEyeOuter.x - faceCenterX;
  const rightFaceWidth = faceCenterX - rightEyeOuter.x;
  const horizontalAsymmetry = Math.abs(leftFaceWidth - rightFaceWidth);
  const horizontalAsymmetryRatio = (horizontalAsymmetry / faceWidth) * 100;

  // STRICT SCORING: Horizontal symmetry
  const horizontalSymmetryScore =
    horizontalAsymmetryRatio < 1 ? 10 :     // Perfect (<1%)
    horizontalAsymmetryRatio < 2 ? 8 :      // Minimal (1-2%)
    horizontalAsymmetryRatio < 4 ? 6 :      // Noticeable (2-4%)
    horizontalAsymmetryRatio < 6 ? 4 : 2;   // Severe (>6%)

  // ========================================
  // 5. PROPORTION SCORES (10% weight)
  // ========================================

  // Golden ratio: Ideal face length / width ≈ 1.618
  const goldenRatio = 1.618;
  const goldenRatioDeviation = Math.abs(lengthWidthRatio - goldenRatio);

  // SCORING: How close to golden ratio
  const goldenRatioScore =
    goldenRatioDeviation < 0.1 ? 10 :       // Very close (<0.1)
    goldenRatioDeviation < 0.2 ? 8 :        // Close (0.1-0.2)
    goldenRatioDeviation < 0.3 ? 6 :        // Fair (0.2-0.3)
    goldenRatioDeviation < 0.5 ? 4 : 2;     // Far (>0.5)

  // Overall proportionality (combination of ratios)
  const proportionScore = Math.round(
    (goldenRatioScore * 0.6) +
    (shapeConfidence * 0.4)
  );

  // ========================================
  // 6. OVERALL SCORE (WEIGHTED)
  // ========================================

  const overallScore = Math.round(
    shapeConfidence * 0.40 +               // Face shape classification (40%)
    facialThirdsScore * 0.30 +             // Vertical thirds balance (30%)
    horizontalSymmetryScore * 0.20 +       // Horizontal symmetry (20%)
    proportionScore * 0.10                 // Golden ratio & proportions (10%)
  );

  // PROPORTION ASSESSMENT
  const proportionAssessment: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_ATTENTION' =
    overallScore >= 9 ? 'EXCELLENT' :
    overallScore >= 7 ? 'GOOD' :
    overallScore >= 5 ? 'FAIR' : 'NEEDS_ATTENTION';

  // ========================================
  // CONSOLE.LOG - CALCULATION RESULTS
  // ========================================
  console.log('📊 FACE SHAPE CALCULATION RESULTS:');
  console.log('  ┌─────────────────────────────────────────────────────');
  console.log('  │ BASIC FACE DIMENSIONS:');
  console.log('  │   Face length:', faceLength.toFixed(2), 'px');
  console.log('  │   Face width:', faceWidth.toFixed(2), 'px');
  console.log('  │   Cheekbone width:', cheekboneWidth.toFixed(2), 'px');
  console.log('  │   Jawline width:', jawlineWidth.toFixed(2), 'px');
  console.log('  │   Forehead width:', foreheadWidth.toFixed(2), 'px');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ FACE SHAPE CLASSIFICATION (40% weight):');
  console.log('  │   Length/Width ratio:', lengthWidthRatio.toFixed(3));
  console.log('  │   Jaw/Cheek ratio:', jawCheekRatio.toFixed(3));
  console.log('  │   Forehead/Jaw ratio:', foreheadJawRatio.toFixed(3));
  console.log('  │   DETECTED SHAPE:', faceShape);
  console.log('  │   Shape confidence:', shapeConfidence, '/10');
  console.log('  │   Alternative shape:', alternativeShape || 'none');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ FACIAL THIRDS BALANCE (30% weight):');
  console.log('  │   Upper third:', upperThird.toFixed(2), 'px (', upperThirdRatio.toFixed(1), '%)');
  console.log('  │   Middle third:', middleThird.toFixed(2), 'px (', middleThirdRatio.toFixed(1), '%)');
  console.log('  │   Lower third:', lowerThird.toFixed(2), 'px (', lowerThirdRatio.toFixed(1), '%)');
  console.log('  │   Deviation from ideal 33-33-33:', thirdsDeviation.toFixed(2), '%');
  console.log('  │   SCORE:', facialThirdsScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ HORIZONTAL SYMMETRY (20% weight):');
  console.log('  │   Left face width:', leftFaceWidth.toFixed(2), 'px');
  console.log('  │   Right face width:', rightFaceWidth.toFixed(2), 'px');
  console.log('  │   Horizontal asymmetry:', horizontalAsymmetry.toFixed(2), 'px');
  console.log('  │   Asymmetry ratio:', horizontalAsymmetryRatio.toFixed(2), '%');
  console.log('  │   SCORE:', horizontalSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ PROPORTION SCORES (10% weight):');
  console.log('  │   Golden ratio (1.618) deviation:', goldenRatioDeviation.toFixed(3));
  console.log('  │   Golden ratio score:', goldenRatioScore, '/10');
  console.log('  │   Proportion score:', proportionScore, '/10');
  console.log('  └─────────────────────────────────────────────────────');
  console.log('🏆 OVERALL SCORE:', overallScore, '/10');
  console.log('📋 PROPORTION ASSESSMENT:', proportionAssessment);
  console.log('🔷 ==========================================');
  console.log('🔷 FACE SHAPE CALCULATIONS END');
  console.log('🔷 ==========================================');

  return {
    // Basic dimensions
    faceLength,
    faceWidth,
    cheekboneWidth,
    jawlineWidth,
    foreheadWidth,

    // Face shape classification
    lengthWidthRatio,
    jawCheekRatio,
    foreheadJawRatio,
    faceShape,
    shapeConfidence,
    alternativeShape,

    // Facial thirds
    upperThird,
    middleThird,
    lowerThird,
    upperThirdRatio,
    middleThirdRatio,
    lowerThirdRatio,
    thirdsDeviation,
    facialThirdsScore,

    // Horizontal symmetry
    leftFaceWidth,
    rightFaceWidth,
    horizontalAsymmetry,
    horizontalAsymmetryRatio,
    horizontalSymmetryScore,

    // Proportion scores
    goldenRatioDeviation,
    goldenRatioScore,
    proportionScore,

    // Overall
    overallScore,
    proportionAssessment,

    // Metadata
    faceCenterX,
    faceCenterY,
    landmarkIndices: {
      forehead: 10,
      chin: 152,
      leftEyeOuter: 263,
      rightEyeOuter: 33,
      leftCheekbone: 234,
      rightCheekbone: 454,
      leftJaw: 172,
      rightJaw: 397,
      leftEyebrow: 107,
      rightEyebrow: 336,
      noseBase: 2,
    },
  };
}
*/
