import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: false, // Prevent swipe back during onboarding
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="name" />
        <Stack.Screen name="gender" />
      </Stack>
    </>
  );
}
