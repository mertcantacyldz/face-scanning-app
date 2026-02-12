/**
 * Relevant Landmark Indices
 *
 * Defines which of the 468 MediaPipe Face Mesh landmarks are used
 * in face analysis calculations. Only these landmarks' variances
 * are considered when computing consistency scores.
 */

/** Landmark indices for each face region (for region-specific analysis) */
export const FACE_REGIONS: Record<string, number[]> = {
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  rightEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  nose: [1, 2, 4, 5, 6, 168, 197, 195, 5, 4, 45, 275, 440, 344, 278, 439],
  lips: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
  leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  rightEyebrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  jawline: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162],
};

/**
 * Pre-computed set of all unique landmark indices used across all face regions.
 * Used to filter variance calculations to only analysis-relevant landmarks.
 */
export const RELEVANT_LANDMARK_INDICES: Set<number> = new Set(
  Object.values(FACE_REGIONS).flat()
);
