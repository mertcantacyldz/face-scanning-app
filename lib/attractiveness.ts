// Attractiveness Score Calculator
// Calculates overall attractiveness score from facial landmarks
// Improved with head tilt compensation, 3D depth, gender-specific standards,
// and regional feature integration.

import {
  CONFIDENCE_THRESHOLDS,
  PENALTY_CONFIG,
  SCORE_CALIBRATION,
  SCORING_WEIGHTS,
  SMOOTH_SCORING
} from './constants/scoring';

export interface Landmark {
  x: number;
  y: number;
  z: number;
  index: number;
}

// Regional scores from detailed analysis modules
export interface RegionalScores {
  eyebrows: number;  // 0-10 from eyebrows.ts
  nose: number;      // 0-10 from nose.ts
  eyes: number;      // 0-10 from eyes.ts
  lips: number;      // 0-10 from lips.ts
  jawline: number;   // 0-10 from jawline.ts
}

export interface AttractivenesResult {
  overallScore: number; // 0-10
  scoreLabel: string;
  confidence: number;  // 0-100 - scoring confidence based on landmark quality
  breakdown: {
    symmetry: number;
    proportions: number;
    harmony: number;
    regional?: {  // Optional - only present when regional scores provided
      eyebrows: number;
      nose: number;
      eyes: number;
      lips: number;
      jawline: number;
      averageRegional: number;
      penaltyMultiplier: number; // Applied penalty for severe flaws
    };
  };
}

// Key landmark indices for measurements (Consistent with region-specific modules)
const LANDMARKS = {
  // Face outline
  CHIN: 152,
  FOREHEAD: 151, // Glabella/Forehead (more accurate than 10)
  LEFT_JAW_ANGLE: 234,
  RIGHT_JAW_ANGLE: 454,

  // Eyes
  LEFT_EYE_INNER: 362,
  LEFT_EYE_OUTER: 263,
  RIGHT_EYE_INNER: 133,
  RIGHT_EYE_OUTER: 33,

  // Nose
  NOSE_TIP: 4,
  NOSE_BRIDGE: 6,
  LEFT_NOSTRIL: 100,
  RIGHT_NOSTRIL: 329,
  LEFT_WING: 98,
  RIGHT_WING: 327,

  // Mouth
  UPPER_LIP_CENTER: 0,
  LOWER_LIP_CENTER: 17,
  UPPER_LIP_BOTTOM: 13,
  LOWER_LIP_TOP: 14,
  LEFT_MOUTH_CORNER: 61,
  RIGHT_MOUTH_CORNER: 291,

  // Eyebrows
  LEFT_BROW_INNER: 336,
  RIGHT_BROW_INNER: 107,
};

// Get landmark by index
function getLandmark(landmarks: Landmark[], index: number): Landmark | null {
  return landmarks.find((l) => l.index === index) || null;
}

/**
 * Normalizes landmarks to compensate for head tilt (roll)
 * using the eyes as a horizon.
 */
function normalizeLandmarks(landmarks: Landmark[]): Landmark[] {
  const leftEye = getLandmark(landmarks, LANDMARKS.LEFT_EYE_OUTER);
  const rightEye = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_OUTER);

  if (!leftEye || !rightEye) return landmarks;

  // Calculate tilt angle (roll)
  const dx = leftEye.x - rightEye.x;
  const dy = leftEye.y - rightEye.y;
  const angle = Math.atan2(dy, dx);

  // Rotation center (midpoint between eyes)
  const centerX = (leftEye.x + rightEye.x) / 2;
  const centerY = (leftEye.y + rightEye.y) / 2;

  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);

  // Rotate all landmarks
  return landmarks.map((l) => {
    const nx = l.x - centerX;
    const ny = l.y - centerY;
    return {
      ...l,
      x: nx * cosA - ny * sinA + centerX,
      y: nx * sinA + ny * cosA + centerY,
    };
  });
}

/**
 * Validates landmark quality and determines confidence level
 * @param landmarks Array of landmarks to validate
 * @returns Validation result with confidence score
 */
