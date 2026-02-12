import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NameScreen() {
  const { t } = useTranslation('onboarding');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert(
        t('errors.title', { ns: 'errors' }),
        t('name.error')
      );
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update profile with name
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      router.push('/(onboarding)/gender');
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert(
        t('errors.title', { ns: 'errors' }),
        t('errors.somethingWentWrong', { ns: 'errors' })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(onboarding)/gender');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Icon */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-accent/10 rounded-full items-center justify-center mb-6">
              <Ionicons name="person" size={40} color="#14B8A6" />
            </View>

            {/* Title */}
            <Text className="text-2xl font-bold text-foreground text-center mb-2">
              {t('name.title')}
            </Text>

            {/* Subtitle */}
            <Text className="text-base text-muted-foreground text-center max-w-sm">
              {t('name.subtitle')}
            </Text>
          </View>

          {/* Input Card */}
          <Card className="p-6 mb-8">
            <Input
              value={name}
              onChangeText={setName}
              placeholder={t('name.placeholder')}
              autoFocus
              autoCapitalize="words"
              autoComplete="name"
              className="text-lg"
            />
          </Card>

          {/* Buttons */}
          <View className="space-y-3">
            <Button
              onPress={handleContinue}
              disabled={loading || !name.trim()}
              className="w-full h-14 bg-primary"
            >
              <Text className="text-primary-foreground font-semibold text-base">
                {loading ? t('states.loading', { ns: 'common' }) : t('name.continue')}
              </Text>
            </Button>

            <TouchableOpacity onPress={handleSkip} className="py-3">
              <Text className="text-muted-foreground text-center">
                {t('name.skip')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
