import {
  checkPremiumStatus,
  getOfferings,
  initializeRevenueCat,
  loginRevenueCat,
  logoutRevenueCat,
  purchasePackage,
  restorePurchases
} from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

interface PremiumContextType {
  // Premium status
  isPremium: boolean;
  isLoading: boolean;

  // Free tier status
  freeAnalysisUsed: boolean;
  freeAnalysisRegion: string | null; // Which region was analyzed for free

  // Offerings
  offerings: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  yearlyPackage: PurchasesPackage | null;

  // Actions
  refreshPremiumStatus: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<{ success: boolean; isPremium: boolean; error?: string }>;
  markFreeAnalysisUsed: (regionId: string) => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
  children: ReactNode;
}

export function PremiumProvider({ children }: PremiumProviderProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [freeAnalysisUsed, setFreeAnalysisUsed] = useState(false);
  const [freeAnalysisRegion, setFreeAnalysisRegion] = useState<string | null>(null);

  // Get monthly and yearly packages from offerings
  // If offerings are not available (RevenueCat not configured), use mock data for testing
  const monthlyPackage = offerings?.availablePackages.find(p => p.packageType === 'MONTHLY') ??
    {
      identifier: 'faceapp_premium_monthly',
      packageType: 'MONTHLY',
      product: {
        identifier: 'faceapp_premium_monthly',
        description: 'Aylık Premium Üyelik',
        title: 'Premium Aylık',
        price: 7.99,
        priceString: '₺249.99',
        currencyCode: 'TRY',
      },
    } as any;

  const yearlyPackage = offerings?.availablePackages.find(p => p.packageType === 'ANNUAL') ??
    {
      identifier: 'faceapp_premium_yearly',
      packageType: 'ANNUAL',
      product: {
        identifier: 'faceapp_premium_yearly',
        description: 'Yıllık Premium Üyelik',
        title: 'Premium Yıllık',
        price: 45.99,
        priceString: '₺1,499.99',
        currencyCode: 'TRY',
      },
    } as any;

  // Initialize RevenueCat and check premium status
  const initialize = useCallback(async () => {
    setIsLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Initialize RevenueCat with user ID
        await initializeRevenueCat(user.id);
        await loginRevenueCat(user.id);

        // Check premium status
        const premium = await checkPremiumStatus();
        setIsPremium(premium);

        // Load offerings
        const currentOfferings = await getOfferings();
        setOfferings(currentOfferings);

        // Check if free analysis was used (from Supabase)
        await loadProfileStatus(user.id);
      } else {
        // No user, initialize without login
        await initializeRevenueCat();
        setIsPremium(false);
      }
    } catch (error) {
      console.error('Premium initialization error:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user profile status (Free usage + Admin Premium) from Supabase
  const loadProfileStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('free_analysis_used, free_analysis_region, is_premium')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setFreeAnalysisUsed(data.free_analysis_used ?? false);
        setFreeAnalysisRegion(data.free_analysis_region ?? null);
        return data.is_premium ?? false;
      }
    } catch (error) {
      console.error('Error loading profile status:', error);
    }
    return false;
  };

  // Mark free analysis as used
  const markFreeAnalysisUsed = async (regionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          free_analysis_used: true,
          free_analysis_region: regionId,
        })
        .eq('user_id', user.id);

      if (!error) {
        setFreeAnalysisUsed(true);
        setFreeAnalysisRegion(regionId);
      }
    } catch (error) {
      console.error('Error marking free analysis used:', error);
    }
  };

  // Refresh premium status
  const refreshPremiumStatus = useCallback(async () => {
    try {
      // 1. Check RevenueCat Status
      const rcPremium = await checkPremiumStatus();

      // 2. Check Database Status (Admin override)
      let dbPremium = false;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // We do a lightweight fetch here just for the is_premium flag if needed,
        // but reusing loadProfileStatus is cleaner.
        // Note: calling loadProfileStatus will also refresh free analysis tokens, which is good.
        dbPremium = await loadProfileStatus(user.id);
      }

      // 3. Combine them (OR logic)
      setIsPremium(rcPremium || dbPremium);
    } catch (error) {
      console.error('Error refreshing premium status:', error);
    }
  }, []);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    try {
      // Check if this is a mock package (for testing without RevenueCat setup)
      const isMockPackage = pkg.identifier === 'faceapp_premium_monthly' ||
        pkg.identifier === 'faceapp_premium_yearly';

      if (isMockPackage && !offerings) {
        // Simulate successful purchase in test mode
        console.log('🧪 TEST MODE: Simulating successful purchase for', pkg.identifier);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        setIsPremium(true);
        return { success: true };
      }

      // Real purchase through RevenueCat
      const result = await purchasePackage(pkg);

      if (result.success) {
        setIsPremium(true);
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }, [offerings]);

  // Restore purchases
  const restore = useCallback(async () => {
    try {
      // If offerings not loaded (test mode), simulate restore
      if (!offerings) {
        console.log('🧪 TEST MODE: Simulating restore (no purchases found)');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          success: true,
          isPremium: false, // No purchases to restore in test mode
        };
      }

      // Real restore through RevenueCat
      const result = await restorePurchases();

      if (result.isPremium) {
        setIsPremium(true);
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        isPremium: false,
        error: error.message || 'Restore failed',
      };
    }
  }, [offerings]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loginRevenueCat(session.user.id);
        await refreshPremiumStatus();
        await loadProfileStatus(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        await logoutRevenueCat();
        setIsPremium(false);
        setFreeAnalysisUsed(false);
        setFreeAnalysisRegion(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshPremiumStatus]);

  // Refresh on app foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshPremiumStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refreshPremiumStatus]);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        isLoading,
        freeAnalysisUsed,
        freeAnalysisRegion,
        offerings,
        monthlyPackage,
        yearlyPackage,
        refreshPremiumStatus,
        purchase,
        restore,
        markFreeAnalysisUsed,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}

export default PremiumContext;
