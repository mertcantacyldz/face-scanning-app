// app/index.tsx
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { loading } = useAuth();

  // Show loading while auth initializes (device ID + anonymous auth)
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  // Always redirect to main app (no login required!)
  // Anonymous auth happens automatically in useAuth hook
  return <Redirect href="/(tabs)" />;
}