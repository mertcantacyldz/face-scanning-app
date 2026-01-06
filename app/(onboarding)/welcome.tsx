import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const { t } = useTranslation('onboarding');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center items-center px-6">
        {/* Icon */}
        <View className="w-32 h-32 bg-primary/10 rounded-full items-center justify-center mb-8">
          <Ionicons name="sparkles" size={64} color="#8B5CF6" />
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-foreground text-center mb-4">
          {t('welcome.title')}
        </Text>

        {/* Subtitle */}
        <Text className="text-xl text-muted-foreground text-center mb-3">
          {t('welcome.subtitle')}
        </Text>

        {/* Description */}
        <Text className="text-base text-muted-foreground text-center mb-12 max-w-md">
          {t('welcome.description')}
        </Text>

        {/* CTA Button */}
        <Button
          onPress={() => router.push('/(onboarding)/name')}
          className="w-full max-w-sm h-14 bg-primary"
        >
          <Text className="text-primary-foreground font-bold text-lg">
            {t('welcome.button')}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
