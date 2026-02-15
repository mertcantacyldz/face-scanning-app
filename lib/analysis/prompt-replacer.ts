/**
 * Prompt Template Variable Replacer
 * Replaces template variables in region prompts with calculated metrics
 */

import { METRIC_TRANSLATIONS, type FaceRegion, type SupportedLanguage } from '@/lib/face-prompts';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface NoseMetrics {
  tipDeviation: number;
  tipDeviationRatio: number;
  tipDirection: string;
  tipScore: number;
  noseWidth: number;
  noseWidthRatio: number;
  widthScore: number;
  widthAssessment: string;
  noseLength: number;
  noseLengthRatio: number;
  lengthScore: number;
  lengthAssessment: string;
  bridgeDeviation: number;
  bridgeDeviationRatio: number;
  bridgeStraightnessScore: number;
  bridgeAssessment: string;
  geometricTilt?: number;
  geometricTiltDirection?: string;
  positionalDeviation?: number;
  positionalDeviationDirection?: string;
  combinedRotation?: number;
  combinedRotationDirection?: string;
  combinedRotationScore?: number;
  proportionScore?: number;
  overallScore: number;
  asymmetryLevel: string;
}

export interface EyesMetrics {
  leftEyeWidth: number;
  leftEyeHeight: number;
  leftEyeArea: number;
  rightEyeWidth: number;
  rightEyeHeight: number;
  rightEyeArea: number;
  widthDifference: number;
  widthDifferenceRatio: number;
  heightDifference: number;
  heightDifferenceRatio: number;
  areaDifference: number;
  areaDifferenceRatio: number;
  sizeSymmetryScore: number;
  leftEyeCenterX: number;
  leftEyeCenterY: number;
  rightEyeCenterX: number;
  rightEyeCenterY: number;
  verticalMisalignment: number;
  verticalMisalignmentRatio: number;
  horizontalAsymmetry: number;
  positionSymmetryScore: number;
  interEyeDistance: number;
  interEyeDistanceRatio: number;
  interEyeAssessment: string;
  interEyeScore: number;
  leftEyeRatio: number;
  leftCanthalTilt: number;
  leftCanthalTiltDirection: string;
  rightEyeRatio: number;
  rightCanthalTilt: number;
  rightCanthalTiltDirection: string;
  tiltAsymmetry: number;
  shapeSymmetryScore: number;
  leftBrowEyeDistance: number;
  rightBrowEyeDistance: number;
  browEyeAsymmetry: number;
  browEyeAsymmetryRatio: number;
  browEyeScore: number;
  leftUpperLidExposure: number;
  rightUpperLidExposure: number;
  upperLidAsymmetry: number;
  upperLidAsymmetryRatio: number;
  lowerLidAsymmetry: number;
  lowerLidAsymmetryRatio: number;
  eyelidScore: number;
  depthDifference: number;
  depthScore: number;
  overallScore: number;
  asymmetryLevel: string;
}

export interface LipsMetrics {
  leftCornerX: number;
  leftCornerY: number;
  rightCornerX: number;
  rightCornerY: number;
  cornerYDifference: number;
  cornerYDifferenceRatio: number;
  lipLineTilt: number;
  lipLineTiltDirection: string;
  cornerAlignmentScore: number;
  lipWidth: number;
  lipWidthRatio: number;
  leftHalfWidth: number;
  rightHalfWidth: number;
  widthAsymmetry: number;
  widthAsymmetryRatio: number;
  lipWidthSymmetryScore: number;
  lipCenterDeviation: number;
  lipCenterDeviationRatio: number;
  lipCenterScore: number;
  leftUpperLipHeight: number;
  rightUpperLipHeight: number;
  upperLipHeightDifference: number;
  upperLipHeightDifferenceRatio: number;
  upperLipSymmetryScore: number;
  leftLowerLipHeight: number;
  rightLowerLipHeight: number;
  lowerLipHeightDifference: number;
  lowerLipHeightDifferenceRatio: number;
  lowerLipSymmetryScore: number;
  leftCupidBowHeight: number;
  rightCupidBowHeight: number;
  cupidBowDifference: number;
  cupidBowDifferenceRatio: number;
  cupidBowPresence: boolean;
  cupidBowSymmetryScore: number;
  upperLipHeight: number;
  lowerLipHeight: number;
  totalLipHeight: number;
  upperLowerRatio: number;
  ratioAssessment: string;
  upperLowerRatioScore: number;
  leftLineY: number;
  rightLineY: number;
  lineYDifference: number;
  lineYDifferenceRatio: number;
  lineSymmetryScore: number;
  depthDifference: number;
  depthScore: number;
  overallScore: number;
  asymmetryLevel: string;
}

