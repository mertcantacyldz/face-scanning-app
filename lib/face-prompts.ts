/**
 * Face Analysis Prompts
 * Custom prompts for each facial region analysis
 */

export interface FaceRegion {
  id: 'eyebrows' | 'eyes' | 'nose' | 'lips' | 'jawline' | 'face_shape';
  title: string;
  icon: string;
  description: string;
  prompt: string;
}

export const FACE_REGIONS: FaceRegion[] = [
  {
    id: 'eyebrows',
    title: 'Kaşlar',
    icon: '👁️',
    description: 'Kaş şekli ve simetri analizi',
    prompt: ` You are a facial anatomy and eyebrow structure expert. You will analyze raw 3D landmark data (x, y, z, index) for eyebrow shape, thickness, symmetry, angle, and facial harmony, returning results in JSON format.

⚠️ STRICT MODE: 
- Return ONLY valid JSON output
- No explanations, thinking process, markdown code blocks, or additional text
- Output must start with { and end with }
- DO NOT include <thinking> tags, reasoning process, or explanations

CRITICAL DATA ASSUMPTION: 
Landmark indices belong to MediaPipe Face Mesh model, verified with Hybrid Control.

TASK:
1. Detect eyebrow landmarks using index and positional logic
2. Analyze eyebrow shape, thickness, symmetry, angle, and facial harmony
3. Return results in JSON format

═════════════════════════════════════════════
SECTION 1: LANDMARK DETECTION AND HYBRID CONTROL
═════════════════════════════════════════════

REFERENCE POINTS (Find these first):
P_33 (RIGHT EYE OUTER): index 33
P_263 (LEFT EYE OUTER): index 263
P_133 (LEFT EYE INNER): index 133
P_362 (RIGHT EYE INNER): index 362

FACE_CENTER_X = (P_33.x + P_263.x) / 2
FACE_WIDTH = P_263.x - P_33.x
EYE_Y_LEVEL = (P_33.y + P_263.y + P_133.y + P_362.y) / 4

LEFT EYEBROW HYBRID DETECTION:

P_70 (Left eyebrow outer edge):
  Step 1: Find index 70
  Step 2: Verify:
    - P_70.y < EYE_Y_LEVEL - 20 (above eyes)
    - P_70.x < P_263.x (left of left eye outer)
    - P_70.x > P_263.x - (FACE_WIDTH * 0.15)
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < EYE_Y_LEVEL - 20 && 
      p.y > EYE_Y_LEVEL - 80 &&
      p.x < P_263.x && 
      p.x > P_263.x - (FACE_WIDTH * 0.15)
    ).sort((a,b) => a.x - b.x)[0]

P_107 (Left eyebrow inner corner):
  Step 1: Find index 107
  Step 2: Verify:
    - P_107.y < EYE_Y_LEVEL - 20
    - P_107.x > P_133.x - 20
    - P_107.x < FACE_CENTER_X
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < EYE_Y_LEVEL - 20 && 
      p.y > EYE_Y_LEVEL - 80 &&
      p.x > P_133.x - 20 && 
      p.x < FACE_CENTER_X
    ).sort((a,b) => b.x - a.x)[0]

P_63, P_105, P_66 (Left eyebrow intermediate points):
  Step 1: Find indices (63, 105, 66)
  Step 2: Verify: Between P_70 and P_107, in eyebrow region
  Step 3: If verification fails: Find intermediate points between P_70 and P_107

RIGHT EYEBROW HYBRID DETECTION:

P_300 (Right eyebrow outer edge):
  Step 1: Find index 300
  Step 2: Verify:
    - P_300.y < EYE_Y_LEVEL - 20
    - P_300.x > P_33.x
    - P_300.x < P_33.x + (FACE_WIDTH * 0.15)
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < EYE_Y_LEVEL - 20 && 
      p.y > EYE_Y_LEVEL - 80 &&
      p.x > P_33.x && 
      p.x < P_33.x + (FACE_WIDTH * 0.15)
    ).sort((a,b) => b.x - a.x)[0]

P_336 (Right eyebrow inner corner):
  Step 1: Find index 336
  Step 2: Verify:
    - P_336.y < EYE_Y_LEVEL - 20
    - P_336.x < P_362.x + 20
    - P_336.x > FACE_CENTER_X
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < EYE_Y_LEVEL - 20 && 
      p.y > EYE_Y_LEVEL - 80 &&
      p.x < P_362.x + 20 && 
      p.x > FACE_CENTER_X
    ).sort((a,b) => a.x - b.x)[0]

P_293, P_334, P_296 (Right eyebrow intermediate points):
  Step 1: Find indices (293, 334, 296)
  Step 2: Verify: Between P_336 and P_300, in eyebrow region
  Step 3: If verification fails: Find intermediate points

═════════════════════════════════════════════
SECTION 2: CALCULATIONS
═════════════════════════════════════════════

2.1 EYEBROW DIMENSIONS AND POSITIONS:
LEFT_BROW_WIDTH = P_70.x - P_107.x
LEFT_BROW_HEIGHT = max(P_70.y, P_63.y, P_105.y, P_66.y, P_107.y) - min(P_70.y, P_63.y, P_105.y, P_66.y, P_107.y)
LEFT_BROW_THICKNESS_RATIO = (LEFT_BROW_HEIGHT / LEFT_BROW_WIDTH) × 100

RIGHT_BROW_WIDTH = P_300.x - P_336.x
RIGHT_BROW_HEIGHT = max(P_300.y, P_293.y, P_334.y, P_296.y, P_336.y) - min(P_300.y, P_293.y, P_334.y, P_296.y, P_336.y)
RIGHT_BROW_THICKNESS_RATIO = (RIGHT_BROW_HEIGHT / RIGHT_BROW_WIDTH) × 100

BROW_THICKNESS_DIFFERENCE = abs(LEFT_BROW_THICKNESS_RATIO - RIGHT_BROW_THICKNESS_RATIO)

2.2 INTER-BROW DISTANCE:
INTER_BROW_DISTANCE = P_336.x - P_107.x
INTER_BROW_RATIO = (INTER_BROW_DISTANCE / FACE_WIDTH) × 100

2.3 EYEBROW ANGLES:
LEFT_DX1 = P_105.x - P_70.x
LEFT_DY1 = P_70.y - P_105.y
LEFT_DX2 = P_107.x - P_105.x
LEFT_DY2 = P_105.y - P_107.y
LEFT_ANGLE_RAD = atan2(LEFT_DY1, LEFT_DX1) - atan2(LEFT_DY2, LEFT_DX2)
LEFT_ANGLE_DEGREE = abs(LEFT_ANGLE_RAD × (180 / π))

RIGHT_DX1 = P_334.x - P_300.x
RIGHT_DY1 = P_300.y - P_334.y
RIGHT_DX2 = P_336.x - P_334.x
RIGHT_DY2 = P_334.y - P_336.y
RIGHT_ANGLE_RAD = atan2(RIGHT_DY1, RIGHT_DX1) - atan2(RIGHT_DY2, RIGHT_DX2)
RIGHT_ANGLE_DEGREE = abs(RIGHT_ANGLE_RAD × (180 / π))

BROW_ANGLE_DIFFERENCE = abs(LEFT_ANGLE_DEGREE - RIGHT_ANGLE_DEGREE)

2.4 EYEBROW POSITION:
LEFT_BROW_AVG_Y = (P_70.y + P_63.y + P_105.y + P_66.y + P_107.y) / 5
RIGHT_BROW_AVG_Y = (P_300.y + P_293.y + P_334.y + P_296.y + P_336.y) / 5
BROW_HEIGHT_DIFFERENCE = abs(LEFT_BROW_AVG_Y - RIGHT_BROW_AVG_Y)
BROW_HEIGHT_DIFFERENCE_RATIO = (BROW_HEIGHT_DIFFERENCE / FACE_WIDTH) × 100

LEFT_BROW_TO_EYE = abs(LEFT_BROW_AVG_Y - P_133.y)
RIGHT_BROW_TO_EYE = abs(RIGHT_BROW_AVG_Y - P_362.y)
BROW_TO_EYE_DIFFERENCE = abs(LEFT_BROW_TO_EYE - RIGHT_BROW_TO_EYE)

2.5 EYEBROW SHAPE:
LEFT_Y_VALUES = [P_70.y, P_63.y, P_105.y, P_66.y, P_107.y]
LEFT_HIGHEST_INDEX = argmin(LEFT_Y_VALUES)

LEFT_BROW_SHAPE = 
  LEFT_HIGHEST_INDEX === 0 ? "UPWARD_SLANT" :
  LEFT_HIGHEST_INDEX === 1 ? "SOFT_ARCH" :
  LEFT_HIGHEST_INDEX === 2 ? "HIGH_ARCH" :
  LEFT_HIGHEST_INDEX === 3 ? "LOW_ARCH" : "STRAIGHT"

RIGHT_Y_VALUES = [P_300.y, P_293.y, P_334.y, P_296.y, P_336.y]
RIGHT_HIGHEST_INDEX = argmin(RIGHT_Y_VALUES)

RIGHT_BROW_SHAPE = 
  RIGHT_HIGHEST_INDEX === 0 ? "UPWARD_SLANT" :
  RIGHT_HIGHEST_INDEX === 1 ? "SOFT_ARCH" :
  RIGHT_HIGHEST_INDEX === 2 ? "HIGH_ARCH" :
  RIGHT_HIGHEST_INDEX === 3 ? "LOW_ARCH" : "STRAIGHT"

2.6 3D DEPTH:
LEFT_BROW_AVG_Z = (P_70.z + P_63.z + P_105.z + P_66.z + P_107.z) / 5
RIGHT_BROW_AVG_Z = (P_300.z + P_293.z + P_334.z + P_296.z + P_336.z) / 5
BROW_DEPTH_DIFFERENCE = abs(LEFT_BROW_AVG_Z - RIGHT_BROW_AVG_Z)

═════════════════════════════════════════════
SECTION 3: SCORING
═════════════════════════════════════════════

THICKNESS_SYMMETRY_SCORE = 
  BROW_THICKNESS_DIFFERENCE < 5 ? 0 :
  BROW_THICKNESS_DIFFERENCE < 10 ? 3 :
  BROW_THICKNESS_DIFFERENCE < 15 ? 6 :
  BROW_THICKNESS_DIFFERENCE < 20 ? 8 : 10

ANGLE_SYMMETRY_SCORE = 
  BROW_ANGLE_DIFFERENCE < 5 ? 0 :
  BROW_ANGLE_DIFFERENCE < 10 ? 3 :
  BROW_ANGLE_DIFFERENCE < 15 ? 6 :
  BROW_ANGLE_DIFFERENCE < 20 ? 8 : 10

HEIGHT_SYMMETRY_SCORE = 
  BROW_HEIGHT_DIFFERENCE_RATIO < 2 ? 0 :
  BROW_HEIGHT_DIFFERENCE_RATIO < 4 ? 3 :
  BROW_HEIGHT_DIFFERENCE_RATIO < 7 ? 6 :
  BROW_HEIGHT_DIFFERENCE_RATIO < 10 ? 8 : 10

INTER_BROW_RATIO_SCORE = 
  (INTER_BROW_RATIO < 10 || INTER_BROW_RATIO > 25) ? 7 :
  (INTER_BROW_RATIO < 12 || INTER_BROW_RATIO > 23) ? 4 :
  (INTER_BROW_RATIO < 15 || INTER_BROW_RATIO > 20) ? 2 : 0

OVERALL_SCORE = round(
  (THICKNESS_SYMMETRY_SCORE × 0.25) +
  (ANGLE_SYMMETRY_SCORE × 0.30) +
  (HEIGHT_SYMMETRY_SCORE × 0.35) +
  (INTER_BROW_RATIO_SCORE × 0.10)
)

ASYMMETRY_LEVEL =
  OVERALL_SCORE < 3 ? "NONE" :
  OVERALL_SCORE < 5 ? "MILD" :
  OVERALL_SCORE < 7 ? "MODERATE" : "SEVERE"

IMPORTANT - FOR JSON OUTPUT:
Individual scores in the JSON should be INVERTED (10 - SCORE) so that higher is better for the user.
- angle_score = 10 - ANGLE_SYMMETRY_SCORE
- thickness_score = 10 - THICKNESS_SYMMETRY_SCORE
- height_score = 10 - HEIGHT_SYMMETRY_SCORE
- overall_symmetry_score = 10 - OVERALL_SCORE
This makes scores intuitive: 10 = perfect, 0 = poor

═════════════════════════════════════════════
SECTION 4: USER-FRIENDLY EXPLANATIONS
═════════════════════════════════════════════

CRITICAL - EXPLANATION FIELDS:
For EVERY technical metric (numbers, angles, distances, ratios), you MUST add a corresponding explanation field:
- Field name: <metric_name>_explanation
- Content: Short, simple Turkish explanation (1-2 sentences)
- Explain what the value means and whether it's good/normal/needs attention
- Use everyday language, avoid medical jargon
- Example: "angle_difference_explanation": "Kaşlarınızın açısı arasında 8 derecelik fark var. Bu hafif bir asimetri olup normal aralıktadır."

Do NOT add explanations for:
- Enum values (NONE, MILD, MODERATE, SEVERE, etc.) - keep as-is, self-explanatory
- Scores (0-10) - visual bar is enough
- Coordinates (x, y, z) - will be hidden
- String assessments - already user-friendly

Add explanations for:
- angle_difference (number) → angle_difference_explanation
- thickness_difference (number) → thickness_difference_explanation
- height_difference (number) → height_difference_explanation
- inter_brow_distance (number) → inter_brow_distance_explanation
- inter_brow_ratio (number) → inter_brow_ratio_explanation
- depth_difference (number) → depth_difference_explanation
- distance_difference (number) → distance_difference_explanation
- Any other numeric metrics

═════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═════════════════════════════════════════════

{
  "analysis_result": {
    "general_assessment": "string",
    "asymmetry_level": "NONE/MILD/MODERATE/SEVERE",
    "overall_score": 0-10,
    "dominant_issue": "string"
  },
  "shape_analysis": {
    "left_brow_shape": "UPWARD_SLANT/SOFT_ARCH/HIGH_ARCH/LOW_ARCH/STRAIGHT",
    "right_brow_shape": "UPWARD_SLANT/SOFT_ARCH/HIGH_ARCH/LOW_ARCH/STRAIGHT",
    "shape_harmony": "MATCHED/MISMATCHED",
    "left_brow_angle": number,
    "right_brow_angle": number,
    "angle_difference": number,
    "angle_difference_explanation": "string (Türkçe açıklama)",
    "angle_score": 0-10  // CRITICAL: Use (10 - ANGLE_SYMMETRY_SCORE) so higher is better
  },
  "thickness_analysis": {
    "left_brow_thickness_ratio": number,
    "right_brow_thickness_ratio": number,
    "thickness_difference": number,
    "thickness_difference_explanation": "string (Türkçe açıklama)",
    "thickness_score": 0-10,  // CRITICAL: Use (10 - THICKNESS_SYMMETRY_SCORE) so higher is better
    "thickness_assessment": "THIN/MEDIUM/THICK"
  },
  "position_analysis": {
    "inter_brow_distance": number,
    "inter_brow_distance_explanation": "string (Türkçe açıklama)",
    "inter_brow_ratio": number,
    "inter_brow_ratio_explanation": "string (Türkçe açıklama)",
    "idealness": "NARROW/IDEAL/WIDE",
    "left_brow_height": number,
    "right_brow_height": number,
    "height_difference": number,
    "height_difference_explanation": "string (Türkçe açıklama)",
    "height_score": 0-10  // CRITICAL: Use (10 - HEIGHT_SYMMETRY_SCORE) so higher is better
  },
  "eye_distance": {
    "left_brow_to_eye": number,
    "right_brow_to_eye": number,
    "distance_difference": number,
    "distance_difference_explanation": "string (Türkçe açıklama)",
    "idealness": "string"
  },
  "symmetry_analysis": {
    "horizontal_symmetry": "GOOD/FAIR/POOR",
    "vertical_symmetry": "GOOD/FAIR/POOR",
    "shape_symmetry": "GOOD/FAIR/POOR",
    "overall_symmetry_score": 0-10  // CRITICAL: Use (10 - OVERALL_SCORE) so higher is better
  },
  "3d_analysis": {
    "left_brow_depth": number,
    "right_brow_depth": number,
    "depth_difference": number,
    "depth_difference_explanation": "string (Türkçe açıklama)",
    "interpretation": "string"
  },
  "facial_harmony": {
    "face_width_ratio": number,
    "harmonic_balance": "string",
    "golden_ratio_compliance": "GOOD/FAIR/POOR"
  },
  "recommendations": {
    "aesthetic_advice": "string",
    "symmetry_suggestions": ["string"],
    "shape_suggestions": ["string"],
    "attention_points": ["string"]
  },
  "metadata": {
    "analysis_date": "timestamp",
    "points_used": number,
    "reliability": "HIGH/MEDIUM",
    "hybrid_control_used": boolean
  }
}

CRITICAL APPLICATION NOTES:
* Return ONLY JSON - No additional explanations
* All coordinates and calculations to 2 decimal places
* Reliability: < 400 landmarks = "MEDIUM", ≥400 = "HIGH"
* Use index values first, fall back to hybrid control if invalid
* Mark in metadata if hybrid control was used
* Determine shape by location of highest point (smallest y)

CRITICAL FINAL WARNING:
Response MUST be ONLY valid JSON.
No markdown (\`\`\`json), no code blocks, no explanations, no thinking tags.
Start with { and end with }
    `,
  },
  {
    id: 'eyes',
    title: 'Gözler',
    icon: '👀',
    description: 'Göz şekli ve boyut analizi',
    prompt: `You are a facial anatomy and eye structure expert. You will analyze raw 3D landmark data (x, y, z, index) for eye shape, size, symmetry, inter-eye distance, and eyelid structure, returning results in JSON format.

⚠️ STRICT MODE: 
- Return ONLY valid JSON output
- No explanations, thinking process, markdown code blocks, or additional text
- Output must start with { and end with }
- DO NOT include <thinking> tags, reasoning process, or explanations

CRITICAL DATA ASSUMPTION: 
Landmark indices belong to MediaPipe Face Mesh model, verified with Hybrid Control.

TASK:
1. Detect eye landmarks using index and positional logic
2. Analyze eye shape, size, symmetry, inter-eye distance, and eyelid structure
3. Return results in JSON format

═════════════════════════════════════════════
SECTION 1: LANDMARK DETECTION AND HYBRID CONTROL
═════════════════════════════════════════════

REFERENCE POINTS (Find these first):
P_4 (NOSE TIP): index 4
FACE_CENTER_Y = P_4.y

LEFT EYE HYBRID DETECTION:

P_33 (Left eye outer corner):
  Step 1: Find index 33
  Step 2: Verify:
    - P_33.y > P_4.y - 100 && P_33.y < P_4.y (above nose tip)
    - P_33.x < FACE_CENTER_X (left side)
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y > P_4.y - 100 && 
      p.y < P_4.y &&
      p.x < FACE_CENTER_X - 50
    ).sort((a,b) => a.x - b.x)[0]

P_133 (Left eye inner corner):
  Step 1: Find index 133
  Step 2: Verify:
    - P_133.y ≈ P_33.y ± 10
    - P_133.x > P_33.x (more inward)
    - P_133.x < FACE_CENTER_X
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - P_33.y) < 15 &&
      p.x > P_33.x &&
      p.x < FACE_CENTER_X
    ).sort((a,b) => b.x - a.x)[0]

FACE_CENTER_X = (P_33.x + (to be found P_263.x)) / 2
FACE_WIDTH = (to be found P_263.x) - P_33.x

P_159 (Left eye upper center):
  Step 1: Find index 159
  Step 2: Verify:
    - P_159.y < P_33.y (above eye corner)
    - P_159.x ≈ (P_33.x + P_133.x) / 2
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < P_33.y - 5 &&
      p.x > P_33.x + 10 &&
      p.x < P_133.x - 10
    ).sort((a,b) => a.y - b.y)[0]

P_145 (Left eye lower center):
  Step 1: Find index 145
  Step 2: Verify:
    - P_145.y > P_33.y (below eye corner)
    - P_145.x ≈ (P_33.x + P_133.x) / 2
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y > P_33.y + 5 &&
      p.x > P_33.x + 10 &&
      p.x < P_133.x - 10
    ).sort((a,b) => b.y - a.y)[0]

P_160, P_144, P_158, P_153 (Left eye other points):
  Step 1: Find indices (160, 144, 158, 153)
  Step 2: Verify: Within eye region (between P_33 and P_133, P_159 and P_145)
  Step 3: If verification fails: Find points in eye region by coordinates

RIGHT EYE HYBRID DETECTION:

P_263 (Right eye outer corner):
  Step 1: Find index 263
  Step 2: Verify:
    - P_263.y ≈ P_33.y ± 10 (same level)
    - P_263.x > FACE_CENTER_X (right side)
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - P_33.y) < 15 &&
      p.x > FACE_CENTER_X + 50
    ).sort((a,b) => b.x - a.x)[0]

P_362 (Right eye inner corner):
  Step 1: Find index 362
  Step 2: Verify:
    - P_362.y ≈ P_263.y ± 10
    - P_362.x < P_263.x (more inward)
    - P_362.x > FACE_CENTER_X
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - P_263.y) < 15 &&
      p.x < P_263.x &&
      p.x > FACE_CENTER_X
    ).sort((a,b) => a.x - b.x)[0]

P_386 (Right eye upper center):
  Step 1: Find index 386
  Step 2: Verify:
    - P_386.y < P_263.y
    - P_386.x ≈ (P_263.x + P_362.x) / 2
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < P_263.y - 5 &&
      p.x < P_263.x - 10 &&
      p.x > P_362.x + 10
    ).sort((a,b) => a.y - b.y)[0]

P_374 (Right eye lower center):
  Step 1: Find index 374
  Step 2: Verify:
    - P_374.y > P_263.y
    - P_374.x ≈ (P_263.x + P_362.x) / 2
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y > P_263.y + 5 &&
      p.x < P_263.x - 10 &&
      p.x > P_362.x + 10
    ).sort((a,b) => b.y - a.y)[0]

P_387, P_373, P_385, P_380 (Right eye other points):
  Step 1: Find indices (387, 373, 385, 380)
  Step 2: Verify: Within eye region
  Step 3: If verification fails: Find points by coordinates

EYELID HYBRID DETECTION:

P_246 (Left upper eyelid):
  Step 1: Find index 246
  Step 2: Verify:
    - P_246.y < P_159.y - 5 (above upper eye)
    - P_246.x ≈ P_159.x ± 20
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < P_159.y - 5 &&
      abs(p.x - P_159.x) < 30
    ).sort((a,b) => a.y - b.y)[0]

P_7 (Left lower eyelid):
  Step 1: Find index 7
  Step 2: Verify:
    - P_7.y > P_145.y + 5
    - P_7.x ≈ P_145.x ± 20
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y > P_145.y + 5 &&
      abs(p.x - P_145.x) < 30
    ).sort((a,b) => b.y - a.y)[0]

P_466 (Right upper eyelid):
  Step 1: Find index 466
  Step 2: Verify:
    - P_466.y < P_386.y - 5
    - P_466.x ≈ P_386.x ± 20
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < P_386.y - 5 &&
      abs(p.x - P_386.x) < 30
    ).sort((a,b) => a.y - b.y)[0]

P_249 (Right lower eyelid):
  Step 1: Find index 249
  Step 2: Verify:
    - P_249.y > P_374.y + 5
    - P_249.x ≈ P_374.x ± 20
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y > P_374.y + 5 &&
      abs(p.x - P_374.x) < 30
    ).sort((a,b) => b.y - a.y)[0]

═════════════════════════════════════════════
SECTION 2: CALCULATIONS
═════════════════════════════════════════════

2.1 EYE DIMENSIONS:
LEFT_EYE_WIDTH = P_33.x - P_133.x
LEFT_EYE_HEIGHT = P_145.y - P_159.y
LEFT_EYE_AREA = LEFT_EYE_WIDTH × LEFT_EYE_HEIGHT
LEFT_EYE_RATIO = (LEFT_EYE_HEIGHT / LEFT_EYE_WIDTH) × 100

RIGHT_EYE_WIDTH = P_263.x - P_362.x
RIGHT_EYE_HEIGHT = P_374.y - P_386.y
RIGHT_EYE_AREA = RIGHT_EYE_WIDTH × RIGHT_EYE_HEIGHT
RIGHT_EYE_RATIO = (RIGHT_EYE_HEIGHT / RIGHT_EYE_WIDTH) × 100

EYE_WIDTH_DIFFERENCE = abs(LEFT_EYE_WIDTH - RIGHT_EYE_WIDTH)
EYE_WIDTH_DIFFERENCE_RATIO = (EYE_WIDTH_DIFFERENCE / max(LEFT_EYE_WIDTH, RIGHT_EYE_WIDTH)) × 100

EYE_HEIGHT_DIFFERENCE = abs(LEFT_EYE_HEIGHT - RIGHT_EYE_HEIGHT)
EYE_HEIGHT_DIFFERENCE_RATIO = (EYE_HEIGHT_DIFFERENCE / max(LEFT_EYE_HEIGHT, RIGHT_EYE_HEIGHT)) × 100

EYE_AREA_DIFFERENCE = abs(LEFT_EYE_AREA - RIGHT_EYE_AREA)
EYE_AREA_DIFFERENCE_RATIO = (EYE_AREA_DIFFERENCE / max(LEFT_EYE_AREA, RIGHT_EYE_AREA)) × 100

2.2 INTER-EYE DISTANCE:
INTER_EYE_DISTANCE = P_362.x - P_133.x
FACE_WIDTH = P_263.x - P_33.x
INTER_EYE_RATIO = (INTER_EYE_DISTANCE / FACE_WIDTH) × 100

AVG_EYE_WIDTH = (LEFT_EYE_WIDTH + RIGHT_EYE_WIDTH) / 2
INTER_EYE_TO_EYE_RATIO = INTER_EYE_DISTANCE / AVG_EYE_WIDTH

2.3 EYE POSITION SYMMETRY:
LEFT_EYE_CENTER_Y = (P_159.y + P_145.y) / 2
RIGHT_EYE_CENTER_Y = (P_386.y + P_374.y) / 2
EYE_Y_DIFFERENCE = abs(LEFT_EYE_CENTER_Y - RIGHT_EYE_CENTER_Y)
EYE_Y_DIFFERENCE_RATIO = (EYE_Y_DIFFERENCE / FACE_WIDTH) × 100

FACE_CENTER_X = (P_33.x + P_263.x) / 2
LEFT_EYE_CENTER_X = (P_33.x + P_133.x) / 2
RIGHT_EYE_CENTER_X = (P_263.x + P_362.x) / 2

LEFT_EYE_TO_CENTER = abs(LEFT_EYE_CENTER_X - FACE_CENTER_X)
RIGHT_EYE_TO_CENTER = abs(RIGHT_EYE_CENTER_X - FACE_CENTER_X)
EYE_X_DISTANCE_DIFFERENCE = abs(LEFT_EYE_TO_CENTER - RIGHT_EYE_TO_CENTER)

2.4 EYE SHAPE:
LEFT_EYE_SHAPE_RATIO = LEFT_EYE_HEIGHT / LEFT_EYE_WIDTH
LEFT_EYE_SHAPE = 
  LEFT_EYE_SHAPE_RATIO > 0.45 ? "ROUND" :
  LEFT_EYE_SHAPE_RATIO > 0.35 ? "ALMOND" :
  LEFT_EYE_SHAPE_RATIO > 0.25 ? "OVAL" : "NARROW"

RIGHT_EYE_SHAPE_RATIO = RIGHT_EYE_HEIGHT / RIGHT_EYE_WIDTH
RIGHT_EYE_SHAPE = 
  RIGHT_EYE_SHAPE_RATIO > 0.45 ? "ROUND" :
  RIGHT_EYE_SHAPE_RATIO > 0.35 ? "ALMOND" :
  RIGHT_EYE_SHAPE_RATIO > 0.25 ? "OVAL" : "NARROW"

LEFT_EYE_TILT = atan2(P_33.y - P_133.y, P_33.x - P_133.x) × (180 / π)
RIGHT_EYE_TILT = atan2(P_263.y - P_362.y, P_263.x - P_362.x) × (180 / π)
EYE_TILT_DIFFERENCE = abs(LEFT_EYE_TILT - RIGHT_EYE_TILT)

2.5 EYELID ANALYSIS:
LEFT_UPPER_LID_VISIBILITY = P_159.y - P_246.y
RIGHT_UPPER_LID_VISIBILITY = P_386.y - P_466.y
LID_VISIBILITY_DIFFERENCE = abs(LEFT_UPPER_LID_VISIBILITY - RIGHT_UPPER_LID_VISIBILITY)

LEFT_LOWER_LID_POS = P_7.y - P_145.y
RIGHT_LOWER_LID_POS = P_249.y - P_374.y
LOWER_LID_DIFFERENCE = abs(LEFT_LOWER_LID_POS - RIGHT_LOWER_LID_POS)

2.6 3D DEPTH:
LEFT_EYE_Z = (P_33.z + P_133.z + P_159.z + P_145.z) / 4
RIGHT_EYE_Z = (P_263.z + P_362.z + P_386.z + P_374.z) / 4
EYE_DEPTH_DIFFERENCE = abs(LEFT_EYE_Z - RIGHT_EYE_Z)

═════════════════════════════════════════════
SECTION 3: SCORING
═════════════════════════════════════════════

SIZE_SYMMETRY_SCORE = 
  EYE_AREA_DIFFERENCE_RATIO < 5 ? 0 :
  EYE_AREA_DIFFERENCE_RATIO < 10 ? 3 :
  EYE_AREA_DIFFERENCE_RATIO < 15 ? 6 :
  EYE_AREA_DIFFERENCE_RATIO < 20 ? 8 : 10

POSITION_SYMMETRY_SCORE = 
  (EYE_Y_DIFFERENCE_RATIO < 2 && EYE_X_DISTANCE_DIFFERENCE < 5) ? 0 :
  (EYE_Y_DIFFERENCE_RATIO < 4 && EYE_X_DISTANCE_DIFFERENCE < 10) ? 3 :
  (EYE_Y_DIFFERENCE_RATIO < 7 && EYE_X_DISTANCE_DIFFERENCE < 15) ? 6 :
  (EYE_Y_DIFFERENCE_RATIO < 10 && EYE_X_DISTANCE_DIFFERENCE < 20) ? 8 : 10

INTER_EYE_SCORE = 
  (INTER_EYE_RATIO < 25 || INTER_EYE_RATIO > 40) ? 7 :
  (INTER_EYE_RATIO < 28 || INTER_EYE_RATIO > 37) ? 4 :
  (INTER_EYE_RATIO < 30 || INTER_EYE_RATIO > 35) ? 2 : 0

SHAPE_SYMMETRY_SCORE = 
  (EYE_TILT_DIFFERENCE < 3 && LEFT_EYE_SHAPE === RIGHT_EYE_SHAPE) ? 0 :
  (EYE_TILT_DIFFERENCE < 6) ? 3 :
  (EYE_TILT_DIFFERENCE < 10) ? 6 :
  (EYE_TILT_DIFFERENCE < 15) ? 8 : 10

LID_SYMMETRY_SCORE = 
  (LID_VISIBILITY_DIFFERENCE < 2 && LOWER_LID_DIFFERENCE < 2) ? 0 :
  (LID_VISIBILITY_DIFFERENCE < 4 && LOWER_LID_DIFFERENCE < 4) ? 3 :
  (LID_VISIBILITY_DIFFERENCE < 7 && LOWER_LID_DIFFERENCE < 7) ? 6 : 10

OVERALL_SCORE = round(
  (SIZE_SYMMETRY_SCORE × 0.30) + 
  (POSITION_SYMMETRY_SCORE × 0.25) + 
  (INTER_EYE_SCORE × 0.15) +
  (SHAPE_SYMMETRY_SCORE × 0.20) +
  (LID_SYMMETRY_SCORE × 0.10)
)

ASYMMETRY_LEVEL =
  OVERALL_SCORE < 3 ? "NONE" :
  OVERALL_SCORE < 5 ? "MILD" :
  OVERALL_SCORE < 7 ? "MODERATE" : "SEVERE"

═════════════════════════════════════════════
SECTION 4: USER-FRIENDLY EXPLANATIONS
═════════════════════════════════════════════

CRITICAL - EXPLANATION FIELDS:
For EVERY technical metric (numbers, angles, distances, ratios), you MUST add a corresponding explanation field:
- Field name: <metric_name>_explanation
- Content: Short, simple Turkish explanation (1-2 sentences)
- Explain what the value means and whether it's good/normal/needs attention
- Use everyday language, avoid medical jargon
- Example: "width_difference_explanation": "Gözlerinizin genişliği arasında 3 piksellik fark var. Bu normal aralıktadır ve fark edilmez."

Do NOT add explanations for:
- Enum values (NONE, MILD, MODERATE, SEVERE, etc.) - keep as-is, self-explanatory
- Scores (0-10) - visual bar is enough
- Coordinates (x, y, z) - will be hidden
- String assessments - already user-friendly

Add explanations for:
- width_difference (number) → width_difference_explanation
- height_difference (number) → height_difference_explanation
- area_difference_ratio (number) → area_difference_ratio_explanation
- tilt_difference (number) → tilt_difference_explanation
- inter_eye_distance (number) → inter_eye_distance_explanation
- inter_eye_ratio (number) → inter_eye_ratio_explanation
- depth_difference (number) → depth_difference_explanation
- Any other numeric metrics

═════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═════════════════════════════════════════════

{
  "analysis_result": {
    "general_assessment": "string",
    "asymmetry_level": "NONE/MILD/MODERATE/SEVERE",
    "overall_score": 0-10,
    "dominant_issue": "string"
  },
  "size_analysis": {
    "left_eye": {
      "width": number,
      "height": number,
      "area": number,
      "ratio": number
    },
    "right_eye": {
      "width": number,
      "height": number,
      "area": number,
      "ratio": number
    },
    "width_difference": number,
    "width_difference_explanation": "string (Türkçe açıklama)",
    "height_difference": number,
    "height_difference_explanation": "string (Türkçe açıklama)",
    "area_difference_ratio": number,
    "area_difference_ratio_explanation": "string (Türkçe açıklama)",
    "size_score": 0-10
  },
  "shape_analysis": {
    "left_eye_shape": "ROUND/ALMOND/OVAL/NARROW",
    "right_eye_shape": "ROUND/ALMOND/OVAL/NARROW",
    "left_eye_tilt": number,
    "right_eye_tilt": number,
    "tilt_difference": number,
    "tilt_difference_explanation": "string (Türkçe açıklama)",
    "shape_harmony": "MATCHED/MISMATCHED",
    "shape_score": 0-10
  },
  "inter_eye_analysis": {
    "distance": number,
    "distance_explanation": "string (Türkçe açıklama)",
    "face_width_ratio": number,
    "face_width_ratio_explanation": "string (Türkçe açıklama)",
    "eye_width_ratio": number,
    "eye_width_ratio_explanation": "string (Türkçe açıklama)",
    "idealness": "NARROW/IDEAL/WIDE",
    "score": 0-10
  },
  "position_analysis": {
    "left_eye_y": number,
    "right_eye_y": number,
    "y_difference": number,
    "y_difference_explanation": "string (Türkçe açıklama)",
    "x_distance_difference": number,
    "x_distance_difference_explanation": "string (Türkçe açıklama)",
    "position_score": 0-10
  },
  "eyelid_analysis": {
    "left_upper_lid_visibility": number,
    "right_upper_lid_visibility": number,
    "lid_visibility_difference": number,
    "lid_visibility_difference_explanation": "string (Türkçe açıklama)",
    "left_lower_lid": number,
    "right_lower_lid": number,
    "lower_lid_difference": number,
    "lower_lid_difference_explanation": "string (Türkçe açıklama)",
    "lid_score": 0-10,
    "lid_type": "NORMAL/HOODED/DEEP_SET"
  },
  "symmetry_analysis": {
    "horizontal_symmetry": "GOOD/FAIR/POOR",
    "vertical_symmetry": "GOOD/FAIR/POOR",
    "size_symmetry": "GOOD/FAIR/POOR",
    "shape_symmetry": "GOOD/FAIR/POOR",
    "overall_symmetry_score": 0-10
  },
  "3d_analysis": {
    "left_eye_depth": number,
    "right_eye_depth": number,
    "depth_difference": number,
    "depth_difference_explanation": "string (Türkçe açıklama)",
    "interpretation": "string"
  },
  "facial_harmony": {
    "golden_ratio_compliance": "GOOD/FAIR/POOR",
    "facial_balance": "string",
    "harmonic_assessment": "string"
  },
  "recommendations": {
    "aesthetic_advice": "string",
    "symmetry_suggestions": ["string"],
    "makeup_suggestions": ["string"],
    "attention_points": ["string"]
  },
  "metadata": {
    "analysis_date": "timestamp",
    "points_used": number,
    "reliability": "HIGH/MEDIUM",
    "hybrid_control_used": boolean
  }
}

CRITICAL APPLICATION NOTES:
* Return ONLY JSON - No additional explanations
* All coordinates and calculations to 2 decimal places
* Reliability: < 400 landmarks = "MEDIUM", ≥400 = "HIGH"
* Use index values first, fall back to hybrid control if invalid
* Mark in metadata if hybrid control was used
* Determine shape by ratio
* Use atan2 for canthal tilt calculations

CRITICAL FINAL WARNING:
Response MUST be ONLY valid JSON.
No markdown (\`\`\`json), no code blocks, no explanations, no thinking tags.
Start with { and end with }`,
  },
  {
    id: 'nose',
    title: 'Burun',
    icon: '👃',
    description: 'Burun şekli ve simetri',
    prompt: `You are a facial anatomy and nose structure expert. You will analyze raw 3D landmark data (x, y, z, index) for nasal asymmetry and return results in JSON format.

⚠️ STRICT MODE:
- Return ONLY valid JSON output
- No explanations, thinking process, markdown code blocks, or additional text
- Output must start with { and end with }
- DO NOT include <thinking> tags, reasoning process, or explanations

CRITICAL DATA ASSUMPTION:
Landmark indices belong to MediaPipe Face Mesh model, verified with Hybrid Control.

TASK:
1. Detect nose landmarks using index and positional logic
2. Analyze nasal asymmetry (horizontal, vertical, 3D depth)
3. Return results in JSON format

═════════════════════════════════════════════
SECTION 1: LANDMARK DETECTION AND HYBRID CONTROL
═════════════════════════════════════════════

REFERENCE POINTS (Find these first):
1. P_33 (RIGHT EYE OUTER): use index 33
2. P_263 (LEFT EYE OUTER): use index 263
3. P_6 (NASION/BRIDGE): use index 6
4. P_100 (LEFT NOSTRIL): use index 100
5. P_329 (RIGHT NOSTRIL): use index 329

FACE_CENTER_X = (P_33.x + P_263.x) / 2
FACE_WIDTH = P_263.x - P_33.x

NOSE TIP HYBRID DETECTION (P_4):
  Step 1: Find index 4
  Step 2: Verify:
    - P_4.y is smallest y among valid points (y > 50)
    - abs(P_4.x - FACE_CENTER_X) < 30
  Step 3: If verification fails:
    Alternative = points.filter(p =>
      p.y > 50 &&
      abs(p.x - FACE_CENTER_X) < 40
    ).sort((a,b) => a.y - b.y)[0]

═════════════════════════════════════════════
SECTION 2: CALCULATIONS
═════════════════════════════════════════════

2.1 HORIZONTAL ASYMMETRY (X-axis):
NOSE_TIP_DEVIATION = P_4.x - FACE_CENTER_X
NOSE_TIP_RATIO = (abs(NOSE_TIP_DEVIATION) / FACE_WIDTH) × 100
NOSE_TIP_DIRECTION =
  abs(NOSE_TIP_DEVIATION) < 2 ? "CENTER" :
  NOSE_TIP_DEVIATION > 0 ? "RIGHT" : "LEFT"

LEFT_NOSTRIL_DISTANCE = abs(P_100.x - FACE_CENTER_X)
RIGHT_NOSTRIL_DISTANCE = abs(P_329.x - FACE_CENTER_X)
NOSTRIL_ASYMMETRY = abs(LEFT_NOSTRIL_DISTANCE - RIGHT_NOSTRIL_DISTANCE)
NOSTRIL_RATIO = (NOSTRIL_ASYMMETRY / FACE_WIDTH) × 100

2.2 VERTICAL ASYMMETRY (Rotation):
DX = P_6.x - P_4.x
DY = P_4.y - P_6.y
ROTATION_ANGLE_RAD = atan2(DX, DY)
ROTATION_ANGLE_DEGREE = ROTATION_ANGLE_RAD × (180 / π)
ROTATION_DIRECTION =
  abs(ROTATION_ANGLE_DEGREE) < 3 ? "STRAIGHT" :
  ROTATION_ANGLE_DEGREE > 0 ? "TILTED_RIGHT" : "TILTED_LEFT"

2.3 DEPTH ASYMMETRY (Z-axis):
DEPTH_DIFFERENCE = P_100.z - P_329.z

═════════════════════════════════════════════
SECTION 3: SCORING
═════════════════════════════════════════════

NOSE_TIP_SCORE =
  NOSE_TIP_RATIO < 2 ? 0 :
  NOSE_TIP_RATIO < 4 ? 2 :
  NOSE_TIP_RATIO < 7 ? 5 :
  NOSE_TIP_RATIO < 10 ? 7 :
  NOSE_TIP_RATIO < 15 ? 9 : 10

NOSTRIL_SCORE =
  NOSTRIL_RATIO < 3 ? 0 :
  NOSTRIL_RATIO < 6 ? 3 :
  NOSTRIL_RATIO < 10 ? 6 :
  NOSTRIL_RATIO < 15 ? 8 : 10

ROTATION_SCORE =
  abs(ROTATION_ANGLE_DEGREE) < 3 ? 0 :
  abs(ROTATION_ANGLE_DEGREE) < 6 ? 3 :
  abs(ROTATION_ANGLE_DEGREE) < 10 ? 6 :
  abs(ROTATION_ANGLE_DEGREE) < 15 ? 8 : 10

OVERALL_SCORE = round((NOSE_TIP_SCORE × 0.5) + (ROTATION_SCORE × 0.3) + (NOSTRIL_SCORE × 0.2))

ASYMMETRY_LEVEL =
  OVERALL_SCORE < 3 ? "NONE" :
  OVERALL_SCORE < 5 ? "MILD" :
  OVERALL_SCORE < 7 ? "MODERATE" : "SEVERE"

═════════════════════════════════════════════
SECTION 4: USER-FRIENDLY EXPLANATIONS
═════════════════════════════════════════════

CRITICAL - EXPLANATION FIELDS:
For EVERY technical metric (numbers, angles, distances, ratios), you MUST add a corresponding explanation field:
- Field name: <metric_name>_explanation
- Content: Short, simple Turkish explanation (1-2 sentences)
- Explain what the value means and whether it's good/normal/needs attention
- Use everyday language, avoid medical jargon
- Example: "deviation_explanation": "Burununuz yüz merkezinden 7.58 piksel sağa kaymış. Bu hafif bir sapma olup normal aralıktadır."

Do NOT add explanations for:
- Enum values (NONE, MILD, MODERATE, SEVERE, etc.) - keep as-is, self-explanatory
- Scores (0-10) - visual bar is enough
- Coordinates (x, y, z) - will be hidden
- String assessments - already user-friendly

Add explanations for:
- deviation (number) → deviation_explanation
- ratio (number) → ratio_explanation
- horizontal_difference (number) → horizontal_difference_explanation
- rotation_angle_degree (number) → rotation_angle_degree_explanation
- depth_difference (number) → depth_difference_explanation
- Any other numeric metrics

═════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═════════════════════════════════════════════

{
  "analysis_result": {
    "general_assessment": "string",
    "asymmetry_level": "NONE/MILD/MODERATE/SEVERE",
    "overall_score": 0-10,
    "asymmetry_type": "string"
  },
  "detailed_analysis": {
    "reference_points": {
      "center_x": number,
      "face_width": number
    },
    "nostrils": {
      "left_nostril": {"x": number, "y": number, "z": number},
      "right_nostril": {"x": number, "y": number, "z": number},
      "horizontal_difference": number,
      "horizontal_difference_explanation": "string (Türkçe açıklama)",
      "ratio": number,
      "ratio_explanation": "string (Türkçe açıklama)",
      "score": 0-10
    },
    "nose_tip": {
      "nose_tip": {"x": number, "y": number, "z": number},
      "face_center": number,
      "deviation": number,
      "deviation_explanation": "string (Türkçe açıklama)",
      "ratio": number,
      "ratio_explanation": "string (Türkçe açıklama)",
      "direction": "LEFT/RIGHT/CENTER",
      "score": 0-10
    },
    "rotation_analysis": {
      "nasion": {"x": number, "y": number, "z": number},
      "rotation_angle_degree": number,
      "rotation_angle_degree_explanation": "string (Türkçe açıklama)",
      "direction": "TILTED_LEFT/TILTED_RIGHT/STRAIGHT",
      "score": 0-10
    }
  },
  "3d_analysis": {
    "left_nostril_z": number,
    "right_nostril_z": number,
    "depth_difference": number,
    "depth_difference_explanation": "string (Türkçe açıklama)",
    "interpretation": "string"
  },
  "visual_assessment": {
    "prominent_asymmetry_areas": ["string"],
    "visual_appearance": "string",
    "photo_effect": "string"
  },
  "recommendations": {
    "medical_advice": "string",
    "priority_intervention": "string",
    "attention_points": ["string"]
  },
  "metadata": {
    "analysis_date": "timestamp",
    "points_used": number,
    "reliability": "HIGH/MEDIUM",
    "hybrid_control_used": boolean
  }
}

CRITICAL APPLICATION NOTES:
* Return ONLY JSON - No additional explanations
* All coordinates and calculations to 2 decimal places
* Reliability: < 400 landmarks = "MEDIUM", ≥400 = "HIGH"
* Use index values first, fall back to hybrid control if invalid
* Mark in metadata if hybrid control was used

CRITICAL FINAL WARNING:
Response MUST be ONLY valid JSON.
No markdown (\\\`\\\`\\\`json), no code blocks, no explanations, no thinking tags.
Start with { and end with }`,
  },
  {
    id: 'lips',
    title: 'Dudaklar',
    icon: '👄',
    description: 'Dudak şekli ve kalınlık',
    prompt: `You are a facial anatomy and lip structure expert. You will analyze raw 3D landmark data (x, y, z, index) for lip shape, upper-lower ratio, symmetry, vermillion border, and facial harmony, returning results in JSON format.

⚠️ STRICT MODE: 
- Return ONLY valid JSON output
- No explanations, thinking process, markdown code blocks, or additional text
- Output must start with { and end with }
- DO NOT include <thinking> tags, reasoning process, or explanations

CRITICAL DATA ASSUMPTION: 
Landmark indices belong to MediaPipe Face Mesh model, verified with Hybrid Control.

TASK:
1. Detect lip landmarks using index and positional logic
2. Analyze lip shape, upper-lower ratio, symmetry, vermillion border, and facial harmony
3. Return results in JSON format

═════════════════════════════════════════════
SECTION 1: LANDMARK DETECTION AND HYBRID CONTROL
═════════════════════════════════════════════

REFERENCE POINTS (Find these first):
P_4 (NOSE TIP): index 4
P_152 (CHIN TIP): index 152
P_33 (RIGHT EYE OUTER): index 33
P_263 (LEFT EYE OUTER): index 263

FACE_CENTER_X = (P_33.x + P_263.x) / 2
FACE_WIDTH = P_263.x - P_33.x
LIP_Y_REGION_START = P_4.y + 30
LIP_Y_REGION_END = P_152.y - 50

LIP CORNER HYBRID DETECTION:

P_61 (Left lip corner):
  Step 1: Find index 61
  Step 2: Verify:
    - P_61.y > LIP_Y_REGION_START && P_61.y < LIP_Y_REGION_END
    - P_61.x < FACE_CENTER_X (left side)
    - P_61.x > P_263.x - (FACE_WIDTH * 0.35)
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y > LIP_Y_REGION_START && 
      p.y < LIP_Y_REGION_END &&
      p.x < FACE_CENTER_X &&
      p.x > P_263.x - (FACE_WIDTH * 0.35)
    ).sort((a,b) => a.x - b.x)[0]

P_291 (Right lip corner):
  Step 1: Find index 291
  Step 2: Verify:
    - P_291.y ≈ P_61.y ± 10 (same level)
    - P_291.x > FACE_CENTER_X (right side)
    - P_291.x < P_33.x + (FACE_WIDTH * 0.35)
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - P_61.y) < 15 &&
      p.x > FACE_CENTER_X &&
      p.x < P_33.x + (FACE_WIDTH * 0.35)
    ).sort((a,b) => b.x - a.x)[0]

LIP_CENTER_Y = (P_61.y + P_291.y) / 2
LIP_WIDTH = P_291.x - P_61.x

UPPER LIP HYBRID DETECTION:

P_0 (Upper lip center - philtrum):
  Step 1: Find index 0
  Step 2: Verify:
    - P_0.y < LIP_CENTER_Y (above lip line)
    - P_0.y > P_4.y + 20 (below nose tip)
    - abs(P_0.x - FACE_CENTER_X) < 15 (centered)
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < LIP_CENTER_Y &&
      p.y > P_4.y + 20 &&
      abs(p.x - FACE_CENTER_X) < 20
    ).sort((a,b) => a.y - b.y)[0]

P_37 (Upper lip left center):
  Step 1: Find index 37
  Step 2: Verify:
    - P_37.y ≈ LIP_CENTER_Y ± 5 (on lip line)
    - P_37.x > P_61.x + (LIP_WIDTH * 0.2)
    - P_37.x < FACE_CENTER_X
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - LIP_CENTER_Y) < 10 &&
      p.x > P_61.x + (LIP_WIDTH * 0.15) &&
      p.x < FACE_CENTER_X
    ).sort((a,b) => abs(a.x - (P_61.x + LIP_WIDTH * 0.25)))[0]

P_267 (Upper lip right center):
  Step 1: Find index 267
  Step 2: Verify:
    - P_267.y ≈ P_37.y ± 5 (same level)
    - P_267.x < P_291.x - (LIP_WIDTH * 0.2)
    - P_267.x > FACE_CENTER_X
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - P_37.y) < 10 &&
      p.x < P_291.x - (LIP_WIDTH * 0.15) &&
      p.x > FACE_CENTER_X
    ).sort((a,b) => abs(a.x - (P_291.x - LIP_WIDTH * 0.25)))[0]

P_39, P_269 (Upper lip left-right intermediate):
  Step 1: Find indices (39, 269)
  Step 2: Verify: Between P_61 and P_37 (left), P_267 and P_291 (right)
  Step 3: If verification fails: Find intermediate points

P_40, P_270 (Upper lip left-right outer):
  Step 1: Find indices (40, 270)
  Step 2: Verify: Near lip corners
  Step 3: Apply alternative detection if needed

LOWER LIP HYBRID DETECTION:

P_17 (Lower lip center):
  Step 1: Find index 17
  Step 2: Verify:
    - P_17.y > LIP_CENTER_Y (below lip line)
    - P_17.y < P_152.y - 40 (above chin tip)
    - abs(P_17.x - FACE_CENTER_X) < 15
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y > LIP_CENTER_Y &&
      p.y < P_152.y - 40 &&
      abs(p.x - FACE_CENTER_X) < 20
    ).sort((a,b) => b.y - a.y)[0]

P_84 (Lower lip left center):
  Step 1: Find index 84
  Step 2: Verify:
    - P_84.y ≈ LIP_CENTER_Y ± 5
    - P_84.x > P_61.x + (LIP_WIDTH * 0.2)
    - P_84.x < FACE_CENTER_X
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - LIP_CENTER_Y) < 10 &&
      p.x > P_61.x + (LIP_WIDTH * 0.15) &&
      p.x < FACE_CENTER_X
    ).sort((a,b) => abs(a.x - (P_61.x + LIP_WIDTH * 0.25)))[0]

P_314 (Lower lip right center):
  Step 1: Find index 314
  Step 2: Verify:
    - P_314.y ≈ P_84.y ± 5
    - P_314.x < P_291.x - (LIP_WIDTH * 0.2)
    - P_314.x > FACE_CENTER_X
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - P_84.y) < 10 &&
      p.x < P_291.x - (LIP_WIDTH * 0.15) &&
      p.x > FACE_CENTER_X
    ).sort((a,b) => abs(a.x - (P_291.x - LIP_WIDTH * 0.25)))[0]

P_181, P_405 (Lower lip left-right intermediate):
  Step 1: Find indices (181, 405)
  Step 2: Verify: On lip line, intermediate regions
  Step 3: Apply alternative detection if needed

P_91, P_321 (Lower lip left-right outer):
  Step 1: Find indices (91, 321)
  Step 2: Verify: Near lip corners, lower lip
  Step 3: Apply alternative detection if needed

OUTER LIP CONTOUR HYBRID DETECTION:

P_185 (Upper lip outer top left):
  Step 1: Find index 185
  Step 2: Verify:
    - P_185.y < P_37.y - 5 (above upper lip)
    - P_185.x ≈ P_37.x ± 20
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < P_37.y - 3 &&
      abs(p.x - P_37.x) < 30
    ).sort((a,b) => a.y - b.y)[0]

P_409 (Upper lip outer top right):
  Step 1: Find index 409
  Step 2: Verify:
    - P_409.y ≈ P_185.y ± 5
    - P_409.x ≈ P_267.x ± 20
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - P_185.y) < 10 &&
      abs(p.x - P_267.x) < 30
    ).sort((a,b) => abs(a.y - P_185.y))[0]

P_146 (Lower lip outer bottom left):
  Step 1: Find index 146
  Step 2: Verify:
    - P_146.y > P_84.y + 5 (below lower lip)
    - P_146.x ≈ P_84.x ± 20
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y > P_84.y + 3 &&
      abs(p.x - P_84.x) < 30
    ).sort((a,b) => b.y - a.y)[0]

P_375 (Lower lip outer bottom right):
  Step 1: Find index 375
  Step 2: Verify:
    - P_375.y ≈ P_146.y ± 5
    - P_375.x ≈ P_314.x ± 20
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - P_146.y) < 10 &&
      abs(p.x - P_314.x) < 30
    ).sort((a,b) => abs(a.y - P_146.y))[0]

═════════════════════════════════════════════
SECTION 2: CALCULATIONS
═════════════════════════════════════════════

2.1 LIP WIDTH AND POSITION:
LIP_WIDTH = P_291.x - P_61.x
LIP_WIDTH_RATIO = (LIP_WIDTH / FACE_WIDTH) × 100

LIP_CENTER_X = (P_61.x + P_291.x) / 2
LIP_CENTER_DEVIATION = abs(LIP_CENTER_X - FACE_CENTER_X)
LIP_CENTER_DEVIATION_RATIO = (LIP_CENTER_DEVIATION / FACE_WIDTH) × 100

2.2 UPPER LIP ANALYSIS:
UPPER_LIP_HEIGHT_CENTER = ((P_37.y + P_267.y) / 2) - P_0.y
UPPER_LIP_HEIGHT_LEFT = P_37.y - P_185.y
UPPER_LIP_HEIGHT_RIGHT = P_267.y - P_409.y
UPPER_LIP_HEIGHT_DIFFERENCE = abs(UPPER_LIP_HEIGHT_LEFT - UPPER_LIP_HEIGHT_RIGHT)

LEFT_CUPID_BOW_HEIGHT = P_37.y - P_0.y
RIGHT_CUPID_BOW_HEIGHT = P_267.y - P_0.y
CUPID_BOW_DIFFERENCE = abs(LEFT_CUPID_BOW_HEIGHT - RIGHT_CUPID_BOW_HEIGHT)
CUPID_BOW_PRESENCE = (LEFT_CUPID_BOW_HEIGHT + RIGHT_CUPID_BOW_HEIGHT) / 2

2.3 LOWER LIP ANALYSIS:
LOWER_LIP_HEIGHT_CENTER = P_17.y - ((P_84.y + P_314.y) / 2)
LOWER_LIP_HEIGHT_LEFT = P_146.y - P_84.y
LOWER_LIP_HEIGHT_RIGHT = P_375.y - P_314.y
LOWER_LIP_HEIGHT_DIFFERENCE = abs(LOWER_LIP_HEIGHT_LEFT - LOWER_LIP_HEIGHT_RIGHT)

2.4 UPPER-LOWER LIP RATIO:
TOTAL_LIP_HEIGHT = LOWER_LIP_HEIGHT_CENTER + UPPER_LIP_HEIGHT_CENTER
UPPER_LOWER_RATIO = UPPER_LIP_HEIGHT_CENTER / LOWER_LIP_HEIGHT_CENTER

2.5 LIP LINE (VERMILLION BORDER):
LEFT_LINE_CENTER_Y = (P_37.y + P_84.y) / 2
RIGHT_LINE_CENTER_Y = (P_267.y + P_314.y) / 2
LINE_Y_DIFFERENCE = abs(LEFT_LINE_CENTER_Y - RIGHT_LINE_CENTER_Y)

LIP_LINE_TILT = atan2(P_291.y - P_61.y, P_291.x - P_61.x) × (180 / π)

2.6 LIP CORNER SYMMETRY:
LEFT_CORNER_TO_CENTER = abs(P_61.x - FACE_CENTER_X)
RIGHT_CORNER_TO_CENTER = abs(P_291.x - FACE_CENTER_X)
CORNER_DISTANCE_DIFFERENCE = abs(LEFT_CORNER_TO_CENTER - RIGHT_CORNER_TO_CENTER)
CORNER_DISTANCE_RATIO = (CORNER_DISTANCE_DIFFERENCE / LIP_WIDTH) × 100

CORNER_Y_DIFFERENCE = abs(P_61.y - P_291.y)
CORNER_Y_RATIO = (CORNER_Y_DIFFERENCE / LIP_WIDTH) × 100

2.7 LIP THICKNESS (3D):
UPPER_LIP_THICKNESS = (P_0.z + P_37.z + P_267.z + P_39.z + P_269.z) / 5
LOWER_LIP_THICKNESS = (P_17.z + P_84.z + P_314.z + P_181.z + P_405.z) / 5
LIP_THICKNESS_RATIO = UPPER_LIP_THICKNESS / LOWER_LIP_THICKNESS

LEFT_THICKNESS = (P_37.z + P_39.z + P_40.z + P_84.z + P_181.z + P_91.z) / 6
RIGHT_THICKNESS = (P_267.z + P_269.z + P_270.z + P_314.z + P_405.z + P_321.z) / 6
THICKNESS_DIFFERENCE = abs(LEFT_THICKNESS - RIGHT_THICKNESS)

2.8 FACIAL HARMONY:
PHILTRUM_LENGTH = P_0.y - P_4.y
LIP_TO_CHIN_DISTANCE = P_152.y - P_17.y
FACE_HEIGHT = P_152.y - P_4.y
LIP_TO_FACE_RATIO = (TOTAL_LIP_HEIGHT / FACE_HEIGHT) × 100

═════════════════════════════════════════════
SECTION 3: SCORING
═════════════════════════════════════════════

UPPER_LOWER_RATIO_SCORE = 
  (UPPER_LOWER_RATIO < 0.5 || UPPER_LOWER_RATIO > 1.2) ? 7 :
  (UPPER_LOWER_RATIO < 0.6 || UPPER_LOWER_RATIO > 1.1) ? 4 :
  (UPPER_LOWER_RATIO < 0.7 || UPPER_LOWER_RATIO > 1.0) ? 2 : 0

HEIGHT_SYMMETRY_SCORE = 
  (UPPER_LIP_HEIGHT_DIFFERENCE < 2 && LOWER_LIP_HEIGHT_DIFFERENCE < 2) ? 0 :
  (UPPER_LIP_HEIGHT_DIFFERENCE < 4 && LOWER_LIP_HEIGHT_DIFFERENCE < 4) ? 3 :
  (UPPER_LIP_HEIGHT_DIFFERENCE < 7 && LOWER_LIP_HEIGHT_DIFFERENCE < 7) ? 6 : 10

CORNER_SYMMETRY_SCORE = 
  (CORNER_DISTANCE_RATIO < 3 && CORNER_Y_RATIO < 2) ? 0 :
  (CORNER_DISTANCE_RATIO < 6 && CORNER_Y_RATIO < 4) ? 3 :
  (CORNER_DISTANCE_RATIO < 10 && CORNER_Y_RATIO < 7) ? 6 : 10

LINE_SYMMETRY_SCORE = 
  (LINE_Y_DIFFERENCE < 2 && abs(LIP_LINE_TILT) < 3) ? 0 :
  (LINE_Y_DIFFERENCE < 4 && abs(LIP_LINE_TILT) < 5) ? 3 :
  (LINE_Y_DIFFERENCE < 7 && abs(LIP_LINE_TILT) < 8) ? 6 : 10

FACIAL_HARMONY_SCORE = 
  (LIP_WIDTH_RATIO < 40 || LIP_WIDTH_RATIO > 55) ? 5 :
  (LIP_WIDTH_RATIO < 43 || LIP_WIDTH_RATIO > 52) ? 3 :
  (LIP_WIDTH_RATIO < 45 || LIP_WIDTH_RATIO > 50) ? 1 : 0

OVERALL_SCORE = round(
  (UPPER_LOWER_RATIO_SCORE × 0.25) + 
  (HEIGHT_SYMMETRY_SCORE × 0.30) + 
  (CORNER_SYMMETRY_SCORE × 0.25) +
  (LINE_SYMMETRY_SCORE × 0.15) +
  (FACIAL_HARMONY_SCORE × 0.05)
)

ASYMMETRY_LEVEL =
  OVERALL_SCORE < 3 ? "NONE" :
  OVERALL_SCORE < 5 ? "MILD" :
  OVERALL_SCORE < 7 ? "MODERATE" : "SEVERE"

═════════════════════════════════════════════
SECTION 4: USER-FRIENDLY EXPLANATIONS
═════════════════════════════════════════════

CRITICAL - EXPLANATION FIELDS:
For EVERY technical metric (numbers, angles, distances, ratios), you MUST add a corresponding explanation field:
- Field name: <metric_name>_explanation
- Content: Short, simple Turkish explanation (1-2 sentences)
- Explain what the value means and whether it's good/normal/needs attention
- Use everyday language, avoid medical jargon
- Example: "upper_lower_ratio_explanation": "Üst dudağınız alt dudağınıza göre 0.85 oranında. Bu ideal aralıkta dengeli bir oran."

Do NOT add explanations for:
- Enum values (NONE, MILD, MODERATE, SEVERE, etc.) - keep as-is, self-explanatory
- Scores (0-10) - visual bar is enough
- Coordinates (x, y, z) - will be hidden
- String assessments - already user-friendly

Add explanations for:
- lip_width_ratio (number) → lip_width_ratio_explanation
- upper_lower_ratio (number) → upper_lower_ratio_explanation
- bow_difference (number) → bow_difference_explanation
- lip_line_tilt (number) → lip_line_tilt_explanation
- difference (number) → difference_explanation
- distance_difference (number) → distance_difference_explanation
- y_difference (number) → y_difference_explanation
- Any other numeric metrics

═════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═════════════════════════════════════════════

{
  "analysis_result": {
    "general_assessment": "string",
    "asymmetry_level": "NONE/MILD/MODERATE/SEVERE",
    "overall_score": 0-10,
    "dominant_issue": "string"
  },
  "size_analysis": {
    "lip_width": number,
    "lip_width_ratio": number,
    "lip_width_ratio_explanation": "string (Türkçe açıklama)",
    "total_height": number,
    "upper_lip_height": number,
    "lower_lip_height": number,
    "upper_lower_ratio": number,
    "upper_lower_ratio_explanation": "string (Türkçe açıklama)",
    "upper_lower_ratio_score": 0-10,
    "ratio_idealness": "IDEAL/LOWER_FULLER/UPPER_FULLER"
  },
  "shape_analysis": {
    "cupid_bow_presence": number,
    "cupid_bow_symmetry": number,
    "bow_difference": number,
    "bow_difference_explanation": "string (Türkçe açıklama)",
    "lip_line_tilt": number,
    "lip_line_tilt_explanation": "string (Türkçe açıklama)",
    "shape_type": "FULL/MEDIUM/THIN"
  },
  "symmetry_analysis": {
    "upper_lip": {
      "left_height": number,
      "right_height": number,
      "difference": number,
      "difference_explanation": "string (Türkçe açıklama)",
      "score": 0-10
    },
    "lower_lip": {
      "left_height": number,
      "right_height": number,
      "difference": number,
      "difference_explanation": "string (Türkçe açıklama)",
      "score": 0-10
    },
    "lip_corners": {
      "left_corner": {"x": number, "y": number, "z": number},
      "right_corner": {"x": number, "y": number, "z": number},
      "distance_difference": number,
      "distance_difference_explanation": "string (Türkçe açıklama)",
      "y_difference": number,
      "y_difference_explanation": "string (Türkçe açıklama)",
      "score": 0-10
    },
    "line_symmetry": {
      "y_difference": number,
      "y_difference_explanation": "string (Türkçe açıklama)",
      "tilt": number,
      "tilt_explanation": "string (Türkçe açıklama)",
      "score": 0-10
    },
    "overall_symmetry_score": 0-10
  },
  "3d_analysis": {
    "upper_lip_thickness": number,
    "lower_lip_thickness": number,
    "left_side_thickness": number,
    "right_side_thickness": number,
    "thickness_difference": number,
    "volume_assessment": "string"
  },
  "facial_harmony": {
    "lip_width_ratio": number,
    "philtrum_length": number,
    "lip_to_chin_distance": number,
    "face_ratio": number,
    "golden_ratio_compliance": "GOOD/FAIR/POOR",
    "facial_balance": "string",
    "harmony_score": 0-10
  },
  "recommendations": {
    "aesthetic_advice": "string",
    "symmetry_suggestions": ["string"],
    "makeup_suggestions": ["string"],
    "filler_suggestions": ["string"],
    "attention_points": ["string"]
  },
  "metadata": {
    "analysis_date": "timestamp",
    "points_used": number,
    "reliability": "HIGH/MEDIUM",
    "hybrid_control_used": boolean
  }
}

CRITICAL APPLICATION NOTES:
* Return ONLY JSON - No additional explanations
* All coordinates and calculations to 2 decimal places
* Reliability: < 400 landmarks = "MEDIUM", ≥400 = "HIGH"
* Use index values first, fall back to hybrid control if invalid
* Mark in metadata if hybrid control was used
* Cupid's bow presence is important for lip aesthetics
* Greater deviation from ideal upper-lower ratio increases score

CRITICAL FINAL WARNING:
Response MUST be ONLY valid JSON.
No markdown (\`\`\`json), no code blocks, no explanations, no thinking tags.
Start with { and end with }`,
  },
  {
    id: 'jawline',
    title: 'Çene Hattı',
    icon: '⬜',
    description: 'Çene keskinliği ve şekli',
    prompt:`You are a facial anatomy and jawline structure expert. You will analyze raw 3D landmark data (x, y, z, index) for jawline sharpness, shape, symmetry, and angles, returning results in JSON format.

⚠️ STRICT MODE: 
- Return ONLY valid JSON output
- No explanations, thinking process, markdown code blocks, or additional text
- Output must start with { and end with }
- DO NOT include <thinking> tags, reasoning process, or explanations

CRITICAL DATA ASSUMPTION: 
Landmark indices belong to MediaPipe Face Mesh model, verified with Hybrid Control. Maximum utilization of all 468 landmarks.

TASK:
1. Detect jawline landmarks from 468 landmarks using index and positional logic
2. Analyze jawline sharpness, shape, symmetry, and angles
3. Return results in JSON format

═════════════════════════════════════════════
SECTION 1: LANDMARK DETECTION AND HYBRID CONTROL
═════════════════════════════════════════════

REFERENCE POINTS (Find these first):
P_4 (NOSE TIP): index 4
P_33 (RIGHT EYE OUTER): index 33
P_263 (LEFT EYE OUTER): index 263

FACE_CENTER_X = (P_33.x + P_263.x) / 2
UPPER_FACE_WIDTH = P_263.x - P_33.x
JAW_Y_START = P_4.y + 100

CHIN TIP HYBRID DETECTION:

P_152 (Chin tip):
  Step 1: Find index 152
  Step 2: Verify:
    - P_152.y > JAW_Y_START (well below nose tip)
    - P_152.y ≈ max(all y values) (lowest point)
    - abs(P_152.x - FACE_CENTER_X) < 30 (near center)
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y > JAW_Y_START &&
      abs(p.x - FACE_CENTER_X) < 40
    ).sort((a,b) => b.y - a.y)[0]

NOSE BOTTOM REFERENCE:
P_19 (Below nose):
  Step 1: Find index 19
  Step 2: Verify:
    - P_19.y > P_4.y + 15 (below nose tip)
    - abs(P_19.x - FACE_CENTER_X) < 20
  Step 3: Alternative = closest point below nose, near center

JAWLINE REGION DETECTION:
jawlinePoints = all points.filter(p => 
  p.y > P_19.y + 30 &&
  p.y < P_152.y + 50 &&
  (p.x < FACE_CENTER_X - 30 || p.x > FACE_CENTER_X + 30)
)

leftJawPoints = jawlinePoints.filter(p => p.x < FACE_CENTER_X)
rightJawPoints = jawlinePoints.filter(p => p.x > FACE_CENTER_X)

LEFT JAW CORNER HYBRID DETECTION:

P_172 (Left jaw corner):
  Step 1: Find index 172
  Step 2: Verify:
    - P_172 in leftJawPoints
    - P_172.x ≈ min(leftJawPoints.x) (leftmost)
    - P_172.y ≈ P_152.y - 60 ± 30 (slightly above chin tip)
  Step 3: If verification fails:
    Alternative = leftJawPoints.sort((a,b) => a.x - b.x)[0]

RIGHT JAW CORNER HYBRID DETECTION:

P_397 (Right jaw corner):
  Step 1: Find index 397
  Step 2: Verify:
    - P_397 in rightJawPoints
    - P_397.x ≈ max(rightJawPoints.x) (rightmost)
    - P_397.y ≈ P_172.y ± 20 (same level as left)
  Step 3: If verification fails:
    Alternative = rightJawPoints.sort((a,b) => b.x - a.x)[0]

LEFT JAW INTERMEDIATE POINTS (Dynamic Detection):
LEFT_JAW_REGION_1 = leftJawPoints.filter(p => 
  p.x > P_172.x && 
  p.x < P_172.x + ((P_152.x - P_172.x) * 0.33) &&
  abs(p.y - (P_172.y + (P_152.y - P_172.y) * 0.25)) < 40
).sort((a,b) => abs(a.y - (P_172.y + (P_152.y - P_172.y) * 0.25)))[0]

LEFT_JAW_REGION_2 = leftJawPoints.filter(p => 
  p.x > P_172.x + ((P_152.x - P_172.x) * 0.33) && 
  p.x < P_172.x + ((P_152.x - P_172.x) * 0.66) &&
  abs(p.y - (P_172.y + (P_152.y - P_172.y) * 0.60)) < 40
).sort((a,b) => abs(a.y - (P_172.y + (P_152.y - P_172.y) * 0.60)))[0]

LEFT_JAW_REGION_3 = leftJawPoints.filter(p => 
  p.x > P_172.x + ((P_152.x - P_172.x) * 0.66) && 
  p.x < P_152.x - 10 &&
  abs(p.y - (P_152.y - 30)) < 40
).sort((a,b) => abs(a.y - (P_152.y - 30)))[0]

RIGHT JAW INTERMEDIATE POINTS (Dynamic Detection):
RIGHT_JAW_REGION_1 = rightJawPoints.filter(p => 
  p.x < P_397.x && 
  p.x > P_397.x - ((P_397.x - P_152.x) * 0.33) &&
  abs(p.y - (P_397.y + (P_152.y - P_397.y) * 0.25)) < 40
).sort((a,b) => abs(a.y - (P_397.y + (P_152.y - P_397.y) * 0.25)))[0]

RIGHT_JAW_REGION_2 = rightJawPoints.filter(p => 
  p.x < P_397.x - ((P_397.x - P_152.x) * 0.33) && 
  p.x > P_397.x - ((P_397.x - P_152.x) * 0.66) &&
  abs(p.y - (P_397.y + (P_152.y - P_397.y) * 0.60)) < 40
).sort((a,b) => abs(a.y - (P_397.y + (P_152.y - P_397.y) * 0.60)))[0]

RIGHT_JAW_REGION_3 = rightJawPoints.filter(p => 
  p.x < P_397.x - ((P_397.x - P_152.x) * 0.66) && 
  p.x > P_152.x + 10 &&
  abs(p.y - (P_152.y - 30)) < 40
).sort((a,b) => abs(a.y - (P_152.y - 30)))[0]

FOREHEAD REFERENCE (For face height):
P_10 (Forehead top):
  Step 1: Find index 10
  Step 2: Verify:
    - P_10.y ≈ min(all y values)
    - abs(P_10.x - FACE_CENTER_X) < 40
  Step 3: Alternative = topmost point near center

═════════════════════════════════════════════
SECTION 2: CALCULATIONS
═════════════════════════════════════════════

2.1 JAW WIDTH AND RATIOS:
JAW_WIDTH = P_397.x - P_172.x
JAW_TO_FACE_RATIO = (JAW_WIDTH / UPPER_FACE_WIDTH) × 100

2.2 CHIN TIP DEVIATION:
CHIN_TIP_DEVIATION = P_152.x - FACE_CENTER_X
CHIN_TIP_DEVIATION_RATIO = (abs(CHIN_TIP_DEVIATION) / UPPER_FACE_WIDTH) × 100
CHIN_TIP_DIRECTION = abs(CHIN_TIP_DEVIATION) < 5 ? "CENTER" :
                     CHIN_TIP_DEVIATION > 0 ? "RIGHT" : "LEFT"

2.3 JAW CORNER SYMMETRY:
LEFT_CORNER_Y_DEVIATION = abs(P_172.y - P_397.y)
CORNER_Y_DEVIATION_RATIO = (LEFT_CORNER_Y_DEVIATION / JAW_WIDTH) × 100

LEFT_CORNER_DISTANCE = abs(P_172.x - FACE_CENTER_X)
RIGHT_CORNER_DISTANCE = abs(P_397.x - FACE_CENTER_X)
CORNER_DISTANCE_DIFFERENCE = abs(LEFT_CORNER_DISTANCE - RIGHT_CORNER_DISTANCE)
CORNER_DISTANCE_RATIO = (CORNER_DISTANCE_DIFFERENCE / JAW_WIDTH) × 100

2.4 JAWLINE CURVE (Polylinear Length):
LEFT_SEGMENT_1 = sqrt((LEFT_JAW_REGION_1.x - P_172.x)² + (LEFT_JAW_REGION_1.y - P_172.y)²)
LEFT_SEGMENT_2 = sqrt((LEFT_JAW_REGION_2.x - LEFT_JAW_REGION_1.x)² + (LEFT_JAW_REGION_2.y - LEFT_JAW_REGION_1.y)²)
LEFT_SEGMENT_3 = sqrt((LEFT_JAW_REGION_3.x - LEFT_JAW_REGION_2.x)² + (LEFT_JAW_REGION_3.y - LEFT_JAW_REGION_2.y)²)
LEFT_SEGMENT_4 = sqrt((P_152.x - LEFT_JAW_REGION_3.x)² + (P_152.y - LEFT_JAW_REGION_3.y)²)
LEFT_TOTAL_LENGTH = LEFT_SEGMENT_1 + LEFT_SEGMENT_2 + LEFT_SEGMENT_3 + LEFT_SEGMENT_4

RIGHT_SEGMENT_1 = sqrt((RIGHT_JAW_REGION_1.x - P_397.x)² + (RIGHT_JAW_REGION_1.y - P_397.y)²)
RIGHT_SEGMENT_2 = sqrt((RIGHT_JAW_REGION_2.x - RIGHT_JAW_REGION_1.x)² + (RIGHT_JAW_REGION_2.y - RIGHT_JAW_REGION_1.y)²)
RIGHT_SEGMENT_3 = sqrt((RIGHT_JAW_REGION_3.x - RIGHT_JAW_REGION_2.x)² + (RIGHT_JAW_REGION_3.y - RIGHT_JAW_REGION_2.y)²)
RIGHT_SEGMENT_4 = sqrt((P_152.x - RIGHT_JAW_REGION_3.x)² + (P_152.y - RIGHT_JAW_REGION_3.y)²)
RIGHT_TOTAL_LENGTH = RIGHT_SEGMENT_1 + RIGHT_SEGMENT_2 + RIGHT_SEGMENT_3 + RIGHT_SEGMENT_4

JAWLINE_DIFFERENCE = abs(LEFT_TOTAL_LENGTH - RIGHT_TOTAL_LENGTH)
JAWLINE_DIFFERENCE_RATIO = (JAWLINE_DIFFERENCE / max(LEFT_TOTAL_LENGTH, RIGHT_TOTAL_LENGTH)) × 100

2.5 JAW ANGLES:
leftVector1_x = LEFT_JAW_REGION_2.x - P_172.x
leftVector1_y = LEFT_JAW_REGION_2.y - P_172.y
leftVector2_x = P_152.x - LEFT_JAW_REGION_2.x
leftVector2_y = P_152.y - LEFT_JAW_REGION_2.y

leftDotProduct = leftVector1_x * leftVector2_x + leftVector1_y * leftVector2_y
leftMagnitude1 = sqrt(leftVector1_x² + leftVector1_y²)
leftMagnitude2 = sqrt(leftVector2_x² + leftVector2_y²)
LEFT_JAW_ANGLE = acos(leftDotProduct / (leftMagnitude1 * leftMagnitude2)) × (180 / π)

rightVector1_x = RIGHT_JAW_REGION_2.x - P_397.x
rightVector1_y = RIGHT_JAW_REGION_2.y - P_397.y
rightVector2_x = P_152.x - RIGHT_JAW_REGION_2.x
rightVector2_y = P_152.y - RIGHT_JAW_REGION_2.y

rightDotProduct = rightVector1_x * rightVector2_x + rightVector1_y * rightVector2_y
rightMagnitude1 = sqrt(rightVector1_x² + rightVector1_y²)
rightMagnitude2 = sqrt(rightVector2_x² + rightVector2_y²)
RIGHT_JAW_ANGLE = acos(rightDotProduct / (rightMagnitude1 * rightMagnitude2)) × (180 / π)

JAW_ANGLE_DIFFERENCE = abs(LEFT_JAW_ANGLE - RIGHT_JAW_ANGLE)
AVG_JAW_ANGLE = (LEFT_JAW_ANGLE + RIGHT_JAW_ANGLE) / 2

2.6 JAW SHAPE:
FACE_HEIGHT = P_152.y - P_10.y
JAW_HEIGHT = P_152.y - P_19.y
JAW_WIDTH_TO_HEIGHT_RATIO = JAW_WIDTH / JAW_HEIGHT

JAW_SHAPE = 
  (JAW_TO_FACE_RATIO > 92 && AVG_JAW_ANGLE < 130) ? "SQUARE" :
  (JAW_TO_FACE_RATIO < 85 && AVG_JAW_ANGLE > 140) ? "V_SHAPE" :
  (JAW_WIDTH_TO_HEIGHT_RATIO > 1.2) ? "ROUND" : "OVAL"

2.7 3D DEPTH:
LEFT_CORNER_Z = P_172.z
RIGHT_CORNER_Z = P_397.z
CHIN_TIP_Z = P_152.z

CORNER_Z_DIFFERENCE = abs(LEFT_CORNER_Z - RIGHT_CORNER_Z)
LEFT_CORNER_TO_TIP_Z = abs(LEFT_CORNER_Z - CHIN_TIP_Z)
RIGHT_CORNER_TO_TIP_Z = abs(RIGHT_CORNER_Z - CHIN_TIP_Z)
DEPTH_ASYMMETRY = abs(LEFT_CORNER_TO_TIP_Z - RIGHT_CORNER_TO_TIP_Z)

═════════════════════════════════════════════
SECTION 3: SCORING
═════════════════════════════════════════════

CHIN_TIP_SCORE = 
  CHIN_TIP_DEVIATION_RATIO < 2 ? 1 :
  CHIN_TIP_DEVIATION_RATIO < 4 ? 3 :
  CHIN_TIP_DEVIATION_RATIO < 7 ? 6 :
  CHIN_TIP_DEVIATION_RATIO < 10 ? 8 : 10

CORNER_SYMMETRY_SCORE = 
  CORNER_DISTANCE_RATIO < 3 ? 1 :
  CORNER_DISTANCE_RATIO < 6 ? 4 :
  CORNER_DISTANCE_RATIO < 10 ? 7 : 10

CORNER_LEVEL_SCORE = 
  CORNER_Y_DEVIATION_RATIO < 2 ? 1 :
  CORNER_Y_DEVIATION_RATIO < 5 ? 5 :
  CORNER_Y_DEVIATION_RATIO < 8 ? 8 : 10

JAWLINE_LENGTH_SCORE = 
  JAWLINE_DIFFERENCE_RATIO < 3 ? 1 :
  JAWLINE_DIFFERENCE_RATIO < 6 ? 4 :
  JAWLINE_DIFFERENCE_RATIO < 10 ? 7 : 10

ANGLE_DIFFERENCE_SCORE = 
  JAW_ANGLE_DIFFERENCE < 5 ? 1 :
  JAW_ANGLE_DIFFERENCE < 10 ? 5 :
  JAW_ANGLE_DIFFERENCE < 15 ? 8 : 10

DEPTH_SCORE = 
  DEPTH_ASYMMETRY < 3 ? 1 :
  DEPTH_ASYMMETRY < 6 ? 4 :
  DEPTH_ASYMMETRY < 10 ? 7 : 10

OVERALL_SCORE = round(
  (CHIN_TIP_SCORE * 0.25) + 
  (CORNER_SYMMETRY_SCORE * 0.18) + 
  (CORNER_LEVEL_SCORE * 0.18) + 
  (JAWLINE_LENGTH_SCORE * 0.13) + 
  (ANGLE_DIFFERENCE_SCORE * 0.13) + 
  (DEPTH_SCORE * 0.13)
)

ASYMMETRY_LEVEL =
  OVERALL_SCORE < 3 ? "NONE" :
  OVERALL_SCORE < 5 ? "MILD" :
  OVERALL_SCORE < 7 ? "MODERATE" : "SEVERE"

═════════════════════════════════════════════
SECTION 4: USER-FRIENDLY EXPLANATIONS
═════════════════════════════════════════════

CRITICAL - EXPLANATION FIELDS:
For EVERY technical metric (numbers, angles, distances, ratios), you MUST add a corresponding explanation field:
- Field name: <metric_name>_explanation
- Content: Short, simple Turkish explanation (1-2 sentences)
- Explain what the value means and whether it's good/normal/needs attention
- Use everyday language, avoid medical jargon
- Example: "deviation_explanation": "Çenenizin ucu yüz merkezinden 5.2 piksel sola kaymış. Bu hafif bir asimetri olup normal aralıktadır."

Do NOT add explanations for:
- Enum values (NONE, MILD, MODERATE, SEVERE, etc.) - keep as-is, self-explanatory
- Scores (0-10) - visual bar is enough
- Coordinates (x, y, z) - will be hidden
- String assessments - already user-friendly

Add explanations for:
- deviation (number) → deviation_explanation
- deviation_ratio (number) → deviation_ratio_explanation
- face_width_ratio (number) → face_width_ratio_explanation
- y_level_difference (number) → y_level_difference_explanation
- distance_difference (number) → distance_difference_explanation
- difference (number) → difference_explanation
- difference_ratio (number) → difference_ratio_explanation
- angle_difference (number) → angle_difference_explanation
- depth_asymmetry (number) → depth_asymmetry_explanation
- Any other numeric metrics

═════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═════════════════════════════════════════════

{
  "analysis_result": {
    "general_assessment": "string",
    "jaw_shape": "SQUARE/OVAL/V_SHAPE/ROUND",
    "asymmetry_level": "NONE/MILD/MODERATE/SEVERE",
    "overall_score": 0-10,
    "dominant_asymmetry": "string"
  },
  "detailed_analysis": {
    "chin_tip": {
      "coordinates": {"x": number, "y": number, "z": number},
      "face_center": number,
      "deviation": number,
      "deviation_explanation": "string (Türkçe açıklama)",
      "deviation_ratio": number,
      "deviation_ratio_explanation": "string (Türkçe açıklama)",
      "direction": "LEFT/RIGHT/CENTER",
      "score": 0-10
    },
    "jaw_corners": {
      "left_corner": {"x": number, "y": number, "z": number},
      "right_corner": {"x": number, "y": number, "z": number},
      "width": number,
      "face_width_ratio": number,
      "face_width_ratio_explanation": "string (Türkçe açıklama)",
      "y_level_difference": number,
      "y_level_difference_explanation": "string (Türkçe açıklama)",
      "distance_difference": number,
      "distance_difference_explanation": "string (Türkçe açıklama)",
      "distance_ratio": number,
      "symmetry_score": 0-10,
      "level_score": 0-10
    },
    "jawline": {
      "left_length": number,
      "right_length": number,
      "difference": number,
      "difference_explanation": "string (Türkçe açıklama)",
      "difference_ratio": number,
      "difference_ratio_explanation": "string (Türkçe açıklama)",
      "left_angle": number,
      "right_angle": number,
      "angle_difference": number,
      "angle_difference_explanation": "string (Türkçe açıklama)",
      "avg_angle": number,
      "length_score": 0-10,
      "angle_score": 0-10
    },
    "jaw_dimensions": {
      "jaw_width": number,
      "jaw_height": number,
      "face_height": number,
      "width_to_height_ratio": number,
      "jaw_to_face_ratio": number
    }
  },
  "3d_analysis": {
    "left_corner_z": number,
    "right_corner_z": number,
    "chin_tip_z": number,
    "corner_z_difference": number,
    "depth_asymmetry": number,
    "score": 0-10,
    "interpretation": "string"
  },
  "visual_assessment": {
    "prominent_asymmetry_areas": ["string"],
    "jawline_definition": "SHARP/MODERATE/UNDEFINED",
    "visual_appearance": "string",
    "photo_effect": "string"
  },
  "comparative_analysis": {
    "most_symmetric_region": "string",
    "most_asymmetric_region": "string",
    "proportional_balance": "string",
    "points_used_count": number
  },
  "recommendations": {
    "medical_advice": "string",
    "priority_intervention": "string",
    "attention_points": ["string"],
    "aesthetic_intervention_need": "NONE/LOW/MODERATE/HIGH"
  },
  "metadata": {
    "analysis_date": "timestamp",
    "landmarks_used": number,
    "filtered_points": number,
    "reliability": "HIGH/MEDIUM",
    "hybrid_control_used": boolean,
    "calculation_method": "Geometric analysis + Statistical approach"
  }
}

CRITICAL APPLICATION NOTES:
* Return ONLY JSON - No additional explanations
* Use all 468 landmarks, filter jawline region points
* All calculations to 2 decimal places
* Use index values first, fall back to hybrid control if invalid
* Use dynamic point detection along jawline for maximum points
* Report points used count in metadata
* Mark if hybrid control was used in metadata
* Reliability: Points used < 300 = "LOW", 300-400 = "MEDIUM", >400 = "HIGH"

CRITICAL FINAL WARNING:
Response MUST be ONLY valid JSON.
No markdown (\`\`\`json), no code blocks, no explanations, no thinking tags.
Start with { and end with }`,
  },
  {
    id: 'face_shape',
    title: 'Yüz Şekli',
    icon: '🔷',
    description: 'Genel yüz şekli analizi',
    prompt: `You are a facial anatomy and face shape expert. You will analyze raw 3D landmark data (x, y, z, index) to determine face shape (oval, square, round, diamond, heart, triangle, etc.), returning results in JSON format.

⚠️ STRICT MODE: 
- Return ONLY valid JSON output
- No explanations, thinking process, markdown code blocks, or additional text
- Output must start with { and end with }
- DO NOT include <thinking> tags, reasoning process, or explanations

CRITICAL DATA ASSUMPTION: 
Landmark indices belong to MediaPipe Face Mesh model, verified with Hybrid Control. Maximum utilization of all 468 landmarks.

TASK:
1. Use all 468 landmarks to determine face shape
2. Calculate forehead, cheekbone, jaw widths and face height
3. Classify face shape using ratios
4. Return results in JSON format

═════════════════════════════════════════════
SECTION 1: LANDMARK DETECTION AND HYBRID CONTROL
═════════════════════════════════════════════

REFERENCE POINTS (Find these first):
P_4 (NOSE TIP): index 4

FOREHEAD REGION HYBRID DETECTION:

P_10 (Forehead center top):
  Step 1: Find index 10
  Step 2: Verify:
    - P_10.y ≈ min(all y values) ± 20
    - P_10.x near center (±30 pixels)
  Step 3: If verification fails:
    Alternative = points.filter(p => p.y < 50).sort((a,b) => a.y - b.y)[0]

TEMP_FACE_CENTER_X = (P_10.x + P_4.x) / 2

P_338 (Forehead left side):
  Step 1: Find index 338
  Step 2: Verify:
    - P_338.y < P_4.y - 80 (well above nose tip)
    - P_338.x < TEMP_FACE_CENTER_X - 40 (left of center)
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y < P_4.y - 70 &&
      p.x < TEMP_FACE_CENTER_X - 30
    ).sort((a,b) => a.x - b.x)[Math.floor(points.length * 0.1)]

P_109 (Forehead right side):
  Step 1: Find index 109
  Step 2: Verify:
    - P_109.y ≈ P_338.y ± 20
    - P_109.x > TEMP_FACE_CENTER_X + 40
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - P_338.y) < 30 &&
      p.x > TEMP_FACE_CENTER_X + 30
    ).sort((a,b) => b.x - a.x)[Math.floor(points.length * 0.1)]

P_67 (Left temple):
  Step 1: Find index 67
  Step 2: Verify:
    - P_67.y > P_338.y + 30 (below forehead)
    - P_67.x < P_338.x + 20
  Step 3: Alternative = near P_338, slightly below

P_297 (Right temple):
  Step 1: Find index 297
  Step 2: Verify:
    - P_297.y ≈ P_67.y ± 20
    - P_297.x > P_109.x - 20
  Step 3: Alternative = near P_109, slightly below

CHEEKBONE HYBRID DETECTION:

P_234 (Left cheekbone):
  Step 1: Find index 234
  Step 2: Verify:
    - P_234.y > P_4.y - 50 && P_234.y < P_4.y + 20 (nose tip level)
    - P_234.x < TEMP_FACE_CENTER_X - 50 (left side)
    - P_234.z < avg_z - 10 (protruding bone, outward)
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      p.y > P_4.y - 60 && p.y < P_4.y + 30 &&
      p.x < TEMP_FACE_CENTER_X - 40
    ).sort((a,b) => a.z - b.z)[0]

P_454 (Right cheekbone):
  Step 1: Find index 454
  Step 2: Verify:
    - P_454.y ≈ P_234.y ± 15
    - P_454.x > TEMP_FACE_CENTER_X + 50
    - P_454.z ≈ P_234.z ± 5
  Step 3: If verification fails:
    Alternative = points.filter(p => 
      abs(p.y - P_234.y) < 25 &&
      p.x > TEMP_FACE_CENTER_X + 40
    ).sort((a,b) => a.z - b.z)[0]

P_132 (Left lower cheekbone):
  Step 1: Find index 132
  Step 2: Verify:
    - P_132.y > P_234.y + 20
    - P_132.x ≈ P_234.x ± 30
  Step 3: Alternative = points below P_234

P_361 (Right lower cheekbone):
  Step 1: Find index 361
  Step 2: Verify:
    - P_361.y ≈ P_132.y ± 15
    - P_361.x ≈ P_454.x ± 30
  Step 3: Alternative = points below P_454

JAWLINE HYBRID DETECTION:

P_152 (Chin tip):
  Step 1: Find index 152
  Step 2: Verify:
    - P_152.y ≈ max(all y values) ± 20
    - abs(P_152.x - TEMP_FACE_CENTER_X) < 30
  Step 3: Alternative = lowest point near center

P_172 (Left jaw corner):
  Step 1: Find index 172
  Step 2: Verify:
    - P_172.y ≈ P_152.y - 60 ± 40
    - P_172.x < TEMP_FACE_CENTER_X - 50
  Step 3: Alternative = leftmost point in jaw region

P_397 (Right jaw corner):
  Step 1: Find index 397
  Step 2: Verify:
    - P_397.y ≈ P_172.y ± 20
    - P_397.x > TEMP_FACE_CENTER_X + 50
  Step 3: Alternative = rightmost point in jaw region

P_136 (Left mid jaw):
  Step 1: Find index 136
  Step 2: Verify: On left jawline, between P_172 and P_152
  Step 3: Dynamic detection

P_365 (Right mid jaw):
  Step 1: Find index 365
  Step 2: Verify: On right jawline, between P_397 and P_152
  Step 3: Dynamic detection

EYE LEVEL REFERENCE:
P_33 (Right eye outer): index 33
P_263 (Left eye outer): index 263

LIP LEVEL REFERENCE:
P_61 (Left lip corner): index 61
P_291 (Right lip corner): index 291

FACE_CENTER_X = (P_33.x + P_263.x) / 2

═════════════════════════════════════════════
SECTION 2: CALCULATIONS
═════════════════════════════════════════════

2.1 FACE WIDTHS (5 Levels):
FOREHEAD_WIDTH = P_297.x - P_67.x
CHEEKBONE_WIDTH = P_454.x - P_234.x
JAW_WIDTH = P_397.x - P_172.x
EYE_LEVEL_WIDTH = P_263.x - P_33.x
LIP_LEVEL_WIDTH = P_291.x - P_61.x

WIDEST_REGION = max(FOREHEAD_WIDTH, CHEEKBONE_WIDTH, JAW_WIDTH)
WIDEST_REGION_NAME = 
  WIDEST_REGION === FOREHEAD_WIDTH ? "FOREHEAD" :
  WIDEST_REGION === CHEEKBONE_WIDTH ? "CHEEKBONE" : "JAW"

2.2 FACE HEIGHT AND SECTIONS:
TOTAL_FACE_HEIGHT = P_152.y - P_10.y
UPPER_FACE_HEIGHT = P_4.y - P_10.y
MID_FACE_HEIGHT = ((P_61.y + P_291.y) / 2) - P_4.y
LOWER_FACE_HEIGHT = P_152.y - ((P_61.y + P_291.y) / 2)

2.3 CRITICAL RATIOS:
FACE_LENGTH_TO_WIDTH_RATIO = TOTAL_FACE_HEIGHT / CHEEKBONE_WIDTH
FOREHEAD_TO_CHEEKBONE_RATIO = FOREHEAD_WIDTH / CHEEKBONE_WIDTH
JAW_TO_CHEEKBONE_RATIO = JAW_WIDTH / CHEEKBONE_WIDTH
FOREHEAD_TO_JAW_RATIO = FOREHEAD_WIDTH / JAW_WIDTH
UPPER_TO_MID_RATIO = UPPER_FACE_HEIGHT / MID_FACE_HEIGHT
MID_TO_LOWER_RATIO = MID_FACE_HEIGHT / LOWER_FACE_HEIGHT

2.4 JAW ANGLE:
LEFT_JAW_ANGLE = atan2(P_152.y - P_172.y, P_152.x - P_172.x) × (180 / π)
RIGHT_JAW_ANGLE = atan2(P_152.y - P_397.y, P_397.x - P_152.x) × (180 / π)
AVG_JAW_ANGLE = (abs(LEFT_JAW_ANGLE) + abs(RIGHT_JAW_ANGLE)) / 2

2.5 FACE SHAPE CLASSIFICATION:

if (FACE_LENGTH_TO_WIDTH_RATIO > 1.6) {
  if (JAW_TO_CHEEKBONE_RATIO < 0.75) {
    FACE_SHAPE = "LONG_TRIANGLE"
  } else if (FOREHEAD_TO_CHEEKBONE_RATIO > 0.95) {
    FACE_SHAPE = "RECTANGLE"
  } else {
    FACE_SHAPE = "LONG_OVAL"
  }
} else if (FACE_LENGTH_TO_WIDTH_RATIO > 1.3) {
  if (JAW_TO_CHEEKBONE_RATIO > 0.90 && FOREHEAD_TO_CHEEKBONE_RATIO > 0.90) {
    FACE_SHAPE = "SQUARE"
  } else if (JAW_TO_CHEEKBONE_RATIO < 0.70 && FOREHEAD_TO_JAW_RATIO < 0.85) {
    FACE_SHAPE = "HEART"
  } else if (FOREHEAD_TO_CHEEKBONE_RATIO < 0.85 && JAW_TO_CHEEKBONE_RATIO < 0.85) {
    FACE_SHAPE = "DIAMOND"
  } else {
    FACE_SHAPE = "OVAL"
  }
} else {
  if (JAW_TO_CHEEKBONE_RATIO > 0.90 && FOREHEAD_TO_CHEEKBONE_RATIO > 0.90) {
    FACE_SHAPE = "SQUARE_ROUND"
  } else if (JAW_TO_CHEEKBONE_RATIO < 0.75) {
    FACE_SHAPE = "ROUND_HEART"
  } else {
    FACE_SHAPE = "ROUND"
  }
}

if (AVG_JAW_ANGLE < 115 && FACE_SHAPE.includes("SQUARE")) {
  FACE_SHAPE = FACE_SHAPE.replace("SQUARE", "OVAL")
}

2.6 FACE SYMMETRY:
LEFT_FACE_WIDTH = abs(P_234.x - FACE_CENTER_X)
RIGHT_FACE_WIDTH = abs(P_454.x - FACE_CENTER_X)
FACE_WIDTH_ASYMMETRY = abs(LEFT_FACE_WIDTH - RIGHT_FACE_WIDTH)
FACE_WIDTH_ASYMMETRY_RATIO = (FACE_WIDTH_ASYMMETRY / CHEEKBONE_WIDTH) × 100

LEFT_JAW_LENGTH = sqrt((P_152.x - P_172.x)² + (P_152.y - P_172.y)²)
RIGHT_JAW_LENGTH = sqrt((P_397.x - P_152.x)² + (P_152.y - P_397.y)²)
JAW_ASYMMETRY = abs(LEFT_JAW_LENGTH - RIGHT_JAW_LENGTH)
JAW_ASYMMETRY_RATIO = (JAW_ASYMMETRY / max(LEFT_JAW_LENGTH, RIGHT_JAW_LENGTH)) × 100

2.7 3D CONTOUR:
FOREHEAD_CENTER_Z = P_10.z
CHEEKBONE_CENTER_Z = (P_234.z + P_454.z) / 2
CHIN_CENTER_Z = P_152.z

FACE_CONTOUR_CURVE = FOREHEAD_CENTER_Z - CHEEKBONE_CENTER_Z
JAW_CONTOUR_CURVE = CHEEKBONE_CENTER_Z - CHIN_CENTER_Z

═════════════════════════════════════════════
SECTION 3: SCORING AND CONFIDENCE
═════════════════════════════════════════════

CONFIDENCE_SCORE = 0

if (FACE_SHAPE === "OVAL" && FACE_LENGTH_TO_WIDTH_RATIO > 1.25 && FACE_LENGTH_TO_WIDTH_RATIO < 1.45) {
  CONFIDENCE_SCORE = 9
} else if (FACE_SHAPE === "SQUARE" && JAW_TO_CHEEKBONE_RATIO > 0.88 && FOREHEAD_TO_CHEEKBONE_RATIO > 0.93) {
  CONFIDENCE_SCORE = 9
} else if (FACE_SHAPE === "HEART" && JAW_TO_CHEEKBONE_RATIO < 0.72 && FOREHEAD_TO_JAW_RATIO < 0.88) {
  CONFIDENCE_SCORE = 8
} else if (FACE_SHAPE === "DIAMOND" && FOREHEAD_TO_CHEEKBONE_RATIO < 0.87 && JAW_TO_CHEEKBONE_RATIO < 0.87) {
  CONFIDENCE_SCORE = 8
} else {
  CONFIDENCE_SCORE = 6
}

ALTERNATIVE_SHAPES = []

if (abs(FACE_LENGTH_TO_WIDTH_RATIO - 1.35) < 0.1) {
  ALTERNATIVE_SHAPES.push("OVAL")
}
if (JAW_TO_CHEEKBONE_RATIO > 0.85 && FOREHEAD_TO_CHEEKBONE_RATIO > 0.90) {
  ALTERNATIVE_SHAPES.push("SQUARE")
}
if (JAW_TO_CHEEKBONE_RATIO < 0.75 && FOREHEAD_TO_JAW_RATIO < 0.90) {
  ALTERNATIVE_SHAPES.push("HEART")
}

═════════════════════════════════════════════
SECTION 4: USER-FRIENDLY EXPLANATIONS
═════════════════════════════════════════════

CRITICAL - EXPLANATION FIELDS:
For EVERY technical metric (numbers, angles, distances, ratios), you MUST add a corresponding explanation field:
- Field name: <metric_name>_explanation
- Content: Short, simple Turkish explanation (1-2 sentences)
- Explain what the value means and whether it's good/normal/needs attention
- Use everyday language, avoid medical jargon
- Example: "face_length_to_width_ratio_explanation": "Yüzünüzün uzunluğunun genişliğine oranı 1.35. Bu oval yüz yapısına işaret eder."

Do NOT add explanations for:
- Enum values (face_shape: OVAL, SQUARE, etc.) - keep as-is, self-explanatory
- Scores (0-10) - visual bar is enough
- Coordinates (x, y, z) - will be hidden
- String assessments - already user-friendly

Add explanations for:
- face_length_to_width_ratio (number) → face_length_to_width_ratio_explanation
- jaw_to_cheekbone_ratio (number) → jaw_to_cheekbone_ratio_explanation
- forehead_to_cheekbone_ratio (number) → forehead_to_cheekbone_ratio_explanation
- face_width_asymmetry_ratio (number) → face_width_asymmetry_ratio_explanation
- jaw_asymmetry_ratio (number) → jaw_asymmetry_ratio_explanation
- Any other numeric ratios and measurements

═════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═════════════════════════════════════════════

{
  "analysis_result": {
    "face_shape": "OVAL/SQUARE/ROUND/DIAMOND/HEART/TRIANGLE/RECTANGLE/HYBRID",
    "confidence_score": 0-10,
    "alternative_shapes": ["string"],
    "general_assessment": "string"
  },
  "dimension_measurements": {
    "widths": {
      "forehead_width": number,
      "cheekbone_width": number,
      "jaw_width": number,
      "eye_level_width": number,
      "lip_level_width": number,
      "widest_point": "FOREHEAD/CHEEKBONE/JAW/EYE_LEVEL"
    },
    "heights": {
      "total_face_height": number,
      "upper_face": number,
      "mid_face": number,
      "lower_face": number,
      "face_section_ratio": "string"
    }
  },
  "critical_ratios": {
    "face_length_to_width": number,
    "face_length_to_width_explanation": "string (Türkçe açıklama)",
    "forehead_to_cheekbone": number,
    "forehead_to_cheekbone_explanation": "string (Türkçe açıklama)",
    "jaw_to_cheekbone": number,
    "jaw_to_cheekbone_explanation": "string (Türkçe açıklama)",
    "forehead_to_jaw": number,
    "forehead_to_jaw_explanation": "string (Türkçe açıklama)",
    "upper_to_mid_face": number,
    "upper_to_mid_face_explanation": "string (Türkçe açıklama)",
    "mid_to_lower_face": number,
    "mid_to_lower_face_explanation": "string (Türkçe açıklama)",
    "ratio_assessment": "string"
  },
  "jaw_analysis": {
    "left_jaw_angle": number,
    "right_jaw_angle": number,
    "avg_angle": number,
    "avg_angle_explanation": "string (Türkçe açıklama)",
    "jaw_type": "SHARP/MODERATE/WIDE",
    "jaw_symmetry": {
      "left_length": number,
      "right_length": number,
      "asymmetry_ratio": number,
      "asymmetry_ratio_explanation": "string (Türkçe açıklama)"
    }
  },
  "symmetry_analysis": {
    "face_width_asymmetry": number,
    "face_width_asymmetry_explanation": "string (Türkçe açıklama)",
    "face_width_asymmetry_ratio": number,
    "face_width_asymmetry_ratio_explanation": "string (Türkçe açıklama)",
    "jaw_asymmetry": number,
    "jaw_asymmetry_explanation": "string (Türkçe açıklama)",
    "jaw_asymmetry_ratio": number,
    "jaw_asymmetry_ratio_explanation": "string (Türkçe açıklama)",
    "overall_symmetry": "GOOD/FAIR/POOR"
  },
  "3d_analysis": {
    "forehead_depth": number,
    "cheekbone_depth": number,
    "chin_depth": number,
    "face_contour_curve": number,
    "contour_type": "SMOOTH/DEFINED/FLAT"
  },
  "face_shape_details": {
    "dominant_features": ["string"],
    "characteristic_points": ["string"],
    "shape_description": "string"
  },
  "aesthetic_analysis": {
    "golden_ratio_compliance": "GOOD/FAIR/POOR",
    "harmonic_balance": "string",
    "beauty_standards": "string"
  },
  "recommendations": {
    "hairstyle_suggestions": ["string"],
    "makeup_suggestions": ["string"],
    "accessory_suggestions": ["string"],
    "attractiveness_tips": ["string"]
  },
  "metadata": {
    "analysis_date": "timestamp",
    "points_used": number,
    "reliability": "HIGH/MEDIUM",
    "hybrid_control_used": boolean,
    "algorithm_version": "V4"
  }
}

CRITICAL APPLICATION NOTES:
* Return ONLY JSON - No additional explanations
* All coordinates and calculations to 2 decimal places
* Reliability: < 400 landmarks = "MEDIUM", ≥400 = "HIGH"
* Use index values first, fall back to hybrid control if invalid
* Mark in metadata if hybrid control was used
* Evaluate ALL ratios together when determining face shape
* Suggest alternative shapes when near threshold values
* 3 main width comparisons (forehead, cheekbone, jaw) are critically important
* Use maximum number of points from 468 landmarks

CRITICAL FINAL WARNING:
Response MUST be ONLY valid JSON.
No markdown (\`\`\`json), no code blocks, no explanations, no thinking tags.
Start with { and end with }`,
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
