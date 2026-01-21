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
const faceShapeIcon = require('@/assets/icons/face-shape.png');

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
    prompt: `You are a facial analysis expert. Analyze these PRE-CALCULATED eyebrow metrics.

═══════════════════════════════════════════
IMPORTANT: DO NOT RECALCULATE
═══════════════════════════════════════════

All measurements below are already calculated from MediaPipe Face Mesh landmarks.
Your job: INTERPRET and EXPLAIN these values in plain Turkish, NOT to recalculate them.

═══════════════════════════════════════════
PRE-CALCULATED METRICS (1024x1024 canvas)
═══════════════════════════════════════════

BROW HEIGHT SYMMETRY (28% weight - most critical):
- Left brow highest Y: {leftBrowHighestY}
- Right brow highest Y: {rightBrowHighestY}
- Height difference: {browHeightDifference} pixels ({browHeightDifferenceRatio}%)
- Brow height symmetry score: {browHeightSymmetryScore}/10

ARCH HEIGHT SYMMETRY (24% weight):
- Left arch height: {leftArchHeight} pixels
- Right arch height: {rightArchHeight} pixels
- Arch difference: {archHeightDifference} pixels ({archHeightDifferenceRatio}%)
- Arch height symmetry score: {archHeightSymmetryScore}/10

BROW DISTANCE FROM EYE (18% weight):
- Left brow-eye distance: {leftBrowEyeDistance} pixels
- Right brow-eye distance: {rightBrowEyeDistance} pixels
- Distance asymmetry: {browEyeDistanceAsymmetry} pixels
- Average distance: {avgBrowEyeDistance} pixels
- Eye height: {eyeHeight} pixels
- Distance ratio: {browEyeDistanceRatio}% ({browEyeDistanceAssessment})
- Brow-eye distance score: {browEyeDistanceScore}/10

INNER CORNER DISTANCE (12% weight):
- Inner corner distance: {innerCornerDistance} pixels
- Eye width: {eyeWidth} pixels
- Distance ratio: {innerCornerDistanceRatio}% ({innerCornerAssessment})
- Inner corner distance score: {innerCornerDistanceScore}/10

BROW ANGLE/SLOPE (10% weight):
- Left brow angle: {leftBrowAngle}° ({leftBrowDirection})
- Right brow angle: {rightBrowAngle}° ({rightBrowDirection})
- Angle difference: {browAngleDifference}°
- Brow angle symmetry score: {browAngleSymmetryScore}/10

BROW THICKNESS (6% weight):
- Left brow thickness: {leftBrowThickness} pixels
- Right brow thickness: {rightBrowThickness} pixels
- Thickness difference: {browThicknessDifference} pixels ({browThicknessDifferenceRatio}%)
- Brow thickness symmetry score: {browThicknessSymmetryScore}/10

BROW LENGTH (2% weight):
- Left brow length: {leftBrowLength} pixels
- Right brow length: {rightBrowLength} pixels
- Length difference: {browLengthDifference} pixels ({browLengthDifferenceRatio}%)
- Brow length symmetry score: {browLengthSymmetryScore}/10

OVERALL:
- Combined score: {overallScore}/10
- Asymmetry level: {asymmetryLevel}
- Face height: {faceHeight} pixels

═══════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════

Based on these EXACT numbers:
1. Explain what they mean to the user (in plain Turkish)
2. Describe the visual appearance of the eyebrows
3. Provide context for each measurement
4. Give recommendations if needed

CRITICAL:
- DO NOT recalculate any values
- USE the exact numbers provided above in your explanations
- Reference specific measurements in every section
- Keep scores as provided (do not inflate)

═══════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════

Based on these EXACT numbers:
1. Explain what they mean to the user (in plain Turkish)
2. Describe the visual appearance of the eyebrows
3. Provide context for each measurement
4. Give recommendations if needed

CRITICAL:
- DO NOT recalculate any values
- USE the exact numbers provided above in your explanations
- Reference specific measurements in every section
- Keep scores as provided (do not inflate)

═══════════════════════════════════════════
OUTPUT JSON FORMAT
═══════════════════════════════════════════

{
  "analysis_result": {
    "general_assessment": "string (reference the scores)",
    "asymmetry_level": "{asymmetryLevel}",  // Use provided value
    "overall_score": {overallScore},         // Use provided value
    "asymmetry_type": "string"
  },

  "user_friendly_summary": {
    "assessment": "string (max 10 words)",
    "explanation": "string (2-3 sentences, MUST reference browHeightDifference={browHeightDifference}px, archHeightDifference={archHeightDifference}px, etc.)",
    "key_findings": [
      "Sol kaş en yüksek noktası {leftBrowHighestY}, sağ kaş {rightBrowHighestY} (fark: {browHeightDifference}px)",
      "Kemer yüksekliği farkı {archHeightDifference}px ({archHeightDifferenceRatio}%)",
      "Kaş-göz mesafesi: Sol {leftBrowEyeDistance}px, Sağ {rightBrowEyeDistance}px ({browEyeDistanceAssessment})"
    ]
  },

  "detailed_analysis": {
    "left_eyebrow": {
      "highest_y": {leftBrowHighestY},              // COPY provided value
      "arch_height": {leftArchHeight},              // COPY provided value
      "eye_distance": {leftBrowEyeDistance},        // COPY provided value
      "inner_corner_distance": {leftInnerCornerDistance},  // COPY provided value
      "angle": {leftBrowAngle},                     // COPY provided value
      "thickness": {leftBrowThickness},             // COPY provided value
      "length": {leftBrowLength},                   // COPY provided value
      "score": {leftBrowScore},                     // COPY provided value
      "user_explanation": "string (explain what these measurements mean)"
    },
    "right_eyebrow": {
      "highest_y": {rightBrowHighestY},             // COPY provided value
      "arch_height": {rightArchHeight},             // COPY provided value
      "eye_distance": {rightBrowEyeDistance},       // COPY provided value
      "inner_corner_distance": {rightInnerCornerDistance},  // COPY provided value
      "angle": {rightBrowAngle},                    // COPY provided value
      "thickness": {rightBrowThickness},            // COPY provided value
      "length": {rightBrowLength},                  // COPY provided value
      "score": {rightBrowScore},                    // COPY provided value
      "user_explanation": "string (explain what these measurements mean)"
    },
    "symmetry_analysis": {
      "height_difference": {browHeightDifference},           // COPY
      "height_difference_ratio": {browHeightDifferenceRatio},// COPY
      "arch_difference": {archHeightDifference},             // COPY
      "arch_difference_ratio": {archHeightDifferenceRatio},  // COPY
      "eye_distance_asymmetry": {browEyeDistanceAsymmetry},  // COPY
      "inner_corner_asymmetry": {innerCornerDistanceAsymmetry},  // COPY
      "angle_difference": {browAngleDifference},             // COPY
      "thickness_difference": {browThicknessDifference},     // COPY
      "length_difference": {browLengthDifference},           // COPY
      "symmetry_score": {overallScore},                      // COPY
      "user_explanation": "string (explain {browHeightDifference}px, {archHeightDifference}px, etc.)"
    }
  },

  "visual_assessment": {
    "prominent_asymmetry_areas": ["string based on lowest scores"],
    "visual_appearance": "string (describe how eyebrows look with these measurements)",
    "brow_eye_distance_assessment": "{browEyeDistanceAssessment}",  // COPY
    "inner_corner_assessment": "{innerCornerDistanceAssessment}",   // COPY
    "user_explanation": "string"
  },

  "recommendations": {
    "medical_advice": "string (IF score < 5, suggest professional evaluation)",
    "priority_intervention": "string (based on lowest sub-score)",
    "attention_points": ["string"]
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
- If you change a provided score, the system will reject your response
    `,
  },
  {
    id: 'eyes',
    title: 'Gözler',
    icon: eyesIcon,
    description: 'Göz şekli ve boyut analizi',
    prompt: `You are a facial analysis expert. Analyze these PRE-CALCULATED eye metrics.

═══════════════════════════════════════════
IMPORTANT: DO NOT RECALCULATE
═══════════════════════════════════════════

All measurements below are already calculated from MediaPipe Face Mesh landmarks.
Your job: INTERPRET and EXPLAIN these values in plain Turkish, NOT to recalculate them.

═══════════════════════════════════════════
PRE-CALCULATED METRICS (1024x1024 canvas)
═══════════════════════════════════════════

EYE SIZE SYMMETRY:
- Left eye: {leftEyeWidth}px × {leftEyeHeight}px (area: {leftEyeArea}px²)
- Right eye: {rightEyeWidth}px × {rightEyeHeight}px (area: {rightEyeArea}px²)
- Width difference: {widthDifference}px ({widthDifferenceRatio}%)
- Height difference: {heightDifference}px ({heightDifferenceRatio}%)
- Area difference: {areaDifference}px² ({areaDifferenceRatio}%)
- Size symmetry score: {sizeSymmetryScore}/10

EYE POSITION SYMMETRY:
- Left eye center: ({leftEyeCenterX}, {leftEyeCenterY})
- Right eye center: ({rightEyeCenterX}, {rightEyeCenterY})
- Vertical misalignment: {verticalMisalignment}px ({verticalMisalignmentRatio}%)
- Horizontal asymmetry: {horizontalAsymmetry}px
- Position symmetry score: {positionSymmetryScore}/10

INTER-EYE DISTANCE:
- Distance: {interEyeDistance}px
- Face width ratio: {interEyeDistanceRatio}%
- Assessment: {interEyeAssessment}
- Score: {interEyeScore}/10

EYE SHAPE & CANTHAL TILT:
- Left eye ratio: {leftEyeRatio} ({leftCanthalTiltDirection}, {leftCanthalTilt}°)
- Right eye ratio: {rightEyeRatio} ({rightCanthalTiltDirection}, {rightCanthalTilt}°)
- Tilt asymmetry: {tiltAsymmetry}°
- Shape symmetry score: {shapeSymmetryScore}/10

EYEBROW-TO-EYE DISTANCE:
- Left: {leftBrowEyeDistance}px
- Right: {rightBrowEyeDistance}px
- Asymmetry: {browEyeAsymmetry}px ({browEyeAsymmetryRatio}%)
- Score: {browEyeScore}/10

EYELID ANALYSIS:
- Left upper lid: {leftUpperLidExposure}px
- Right upper lid: {rightUpperLidExposure}px
- Upper lid asymmetry: {upperLidAsymmetry}px ({upperLidAsymmetryRatio}%)
- Lower lid asymmetry: {lowerLidAsymmetry}px ({lowerLidAsymmetryRatio}%)
- Eyelid score: {eyelidScore}/10

3D DEPTH:
- Depth difference: {depthDifference} units
- Depth score: {depthScore}/10

OVERALL:
- Combined score: {overallScore}/10
- Asymmetry level: {asymmetryLevel}

═══════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════

Based on these EXACT numbers:
1. Explain what they mean to the user (in plain Turkish)
2. Describe the visual appearance of the eyes
3. Provide context for each measurement
4. Give recommendations if needed

CRITICAL:
- DO NOT recalculate any values
- USE the exact numbers provided above in your explanations
- Reference specific measurements in every section
- Keep scores as provided (do not inflate)

⚠️ STRICT MODE:
- Return ONLY valid JSON output
- No explanations, thinking process, markdown code blocks, or additional text
- Output must start with { and end with }
- DO NOT include <thinking> tags, reasoning process, or explanations

═══════════════════════════════════════════
OUTPUT JSON FORMAT
═══════════════════════════════════════════

{
  "analysis_result": {
    "general_assessment": "string (reference the scores)",
    "asymmetry_level": "{asymmetryLevel}",  // Use provided value
    "overall_score": {overallScore},         // Use provided value
    "dominant_issue": "string"
  },

  "user_friendly_summary": {
    "assessment": "string (max 10 words)",
    "explanation": "string (2-3 sentences, MUST reference widthDifference={widthDifference}px, verticalMisalignment={verticalMisalignment}px, interEyeDistance={interEyeDistance}px)",
    "key_findings": [
      "Göz genişliği farkı {widthDifference}px ({widthDifferenceRatio}%)",
      "Dikey hizalama farkı {verticalMisalignment}px",
      "Göz arası mesafe {interEyeDistance}px ({interEyeAssessment})"
    ]
  },

  "size_analysis": {
    "width_difference": {widthDifference},              // COPY provided value
    "width_difference_ratio": {widthDifferenceRatio},   // COPY provided value
    "height_difference": {heightDifference},            // COPY provided value
    "height_difference_ratio": {heightDifferenceRatio}, // COPY provided value
    "area_difference_ratio": {areaDifferenceRatio},     // COPY provided value
    "size_score": {sizeSymmetryScore},                  // COPY provided value
    "user_explanation": "string (explain what {widthDifference}px, {heightDifference}px, and {areaDifferenceRatio}% mean)"
  },

  "shape_analysis": {
    "left_eye_ratio": {leftEyeRatio},                        // COPY
    "right_eye_ratio": {rightEyeRatio},                      // COPY
    "left_canthal_tilt": {leftCanthalTilt},                  // COPY
    "left_canthal_direction": "{leftCanthalTiltDirection}",  // COPY
    "right_canthal_tilt": {rightCanthalTilt},                // COPY
    "right_canthal_direction": "{rightCanthalTiltDirection}",// COPY
    "tilt_difference": {tiltAsymmetry},                      // COPY
    "shape_harmony": "string (based on directions matching)",
    "shape_score": {shapeSymmetryScore},                     // COPY
    "user_explanation": "string (explain {leftEyeRatio}, {rightEyeRatio}, and {tiltAsymmetry}°)"
  },

  "inter_eye_analysis": {
    "distance": {interEyeDistance},                // COPY
    "face_width_ratio": {interEyeDistanceRatio},   // COPY
    "idealness": "{interEyeAssessment}",           // COPY
    "score": {interEyeScore},                      // COPY
    "user_explanation": "string (explain {interEyeDistance}px and {interEyeDistanceRatio}%)"
  },

  "position_analysis": {
    "y_difference": {verticalMisalignment},               // COPY
    "y_difference_ratio": {verticalMisalignmentRatio},    // COPY
    "x_distance_difference": {horizontalAsymmetry},       // COPY
    "position_score": {positionSymmetryScore},            // COPY
    "user_explanation": "string (explain {verticalMisalignment}px and {horizontalAsymmetry}px)"
  },

  "eyelid_analysis": {
    "left_upper_lid_exposure": {leftUpperLidExposure},      // COPY
    "right_upper_lid_exposure": {rightUpperLidExposure},    // COPY
    "upper_lid_asymmetry": {upperLidAsymmetry},             // COPY
    "upper_lid_asymmetry_ratio": {upperLidAsymmetryRatio},  // COPY
    "lower_lid_asymmetry": {lowerLidAsymmetry},             // COPY
    "lower_lid_asymmetry_ratio": {lowerLidAsymmetryRatio},  // COPY
    "lid_score": {eyelidScore},                             // COPY
    "lid_type": "string (based on exposure values)",
    "user_explanation": "string (explain {upperLidAsymmetry}px and {lowerLidAsymmetry}px)"
  },

  "eyebrow_distance_analysis": {
    "left_brow_eye_distance": {leftBrowEyeDistance},    // COPY
    "right_brow_eye_distance": {rightBrowEyeDistance},  // COPY
    "brow_asymmetry": {browEyeAsymmetry},               // COPY
    "brow_asymmetry_ratio": {browEyeAsymmetryRatio},    // COPY
    "brow_score": {browEyeScore},                       // COPY
    "user_explanation": "string (explain {browEyeAsymmetry}px)"
  },

  "symmetry_analysis": {
    "horizontal_symmetry": "string (based on horizontalAsymmetry)",
    "vertical_symmetry": "string (based on verticalMisalignment)",
    "size_symmetry": "string (based on sizeSymmetryScore)",
    "shape_symmetry": "string (based on shapeSymmetryScore)",
    "overall_symmetry_score": {overallScore},  // COPY
    "user_explanation": "string (reference all sub-scores)"
  },

  "3d_analysis": {
    "depth_difference": {depthDifference},   // COPY
    "depth_score": {depthScore},             // COPY
    "interpretation": "string",
    "user_explanation": "string (explain {depthDifference})"
  },

  "facial_harmony": {
    "inter_eye_harmony": "string (based on interEyeAssessment)",
    "size_balance": "string (based on areaDifferenceRatio)",
    "position_balance": "string (based on positionSymmetryScore)",
    "user_explanation": "string"
  },

  "recommendations": {
    "medical_advice": "string (IF score < 5, suggest professional evaluation)",
    "aesthetic_advice": "string (based on lowest sub-score)",
    "makeup_suggestions": ["string"],
    "attention_points": ["string"]
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
- If you change a provided score, the system will reject your response

CRITICAL FINAL WARNING:
Response MUST be ONLY valid JSON.
No markdown (\`\`\`json), no code blocks, no explanations, no thinking tags.
Start with { and end with }`,
  },
 {
  id: 'nose',
  title: 'Burun',
  icon: noseIcon,
  description: 'Burun şekli ve simetri',
  prompt: `You are a facial analysis expert. Analyze these PRE-CALCULATED nose metrics.

═══════════════════════════════════════════
IMPORTANT: DO NOT RECALCULATE
═══════════════════════════════════════════

All measurements below are already calculated from MediaPipe Face Mesh landmarks.
Your job: INTERPRET and EXPLAIN these values, NOT to recalculate them.

═══════════════════════════════════════════
PRE-CALCULATED METRICS (1024x1024 canvas)
═══════════════════════════════════════════

NOSE TIP CENTERING:
- Deviation from center: {tipDeviation} pixels {tipDirection}
- Deviation ratio: {tipDeviationRatio}%
- Score: {tipScore}/10

NOSTRIL SYMMETRY:
- Horizontal asymmetry: {nostrilAsymmetry} pixels
- Asymmetry ratio: {nostrilAsymmetryRatio}%
- Score: {nostrilScore}/10

ROTATION (TILT):
- Rotation angle: {rotationAngle}°
- Direction: {rotationDirection}
- Score: {rotationScore}/10

3D DEPTH:
- Nostril depth difference: {depthDifference} units
- Score: {depthScore}/10

PROPORTIONAL METRICS:
- Nose width: {noseWidth} pixels ({noseWidthRatio}% of face width)
- Width assessment: {widthAssessment}
- Width score: {widthScore}/10

- Nose length: {noseLength} pixels ({noseLengthRatio}% of face width)
- Length assessment: {lengthAssessment}
- Length score: {lengthScore}/10

- Tip projection: {tipProjection} units
- Projection assessment: {projectionAssessment}
- Projection score: {projectionScore}/10

DETAILED FEATURES:
- Nostril height difference: {nostrilHeightDiff} pixels ({nostrilHeightDiffRatio}%)
- Nostril size score: {nostrilSizeScore}/10

- Bridge deviation: {bridgeDeviation} pixels ({bridgeDeviationRatio}%)
- Bridge assessment: {bridgeAssessment}
- Bridge straightness score: {bridgeStraightnessScore}/10

OVERALL:
- Combined score: {overallScore}/10
- Asymmetry level: {asymmetryLevel}

═══════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════

Based on these EXACT numbers:
1. Explain what they mean to the user
2. Describe the visual appearance of the nose
3. Provide context for each measurement
4. Give recommendations if needed

CRITICAL RULES:
- DO NOT recalculate any values
- USE the exact numbers provided above in your explanations
- Reference specific measurements in every section
- Keep scores as provided (do not inflate)
- All text explanations MUST reference the actual measurements

═══════════════════════════════════════════
OUTPUT JSON FORMAT
═══════════════════════════════════════════

{
  "analysis_result": {
    "general_assessment": "string (reference the scores)",
    "asymmetry_level": "{asymmetryLevel}",
    "overall_score": {overallScore},
    "asymmetry_type": "string"
  },

  "user_friendly_summary": {
    "assessment": "string (max 10 words)",
    "explanation": "string (2-3 sentences, MUST reference tipDeviation={tipDeviation}px, nostrilAsymmetry={nostrilAsymmetry}px, rotationAngle={rotationAngle}°)",
    "key_findings": [
      "Burun ucu merkezden {tipDeviation}px {tipDirection} sapmış",
      "Burun delikleri {nostrilAsymmetry}px asimetri gösteriyor",
      "Rotasyon açısı {rotationAngle}° ({rotationDirection})"
    ]
  },

  "nose_tip_analysis": {
    "deviation": {tipDeviation},
    "deviation_ratio": {tipDeviationRatio},
    "direction": "{tipDirection}",
    "score": {tipScore},
    "user_explanation": "string (explain what {tipDeviation}px and {tipDeviationRatio}% mean)"
  },

  "nostril_analysis": {
    "horizontal_difference": {nostrilAsymmetry},
    "asymmetry_ratio": {nostrilAsymmetryRatio},
    "score": {nostrilScore},
    "user_explanation": "string (explain {nostrilAsymmetry}px)"
  },

  "rotation_analysis": {
    "rotation_angle": {rotationAngle},
    "direction": "{rotationDirection}",
    "score": {rotationScore},
    "user_explanation": "string (explain {rotationAngle}°)"
  },

  "3d_analysis": {
    "depth_difference": {depthDifference},
    "score": {depthScore},
    "interpretation": "string",
    "user_explanation": "string (explain {depthDifference})"
  },

  "proportional_analysis": {
    "width": {noseWidth},
    "width_ratio": {noseWidthRatio},
    "width_score": {widthScore},
    "width_assessment": "{widthAssessment}",
    "length": {noseLength},
    "length_ratio": {noseLengthRatio},
    "length_score": {lengthScore},
    "length_assessment": "{lengthAssessment}",
    "projection": {tipProjection},
    "projection_score": {projectionScore},
    "projection_assessment": "{projectionAssessment}",
    "user_explanation": "string (explain width, length, projection)"
  },

  "detailed_features": {
    "nostril_height_diff": {nostrilHeightDiff},
    "nostril_size_score": {nostrilSizeScore},
    "bridge_deviation": {bridgeDeviation},
    "bridge_straightness_score": {bridgeStraightnessScore},
    "bridge_assessment": "{bridgeAssessment}",
    "user_explanation": "string (explain nostril size and bridge straightness)"
  },

  "visual_assessment": {
    "prominent_asymmetry_areas": ["string based on lowest scores"],
    "visual_appearance": "string (describe how nose looks with these measurements)",
    "photo_effect": "string",
    "user_explanation": "string"
  },

  "recommendations": {
    "medical_advice": "string (IF score < 5, suggest professional evaluation)",
    "priority_intervention": "string (based on lowest sub-score)",
    "attention_points": ["string"]
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
- If you change a provided score, the system will reject your response
- Return ONLY JSON, no markdown code blocks`
},
  {
    id: 'lips',
    title: 'Dudaklar',
    icon: lipsIcon,
    description: 'Dudak şekli ve kalınlık',
    prompt: `You are a facial analysis expert. Analyze these PRE-CALCULATED lip metrics.

═══════════════════════════════════════════
IMPORTANT: DO NOT RECALCULATE
═══════════════════════════════════════════

All measurements below are already calculated from MediaPipe Face Mesh landmarks.
Your job: INTERPRET and EXPLAIN these values in plain Turkish, NOT to recalculate them.

═══════════════════════════════════════════
PRE-CALCULATED METRICS (1024x1024 canvas)
═══════════════════════════════════════════

CORNER ALIGNMENT (28% weight - most visible):
- Left corner: ({leftCornerX}, {leftCornerY})
- Right corner: ({rightCornerX}, {rightCornerY})
- Vertical misalignment: {cornerYDifference} pixels
- Lip line tilt: {lipLineTilt}° ({lipLineTiltDirection})
- Corner alignment score: {cornerAlignmentScore}/10

WIDTH SYMMETRY (24% weight):
- Total lip width: {lipWidth} pixels ({lipWidthRatio}% of face)
- Left half: {leftHalfWidth} pixels
- Right half: {rightHalfWidth} pixels
- Width asymmetry: {widthAsymmetry} pixels ({widthAsymmetryRatio}%)
- Width symmetry score: {lipWidthSymmetryScore}/10

UPPER LIP SYMMETRY (18% weight):
- Left upper lip height: {leftUpperLipHeight} pixels
- Right upper lip height: {rightUpperLipHeight} pixels
- Height difference: {upperLipHeightDifference} pixels ({upperLipHeightDifferenceRatio}%)
- Upper lip symmetry score: {upperLipSymmetryScore}/10

LOWER LIP SYMMETRY (15% weight):
- Left lower lip height: {leftLowerLipHeight} pixels
- Right lower lip height: {rightLowerLipHeight} pixels
- Height difference: {lowerLipHeightDifference} pixels ({lowerLipHeightDifferenceRatio}%)
- Lower lip symmetry score: {lowerLipSymmetryScore}/10

CUPID'S BOW (8% weight - aesthetic):
- Left peak height: {leftCupidBowHeight} pixels
- Right peak height: {rightCupidBowHeight} pixels
- Peak difference: {cupidBowDifference} pixels ({cupidBowDifferenceRatio}%)
- Cupid's bow present: {cupidBowPresence}
- Cupid's bow symmetry score: {cupidBowSymmetryScore}/10

UPPER/LOWER RATIO (5% weight):
- Upper lip height: {upperLipHeight} pixels
- Lower lip height: {lowerLipHeight} pixels
- Total lip height: {totalLipHeight} pixels
- Upper/Lower ratio: {upperLowerRatio} ({ratioAssessment})
- Ratio score: {upperLowerRatioScore}/10

VERMILLION BORDER:
- Left border Y: {leftLineY}
- Right border Y: {rightLineY}
- Border alignment: {lineYDifference} pixels ({lineYDifferenceRatio}%)
- Border symmetry score: {lineSymmetryScore}/10

3D DEPTH (2% weight - least reliable):
- Corner depth difference: {depthDifference} units
- Depth score: {depthScore}/10

OVERALL:
- Combined score: {overallScore}/10
- Asymmetry level: {asymmetryLevel}

═══════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════

Based on these EXACT numbers:
1. Explain what they mean to the user (in plain Turkish)
2. Describe the visual appearance of the lips
3. Provide context for each measurement
4. Give recommendations if needed

CRITICAL:
- DO NOT recalculate any values
- USE the exact numbers provided above in your explanations
- Reference specific measurements in every section
- Keep scores as provided (do not inflate)

═══════════════════════════════════════════
OUTPUT JSON FORMAT
═══════════════════════════════════════════

{
  "analysis_result": {
    "general_assessment": "string (reference the scores, in Turkish)",
    "asymmetry_level": "{asymmetryLevel}",
    "overall_score": {overallScore},
    "asymmetry_type": "string (describe primary pattern based on lowest sub-scores)"
  },

  "user_friendly_summary": {
    "assessment": "string (max 10 words in Turkish)",
    "explanation": "string (2-3 sentences, MUST reference cornerYDifference={cornerYDifference}px, widthAsymmetry={widthAsymmetry}px)",
    "key_findings": [
      "Dudak köşeleri {cornerYDifference}px dikey fark gösteriyor ({lipLineTiltDirection})",
      "Genişlik asimetrisi {widthAsymmetry}px ({widthAsymmetryRatio}%)",
      "Üst dudak yükseklik farkı {upperLipHeightDifference}px"
    ]
  },

  "corner_analysis": {
    "vertical_alignment": {
      "left_corner_y": {leftCornerY},
      "right_corner_y": {rightCornerY},
      "difference": {cornerYDifference},
      "tilt_angle": {lipLineTilt},
      "tilt_direction": "{lipLineTiltDirection}",
      "score": {cornerAlignmentScore},
      "interpretation": "string (explain what {cornerYDifference}px and {lipLineTilt}° mean)"
    },
    "horizontal_symmetry": {
      "left_half_width": {leftHalfWidth},
      "right_half_width": {rightHalfWidth},
      "asymmetry": {widthAsymmetry},
      "asymmetry_ratio": {widthAsymmetryRatio},
      "score": {lipWidthSymmetryScore},
      "interpretation": "string (explain {widthAsymmetry}px)"
    },
    "user_explanation": "string (Turkish)"
  },

  "upper_lip_analysis": {
    "left_height": {leftUpperLipHeight},
    "right_height": {rightUpperLipHeight},
    "asymmetry": {upperLipHeightDifference},
    "asymmetry_ratio": {upperLipHeightDifferenceRatio},
    "score": {upperLipSymmetryScore},
    "fullness": "string (based on {leftUpperLipHeight} and {rightUpperLipHeight}: <12px=İnce, 12-18px=Orta, >18px=Dolgun)",
    "user_explanation": "string (Turkish, reference exact heights)"
  },

  "lower_lip_analysis": {
    "left_height": {leftLowerLipHeight},
    "right_height": {rightLowerLipHeight},
    "asymmetry": {lowerLipHeightDifference},
    "asymmetry_ratio": {lowerLipHeightDifferenceRatio},
    "score": {lowerLipSymmetryScore},
    "fullness": "string (based on heights: <15px=İnce, 15-25px=Orta, >25px=Dolgun)",
    "user_explanation": "string (Turkish)"
  },

  "cupids_bow_analysis": {
    "present": {cupidBowPresence},
    "left_peak_height": {leftCupidBowHeight},
    "right_peak_height": {rightCupidBowHeight},
    "asymmetry": {cupidBowDifference},
    "asymmetry_ratio": {cupidBowDifferenceRatio},
    "score": {cupidBowSymmetryScore},
    "definition": "string (if {cupidBowPresence}=true and avg height >3px: 'Belirgin', 2-3px: 'Orta', <2px: 'Zayıf', else: 'Düz')",
    "user_explanation": "string (Turkish)"
  },

  "upper_lower_ratio": {
    "upper_height": {upperLipHeight},
    "lower_height": {lowerLipHeight},
    "ratio": {upperLowerRatio},
    "assessment": "{ratioAssessment}",
    "user_explanation": "string (explain {upperLowerRatio} - ideal is 0.7-1.0)"
  },

  "vermillion_border_analysis": {
    "left_y": {leftLineY},
    "right_y": {rightLineY},
    "alignment_difference": {lineYDifference},
    "alignment_ratio": {lineYDifferenceRatio},
    "score": {lineSymmetryScore},
    "user_explanation": "string (Turkish)"
  },

  "3d_analysis": {
    "depth_difference": {depthDifference},
    "score": {depthScore},
    "interpretation": "string (Turkish)",
    "user_explanation": "string (explain {depthDifference})"
  },

  "visual_assessment": {
    "prominent_asymmetry_areas": ["string (list areas with scores <7, based on sub-scores)"],
    "overall_balance": "string (describe lip balance based on {overallScore} and asymmetry pattern)",
    "aesthetic_notes": "string (based on cupid's bow, ratio, fullness)"
  },

  "recommendations": {
    "medical_advice": "string (IF {overallScore} < 5, suggest professional evaluation - Turkish)",
    "cosmetic_considerations": "string (if applicable - Turkish)",
    "attention_points": ["string (based on lowest sub-scores - Turkish)"]
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
- If you change a provided score, the system will reject your response
- All text in Turkish
- Keep explanations simple and conversational`,
  },
  {
    id: 'jawline',
    title: 'Çene Hattı',
    icon: jawlineIcon,
    description: 'Çene keskinliği ve şekli',
    prompt: `You are a facial analysis expert. Analyze these PRE-CALCULATED jawline metrics.

═══════════════════════════════════════════
IMPORTANT: DO NOT RECALCULATE
═══════════════════════════════════════════

All measurements below are already calculated from MediaPipe Face Mesh landmarks.
Your job: INTERPRET and EXPLAIN these values in plain Turkish, NOT to recalculate them.

═══════════════════════════════════════════
PRE-CALCULATED METRICS (1024x1024 canvas)
═══════════════════════════════════════════

CHIN CENTERING (30% weight - most critical):
- Chin tip position: ({chinTipX}, {chinTipY})
- Face center X: {faceCenterX}
- Chin deviation: {chinDeviation} pixels ({chinDirection})
- Deviation ratio: {chinDeviationRatio}%
- Chin centering score: {chinCenteringScore}/10

JAWLINE SYMMETRY (25% weight):
- Left jaw length: {leftJawLength} pixels
- Right jaw length: {rightJawLength} pixels
- Length difference: {jawLengthDifference} pixels ({jawLengthDifferenceRatio}%)
- Left jaw angle Y: {leftJawAngleY}
- Right jaw angle Y: {rightJawAngleY}
- Angle Y difference: {jawAngleYDifference} pixels
- Jawline symmetry score: {jawlineSymmetryScore}/10

JAW ANGLE SYMMETRY (20% weight - angle difference only):
- Left jaw angle: {leftJawAngle}°
- Right jaw angle: {rightJawAngle}°
- Angle difference: {jawAngleDifference}°
- Jaw angle symmetry score: {jawAngleSymmetryScore}/10

JAW WIDTH (15% weight - proportionality):
- Jaw width: {jawWidth} pixels
- Face width: {faceWidth} pixels
- Jaw width ratio: {jawWidthRatio}% ({jawWidthAssessment})
- Jaw width score: {jawWidthScore}/10

VERTICAL ALIGNMENT (10% weight):
- Nose to chin distance: {noseToChinDistance} pixels
- Expected chin Y: {expectedChinY}
- Vertical deviation: {verticalDeviation} pixels
- Vertical alignment score: {verticalAlignmentScore}/10

OVERALL:
- Combined score: {overallScore}/10
- Asymmetry level: {asymmetryLevel}
- Face height: {faceHeight} pixels

═══════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════

Based on these EXACT numbers:
1. Explain what they mean to the user (in plain Turkish)
2. Describe the visual appearance of the jawline
3. Provide context for each measurement
4. Give recommendations if needed

CRITICAL:
- DO NOT recalculate any values
- USE the exact numbers provided above in your explanations
- Reference specific measurements in every section
- Keep scores as provided (do not inflate)

═══════════════════════════════════════════
OUTPUT JSON FORMAT
═══════════════════════════════════════════

{
  "analysis_result": {
    "general_assessment": "string (reference the scores, in Turkish)",
    "asymmetry_level": "{asymmetryLevel}",
    "overall_score": {overallScore},
    "dominant_asymmetry": "string (describe primary pattern based on lowest sub-scores)"
  },

  "user_friendly_summary": {
    "assessment": "string (max 10 words in Turkish)",
    "explanation": "string (2-3 sentences, MUST reference chinDeviation={chinDeviation}px, jawLengthDifference={jawLengthDifference}px)",
    "key_findings": [
      "Çene ucu merkezden {chinDeviation}px sapma gösteriyor ({chinDirection})",
      "Çene hattı uzunluk farkı {jawLengthDifference}px ({jawLengthDifferenceRatio}%)",
      "Çene açısı farkı {jawAngleDifference}°"
    ]
  },

  "chin_tip_analysis": {
    "deviation": {chinDeviation},
    "deviation_ratio": {chinDeviationRatio},
    "direction": "{chinDirection}",
    "score": {chinCenteringScore},
    "user_explanation": "string (explain what {chinDeviation}px and {chinDeviationRatio}% mean)"
  },

  "jaw_corner_analysis": {
    "left_angle_y": {leftJawAngleY},
    "right_angle_y": {rightJawAngleY},
    "y_level_difference": {jawAngleYDifference},
    "score": {jawlineSymmetryScore},
    "user_explanation": "string (explain {jawAngleYDifference}px)"
  },

  "jawline_analysis": {
    "left_length": {leftJawLength},
    "right_length": {rightJawLength},
    "length_difference": {jawLengthDifference},
    "length_difference_ratio": {jawLengthDifferenceRatio},
    "length_score": {jawlineSymmetryScore},
    "left_angle": {leftJawAngle},
    "right_angle": {rightJawAngle},
    "angle_difference": {jawAngleDifference},
    "angle_score": {jawAngleSymmetryScore},
    "user_explanation": "string (Turkish)"
  },

  "jaw_dimensions": {
    "jaw_width": {jawWidth},
    "face_width": {faceWidth},
    "jaw_width_ratio": {jawWidthRatio},
    "width_assessment": "{jawWidthAssessment}",
    "width_score": {jawWidthScore},
    "face_height": {faceHeight},
    "user_explanation": "string (explain {jawWidthRatio}%)"
  },

  "jaw_angles": {
    "left_angle": {leftJawAngle},
    "right_angle": {rightJawAngle},
    "angle_difference": {jawAngleDifference},
    "score": {jawAngleSymmetryScore},
    "user_explanation": "string (Turkish, explain angle difference only - sharpness requires side profile)"
  },

  "vertical_alignment": {
    "nose_to_chin_distance": {noseToChinDistance},
    "expected_chin_y": {expectedChinY},
    "vertical_deviation": {verticalDeviation},
    "score": {verticalAlignmentScore},
    "user_explanation": "string (Turkish)"
  },

  "visual_assessment": {
    "prominent_asymmetry_areas": ["string (list areas with scores <7)"],
    "overall_balance": "string (describe jawline balance based on {overallScore})",
    "aesthetic_notes": "string (based on width and symmetry - frontal view only)"
  },

  "recommendations": {
    "medical_advice": "string (IF {overallScore} < 5, suggest professional evaluation - Turkish)",
    "aesthetic_considerations": "string (if applicable - Turkish)",
    "attention_points": ["string (based on lowest sub-scores - Turkish)"]
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
- If you change a provided score, the system will reject your response
- All text in Turkish
- Keep explanations simple and conversational`,
  },
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
1. Explain the detected face shape in Turkish
2. Describe what the facial proportions mean
3. Explain the thirds balance
4. Provide style recommendations based on face shape

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
    "general_assessment": "string (reference the scores)",
    "overall_score": {overallScore}                 // COPY provided value
  },

  "user_friendly_summary": {
    "assessment": "string (max 10 words)",
    "explanation": "string (2-3 sentences, MUST reference faceShape={faceShape}, lengthWidthRatio={lengthWidthRatio}, etc.)",
    "key_findings": [
      "Yüz şekliniz: {faceShape} (güven: {shapeConfidence}/10)",
      "Uzunluk/genişlik oranı: {lengthWidthRatio}",
      "Yüz üçlü dengesi: Üst %{upperThirdRatio}, Orta %{middleThirdRatio}, Alt %{lowerThirdRatio}"
    ]
  },

  "dimension_measurements": {
    "face_length": {faceLength},                    // COPY
    "face_width": {faceWidth},                      // COPY
    "cheekbone_width": {cheekboneWidth},            // COPY
    "jawline_width": {jawlineWidth},                // COPY
    "forehead_width": {foreheadWidth},              // COPY
    "user_explanation": "string (explain these measurements in context)"
  },

  "shape_classification": {
    "detected_shape": "{faceShape}",                // COPY
    "confidence": {shapeConfidence},                // COPY
    "alternative": "{alternativeShape}",            // COPY
    "length_width_ratio": {lengthWidthRatio},       // COPY
    "jaw_cheek_ratio": {jawCheekRatio},             // COPY
    "forehead_jaw_ratio": {foreheadJawRatio},       // COPY
    "user_explanation": "string (explain why this shape was detected)"
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
    "user_explanation": "string (explain thirds balance)"
  },

  "symmetry_analysis": {
    "left_face_width": {leftFaceWidth},             // COPY
    "right_face_width": {rightFaceWidth},           // COPY
    "horizontal_asymmetry": {horizontalAsymmetry},  // COPY
    "asymmetry_ratio": {horizontalAsymmetryRatio},  // COPY
    "symmetry_score": {horizontalSymmetryScore},    // COPY
    "user_explanation": "string (explain symmetry)"
  },

  "proportion_analysis": {
    "golden_ratio_deviation": {goldenRatioDeviation},  // COPY
    "golden_ratio_score": {goldenRatioScore},          // COPY
    "proportion_score": {proportionScore},             // COPY
    "proportion_assessment": "{proportionAssessment}", // COPY
    "user_explanation": "string (explain golden ratio and proportions)"
  },

  "style_recommendations": {
    "hairstyle_suggestions": ["string (based on {faceShape})"],
    "accessory_suggestions": ["string"],
    "makeup_tips": ["string (if applicable)"],
    "user_explanation": "string"
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