export interface JawlineMetrics {
  chinTipX: number;
  chinTipY: number;
  faceCenterX: number;
  chinDeviation: number;
  chinDeviationRatio: number;
  chinDirection: string;
  chinCenteringScore: number;
  leftJawLength: number;
  rightJawLength: number;
  jawLengthDifference: number;
  jawLengthDifferenceRatio: number;
  leftJawAngleY: number;
  rightJawAngleY: number;
  jawAngleYDifference: number;
  jawlineSymmetryScore: number;
  leftJawAngle: number;
  rightJawAngle: number;
  jawAngleDifference: number;
  jawAngleSymmetryScore: number;
  jawWidth: number;
  faceWidth: number;
  jawWidthRatio: number;
  jawWidthAssessment: string;
  jawWidthScore: number;
  noseToChinDistance: number;
  expectedChinY: number;
  verticalDeviation: number;
  verticalAlignmentScore: number;
  faceHeight: number;
  overallScore: number;
  asymmetryLevel: string;
}

export interface EyebrowsMetrics {
  leftBrowHighestY: number;
  rightBrowHighestY: number;
  browHeightDifference: number;
  browHeightDifferenceRatio: number;
  browHeightDirection: string;
  browHeightSymmetryScore: number;
  leftArchHeight: number;
  rightArchHeight: number;
  archHeightDifference: number;
  archHeightDifferenceRatio: number;
  archHeightSymmetryScore: number;
  leftBrowEyeDistance: number;
  rightBrowEyeDistance: number;
  browEyeDistanceAsymmetry: number;
  browEyeDistanceRatio: number;
  browEyeDistanceAssessment: string;
  browEyeDistanceScore: number;
  innerCornerDistance: number;
  leftInnerCornerDistance: number;
  rightInnerCornerDistance: number;
  innerCornerDistanceAsymmetry: number;
  innerCornerDistanceRatio: number;
  innerCornerAssessment: string;
  innerCornerDistanceScore: number;
  leftBrowAngle: number;
  rightBrowAngle: number;
  browAngleDifference: number;
  browAngleSymmetryScore: number;
  leftBrowThickness: number;
  rightBrowThickness: number;
  browThicknessDifference: number;
  browThicknessDifferenceRatio: number;
  browThicknessSymmetryScore: number;
  leftBrowLength: number;
  rightBrowLength: number;
  browLengthDifference: number;
  browLengthDifferenceRatio: number;
  browLengthSymmetryScore: number;
  leftBrowScore: number;
  rightBrowScore: number;
  leftBrowDirection: string;
  rightBrowDirection: string;
  faceHeight: number;
  overallScore: number;
  asymmetryLevel: string;
}

// ============================================
// REPLACEMENT FUNCTIONS
// ============================================

/**
 * Replace nose metric variables in prompt
 */
