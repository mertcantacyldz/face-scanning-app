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
 * Checks BOTH profiles (user-level) AND device_users (device-level)
 * Returns used=true if EITHER source indicates the free analysis was used
 *
 * This prevents users from getting multiple free analyses by:
 * - Creating new accounts (device_users persists)
 * - Session expiring and new user being created (device_users persists)
 *
 * @param userId - Supabase user ID
 * @param deviceId - Optional device ID for additional check
 */
export async function getFreeAnalysisStatus(
  userId: string,
  deviceId?: string
): Promise<FreeAnalysisState> {
  try {
    // Check profiles (user-level)
    const profilePromise = supabase
      .from('profiles')
      .select('free_analysis_used, free_analysis_region')
      .eq('user_id', userId)
      .single();

    // Check device_users (device-level) if deviceId provided
    const devicePromise = deviceId
      ? supabase
          .from('device_users')
          .select('free_analysis_used, free_analysis_region')
          .eq('device_id', deviceId)
          .single()
      : Promise.resolve({ data: null, error: null });

    const [profileResult, deviceResult] = await Promise.all([profilePromise, devicePromise]);

    // Get values from both sources
    const profileUsed = profileResult.data?.free_analysis_used ?? false;
    const profileRegion = profileResult.data?.free_analysis_region ?? null;

    const deviceUsed = deviceResult.data?.free_analysis_used ?? false;
    const deviceRegion = deviceResult.data?.free_analysis_region ?? null;

    // Free analysis is used if EITHER source says so
    const used = profileUsed || deviceUsed;
    // Use whichever region is set (prefer profile, fallback to device)
    const region = profileRegion || deviceRegion;

    console.log('📊 Free analysis status check:', {
      profile: { used: profileUsed, region: profileRegion },
      device: { used: deviceUsed, region: deviceRegion },
      combined: { used, region }
    });

    return { used, region };
  } catch (error) {
    console.error('Error loading free analysis status:', error);
    return { used: false, region: null };
  }
}

/**
 * Mark free analysis as used in database
 * Updates BOTH profiles (user-level) AND device_users (device-level)
 *
 * This ensures free analysis status persists even when:
 * - Session expires and new user is created (device_users persists)
 * - User switches accounts on same device (device_users persists)
 *
 * @param userId - Supabase user ID
 * @param region - The region that was analyzed
 * @param deviceId - Optional device ID for device-level tracking
 */
export async function updateFreeAnalysisStatus(
  userId: string,
  region: string,
  deviceId?: string
): Promise<void> {
  // Update profiles (user-level)
  const profilePromise = supabase
    .from('profiles')
    .update({
      free_analysis_used: true,
      free_analysis_region: region,
    })
    .eq('user_id', userId);

  // Update device_users (device-level) if deviceId provided
  const devicePromise = deviceId
    ? supabase
        .from('device_users')
        .update({
          free_analysis_used: true,
          free_analysis_region: region,
        })
        .eq('device_id', deviceId)
    : Promise.resolve({ error: null });

  const [profileResult, deviceResult] = await Promise.all([profilePromise, devicePromise]);

  if (profileResult.error) {
    console.error('Failed to update profile free analysis status:', profileResult.error);
    throw new Error(`Failed to update free analysis status: ${profileResult.error.message}`);
  }

  if (deviceResult.error) {
    // Log but don't throw - device update is secondary
    console.warn('Failed to update device free analysis status:', deviceResult.error);
  }

  console.log('✅ Free analysis status updated:', { userId, deviceId, region });
}
