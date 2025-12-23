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

export default function LoginScreen() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert(t('errors.title', { ns: 'errors' }), error.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (error:any) {
        console.log(error.message);
      Alert.alert(t('errors.title', { ns: 'errors' }), t('errors.somethingWentWrong'));
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 ">
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
              <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="person-circle-outline" size={48} color="#3B82F6" />
              </View>
              <Text className="text-2xl font-bold ">
                {t('login.title')}
              </Text>
              <Text className=" mt-2 text-center">
                {t('login.subtitle')}
              </Text>
            </View>

            {/* Login Form */}
            <Card className="p-6  border-border">
              <View className="space-y-4">
                <View>
                  <Text className=" font-medium mb-2">
                    {t('login.emailLabel')}
                  </Text>
                  <Input
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <View>
                  <Text className=" font-medium mb-2">
                    {t('login.passwordLabel')}
                  </Text>
                  <Input
                    placeholder={t('login.passwordPlaceholder')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>

                <Link href="/(auth)/forgot-password" className="self-end">
                  <Text className=" text-sm">
                    {t('login.forgotPassword')}
                  </Text>
                </Link>

                <Button
                  onPress={handleLogin}
                  disabled={loading}
                  className=" mt-6"
                >
                  <Text className=" font-semibold">
                    {loading ? t('login.submittingButton') : t('login.submitButton')}
                  </Text>
                </Button>
              </View>
            </Card>

            {/* Register Link */}
            <View className="flex-row justify-center items-center mt-6 gap-5 ">
              <Text className="text-gray-600">
                {t('login.noAccount')}
              </Text>
              <Link href="/(auth)/register">
                <Text className=" font-semibold ml-1">
                  {t('login.signUpLink')}
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}