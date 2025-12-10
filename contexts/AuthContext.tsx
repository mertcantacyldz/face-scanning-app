// contexts/AuthContext.tsx
import { getOrCreateDeviceId } from '@/lib/device-id';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  isAnonymous: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  isAnonymous: false,
});

// Storage keys for manual session persistence
const STORAGE_KEYS = {
  SESSION: 'face_scan_session',
  DEVICE_USER_ID: 'face_scan_device_user_id',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // SADECE BİR KERE çalışsın
    if (initialized) return;
    setInitialized(true);

    initializeAuth();

    // Auth state değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id);
      setSession(session);
      setIsAnonymous(session?.user?.is_anonymous ?? false);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [initialized]);

  const initializeAuth = async () => {
    try {
      console.log('🔐 Initializing auth...');

      // Get device ID first (we'll need it for all scenarios)
      const deviceId = await getOrCreateDeviceId();
      console.log('📱 Device ID:', deviceId);

      // 1. Try to restore saved session from AsyncStorage
      console.log('💾 Checking for saved session...');
      const savedSessionData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      const savedUserId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_USER_ID);

      if (savedSessionData && savedUserId) {
        console.log('🔍 Found saved session for user:', savedUserId);
        try {
          const { access_token, refresh_token } = JSON.parse(savedSessionData);

          // Check if refresh_token exists (required for session restore)
          if (!refresh_token) {
            console.warn('⚠️ No refresh token found, clearing session...');
            await clearSavedSession();
          } else {
            console.log('🔄 Restoring session (via refresh)...');

            // FIX: Always use refreshSession instead of setSession
            // This prevents local hangs and ensures server-side validation
            const { data, error } = await supabase.auth.refreshSession({ refresh_token });

            if (error) {
              console.warn('⚠️ Failed to restore session:', error.message);
              console.log('   Will create new session...');
              // Clear invalid session
              await clearSavedSession();
            } else if (data.session) {
              console.log('✅ Session restored successfully:', data.session.user.id);
              // Save the refreshed session
              await saveSession(data.session, deviceId);
              setSession(data.session);
              setIsAnonymous(data.session.user?.is_anonymous ?? false);
              setLoading(false);
              return;
            } else {
              console.warn('⚠️ No session returned, clearing...');
              await clearSavedSession();
            }
          }
        } catch (parseError) {
          console.warn('⚠️ Error restoring session:', parseError);
          await clearSavedSession();
        }
      } else {
        console.log('❌ No saved session found');
      }

      // 2. Check Supabase's own session (fallback)
      console.log('📡 Checking Supabase session...');
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (existingSession) {
        console.log('✅ Supabase session found:', existingSession.user.id);
        // Save it for next time
        await saveSession(existingSession, deviceId);
        setSession(existingSession);
        setIsAnonymous(existingSession.user?.is_anonymous ?? false);
        setLoading(false);
        return;
      }

      // 3. No session exists - check if this device already has a user
      console.log('❌ No session found anywhere, checking device mapping...');

      // 3a. Check if this device ID is already mapped to a user
      const { data: existingDevice, error: deviceError } = await supabase
        .from('device_users')
        .select('supabase_user_id')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (deviceError) {
        console.warn('⚠️ Error checking device mapping:', deviceError);
      }

      if (existingDevice?.supabase_user_id) {
        console.log('🔍 Found existing user mapping for this device:', existingDevice.supabase_user_id);
        console.log('⚠️ Device has existing user but session is lost/expired.');
        console.log('   Unfortunately, anonymous users cannot be re-authenticated.');
        console.log('   This device will keep the mapping but create a new anonymous user.');
        console.log('   (In premium flow, users can restore via OAuth/email)');
      } else {
        console.log('✅ No existing user for this device');
      }

      // 4. Create new anonymous session
      console.log('🆕 Creating new anonymous user...');
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: { device_id: deviceId }, // Store device ID in user metadata
        },
      });

      if (error) {
        console.error('❌ Anonymous auth error:', error);
        throw error;
      }

      console.log('✅ Anonymous user created:', data.user?.id);

      // 5. Create profile manually (backup if trigger fails)
      if (data.user) {
        await createProfile(data.user.id, data.user.email ?? null);
      }

      // 6. Create device mapping in database
      // Note: If device already has a mapping, we DON'T override it
      // This preserves the FIRST user for premium restoration
      if (data.user && !existingDevice?.supabase_user_id) {
        await createDeviceMapping(deviceId, data.user.id);
      } else if (existingDevice?.supabase_user_id) {
        console.log('⚠️ Keeping existing device mapping (first user preserved for premium)');
      }

      // 7. Save session for next app launch
      if (data.session) {
        await saveSession(data.session, deviceId);
      }

      setSession(data.session);
      setIsAnonymous(true);
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    } finally {
      console.log('🏁 Auth initialization complete, setting loading to false');
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, loading, isAnonymous }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Save session to AsyncStorage for manual persistence
 */
async function saveSession(session: Session, deviceId: string): Promise<void> {
  try {
    const sessionData = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_USER_ID, session.user.id);

    console.log('💾 Session saved to AsyncStorage for user:', session.user.id);
  } catch (error) {
    console.error('❌ Failed to save session:', error);
  }
}

/**
 * Clear saved session from AsyncStorage
 */
async function clearSavedSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_USER_ID);
    console.log('🗑️ Saved session cleared');
  } catch (error) {
    console.error('❌ Failed to clear saved session:', error);
  }
}

/**
 * Create profile for anonymous user (backup if trigger fails)
 */
async function createProfile(userId: string, email: string | null) {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        email: email,
        full_name: 'Kullanıcı',
      })
      .select()
      .single();

    // Ignore unique constraint errors (profile already exists from trigger)
    if (error && error.code !== '23505') {
      console.error('Profile creation error:', error);
    } else if (!error) {
      console.log('✅ Profile created successfully');
    }
  } catch (error) {
    console.error('Unexpected profile creation error:', error);
  }
}

/**
 * Create device-to-user mapping in database
 */
async function createDeviceMapping(deviceId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('device_users')
      .insert({
        device_id: deviceId,
        supabase_user_id: userId,
      })
      .select()
      .single();

    // Ignore unique constraint errors (device already mapped)
    if (error && error.code !== '23505') {
      console.error('Device mapping error:', error);
    } else if (!error) {
      console.log('✅ Device mapping created successfully');
    }
  } catch (error) {
    console.error('Unexpected device mapping error:', error);
  }
}
