import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  initializeRevenueCat,
  checkPremiumStatus,
  loginRevenueCat,
  logoutRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
  isRevenueCatConfigured,
  PREMIUM_ENTITLEMENT,
} from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
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
  const monthlyPackage = offerings?.monthly ?? null;
  const yearlyPackage = offerings?.annual ?? null;

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
        await loadFreeAnalysisStatus(user.id);
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

  // Load free analysis status from Supabase
  const loadFreeAnalysisStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('free_analysis_used, free_analysis_region')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setFreeAnalysisUsed(data.free_analysis_used ?? false);
        setFreeAnalysisRegion(data.free_analysis_region ?? null);
      }
    } catch (error) {
      console.error('Error loading free analysis status:', error);
    }
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
      const premium = await checkPremiumStatus();
      setIsPremium(premium);
    } catch (error) {
      console.error('Error refreshing premium status:', error);
    }
  }, []);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    try {
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
  }, []);

  // Restore purchases
  const restore = useCallback(async () => {
    try {
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
  }, []);

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
        await loadFreeAnalysisStatus(session.user.id);
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
