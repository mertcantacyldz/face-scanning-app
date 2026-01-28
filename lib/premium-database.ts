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
/**
 * Load free analysis status from database
 * Checks BOTH profiles (user-level) AND device_users (device-level)
 * Returns the MAXIMUM count from either source
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
      .select('free_analysis_count, free_analysis_region')
      .eq('user_id', userId)
      .single();

    // Check device_users (device-level) if deviceId provided
    const devicePromise = deviceId
      ? supabase
        .from('device_users')
        .select('free_analysis_count, free_analysis_region')
        .eq('device_id', deviceId)
        .single()
      : Promise.resolve({ data: null, error: null });

    const [profileResult, deviceResult] = await Promise.all([profilePromise, devicePromise]);

    // Get value from both sources
    const profileCount = profileResult.data?.free_analysis_count ?? 0;
    const deviceCount = deviceResult.data?.free_analysis_count ?? 0;

    // Get region from both sources
    const profileRegion = profileResult.data?.free_analysis_region ?? null;
    const deviceRegion = deviceResult.data?.free_analysis_region ?? null;

    // Use whichever region is set (prefer profile)
    const region = profileRegion || deviceRegion;

    // Use whichever count is higher (max usage)
    const count = Math.max(profileCount, deviceCount);

    console.log('📊 Free analysis status check:', {
      profile: { count: profileCount },
      device: { count: deviceCount },
      combined: { count }
    });

    return { count, region };
  } catch (error) {
    console.error('Error loading free analysis status:', error);
    return { count: 3, region: null }; // Fail safe: assume limit reached if error
  }
}

/**
 * Set the free analysis region and reset count
 * Called when user wins a region on spin wheel
 */
export async function setFreeAnalysisRegion(
  userId: string,
  regionId: string,
  deviceId?: string
): Promise<void> {
  try {
    // 1. Update Profile (User Level)
    const profileUpdate = supabase
      .from('profiles')
      .update({
        free_analysis_region: regionId,
        free_analysis_count: 0
      })
      .eq('user_id', userId);

    // 2. Update Device (Device Level)
    const deviceUpdate = deviceId
      ? supabase
        .from('device_users')
        .upsert({
          device_id: deviceId,
          free_analysis_region: regionId,
          free_analysis_count: 0
        }, { onConflict: 'device_id' })
      : Promise.resolve();

    await Promise.all([profileUpdate, deviceUpdate]);
    console.log('✅ Set free analysis region:', regionId);
  } catch (error) {
    console.error('Error setting free analysis region:', error);
    throw error;
  }
}

/**
 * Increment free analysis count in database
 * Updates BOTH profiles (user-level) AND device_users (device-level)
 * Now also takes regionId for logging/validation purposes if needed
 *
 * @param userId - Supabase user ID
 * @param regionId - The region being analyzed (optional for now, mainly for tracking)
 * @param deviceId - Optional device ID for device-level tracking
 */
export async function incrementFreeAnalysisCount(
  userId: string,
  regionId: string,
  deviceId?: string
): Promise<void> {
  // Get current status to know what to increment to
  const { count } = await getFreeAnalysisStatus(userId, deviceId);
  const newCount = count + 1;

  // Update profiles (user-level)
  const profilePromise = supabase
    .from('profiles')
    .update({
      free_analysis_count: newCount,
    })
    .eq('user_id', userId);

  // Update device_users (device-level) if deviceId provided
  const devicePromise = deviceId
    ? supabase
      .from('device_users')
      .update({
        free_analysis_count: newCount,
      })
      .eq('device_id', deviceId)
    : Promise.resolve({ error: null });

  const [profileResult, deviceResult] = await Promise.all([profilePromise, devicePromise]);

  if (profileResult.error) {
    console.error('Failed to update profile free analysis count:', profileResult.error);
    throw new Error(`Failed to update free analysis count: ${profileResult.error.message}`);
  }

  if (deviceResult.error) {
    // Log but don't throw - device update is secondary
    console.warn('Failed to update device free analysis count:', deviceResult.error);
  }

  console.log('✅ Free analysis count incremented:', { userId, deviceId, newCount });
}
