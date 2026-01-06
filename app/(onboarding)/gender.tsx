import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Gender = 'female' | 'male' | 'other' | null;

export default function GenderScreen() {
  const { t } = useTranslation('onboarding');
  const [selectedGender, setSelectedGender] = useState<Gender>(null);
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update profile with gender and mark onboarding as complete
      const { error } = await supabase
        .from('profiles')
        .update({
          gender: selectedGender,
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        t('errors.title', { ns: 'errors' }),
        t('errors.somethingWentWrong', { ns: 'errors' })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Mark as complete without gender
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      if (error) throw error;

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      Alert.alert(
        t('errors.title', { ns: 'errors' }),
        t('errors.somethingWentWrong', { ns: 'errors' })
      );
    } finally {
      setLoading(false);
    }
  };

  const GenderCard = ({
    gender,
    icon,
    label
  }: {
    gender: Gender;
    icon: string;
    label: string;
  }) => {
    const isSelected = selectedGender === gender;

    return (
      <TouchableOpacity
        onPress={() => setSelectedGender(gender)}
        className={`mb-4 ${isSelected ? 'opacity-100' : 'opacity-80'}`}
      >
        <Card
          className={`p-6 flex-row items-center ${isSelected
              ? 'border-2 border-primary bg-primary/5'
              : 'border border-border'
            }`}
        >
          <View
            className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isSelected ? 'bg-primary' : 'bg-muted'
              }`}
          >
            <Ionicons
              name={icon as any}
              size={24}
              color={isSelected ? 'white' : '#8B5CF6'}
            />
          </View>
          <Text
            className={`text-lg font-semibold ${isSelected ? 'text-primary' : 'text-foreground'
              }`}
          >
            {label}
          </Text>
          {isSelected && (
            <View className="ml-auto">
              <Ionicons name="checkmark-circle" size={28} color="#8B5CF6" />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center px-6">
        {/* Icon */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-accent/10 rounded-full items-center justify-center mb-6">
            <Ionicons name="people" size={40} color="#14B8A6" />
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-foreground text-center mb-2">
            {t('gender.title')}
          </Text>

          {/* Subtitle */}
          <Text className="text-base text-muted-foreground text-center max-w-sm mb-8">
            {t('gender.subtitle')}
          </Text>
        </View>

        {/* Gender Options */}
        <View className="mb-8">
          <GenderCard gender="female" icon="woman" label={t('gender.female')} />
          <GenderCard gender="male" icon="man" label={t('gender.male')} />
          <GenderCard gender="other" icon="help-circle" label={t('gender.other')} />
        </View>

        {/* Buttons */}
        <View className="space-y-3">
          <Button
            onPress={handleFinish}
            disabled={loading || !selectedGender}
            className="w-full h-14 bg-success"
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text className="text-success-foreground font-semibold text-base ml-2">
              {loading ? t('states.loading', { ns: 'common' }) : t('gender.finish')}
            </Text>
          </Button>

          <TouchableOpacity onPress={handleSkip} className="py-3">
            <Text className="text-muted-foreground text-center">
              {t('gender.skip')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
