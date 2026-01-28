/**
 * Geometry Utilities for Face Analysis
 *
 * Pure mathematical functions for calculating distances, angles, and spatial relationships
 * between facial landmarks. These utilities are reusable across all face regions.
 *
 * Coordinate System: 1024x1024 canvas, origin at top-left (0,0)
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Point {
  x: number;
  y: number;
}

export interface Point3D extends Point {
  z: number;
  index: number;
}

export interface Line {
  start: Point;
  end: Point;
}

// ============================================
// DISTANCE CALCULATIONS
// ============================================

/**
 * Calculate 2D Euclidean distance between two points
 * @param p1 First point
 * @param p2 Second point
 * @returns Distance in pixels
 */
export function distance2D(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate 3D Euclidean distance between two points
 * @param p1 First point with z coordinate
 * @param p2 Second point with z coordinate
 * @returns Distance in 3D space
 */
export function distance3D(p1: Point3D, p2: Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate absolute horizontal distance from a point to a center X coordinate
 * @param point The point to measure from
 * @param centerX The center X coordinate
 * @returns Absolute horizontal distance in pixels
 */
export function distanceFromCenter(point: Point, centerX: number): number {
  return Math.abs(point.x - centerX);
}

// ============================================
// ANGLE CALCULATIONS
// ============================================

/**
 * Calculate angle between two points in degrees
 * Uses atan2 for proper quadrant handling
 * @param p1 First point (reference)
 * @param p2 Second point
 * @returns Angle in degrees (-180 to 180)
 */
export function angleBetweenPoints(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// ============================================
// POINT RELATIONSHIPS
// ============================================

/**
 * Calculate midpoint between two points
 * @param p1 First point
 * @param p2 Second point
 * @returns Midpoint coordinates
 */
export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calculate perpendicular distance from a point to a line
 * @param point The point to measure from
 * @param line The line (defined by start and end points)
 * @returns Perpendicular distance in pixels
 */
export function pointToLineDistance(point: Point, line: Line): number {
  const { start, end } = line;

  // Line length
  const lineLength = distance2D(start, end);

  // Handle degenerate case (line is a point)
  if (lineLength === 0) {
    return distance2D(point, start);
  }

  // Calculate perpendicular distance using cross product formula
  const numerator = Math.abs(
    (end.y - start.y) * point.x -
    (end.x - start.x) * point.y +
    end.x * start.y -
    end.y * start.x
  );

  return numerator / lineLength;
}

// ============================================
// COORDINATE HELPERS
// ============================================

/**
 * Calculate center X coordinate between two points
 * @param leftPoint Left reference point
 * @param rightPoint Right reference point
 * @returns Center X coordinate
 */
export function getCenterX(leftPoint: Point, rightPoint: Point): number {
  const result = (leftPoint.x + rightPoint.x) / 2;

  // DEBUG-MIRROR: getCenterX hesaplama kontrolü
  console.log('📐 [DEBUG-MIRROR] getCenterX:', {
    leftPoint_x: leftPoint.x.toFixed(2),
    rightPoint_x: rightPoint.x.toFixed(2),
    center: result.toFixed(2),
    // NOT: nose.ts'de rightEyeOuter ilk parametre olarak geçiriliyor!
  });

  return result;
}

/**
 * Determine direction of deviation from center (from subject's perspective)
 * @param value Deviation value (positive = subject's LEFT, negative = subject's RIGHT)
 * @param threshold Threshold for considering it centered (in pixels)
 * @returns Direction label from subject's own perspective (mirror view)
 */
export function getDirection(
  value: number,
  threshold: number = 2
): 'LEFT' | 'RIGHT' | 'CENTER' {
  if (Math.abs(value) < threshold) {
    return 'CENTER';
  }
  // Kişinin kendi perspektifinden: ekranda sağ = kişinin solu
  return value > 0 ? 'LEFT' : 'RIGHT';
}

/**
 * Calculate percentage ratio relative to a reference width
 * @param value Measured value in pixels
 * @param referenceWidth Reference width (e.g., face width)
 * @returns Percentage (0-100)
 */
export function toPercentageOfWidth(value: number, referenceWidth: number): number {
  return (Math.abs(value) / referenceWidth) * 100;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Round a number to specified decimal places
 * @param value Number to round
 * @param decimals Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function roundTo(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Clamp a value between min and max
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
