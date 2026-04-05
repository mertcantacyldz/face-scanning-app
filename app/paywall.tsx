import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { usePremium } from '@/hooks/use-premium';
import { calculateSavings } from '@/lib/revenuecat';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURE_KEYS = [
  { iconName: 'search-outline', key: 'fullAnalysis' },
  { iconName: 'stats-chart-outline', key: 'detailedScore' },
  { iconName: 'barbell-outline', key: 'allExercises' },
  { iconName: 'trending-up-outline', key: 'progressTracking' },
  { iconName: 'calendar-outline', key: 'unlimitedHistory' },
  { iconName: 'pie-chart-outline', key: 'personalizedRecommendations' },
];

const PaywallScreen = () => {
  const { t } = useTranslation('premium');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {
    monthlyPackage,
    yearlyPackage,
    purchase,
    restore,
    isLoading,
  } = usePremium();

  console.log('💲 Paywall Screen - Monthly Package:', monthlyPackage ? 'Price: ' + monthlyPackage.product.priceString : 'UNDEFINED');
  console.log('💲 Paywall Screen - Yearly Package:', yearlyPackage ? 'Price: ' + yearlyPackage.product.priceString : 'UNDEFINED');
  console.log('💲 Paywall Screen - Is Loading:', isLoading);

  const [selectedPackage, setSelectedPackage] = useState<'yearly' | 'monthly'>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Calculate savings
  const savings = calculateSavings(monthlyPackage ?? undefined, yearlyPackage ?? undefined);

  const handlePurchase = async () => {
    const pkg = selectedPackage === 'yearly' ? yearlyPackage : monthlyPackage;
    console.log('🛒 Attempting purchase:', {
      selectedPackage,
      pkgExists: !!pkg,
      pkgIdentifier: pkg?.identifier
    });

    if (!pkg) {
      Alert.alert(t('paywall.alerts.noPackageTitle'), t('paywall.alerts.noPackageMessage'));
      return;
    }

    setPurchasing(true);
    const result = await purchase(pkg);
    setPurchasing(false);

    if (result.success) {
      Alert.alert(t('paywall.alerts.successTitle'), t('paywall.alerts.successMessage'), [
        { text: t('paywall.alerts.successButton'), onPress: () => router.back() },
      ]);
    } else if (result.errorCode === 'ALREADY_OWNED') {
      // Logic for Apple Reviewer rejection fix:
      // If product is already owned, trigger a silent restore and show success
      console.log('ℹ️ Product already owned, triggering automatic restore...');
      setRestoring(true);
      const restoreResult = await restore();
      setRestoring(false);

      if (restoreResult.isPremium) {
        Alert.alert(
          t('paywall.alerts.restoreSuccessTitle'),
          t('paywall.alerts.successMessage'), // Use "Activated" instead of "Restored" for better UX here
          [{ text: t('paywall.alerts.successButton'), onPress: () => router.back() }]
        );
      } else {
        // This shouldn't really happen if StoreKit said it's already owned
        Alert.alert(t('paywall.alerts.noPackageTitle'), result.error);
      }
    } else if (result.error && result.error !== 'cancelled') {
      Alert.alert(t('paywall.alerts.noPackageTitle'), result.error);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restore();
    setRestoring(false);

    if (result.success && result.isPremium) {
      Alert.alert(t('paywall.alerts.restoreSuccessTitle'), t('paywall.alerts.restoreSuccessMessage'), [
        { text: t('paywall.alerts.successButton'), onPress: () => router.back() },
      ]);
    } else if (result.success && !result.isPremium) {
      Alert.alert(t('paywall.alerts.restoreInfoTitle'), t('paywall.alerts.restoreInfoMessage'));
    } else {
      Alert.alert(t('paywall.alerts.restoreErrorTitle'), result.error || t('paywall.alerts.restoreErrorMessage'));
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If loading is done but packages are missing (e.g. network error)
  if (!monthlyPackage && !yearlyPackage) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Ionicons name="cloud-offline-outline" size={64} color="#8B5CF6" style={{ marginBottom: 16 }} />
        <Text className="text-xl font-bold text-center mb-2">
          {t('paywall.alerts.noPackageTitle')}
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          {t('paywall.alerts.noPackageMessage')}
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="bg-primary/10 px-6 py-3 rounded-full"
        >
          <Text className="text-primary font-bold">{t('common.close', { defaultValue: 'Close' })}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="bg-primary/10 pb-2 px-6">
          {/* Close button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-3 right-4 w-7 h-7 rounded-full bg-black/10 items-center justify-center z-10"
          >
            <Text className="text-xl">×</Text>
          </Pressable>

          <View className="items-center">
            <Ionicons name="diamond-outline" size={32} color="#8B5CF6" style={{ marginBottom: 4, marginTop: 4 }} />
            <Text className="text-xl font-bold text-center mb-0.5">
              {t('paywall.title')}
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              {t('paywall.subtitle')}
            </Text>
          </View>
        </View>

        {/* Features */}
        <View className="px-6 py-2 mb-4 mt-1">
          <Card className="p-3 bg-card border border-border">
            <Text className="text-[15px] font-bold mt-1">{t('paywall.featuresTitle')}</Text>
            <View className="gap-1.5">
              {FEATURE_KEYS.map((feature, index) => (
                <View key={index} className="flex-row items-center">
                  <Ionicons name={feature.iconName as any} size={18} color="#8B5CF6" />
                  <Text className="text-[14px] text-foreground flex-1 ml-2">{t(`paywall.features.${feature.key}`)}</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Packages */}
        <View className="px-6 pb-2">
          <Text className="text-sm font-bold mb-3">{t('paywall.plans.selectPlan')}</Text>

          {/* Yearly Package */}
          <Pressable
            onPress={() => setSelectedPackage('yearly')}
            className="mb-3"
          >
            <Card
              className={`p-3 border-2 ${selectedPackage === 'yearly'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
                }`}
            >
              {/* Best Value Badge */}
              <View className="absolute -top-2 left-4 bg-primary px-2 py-0.5 rounded-full z-10">
                <Text className="text-primary-foreground text-[10px] font-bold">
                  {t('paywall.plans.mostPopular')}
                </Text>
              </View>

              <View className="flex-row items-center justify-between mt-1 pr-8">
                <View>
                  <Text className="text-base font-bold text-foreground">
                    {t('paywall.plans.yearly')}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {yearlyPackage ? `${(yearlyPackage.product.price / 12).toFixed(2)}${t('paywall.plans.perMonth')}` : `$3.83${t('paywall.plans.perMonth')}`}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-bold text-foreground">
                    {yearlyPackage?.product.priceString || '$45.99'}
                  </Text>
                  <View className="bg-green-100 px-2 py-0.5 rounded-full mt-0.5">
                    <Text className="text-green-800 text-[10px] font-semibold">
                      {t('paywall.plans.save', { percent: savings || 52 })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Selection indicator */}
              <View
                className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 items-center justify-center flex-row ${selectedPackage === 'yearly'
                  ? 'border-primary bg-primary' // Changed here to flex-row and items-center
                  : 'border-muted-foreground'
                  }`}
              >
                {selectedPackage === 'yearly' && (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" style={{ marginLeft: 1, marginTop: 1 }} />
                )}
              </View>
            </Card>
          </Pressable>

          {/* Monthly Package */}
          <Pressable
            onPress={() => setSelectedPackage('monthly')}
          >
            <Card
              className={`p-3 border-2 ${selectedPackage === 'monthly'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
                }`}
            >
              <View className="flex-row items-center justify-between pr-8">
                <View>
                  <Text className="text-base font-bold text-foreground">
                    {t('paywall.plans.monthly')}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {t('paywall.plans.renewsMonthly')}
                  </Text>
                </View>
                <Text className="text-xl font-bold text-foreground">
                  {monthlyPackage?.product.priceString || '$7.99'}
                </Text>
              </View>

              {/* Selection indicator */}
              <View
                className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 items-center justify-center flex-row ${selectedPackage === 'monthly'
                  ? 'border-primary bg-primary' // Changed here to flex-row and items-center
                  : 'border-muted-foreground'
                  }`}
              >
                {selectedPackage === 'monthly' && (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" style={{ marginLeft: 1, marginTop: 1 }} />
                )}
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Terms */}
        <View className="px-6 pb-4">
          <Text
            style={{
              fontSize: 12,
              color: isDark ? '#94A3B8' : '#64748B',
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            {t('paywall.termsPrefix')}
            <Text
              className="text-primary underline font-semibold"
              onPress={() => WebBrowser.openBrowserAsync('https://faceloom.netlify.app/terms.html')}
            >
              {t('paywall.termsOfUse')}
            </Text>
            {t('paywall.and')}
            <Text
              className="text-primary underline font-semibold"
              onPress={() => WebBrowser.openBrowserAsync('https://faceloom.netlify.app/privacy.html')}
            >
              {t('paywall.privacyPolicy')}
            </Text>
            {t('paywall.termsSuffix')}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: isDark ? '#64748B' : '#94A3B8',
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 14,
              paddingHorizontal: 8,
            }}
          >
            Payment charged to Apple ID at confirmation. Subscription auto-renews unless canceled 24h before period ends. Account charged for renewal within 24h prior to end. Manage/cancel in App Store settings. Standard Apple{' '}
            <Text
              className="text-primary underline"
              onPress={() => WebBrowser.openBrowserAsync('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
            >
              Terms of Use (EULA)
            </Text>{' '}
            apply.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4 pb-6">
        {/* Purchase Button */}
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing || restoring}
          className={`py-3.5 rounded-lg items-center mb-2 ${purchasing || restoring ? 'bg-primary/50' : 'bg-primary'
            }`}
        >
          {purchasing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-bold text-base">
              {selectedPackage === 'yearly' ? t('paywall.cta.startYearly') : t('paywall.cta.startMonthly')}
            </Text>
          )}
        </Pressable>

        {/* Restore Button */}
        <Pressable
          onPress={handleRestore}
          disabled={purchasing || restoring}
          className="py-1 items-center"
        >
          {restoring ? (
            <ActivityIndicator color="#007AFF" size="small" />
          ) : (
            <Text className="text-primary text-xs font-semibold">
              {t('paywall.cta.restore')}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default PaywallScreen;
