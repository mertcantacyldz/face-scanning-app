import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !fullName) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
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
        Alert.alert('Kayıt Hatası', error.message);
      } else {
        Alert.alert(
          'Başarılı!',
          'Kayıt işlemi tamamlandı. E-postanızı kontrol edin.',
          [{ text: 'Tamam', onPress: () => router.back() }]
        );
      }
    } catch (error:any) {
        console.log(error.message);
      Alert.alert('Hata', 'Bir şeyler yanlış gitti');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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
                <Text className="text-3xl">✨</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                Hesap Oluştur
              </Text>
              <Text className="text-gray-600 mt-2 text-center">
                Yüz analizi deneyiminizi başlatın
              </Text>
            </View>

            {/* Register Form */}
            <Card className="p-6 bg-white">
              <View className="space-y-4">
                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    Ad Soyad
                  </Text>
                  <Input
                    placeholder="Ad Soyadınız"
                    value={fullName}
                    onChangeText={setFullName}
                    autoComplete="name"
                  />
                </View>

                <View>
                  <Text className="text-gray-700 font-medium mb-2">
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
                  <Text className="text-gray-700 font-medium mb-2">
                    Şifre
                  </Text>
                  <Input
                    placeholder="En az 6 karakter"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>

                <View>
                  <Text className="text-gray-700 font-medium mb-2">
                    Şifre Tekrar
                  </Text>
                  <Input
                    placeholder="Şifrenizi tekrar girin"
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
                    {loading ? 'Kayıt yapılıyor...' : 'Hesap Oluştur'}
                  </Text>
                </Button>
              </View>
            </Card>

            {/* Login Link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-gray-600">
                Zaten hesabınız var mı? 
              </Text>
              <Link href="/(auth)/login">
                <Text className="text-blue-600 font-semibold ml-1">
                  Giriş Yapın
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}