// Exercise Tracking - Database Operations and Business Logic
// Handles all exercise completion tracking with day-based records

import { supabase } from './supabase';
import { format, getDaysInMonth, parse, startOfMonth, endOfMonth } from 'date-fns';
import type { RegionId } from './exercises';

// ============ TYPES ============

export interface ExerciseCompletion {
  id: string;
  user_id: string;
  exercise_id: string;
  region_id: string;
  completion_date: string; // 'YYYY-MM-DD'
  month_year: string; // 'YYYY-MM'
  created_at: string;
}

export interface MonthlyStats {
  exerciseId: string;
  daysCompleted: number; // 0-31
  completionPercentage: number; // 0-100
  completedDates: number[]; // [3, 4, 7, 15, ...] - day numbers (1-31)
  totalDaysInMonth: number; // 28-31
}

export interface RegionMonthlyStats {
  regionId: string;
  averageCompletionPercentage: number; // Average of all exercises in region
  exerciseStats: MonthlyStats[];
}

// ============ HELPER FUNCTIONS ============

/**
 * Get current date in user's local timezone as 'YYYY-MM-DD' string
 * CRITICAL: Always use this for date comparisons to avoid timezone issues
 */
function getLocalDateString(date: Date = new Date()): string {
  // Format: 'YYYY-MM-DD' in local timezone
  return date.toLocaleDateString('en-CA');
}

/**
 * Get month-year string for grouping (e.g., '2026-01')
 */
function getMonthYearString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM');
}

/**
 * Get total days in a specific month-year
 */
function getDaysInMonthYear(monthYear: string): number {
  const date = parse(monthYear, 'yyyy-MM', new Date());
  return getDaysInMonth(date);
}

/**
 * Extract day number from date string 'YYYY-MM-DD' -> 15
 */
function getDayFromDateString(dateString: string): number {
  const parts = dateString.split('-');
  return parseInt(parts[2], 10);
}

// ============ CORE FUNCTIONS ============

/**
 * Toggle exercise completion for today
 * If completed today -> delete (un-complete)
 * If not completed today -> insert (complete)
 *
 * @returns true if exercise is now completed, false if un-completed
 */
export async function toggleExerciseCompletion(
  exerciseId: string,
  regionId: string
): Promise<boolean> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const today = getLocalDateString();
    const monthYear = getMonthYearString();

    // Check if already completed today
    const { data: existing, error: checkError } = await supabase
      .from('exercise_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('exercise_id', exerciseId)
      .eq('completion_date', today)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Already completed -> delete (un-complete)
      const { error: deleteError } = await supabase
        .from('exercise_completions')
        .delete()
        .eq('id', existing.id);

      if (deleteError) throw deleteError;
      return false; // Now not completed
    } else {
      // Not completed -> insert (complete)
      const { error: insertError } = await supabase
        .from('exercise_completions')
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          region_id: regionId,
          completion_date: today,
          month_year: monthYear,
        });

      if (insertError) throw insertError;
      return true; // Now completed
    }
  } catch (error) {
    console.error('Error toggling exercise completion:', error);
    throw error;
  }
}

/**
 * Check if a specific exercise is completed today
 */
export async function isExerciseCompletedToday(exerciseId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const today = getLocalDateString();

    const { data, error } = await supabase
      .from('exercise_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('exercise_id', exerciseId)
      .eq('completion_date', today)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking exercise completion:', error);
    return false;
  }
}

/**
 * Get monthly completion statistics for a single exercise
 */
export async function getMonthlyCompletions(
  exerciseId: string,
  monthYear: string
): Promise<MonthlyStats> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Fetch all completions for this exercise in this month
    const { data, error } = await supabase
      .from('exercise_completions')
      .select('completion_date')
      .eq('user_id', user.id)
      .eq('exercise_id', exerciseId)
      .eq('month_year', monthYear)
      .order('completion_date', { ascending: true });

    if (error) throw error;

    const completions = data || [];
    const completedDates = completions.map(c => getDayFromDateString(c.completion_date));
    const daysCompleted = completedDates.length;
    const totalDaysInMonth = getDaysInMonthYear(monthYear);
    const completionPercentage = totalDaysInMonth > 0
      ? Math.round((daysCompleted / totalDaysInMonth) * 100)
      : 0;

    return {
      exerciseId,
      daysCompleted,
      completionPercentage,
      completedDates,
      totalDaysInMonth,
    };
  } catch (error) {
    console.error('Error fetching monthly completions:', error);
    // Return empty stats on error
    return {
      exerciseId,
      daysCompleted: 0,
      completionPercentage: 0,
      completedDates: [],
      totalDaysInMonth: getDaysInMonthYear(monthYear),
    };
  }
}

