// Attractiveness Score Calculator
// Calculates overall attractiveness score from facial landmarks

interface Landmark {
  x: number;
  y: number;
  z: number;
  index: number;
}

interface AttractivenesResult {
  overallScore: number; // 0-10
  scoreLabel: string;
  breakdown: {
    symmetry: number;
    proportions: number;
    harmony: number;
  };
}

// Key landmark indices for measurements
const LANDMARKS = {
  // Face outline
  CHIN: 152,
  FOREHEAD_TOP: 10,
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454,

  // Eyes
  LEFT_EYE_INNER: 133,
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 263,

  // Nose
  NOSE_TIP: 1,
  NOSE_BRIDGE: 6,
  LEFT_NOSTRIL: 129,
  RIGHT_NOSTRIL: 358,

  // Mouth
  UPPER_LIP_CENTER: 0,
  LOWER_LIP_CENTER: 17,
  LEFT_MOUTH_CORNER: 61,
  RIGHT_MOUTH_CORNER: 291,

  // Eyebrows
  LEFT_BROW_INNER: 107,
  LEFT_BROW_OUTER: 70,
  RIGHT_BROW_INNER: 336,
  RIGHT_BROW_OUTER: 300,
};

// Get landmark by index
function getLandmark(landmarks: Landmark[], index: number): Landmark | null {
  return landmarks.find((l) => l.index === index) || null;
}

// Calculate distance between two points
function distance(p1: Landmark, p2: Landmark): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2)
  );
}

// Calculate 2D distance (ignore depth)
function distance2D(p1: Landmark, p2: Landmark): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Calculate facial symmetry score (0-10)
function calculateSymmetry(landmarks: Landmark[]): number {
  const leftEyeInner = getLandmark(landmarks, LANDMARKS.LEFT_EYE_INNER);
  const leftEyeOuter = getLandmark(landmarks, LANDMARKS.LEFT_EYE_OUTER);
  const rightEyeInner = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_INNER);
  const rightEyeOuter = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_OUTER);
  const noseTip = getLandmark(landmarks, LANDMARKS.NOSE_TIP);
  const leftMouth = getLandmark(landmarks, LANDMARKS.LEFT_MOUTH_CORNER);
  const rightMouth = getLandmark(landmarks, LANDMARKS.RIGHT_MOUTH_CORNER);

  if (
    !leftEyeInner ||
    !leftEyeOuter ||
    !rightEyeInner ||
    !rightEyeOuter ||
    !noseTip ||
    !leftMouth ||
    !rightMouth
  ) {
    return 5; // Default if landmarks missing
  }

  // Calculate eye symmetry
  const leftEyeWidth = distance2D(leftEyeInner, leftEyeOuter);
  const rightEyeWidth = distance2D(rightEyeInner, rightEyeOuter);
  const eyeSymmetry = 1 - Math.abs(leftEyeWidth - rightEyeWidth) / Math.max(leftEyeWidth, rightEyeWidth);

  // Calculate nose alignment (deviation from center)
  const faceCenter = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const noseDeviation = Math.abs(noseTip.x - faceCenter) / (rightEyeOuter.x - leftEyeOuter.x);
  const noseSymmetry = 1 - Math.min(noseDeviation * 2, 1);

  // Calculate mouth symmetry
  const leftMouthDist = distance2D(noseTip, leftMouth);
  const rightMouthDist = distance2D(noseTip, rightMouth);
  const mouthSymmetry = 1 - Math.abs(leftMouthDist - rightMouthDist) / Math.max(leftMouthDist, rightMouthDist);

  // Weighted average
  const symmetryScore = eyeSymmetry * 0.4 + noseSymmetry * 0.3 + mouthSymmetry * 0.3;

  return Math.round(symmetryScore * 10 * 10) / 10;
}

