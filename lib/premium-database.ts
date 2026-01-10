import { supabase } from './supabase';
import type { FreeAnalysisState } from '@/types/premium';

/**
 * Check if user has premium status in database
 * Extracted from PremiumContext.tsx lines 65-69
 */
export async function checkDatabasePremiumStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.is_premium ?? false;
  } catch (error) {
    console.error('Error checking database premium status:', error);
    return false;
  }
}

/**
 * Load free analysis status from database
 * Extracted from PremiumContext.tsx lines 152-167
 */
export async function getFreeAnalysisStatus(userId: string): Promise<FreeAnalysisState> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('free_analysis_used, free_analysis_region')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return {
      used: data?.free_analysis_used ?? false,
      region: data?.free_analysis_region ?? null,
    };
  } catch (error) {
    console.error('Error loading free analysis status:', error);
    return { used: false, region: null };
  }
}

/**
 * Mark free analysis as used in database
 * Extracted from PremiumContext.tsx lines 170-190
 */
export async function updateFreeAnalysisStatus(
  userId: string,
  region: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      free_analysis_used: true,
      free_analysis_region: region,
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update free analysis status: ${error.message}`);
  }
}
