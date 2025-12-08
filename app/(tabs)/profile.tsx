import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_premium: boolean;
  premium_expires_at: string | null;
  created_at: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
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

  const handleSignOut = async () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
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
      <View className="flex-1 bg-background justify-center items-center">
        <View className="items-center">
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Ionicons name="person-circle" size={48} color="#8B5CF6" />
          </View>
          <Text className="text-muted-foreground mt-2">Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <View className="items-center px-6">
          <View className="w-16 h-16 bg-destructive/10 rounded-full items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text className="text-muted-foreground mt-2 text-center">
            Profil bilgileri bulunamadı
          </Text>
          <Button onPress={fetchProfile} className="mt-6">
            <Text className="text-primary-foreground font-semibold">Tekrar Dene</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#8B5CF6', '#6366F1', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-12 "
        >
          <View className="items-center mt-2 ">
            {/* Avatar */}
            <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-3 border-3 border-white/30">
              <Text className="text-4xl">
                {profile.full_name?.charAt(0).toUpperCase() || '👤'}
              </Text>
            </View>

            {/* Name & Email */}
            <Text className="text-xl font-bold text-white mb-1">
              {profile.full_name || 'Kullanıcı'}
            </Text>
            <Text className="text-sm text-white/80 mb-3">{profile.email}</Text>

            {/* Premium Badge */}
            {profile.is_premium ? (
              <View className="flex-row items-center bg-amber-400 px-4 py-2 rounded-full mb-8">
                <Ionicons name="star" size={18} color="white" />
                <Text className="text-white font-bold ml-2">Premium Üye</Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-white/20 px-4 py-2 rounded-full mb-8">
                <Ionicons name="person" size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Ücretsiz Üye</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View className="px-4 -mt-4">
          {/* Stats Cards */}
          <View className="flex-row gap-3 mb-6 shadow-2xl" style={{ elevation: 8 }}>
            <Card className="flex-1 bg-card border-border">
              <View className="py-3 px-2 items-center">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mb-1">
                  <Ionicons name="analytics" size={20} color="#8B5CF6" />
                </View>
                <Text className="text-xl font-bold text-foreground">12</Text>
                <Text className="text-[10px] text-muted-foreground">Toplam Analiz</Text>
              </View>
            </Card>

            <Card className="flex-1 bg-card border-border">
              <View className="py-3 px-2 items-center">
                <View className="w-10 h-10 rounded-full bg-success/10 items-center justify-center mb-1">
                  <Ionicons name="calendar" size={20} color="#10B981" />
                </View>
                <Text className="text-xl font-bold text-foreground">3</Text>
                <Text className="text-[10px] text-muted-foreground">Bu Ay</Text>
              </View>
            </Card>

            {!profile.is_premium && (
              <Card className="flex-1 bg-card border-border">
                <View className="py-3 px-2 items-center">
                  <View className="w-10 h-10 rounded-full bg-amber-400/10 items-center justify-center mb-1">
                    <Ionicons name="hourglass" size={20} color="#F59E0B" />
                  </View>
                  <Text className="text-xl font-bold text-foreground">2/5</Text>
                  <Text className="text-[10px] text-muted-foreground">Kalan Hak</Text>
                </View>
              </Card>
            )}
          </View>

          {/* Premium Upgrade Card */}
          {!profile.is_premium && (
            <View className="mb-6 rounded-xl overflow-hidden shadow-lg">
              <LinearGradient
                colors={['#FBBF24', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24 }}
              >
                <View className="flex-row items-center mb-3">
                  <Ionicons name="star" size={28} color="white" />
                  <Text className="text-xl font-bold text-white ml-2">
                    Premium&apos;a Yükseltin
                  </Text>
                </View>
                <Text className="text-white/90 mb-4 leading-5">
                  Sınırsız analiz, gelişmiş raporlar ve özel öneriler için premium üyeliğe
                  geçin
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/premium/subscription')}
                  className="bg-white rounded-xl py-3 px-6 flex-row items-center justify-center"
                >
                  <Ionicons name="arrow-forward" size={20} color="#D97706" />
                  <Text className="text-amber-600 font-bold ml-2">Şimdi Yükselt</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Premium Expiry Info */}
          {profile.is_premium && profile.premium_expires_at && (
            <Card className="mb-6 bg-amber-50 border-amber-200">
              <View className="p-4 flex-row items-center">
                <Ionicons name="information-circle" size={24} color="#D97706" />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-foreground">Premium Üyelik</Text>
                  <Text className="text-sm text-muted-foreground">
                    Bitiş: {new Date(profile.premium_expires_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Quick Actions */}
          <Text className="text-lg font-bold text-foreground mb-3">Hızlı İşlemler</Text>

          <Card className="mb-4 bg-card border-border">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              className="flex-row items-center p-4"
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="scan" size={24} color="#8B5CF6" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="font-semibold text-foreground">Yeni Analiz Yap</Text>
                <Text className="text-sm text-muted-foreground">
                  Yüzünüzü tarayın ve detaylı analiz alın
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </Card>

          <Card className="mb-4 bg-card border-border">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/analysis')}
              className="flex-row items-center p-4"
            >
              <View className="w-12 h-12 rounded-full bg-blue-500/10 items-center justify-center">
                <Ionicons name="bar-chart" size={24} color="#3B82F6" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="font-semibold text-foreground">Analiz Sonuçları</Text>
                <Text className="text-sm text-muted-foreground">
                  Son analizinizi görüntüleyin
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </Card>

          {/* Settings */}
          <Text className="text-lg font-bold text-foreground mb-3 mt-2">Ayarlar</Text>

          <Card className="mb-4 bg-card border-border">
            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center">
                <Ionicons name="notifications" size={22} color="#6B7280" />
                <Text className="text-foreground ml-3">Bildirimler</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={22} color="#6B7280" />
                <Text className="text-foreground ml-3">Gizlilik</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <Ionicons name="help-circle" size={22} color="#6B7280" />
                <Text className="text-foreground ml-3">Yardım & Destek</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </Card>

          {/* Sign Out Button */}
          <Button
            onPress={handleSignOut}
            variant="outline"
            className="h-14 border-destructive/30 bg-destructive/5 mb-8"
          >
            <Ionicons name="log-out" size={20} color="#EF4444" />
            <Text className="text-destructive font-semibold ml-2">Çıkış Yap</Text>
          </Button>

          {/* App Info */}
          <View className="items-center mb-8">
            <Text className="text-muted-foreground text-sm">Face Analysis App v1.0</Text>
            <Text className="text-muted-foreground/70 text-xs mt-1">
              Üyelik Tarihi: {new Date(profile.created_at).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