export function replaceNoseMetrics(prompt: string, metrics: NoseMetrics): string {
  return prompt
    .replace(/{tipDeviation}/g, metrics.tipDeviation.toFixed(2))
    .replace(/{tipDeviationRatio}/g, metrics.tipDeviationRatio.toFixed(2))
    .replace(/{tipDirection}/g, metrics.tipDirection)
    .replace(/{tipScore}/g, metrics.tipScore.toString())
    .replace(/{noseWidth}/g, metrics.noseWidth.toFixed(2))
    .replace(/{noseWidthRatio}/g, metrics.noseWidthRatio.toFixed(2))
    .replace(/{widthScore}/g, metrics.widthScore.toString())
    .replace(/{widthAssessment}/g, metrics.widthAssessment)
    .replace(/{noseLength}/g, metrics.noseLength.toFixed(2))
    .replace(/{noseLengthRatio}/g, metrics.noseLengthRatio.toFixed(2))
    .replace(/{lengthScore}/g, metrics.lengthScore.toString())
    .replace(/{lengthAssessment}/g, metrics.lengthAssessment)
    .replace(/{bridgeDeviation}/g, metrics.bridgeDeviation.toFixed(2))
    .replace(/{bridgeDeviationRatio}/g, metrics.bridgeDeviationRatio.toFixed(2))
    .replace(/{bridgeStraightnessScore}/g, metrics.bridgeStraightnessScore.toString())
    .replace(/{bridgeAssessment}/g, metrics.bridgeAssessment)
    .replace(/{geometricTilt}/g, (metrics.geometricTilt ?? 0).toFixed(2))
    .replace(/{geometricTiltDirection}/g, metrics.geometricTiltDirection ?? 'CENTERED')
    .replace(/{positionalDeviation}/g, (metrics.positionalDeviation ?? 0).toFixed(2))
    .replace(/{positionalDeviationDirection}/g, metrics.positionalDeviationDirection ?? 'CENTERED')
    .replace(/{combinedRotation}/g, (metrics.combinedRotation ?? 0).toFixed(2))
    .replace(/{combinedRotationDirection}/g, metrics.combinedRotationDirection ?? 'CENTERED')
    .replace(/{combinedRotationScore}/g, (metrics.combinedRotationScore ?? 0).toString())
    .replace(/{proportionScore}/g, (metrics.proportionScore ?? 0).toString())
    .replace(/{overallScore}/g, metrics.overallScore.toString())
    .replace(/{asymmetryLevel}/g, metrics.asymmetryLevel);
}

/**
 * Replace eyes metric variables in prompt
 */
