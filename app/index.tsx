// app/index.tsx
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingCheck } from '@/hooks/use-onboarding-check';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading } = useOnboardingCheck();

  // Show loading while auth OR onboarding check initializes
  if (authLoading || onboardingLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  // Route based on onboarding status
  if (needsOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Always redirect to main app (anonymous auth happens automatically)
  return <Redirect href="/(tabs)" />;
}