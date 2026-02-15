/**
 * Scoring Constants and Configuration
 * 
 * Centralizes all magic numbers and thresholds used in attractiveness scoring.
 * Based on clinical research and human perception studies.
 */

// ============================================
// IDEAL RATIOS (Based on scientific research)
// ============================================

export const IDEAL_RATIOS = {
    // Nose proportions
    NOSE_DEVIATION_THRESHOLD: 3.5,           // % - breaking point for visible asymmetry
    NOSE_DEVIATION_TOLERANCE: 1.5,           // % - perfect symmetry threshold
    NOSE_WIDTH_IDEAL_MIN: 30,                // % of face width
    NOSE_WIDTH_IDEAL_MAX: 35,                // % of face width
    NOSE_LENGTH_IDEAL_MIN: 35,               // % of face width
    NOSE_LENGTH_IDEAL_MAX: 45,               // % of face width
    NOSE_PROJECTION_IDEAL_MIN: 0.06,         // z-axis units
    NOSE_PROJECTION_IDEAL_MAX: 0.09,         // z-axis units

    // Eye proportions  
    EYE_SPACING_IDEAL_MIN: 28,               // % of face width
    EYE_SPACING_IDEAL_MAX: 32,               // % of face width
    EYE_SPACING_CLOSE_SET: 25,               // % - too close
    EYE_SPACING_WIDE_SET: 38,                // % - too wide

    // Lip proportions
    LIP_UPPER_LOWER_RATIO_MIN: 0.45,         // ideal min (upper/lower)
    LIP_UPPER_LOWER_RATIO_MAX: 0.60,         // ideal max (upper/lower)
    LIP_UPPER_LOWER_RATIO_TOLERABLE_MIN: 0.35, // tolerable min
    LIP_UPPER_LOWER_RATIO_TOLERABLE_MAX: 0.75, // tolerable max

    // Face proportions (Rule of Thirds)
    PHILTRUM_RATIO_IDEAL: 0.3,               // philtrum to lower face height
    VERTICAL_THIRDS_TOLERANCE: 0.15,         // acceptable deviation

    // Jaw proportions
    JAW_WIDTH_IDEAL_MIN: 80,                 // % of face width
    JAW_WIDTH_IDEAL_MAX: 95,                 // % of face width

    // Golden ratio reference
    GOLDEN_RATIO: 1.618,

    // Eyebrow proportions
    BROW_EYE_DISTANCE_IDEAL_MIN: 80,         // % of eye height
    BROW_EYE_DISTANCE_IDEAL_MAX: 140,        // % of eye height
} as const;

// ============================================
// SCORING WEIGHTS
// ============================================

export const SCORING_WEIGHTS = {
    // Regional feature weights (when all regional scores available)
    // Total: 70% contribution
    REGIONAL: {
        NOSE: 0.20,          // 20% - Most visible (crooked nose is very obvious)
        EYEBROWS: 0.15,      // 15% - Very visible (asymmetric brows stand out)
        EYES: 0.15,          // 15% - Very visible (eye asymmetry is critical)
        JAWLINE: 0.12,       // 12% - Moderately visible
        LIPS: 0.08,          // 8%  - Less visible than other features
        TOTAL: 0.70,         // 70% total regional contribution
    },

    // General calculation weights (symmetry, proportions, harmony)
    // These are used for the remaining 30% when regional scores available,
    // or 100% when regional scores not available (backward compatibility)
    GENERAL: {
        SYMMETRY: 0.40,      // 40% of general score
        PROPORTIONS: 0.35,   // 35% of general score
        HARMONY: 0.25,       // 25% of general score
    },

    // Contribution split when both regional and general available
    CONTRIBUTION: {
        REGIONAL: 0.70,      // 70% from detailed regional analysis
        GENERAL: 0.30,       // 30% from overall face analysis
    },
} as const;

// ============================================
// PENALTY CONFIGURATION
// ============================================

