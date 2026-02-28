/**
 * Landmark Normalization Module
 *
 * Normalizes facial landmarks to a canonical coordinate system.
 * This allows comparison and averaging of landmarks from multiple photos
 * where the face may be in different positions, rotations, or distances.
 *
 * Normalization Steps:
 * 1. Translation: Move nose tip (P_4) to canvas center (512, 512)
 * 2. Rotation: Rotate so eye line (P_33 → P_263) is horizontal
 * 3. Scale: Normalize so eye distance equals standard value (400px)
 */

import { Point3D, angleBetweenPoints, distance2D } from '../geometry';

// ============================================
// CONSTANTS
// ============================================

/** Canvas size (MediaPipe output is 1024x1024) */
const CANVAS_SIZE = 1024;

/** Target center point for normalized landmarks */
const CENTER_X = CANVAS_SIZE / 2; // 512
const CENTER_Y = CANVAS_SIZE / 2; // 512

/** Target eye distance after normalization */
const TARGET_EYE_DISTANCE = 400;

/** Landmark indices for reference points */
const LANDMARK_INDICES = {
  NOSE_TIP: 4,           // Burun ucu - origin point
  RIGHT_EYE_OUTER: 33,   // Sağ göz dış köşe (ekranda sol)
  LEFT_EYE_OUTER: 263,   // Sol göz dış köşe (ekranda sağ)
} as const;

// ============================================
// TYPES
// ============================================

export interface TransformParams {
  translation: {
    dx: number;
    dy: number;
  };
  rotationAngle: number; // radians
  scale: number;
}

export interface NormalizedLandmarks {
  landmarks: Point3D[];
  transformParams: TransformParams;
  originalFaceWidth: number;
  referencePoints: {
    noseTip: Point3D;
    rightEyeOuter: Point3D;
    leftEyeOuter: Point3D;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract reference landmarks from the full set
 */
function extractReferencePoints(landmarks: Point3D[]): {
  noseTip: Point3D;
  rightEyeOuter: Point3D;
  leftEyeOuter: Point3D;
} {
  const noseTip = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const rightEyeOuter = landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER];
  const leftEyeOuter = landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER];

  if (!noseTip || !rightEyeOuter || !leftEyeOuter) {
    throw new Error('Missing reference landmarks for normalization');
  }

  return { noseTip, rightEyeOuter, leftEyeOuter };
}

/**
 * Calculate the rotation angle needed to make eye line horizontal
 * Returns angle in radians
 */
function calculateRotationAngle(rightEye: Point3D, leftEye: Point3D): number {
  // Angle of eye line from horizontal
  const angleInDegrees = angleBetweenPoints(rightEye, leftEye);
  // Convert to radians and negate to counter-rotate
  return -angleInDegrees * (Math.PI / 180);
}

/**
 * Rotate a point around a center point
 */
function rotatePoint(
  point: Point3D,
  centerX: number,
  centerY: number,
  angleRadians: number
): Point3D {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  // Translate to origin
  const x = point.x - centerX;
  const y = point.y - centerY;

  // Rotate
  const newX = x * cos - y * sin;
  const newY = x * sin + y * cos;

  // Translate back
  return {
    x: newX + centerX,
    y: newY + centerY,
    z: point.z,
    index: point.index,
  };
}

/**
 * Scale a point relative to a center point
 */
function scalePoint(
  point: Point3D,
  centerX: number,
  centerY: number,
  scale: number
): Point3D {
  return {
    x: centerX + (point.x - centerX) * scale,
    y: centerY + (point.y - centerY) * scale,
    z: point.z * scale, // Scale Z as well for consistency
    index: point.index,
  };
}

// ============================================
// MAIN NORMALIZATION FUNCTION
// ============================================

/**
 * Normalize landmarks to a canonical coordinate system
 *
 * Steps:
 * 1. Extract reference points (nose tip, eyes)
 * 2. Calculate eye distance (original face width reference)
 * 3. Calculate rotation angle to make eyes horizontal
 * 4. Translate all points so nose tip is at center (512, 512)
 * 5. Rotate all points around center
 * 6. Scale all points so eye distance = 400px
 *
 * @param landmarks Array of 468 facial landmarks
 * @returns Normalized landmarks with transform parameters
 */