export function replaceEyesMetrics(prompt: string, metrics: EyesMetrics): string {
  return prompt
    // Size symmetry
    .replace(/{leftEyeWidth}/g, metrics.leftEyeWidth.toFixed(2))
    .replace(/{leftEyeHeight}/g, metrics.leftEyeHeight.toFixed(2))
    .replace(/{leftEyeArea}/g, metrics.leftEyeArea.toFixed(2))
    .replace(/{rightEyeWidth}/g, metrics.rightEyeWidth.toFixed(2))
    .replace(/{rightEyeHeight}/g, metrics.rightEyeHeight.toFixed(2))
    .replace(/{rightEyeArea}/g, metrics.rightEyeArea.toFixed(2))
    .replace(/{widthDifference}/g, metrics.widthDifference.toFixed(2))
    .replace(/{widthDifferenceRatio}/g, metrics.widthDifferenceRatio.toFixed(2))
    .replace(/{heightDifference}/g, metrics.heightDifference.toFixed(2))
    .replace(/{heightDifferenceRatio}/g, metrics.heightDifferenceRatio.toFixed(2))
    .replace(/{areaDifference}/g, metrics.areaDifference.toFixed(2))
    .replace(/{areaDifferenceRatio}/g, metrics.areaDifferenceRatio.toFixed(2))
    .replace(/{sizeSymmetryScore}/g, metrics.sizeSymmetryScore.toString())
    // Position symmetry
    .replace(/{leftEyeCenterX}/g, metrics.leftEyeCenterX.toFixed(2))
    .replace(/{leftEyeCenterY}/g, metrics.leftEyeCenterY.toFixed(2))
    .replace(/{rightEyeCenterX}/g, metrics.rightEyeCenterX.toFixed(2))
    .replace(/{rightEyeCenterY}/g, metrics.rightEyeCenterY.toFixed(2))
    .replace(/{verticalMisalignment}/g, metrics.verticalMisalignment.toFixed(2))
    .replace(/{verticalMisalignmentRatio}/g, metrics.verticalMisalignmentRatio.toFixed(2))
    .replace(/{horizontalAsymmetry}/g, metrics.horizontalAsymmetry.toFixed(2))
    .replace(/{positionSymmetryScore}/g, metrics.positionSymmetryScore.toString())
    // Inter-eye distance
    .replace(/{interEyeDistance}/g, metrics.interEyeDistance.toFixed(2))
    .replace(/{interEyeDistanceRatio}/g, metrics.interEyeDistanceRatio.toFixed(2))
    .replace(/{interEyeAssessment}/g, metrics.interEyeAssessment)
    .replace(/{interEyeScore}/g, metrics.interEyeScore.toString())
    // Shape & canthal tilt
    .replace(/{leftEyeRatio}/g, metrics.leftEyeRatio.toFixed(3))
    .replace(/{leftCanthalTilt}/g, metrics.leftCanthalTilt.toFixed(2))
    .replace(/{leftCanthalTiltDirection}/g, metrics.leftCanthalTiltDirection)
    .replace(/{rightEyeRatio}/g, metrics.rightEyeRatio.toFixed(3))
    .replace(/{rightCanthalTilt}/g, metrics.rightCanthalTilt.toFixed(2))
    .replace(/{rightCanthalTiltDirection}/g, metrics.rightCanthalTiltDirection)
    .replace(/{tiltAsymmetry}/g, metrics.tiltAsymmetry.toFixed(2))
    .replace(/{shapeSymmetryScore}/g, metrics.shapeSymmetryScore.toString())
    // Eyebrow-to-eye distance
    .replace(/{leftBrowEyeDistance}/g, metrics.leftBrowEyeDistance.toFixed(2))
    .replace(/{rightBrowEyeDistance}/g, metrics.rightBrowEyeDistance.toFixed(2))
    .replace(/{browEyeAsymmetry}/g, metrics.browEyeAsymmetry.toFixed(2))
    .replace(/{browEyeAsymmetryRatio}/g, metrics.browEyeAsymmetryRatio.toFixed(2))
    .replace(/{browEyeScore}/g, metrics.browEyeScore.toString())
    // Eyelid analysis
    .replace(/{leftUpperLidExposure}/g, metrics.leftUpperLidExposure.toFixed(2))
    .replace(/{rightUpperLidExposure}/g, metrics.rightUpperLidExposure.toFixed(2))
    .replace(/{upperLidAsymmetry}/g, metrics.upperLidAsymmetry.toFixed(2))
    .replace(/{upperLidAsymmetryRatio}/g, metrics.upperLidAsymmetryRatio.toFixed(2))
    .replace(/{lowerLidAsymmetry}/g, metrics.lowerLidAsymmetry.toFixed(2))
    .replace(/{lowerLidAsymmetryRatio}/g, metrics.lowerLidAsymmetryRatio.toFixed(2))
    .replace(/{eyelidScore}/g, metrics.eyelidScore.toString())
    // 3D depth
    .replace(/{depthDifference}/g, metrics.depthDifference.toFixed(3))
    .replace(/{depthScore}/g, metrics.depthScore.toString())
    // Overall
    .replace(/{overallScore}/g, metrics.overallScore.toString())
    .replace(/{asymmetryLevel}/g, metrics.asymmetryLevel);
}

/**
 * Replace lips metric variables in prompt
 */
