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
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Profile {
  id: string;
  user_id: string;
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
  const { isPremium, restore } = usePremium();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

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
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setProfile({ ...profile, full_name: fullName.trim(), gender: gender });
      setEditMode(false);
      Alert.alert(t('states.success', { ns: 'common' }), t('alerts.profileUpdateSuccess'));
    } catch (error) {
      console.error('Profile update error:', error);
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

  const handleRestorePurchases = async () => {
    setRestoring(true);
    try {
      const result = await restore();
      if (result.isPremium) {
        Alert.alert(
          t('restore.successTitle'),
          t('restore.successMessage')
        );
      } else {
        Alert.alert(
          t('restore.noSubscriptionTitle'),
          t('restore.noSubscriptionMessage')
        );
      }
    } catch (error) {
      Alert.alert(
        t('restore.errorTitle'),
        t('restore.errorMessage')
      );
    } finally {
      setRestoring(false);
    }
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
            <View className="w-full max-w-xs">
              <Input
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('editProfile.fullNameLabel')}
                className="text-center text-[20px] text-foreground mb-2"
                placeholderTextColor="hsl(220, 9%, 46%)"
                autoFocus
              />

              {/* Gender Selector */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-muted-foreground text-center mb-3">
                  {t('editProfile.genderLabel')}
                </Text>
                <View className="flex-row gap-2">
                  <Button
                    onPress={() => setGender('female')}
                    variant={gender === 'female' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <Text className={gender === 'female' ? 'text-primary-foreground' : 'text-foreground'}>
                      {t('editProfile.genderFemale')}
                    </Text>
                  </Button>
                  <Button
                    onPress={() => setGender('male')}
                    variant={gender === 'male' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <Text className={gender === 'male' ? 'text-primary-foreground' : 'text-foreground'}>
                      {t('editProfile.genderMale')}
                    </Text>
                  </Button>
                  <Button
                    onPress={() => setGender('other')}
                    variant={gender === 'other' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <Text className={gender === 'other' ? 'text-primary-foreground' : 'text-foreground'}>
                      {t('editProfile.genderOther')}
                    </Text>
                  </Button>
                </View>
              </View>

              <View className="flex-row gap-3 mt-2">
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
                variant={isPremium ? "default" : "secondary"}
                className={isPremium ?
                  "bg-warning" :
                  "bg-secondary"
                }
              >
                <Ionicons
                  name={isPremium ? "star" : "person"}
                  size={14}
                  color="white"
                  className="mr-1"
                />
                <Text className="text-white font-semibold">
                  {isPremium ? t('membership.premium') : t('membership.standard')}
                </Text>
              </Badge>
            </>
          )}
        </View>

        {/* Premium Status Card */}
        {isPremium && profile.premium_expires_at && (
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
                  <Ionicons name="analytics" size={16} color="#8B5CF6" />
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
                  <Ionicons name="calendar" size={16} color="#10B981" />
                </View>
                <Text className="text-muted-foreground">{t('stats.thisMonth')}</Text>
              </View>
              <Text className="text-lg font-bold text-success">
                3
              </Text>
            </View>

            {!isPremium && (
              <View className="flex-row justify-between items-center py-3">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-warning/10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="alert-circle" size={16} color="#F59E0B" />
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
          {!isPremium && (
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
            <Ionicons name="camera" size={20} color="#10B981" />
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
              <Ionicons name="language-outline" size={20} color="#8B5CF6" />
              <Text className="text-foreground font-semibold">
                Dil / Language
              </Text>
            </View>
            <LanguageSelector />
          </View>

          <View className="h-px bg-border my-2" />

          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#8B5CF6" />
              <Text className="text-foreground ml-3">{t('settings.notifications')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
          </TouchableOpacity>

          <View className="h-px bg-border my-2" />

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            onPress={() => WebBrowser.openBrowserAsync('https://faceloom.netlify.app/privacy')}
          >
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
              <Text className="text-foreground ml-3">{t('settings.privacy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
          </TouchableOpacity>

          <View className="h-px bg-border my-2" />

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            onPress={() => WebBrowser.openBrowserAsync('https://faceloom.netlify.app/terms')}
          >
            <View className="flex-row items-center">
              <Ionicons name="document-text" size={20} color="#8B5CF6" />
              <Text className="text-foreground ml-3">{t('settings.terms')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
          </TouchableOpacity>

          {/* Restore Purchases - Only show for non-premium users */}
          {!isPremium && (
            <>
              <View className="h-px bg-border my-2" />

              <TouchableOpacity
                className="flex-row items-center justify-between py-3"
                onPress={handleRestorePurchases}
                disabled={restoring}
              >
                <View className="flex-row items-center">
                  <Ionicons name="refresh" size={20} color="#8B5CF6" />
                  <Text className="text-foreground ml-3">
                    {restoring ? t('restore.loading') : t('restore.button')}
                  </Text>
                </View>
                {restoring ? (
                  <ActivityIndicator size="small" color="#8B5CF6" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
                )}
              </TouchableOpacity>
            </>
          )}
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
            FaceLoom v1.0
          </Text>
          <Text className="text-muted-foreground/70 text-xs mt-1">
            Üyelik Tarihi: {new Date(profile.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>

        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}