function validateLandmarks(landmarks: Landmark[]): {
  isValid: boolean;
  missingCritical: number[];
  confidence: number;
} {
  const criticalIndices = [
    LANDMARKS.CHIN,
    LANDMARKS.FOREHEAD,
    LANDMARKS.NOSE_TIP,
    LANDMARKS.NOSE_BRIDGE,
    LANDMARKS.LEFT_EYE_OUTER,
    LANDMARKS.RIGHT_EYE_OUTER,
    LANDMARKS.LEFT_EYE_INNER,
    LANDMARKS.RIGHT_EYE_INNER,
    LANDMARKS.LEFT_MOUTH_CORNER,
    LANDMARKS.RIGHT_MOUTH_CORNER,
  ];

  const missing = criticalIndices.filter(
    (idx) => !landmarks.find((l) => l.index === idx)
  );

  // Determine confidence based on missing landmarks
  let confidence: number;
  if (missing.length === 0) {
    confidence = CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE;
  } else if (missing.length <= 2) {
    confidence = CONFIDENCE_THRESHOLDS.MEDIUM_CONFIDENCE;
  } else if (missing.length <= 4) {
    confidence = CONFIDENCE_THRESHOLDS.LOW_CONFIDENCE;
  } else {
    confidence = CONFIDENCE_THRESHOLDS.VERY_LOW_CONFIDENCE;
  }

  return {
    isValid: missing.length === 0,
    missingCritical: missing,
    confidence,
  };
}

/**
 * Smooth scoring function using sigmoid curve
 * Provides gradual score transitions instead of binary thresholds
 * 
 * @param value - The measured value
 * @param ideal - The ideal/target value
 * @param tolerance - How much deviation is tolerable (1x tolerance = 50% score)
 * @returns Score 0-10
 */
function smoothScore(value: number, ideal: number, tolerance: number): number {
  const deviation = Math.abs(value - ideal);
  const normalizedDeviation = deviation / tolerance;

  // Sigmoid curve: y = 10 / (1 + e^(k*(x-1)))
  // where k = steepness factor
  // Perfect match (0 deviation) → 10
  // 1x tolerance → ~5
  // 2x tolerance → ~2
  const k = SMOOTH_SCORING.SIGMOID_STEEPNESS;
  const score = 10 / (1 + Math.exp(k * (normalizedDeviation - 1)));

  return Math.round(score * 10) / 10;
}


// Calculate distance between two points
function distance2D(p1: Landmark, p2: Landmark): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Calculate facial symmetry score (0-10)
function calculateSymmetry(landmarks: Landmark[]): number {
  const leftEyeOuter = getLandmark(landmarks, LANDMARKS.LEFT_EYE_OUTER);
  const rightEyeOuter = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_OUTER);
  const leftEyeInner = getLandmark(landmarks, LANDMARKS.LEFT_EYE_INNER);
  const rightEyeInner = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_INNER);
  const noseTip = getLandmark(landmarks, LANDMARKS.NOSE_TIP);
  const leftMouth = getLandmark(landmarks, LANDMARKS.LEFT_MOUTH_CORNER);
  const rightMouth = getLandmark(landmarks, LANDMARKS.RIGHT_MOUTH_CORNER);
  const leftJaw = getLandmark(landmarks, LANDMARKS.LEFT_JAW_ANGLE);
  const rightJaw = getLandmark(landmarks, LANDMARKS.RIGHT_JAW_ANGLE);

  if (!leftEyeOuter || !rightEyeOuter || !noseTip || !leftMouth || !rightMouth) return 5;

  // Face vertical center line (using eyes and nose bridge as reference)
  const faceCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;

  // 1. Eye Size Symmetry
  const leftEyeWidth = distance2D(leftEyeOuter, leftEyeInner!);
  const rightEyeWidth = distance2D(rightEyeOuter, rightEyeInner!);
  const eyeSymmetry = 1 - Math.abs(leftEyeWidth - rightEyeWidth) / Math.max(leftEyeWidth, rightEyeWidth);

  // 2. Nose Centering
  const noseDeviation = Math.abs(noseTip.x - faceCenterX) / (leftEyeOuter.x - rightEyeOuter.x);
  const noseSymmetry = 1 - Math.min(noseDeviation * 3, 1);

  // 3. Mouth Symmetry
  const leftMouthDist = Math.abs(leftMouth.x - faceCenterX);
  const rightMouthDist = Math.abs(rightMouth.x - faceCenterX);
  const mouthSymmetry = 1 - Math.abs(leftMouthDist - rightMouthDist) / Math.max(leftMouthDist, rightMouthDist);

  // 4. Jaw Symmetry
  let jawSymmetry = 1;
  if (leftJaw && rightJaw) {
    const leftJawDist = Math.abs(leftJaw.x - faceCenterX);
    const rightJawDist = Math.abs(rightJaw.x - faceCenterX);
    jawSymmetry = 1 - Math.abs(leftJawDist - rightJawDist) / Math.max(leftJawDist, rightJawDist);
  }

  const symmetryScore = (eyeSymmetry * 0.3 + noseSymmetry * 0.2 + mouthSymmetry * 0.3 + jawSymmetry * 0.2);
  return Math.round(symmetryScore * 100) / 10;
}

