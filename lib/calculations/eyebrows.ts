// Eyebrows Calculation Module
// Calculates ALL eyebrow metrics from MediaPipe Face Mesh landmarks
// AI will ONLY interpret these pre-calculated values

import type { Point3D } from '../geometry';
import { distance2D } from '../geometry';

export interface EyebrowCalculations {
  // === BROW HEIGHT SYMMETRY (28% - most critical) ===
  leftBrowHighestY: number;          // highest point of left brow
  rightBrowHighestY: number;         // highest point of right brow
  browHeightDifference: number;      // absolute Y difference
  browHeightDifferenceRatio: number; // percentage of face height
  browHeightDirection: 'LEFT_HIGHER' | 'RIGHT_HIGHER' | 'EQUAL'; // which brow is higher (viewer perspective)
  browHeightSymmetryScore: number;   // 0-10 (strict)

  // === ARCH HEIGHT SYMMETRY (24%) ===
  leftArchHeight: number;            // arch peak height above eye
  rightArchHeight: number;           // arch peak height above eye
  archHeightDifference: number;      // absolute difference
  archHeightDifferenceRatio: number; // percentage
  archHeightSymmetryScore: number;   // 0-10

  // === BROW DISTANCE FROM EYE (18%) ===
  leftBrowEyeDistance: number;       // left brow lowest point to eye
  rightBrowEyeDistance: number;      // right brow lowest point to eye
  browEyeDistanceAsymmetry: number;  // absolute difference
  avgBrowEyeDistance: number;        // average distance
  eyeHeight: number;                 // reference eye height
  browEyeDistanceRatio: number;      // ratio to eye height
  browEyeDistanceAssessment: 'TOO_CLOSE' | 'IDEAL' | 'TOO_FAR';
  browEyeDistanceScore: number;      // 0-10

  // === INNER CORNER DISTANCE (12%) ===
  innerCornerDistance: number;       // distance between inner corners
  leftInnerCornerDistance: number;   // left brow inner to left eye inner
  rightInnerCornerDistance: number;  // right brow inner to right eye inner
  innerCornerDistanceAsymmetry: number; // difference between left/right
  eyeWidth: number;                  // reference eye width
  innerCornerDistanceRatio: number;  // ratio to eye width
  innerCornerAssessment: 'TOO_CLOSE' | 'IDEAL' | 'TOO_FAR';
  innerCornerDistanceScore: number;  // 0-10

  // === BROW ANGLE/SLOPE (10%) ===
  leftBrowAngle: number;             // degrees (+ = ascending, - = descending)
  rightBrowAngle: number;            // degrees
  browAngleDifference: number;       // absolute difference
  leftBrowDirection: 'ASCENDING' | 'HORIZONTAL' | 'DESCENDING';
  rightBrowDirection: 'ASCENDING' | 'HORIZONTAL' | 'DESCENDING';
  browAngleSymmetryScore: number;    // 0-10

  // === BROW THICKNESS (6%) ===
  leftBrowThickness: number;         // vertical thickness
  rightBrowThickness: number;        // vertical thickness
  browThicknessDifference: number;   // absolute difference
  browThicknessDifferenceRatio: number; // percentage
  browThicknessSymmetryScore: number; // 0-10

  // === BROW LENGTH (2%) ===
  leftBrowLength: number;            // inner to tail length
  rightBrowLength: number;           // inner to tail length
  browLengthDifference: number;      // absolute difference
  browLengthDifferenceRatio: number; // percentage
  browLengthSymmetryScore: number;   // 0-10

  // === INDIVIDUAL BROW SCORES ===
  leftBrowScore: number;             // 0-10 (left brow overall)
  rightBrowScore: number;            // 0-10 (right brow overall)

  // === OVERALL ===
  overallScore: number;              // 0-10 (weighted, strict)
  asymmetryLevel: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

  // === METADATA ===
  faceHeight: number;
  landmarkIndices: {
    leftBrowInner: 70;
    leftBrowArch: 105;
    leftBrowTail: 46;
    rightBrowInner: 300;
    rightBrowArch: 334;
    rightBrowTail: 276;
    leftEyeTop: 159;
    rightEyeTop: 386;
  };
}