export function replaceLipsMetrics(prompt: string, metrics: LipsMetrics): string {
  return prompt
    // Corner alignment
    .replace(/{leftCornerX}/g, metrics.leftCornerX.toFixed(2))
    .replace(/{leftCornerY}/g, metrics.leftCornerY.toFixed(2))
    .replace(/{rightCornerX}/g, metrics.rightCornerX.toFixed(2))
    .replace(/{rightCornerY}/g, metrics.rightCornerY.toFixed(2))
    .replace(/{cornerYDifference}/g, metrics.cornerYDifference.toFixed(2))
    .replace(/{cornerYDifferenceRatio}/g, metrics.cornerYDifferenceRatio.toFixed(2))
    .replace(/{lipLineTilt}/g, metrics.lipLineTilt.toFixed(2))
    .replace(/{lipLineTiltDirection}/g, metrics.lipLineTiltDirection)
    .replace(/{cornerAlignmentScore}/g, metrics.cornerAlignmentScore.toString())
    // Width symmetry
    .replace(/{lipWidth}/g, metrics.lipWidth.toFixed(2))
    .replace(/{lipWidthRatio}/g, metrics.lipWidthRatio.toFixed(2))
    .replace(/{leftHalfWidth}/g, metrics.leftHalfWidth.toFixed(2))
    .replace(/{rightHalfWidth}/g, metrics.rightHalfWidth.toFixed(2))
    .replace(/{widthAsymmetry}/g, metrics.widthAsymmetry.toFixed(2))
    .replace(/{widthAsymmetryRatio}/g, metrics.widthAsymmetryRatio.toFixed(2))
    .replace(/{lipWidthSymmetryScore}/g, metrics.lipWidthSymmetryScore.toString())
    .replace(/{lipCenterDeviation}/g, metrics.lipCenterDeviation.toFixed(2))
    .replace(/{lipCenterDeviationRatio}/g, metrics.lipCenterDeviationRatio.toFixed(2))
    .replace(/{lipCenterScore}/g, metrics.lipCenterScore.toString())
    // Upper lip symmetry
    .replace(/{leftUpperLipHeight}/g, metrics.leftUpperLipHeight.toFixed(2))
    .replace(/{rightUpperLipHeight}/g, metrics.rightUpperLipHeight.toFixed(2))
    .replace(/{upperLipHeightDifference}/g, metrics.upperLipHeightDifference.toFixed(2))
    .replace(/{upperLipHeightDifferenceRatio}/g, metrics.upperLipHeightDifferenceRatio.toFixed(2))
    .replace(/{upperLipSymmetryScore}/g, metrics.upperLipSymmetryScore.toString())
    // Lower lip symmetry
    .replace(/{leftLowerLipHeight}/g, metrics.leftLowerLipHeight.toFixed(2))
    .replace(/{rightLowerLipHeight}/g, metrics.rightLowerLipHeight.toFixed(2))
    .replace(/{lowerLipHeightDifference}/g, metrics.lowerLipHeightDifference.toFixed(2))
    .replace(/{lowerLipHeightDifferenceRatio}/g, metrics.lowerLipHeightDifferenceRatio.toFixed(2))
    .replace(/{lowerLipSymmetryScore}/g, metrics.lowerLipSymmetryScore.toString())
    // Cupid's bow
    .replace(/{leftCupidBowHeight}/g, metrics.leftCupidBowHeight.toFixed(2))
    .replace(/{rightCupidBowHeight}/g, metrics.rightCupidBowHeight.toFixed(2))
    .replace(/{cupidBowDifference}/g, metrics.cupidBowDifference.toFixed(2))
    .replace(/{cupidBowDifferenceRatio}/g, metrics.cupidBowDifferenceRatio.toFixed(2))
    .replace(/{cupidBowPresence}/g, metrics.cupidBowPresence.toString())
    .replace(/{cupidBowSymmetryScore}/g, metrics.cupidBowSymmetryScore.toString())
    // Upper/lower ratio
    .replace(/{upperLipHeight}/g, metrics.upperLipHeight.toFixed(2))
    .replace(/{lowerLipHeight}/g, metrics.lowerLipHeight.toFixed(2))
    .replace(/{totalLipHeight}/g, metrics.totalLipHeight.toFixed(2))
    .replace(/{upperLowerRatio}/g, metrics.upperLowerRatio.toFixed(3))
    .replace(/{ratioAssessment}/g, metrics.ratioAssessment)
    .replace(/{upperLowerRatioScore}/g, metrics.upperLowerRatioScore.toString())
    // Vermillion border
    .replace(/{leftLineY}/g, metrics.leftLineY.toFixed(2))
    .replace(/{rightLineY}/g, metrics.rightLineY.toFixed(2))
    .replace(/{lineYDifference}/g, metrics.lineYDifference.toFixed(2))
    .replace(/{lineYDifferenceRatio}/g, metrics.lineYDifferenceRatio.toFixed(2))
    .replace(/{lineSymmetryScore}/g, metrics.lineSymmetryScore.toString())
    // 3D depth
    .replace(/{depthDifference}/g, metrics.depthDifference.toFixed(3))
    .replace(/{depthScore}/g, metrics.depthScore.toString())
    // Overall
    .replace(/{overallScore}/g, metrics.overallScore.toString())
    .replace(/{asymmetryLevel}/g, metrics.asymmetryLevel);
}

