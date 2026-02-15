/**
 * Face Analysis Prompts
 * Custom prompts for each facial region analysis
 */

// Import icon assets
const eyebrowsIcon = require('@/assets/icons/eyesbrown.png');
const eyesIcon = require('@/assets/icons/eyes.png');
const noseIcon = require('@/assets/icons/nose.png');
const lipsIcon = require('@/assets/icons/lips.png');
const jawlineIcon = require('@/assets/icons/jawline.png');
// DISABLED: Face shape icon (feature temporarily disabled)
// const faceShapeIcon = require('@/assets/icons/face-shape.png');

/**
 * Metric translations for multi-language support
 * Used to replace placeholders in prompts based on user's language
 */
export const METRIC_TRANSLATIONS = {
  tr: {
    // Units
    pixels: 'piksel',
    degrees: 'derece',

    // General terms
    difference: 'fark',
    asymmetry: 'asimetri',
    deviation: 'sapma',
    score: 'puan',
    left: 'Sol',
    right: 'Sağ',

    // Eyebrow metrics
    height_difference: 'Yükseklik farkı',
    arch_difference: 'Kemer farkı',
    angle_difference: 'Açı farkı',

    // Eye metrics
    width_difference: 'Genişlik farkı',
    vertical_misalignment: 'Dikey hizalama farkı',
    inter_eye_distance: 'Gözler arası mesafe',

    // Nose metrics
    nose_tip_deviation: 'Burun ucu sapması',
    nostril_asymmetry: 'Burun delikleri asimetrisi',

    // v2.0 Nose rotation metrics
    geometric_tilt: 'Geometrik eğim',
    positional_deviation: 'Konumsal sapma',
    combined_rotation: 'Birleşik eğim açısı',

    // Lip metrics
    corner_alignment: 'Köşe hizalama farkı',
    width_asymmetry: 'Genişlik asimetrisi',
    upper_lower_ratio: 'Üst/Alt oranı',

    // Jawline metrics
    chin_deviation: 'Çene sapması',
    jawline_difference: 'Çene hattı farkı',
  },
  en: {
    // Units
    pixels: 'pixels',
    degrees: 'degrees',

    // General terms
    difference: 'difference',
    asymmetry: 'asymmetry',
    deviation: 'deviation',
    score: 'score',
    left: 'Left',
    right: 'Right',

    // Eyebrow metrics
    height_difference: 'Height difference',
    arch_difference: 'Arch difference',
    angle_difference: 'Angle difference',

    // Eye metrics
    width_difference: 'Width difference',
    vertical_misalignment: 'Vertical misalignment',
    inter_eye_distance: 'Inter-eye distance',

    // Nose metrics
    nose_tip_deviation: 'Nose tip deviation',
    nostril_asymmetry: 'Nostril asymmetry',

    // v2.0 Nose rotation metrics
    geometric_tilt: 'Geometric tilt',
    positional_deviation: 'Positional deviation',
    combined_rotation: 'Combined rotation angle',

    // Lip metrics
    corner_alignment: 'Corner alignment difference',
    width_asymmetry: 'Width asymmetry',
    upper_lower_ratio: 'Upper/Lower ratio',

    // Jawline metrics
    chin_deviation: 'Chin deviation',
    jawline_difference: 'Jawline difference',
  },
} as const;

export type SupportedLanguage = keyof typeof METRIC_TRANSLATIONS;

export interface FaceRegion {
  id: 'eyebrows' | 'eyes' | 'nose' | 'lips' | 'jawline' | 'face_shape';
  title: string;
  icon: string | any; // Support both emoji strings and image requires
  description: string;
  prompt: string;
}


