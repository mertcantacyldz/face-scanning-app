import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import '@/global.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { PortalHost } from '@rn-primitives/portal';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { PremiumProvider } from '@/contexts/PremiumContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { initializeI18n } from '@/locales';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // Initialize i18n
    initializeI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh()
      } else {
        supabase.auth.stopAutoRefresh()
      }
    })

    return () => subscription?.remove()
  }, [])

  if (!i18nReady) {
    return null; // Or a splash screen
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <PremiumProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            <Stack.Screen name="premium/subscribe" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
          <PortalHost />
        </PremiumProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
