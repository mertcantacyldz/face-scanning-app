/**
 * Premium Access Control
 * Handles premium/free user access logic for region analysis
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface PremiumAccessState {
  isPremium: boolean;
  freeAnalysisRegion: string | null;
  remainingRights: number;
}

export type AccessAction =
  | 'proceed'           // Can proceed with analysis
  | 'show_premium_modal' // Show premium upgrade modal
  | 'show_spin_wheel'    // Show spin wheel to select region
  | 'increment_count';   // Increment free analysis count and proceed

export interface AccessCheckResult {
  canAccess: boolean;
  action: AccessAction;
  reason?: string;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Check if user can access a specific region analysis
 * Returns action to take based on premium/free status
 *
 * @param regionId - The region user wants to analyze
 * @param premiumState - Current premium state from context
 * @param bypassCheck - Whether to bypass normal checks (e.g., from spin wheel)
 * @returns Access check result with action to take
 */
export function checkRegionAccess(
  regionId: string,
  premiumState: PremiumAccessState,
  bypassCheck = false
): AccessCheckResult {
  const { isPremium, freeAnalysisRegion, remainingRights } = premiumState;

  // Premium users always have access
  if (isPremium) {
    return {
      canAccess: true,
      action: 'proceed',
      reason: 'Premium user - full access',
    };
  }

  // Handle bypass mode (from spin wheel completion)
  if (bypassCheck) {
    if (remainingRights <= 0) {
      // Failsafe: Should not happen if bypassed correctly
      return {
        canAccess: false,
        action: 'show_premium_modal',
        reason: 'No remaining rights even with bypass',
      };
    }

    // Bypassing normal checks - increment count and proceed
    return {
      canAccess: true,
      action: 'increment_count',
      reason: 'Bypass mode - using free right',
    };
  }

  // Normal flow for free users

  // Case 1: User already has a won region
  if (freeAnalysisRegion) {
    // Correct region and rights available
    if (regionId === freeAnalysisRegion && remainingRights > 0) {
      return {
        canAccess: true,
        action: 'increment_count',
        reason: 'Matching free region with available rights',
      };
    }

    // Wrong region or no rights left
    return {
      canAccess: false,
      action: 'show_premium_modal',
      reason: freeAnalysisRegion === regionId
        ? 'No remaining rights'
        : `Region locked - free region is ${freeAnalysisRegion}`,
    };
  }

  // Case 2: No region selected yet, but rights available
  if (remainingRights > 0) {
    return {
      canAccess: false,
      action: 'show_spin_wheel',
      reason: 'Must spin wheel to select free region',
    };
  }

  // Case 3: No rights left at all
  return {
    canAccess: false,
    action: 'show_premium_modal',
    reason: 'No remaining free analysis rights',
  };
}

/**
 * Determine if a region is unlocked for the user
 * Simplified check for UI display purposes
 *
 * @param regionId - The region to check
 * @param premiumState - Current premium state
 * @returns true if region is accessible
 */
export function isRegionUnlocked(
  regionId: string,
  premiumState: PremiumAccessState
): boolean {
  const { isPremium, freeAnalysisRegion, remainingRights } = premiumState;

  // Premium: always unlocked
  if (isPremium) {
    return true;
  }

  // Free user: only unlocked if matches won region and has rights
  const isWonRegion = freeAnalysisRegion === regionId;
  const hasRights = remainingRights > 0;

  return isWonRegion && hasRights;
}

/**
 * Get display status for a region button
 * Returns info for UI styling
 *
 * @param regionId - The region to check
 * @param premiumState - Current premium state
 * @returns Object with display state info
 */
export function getRegionDisplayStatus(
  regionId: string,
  premiumState: PremiumAccessState
): {
  isUnlocked: boolean;
  isLocked: boolean;
  showFreeBadge: boolean;
} {
  const { isPremium, freeAnalysisRegion, remainingRights } = premiumState;

  const isWonRegion = freeAnalysisRegion === regionId;
  const hasRights = remainingRights > 0;
  const isUnlocked = isPremium || (isWonRegion && hasRights);

  return {
    isUnlocked,
    isLocked: !isUnlocked,
    // Show "Free" badge if unlocked but user is not premium
    showFreeBadge: isUnlocked && !isPremium,
  };
}