export const FACE_REGIONS: FaceRegion[] = [
  {
    id: 'eyebrows',
    title: 'Kaşlar',
    icon: eyebrowsIcon,
    description: 'Kaş şekli ve simetri analizi',
    prompt: `Analyze these PRE-CALCULATED eyebrow metrics. DO NOT recalculate any values.

═══════════════════════════════════════════
PRE-CALCULATED METRICS
═══════════════════════════════════════════

HEIGHT SYMMETRY (28% weight):
- Height difference: {browHeightDifference} px ({browHeightDifferenceRatio}%)
- Direction: {browHeightDirection} (LEFT_HIGHER = left brow is higher, RIGHT_HIGHER = right brow is higher)
- Score: {browHeightSymmetryScore}/10

ARCH SYMMETRY (24% weight):
- Arch difference: {archHeightDifference} px ({archHeightDifferenceRatio}%)
- Score: {archHeightSymmetryScore}/10

BROW-EYE DISTANCE (18% weight):
- Left: {leftBrowEyeDistance} px | Right: {rightBrowEyeDistance} px
- Assessment: {browEyeDistanceAssessment}
- Score: {browEyeDistanceScore}/10

ANGLE SYMMETRY (10% weight):
- Left: {leftBrowAngle}° ({leftBrowDirection}) | Right: {rightBrowAngle}° ({rightBrowDirection})
- Difference: {browAngleDifference}°
- Score: {browAngleSymmetryScore}/10

THICKNESS (6% weight):
- Difference: {browThicknessDifference} px ({browThicknessDifferenceRatio}%)
- Score: {browThicknessSymmetryScore}/10

OVERALL: {overallScore}/10 ({asymmetryLevel})

═══════════════════════════════════════════
OUTPUT JSON FORMAT
═══════════════════════════════════════════

{
  "analysis_result": {
    "overall_score": {overallScore},
    "asymmetry_level": "{asymmetryLevel}",
    "primary_finding": "string (main finding, single sentence, in user's language)"
  },

  "summary": {
    "headline": "string (max 10 words, in user's language)",
    "explanation": "string (2-3 sentences, MUST reference {browHeightDifference}px and {archHeightDifference}px values, in user's language)",
    "key_metrics": [
      "{label_height_difference}: {browHeightDifference} {unit_pixels}",
      "{label_arch_difference}: {archHeightDifference} {unit_pixels}",
      "{label_angle_difference}: {browAngleDifference}°"
    ]
  },

  "details": {
    "height_symmetry": {
      "difference": {browHeightDifference},
      "difference_ratio": {browHeightDifferenceRatio},
      "direction": "{browHeightDirection}",
      "score": {browHeightSymmetryScore},
      "user_explanation": "string (MUST mention which brow is higher based on {browHeightDirection}: if LEFT_HIGHER say 'left brow is higher', if RIGHT_HIGHER say 'right brow is higher', in user's language)"
    },
    "arch_symmetry": {
      "difference": {archHeightDifference},
      "difference_ratio": {archHeightDifferenceRatio},
      "score": {archHeightSymmetryScore},
      "user_explanation": "string (explain visual impact of this difference, in user's language)"
    },
    "brow_eye_distance": {
      "left": {leftBrowEyeDistance},
      "right": {rightBrowEyeDistance},
      "assessment": "{browEyeDistanceAssessment}",
      "score": {browEyeDistanceScore},
      "user_explanation": "string (explain visual impact of this distance, in user's language)"
    },
    "angle": {
      "left_angle": {leftBrowAngle},
      "right_angle": {rightBrowAngle},
      "difference": {browAngleDifference},
      "score": {browAngleSymmetryScore},
      "user_explanation": "string (explain visual impact of this angle, in user's language)"
    }
  },

  "recommendations": {
    "quick_tip": "string (immediately actionable tip, in user's language)",
    "exercise_suggestion": "string (eyebrow exercises can help symmetry, in user's language)",
    "exercise_region": "eyebrows",
    "professional_advice": "string (targeted professional perspective, MUST NOT be null, in user's language)"
  },

  "metadata": {
    "reliability": "HIGH",
    "calculation_method": "typescript_precalculated"
  }
}`,
  },
  {
    id: 'eyes',
    title: 'Gözler',
    icon: eyesIcon,
    description: 'Göz şekli ve boyut analizi',
    prompt: `Analyze these PRE-CALCULATED eye metrics. DO NOT recalculate any values.

═══════════════════════════════════════════
PRE-CALCULATED METRICS
═══════════════════════════════════════════

SIZE SYMMETRY (25% weight):
- Left eye: {leftEyeWidth}px × {leftEyeHeight}px
- Right eye: {rightEyeWidth}px × {rightEyeHeight}px
- Width difference: {widthDifference}px ({widthDifferenceRatio}%)
- Area difference: {areaDifferenceRatio}%
- Score: {sizeSymmetryScore}/10

POSITION SYMMETRY (20% weight):
- Vertical misalignment: {verticalMisalignment}px ({verticalMisalignmentRatio}%)
- Horizontal asymmetry: {horizontalAsymmetry}px
- Score: {positionSymmetryScore}/10

INTER-EYE DISTANCE (15% weight):
- Distance: {interEyeDistance}px ({interEyeDistanceRatio}% of face width)
- Assessment: {interEyeAssessment}
- Score: {interEyeScore}/10

SHAPE & CANTHAL TILT (15% weight):
- Left: {leftEyeRatio} ratio, {leftCanthalTilt}° ({leftCanthalTiltDirection})
- Right: {rightEyeRatio} ratio, {rightCanthalTilt}° ({rightCanthalTiltDirection})
- Tilt asymmetry: {tiltAsymmetry}°
- Score: {shapeSymmetryScore}/10

EYELID ANALYSIS (15% weight):
- Upper lid asymmetry: {upperLidAsymmetry}px ({upperLidAsymmetryRatio}%)
- Lower lid asymmetry: {lowerLidAsymmetry}px ({lowerLidAsymmetryRatio}%)
- Score: {eyelidScore}/10

BROW-EYE DISTANCE (8% weight):
- Left: {leftBrowEyeDistance}px | Right: {rightBrowEyeDistance}px
- Asymmetry: {browEyeAsymmetry}px ({browEyeAsymmetryRatio}%)
- Score: {browEyeScore}/10

3D DEPTH (2% weight):
- Depth difference: {depthDifference} units
- Score: {depthScore}/10

OVERALL: {overallScore}/10 ({asymmetryLevel})

═══════════════════════════════════════════
OUTPUT JSON FORMAT
═══════════════════════════════════════════

{
  "analysis_result": {
    "overall_score": {overallScore},
    "asymmetry_level": "{asymmetryLevel}",
    "primary_finding": "string (main finding, single sentence, in user's language)"
  },

  "summary": {
    "headline": "string (max 10 words, in user's language)",
    "explanation": "string (2-3 sentences, MUST reference {widthDifference}px and {verticalMisalignment}px values, in user's language)",
    "key_metrics": [
      "{label_width_difference}: {widthDifference} {unit_pixels}",
      "{label_vertical_misalignment}: {verticalMisalignment} {unit_pixels}",
      "{label_inter_eye_distance}: {interEyeDistance} {unit_pixels} ({interEyeAssessment})"
    ]
  },

  "details": {
    "size_symmetry": {
      "width_difference": {widthDifference},
      "area_difference_ratio": {areaDifferenceRatio},
      "score": {sizeSymmetryScore},
      "user_explanation": "string (explain visual impact of this difference, in user's language)"
    },
    "position_symmetry": {
      "vertical_misalignment": {verticalMisalignment},
      "horizontal_asymmetry": {horizontalAsymmetry},
      "score": {positionSymmetryScore},
      "user_explanation": "string (explain visual impact of this positioning, in user's language)"
    },
    "inter_eye_distance": {
      "distance": {interEyeDistance},
      "face_width_ratio": {interEyeDistanceRatio},
      "assessment": "{interEyeAssessment}",
      "score": {interEyeScore},
      "user_explanation": "string (explain visual impact of this distance, in user's language)"
    },
    "shape_analysis": {
      "tilt_asymmetry": {tiltAsymmetry},
      "score": {shapeSymmetryScore},
      "user_explanation": "string (explain visual impact of eye tilt, in user's language)"
    },
    "eyelid_symmetry": {
      "upper_lid_asymmetry": {upperLidAsymmetry},
      "lower_lid_asymmetry": {lowerLidAsymmetry},
      "score": {eyelidScore},
      "user_explanation": "string (explain visual impact of lid symmetry, in user's language)"
    }
  },

  "recommendations": {
    "quick_tip": "string (immediately actionable tip, in user's language)",
    "exercise_suggestion": "string (eye exercises can help eye muscle tone, in user's language)",
    "exercise_region": "eyes",
    "professional_advice": "string (targeted professional perspective, MUST NOT be null, in user's language)"
  },

  "metadata": {
    "reliability": "HIGH",
    "calculation_method": "typescript_precalculated"
  }
}`,
  },
  {
    id: 'nose',
    title: 'Burun',
    icon: noseIcon,
    description: 'Burun şekli ve simetri',
    prompt: `Analyze these PRE-CALCULATED nose metrics. DO NOT recalculate any values.

═══════════════════════════════════════════
PRE-CALCULATED METRICS
═══════════════════════════════════════════

NOSE TIP CENTERING (60% weight):
- Deviation: {tipDeviation}px {tipDirection} ({tipDeviationRatio}%)
- Score: {tipScore}/10

BRIDGE STRAIGHTNESS (15% weight):
- Deviation: {bridgeDeviation}px ({bridgeAssessment})
- Score: {bridgeStraightnessScore}/10

COMBINED ROTATION/EĞİM (15% weight):
┌─ Geometric Tilt (nose axis): {geometricTilt}° ({geometricTiltDirection})
├─ Positional Deviation: {positionalDeviation}° ({positionalDeviationDirection})
└─ Combined Rotation (Pythagorean): {combinedRotation}° ({combinedRotationDirection})
- Score: {combinedRotationScore}/10

PROPORTIONS (10% weight):
- Width: {noseWidth}px ({widthAssessment})
- Length: {noseLength}px ({lengthAssessment})
- Score: {widthScore}/10 (width) | {lengthScore}/10 (length)

OVERALL: {overallScore}/10 ({asymmetryLevel})

(Detailed metrics provided for internal calculation context - DO NOT add any keys to the JSON except for those specified in the OUTPUT JSON FORMAT below)

═══════════════════════════════════════════
TURKISH LANGUAGE GUIDANCE (v2.1)
═══════════════════════════════════════════

When generating Turkish (tr) explanations:

❌ AVOID using "dönme" or "dönüş" (means spinning/rotating)
✅ USE "eğim" or "eğiklik" (means tilt/inclination)

Examples:
- ❌ "Burnunuz sağa dönmüş" (sounds like nose is spinning)
- ✅ "Burnunuz sağa eğik" (nose is tilted right)

Context-specific terms:
- Geometric Tilt → "Geometrik eğim" (the nose's own axis tilt)
- Positional Deviation → "Konumsal sapma" (displacement from center)
- Combined Rotation → "Birleşik eğim" or "Toplam eğim açısı"

IMPORTANT ROTATION INTERPRETATION:
1. If geometricTilt is HIGH but positionalDeviation is LOW:
   → "Burnunuz kendi aksı boyunca eğik ama merkeze yakın"
2. If positionalDeviation is HIGH but geometricTilt is LOW:
   → "Burnunuz düz iniyor ama yüzünüzün [SOL/SAĞ] tarafında duruyor"
3. If BOTH are high:
   → "Burnunuz [yön] eğik ve [yön] kaymış, kompleks bir asimetri"
4. If BOTH are low:
   → "Burnunuz düz ve merkeze yakın"

ALWAYS reference the actual degree values in your explanation!

═══════════════════════════════════════════
OUTPUT JSON FORMAT
═══════════════════════════════════════════

{
  "analysis_result": {
    "overall_score": {overallScore},
    "asymmetry_level": "{asymmetryLevel}",
    "primary_finding": "string (main finding, single sentence, in user's language)"
  },

  "summary": {
    "headline": "string (max 10 words, in user's language)",
    "explanation": "string (2-3 sentences, MUST reference {tipDeviationRatio}% value, in user's language)",
    "key_metrics": [
      "{label_nose_tip_deviation}: {tipDeviationRatio}%",
      "{label_bridge_straightness}: {bridgeAssessment}",
      "{label_combined_rotation}: {combinedRotation}°"
    ]
  },

  "details": {
    "tip_deviation": {
      "tip_deviation_ratio": {tipDeviationRatio},
      "direction": "{tipDirection}",
      "score": {tipScore},
      "user_explanation": "string (describe how the {tipDeviationRatio}% deviation affects facial symmetry in the {tipDirection} direction, in user's language)"
    },
    "bridge_straightness": {
      "deviation": {bridgeDeviation},
      "assessment": "{bridgeAssessment}",
      "score": {bridgeStraightnessScore},
      "user_explanation": "string (describe the visual character of the bridge curvature/straightness based on {bridgeDeviation}px, mentioning aesthetic impact, in user's language)"
    },
    "combined_rotation": {
      "angle": {combinedRotation},
      "direction": "{combinedRotationDirection}",
      "score": {combinedRotationScore},
      "user_explanation": "string (describe the overall lean of the nose axis at {combinedRotation}°, explaining how it impacts the 'flow' of the face, in user's language)"
    },
    "proportions": {
      "proportion_score": {proportionScore},
      "width_assessment": "{widthAssessment}",
      "width_score": {widthScore},
      "length_assessment": "{lengthAssessment}",
      "length_score": {lengthScore},
      "user_explanation": "string (describe the harmony between nose width ({noseWidth}px) and length ({noseLength}px), explaining how it balances with facial thirds, in user's language)"
    }
  },

  "recommendations": {
    "quick_tip": "string (immediately actionable tip, in user's language)",
    "exercise_suggestion": "string (facial yoga exercises for the nose area can be helpful, in user's language)",
    "exercise_region": "nose",
    "professional_advice": "string or null (filled if score < 6, in user's language)"
  },

  "metadata": {
    "reliability": "HIGH",
    "calculation_method": "typescript_precalculated"
  }
}`,
  },
  {
    id: 'lips',
    title: 'Dudaklar',
    icon: lipsIcon,
    description: 'Dudak şekli ve kalınlık',
    prompt: `Analyze these PRE-CALCULATED lip metrics. DO NOT recalculate any values.

═══════════════════════════════════════════
PRE-CALCULATED METRICS
═══════════════════════════════════════════

CORNER ALIGNMENT (28% weight):
- Vertical misalignment: {cornerYDifference}px
- Lip line tilt: {lipLineTilt}° ({lipLineTiltDirection})
- Score: {cornerAlignmentScore}/10

WIDTH SYMMETRY (24% weight):
- Left half: {leftHalfWidth}px | Right half: {rightHalfWidth}px
- Asymmetry: {widthAsymmetry}px ({widthAsymmetryRatio}%)
- Score: {lipWidthSymmetryScore}/10

UPPER LIP SYMMETRY (18% weight):
- Left: {leftUpperLipHeight}px | Right: {rightUpperLipHeight}px
- Difference: {upperLipHeightDifference}px ({upperLipHeightDifferenceRatio}%)
- Score: {upperLipSymmetryScore}/10

LOWER LIP SYMMETRY (15% weight):
- Left: {leftLowerLipHeight}px | Right: {rightLowerLipHeight}px
- Difference: {lowerLipHeightDifference}px ({lowerLipHeightDifferenceRatio}%)
- Score: {lowerLipSymmetryScore}/10

CUPID'S BOW (8% weight):
- Left peak: {leftCupidBowHeight}px | Right peak: {rightCupidBowHeight}px
- Difference: {cupidBowDifference}px ({cupidBowDifferenceRatio}%)
- Present: {cupidBowPresence}
- Score: {cupidBowSymmetryScore}/10

UPPER/LOWER RATIO (5% weight):
- Upper: {upperLipHeight}px | Lower: {lowerLipHeight}px
- Ratio: {upperLowerRatio} ({ratioAssessment})
- Score: {upperLowerRatioScore}/10

3D DEPTH (2% weight):
- Depth difference: {depthDifference} units
- Score: {depthScore}/10

OVERALL: {overallScore}/10 ({asymmetryLevel})

═══════════════════════════════════════════
OUTPUT JSON FORMAT
═══════════════════════════════════════════

{
  "analysis_result": {
    "overall_score": {overallScore},
    "asymmetry_level": "{asymmetryLevel}",
    "primary_finding": "string (main finding, single sentence, in user's language)"
  },

  "summary": {
    "headline": "string (max 10 words, in user's language)",
    "explanation": "string (2-3 sentences, MUST reference {cornerYDifference}px and {widthAsymmetry}px values, in user's language)",
    "key_metrics": [
      "{label_corner_alignment}: {cornerYDifference} {unit_pixels}",
      "{label_width_asymmetry}: {widthAsymmetry} {unit_pixels}",
      "{label_upper_lower_ratio}: {upperLowerRatio}"
    ]
  },

  "details": {
    "corner_alignment": {
      "vertical_diff": {cornerYDifference},
      "tilt": {lipLineTilt},
      "score": {cornerAlignmentScore},
      "user_explanation": "string (explain visual impact of this alignment, in user's language)"
    },
    "width_symmetry": {
      "asymmetry": {widthAsymmetry},
      "score": {lipWidthSymmetryScore},
      "user_explanation": "string (explain visual impact of width symmetry, in user's language)"
    },
    "upper_lip": {
      "difference": {upperLipHeightDifference},
      "score": {upperLipSymmetryScore},
      "user_explanation": "string (explain visual impact of upper lip symmetry, in user's language)"
    },
    "lower_lip": {
      "difference": {lowerLipHeightDifference},
      "score": {lowerLipSymmetryScore},
      "user_explanation": "string (explain visual impact of lower lip symmetry, in user's language)"
    },
    "cupids_bow": {
      "present": {cupidBowPresence},
      "difference": {cupidBowDifference},
      "score": {cupidBowSymmetryScore},
      "user_explanation": "string (explain visual impact of Cupid's bow symmetry, in user's language)"
    },
    "ratio": {
      "value": {upperLowerRatio},
      "assessment": "{ratioAssessment}",
      "score": {upperLowerRatioScore},
      "user_explanation": "string (explain visual impact of lip ratio; ideal is 0.7-1.0, in user's language)"
    }
  },

  "recommendations": {
    "quick_tip": "string (immediately actionable tip, in user's language)",
    "exercise_suggestion": "string (lip exercises can help with symmetry, in user's language)",
    "exercise_region": "lips",
    "professional_advice": "string (targeted professional perspective, MUST NOT be null, in user's language)"
  },

  "metadata": {
    "reliability": "HIGH",
    "calculation_method": "typescript_precalculated"
  }
}`,
  },
  {
    id: 'jawline',
    title: 'Çene Hattı',
    icon: jawlineIcon,
    description: 'Çene keskinliği ve şekli',
    prompt: `Analyze these PRE-CALCULATED jawline metrics. DO NOT recalculate any values.

═══════════════════════════════════════════
PRE-CALCULATED METRICS
═══════════════════════════════════════════

CHIN CENTERING (30% weight):
- Deviation: {chinDeviation}px ({chinDirection}) - {chinDeviationRatio}%
- Score: {chinCenteringScore}/10

JAWLINE SYMMETRY (25% weight):
- Left length: {leftJawLength}px | Right length: {rightJawLength}px
- Difference: {jawLengthDifference}px ({jawLengthDifferenceRatio}%)
- Score: {jawlineSymmetryScore}/10

JAW ANGLE SYMMETRY (20% weight):
- Left: {leftJawAngle}° | Right: {rightJawAngle}°
- Difference: {jawAngleDifference}°
- Score: {jawAngleSymmetryScore}/10

JAW WIDTH (15% weight):
- Width: {jawWidth}px ({jawWidthRatio}% of face width)
- Assessment: {jawWidthAssessment}
- Score: {jawWidthScore}/10

VERTICAL ALIGNMENT (10% weight):
- Vertical deviation: {verticalDeviation}px
- Score: {verticalAlignmentScore}/10

OVERALL: {overallScore}/10 ({asymmetryLevel})

═══════════════════════════════════════════
OUTPUT JSON FORMAT
═══════════════════════════════════════════

{
  "analysis_result": {
    "overall_score": {overallScore},
    "asymmetry_level": "{asymmetryLevel}",
    "primary_finding": "string (main finding, single sentence, in user's language)"
  },

  "summary": {
    "headline": "string (max 10 words, in user's language)",
    "explanation": "string (2-3 sentences, MUST reference {chinDeviation}px and {jawLengthDifference}px values, in user's language)",
    "key_metrics": [
      "{label_chin_deviation}: {chinDeviation} {unit_pixels} ({chinDirection})",
      "{label_jawline_difference}: {jawLengthDifference} {unit_pixels}",
      "{label_angle_difference}: {jawAngleDifference}°"
    ]
  },

  "details": {
    "chin_centering": {
      "deviation": {chinDeviation},
      "direction": "{chinDirection}",
      "score": {chinCenteringScore},
      "user_explanation": "string (explain visual impact of this deviation, in user's language)"
    },
    "jawline_symmetry": {
      "length_difference": {jawLengthDifference},
      "score": {jawlineSymmetryScore},
      "user_explanation": "string (explain visual impact of jawline length symmetry, in user's language)"
    },
    "jaw_angles": {
      "difference": {jawAngleDifference},
      "score": {jawAngleSymmetryScore},
      "user_explanation": "string (explain visual impact of jaw angle symmetry, in user's language)"
    },
    "jaw_width": {
      "ratio": {jawWidthRatio},
      "assessment": "{jawWidthAssessment}",
      "score": {jawWidthScore},
      "user_explanation": "string (explain visual impact of jaw width, in user's language)"
    },
    "vertical_alignment": {
      "deviation": {verticalDeviation},
      "score": {verticalAlignmentScore},
      "user_explanation": "string (explain visual impact of vertical alignment, in user's language)"
    }
  },

  "recommendations": {
    "quick_tip": "string (immediately actionable tip, in user's language)",
    "exercise_suggestion": "string (jaw and facial exercises can help with symmetry, in user's language)",
    "exercise_region": "jawline",
    "professional_advice": "string (targeted professional perspective, MUST NOT be null, in user's language)"
  },

  "metadata": {
    "reliability": "HIGH",
    "calculation_method": "typescript_precalculated"
  }
}`,
  },
  /* ============================================
     FACE SHAPE - TEMPORARILY DISABLED
     ============================================
  
     Reason: MediaPipe Face Mesh does not provide hairline landmarks.
     Face length cannot be accurately calculated (P_10 is forehead center, not hairline).
     This causes incorrect face shape classification.
  
     To re-enable:
     1. Uncomment this section
     2. Ensure calculation method handles missing hairline
     3. Update prompt to mention "frontal view only" limitation
     4. Test with various face types
  
     Last modified: 2026-01-21
     ============================================ */

  /*
    {
      id: 'face_shape',
      title: 'Yüz Şekli',
      icon: faceShapeIcon,
      description: 'Genel yüz şekli analizi',
      prompt: `You are a facial analysis expert. Analyze these PRE-CALCULATED face shape metrics.
  
  ═══════════════════════════════════════════
  IMPORTANT: DO NOT RECALCULATE
  ═══════════════════════════════════════════
  
  All measurements below are already calculated from MediaPipe Face Mesh landmarks.
  Your job: INTERPRET and EXPLAIN these values in plain Turkish, NOT to recalculate them.
  
  ═══════════════════════════════════════════
  PRE-CALCULATED METRICS (1024x1024 canvas)
  ═══════════════════════════════════════════
  
  FACE DIMENSIONS:
  - Face length: {faceLength} pixels
  - Face width (at eye level): {faceWidth} pixels
  - Cheekbone width: {cheekboneWidth} pixels
  - Jawline width: {jawlineWidth} pixels
  - Forehead width: {foreheadWidth} pixels
  
  FACE SHAPE CLASSIFICATION (40% weight):
  - Length/Width ratio: {lengthWidthRatio}
  - Jaw/Cheekbone ratio: {jawCheekRatio}
  - Forehead/Jaw ratio: {foreheadJawRatio}
  - Detected face shape: {faceShape}
  - Shape confidence: {shapeConfidence}/10
  - Alternative shape: {alternativeShape}
  
  FACIAL THIRDS BALANCE (30% weight - vertical proportions):
  - Upper third (forehead to eyebrows): {upperThird} pixels ({upperThirdRatio}%)
  - Middle third (eyebrows to nose): {middleThird} pixels ({middleThirdRatio}%)
  - Lower third (nose to chin): {lowerThird} pixels ({lowerThirdRatio}%)
  - Deviation from ideal (33-33-33): {thirdsDeviation}%
  - Facial thirds score: {facialThirdsScore}/10
  
  HORIZONTAL SYMMETRY (20% weight):
  - Left face width (center to edge): {leftFaceWidth} pixels
  - Right face width (center to edge): {rightFaceWidth} pixels
  - Horizontal asymmetry: {horizontalAsymmetry} pixels ({horizontalAsymmetryRatio}%)
  - Horizontal symmetry score: {horizontalSymmetryScore}/10
  
  PROPORTION SCORES (10% weight):
  - Golden ratio deviation: {goldenRatioDeviation} (ideal: 1.618)
  - Golden ratio score: {goldenRatioScore}/10
  - Proportion score: {proportionScore}/10
  
  OVERALL:
  - Combined score: {overallScore}/10
  - Proportion assessment: {proportionAssessment}
  
  ═══════════════════════════════════════════
  SCORING THRESHOLDS USED
  ═══════════════════════════════════════════
  
  FACIAL THIRDS BALANCE:
  - <2% deviation from 33-33-33 → 10/10 (Perfect)
  - 2-4% → 8/10 (Good)
  - 4-6% → 6/10 (Fair)
  - >8% → 2/10 (Poor)
  
  HORIZONTAL SYMMETRY:
  - <1% asymmetry → 10/10 (Perfect)
  - 1-2% → 8/10 (Minimal)
  - 2-4% → 6/10 (Noticeable)
  - >6% → 2/10 (Severe)
  
  GOLDEN RATIO:
  - <0.1 deviation from 1.618 → 10/10
  - 0.1-0.2 → 8/10
  - 0.2-0.3 → 6/10
  - >0.5 → 2/10
  
  FACE SHAPE CLASSIFICATION RULES:
  - OVAL: Length/width 1.3-1.6, balanced jaw/cheek/forehead
  - ROUND: Length/width <1.2, wide jaw
  - SQUARE: Length/width <1.25, strong jawline
  - HEART: Wide forehead, narrow jaw
  - DIAMOND: Wide cheekbones, narrow forehead/jaw
  - OBLONG: Length/width >1.6
  - TRIANGLE: Narrow forehead, wide jaw
  
  ═══════════════════════════════════════════
  YOUR TASK
  ═══════════════════════════════════════════
  
  Based on these EXACT numbers:
  1. Explain the detected face shape in the requested language
  2. Describe what the facial proportions mean in the requested language
  3. Explain the thirds balance in the requested language
  4. Provide style recommendations based on face shape in the requested language
  
  CRITICAL:
  - DO NOT recalculate any values
  - USE the exact numbers provided above
  - Reference specific measurements in explanations
  - Keep scores as provided (do not inflate)
  
  ═══════════════════════════════════════════
  OUTPUT JSON FORMAT
  ═══════════════════════════════════════════
  
  {
    "analysis_result": {
      "face_shape": "{faceShape}",                    // COPY provided value
      "confidence_score": {shapeConfidence},          // COPY provided value
      "alternative_shapes": ["{alternativeShape}"],   // COPY provided value
      "general_assessment": "string (reference the scores, in user's language)",
      "overall_score": {overallScore}                 // COPY provided value
    },
  
    "user_friendly_summary": {
      "assessment": "string (max 10 words, in user's language)",
      "explanation": "string (2-3 sentences, MUST reference faceShape={faceShape}, lengthWidthRatio={lengthWidthRatio}, etc., in user's language)",
      "key_findings": [
        "Your face shape: {faceShape} (confidence: {shapeConfidence}/10)",
        "Length/width ratio: {lengthWidthRatio}",
        "Facial thirds balance: Upper {upperThirdRatio}%, Middle {middleThirdRatio}%, Lower {lowerThirdRatio}%"
      ]
    },
  
    "dimension_measurements": {
      "face_length": {faceLength},                    // COPY
      "face_width": {faceWidth},                      // COPY
      "cheekbone_width": {cheekboneWidth},            // COPY
      "jawline_width": {jawlineWidth},                // COPY
      "forehead_width": {foreheadWidth},              // COPY
      "user_explanation": "string (explain these measurements in context, in user's language)"
    },
  
    "shape_classification": {
      "detected_shape": "{faceShape}",                // COPY
      "confidence": {shapeConfidence},                // COPY
      "alternative": "{alternativeShape}",            // COPY
      "length_width_ratio": {lengthWidthRatio},       // COPY
      "jaw_cheek_ratio": {jawCheekRatio},             // COPY
      "forehead_jaw_ratio": {foreheadJawRatio},       // COPY
      "user_explanation": "string (explain why this shape was detected, in user's language)"
    },
  
    "facial_thirds": {
      "upper_third": {upperThird},                    // COPY
      "upper_ratio": {upperThirdRatio},               // COPY
      "middle_third": {middleThird},                  // COPY
      "middle_ratio": {middleThirdRatio},             // COPY
      "lower_third": {lowerThird},                    // COPY
      "lower_ratio": {lowerThirdRatio},               // COPY
      "deviation_from_ideal": {thirdsDeviation},      // COPY
      "thirds_score": {facialThirdsScore},            // COPY
      "user_explanation": "string (explain thirds balance, in user's language)"
    },
  
    "symmetry_analysis": {
      "left_face_width": {leftFaceWidth},             // COPY
      "right_face_width": {rightFaceWidth},           // COPY
      "horizontal_asymmetry": {horizontalAsymmetry},  // COPY
      "asymmetry_ratio": {horizontalAsymmetryRatio},  // COPY
      "symmetry_score": {horizontalSymmetryScore},    // COPY
      "user_explanation": "string (explain symmetry, in user's language)"
    },
  
    "proportion_analysis": {
      "golden_ratio_deviation": {goldenRatioDeviation},  // COPY
      "golden_ratio_score": {goldenRatioScore},          // COPY
      "proportion_score": {proportionScore},             // COPY
      "proportion_assessment": "{proportionAssessment}", // COPY
      "user_explanation": "string (explain golden ratio and proportions, in user's language)"
    },
  
    "style_recommendations": {
      "hairstyle_suggestions": ["string (based on {faceShape}, in user's language)"],
      "accessory_suggestions": ["string (in user's language)"],
      "makeup_tips": ["string (if applicable, in user's language)"],
      "user_explanation": "string (in user's language)"
    },
  
    "metadata": {
      "analysis_date": "ISO timestamp",
      "points_used": 468,
      "reliability": "HIGH",
      "model_version": "V5_CALCULATED",
      "calculation_method": "typescript_precalculated"
    }
  }
  
  STRICT REQUIREMENTS:
  - All numeric fields in output MUST exactly match the input metrics
  - No recalculation allowed
  - Reference exact numbers in all text explanations
  - If you change a provided score, the system will reject your response`,
    },
  */
];

/**
 * Get prompt for a specific face region
 * @param regionId - The face region identifier
 * @returns The prompt text for that region
 */
export function getPromptForRegion(
  regionId: FaceRegion['id']
): string | null {
  const region = FACE_REGIONS.find((r) => r.id === regionId);
  return region ? region.prompt : null;
}

/**
 * Get region metadata by ID
 * @param regionId - The face region identifier
 * @returns The region metadata
 */
export function getRegionById(regionId: FaceRegion['id']): FaceRegion | null {
  return FACE_REGIONS.find((r) => r.id === regionId) || null;
}
