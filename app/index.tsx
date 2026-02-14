// app/index.tsx
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingCheck } from '@/hooks/use-onboarding-check';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading } = useOnboardingCheck();

  console.log('📍 [INDEX] app/index.tsx rendered', {
    authLoading,
    onboardingLoading,
    needsOnboarding,
  });

  // Show loading while auth OR onboarding check initializes
  if (authLoading || onboardingLoading) {
    console.log('⏳ [INDEX] Still loading... authLoading:', authLoading, 'onboardingLoading:', onboardingLoading);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  // Route based on onboarding status
  if (needsOnboarding) {
    console.log('🚀 [INDEX] Redirecting to /(onboarding)/welcome');
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Always redirect to main app (anonymous auth happens automatically)
  console.log('🏠 [INDEX] Redirecting to /(tabs)');
  return <Redirect href="/(tabs)" />;
}