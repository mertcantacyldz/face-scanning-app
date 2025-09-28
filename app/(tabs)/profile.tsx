// app/(tabs)/profile.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_premium: boolean;
  premium_expires_at: string | null;
  created_at: string;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState('');

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
      } else {
        Alert.alert('Hata', 'Profil bulunamadı');
      }
    } catch (error) {
      console.error('Hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateProfile = async () => {
    if (!profile || !fullName.trim()) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, full_name: fullName.trim() });
      setEditMode(false);
      Alert.alert('Başarılı', 'Profil güncellendi');
    } catch (error) {
      Alert.alert('Hata', 'Profil güncellenemedi');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 justify-center items-center">
        <View className="items-center">
          <Ionicons name="person-circle" size={64} color="#3B82F6 dark:text-blue-400" />
          <Text className="text-gray-600 dark:text-gray-400 mt-4">Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 justify-center items-center">
        <View className="items-center">
          <Ionicons name="alert-circle" size={64} color="#EF4444 dark:text-red-400" />
          <Text className="text-gray-600 dark:text-gray-400 mt-4">Profil bilgileri bulunamadı</Text>
          <Button onPress={fetchProfile} className="mt-4" variant="default">
            <Text className="text-white">Tekrar Dene</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="items-center mb-8">
          <View className="relative mb-4">
            <View className="w-24 h-24 bg-blue-500 dark:bg-blue-700 rounded-full justify-center items-center">
              <Ionicons name="person" size={48} color="white" />
            </View>
            <TouchableOpacity 
              onPress={() => setEditMode(!editMode)}
              className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-2 shadow-md"
            >
              <Ionicons 
                name={editMode ? "close" : "create"} 
                size={20} 
                color="#3B82F6 dark:text-blue-400" 
              />
            </TouchableOpacity>
          </View>

          {editMode ? (
            <View className="w-full max-w-xs space-y-4">
              <Input
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ad Soyad"
                className="text-center text-lg text-gray-900 dark:text-white"
                placeholderTextColor="#6B7280 dark:text-gray-400"
                autoFocus
              />
              <View className="flex-row space-x-3">
                <Button 
                  onPress={updateProfile}
                  className="flex-1 bg-green-600"
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Kaydet</Text>
                </Button>
                <Button 
                  onPress={() => {
                    setEditMode(false);
                    setFullName(profile.full_name);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-300 dark:border-gray-600"
                >
                  <Text className="text-gray-600 dark:text-gray-300">İptal</Text>
                </Button>
              </View>
            </View>
          ) : (
            <>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {profile.full_name}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 mb-3">{profile.email}</Text>
              <Badge 
                variant={profile.is_premium ? "default" : "secondary"}
                className={profile.is_premium ? 
                  "bg-amber-500 dark:bg-amber-600" : 
                  "bg-gray-500 dark:bg-gray-600"
                }
              >
                <Ionicons 
                  name={profile.is_premium ? "star" : "person"} 
                  size={14} 
                  color="white" 
                  className="mr-1" 
                />
                <Text className="text-white font-semibold">
                  {profile.is_premium ? 'Premium Üye' : 'Standart Üye'}
                </Text>
              </Badge>
            </>
          )}
        </View>

        {/* Premium Status Card */}
        {profile.is_premium && profile.premium_expires_at && (
          <Card className="p-5 mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <View className="flex-row items-center">
              <Ionicons name="star" size={24} color="#F59E0B dark:text-amber-400" />
              <View className="ml-3 flex-1">
                <Text className="font-bold text-lg text-amber-900 dark:text-amber-200">
                  Premium Üyelik
                </Text>
                <Text className="text-amber-800 dark:text-amber-400">
                  Bitiş Tarihi: {new Date(profile.premium_expires_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Stats Section */}
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-5">
            📊 Hesap İstatistikleri
          </Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <View className="flex-row items-center">
                <Ionicons name="analytics" size={20} color="#3B82F6 dark:text-blue-400" />
                <Text className="text-gray-600 dark:text-gray-400 ml-2">Toplam Analiz</Text>
              </View>
              <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">
                12
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={20} color="#10B981 dark:text-green-400" />
                <Text className="text-gray-600 dark:text-gray-400 ml-2">Bu Ay</Text>
              </View>
              <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                3
              </Text>
            </View>
            
            {!profile.is_premium && (
              <View className="flex-row justify-between items-center py-3">
                <View className="flex-row items-center">
                  <Ionicons name="alert-circle" size={20} color="#F59E0B dark:text-amber-400" />
                  <Text className="text-gray-600 dark:text-gray-400 ml-2">Kalan Limit</Text>
                </View>
                <Text className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  2/5
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Quick Actions */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          ⚡ Hızlı İşlemler
        </Text>
        
        <View className="flex flex-col gap-4 mb-6">
          {!profile.is_premium && (
            <Button 
              onPress={() => router.push('/premium/subscription')}
              className="h-16 bg-amber-500 dark:bg-amber-600"
            >
              <Ionicons name="star" size={24} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Premium'a Yüksel
              </Text>
            </Button>
          )}
          
          <Button 
            onPress={() => router.push('/(tabs)/history')}
            variant="outline"
            className="h-14 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
          >
            <Ionicons name="time" size={20} color="#3B82F6 dark:text-blue-400" />
            <Text className="text-blue-600 dark:text-blue-400 font-semibold ml-2">
              Analiz Geçmişim
            </Text>
          </Button>
          
          <Button 
            onPress={() => router.push('/(tabs)/analysis')}
            variant="outline"
            className="h-14 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
          >
            <Ionicons name="camera" size={20} color="#10B981 dark:text-green-400" />
            <Text className="text-green-600 dark:text-green-400 font-semibold ml-2">
              Yeni Analiz Yap
            </Text>
          </Button>
        </View>

        {/* Account Actions */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          🔐 Hesap Ayarları
        </Text>
        
        <Card className="p-4 mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl">
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#6B7280 dark:text-gray-400" />
              <Text className="text-gray-600 dark:text-gray-400 ml-3">Bildirimler</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF dark:text-gray-500" />
          </TouchableOpacity>
          
          <View className="h-px bg-gray-100 dark:bg-gray-700 my-2" />
          
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={20} color="#6B7280 dark:text-gray-400" />
              <Text className="text-gray-600 dark:text-gray-400 ml-3">Gizlilik</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF dark:text-gray-500" />
          </TouchableOpacity>
          
          <View className="h-px bg-gray-100 dark:bg-gray-700 my-2" />
          
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="help-circle" size={20} color="#6B7280 dark:text-gray-400" />
              <Text className="text-gray-600 dark:text-gray-400 ml-3">Yardım & Destek</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF dark:text-gray-500" />
          </TouchableOpacity>
        </Card>

        {/* Sign Out */}
        <Button 
          onPress={handleSignOut}
          variant="outline"
          className="h-14 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 mb-8"
        >
          <Ionicons name="log-out" size={20} color="#EF4444 dark:text-red-400" />
          <Text className="text-red-600 dark:text-red-400 font-semibold ml-2">
            Çıkış Yap
          </Text>
        </Button>

        {/* App Info */}
        <View className="items-center">
          <Text className="text-gray-500 dark:text-gray-500">
            Face Analysis App v1.0
          </Text>
          <Text className="text-gray-400 dark:text-gray-600 text-xs mt-1">
            Üyelik Tarihi: {new Date(profile.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}