// Calculate facial proportions score (0-10)
function calculateProportions(landmarks: Landmark[]): number {
  const forehead = getLandmark(landmarks, LANDMARKS.FOREHEAD);
  const chin = getLandmark(landmarks, LANDMARKS.CHIN);
  const noseTip = getLandmark(landmarks, LANDMARKS.NOSE_TIP);
  const bridge = getLandmark(landmarks, LANDMARKS.NOSE_BRIDGE);
  const leftEyeOuter = getLandmark(landmarks, LANDMARKS.LEFT_EYE_OUTER);
  const rightEyeOuter = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_OUTER);

  if (!forehead || !chin || !noseTip || !leftEyeOuter || !rightEyeOuter || !bridge) return 5;

  // Face height
  const totalHeight = distance2D(forehead, chin);

  // 1. Vertical Thirds (Rule of Thirds)
  const middleThird = distance2D(bridge, noseTip);
  const lowerThird = distance2D(noseTip, chin);

  const verticalBalance = 1 - Math.abs(middleThird - lowerThird) / Math.max(middleThird, lowerThird);

  // 2. Eye Spacing (Golden Ratio: 1 eye width apart)
  const leftEyeInner = getLandmark(landmarks, LANDMARKS.LEFT_EYE_INNER);
  const rightEyeInner = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_INNER);
  let eyeSpacingScore = 1;
  if (leftEyeInner && rightEyeInner) {
    const eyeWidth = distance2D(leftEyeOuter, leftEyeInner);
    const interEyeDist = distance2D(leftEyeInner, rightEyeInner);
    const spacingRatio = interEyeDist / eyeWidth;
    eyeSpacingScore = 1 - Math.abs(spacingRatio - 1) / 1.5;
  }

  // 3. Nose Projection (Z-axis depth)
  const projection = Math.abs(noseTip.z - bridge.z);
  const projectionScore = projection >= 0.05 && projection <= 0.10 ? 1 : 0.7;

  const proportionScore = (verticalBalance * 0.5 + eyeSpacingScore * 0.4 + projectionScore * 0.1);
  return Math.round(proportionScore * 100) / 10;
}

// Calculate facial harmony score (0-10)
function calculateHarmony(landmarks: Landmark[], gender: 'female' | 'male' | 'other' | null): number {
  const noseTip = getLandmark(landmarks, LANDMARKS.NOSE_TIP);
  const upperLipTop = getLandmark(landmarks, LANDMARKS.UPPER_LIP_CENTER);
  const upperLipBottom = getLandmark(landmarks, LANDMARKS.UPPER_LIP_BOTTOM);
  const lowerLipTop = getLandmark(landmarks, LANDMARKS.LOWER_LIP_TOP);
  const lowerLipBottom = getLandmark(landmarks, LANDMARKS.LOWER_LIP_CENTER);
  const leftMouth = getLandmark(landmarks, LANDMARKS.LEFT_MOUTH_CORNER);
  const rightMouth = getLandmark(landmarks, LANDMARKS.RIGHT_MOUTH_CORNER);
  const leftWing = getLandmark(landmarks, LANDMARKS.LEFT_WING);
  const rightWing = getLandmark(landmarks, LANDMARKS.RIGHT_WING);

  if (!noseTip || !upperLipTop || !lowerLipBottom || !leftMouth || !rightMouth || !leftWing || !rightWing) return 5;

  // 1. Mouth-to-Nose Ratio (Ideal: 1.5-1.6)
  const mouthWidth = distance2D(leftMouth, rightMouth);
  const noseWidth = distance2D(leftWing, rightWing);
  const mouthNoseRatio = mouthWidth / noseWidth;
  const ratioScore = 1 - Math.abs(mouthNoseRatio - 1.5) / 1.5;

  // 2. Lip Harmony (Upper/Lower Ratio 1:1.6)
  let lipRatioScore = 1;
  if (upperLipBottom && lowerLipTop) {
    const upperHeight = distance2D(upperLipTop, upperLipBottom);
    const lowerHeight = distance2D(lowerLipTop, lowerLipBottom);
    const lipRatio = upperHeight / lowerHeight;
    lipRatioScore = 1 - Math.abs(lipRatio - 0.65) / 1.0;
  }

  // 3. Philtrum Analysis (Distance nose to lips)
  const philtrumLength = distance2D(noseTip, upperLipTop);
  const lowerFaceHeight = distance2D(noseTip, getLandmark(landmarks, LANDMARKS.CHIN)!);
  const philtrumRatio = philtrumLength / lowerFaceHeight;
  const philtrumScore = 1 - Math.abs(philtrumRatio - 0.3) / 0.3;

  // 4. Gender Specific Adjustments
  let genderBonus = 1.0;
  if (gender === 'male') {
    const leftJaw = getLandmark(landmarks, LANDMARKS.LEFT_JAW_ANGLE);
    const rightJaw = getLandmark(landmarks, LANDMARKS.RIGHT_JAW_ANGLE);
    if (leftJaw && rightJaw) {
      const jawWidth = distance2D(leftJaw, rightJaw);
      const faceWidth = distance2D(getLandmark(landmarks, LANDMARKS.LEFT_EYE_OUTER)!, getLandmark(landmarks, LANDMARKS.RIGHT_EYE_OUTER)!);
      const jawRatio = jawWidth / faceWidth;
      genderBonus = jawRatio > 0.85 ? 1.05 : 0.95;
    }
  } else if (gender === 'female') {
    const leftBrow = getLandmark(landmarks, LANDMARKS.LEFT_BROW_INNER);
    const leftEye = getLandmark(landmarks, LANDMARKS.LEFT_EYE_INNER);
    if (leftBrow && leftEye) {
      const browDist = distance2D(leftBrow, leftEye);
      genderBonus = browDist > 20 ? 1.05 : 0.95;
    }
  }

  const harmonyScore = (ratioScore * 0.4 + lipRatioScore * 0.3 + philtrumScore * 0.3) * genderBonus;
  return Math.min(Math.round(harmonyScore * 100) / 10, 10);
}