/**
 * Get monthly statistics for all exercises in a region
 */
export async function getRegionMonthlyStats(
  regionId: RegionId,
  monthYear: string,
  exerciseIds: string[]
): Promise<RegionMonthlyStats> {
  try {
    // Fetch stats for all exercises in parallel
    const statsPromises = exerciseIds.map(exId => getMonthlyCompletions(exId, monthYear));
    const exerciseStats = await Promise.all(statsPromises);

    // Calculate average completion percentage across all exercises
    const totalPercentage = exerciseStats.reduce((sum, stat) => sum + stat.completionPercentage, 0);
    const averageCompletionPercentage = exerciseStats.length > 0
      ? Math.round(totalPercentage / exerciseStats.length)
      : 0;

    return {
      regionId,
      averageCompletionPercentage,
      exerciseStats,
    };
  } catch (error) {
    console.error('Error fetching region monthly stats:', error);
    return {
      regionId,
      averageCompletionPercentage: 0,
      exerciseStats: [],
    };
  }
}

/**
 * Get current month statistics for an exercise
 */
export async function getCurrentMonthStats(exerciseId: string): Promise<MonthlyStats> {
  const currentMonthYear = getMonthYearString();
  return getMonthlyCompletions(exerciseId, currentMonthYear);
}

/**
 * Get all months where user has exercise completion data
 * Returns array of month-year strings in descending order (newest first)
 * Example: ['2026-01', '2025-12', '2025-11']
 */
export async function getAvailableMonths(): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('exercise_completions')
      .select('month_year')
      .eq('user_id', user.id)
      .order('month_year', { ascending: false });

    if (error) throw error;

    // Get unique month_year values
    const uniqueMonths = [...new Set((data || []).map(d => d.month_year))];

    // Always include current month even if no data yet
    const currentMonth = getMonthYearString();
    if (!uniqueMonths.includes(currentMonth)) {
      uniqueMonths.unshift(currentMonth);
    }

    return uniqueMonths;
  } catch (error) {
    console.error('Error fetching available months:', error);
    // Return at least current month on error
    return [getMonthYearString()];
  }
}

/**
 * Get exercises completed today for a specific region
 * Returns Set of exercise IDs
 */
export async function getTodayCompletedExercises(regionId?: string): Promise<Set<string>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Set();

    const today = getLocalDateString();

    let query = supabase
      .from('exercise_completions')
      .select('exercise_id')
      .eq('user_id', user.id)
      .eq('completion_date', today);

    if (regionId) {
      query = query.eq('region_id', regionId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return new Set((data || []).map(d => d.exercise_id));
  } catch (error) {
    console.error('Error fetching today completed exercises:', error);
    return new Set();
  }
}

/**
 * Get completion streak for an exercise (consecutive days)
 * Returns number of consecutive days completed up to today
 */
export async function getExerciseStreak(exerciseId: string): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Fetch last 90 days of completions
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDate = getLocalDateString(ninetyDaysAgo);
    const today = getLocalDateString();

    const { data, error } = await supabase
      .from('exercise_completions')
      .select('completion_date')
      .eq('user_id', user.id)
      .eq('exercise_id', exerciseId)
      .gte('completion_date', startDate)
      .lte('completion_date', today)
      .order('completion_date', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    // Calculate streak (consecutive days working backwards from today)
    let streak = 0;
    let currentDate = new Date();

    for (const completion of data) {
      const completionDate = getLocalDateString(currentDate);

      if (completion.completion_date === completionDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
      } else {
        // Gap found, break streak
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

/**
 * Delete all completion records for a specific exercise
 * (Admin/testing function - use with caution)
 */
export async function deleteAllCompletions(exerciseId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('exercise_completions')
      .delete()
      .eq('user_id', user.id)
      .eq('exercise_id', exerciseId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting completions:', error);
    throw error;
  }
}

// ============ UTILITY EXPORTS ============

export {
  getLocalDateString,
  getMonthYearString,
  getDaysInMonthYear,
  getDayFromDateString,
};
