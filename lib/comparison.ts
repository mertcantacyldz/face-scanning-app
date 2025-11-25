// Progress Comparison System
// Compares analysis results and generates encouragement messages

import type { RegionId } from './exercises';
import type { RegionMetrics } from './metrics';

export interface ComparisonResult {
  hasImproved: boolean;
  scoreChange: number; // positive = improved, negative = declined
  percentageChange: number;
  isFirstAnalysis: boolean;
  message: string;
  messageTr: string; // Turkish message
  emoji: string;
}

export interface AnalysisRecord {
  id: string;
  overall_score: number;
  metrics: RegionMetrics;
  created_at: string;
}

// Compare two analysis records
export function compareAnalysis(
  current: AnalysisRecord,
  previous: AnalysisRecord | null,
  hasCompletedExercises: boolean
): ComparisonResult {
  // First analysis - no comparison, be honest
  if (!previous) {
    return {
      hasImproved: false,
      scoreChange: 0,
      percentageChange: 0,
      isFirstAnalysis: true,
      message: 'This is your first analysis. Complete exercises to see improvement!',
      messageTr: 'Bu ilk analiziniz. Gelişimi görmek için egzersizleri tamamlayın!',
      emoji: '🎯',
    };
  }

  const scoreChange = current.overall_score - previous.overall_score;
  const percentageChange = previous.overall_score > 0
    ? Math.round((scoreChange / previous.overall_score) * 100)
    : 0;
  const hasImproved = scoreChange > 0;

  // User completed exercises - show encouraging messages
  if (hasCompletedExercises) {
    return getEncouragingResult(scoreChange, percentageChange, hasImproved);
  }

  // User didn't complete exercises - be more neutral
  return getNeutralResult(scoreChange, percentageChange, hasImproved);
}

// Encouraging messages (after exercises)
function getEncouragingResult(
  scoreChange: number,
  percentageChange: number,
  hasImproved: boolean
): ComparisonResult {
  if (hasImproved) {
    if (scoreChange >= 2) {
      return {
        hasImproved: true,
        scoreChange,
        percentageChange,
        isFirstAnalysis: false,
        message: `Amazing progress! Your score improved by ${scoreChange} points!`,
        messageTr: `Harika ilerleme! Skorunuz ${scoreChange} puan arttı!`,
        emoji: '🚀',
      };
    }
    return {
      hasImproved: true,
      scoreChange,
      percentageChange,
      isFirstAnalysis: false,
      message: `Great job! You're improving. Keep up with your exercises!`,
      messageTr: `Harika iş! Gelişiyorsunuz. Egzersizlere devam edin!`,
      emoji: '💪',
    };
  }

  if (scoreChange === 0) {
    return {
      hasImproved: false,
      scoreChange: 0,
      percentageChange: 0,
      isFirstAnalysis: false,
      message: `Your score is stable. Consistency is key - keep going!`,
      messageTr: `Skorunuz stabil. Tutarlılık önemli - devam edin!`,
      emoji: '⭐',
    };
  }

  // Score decreased but user did exercises - still encourage
  return {
    hasImproved: false,
    scoreChange,
    percentageChange,
    isFirstAnalysis: false,
    message: `Small setback, but you're on the right track. Keep practicing!`,
    messageTr: `Küçük bir geri adım, ama doğru yoldasınız. Pratik yapmaya devam edin!`,
    emoji: '💫',
  };
}

// Neutral messages (no exercises completed)
function getNeutralResult(
  scoreChange: number,
  percentageChange: number,
  hasImproved: boolean
): ComparisonResult {
  if (hasImproved) {
    return {
      hasImproved: true,
      scoreChange,
      percentageChange,
      isFirstAnalysis: false,
      message: `Your score improved by ${scoreChange} points.`,
      messageTr: `Skorunuz ${scoreChange} puan arttı.`,
      emoji: '📈',
    };
  }

  if (scoreChange === 0) {
    return {
      hasImproved: false,
      scoreChange: 0,
      percentageChange: 0,
      isFirstAnalysis: false,
      message: `No change in score. Try the recommended exercises.`,
      messageTr: `Skorda değişiklik yok. Önerilen egzersizleri deneyin.`,
      emoji: '➡️',
    };
  }

  return {
    hasImproved: false,
    scoreChange,
    percentageChange,
    isFirstAnalysis: false,
    message: `Score decreased by ${Math.abs(scoreChange)} points. Exercises can help!`,
    messageTr: `Skor ${Math.abs(scoreChange)} puan düştü. Egzersizler yardımcı olabilir!`,
    emoji: '📉',
  };
}