/**
 * Replace jawline metric variables in prompt
 */
export function replaceJawlineMetrics(prompt: string, metrics: JawlineMetrics): string {
  return prompt
    // Chin centering
    .replace(/{chinTipX}/g, metrics.chinTipX.toFixed(2))
    .replace(/{chinTipY}/g, metrics.chinTipY.toFixed(2))
    .replace(/{faceCenterX}/g, metrics.faceCenterX.toFixed(2))
    .replace(/{chinDeviation}/g, metrics.chinDeviation.toFixed(2))
    .replace(/{chinDeviationRatio}/g, metrics.chinDeviationRatio.toFixed(2))
    .replace(/{chinDirection}/g, metrics.chinDirection)
    .replace(/{chinCenteringScore}/g, metrics.chinCenteringScore.toString())
    // Jawline symmetry
    .replace(/{leftJawLength}/g, metrics.leftJawLength.toFixed(2))
    .replace(/{rightJawLength}/g, metrics.rightJawLength.toFixed(2))
    .replace(/{jawLengthDifference}/g, metrics.jawLengthDifference.toFixed(2))
    .replace(/{jawLengthDifferenceRatio}/g, metrics.jawLengthDifferenceRatio.toFixed(2))
    .replace(/{leftJawAngleY}/g, metrics.leftJawAngleY.toFixed(2))
    .replace(/{rightJawAngleY}/g, metrics.rightJawAngleY.toFixed(2))
    .replace(/{jawAngleYDifference}/g, metrics.jawAngleYDifference.toFixed(2))
    .replace(/{jawlineSymmetryScore}/g, metrics.jawlineSymmetryScore.toString())
    // Jaw angle symmetry
    .replace(/{leftJawAngle}/g, metrics.leftJawAngle.toFixed(2))
    .replace(/{rightJawAngle}/g, metrics.rightJawAngle.toFixed(2))
    .replace(/{jawAngleDifference}/g, metrics.jawAngleDifference.toFixed(2))
    .replace(/{jawAngleSymmetryScore}/g, metrics.jawAngleSymmetryScore.toString())
    // Jaw width
    .replace(/{jawWidth}/g, metrics.jawWidth.toFixed(2))
    .replace(/{faceWidth}/g, metrics.faceWidth.toFixed(2))
    .replace(/{jawWidthRatio}/g, metrics.jawWidthRatio.toFixed(2))
    .replace(/{jawWidthAssessment}/g, metrics.jawWidthAssessment)
    .replace(/{jawWidthScore}/g, metrics.jawWidthScore.toString())
    // Vertical alignment
    .replace(/{noseToChinDistance}/g, metrics.noseToChinDistance.toFixed(2))
    .replace(/{expectedChinY}/g, metrics.expectedChinY.toFixed(2))
    .replace(/{verticalDeviation}/g, metrics.verticalDeviation.toFixed(2))
    .replace(/{verticalAlignmentScore}/g, metrics.verticalAlignmentScore.toString())
    // Overall & metadata
    .replace(/{faceHeight}/g, metrics.faceHeight.toFixed(2))
    .replace(/{overallScore}/g, metrics.overallScore.toString())
    .replace(/{asymmetryLevel}/g, metrics.asymmetryLevel);
}

/**
 * Replace eyebrows metric variables in prompt
 */
