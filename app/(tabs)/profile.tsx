// app/(tabs)/profile.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
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
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <View className="items-center">
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Ionicons name="person-circle" size={48} className="text-primary" />
          </View>
          <Text className="text-muted-foreground mt-2">Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <View className="items-center px-6">
          <View className="w-16 h-16 bg-destructive/10 rounded-full items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={48} className="text-destructive" />
          </View>
          <Text className="text-muted-foreground mt-2 text-center">Profil bilgileri bulunamadı</Text>
          <Button onPress={fetchProfile} className="mt-6">
            <Text className="text-primary-foreground font-semibold">Tekrar Dene</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["hsl(262, 83%, 58%)"]}
            tintColor="hsl(262, 83%, 58%)"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="items-center mb-8">
          <View className="relative mb-4">
            <View className="w-24 h-24 bg-primary rounded-full justify-center items-center shadow-lg">
              <Ionicons name="person" size={48} color="white" />
            </View>
            <TouchableOpacity
              onPress={() => setEditMode(!editMode)}
              className="absolute bottom-0 right-0 bg-card rounded-full p-2 shadow-md border-2 border-border"
            >
              <Ionicons
                name={editMode ? "close" : "create"}
                size={20}
                className="text-primary"
              />
            </TouchableOpacity>
          </View>

          {editMode ? (
            <View className="w-full max-w-xs space-y-4">
              <Input
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ad Soyad"
                className="text-center text-lg text-foreground"
                placeholderTextColor="hsl(220, 9%, 46%)"
                autoFocus
              />
              <View className="flex-row gap-3">
                <Button
                  onPress={updateProfile}
                  className="flex-1 bg-success"
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text className="text-success-foreground font-semibold ml-2">Kaydet</Text>
                </Button>
                <Button
                  onPress={() => {
                    setEditMode(false);
                    setFullName(profile.full_name);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Text className="text-muted-foreground">İptal</Text>
                </Button>
              </View>
            </View>
          ) : (
            <>
              <Text className="text-2xl font-bold text-foreground mb-1">
                {profile.full_name}
              </Text>
              <Text className="text-muted-foreground mb-3">{profile.email}</Text>
              <Badge
                variant={profile.is_premium ? "default" : "secondary"}
                className={profile.is_premium ?
                  "bg-warning" :
                  "bg-secondary"
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
          <Card className="p-5 mb-6 bg-warning/10 border-2 border-warning/30">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-warning rounded-full items-center justify-center mr-3">
                <Ionicons name="star" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-lg text-foreground">
                  Premium Üyelik
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Bitiş: {new Date(profile.premium_expires_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Stats Section */}
        <Card className="p-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-5">
            📊 Hesap İstatistikleri
          </Text>

          <View className="space-y-4">
            <View className="flex-row justify-between items-center py-3 border-b border-border">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center mr-3">
                  <Ionicons name="analytics" size={16} className="text-primary" />
                </View>
                <Text className="text-muted-foreground">Toplam Analiz</Text>
              </View>
              <Text className="text-lg font-bold text-primary">
                12
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-3 border-b border-border">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-success/10 rounded-full items-center justify-center mr-3">
                  <Ionicons name="calendar" size={16} className="text-success" />
                </View>
                <Text className="text-muted-foreground">Bu Ay</Text>
              </View>
              <Text className="text-lg font-bold text-success">
                3
              </Text>
            </View>

            {!profile.is_premium && (
              <View className="flex-row justify-between items-center py-3">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-warning/10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="alert-circle" size={16} className="text-warning" />
                  </View>
                  <Text className="text-muted-foreground">Kalan Limit</Text>
                </View>
                <Text className="text-lg font-bold text-warning">
                  2/5
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Quick Actions */}
        <Text className="text-lg font-bold text-foreground mb-4">
          ⚡ Hızlı İşlemler
        </Text>

        <View className="flex flex-col gap-4 mb-6">
          {!profile.is_premium && (
            <Button
              onPress={() => router.push('/premium/subscription')}
              className="h-16 bg-warning"
            >
              <Ionicons name="star" size={24} color="white" />
              <Text className="text-warning-foreground font-bold text-base ml-2">
                Premium'a Yüksel
              </Text>
            </Button>
          )}

          <Button
            onPress={() => router.push('/(tabs)/analysis')}
            variant="outline"
            className="h-14 border-success/30 bg-success/10"
          >
            <Ionicons name="camera" size={20} className="text-success" />
            <Text className="text-success font-semibold ml-2">
              Yeni Analiz Yap
            </Text>
          </Button>
        </View>

        {/* Account Actions */}
        <Text className="text-lg font-bold text-foreground mb-4">
          🔐 Hesap Ayarları
        </Text>

        <Card className="p-4 mb-6">
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} className="text-muted-foreground" />
              <Text className="text-foreground ml-3">Bildirimler</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
          </TouchableOpacity>

          <View className="h-px bg-border my-2" />

          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={20} className="text-muted-foreground" />
              <Text className="text-foreground ml-3">Gizlilik</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
          </TouchableOpacity>

          <View className="h-px bg-border my-2" />

          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="help-circle" size={20} className="text-muted-foreground" />
              <Text className="text-foreground ml-3">Yardım & Destek</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
          </TouchableOpacity>
        </Card>

        {/* Sign Out */}
        <Button
          onPress={handleSignOut}
          variant="outline"
          className="h-14 border-destructive/30 bg-destructive/10 mb-8"
        >
          <Ionicons name="log-out" size={20} className="text-destructive" />
          <Text className="text-destructive font-semibold ml-2">
            Çıkış Yap
          </Text>
        </Button>

        {/* App Info */}
        <View className="items-center">
          <Text className="text-muted-foreground">
            Face Analysis App v1.0
          </Text>
          <Text className="text-muted-foreground/70 text-xs mt-1">
            Üyelik Tarihi: {new Date(profile.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}