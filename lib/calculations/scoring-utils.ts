export interface ControlPoint {
    value: number;
    score: number;
}

/**
 * Calculates a score based on continuous linear interpolation between control points.
 * 
 * @param inputValue The measured value (e.g., asymmetry ratio)
 * @param points Array of control points defining the scoring curve, sorted by value.
 *               Example: [{value: 0, score: 10}, {value: 5, score: 0}]
 * @returns Calculated score between 0 and 10 (rounded to 1 decimal)
 */
export function calculateLinearScore(inputValue: number, points: ControlPoint[]): number {
    const value = Math.abs(inputValue);

    // 1. Handle values below the first point (Perfect range)
    if (value <= points[0].value) {
        return points[0].score;
    }

    // 2. Handle values beyond the last point (Worst case)
    if (value >= points[points.length - 1].value) {
        return points[points.length - 1].score;
    }

    // 3. Find the range [p1, p2] that contains the value
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        if (value >= p1.value && value < p2.value) {
            // Linear interpolation formula:
            // y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
            const ratio = (value - p1.value) / (p2.value - p1.value);
            const rawScore = p1.score + ratio * (p2.score - p1.score);

            // Round to 1 decimal place for cleaner output
            return Math.round(rawScore * 10) / 10;
        }
    }

    // Fallback (should not be reached)
    return points[points.length - 1].score;
}

// Predefined Scoring Curves for Consistency
export const SCORING_CURVES = {
    // Use for highly visible symmetry (e.g., Eye size, Nose tip)
    STRICT: [
        { value: 1.5, score: 10 },
        { value: 3.0, score: 8 },
        { value: 5.0, score: 6 },
        { value: 8.0, score: 3 },
        { value: 12.0, score: 1 }
    ],
    // Use for standard features
    STANDARD: [
        { value: 2.0, score: 10 },
        { value: 5.0, score: 8 },
        { value: 8.0, score: 6 },
        { value: 12.0, score: 3 },
        { value: 18.0, score: 1 }
    ],
    // Use for subjective/aesthetic features (e.g., Tilt, Projection)
    TOLERANT: [
        { value: 3.0, score: 10 },
        { value: 6.0, score: 8 },
        { value: 10.0, score: 6 },
        { value: 15.0, score: 3 },
        { value: 25.0, score: 1 }
    ]
};