// Region-specific comparison for detailed metrics
export function compareRegionMetrics(
  regionId: RegionId,
  current: RegionMetrics,
  previous: RegionMetrics | null
): Record<string, { improved: boolean; change: number }> {
  if (!previous) {
    return {};
  }

  const changes: Record<string, { improved: boolean; change: number }> = {};

  // Compare common metrics
  if ('symmetry_score' in current && 'symmetry_score' in previous) {
    const currentVal = (current as any).symmetry_score ?? 0;
    const previousVal = (previous as any).symmetry_score ?? 0;
    changes.symmetry_score = {
      improved: currentVal > previousVal,
      change: currentVal - previousVal,
    };
  }

  // Region-specific comparisons
  switch (regionId) {
    case 'eyebrows':
      compareMetricField(current, previous, 'left_arch_score', changes);
      compareMetricField(current, previous, 'right_arch_score', changes);
      break;
    case 'eyes':
      compareMetricField(current, previous, 'left_eye_score', changes);
      compareMetricField(current, previous, 'right_eye_score', changes);
      break;
    case 'nose':
      compareMetricField(current, previous, 'deviation_angle', changes, true); // lower is better
      break;
    case 'lips':
      compareMetricField(current, previous, 'upper_lip_score', changes);
      compareMetricField(current, previous, 'lower_lip_score', changes);
      break;
    case 'jawline':
      compareMetricField(current, previous, 'left_jaw_score', changes);
      compareMetricField(current, previous, 'right_jaw_score', changes);
      break;
    case 'face_shape':
      compareMetricField(current, previous, 'proportion_score', changes);
      compareMetricField(current, previous, 'confidence_score', changes);
      break;
  }

  return changes;
}

// Helper: Compare a single metric field
function compareMetricField(
  current: Record<string, any>,
  previous: Record<string, any>,
  field: string,
  changes: Record<string, { improved: boolean; change: number }>,
  lowerIsBetter: boolean = false
) {
  const currentVal = current[field];
  const previousVal = previous[field];

  if (typeof currentVal === 'number' && typeof previousVal === 'number') {
    const change = currentVal - previousVal;
    changes[field] = {
      improved: lowerIsBetter ? change < 0 : change > 0,
      change,
    };
  }
}

// Calculate overall progress percentage across all regions
export function calculateOverallProgress(
  analyses: { regionId: RegionId; records: AnalysisRecord[] }[]
): number {
  if (analyses.length === 0) return 0;

  let totalImprovement = 0;
  let regionsWithHistory = 0;

  for (const { records } of analyses) {
    if (records.length >= 2) {
      const latest = records[0];
      const oldest = records[records.length - 1];
      const improvement = latest.overall_score - oldest.overall_score;
      totalImprovement += improvement;
      regionsWithHistory++;
    }
  }

  if (regionsWithHistory === 0) return 0;

  // Average improvement, scaled to percentage
  const avgImprovement = totalImprovement / regionsWithHistory;
  return Math.round((avgImprovement / 10) * 100); // 10 is max score
}

// Get motivational message based on streak
export function getStreakMessage(daysActive: number): { message: string; messageTr: string; emoji: string } {
  if (daysActive >= 30) {
    return {
      message: `${daysActive} days streak! You're a face fitness champion!`,
      messageTr: `${daysActive} gün seri! Yüz fitness şampiyonusunuz!`,
      emoji: '🏆',
    };
  }
  if (daysActive >= 14) {
    return {
      message: `${daysActive} days streak! Incredible dedication!`,
      messageTr: `${daysActive} gün seri! İnanılmaz kararlılık!`,
      emoji: '🔥',
    };
  }
  if (daysActive >= 7) {
    return {
      message: `${daysActive} days streak! One week strong!`,
      messageTr: `${daysActive} gün seri! Bir hafta güçlü!`,
      emoji: '💪',
    };
  }
  if (daysActive >= 3) {
    return {
      message: `${daysActive} days streak! Building momentum!`,
      messageTr: `${daysActive} gün seri! İvme kazanıyorsunuz!`,
      emoji: '⚡',
    };
  }
  return {
    message: `Day ${daysActive}! Every day counts!`,
    messageTr: `${daysActive}. gün! Her gün önemli!`,
    emoji: '🌟',
  };
}