export function replaceEyebrowsMetrics(prompt: string, metrics: EyebrowsMetrics): string {
  return prompt
    // Brow height symmetry
    .replace(/{leftBrowHighestY}/g, metrics.leftBrowHighestY.toFixed(2))
    .replace(/{rightBrowHighestY}/g, metrics.rightBrowHighestY.toFixed(2))
    .replace(/{browHeightDifference}/g, metrics.browHeightDifference.toFixed(2))
    .replace(/{browHeightDifferenceRatio}/g, metrics.browHeightDifferenceRatio.toFixed(2))
    .replace(/{browHeightDirection}/g, metrics.browHeightDirection || 'EQUAL')
    .replace(/{browHeightSymmetryScore}/g, metrics.browHeightSymmetryScore.toString())
    // Arch height symmetry
    .replace(/{leftArchHeight}/g, metrics.leftArchHeight.toFixed(2))
    .replace(/{rightArchHeight}/g, metrics.rightArchHeight.toFixed(2))
    .replace(/{archHeightDifference}/g, metrics.archHeightDifference.toFixed(2))
    .replace(/{archHeightDifferenceRatio}/g, metrics.archHeightDifferenceRatio.toFixed(2))
    .replace(/{archHeightSymmetryScore}/g, metrics.archHeightSymmetryScore.toString())
    // Brow-eye distance
    .replace(/{leftBrowEyeDistance}/g, metrics.leftBrowEyeDistance.toFixed(2))
    .replace(/{rightBrowEyeDistance}/g, metrics.rightBrowEyeDistance.toFixed(2))
    .replace(/{browEyeDistanceAsymmetry}/g, metrics.browEyeDistanceAsymmetry.toFixed(2))
    .replace(/{browEyeDistanceRatio}/g, metrics.browEyeDistanceRatio.toFixed(2))
    .replace(/{browEyeDistanceAssessment}/g, metrics.browEyeDistanceAssessment)
    .replace(/{browEyeDistanceScore}/g, metrics.browEyeDistanceScore.toString())
    // Inner corner distance
    .replace(/{innerCornerDistance}/g, metrics.innerCornerDistance.toFixed(2))
    .replace(/{leftInnerCornerDistance}/g, metrics.leftInnerCornerDistance.toFixed(2))
    .replace(/{rightInnerCornerDistance}/g, metrics.rightInnerCornerDistance.toFixed(2))
    .replace(/{innerCornerDistanceAsymmetry}/g, metrics.innerCornerDistanceAsymmetry.toFixed(2))
    .replace(/{innerCornerDistanceRatio}/g, metrics.innerCornerDistanceRatio.toFixed(2))
    .replace(/{innerCornerAssessment}/g, metrics.innerCornerAssessment)
    .replace(/{innerCornerDistanceAssessment}/g, metrics.innerCornerAssessment)
    .replace(/{innerCornerDistanceScore}/g, metrics.innerCornerDistanceScore.toString())
    // Brow angle
    .replace(/{leftBrowAngle}/g, metrics.leftBrowAngle.toFixed(2))
    .replace(/{rightBrowAngle}/g, metrics.rightBrowAngle.toFixed(2))
    .replace(/{browAngleDifference}/g, metrics.browAngleDifference.toFixed(2))
    .replace(/{browAngleSymmetryScore}/g, metrics.browAngleSymmetryScore.toString())
    // Brow thickness
    .replace(/{leftBrowThickness}/g, metrics.leftBrowThickness.toFixed(2))
    .replace(/{rightBrowThickness}/g, metrics.rightBrowThickness.toFixed(2))
    .replace(/{browThicknessDifference}/g, metrics.browThicknessDifference.toFixed(2))
    .replace(/{browThicknessDifferenceRatio}/g, metrics.browThicknessDifferenceRatio.toFixed(2))
    .replace(/{browThicknessSymmetryScore}/g, metrics.browThicknessSymmetryScore.toString())
    // Brow length
    .replace(/{leftBrowLength}/g, metrics.leftBrowLength.toFixed(2))
    .replace(/{rightBrowLength}/g, metrics.rightBrowLength.toFixed(2))
    .replace(/{browLengthDifference}/g, metrics.browLengthDifference.toFixed(2))
    .replace(/{browLengthDifferenceRatio}/g, metrics.browLengthDifferenceRatio.toFixed(2))
    .replace(/{browLengthSymmetryScore}/g, metrics.browLengthSymmetryScore.toString())
    // Individual brow scores & directions
    .replace(/{leftBrowScore}/g, metrics.leftBrowScore.toString())
    .replace(/{rightBrowScore}/g, metrics.rightBrowScore.toString())
    .replace(/{leftBrowDirection}/g, metrics.leftBrowDirection)
    .replace(/{rightBrowDirection}/g, metrics.rightBrowDirection)
    // Overall & metadata
    .replace(/{faceHeight}/g, metrics.faceHeight.toFixed(2))
    .replace(/{overallScore}/g, metrics.overallScore.toString())
    .replace(/{asymmetryLevel}/g, metrics.asymmetryLevel);
}

