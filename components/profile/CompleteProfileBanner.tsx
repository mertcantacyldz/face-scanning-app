import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';

const BANNER_DISMISSED_KEY = '@face_app:profile_banner_dismissed';

interface CompleteProfileBannerProps {
  fullName: string;
  gender: string | null;
}

export function CompleteProfileBanner({ fullName, gender }: CompleteProfileBannerProps) {
  const { t } = useTranslation('onboarding');
  const [dismissed, setDismissed] = useState(true); // Start true to prevent flash

  // Check if profile is incomplete
  const isIncomplete = fullName === 'Kullanıcı' || !gender;

  useEffect(() => {
    loadDismissedState();
  }, []);

  const loadDismissedState = async () => {
    try {
      const value = await AsyncStorage.getItem(BANNER_DISMISSED_KEY);
      setDismissed(value === 'true');
    } catch (error) {
      console.error('Error loading banner state:', error);
      setDismissed(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
      setDismissed(true);
    } catch (error) {
      console.error('Error saving banner state:', error);
    }
  };

  const handleComplete = () => {
    router.push('/(onboarding)/name');
  };

  // Don't show if profile is complete or banner was dismissed
  if (!isIncomplete || dismissed) {
    return null;
  }

  return (
    <Card className="p-4 mb-4 bg-warning/10 border-warning/30 border-2">
      <View className="flex-row items-center">
        <View className="w-12 h-12 bg-warning rounded-full items-center justify-center mr-3">
          <Ionicons name="information" size={24} color="white" />
        </View>

        <View className="flex-1">
          <Text className="font-bold text-foreground mb-1">
            {t('banner.title')}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {t('banner.description')}
          </Text>
        </View>

        <View className="flex-col gap-2">
          <TouchableOpacity
            onPress={handleComplete}
            className="bg-warning px-3 py-2 rounded-md"
          >
            <Text className="text-warning-foreground font-semibold text-xs">
              Complete
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDismiss}>
            <Ionicons name="close-circle" size={24} color="#8B8B8B" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}
