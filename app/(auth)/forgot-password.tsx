import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        Alert.alert(t('errors.title', { ns: 'errors' }), error.message);
      } else {
        setSent(true);
        Alert.alert(
          t('states.success', { ns: 'common' }),
          t('success.passwordResetSent'),
        );
      }
    } catch (error:any) {
        console.log(error.message);
      Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.somethingWentWrong'));
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center py-12">
          {/* Back Button */}
          <Button
            variant="ghost"
            onPress={() => router.back()}
            className="self-start mb-8"
          >
            <Text className="text-blue-600">{t('forgotPassword.backButton')}</Text>
          </Button>

          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-orange-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="lock-closed-outline" size={48} color="#F97316" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {t('forgotPassword.title')}
            </Text>
            <Text className="text-gray-600 mt-2 text-center">
              {sent
                ? t('forgotPassword.subtitleSent')
                : t('forgotPassword.subtitle')
              }
            </Text>
          </View>

          {/* Reset Form */}
          <Card className="p-6 bg-white">
            {!sent ? (
              <View className="space-y-4">
                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    {t('forgotPassword.emailLabel')}
                  </Text>
                  <Input
                    placeholder={t('forgotPassword.emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <Text className="text-gray-500 text-sm">
                  {t('forgotPassword.description')}
                </Text>

                <Button
                  onPress={handleResetPassword}
                  disabled={loading}
                  className="bg-orange-600 mt-6"
                >
                  <Text className="text-white font-semibold">
                    {loading ? t('forgotPassword.submittingButton') : t('forgotPassword.submitButton')}
                  </Text>
                </Button>
              </View>
            ) : (
              <View className="items-center space-y-4">
                <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center">
                  <Text className="text-2xl">✓</Text>
                </View>
                <Text className="text-green-600 font-semibold text-center">
                  {t('forgotPassword.sentTitle')}
                </Text>
                <Text className="text-gray-600 text-center">
                  {t('forgotPassword.sentMessage', { email })}
                </Text>

                <Button
                  onPress={() => router.back()}
                  variant="outline"
                  className="mt-4"
                >
                  <Text className="text-blue-600">{t('forgotPassword.backToLogin')}</Text>
                </Button>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}