// Metrics Extraction System
// Extracts comparison-relevant metrics from AI analysis responses

import type { RegionId } from '../exercises';
import { extractEyebrowsMetrics } from './eyebrows';
import { extractEyesMetrics } from './eyes';
import { extractNoseMetrics } from './nose';
import { extractLipsMetrics } from './lips';
import { extractJawlineMetrics } from './jawline';
import { extractFaceShapeMetrics } from './face-shape';

// Base metrics that all regions share
export interface BaseMetrics {
  overall_score: number;
  general_assessment?: string;
}

// Region-specific metric types
export interface EyebrowsMetrics extends BaseMetrics {
  symmetry_score?: number;
  asymmetry_level?: string;
  left_arch_score?: number;
  right_arch_score?: number;
  thickness_uniformity?: string;
  calculation_source?: 'typescript' | 'ai'; // NEW: Track calculation method
}

export interface EyesMetrics extends BaseMetrics {
  symmetry_score?: number;
  asymmetry_level?: string;
  left_eye_score?: number;
  right_eye_score?: number;
  eye_spacing?: string;
  eyelid_condition?: string;
  calculation_source?: 'typescript' | 'ai'; // NEW: Track calculation method
}

export interface NoseMetrics extends BaseMetrics {
  symmetry_score?: number;
  asymmetry_level?: string;
  deviation_angle?: number;
  bridge_straightness?: string;
  tip_position?: string;
  nostril_symmetry?: string;
  calculation_source?: 'typescript' | 'ai'; // NEW: Track calculation method
}

export interface LipsMetrics extends BaseMetrics {
  symmetry_score?: number;
  asymmetry_level?: string;
  upper_lip_score?: number;
  lower_lip_score?: number;
  lip_ratio?: number;
  cupid_bow_definition?: string;
  calculation_source?: 'typescript' | 'ai'; // NEW: Track calculation method
}

export interface JawlineMetrics extends BaseMetrics {
  symmetry_score?: number;
  asymmetry_level?: string;
  left_jaw_score?: number;
  right_jaw_score?: number;
  chin_alignment?: string;
  jaw_definition?: string;
  calculation_source?: 'typescript' | 'ai'; // NEW: Track calculation method
}

export interface FaceShapeMetrics extends BaseMetrics {
  face_shape?: string;
  confidence_score?: number;
  symmetry_score?: number;
  proportion_score?: number;
  facial_thirds_balance?: string;
  calculation_source?: 'typescript' | 'ai'; // NEW: Track calculation method
}

// Union type for all metrics
export type RegionMetrics =
  | EyebrowsMetrics
  | EyesMetrics
  | NoseMetrics
  | LipsMetrics
  | JawlineMetrics
  | FaceShapeMetrics;

// Main extractor function - routes to region-specific extractor
export function extractMetrics(regionId: RegionId, rawResponse: Record<string, any>): RegionMetrics {
  switch (regionId) {
    case 'eyebrows':
      return extractEyebrowsMetrics(rawResponse);
    case 'eyes':
      return extractEyesMetrics(rawResponse);
    case 'nose':
      return extractNoseMetrics(rawResponse);
    case 'lips':
      return extractLipsMetrics(rawResponse);
    case 'jawline':
      return extractJawlineMetrics(rawResponse);
    case 'face_shape':
      return extractFaceShapeMetrics(rawResponse);
    default:
      // Fallback: extract only base metrics
      return extractBaseMetrics(rawResponse);
  }
}

// Extract base metrics from any response
export function extractBaseMetrics(rawResponse: Record<string, any>): BaseMetrics {
  const analysisResult = rawResponse.analysis_result || {};

  return {
    overall_score: analysisResult.overall_score ?? rawResponse.overall_score ?? 0,
    general_assessment: analysisResult.general_assessment ?? rawResponse.general_assessment,
  };
}

// Helper: Safely get nested value
export function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper: Parse asymmetry level from various formats
export function parseAsymmetryLevel(value: any): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (typeof value === 'number') {
    if (value <= 2) return 'NONE';
    if (value <= 4) return 'MILD';
    if (value <= 6) return 'MODERATE';
    return 'SEVERE';
  }
  return 'UNKNOWN';
}

// Helper: Normalize score to 0-10 range
export function normalizeScore(value: any, max: number = 10): number {
  if (typeof value !== 'number') return 0;
  if (max === 10) return Math.round(Math.max(0, Math.min(10, value)));
  return Math.round((value / max) * 10);
}