export function normalizeLandmarks(landmarks: Point3D[]): NormalizedLandmarks {
  if (landmarks.length !== 468 && landmarks.length !== 478) {
    throw new Error(`Invalid landmark count: ${landmarks.length}. Expected 468 or 478.`);
  }

  // Step 1: Extract reference points
  const { noseTip, rightEyeOuter, leftEyeOuter } = extractReferencePoints(landmarks);

  // Log reference points
  console.log('📍 [Normalization] Reference Points:', {
    noseTip: `(${noseTip.x.toFixed(1)}, ${noseTip.y.toFixed(1)})`,
    rightEye: `(${rightEyeOuter.x.toFixed(1)}, ${rightEyeOuter.y.toFixed(1)})`,
    leftEye: `(${leftEyeOuter.x.toFixed(1)}, ${leftEyeOuter.y.toFixed(1)})`,
  });

  // Step 2: Calculate original face width (eye distance)
  const originalEyeDistance = distance2D(rightEyeOuter, leftEyeOuter);
  const originalFaceWidth = originalEyeDistance;

  // Step 3: Calculate rotation angle
  const rotationAngle = calculateRotationAngle(rightEyeOuter, leftEyeOuter);

  // Step 4: Calculate translation
  const translation = {
    dx: CENTER_X - noseTip.x,
    dy: CENTER_Y - noseTip.y,
  };

  // Step 5: Calculate scale factor
  const scale = TARGET_EYE_DISTANCE / originalEyeDistance;

  // Apply transformations to all landmarks
  const normalizedLandmarks = landmarks.map((point) => {
    // 1. Translate (move nose tip to center)
    let transformed: Point3D = {
      x: point.x + translation.dx,
      y: point.y + translation.dy,
      z: point.z,
      index: point.index,
    };

    // 2. Rotate around center
    transformed = rotatePoint(transformed, CENTER_X, CENTER_Y, rotationAngle);

    // 3. Scale around center
    transformed = scalePoint(transformed, CENTER_X, CENTER_Y, scale);

    return transformed;
  });

  // Log transformation for debugging
  console.log('🔄 [Normalization] Transform applied:', {
    translation: `dx=${translation.dx.toFixed(2)}, dy=${translation.dy.toFixed(2)}`,
    rotation: `${(rotationAngle * 180 / Math.PI).toFixed(2)}°`,
    scale: scale.toFixed(4),
    originalEyeDistance: originalEyeDistance.toFixed(2),
  });

  // Verify normalization accuracy
  const normalizedNose = normalizedLandmarks[4];
  const normalizedRightEye = normalizedLandmarks[33];
  const normalizedLeftEye = normalizedLandmarks[263];
  const normalizedEyeDistance = distance2D(normalizedRightEye, normalizedLeftEye);

  console.log('✅ [Normalization] Verification:', {
    noseTipNowAt: `(${normalizedNose.x.toFixed(1)}, ${normalizedNose.y.toFixed(1)})`,
    expectedCenter: `(${CENTER_X}, ${CENTER_Y})`,
    centeringError: Math.sqrt(
      Math.pow(normalizedNose.x - CENTER_X, 2) +
      Math.pow(normalizedNose.y - CENTER_Y, 2)
    ).toFixed(2) + 'px',
    eyeDistanceNow: normalizedEyeDistance.toFixed(2),
    expectedEyeDistance: TARGET_EYE_DISTANCE,
    scalingError: Math.abs(normalizedEyeDistance - TARGET_EYE_DISTANCE).toFixed(2) + 'px',
  });

  return {
    landmarks: normalizedLandmarks,
    transformParams: {
      translation,
      rotationAngle,
      scale,
    },
    originalFaceWidth,
    referencePoints: {
      noseTip,
      rightEyeOuter,
      leftEyeOuter,
    },
  };
}

/**
 * Validate that landmarks are suitable for normalization
 * Checks for valid reference points and reasonable values
 */
export function validateLandmarksForNormalization(landmarks: Point3D[]): {
  isValid: boolean;
  error?: string;
} {
  // Check count
  if (landmarks.length !== 468 && landmarks.length !== 478) {
    return {
      isValid: false,
      error: `Invalid landmark count: ${landmarks.length}`,
    };
  }

  // Check reference points exist and have valid coordinates
  try {
    const { noseTip, rightEyeOuter, leftEyeOuter } = extractReferencePoints(landmarks);

    // Check coordinates are within canvas bounds
    const points = [noseTip, rightEyeOuter, leftEyeOuter];
    for (const point of points) {
      if (
        point.x < -100 ||
        point.x > 10000 ||
        point.y < -100 ||
        point.y > 10000
      ) {
        return {
          isValid: false,
          error: 'Reference points out of range'
        };
      }
    }

    // Check eye distance is reasonable (not too small or too large)
    const eyeDistance = distance2D(rightEyeOuter, leftEyeOuter);
    if (eyeDistance < 50) {
      return {
        isValid: false,
        error: 'Face too small or eye distance too short',
      };
    }
    if (eyeDistance > 800) {
      return {
        isValid: false,
        error: 'Face too large or eye distance too wide',
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
