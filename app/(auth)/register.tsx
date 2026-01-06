import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !fullName) {
      Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        Alert.alert(t('errors.title', { ns: 'errors' }), error.message);
      } else {
        Alert.alert(
          t('states.success', { ns: 'common' }),
          t('success.registrationComplete'),
          [{ text: t('buttons.done', { ns: 'common' }), onPress: () => router.back() }]
        );
      }
    } catch (error:any) {
        console.log(error.message);
      Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.somethingWentWrong'));
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center py-12">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="sparkles-outline" size={48} color="#10B981" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {t('register.title')}
              </Text>
              <Text className="text-gray-600 mt-2 text-center">
                {t('register.subtitle')}
              </Text>
            </View>

            {/* Register Form */}
            <Card className="p-6 bg-white">
              <View className="space-y-4">
                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    {t('register.fullNameLabel')}
                  </Text>
                  <Input
                    placeholder={t('register.fullNamePlaceholder')}
                    value={fullName}
                    onChangeText={setFullName}
                    autoComplete="name"
                  />
                </View>

                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    {t('register.emailLabel')}
                  </Text>
                  <Input
                    placeholder={t('register.emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    {t('register.passwordLabel')}
                  </Text>
                  <Input
                    placeholder={t('register.passwordPlaceholder')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>

                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    {t('register.confirmPasswordLabel')}
                  </Text>
                  <Input
                    placeholder={t('register.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>

                <Button
                  onPress={handleRegister}
                  disabled={loading}
                  className="bg-green-600 mt-6"
                >
                  <Text className="text-white font-semibold">
                    {loading ? t('register.submittingButton') : t('register.submitButton')}
                  </Text>
                </Button>
              </View>
            </Card>

            {/* Login Link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-gray-600">
                {t('register.hasAccount')}
              </Text>
              <Link href="/(auth)/login">
                <Text className="text-blue-600 font-semibold ml-1">
                  {t('register.signInLink')}
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}