// hooks/use-session-refresh.ts
/**
 * Proactive Session Refresh Hook
 *
 * Purpose:
 * - Refresh Supabase session before it expires
 * - Prevent "session expired" errors when app is idle for 1+ hours
 * - Handle app foreground transitions gracefully
 *
 * How it works:
 * - On app foreground: Check if token expires within 5 minutes
 * - If so: Proactively refresh the session
 * - Supabase tokens expire after 1 hour by default
 */

import { supabase } from '@/lib/supabase';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// Refresh threshold in seconds (5 minutes before expiry)
const REFRESH_THRESHOLD_SECONDS = 300;

export function useSessionRefresh() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const checkAndRefreshSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('🔄 Session refresh: No session found');
          return;
        }

        // Check if token expires soon
        const expiresAt = session.expires_at;
        if (!expiresAt) {
          console.log('🔄 Session refresh: No expiry time found');
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        console.log('🔄 Session refresh check:', {
          expiresAt: new Date(expiresAt * 1000).toISOString(),
          timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60)} minutes`,
          threshold: `${REFRESH_THRESHOLD_SECONDS / 60} minutes`,
        });

        if (timeUntilExpiry < REFRESH_THRESHOLD_SECONDS) {
          console.log('🔄 Session expires soon, refreshing proactively...');

          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            console.error('❌ Proactive session refresh failed:', error.message);
            // Don't throw - let the app continue with potentially expired token
            // AuthContext will handle creating new session if needed
          } else if (data.session) {
            console.log('✅ Session refreshed proactively:', {
              userId: data.session.user.id,
              newExpiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
            });
          }
        } else {
          console.log('✅ Session still valid, no refresh needed');
        }
      } catch (error) {
        console.error('❌ Session refresh check error:', error);
      }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Only check when app comes to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App returned to foreground, checking session...');
        checkAndRefreshSession();
      }

      appState.current = nextAppState;
    };

    // Check session immediately on mount
    checkAndRefreshSession();

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);
}

export default useSessionRefresh;