export const PENALTY_CONFIG = {
    // Threshold for considering a feature severely flawed
    SEVERE_FLAW_THRESHOLD: 4,                // Score < 4 = severe flaw

    // Penalty per severe flaw
    PENALTY_PER_FLAW: 0.05,                  // 5% penalty per severe flaw

    // Maximum cumulative penalty
    MAX_PENALTY: 0.25,                       // Maximum 25% total penalty

    // Minimum score multiplier (1.0 - MAX_PENALTY)
    MIN_MULTIPLIER: 0.75,                    // No score can be reduced by more than 25%
} as const;

// ============================================
// CONFIDENCE THRESHOLDS
// ============================================

export const CONFIDENCE_THRESHOLDS = {
    // Landmark quality
    HIGH_CONFIDENCE: 100,                    // All critical landmarks present
    MEDIUM_CONFIDENCE: 75,                   // 1-2 minor landmarks missing
    LOW_CONFIDENCE: 50,                      // 3-4 landmarks missing or low quality
    VERY_LOW_CONFIDENCE: 25,                 // 5+ landmarks missing

    // Minimum landmarks required
    MIN_LANDMARKS: 400,                      // MediaPipe returns 468, allow some tolerance
} as const;

// ============================================
// SCORING SCALE LABELS
// ============================================

export const SCORE_LABELS = {
    EXCEPTIONAL: { min: 9, label: 'Exceptional', labelTr: 'Olağanüstü' },
    VERY_ATTRACTIVE: { min: 8, label: 'Very Attractive', labelTr: 'Çok Çekici' },
    ATTRACTIVE: { min: 7, label: 'Attractive', labelTr: 'Çekici' },
    ABOVE_AVERAGE: { min: 6, label: 'Above Average', labelTr: 'Ortalamanın Üstünde' },
    AVERAGE: { min: 5, label: 'Average', labelTr: 'Ortalama' },
    BELOW_AVERAGE: { min: 4, label: 'Below Average', labelTr: 'Ortalamanın Altında' },
    NEEDS_IMPROVEMENT: { min: 0, label: 'Needs Improvement', labelTr: 'Geliştirilebilir' },
} as const;

// ============================================
// ASYMMETRY LEVELS
// ============================================

export const ASYMMETRY_LEVELS = {
    NONE: { min: 9, label: 'None', labelTr: 'Yok' },
    MILD: { min: 7, label: 'Mild', labelTr: 'Hafif' },
    MODERATE: { min: 4, label: 'Moderate', labelTr: 'Orta' },
    SEVERE: { min: 0, label: 'Severe', labelTr: 'Ciddi' },
} as const;

// ============================================
// SMOOTH SCORING PARAMETERS
// ============================================

export const SMOOTH_SCORING = {
    // Sigmoid curve steepness (higher = sharper transitions)
    SIGMOID_STEEPNESS: 1.0,

    // Linear interpolation ranges
    LINEAR: {
        PERFECT_THRESHOLD: 0.5,    // < 0.5x tolerance = perfect (10)
        GOOD_THRESHOLD: 1.0,       // < 1.0x tolerance = good (8-9)
        ACCEPTABLE_THRESHOLD: 1.5, // < 1.5x tolerance = acceptable (6-7)
        POOR_THRESHOLD: 2.0,       // < 2.0x tolerance = poor (4-5)
        // > 2.0x tolerance = severe (0-3)
    },
} as const;

// ============================================
// SCORE CALIBRATION
// ============================================

export const SCORE_CALIBRATION = {
    // Global score multiplier to calibrate overall results
    // Example: 0.9125 (9.1/10) reduces scores by ~8.75%
    // 8.0 -> 7.3
    // 7.0 -> 6.38
    SCORE_MULTIPLIER: 0.9125,

    // Optional offset to add/subtract after multiplication
    SCORE_OFFSET: 0,
} as const;
