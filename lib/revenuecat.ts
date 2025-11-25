// RevenueCat Configuration
// Handles premium subscription management

import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

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

// Initialize RevenueCat
export async function initializeRevenueCat(userId?: string): Promise<void> {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

  if (!apiKey) {
    console.warn('RevenueCat API key not configured');
    return;
  }

  try {
    // Set log level for debugging (remove in production)
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat
    await Purchases.configure({ apiKey });

    // If user is logged in, identify them
    if (userId) {
      await Purchases.logIn(userId);
    }

    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
}

// Login user to RevenueCat (call when user logs in)
export async function loginRevenueCat(userId: string): Promise<CustomerInfo | null> {
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
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('RevenueCat logout error:', error);
  }
}

// Check if user has premium access
export async function checkPremiumStatus(): Promise<boolean> {
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
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Error getting customer info:', error);
    return null;
  }
}

// Get available offerings (subscription packages)
export async function getOfferings(): Promise<PurchasesOffering | null> {
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
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

    return {
      success: true,
      isPremium,
    };
  } catch (error: any) {
    console.error('Restore error:', error);
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