// Calculate facial proportions score (0-10)
function calculateProportions(landmarks: Landmark[]): number {
  const foreheadTop = getLandmark(landmarks, LANDMARKS.FOREHEAD_TOP);
  const chin = getLandmark(landmarks, LANDMARKS.CHIN);
  const noseTip = getLandmark(landmarks, LANDMARKS.NOSE_TIP);
  const leftEyeOuter = getLandmark(landmarks, LANDMARKS.LEFT_EYE_OUTER);
  const rightEyeOuter = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_OUTER);
  const upperLip = getLandmark(landmarks, LANDMARKS.UPPER_LIP_CENTER);

  if (!foreheadTop || !chin || !noseTip || !leftEyeOuter || !rightEyeOuter || !upperLip) {
    return 5;
  }

  // Face height
  const faceHeight = distance2D(foreheadTop, chin);

  // Thirds of face (ideal: equal thirds)
  const upperThird = distance2D(foreheadTop, { ...leftEyeOuter, y: (leftEyeOuter.y + rightEyeOuter.y) / 2 } as Landmark);
  const middleThird = distance2D({ ...leftEyeOuter, y: (leftEyeOuter.y + rightEyeOuter.y) / 2 } as Landmark, noseTip);
  const lowerThird = distance2D(noseTip, chin);

  const idealThird = faceHeight / 3;
  const upperDeviation = Math.abs(upperThird - idealThird) / idealThird;
  const middleDeviation = Math.abs(middleThird - idealThird) / idealThird;
  const lowerDeviation = Math.abs(lowerThird - idealThird) / idealThird;

  const thirdsScore = 1 - (upperDeviation + middleDeviation + lowerDeviation) / 3;

  // Eye spacing (ideal: one eye width between eyes)
  const leftEyeInner = getLandmark(landmarks, LANDMARKS.LEFT_EYE_INNER);
  const rightEyeInner = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_INNER);

  if (leftEyeInner && rightEyeInner) {
    const eyeWidth = distance2D(leftEyeOuter, leftEyeInner);
    const eyeSpacing = distance2D(leftEyeInner, rightEyeInner);
    const spacingRatio = eyeSpacing / eyeWidth;
    const idealSpacingScore = 1 - Math.abs(spacingRatio - 1) / 2;

    return Math.round((thirdsScore * 0.6 + idealSpacingScore * 0.4) * 10 * 10) / 10;
  }

  return Math.round(thirdsScore * 10 * 10) / 10;
}

// Calculate facial harmony score (0-10)
function calculateHarmony(landmarks: Landmark[]): number {
  const noseTip = getLandmark(landmarks, LANDMARKS.NOSE_TIP);
  const chin = getLandmark(landmarks, LANDMARKS.CHIN);
  const leftMouth = getLandmark(landmarks, LANDMARKS.LEFT_MOUTH_CORNER);
  const rightMouth = getLandmark(landmarks, LANDMARKS.RIGHT_MOUTH_CORNER);
  const upperLip = getLandmark(landmarks, LANDMARKS.UPPER_LIP_CENTER);
  const lowerLip = getLandmark(landmarks, LANDMARKS.LOWER_LIP_CENTER);

  if (!noseTip || !chin || !leftMouth || !rightMouth || !upperLip || !lowerLip) {
    return 5;
  }

  // Mouth width to nose width ratio (ideal: ~1.5)
  const leftNostril = getLandmark(landmarks, LANDMARKS.LEFT_NOSTRIL);
  const rightNostril = getLandmark(landmarks, LANDMARKS.RIGHT_NOSTRIL);

  if (leftNostril && rightNostril) {
    const mouthWidth = distance2D(leftMouth, rightMouth);
    const noseWidth = distance2D(leftNostril, rightNostril);
    const mouthNoseRatio = mouthWidth / noseWidth;
    const idealRatioScore = 1 - Math.abs(mouthNoseRatio - 1.5) / 1.5;

    // Lip ratio (ideal: lower lip slightly fuller)
    const upperLipHeight = distance2D(noseTip, upperLip);
    const lowerLipHeight = distance2D(lowerLip, chin);

    // Chin position
    const faceCenter = (leftMouth.x + rightMouth.x) / 2;
    const chinDeviation = Math.abs(chin.x - faceCenter);
    const chinScore = 1 - Math.min(chinDeviation * 10, 1);

    return Math.round((idealRatioScore * 0.5 + chinScore * 0.5) * 10 * 10) / 10;
  }

  return 5;
}

// Get score label
function getScoreLabel(score: number): string {
  if (score >= 9) return 'Exceptional';
  if (score >= 8) return 'Very Attractive';
  if (score >= 7) return 'Attractive';
  if (score >= 6) return 'Above Average';
  if (score >= 5) return 'Average';
  if (score >= 4) return 'Below Average';
  return 'Needs Improvement';
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

// Main function: Calculate overall attractiveness score
export function calculateAttractivenessScore(landmarks: Landmark[]): AttractivenesResult {
  if (!landmarks || landmarks.length < 400) {
    return {
      overallScore: 5,
      scoreLabel: 'Average',
      breakdown: {
        symmetry: 5,
        proportions: 5,
        harmony: 5,
      },
    };
  }

  const symmetry = calculateSymmetry(landmarks);
  const proportions = calculateProportions(landmarks);
  const harmony = calculateHarmony(landmarks);

  // Weighted average for overall score
  const overallScore =
    Math.round((symmetry * 0.4 + proportions * 0.35 + harmony * 0.25) * 10) / 10;

  return {
    overallScore,
    scoreLabel: getScoreLabel(overallScore),
    breakdown: {
      symmetry,
      proportions,
      harmony,
    },
  };
}

export default calculateAttractivenessScore;