/**
 * Replace language-specific label placeholders
 */
export function replaceLanguageLabels(prompt: string, language: SupportedLanguage): string {
  const labels = METRIC_TRANSLATIONS[language] || METRIC_TRANSLATIONS.en;

  return prompt
    // Units
    .replace(/{unit_pixels}/g, labels.pixels)
    .replace(/{unit_degrees}/g, labels.degrees)
    // Eyebrow labels
    .replace(/{label_height_difference}/g, labels.height_difference)
    .replace(/{label_arch_difference}/g, labels.arch_difference)
    .replace(/{label_angle_difference}/g, labels.angle_difference)
    // Eye labels
    .replace(/{label_width_difference}/g, labels.width_difference)
    .replace(/{label_vertical_misalignment}/g, labels.vertical_misalignment)
    .replace(/{label_inter_eye_distance}/g, labels.inter_eye_distance)
    // Nose labels
    .replace(/{label_nose_tip_deviation}/g, labels.nose_tip_deviation)
    .replace(/{label_nostril_asymmetry}/g, labels.nostril_asymmetry)
    .replace(/{label_combined_rotation}/g, labels.combined_rotation)
    // Lip labels
    .replace(/{label_corner_alignment}/g, labels.corner_alignment)
    .replace(/{label_width_asymmetry}/g, labels.width_asymmetry)
    .replace(/{label_upper_lower_ratio}/g, labels.upper_lower_ratio)
    // Jawline labels
    .replace(/{label_chin_deviation}/g, labels.chin_deviation)
    .replace(/{label_jawline_difference}/g, labels.jawline_difference);
}

/**
 * Main function to prepare prompt for any region
 * Replaces all template variables with calculated metrics
 */
export function preparePromptForRegion(
  region: FaceRegion,
  calculatedMetrics: any,
  language: SupportedLanguage,
  gender?: 'female' | 'male' | 'other' | null
): string {
  let finalPrompt = region.prompt;

  // Replace gender placeholder
  const genderText = gender === 'female' ? (language === 'tr' ? 'Kadın' : 'Female')
    : gender === 'male' ? (language === 'tr' ? 'Erkek' : 'Male')
      : gender === 'other' ? (language === 'tr' ? 'Diğer / Nötr' : 'Other / Neutral')
        : (language === 'tr' ? 'Belirtilmemiş' : 'Not specified');

  finalPrompt = finalPrompt.replace(/{gender}/g, genderText);

  // Replace metrics based on region
  switch (region.id) {
    case 'nose':
      finalPrompt = replaceNoseMetrics(finalPrompt, calculatedMetrics as NoseMetrics);
      break;
    case 'eyes':
      finalPrompt = replaceEyesMetrics(finalPrompt, calculatedMetrics as EyesMetrics);
      break;
    case 'lips':
      finalPrompt = replaceLipsMetrics(finalPrompt, calculatedMetrics as LipsMetrics);
      break;
    case 'jawline':
      finalPrompt = replaceJawlineMetrics(finalPrompt, calculatedMetrics as JawlineMetrics);
      break;
    case 'eyebrows':
      finalPrompt = replaceEyebrowsMetrics(finalPrompt, calculatedMetrics as EyebrowsMetrics);
      break;
    // face_shape is disabled
  }

  // Replace language labels
  finalPrompt = replaceLanguageLabels(finalPrompt, language);

  return finalPrompt;
}
