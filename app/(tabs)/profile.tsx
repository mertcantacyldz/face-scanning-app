// app/(tabs)/profile.tsx
import { LanguageSelector } from '@/components/LanguageSelector';
import { CompleteProfileBanner } from '@/components/profile/CompleteProfileBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/hooks/use-premium';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  gender: string | null;
}

export default function ProfileScreen() {
  const { t } = useTranslation('profile');
  const { isAnonymous } = useAuth();
  const { isPremium: isRevenueCatPremium } = usePremium();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<string | null>(null);

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
        setGender(profileData.gender);
      } else {
        Alert.alert(t('errors.title', { ns: 'errors' }), t('notFound'));
      }
    } catch (error) {
      console.error('Error:', error);
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
          gender: gender,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, full_name: fullName.trim(), gender: gender });
      setEditMode(false);
      Alert.alert(t('states.success', { ns: 'common' }), t('alerts.profileUpdateSuccess'));
    } catch (error) {
      Alert.alert(t('errors.title', { ns: 'errors' }), t('alerts.profileUpdateError'));
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('signOut.confirmTitle'),
      t('signOut.confirmMessage'),
      [
        { text: t('signOut.cancelButton'), style: 'cancel' },
        {
          text: t('signOut.confirmButton'),
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
      <View className="flex-1 bg-background justify-center items-center">
        <View className="items-center">
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Ionicons name="person-circle" size={48} className="text-primary" />
          </View>
          <Text className="text-muted-foreground mt-2">{t('loading')}</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <View className="items-center px-6">
          <View className="w-16 h-16 bg-destructive/10 rounded-full items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={48} className="text-destructive" />
          </View>
          <Text className="text-muted-foreground mt-2 text-center">{t('notFound')}</Text>
          <Button onPress={fetchProfile} className="mt-6">
            <Text className="text-primary-foreground font-semibold">{t('retryButton')}</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
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
        {/* Complete Profile Banner */}
        {profile && (
          <CompleteProfileBanner
            fullName={profile.full_name}
            gender={profile.gender}
          />
        )}

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
                placeholder={t('editProfile.fullNameLabel')}
                className="text-center text-lg text-foreground"
                placeholderTextColor="hsl(220, 9%, 46%)"
                autoFocus
              />

              {/* Gender Selector */}
              <View className="space-y-2">
                <Text className="text-sm font-medium text-muted-foreground text-center">
                  Cinsiyet
                </Text>
                <View className="flex-row gap-2">
                  <Button
                    onPress={() => setGender('female')}
                    variant={gender === 'female' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <Text className={gender === 'female' ? 'text-primary-foreground' : 'text-foreground'}>
                      Kadın
                    </Text>
                  </Button>
                  <Button
                    onPress={() => setGender('male')}
                    variant={gender === 'male' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <Text className={gender === 'male' ? 'text-primary-foreground' : 'text-foreground'}>
                      Erkek
                    </Text>
                  </Button>
                  <Button
                    onPress={() => setGender('other')}
                    variant={gender === 'other' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <Text className={gender === 'other' ? 'text-primary-foreground' : 'text-foreground'}>
                      Diğer
                    </Text>
                  </Button>
                </View>
              </View>

              <View className="flex-row gap-3">
                <Button
                  onPress={updateProfile}
                  className="flex-1 bg-success"
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text className="text-success-foreground font-semibold ml-2">{t('editProfile.saveButton')}</Text>
                </Button>
                <Button
                  onPress={() => {
                    setEditMode(false);
                    setFullName(profile.full_name);
                    setGender(profile.gender);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Text className="text-muted-foreground">{t('editProfile.cancelButton')}</Text>
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
                variant={(isRevenueCatPremium || profile.is_premium) ? "default" : "secondary"}
                className={(isRevenueCatPremium || profile.is_premium) ?
                  "bg-warning" :
                  "bg-secondary"
                }
              >
                <Ionicons
                  name={(isRevenueCatPremium || profile.is_premium) ? "star" : "person"}
                  size={14}
                  color="white"
                  className="mr-1"
                />
                <Text className="text-white font-semibold">
                  {(isRevenueCatPremium || profile.is_premium) ? t('membership.premium') : t('membership.standard')}
                </Text>
              </Badge>
            </>
          )}
        </View>

        {/* Premium Status Card */}
        {(isRevenueCatPremium || profile.is_premium) && profile.premium_expires_at && (
          <Card className="p-5 mb-6 bg-warning/10 border-2 border-warning/30">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-warning rounded-full items-center justify-center mr-3">
                <Ionicons name="star" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-lg text-foreground">
                  {t('membership.title')}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {new Date(profile.premium_expires_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Stats Section */}
        <Card className="p-6 mb-6">
          <View className="flex-row items-center gap-2 mb-5">
            <Ionicons name="bar-chart-outline" size={20} color="#8B5CF6" />
            <Text className="text-lg font-bold text-foreground">
              {t('stats.title')}
            </Text>
          </View>

          <View className="space-y-4">
            <View className="flex-row justify-between items-center py-3 border-b border-border">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center mr-3">
                  <Ionicons name="analytics" size={16} className="text-primary" />
                </View>
                <Text className="text-muted-foreground">{t('stats.totalAnalysis')}</Text>
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
                <Text className="text-muted-foreground">{t('stats.thisMonth')}</Text>
              </View>
              <Text className="text-lg font-bold text-success">
                3
              </Text>
            </View>

            {!isRevenueCatPremium && !profile.is_premium && (
              <View className="flex-row justify-between items-center py-3">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-warning/10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="alert-circle" size={16} className="text-warning" />
                  </View>
                  <Text className="text-muted-foreground">{t('stats.remainingLimit')}</Text>
                </View>
                <Text className="text-lg font-bold text-warning">
                  2/5
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Quick Actions */}
        <View className="flex-row items-center gap-2 mb-4">
          <Ionicons name="flash-outline" size={20} color="#8B5CF6" />
          <Text className="text-lg font-bold text-foreground">
            {t('quickActions.title')}
          </Text>
        </View>

        <View className="flex flex-col gap-4 mb-6">
          {!isRevenueCatPremium && !profile.is_premium && (
            <Button
              onPress={() => router.push('/premium/subscribe')}
              className="h-16 bg-warning"
            >
              <Ionicons name="star" size={24} color="white" />
              <Text className="text-warning-foreground font-bold text-base ml-2">
                {t('quickActions.upgradePremium')}
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
              {t('quickActions.newAnalysis')}
            </Text>
          </Button>
        </View>

        {/* Account Actions */}
        <View className="flex-row items-center gap-2 mb-4">
          <Ionicons name="key-outline" size={20} color="#8B5CF6" />
          <Text className="text-lg font-bold text-foreground">
            {t('settings.title')}
          </Text>
        </View>

        <Card className="p-4 mb-6">
          {/* Language Selector */}
          <View className="py-3">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="language-outline" size={20} className="text-primary" />
              <Text className="text-foreground font-semibold">
                Dil / Language
              </Text>
            </View>
            <LanguageSelector />
          </View>

          <View className="h-px bg-border my-2" />

          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} className="text-muted-foreground" />
              <Text className="text-foreground ml-3">{t('settings.notifications')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
          </TouchableOpacity>

          <View className="h-px bg-border my-2" />

          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={20} className="text-muted-foreground" />
              <Text className="text-foreground ml-3">{t('settings.privacy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
          </TouchableOpacity>

          <View className="h-px bg-border my-2" />

          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="help-circle" size={20} className="text-muted-foreground" />
              <Text className="text-foreground ml-3">{t('settings.help')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
          </TouchableOpacity>
        </Card>

        {/* Sign Out - Only for authenticated (non-anonymous) users */}
        {!isAnonymous && (
          <Button
            onPress={handleSignOut}
            variant="outline"
            className="h-14 border-destructive/30 bg-destructive/10 mb-8"
          >
            <Ionicons name="log-out" size={20} className="text-destructive" />
            <Text className="text-destructive font-semibold ml-2">
              {t('signOut.button')}
            </Text>
          </Button>
        )}

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