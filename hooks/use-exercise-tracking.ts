// React Hook for Exercise Tracking
// Provides easy-to-use interface for exercise completion management

import { useState, useEffect, useCallback } from 'react';
import {
  toggleExerciseCompletion,
  isExerciseCompletedToday,
  getMonthlyCompletions,
  getCurrentMonthStats,
  type MonthlyStats,
} from '@/lib/exercise-tracking';

interface UseExerciseTrackingOptions {
  exerciseId?: string;
  regionId?: string;
  monthYear?: string; // Optional: specify which month to load stats for
  autoLoad?: boolean; // Auto-load on mount (default: true)
}

export function useExerciseTracking(options: UseExerciseTrackingOptions = {}) {
  const { exerciseId, regionId, monthYear, autoLoad = true } = options;

  const [loading, setLoading] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load monthly stats for the exercise
   */
  const loadStats = useCallback(async () => {
    if (!exerciseId) return;

    setLoading(true);
    setError(null);

    try {
      // Load stats for specified month or current month
      const stats = monthYear
        ? await getMonthlyCompletions(exerciseId, monthYear)
        : await getCurrentMonthStats(exerciseId);

      setMonthlyStats(stats);

      // Check if completed today
      const completedToday = await isExerciseCompletedToday(exerciseId);
      setIsCompletedToday(completedToday);
    } catch (err) {
      console.error('Error loading exercise stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [exerciseId, monthYear]);

  /**
   * Toggle exercise completion for today
   */
  const toggleCompletion = useCallback(async () => {
    if (!exerciseId || !regionId) {
      throw new Error('Exercise ID and Region ID are required');
    }

    setLoading(true);
    setError(null);

    try {
      const nowCompleted = await toggleExerciseCompletion(exerciseId, regionId);
      setIsCompletedToday(nowCompleted);

      // Reload stats to update counts
      await loadStats();

      return nowCompleted;
    } catch (err) {
      console.error('Error toggling completion:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle completion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [exerciseId, regionId, loadStats]);

  /**
   * Refresh data manually
   */
  const refresh = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  // Auto-load on mount or when dependencies change
  useEffect(() => {
    if (autoLoad && exerciseId) {
      loadStats();
    }
  }, [autoLoad, exerciseId, monthYear, loadStats]);

  return {
    loading,
    monthlyStats,
    isCompletedToday,
    error,
    toggleCompletion,
    refresh,
    loadStats,
  };
}

/**
 * Simplified hook for just checking if exercise is completed today
 */
export function useIsCompletedToday(exerciseId?: string) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;

    setLoading(true);
    isExerciseCompletedToday(exerciseId)
      .then(setIsCompleted)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [exerciseId]);

  return { isCompleted, loading };
}