// Get score label in Turkish
export function getScoreLabelTr(score: number): string {
  if (score >= 9) return 'Olağanüstü';
  if (score >= 8) return 'Çok Çekici';
  if (score >= 7) return 'Çekici';
  if (score >= 6) return 'Ortalamanın Üstünde';
  if (score >= 5) return 'Ortalama';
  if (score >= 4) return 'Ortalamanın Altında';
  return 'Geliştirilebilir';
}

// Get score label in English
export function getScoreLabel(score: number): string {
  if (score >= 9) return 'Exceptional';
  if (score >= 8) return 'Very Attractive';
  if (score >= 7) return 'Attractive';
  if (score >= 6) return 'Above Average';
  if (score >= 5) return 'Average';
  if (score >= 4) return 'Below Average';
  return 'Needs Improvement';
}

// Main function: Calculate overall attractiveness score
export function calculateAttractivenessScore(
  landmarks: Landmark[],
  gender: 'female' | 'male' | 'other' | null = null,
  regionalScores?: RegionalScores  // NEW - optional regional scores from detailed modules
): AttractivenesResult {
  // Validate landmarks
  if (!landmarks || landmarks.length < CONFIDENCE_THRESHOLDS.MIN_LANDMARKS) {
    console.warn('⚠️ Insufficient landmarks for accurate scoring:', landmarks?.length || 0);
    return {
      overallScore: 5,
      scoreLabel: getScoreLabel(5),
      confidence: 0,  // Zero confidence - estimated score
      breakdown: {
        symmetry: 5,
        proportions: 5,
        harmony: 5,
      },
    };
  }

  // Check landmark quality
  const validation = validateLandmarks(landmarks);
  if (!validation.isValid) {
    console.warn('⚠️ Missing critical landmarks:', validation.missingCritical);
  }

  // 1. Normalize for head tilt
  const normalized = normalizeLandmarks(landmarks);

  // 2. Calculate component scores (traditional method)
  const symmetry = calculateSymmetry(normalized);
  const proportions = calculateProportions(normalized);
  const harmony = calculateHarmony(normalized, gender);

  // 3. Calculate overall score using appropriate method
  let overallScore: number;
  let regionalBreakdown: AttractivenesResult['breakdown']['regional'] | undefined;

  if (regionalScores) {
    // NEW METHOD: Use regional scores with penalty system
    console.log('📊 Using regional score integration');

    // Calculate regional contribution (70% weight)
    const regionalAverage =
      regionalScores.nose * SCORING_WEIGHTS.REGIONAL.NOSE +
      regionalScores.eyebrows * SCORING_WEIGHTS.REGIONAL.EYEBROWS +
      regionalScores.eyes * SCORING_WEIGHTS.REGIONAL.EYES +
      regionalScores.jawline * SCORING_WEIGHTS.REGIONAL.JAWLINE +
      regionalScores.lips * SCORING_WEIGHTS.REGIONAL.LIPS;

    const regionalContribution = regionalAverage / SCORING_WEIGHTS.REGIONAL.TOTAL;

    // Calculate general contribution (30% weight)
    const generalAverage =
      symmetry * SCORING_WEIGHTS.GENERAL.SYMMETRY +
      proportions * SCORING_WEIGHTS.GENERAL.PROPORTIONS +
      harmony * SCORING_WEIGHTS.GENERAL.HARMONY;

    const generalContribution = generalAverage;

    // Combine contributions
    const baseScore =
      regionalContribution * SCORING_WEIGHTS.CONTRIBUTION.REGIONAL +
      generalContribution * SCORING_WEIGHTS.CONTRIBUTION.GENERAL;

    // Apply penalty for severe flaws
    const severeFlawCount = [
      regionalScores.nose,
      regionalScores.eyebrows,
      regionalScores.eyes,
      regionalScores.jawline,
      regionalScores.lips,
    ].filter((score) => score < PENALTY_CONFIG.SEVERE_FLAW_THRESHOLD).length;

    let penaltyMultiplier = 1.0;
    if (severeFlawCount > 0) {
      penaltyMultiplier = 1.0 - severeFlawCount * PENALTY_CONFIG.PENALTY_PER_FLAW;
      penaltyMultiplier = Math.max(penaltyMultiplier, PENALTY_CONFIG.MIN_MULTIPLIER);
      console.log(`⚠️ Applying penalty: ${severeFlawCount} severe flaws, multiplier: ${penaltyMultiplier.toFixed(2)}`);
    }

    overallScore = baseScore * penaltyMultiplier;

    // Store regional breakdown
    regionalBreakdown = {
      eyebrows: regionalScores.eyebrows,
      nose: regionalScores.nose,
      eyes: regionalScores.eyes,
      lips: regionalScores.lips,
      jawline: regionalScores.jawline,
      averageRegional: regionalContribution,
      penaltyMultiplier,
    };

    console.log('Regional Contributions:', {
      nose: `${regionalScores.nose}/10 (${SCORING_WEIGHTS.REGIONAL.NOSE * 100}%)`,
      eyebrows: `${regionalScores.eyebrows}/10 (${SCORING_WEIGHTS.REGIONAL.EYEBROWS * 100}%)`,
      eyes: `${regionalScores.eyes}/10 (${SCORING_WEIGHTS.REGIONAL.EYES * 100}%)`,
      jawline: `${regionalScores.jawline}/10 (${SCORING_WEIGHTS.REGIONAL.JAWLINE * 100}%)`,
      lips: `${regionalScores.lips}/10 (${SCORING_WEIGHTS.REGIONAL.LIPS * 100}%)`,
      baseScore: baseScore.toFixed(2),
      penaltyMultiplier: penaltyMultiplier.toFixed(2),
      finalScore: overallScore.toFixed(2),
    });
  } else {
    // LEGACY METHOD: Use traditional calculation (backward compatibility)
    console.log('📊 Using traditional scoring (no regional scores)');
    const weightedAverage =
      symmetry * SCORING_WEIGHTS.GENERAL.SYMMETRY +
      proportions * SCORING_WEIGHTS.GENERAL.PROPORTIONS +
      harmony * SCORING_WEIGHTS.GENERAL.HARMONY;

    overallScore = weightedAverage;
  }

  // Apply calibration (Score Dampening)
  const rawScore = overallScore;
  overallScore = overallScore * SCORE_CALIBRATION.SCORE_MULTIPLIER + SCORE_CALIBRATION.SCORE_OFFSET;

  console.log(`📉 Score Calibration: ${rawScore.toFixed(2)} -> ${overallScore.toFixed(2)} (x${SCORE_CALIBRATION.SCORE_MULTIPLIER})`);

  // Round and clamp score
  overallScore = Math.min(Math.max(Math.round(overallScore * 10) / 10, 0), 10);

  return {
    overallScore,
    scoreLabel: getScoreLabel(overallScore),
    confidence: validation.confidence,
    breakdown: {
      symmetry,
      proportions,
      harmony,
      regional: regionalBreakdown,
    },
  };
}

export default calculateAttractivenessScore;

