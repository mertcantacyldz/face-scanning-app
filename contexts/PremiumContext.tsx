import {
  checkPremiumStatus,
  getOfferings,
  initializeRevenueCat,
  logoutRevenueCat,
  purchasePackage,
  restorePurchases
} from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import {
  checkDatabasePremiumStatus,
  getFreeAnalysisStatus,
  updateFreeAnalysisStatus
} from '@/lib/premium-database';
import { getOrCreateDeviceId } from '@/lib/device-id-with-fallback';
import type { PremiumContextValue } from '@/types/premium';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { useToast } from 'react-native-toast-notifications';

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

interface PremiumProviderProps {
  children: ReactNode;
}

export function PremiumProvider({ children }: PremiumProviderProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isRevenueCatPremium, setIsRevenueCatPremium] = useState(false);
  const [isDatabasePremium, setIsDatabasePremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [freeAnalysisUsed, setFreeAnalysisUsed] = useState(false);
  const [freeAnalysisRegion, setFreeAnalysisRegion] = useState<string | null>(null);

  const toast = useToast();

  // Get monthly and yearly packages from offerings
  const monthlyPackage = offerings?.monthly ?? null;
  const yearlyPackage = offerings?.annual ?? null;

  // Check combined premium status from both RevenueCat and Database
  const checkCombinedPremiumStatus = useCallback(async (userId: string): Promise<{ combined: boolean; revenueCat: boolean; database: boolean }> => {
    try {
      // Check both sources in parallel
      const [rcPremium, dbPremium] = await Promise.all([
        checkPremiumStatus(),
        checkDatabasePremiumStatus(userId)
      ]);

      // Combined: true if EITHER source is true
      const combined = rcPremium || dbPremium;

      console.log('Premium status check:', { rcPremium, dbPremium, combined });

      return { combined, revenueCat: rcPremium, database: dbPremium };
    } catch (error) {
      console.error('Error checking premium status:', error);
      return { combined: false, revenueCat: false, database: false };
    }
  }, []);

  // Automatically update combined premium status when individual sources change
  useEffect(() => {
    const combined = isRevenueCatPremium || isDatabasePremium;
    console.log('🔄 Premium status auto-update:', {
      revenueCat: isRevenueCatPremium,
      database: isDatabasePremium,
      combined,
      previousCombined: isPremium,
      isLoading,
    });

    // Always update, even if same value (to ensure state is correct)
    if (combined !== isPremium) {
      console.log('✅ Updating combined premium status:', isPremium, '->', combined);
      setIsPremium(combined);
    }
  }, [isRevenueCatPremium, isDatabasePremium, isPremium, isLoading]);

  // Initialize RevenueCat and check premium status
  const initialize = useCallback(async () => {
    setIsLoading(true);

    try {
      // Get device ID first (stable identifier for RevenueCat)
      const deviceId = await getOrCreateDeviceId();
      console.log('📱 PremiumContext: Using device ID for RevenueCat:', deviceId);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log('🚀 Initializing premium status for user:', user.id);

        // Initialize RevenueCat with DEVICE ID (not user ID!)
        // This ensures premium persists even when session expires and new user is created
        await initializeRevenueCat(deviceId);

        // Check premium status from both sources
        const premiumStatus = await checkCombinedPremiumStatus(user.id);

        console.log('📊 Initial premium status:', premiumStatus);

        // Set individual statuses first (this will trigger the useEffect above)
        setIsRevenueCatPremium(premiumStatus.revenueCat);
        setIsDatabasePremium(premiumStatus.database);

        // AUTO-RESTORE: If not premium, try to restore purchases silently
        if (!premiumStatus.combined) {
          console.log('🔄 Auto-restore: Premium not found, trying silent restore...');
          try {
            const restoreResult = await restorePurchases();
            if (restoreResult.isPremium) {
              console.log('✅ Auto-restore: Premium restored successfully!');
              setIsRevenueCatPremium(true);
            } else {
              console.log('ℹ️ Auto-restore: No subscription found');
            }
          } catch (restoreError) {
            // Silent failure - don't bother user
            console.log('⚠️ Auto-restore failed (silent):', restoreError);
          }
        }

        // Load offerings
        const currentOfferings = await getOfferings();
        setOfferings(currentOfferings);

        // Check if free analysis was used (from Supabase - both user and device level)
        const freeAnalysisStatus = await getFreeAnalysisStatus(user.id, deviceId);
        setFreeAnalysisUsed(freeAnalysisStatus.used);
        setFreeAnalysisRegion(freeAnalysisStatus.region);
      } else {
        console.log('👤 No user logged in, setting premium to false');
        // No user, initialize RevenueCat with device ID anyway
        await initializeRevenueCat(deviceId);
        setIsRevenueCatPremium(false);
        setIsDatabasePremium(false);
      }
    } catch (error) {
      console.error('❌ Premium initialization error:', error);
      setIsRevenueCatPremium(false);
      setIsDatabasePremium(false);
    } finally {
      setIsLoading(false);
    }
  }, [checkCombinedPremiumStatus]);

  // Mark free analysis as used
  const markFreeAnalysisUsed = async (regionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get device ID for device-level tracking
      const deviceId = await getOrCreateDeviceId();

      // Update both user and device records
      await updateFreeAnalysisStatus(user.id, regionId, deviceId);
      setFreeAnalysisUsed(true);
      setFreeAnalysisRegion(regionId);
    } catch (error) {
      console.error('Error marking free analysis used:', error);
    }
  };

  // Refresh premium status
  const refreshPremiumStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔄 Refresh: No user, setting all to false');
        setIsRevenueCatPremium(false);
        setIsDatabasePremium(false);
        return;
      }

      console.log('🔄 Refreshing premium status for user:', user.id);
      const premiumStatus = await checkCombinedPremiumStatus(user.id);
      console.log('📊 Refreshed premium status:', premiumStatus);

      // Set individual statuses (useEffect will update combined)
      setIsRevenueCatPremium(premiumStatus.revenueCat);
      setIsDatabasePremium(premiumStatus.database);
    } catch (error) {
      console.error('❌ Error refreshing premium status:', error);
    }
  }, [checkCombinedPremiumStatus]);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    try {
      const result = await purchasePackage(pkg);

      if (result.success) {
        console.log('✅ Purchase successful, setting RevenueCat premium to true');
        setIsRevenueCatPremium(true);
        toast.show('Premium\'a hoş geldiniz!', {
          type: 'success',
          placement: 'top',
          duration: 3000,
        });
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      toast.show('Satın alma başarısız: ' + error.message, {
        type: 'danger',
        placement: 'top',
        duration: 3000,
      });
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }, [toast]);

  // Restore purchases
  const restore = useCallback(async () => {
    try {
      const result = await restorePurchases();

      if (result.isPremium) {
        console.log('✅ Restore successful, setting RevenueCat premium to true');
        setIsRevenueCatPremium(true);
        toast.show('Premium geri yüklendi!', {
          type: 'success',
          placement: 'top',
          duration: 3000,
        });
      }

      return result;
    } catch (error: any) {
      toast.show('Geri yükleme başarısız: ' + error.message, {
        type: 'danger',
        placement: 'top',
        duration: 3000,
      });
      return {
        success: false,
        isPremium: false,
        error: error.message || 'Restore failed',
      };
    }
  }, [toast]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state change in PremiumContext:', event);

      // Handle user sign in events
      if (session?.user && (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'INITIAL_SESSION'
      )) {
        console.log('👤 User detected, refreshing premium status. Event:', event);

        // Chain promises to sequence calls without blocking
        // Use device ID for RevenueCat (not user ID!)
        getOrCreateDeviceId()
          .then(async (deviceId) => {
            console.log('📱 Auth state change: Using device ID for RevenueCat:', deviceId);
            await initializeRevenueCat(deviceId);

            // Small delay to let RevenueCat settle
            await new Promise(resolve => setTimeout(resolve, 150));

            await refreshPremiumStatus();

            // Check free analysis status with device ID
            const freeAnalysisStatus = await getFreeAnalysisStatus(session.user.id, deviceId);
            setFreeAnalysisUsed(freeAnalysisStatus.used);
            setFreeAnalysisRegion(freeAnalysisStatus.region);
          })
          .catch(err => console.error('❌ Error in premium initialization chain:', err));
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out in PremiumContext');
        // Don't logout from RevenueCat - keep device ID association
        // This allows premium to persist across sign outs
        setIsRevenueCatPremium(false);
        setIsDatabasePremium(false);
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
        isRevenueCatPremium,
        isDatabasePremium,
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