export function calculateEyebrowMetrics(landmarks: Point3D[]): EyebrowCalculations {
  console.log('🤨 ==========================================');
  console.log('🤨 EYEBROWS CALCULATIONS START');
  console.log('🤨 ==========================================');
  console.log('🤨 Total landmarks received:', landmarks.length);

  // ========================================
  // REFERENCE POINTS
  // ========================================

  // Left eyebrow key points
  const leftBrowInner = landmarks[70];      // P_70: Inner corner
  const leftBrowArch = landmarks[105];      // P_105: Arch peak
  const leftBrowTail = landmarks[46];       // P_46: Tail end
  const leftBrowMid1 = landmarks[63];       // P_63: Mid point 1
  const leftBrowMid2 = landmarks[107];      // P_107: Mid point 2

  // Right eyebrow key points
  const rightBrowInner = landmarks[300];    // P_300: Inner corner
  const rightBrowArch = landmarks[334];     // P_334: Arch peak
  const rightBrowTail = landmarks[276];     // P_276: Tail end
  const rightBrowMid1 = landmarks[293];     // P_293: Mid point 1
  const rightBrowMid2 = landmarks[336];     // P_336: Mid point 2

  // Eye reference points (for distance measurement)
  const leftEyeTop = landmarks[159];        // P_159: Left eye top
  const leftEyeBottom = landmarks[145];     // P_145: Left eye bottom
  const rightEyeTop = landmarks[386];       // P_386: Right eye top
  const rightEyeBottom = landmarks[374];    // P_374: Right eye bottom

  // Face reference points
  const leftEyeOuter = landmarks[263];      // P_263: Left eye outer corner
  const rightEyeOuter = landmarks[33];      // P_33: Right eye outer corner
  const leftEyeInner = landmarks[133];      // P_133: Left eye inner corner
  const rightEyeInner = landmarks[362];     // P_362: Right eye inner corner
  const forehead = landmarks[10];           // P_10: Forehead
  const chinTip = landmarks[152];           // P_152: Chin tip

  console.log('🤨 LEFT EYEBROW LANDMARKS:');
  console.log('  P_70 (inner):', leftBrowInner ? `x=${leftBrowInner.x.toFixed(2)}, y=${leftBrowInner.y.toFixed(2)}` : 'MISSING');
  console.log('  P_105 (arch):', leftBrowArch ? `x=${leftBrowArch.x.toFixed(2)}, y=${leftBrowArch.y.toFixed(2)}` : 'MISSING');
  console.log('  P_46 (tail):', leftBrowTail ? `x=${leftBrowTail.x.toFixed(2)}, y=${leftBrowTail.y.toFixed(2)}` : 'MISSING');
  console.log('🤨 RIGHT EYEBROW LANDMARKS:');
  console.log('  P_300 (inner):', rightBrowInner ? `x=${rightBrowInner.x.toFixed(2)}, y=${rightBrowInner.y.toFixed(2)}` : 'MISSING');
  console.log('  P_334 (arch):', rightBrowArch ? `x=${rightBrowArch.x.toFixed(2)}, y=${rightBrowArch.y.toFixed(2)}` : 'MISSING');
  console.log('  P_276 (tail):', rightBrowTail ? `x=${rightBrowTail.x.toFixed(2)}, y=${rightBrowTail.y.toFixed(2)}` : 'MISSING');

  // Face dimensions
  const faceHeight = chinTip.y - forehead.y;
  // Use absolute difference or distance for safe width calculation
  const eyeWidth = distance2D(leftEyeOuter, rightEyeOuter);

  console.log('📐 FACE DIMENSIONS:');
  console.log('  Face height:', faceHeight.toFixed(2), 'px');
  console.log('  Eye width:', eyeWidth.toFixed(2), 'px');

  // ========================================
  // 1. BROW HEIGHT SYMMETRY (28% weight)
  // ========================================

  // Find highest point of each brow (lowest Y value)
  // NOTE: In MediaPipe/Screen coordinates:
  // - leftBrow variables (indices 70, 105...) correspond to SCREEN LEFT but SUBJECT'S RIGHT brow.
  // - rightBrow variables (indices 300, 334...) correspond to SCREEN RIGHT but SUBJECT'S LEFT brow.

  const leftBrowHighestY = Math.min(
    leftBrowInner.y,
    leftBrowArch.y,
    leftBrowMid1.y,
    leftBrowMid2.y,
    leftBrowTail.y
  );

  const rightBrowHighestY = Math.min(
    rightBrowInner.y,
    rightBrowArch.y,
    rightBrowMid1.y,
    rightBrowMid2.y,
    rightBrowTail.y
  );

  const browHeightDifference = Math.abs(leftBrowHighestY - rightBrowHighestY);
  const browHeightDifferenceRatio = (browHeightDifference / faceHeight) * 100;

  // Hangi kaş daha yukarıda? (düşük Y = daha yukarıda)
  // CORRECTED LOGIC FOR SUBJECT PERSPECTIVE:
  // leftBrowHighestY = Screen Left = Subject's RIGHT Brow
  // rightBrowHighestY = Screen Right = Subject's LEFT Brow
  // If leftBrowHighestY < rightBrowHighestY -> Screen Left is higher -> Subject's RIGHT is higher.

  const browHeightDirection: 'LEFT_HIGHER' | 'RIGHT_HIGHER' | 'EQUAL' =
    browHeightDifference < 3 ? 'EQUAL' :
      leftBrowHighestY < rightBrowHighestY ? 'RIGHT_HIGHER' : 'LEFT_HIGHER';

  console.log('📊 BROW HEIGHT DIRECTION (SUBJECT PERSPECTIVE):');
  console.log('  Screen Left (Subject RIGHT) Y:', leftBrowHighestY.toFixed(2), 'px');
  console.log('  Screen Right (Subject LEFT) Y:', rightBrowHighestY.toFixed(2), 'px');
  console.log('  Height difference:', browHeightDifference.toFixed(2), 'px');
  console.log('  Calculated Direction (Subject POV):', browHeightDirection);
  console.log('  → ', browHeightDirection === 'LEFT_HIGHER' ? 'SOL kaş (Screen Right) daha YUKARDA' :
    browHeightDirection === 'RIGHT_HIGHER' ? 'SAĞ kaş (Screen Left) daha YUKARDA' : 'KAŞLAR EŞİT');

  // STRICT SCORING: Based on ratio to face height (not absolute pixels)
  // %1 fark = minimal, %1.5-2 fark = fark edilebilir, %2.5+ = belirgin
  const browHeightSymmetryScore =
    browHeightDifferenceRatio < 0.5 ? 10 :    // Perfect (<0.5% face height)
      browHeightDifferenceRatio < 1 ? 8 :       // Minimal (0.5-1%)
        browHeightDifferenceRatio < 1.5 ? 7 :     // Slight (1-1.5%)
          browHeightDifferenceRatio < 2 ? 5 :       // Noticeable (1.5-2%)
            browHeightDifferenceRatio < 2.5 ? 4 :     // Moderate (2-2.5%)
              browHeightDifferenceRatio < 3.5 ? 3 :     // Visible (2.5-3.5%)
                browHeightDifferenceRatio < 5 ? 2 : 1;    // Severe (>5%)

  // ========================================
  // 2. ARCH HEIGHT SYMMETRY (24% weight)
  // ========================================

  // Distance from arch to eye top (vertical span)
  const leftArchHeight = leftBrowArch.y - leftEyeTop.y;
  const rightArchHeight = rightBrowArch.y - rightEyeTop.y;

  const archHeightDifference = Math.abs(leftArchHeight - rightArchHeight);
  const archHeightDifferenceRatio = (archHeightDifference / Math.max(Math.abs(leftArchHeight), Math.abs(rightArchHeight))) * 100;

  // STRICT SCORING: Based on ratio (not absolute pixels)
  // Arch height diff as % of max arch height - daha sıkı
  const archHeightSymmetryScore =
    archHeightDifferenceRatio < 3 ? 10 :      // Perfect (<3% diff)
      archHeightDifferenceRatio < 5 ? 8 :       // Minimal (3-5%)
        archHeightDifferenceRatio < 8 ? 6 :       // Noticeable (5-8%)
          archHeightDifferenceRatio < 12 ? 5 :      // Moderate (8-12%)
            archHeightDifferenceRatio < 18 ? 3 :      // Visible (12-18%)
              archHeightDifferenceRatio < 25 ? 2 : 1;   // Severe (>25%)

  // ========================================
  // 3. BROW DISTANCE FROM EYE (18% weight)
  // ========================================

  // Distance from brow lowest point to eye top
  const leftBrowEyeDistance = leftEyeTop.y - leftBrowHighestY;
  const rightBrowEyeDistance = rightEyeTop.y - rightBrowHighestY;
  const browEyeDistanceAsymmetry = Math.abs(leftBrowEyeDistance - rightBrowEyeDistance);
  const avgBrowEyeDistance = (leftBrowEyeDistance + rightBrowEyeDistance) / 2;

  // Eye height as reference
  const eyeHeight = Math.abs(leftEyeBottom.y - leftEyeTop.y);
  const browEyeDistanceRatio = (avgBrowEyeDistance / eyeHeight) * 100;

  // IDEAL RANGE: 80-150% of eye height
  // 187% biraz yüksek - kaşlar gözden uzak
  const browEyeDistanceAssessment: 'TOO_CLOSE' | 'IDEAL' | 'TOO_FAR' =
    browEyeDistanceRatio < 60 ? 'TOO_CLOSE' :
      browEyeDistanceRatio < 160 ? 'IDEAL' : 'TOO_FAR';

  // STRICT SCORING: Narrower optimal range
  const distanceScore =
    browEyeDistanceRatio >= 80 && browEyeDistanceRatio <= 140 ? 10 :   // Optimal range
      browEyeDistanceRatio >= 60 && browEyeDistanceRatio <= 160 ? 8 :    // Good range
        browEyeDistanceRatio >= 50 && browEyeDistanceRatio <= 180 ? 6 :    // Acceptable
          browEyeDistanceRatio >= 40 && browEyeDistanceRatio <= 200 ? 4 :    // Far from ideal
            browEyeDistanceRatio >= 30 && browEyeDistanceRatio <= 250 ? 3 : 2; // Extreme

  // Asymmetry scoring: ratio-based (% of eye height) - daha sıkı
  const asymmetryRatio = (browEyeDistanceAsymmetry / eyeHeight) * 100;
  const asymmetryScore =
    asymmetryRatio < 5 ? 10 :     // <5% of eye height
      asymmetryRatio < 10 ? 8 :     // 5-10%
        asymmetryRatio < 15 ? 6 :     // 10-15%
          asymmetryRatio < 20 ? 4 :     // 15-20%
            asymmetryRatio < 30 ? 3 : 2;  // >30%

  const browEyeDistanceScore = Math.round((distanceScore * 0.6) + (asymmetryScore * 0.4));

  // ========================================
  // 4. INNER CORNER DISTANCE (12% weight)
  // ========================================

  // Distance between brow inner corners (glabella region)
  const innerCornerDistance = distance2D(leftBrowInner, rightBrowInner);
  const innerCornerDistanceRatio = (innerCornerDistance / eyeWidth) * 100;

  // Individual brow inner to eye inner distances
  const leftInnerCornerDistance = distance2D(leftBrowInner, leftEyeInner);
  const rightInnerCornerDistance = distance2D(rightBrowInner, rightEyeInner);
  const innerCornerDistanceAsymmetry = Math.abs(leftInnerCornerDistance - rightInnerCornerDistance);

  // IDEAL: 95-120% of eye width (kaşlar göz genişliğine yakın olmalı)
  // 127% biraz geniş aralıklı
  const innerCornerAssessment: 'TOO_CLOSE' | 'IDEAL' | 'TOO_FAR' =
    innerCornerDistanceRatio < 85 ? 'TOO_CLOSE' :
      innerCornerDistanceRatio < 125 ? 'IDEAL' : 'TOO_FAR';

  // STRICT SCORING: Narrower optimal range
  const innerCornerDistanceScore =
    innerCornerDistanceRatio >= 95 && innerCornerDistanceRatio <= 115 ? 10 :   // Optimal
      innerCornerDistanceRatio >= 85 && innerCornerDistanceRatio <= 125 ? 8 :    // Good
        innerCornerDistanceRatio >= 75 && innerCornerDistanceRatio <= 135 ? 6 :    // Acceptable
          innerCornerDistanceRatio >= 65 && innerCornerDistanceRatio <= 150 ? 4 :    // Wide/narrow
            innerCornerDistanceRatio >= 55 && innerCornerDistanceRatio <= 170 ? 3 : 2; // Extreme

  // ========================================
  // 5. BROW ANGLE/SLOPE (10% weight)
  // ========================================

  // Calculate brow angle (inner to tail)
  const leftBrowDx = leftBrowTail.x - leftBrowInner.x;
  const leftBrowDy = leftBrowTail.y - leftBrowInner.y;
  const leftBrowAngle = Math.atan2(-leftBrowDy, leftBrowDx) * (180 / Math.PI);

  const rightBrowDx = rightBrowTail.x - rightBrowInner.x;
  const rightBrowDy = rightBrowTail.y - rightBrowInner.y;
  const rightBrowAngle = Math.atan2(-rightBrowDy, -rightBrowDx) * (180 / Math.PI);

  const browAngleDifference = Math.abs(leftBrowAngle - rightBrowAngle);

  // Classify direction
  const leftBrowDirection: 'ASCENDING' | 'HORIZONTAL' | 'DESCENDING' =
    leftBrowAngle > 5 ? 'ASCENDING' :
      leftBrowAngle < -5 ? 'DESCENDING' : 'HORIZONTAL';

  const rightBrowDirection: 'ASCENDING' | 'HORIZONTAL' | 'DESCENDING' =
    rightBrowAngle > 5 ? 'ASCENDING' :
      rightBrowAngle < -5 ? 'DESCENDING' : 'HORIZONTAL';

  // STRICT SCORING
  const browAngleSymmetryScore =
    browAngleDifference < 3 ? 10 :
      browAngleDifference < 6 ? 8 :
        browAngleDifference < 10 ? 6 :
          browAngleDifference < 15 ? 3 : 1;

  // ========================================
  // 6. BROW THICKNESS (6% weight)
  // ========================================

  // Approximate thickness at mid-point
  // Use vertical span of brow landmarks
  const leftBrowTop = Math.min(leftBrowMid1.y, leftBrowArch.y, leftBrowMid2.y);
  const leftBrowBottom = Math.max(leftBrowMid1.y, leftBrowArch.y, leftBrowMid2.y);
  const leftBrowThickness = leftBrowBottom - leftBrowTop;

  const rightBrowTop = Math.min(rightBrowMid1.y, rightBrowArch.y, rightBrowMid2.y);
  const rightBrowBottom = Math.max(rightBrowMid1.y, rightBrowArch.y, rightBrowMid2.y);
  const rightBrowThickness = rightBrowBottom - rightBrowTop;

  const browThicknessDifference = Math.abs(leftBrowThickness - rightBrowThickness);
  const browThicknessDifferenceRatio = (browThicknessDifference / Math.max(leftBrowThickness, rightBrowThickness)) * 100;

  // STRICT SCORING
  const browThicknessSymmetryScore =
    browThicknessDifferenceRatio < 10 ? 10 :
      browThicknessDifferenceRatio < 20 ? 8 :
        browThicknessDifferenceRatio < 30 ? 6 :
          browThicknessDifferenceRatio < 40 ? 3 : 1;

  // ========================================
  // 7. BROW LENGTH (2% weight)
  // ========================================

  const leftBrowLength = distance2D(leftBrowInner, leftBrowTail);
  const rightBrowLength = distance2D(rightBrowInner, rightBrowTail);

  const browLengthDifference = Math.abs(leftBrowLength - rightBrowLength);
  const browLengthDifferenceRatio = (browLengthDifference / Math.max(leftBrowLength, rightBrowLength)) * 100;

  // STRICT SCORING
  const browLengthSymmetryScore =
    browLengthDifferenceRatio < 5 ? 10 :
      browLengthDifferenceRatio < 10 ? 8 :
        browLengthDifferenceRatio < 15 ? 6 :
          browLengthDifferenceRatio < 20 ? 3 : 1;

  // ========================================
  // INDIVIDUAL BROW SCORES
  // ========================================

  // Left brow score (based on its own metrics)
  const leftBrowScore = Math.round(
    (browHeightSymmetryScore * 0.3) +  // Height position
    (archHeightSymmetryScore * 0.25) + // Arch definition
    (browEyeDistanceScore * 0.2) +     // Eye distance
    (browAngleSymmetryScore * 0.15) +  // Angle
    (browThicknessSymmetryScore * 0.1) // Thickness
  );

  // Right brow score (mirrors left calculation for consistency)
  const rightBrowScore = Math.round(
    (browHeightSymmetryScore * 0.3) +
    (archHeightSymmetryScore * 0.25) +
    (browEyeDistanceScore * 0.2) +
    (browAngleSymmetryScore * 0.15) +
    (browThicknessSymmetryScore * 0.1)
  );

  // ========================================
  // OVERALL SCORE (WEIGHTED)
  // ========================================

  const overallScore = Math.round(
    browHeightSymmetryScore * 0.28 +
    archHeightSymmetryScore * 0.24 +
    browEyeDistanceScore * 0.18 +
    innerCornerDistanceScore * 0.12 +
    browAngleSymmetryScore * 0.10 +
    browThicknessSymmetryScore * 0.06 +
    browLengthSymmetryScore * 0.02
  );

  // ASYMMETRY LEVEL
  const asymmetryLevel: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE' =
    overallScore >= 9 ? 'NONE' :
      overallScore >= 7 ? 'MILD' :
        overallScore >= 4 ? 'MODERATE' : 'SEVERE';

  // ========================================
  // CONSOLE.LOG - CALCULATION RESULTS
  // ========================================
  console.log('📊 EYEBROWS CALCULATION RESULTS:');
  console.log('  ┌─────────────────────────────────────────────────────');
  console.log('  │ BROW HEIGHT SYMMETRY (28% weight):');
  console.log('  │   Left brow highest Y:', leftBrowHighestY.toFixed(2), 'px');
  console.log('  │   Right brow highest Y:', rightBrowHighestY.toFixed(2), 'px');
  console.log('  │   Height difference:', browHeightDifference.toFixed(2), 'px');
  console.log('  │   Height difference ratio:', browHeightDifferenceRatio.toFixed(2), '%');
  console.log('  │   SCORE:', browHeightSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ ARCH HEIGHT SYMMETRY (24% weight):');
  console.log('  │   Left arch height:', leftArchHeight.toFixed(2), 'px');
  console.log('  │   Right arch height:', rightArchHeight.toFixed(2), 'px');
  console.log('  │   Arch difference:', archHeightDifference.toFixed(2), 'px');
  console.log('  │   Arch difference ratio:', archHeightDifferenceRatio.toFixed(2), '%');
  console.log('  │   SCORE:', archHeightSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ BROW-EYE DISTANCE (18% weight):');
  console.log('  │   Left brow-eye distance:', leftBrowEyeDistance.toFixed(2), 'px');
  console.log('  │   Right brow-eye distance:', rightBrowEyeDistance.toFixed(2), 'px');
  console.log('  │   Asymmetry:', browEyeDistanceAsymmetry.toFixed(2), 'px');
  console.log('  │   Distance ratio (to eye height):', browEyeDistanceRatio.toFixed(2), '%');
  console.log('  │   Assessment:', browEyeDistanceAssessment);
  console.log('  │   SCORE:', browEyeDistanceScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ INNER CORNER DISTANCE (12% weight):');
  console.log('  │   Inner corner distance:', innerCornerDistance.toFixed(2), 'px');
  console.log('  │   Distance ratio (to eye width):', innerCornerDistanceRatio.toFixed(2), '%');
  console.log('  │   Assessment:', innerCornerAssessment);
  console.log('  │   SCORE:', innerCornerDistanceScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ BROW ANGLE/SLOPE (10% weight):');
  console.log('  │   Left brow angle:', leftBrowAngle.toFixed(2), '° (', leftBrowDirection, ')');
  console.log('  │   Right brow angle:', rightBrowAngle.toFixed(2), '° (', rightBrowDirection, ')');
  console.log('  │   Angle difference:', browAngleDifference.toFixed(2), '°');
  console.log('  │   SCORE:', browAngleSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ BROW THICKNESS (6% weight):');
  console.log('  │   Left thickness:', leftBrowThickness.toFixed(2), 'px');
  console.log('  │   Right thickness:', rightBrowThickness.toFixed(2), 'px');
  console.log('  │   Thickness difference:', browThicknessDifference.toFixed(2), 'px');
  console.log('  │   Thickness difference ratio:', browThicknessDifferenceRatio.toFixed(2), '%');
  console.log('  │   SCORE:', browThicknessSymmetryScore, '/10');
  console.log('  ├─────────────────────────────────────────────────────');
  console.log('  │ BROW LENGTH (2% weight):');
  console.log('  │   Left length:', leftBrowLength.toFixed(2), 'px');
  console.log('  │   Right length:', rightBrowLength.toFixed(2), 'px');
  console.log('  │   Length difference:', browLengthDifference.toFixed(2), 'px');
  console.log('  │   Length difference ratio:', browLengthDifferenceRatio.toFixed(2), '%');
  console.log('  │   SCORE:', browLengthSymmetryScore, '/10');
  console.log('  └─────────────────────────────────────────────────────');
  console.log('🏆 OVERALL SCORE:', overallScore, '/10');
  console.log('📋 ASYMMETRY LEVEL:', asymmetryLevel);
  console.log('🤨 ==========================================');
  console.log('🤨 EYEBROWS CALCULATIONS END');
  console.log('🤨 ==========================================');

  return {
    // Brow height symmetry
    leftBrowHighestY,
    rightBrowHighestY,
    browHeightDifference,
    browHeightDifferenceRatio,
    browHeightDirection,
    browHeightSymmetryScore,

    // Arch height symmetry
    leftArchHeight,
    rightArchHeight,
    archHeightDifference,
    archHeightDifferenceRatio,
    archHeightSymmetryScore,

    // Brow distance from eye
    leftBrowEyeDistance,
    rightBrowEyeDistance,
    browEyeDistanceAsymmetry,
    avgBrowEyeDistance,
    eyeHeight,
    browEyeDistanceRatio,
    browEyeDistanceAssessment,
    browEyeDistanceScore,

    // Inner corner distance
    innerCornerDistance,
    leftInnerCornerDistance,
    rightInnerCornerDistance,
    innerCornerDistanceAsymmetry,
    eyeWidth,
    innerCornerDistanceRatio,
    innerCornerAssessment,
    innerCornerDistanceScore,

    // Brow angle/slope
    leftBrowAngle,
    rightBrowAngle,
    browAngleDifference,
    leftBrowDirection,
    rightBrowDirection,
    browAngleSymmetryScore,

    // Brow thickness
    leftBrowThickness,
    rightBrowThickness,
    browThicknessDifference,
    browThicknessDifferenceRatio,
    browThicknessSymmetryScore,

    // Brow length
    leftBrowLength,
    rightBrowLength,
    browLengthDifference,
    browLengthDifferenceRatio,
    browLengthSymmetryScore,

    // Individual brow scores
    leftBrowScore,
    rightBrowScore,

    // Overall
    overallScore,
    asymmetryLevel,

    // Metadata
    faceHeight,
    landmarkIndices: {
      leftBrowInner: 70,
      leftBrowArch: 105,
      leftBrowTail: 46,
      rightBrowInner: 300,
      rightBrowArch: 334,
      rightBrowTail: 276,
      leftEyeTop: 159,
      rightEyeTop: 386,
    },
  };
}
