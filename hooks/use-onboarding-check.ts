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
 */
export function useOnboardingCheck(): OnboardingStatus {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNeedsOnboarding(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, full_name')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        // No profile found - this shouldn't happen with trigger
        setNeedsOnboarding(true);
        return;
      }

      // Need onboarding if:
      // 1. Never completed onboarding, OR
      // 2. Still has default name "Kullanıcı"
      const needs =
        !profile.onboarding_completed ||
        profile.full_name === 'Kullanıcı' ||
        !profile.full_name;

      setNeedsOnboarding(needs);
    } catch (error) {
      console.error('Onboarding check error:', error);
      setNeedsOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  return { needsOnboarding, loading };
}
