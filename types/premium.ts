import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

export type PremiumSource = 'revenuecat' | 'database' | 'both' | 'none';

export interface FreeAnalysisState {
  count: number;
  region: string | null;
}

export interface PremiumContextValue {
  // Premium status (combined from both sources)
  isPremium: boolean;
  isLoading: boolean;

  // Individual premium sources (for debugging)
  isRevenueCatPremium: boolean;
  isDatabasePremium: boolean;

  // Free tier status
  freeAnalysisCount: number;
  freeAnalysisRegion: string | null;
  remainingRights: number;

  // Offerings
  offerings: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  yearlyPackage: PurchasesPackage | null;

  // Actions
  refreshPremiumStatus: () => Promise<boolean>;
  purchase: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<{ success: boolean; isPremium: boolean; error?: string }>;
  incrementFreeAnalysisCount: (regionId: string) => Promise<void>;
  setFreeAnalysisRegion: (regionId: string) => Promise<void>;
}
