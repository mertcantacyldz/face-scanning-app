// RevenueCat Configuration
// Handles premium subscription management

import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

// RevenueCat API Keys (from RevenueCat Dashboard)
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Entitlement identifier (set in RevenueCat Dashboard)
export const PREMIUM_ENTITLEMENT = 'premium';

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'faceapp_premium_monthly', // $7.99/month
  YEARLY: 'faceapp_premium_yearly', // $45.99/year
};

// Flag to prevent multiple initializations
let isRevenueCatInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize RevenueCat (singleton pattern to prevent multiple configurations)
 *
 * IMPORTANT: We use deviceId instead of userId for RevenueCat login.
 * This ensures premium purchases persist even when Supabase session expires
 * and a new anonymous user is created.
 *
 * Device ID is stable across app restarts (stored in iOS Keychain).
 * User can still restore purchases on new device via App Store account.
 *
 * @param deviceId - The stable device identifier (from device-id-with-fallback.ts)
 */
export async function initializeRevenueCat(deviceId?: string): Promise<void> {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

  if (!apiKey) {
    console.warn('RevenueCat API key not configured');
    return;
  }

  // If already initialized, just login with device ID if provided
  if (isRevenueCatInitialized) {
    console.log('RevenueCat already initialized, skipping configure...');
    if (deviceId) {
      try {
        await Purchases.logIn(deviceId);
        console.log('RevenueCat: Logged in with device ID:', deviceId);
      } catch (error) {
        console.error('RevenueCat login error:', error);
      }
    }
    return;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    console.log('RevenueCat initialization in progress, waiting...');
    await initializationPromise;
    if (deviceId) {
      try {
        await Purchases.logIn(deviceId);
      } catch (error) {
        console.error('RevenueCat login error:', error);
      }
    }
    return;
  }

  // Start initialization
  initializationPromise = new Promise(async (resolve) => {
    try {
      // Set log level for debugging (remove in production)
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure RevenueCat
      console.log('🔧 Configuring RevenueCat with API key...');
      await Purchases.configure({ apiKey });
      isRevenueCatInitialized = true;
      console.log('✅ RevenueCat configured successfully');

      // Identify with device ID (stable across sessions)
      if (deviceId) {
        try {
          await Purchases.logIn(deviceId);
          console.log('👤 RevenueCat: Logged in with device ID:', deviceId);
        } catch (loginError) {
          console.error('❌ RevenueCat login error during init:', loginError);
        }
      }
    } catch (error) {
      console.error('❌ Failed to configure RevenueCat:', error);
      // DO NOT reset initializationPromise to null here because we want to remember 
      // that we ALREADY TRIED AND FAILED, to prevent infinite re-tries that crash the app.
      isRevenueCatInitialized = false;
    } finally {
      resolve();
    }
  });

  await initializationPromise;
}

// Ensure RevenueCat is initialized before calling its methods
async function ensureConfigured(): Promise<boolean> {
  if (isRevenueCatInitialized) return true;

  // If initialization is currently in progress, wait for it
  if (initializationPromise) {
    try {
      await initializationPromise;
    } catch (e) {
      // ignore
    }
  }

  if (isRevenueCatInitialized) return true;

  console.warn('RevenueCat is not configured. Method call aborted.');
  return false;
}

// Login user to RevenueCat (call when user logs in)
export async function loginRevenueCat(userId: string): Promise<CustomerInfo | null> {
  if (!(await ensureConfigured())) return null;
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch (error) {
    console.error('RevenueCat login error:', error);
    return null;
  }
}

// Logout user from RevenueCat
export async function logoutRevenueCat(): Promise<void> {
  if (!(await ensureConfigured())) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('RevenueCat logout error:', error);
  }
}

// Check if user has premium access
export async function checkPremiumStatus(): Promise<boolean> {
  if (!(await ensureConfigured())) return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

// Get customer info
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!(await ensureConfigured())) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Error getting customer info:', error);
    return null;
  }
}

// Get available offerings (subscription packages)
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!(await ensureConfigured())) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error getting offerings:', error);
    return null;
  }
}

// Purchase a package
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  if (!(await ensureConfigured())) {
    return { success: false, error: 'RevenueCat is not configured' };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

    return {
      success: isPremium,
      customerInfo,
    };
  } catch (error: any) {
    // User cancelled
    if (error.userCancelled) {
      return { success: false, error: 'cancelled' };
    }

    console.error('Purchase error:', error);
    return {
      success: false,
      error: error.message || 'Purchase failed',
    };
  }
}

// Restore purchases
export async function restorePurchases(): Promise<{
  success: boolean;
  isPremium: boolean;
  error?: string;
}> {
  if (!(await ensureConfigured())) {
    return { success: false, isPremium: false, error: 'RevenueCat is not configured' };
  }
  try {
    console.log('🔄 Starting restore purchases...');

    // 1. Call RevenueCat restore
    const customerInfo = await Purchases.restorePurchases();
    const premiumEntitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
    const isPremium = premiumEntitlement !== undefined;

    console.log('📦 RevenueCat restore complete. Premium:', isPremium);

    // RevenueCat is the source of truth for premium status
    // Supabase is_premium field is only for manual override if needed

    if (isPremium) {
      console.log('✅ Active premium subscription found!');
    } else {
      console.log('❌ No active premium subscription found');
    }

    return {
      success: true,
      isPremium,
    };
  } catch (error: any) {
    console.error('❌ Restore error:', error);
    return {
      success: false,
      isPremium: false,
      error: error.message || 'Restore failed',
    };
  }
}

// Format price for display
export function formatPrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

// Get package type label
export function getPackageLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case 'MONTHLY':
      return 'Monthly';
    case 'ANNUAL':
      return 'Yearly';
    case 'WEEKLY':
      return 'Weekly';
    case 'LIFETIME':
      return 'Lifetime';
    default:
      return pkg.identifier;
  }
}

// Calculate savings percentage for yearly vs monthly
export function calculateSavings(
  monthlyPkg: PurchasesPackage | undefined,
  yearlyPkg: PurchasesPackage | undefined
): number {
  if (!monthlyPkg || !yearlyPkg) return 0;

  const monthlyPrice = monthlyPkg.product.price;
  const yearlyPrice = yearlyPkg.product.price;
  const yearlyMonthlyEquivalent = yearlyPrice / 12;

  const savings = ((monthlyPrice - yearlyMonthlyEquivalent) / monthlyPrice) * 100;
  return Math.round(savings);
}

// Check if RevenueCat is configured
export function isRevenueCatConfigured(): boolean {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  return !!apiKey;
}
