import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }


    // Login with email and password these part is only for supabase login 
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('Giriş Hatası', error.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.log(error.message);
      Alert.alert('Hata', 'Bir şeyler yanlış gitti');
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
                Hoş Geldin
              </Text>
              <Text className=" mt-2 text-center">
                Yüz analizi için giriş yapın
              </Text>
            </View>

            {/* Login Form */}
            <Card className="p-6  border-border">
              <View className="space-y-4">
                <View>
                  <Text className=" font-medium mb-2">
                    E-posta
                  </Text>
                  <Input
                    placeholder="ornek@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <View>
                  <Text className=" font-medium mb-2">
                    Şifre
                  </Text>
                  <Input
                    placeholder="Şifrenizi girin"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>

                <Link href="/(auth)/forgot-password" className="self-end">
                  <Text className=" text-sm">
                    Şifrenizi mi unuttunuz?
                  </Text>
                </Link>

                <Button
                  onPress={handleLogin}
                  disabled={loading}
                  className=" mt-6"
                >
                  <Text className=" font-semibold">
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </Text>
                </Button>
              </View>
            </Card>

            {/* Register Link */}
            <View className="flex-row justify-center items-center mt-6 gap-5 ">
              <Text className="text-gray-600">
                Hesabınız yok mu?
              </Text>
              <Link href="/(auth)/register">
                <Text className=" font-semibold ml-1">
                  Kayıt Olun
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}