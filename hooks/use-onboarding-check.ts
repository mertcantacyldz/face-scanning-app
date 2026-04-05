import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface OnboardingStatus {
  needsOnboarding: boolean;
  loading: boolean;
}

/**
 * Hook to check if user needs onboarding
 * Returns true if:
 * 1. onboarding_completed === false, OR
 * 2. full_name === "Kullanıcı" (default name)
 * 
 * Now uses session from AuthContext to avoid race conditions.
 */
export function useOnboardingCheck(): OnboardingStatus {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    console.log('🔄 [ONBOARDING-CHECK] useEffect triggered', {
      authLoading,
      hasSession: !!session,
      userId: session?.user?.id ?? 'none',
    });

    // Auth henüz yüklenmedi, bekle
    if (authLoading) {
      console.log('⏳ [ONBOARDING-CHECK] Auth still loading, waiting...');
      return;
    }

    // Auth yüklendi ama session yok
    if (!session?.user) {
      console.log('❌ [ONBOARDING-CHECK] No session/user after auth loaded, skipping onboarding');
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    console.log('✅ [ONBOARDING-CHECK] Session ready, checking onboarding status for user:', session.user.id);
    checkOnboardingStatus(session.user.id);
  }, [session, authLoading]);

  const checkOnboardingStatus = async (userId: string) => {
    try {
      console.log('📡 [ONBOARDING-CHECK] Querying profile for user:', userId);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, full_name')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ [ONBOARDING-CHECK] Profile query error:', error);
      }

      if (!profile) {
        console.log('⚠️ [ONBOARDING-CHECK] No profile found - needs onboarding');
        setNeedsOnboarding(true);
        return;
      }

      console.log('📋 [ONBOARDING-CHECK] Profile query result:', {
        hasProfile: !!profile,
        data: profile,
        error: error ? (error as any).message : null
      });

      if (!profile) {
        console.log('⚠️ [ONBOARDING-CHECK] No profile found in DB for user:', userId);
        setNeedsOnboarding(true);
        return;
      }

      // Need onboarding ONLY if onboarding_completed is false
      const needs = profile.onboarding_completed === false;

      console.log('🎯 [ONBOARDING-CHECK] Final Decision:', {
        needsOnboarding: needs,
        onboarding_completed: profile.onboarding_completed,
        full_name: profile.full_name,
        reason: needs ? 'onboarding_completed is explicitly false' : 'onboarding_completed is true, access granted'
      });

      setNeedsOnboarding(needs);
    } catch (error) {
      console.error('❌ [ONBOARDING-CHECK] Unexpected error:', error);
      setNeedsOnboarding(false);
    } finally {
      setLoading(false);
      console.log('🏁 [ONBOARDING-CHECK] Check complete, loading = false');
    }
  };

  return { needsOnboarding, loading };
}
