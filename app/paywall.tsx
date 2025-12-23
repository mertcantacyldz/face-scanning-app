import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';
import { usePremium } from '@/hooks/use-premium';
import { calculateSavings } from '@/lib/revenuecat';

const FEATURE_KEYS = [
  { iconName: 'search-outline', key: 'fullAnalysis' },
  { iconName: 'stats-chart-outline', key: 'detailedScore' },
  { iconName: 'barbell-outline', key: 'allExercises' },
  { iconName: 'trending-up-outline', key: 'progressTracking' },
  { iconName: 'calendar-outline', key: 'unlimitedHistory' },
  { iconName: 'target-outline', key: 'personalizedRecommendations' },
];

const PaywallScreen = () => {
  const { t } = useTranslation('premium');
  const {
    monthlyPackage,
    yearlyPackage,
    purchase,
    restore,
    isLoading,
  } = usePremium();

  const [selectedPackage, setSelectedPackage] = useState<'yearly' | 'monthly'>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Calculate savings
  const savings = calculateSavings(monthlyPackage ?? undefined, yearlyPackage ?? undefined);

  const handlePurchase = async () => {
    const pkg = selectedPackage === 'yearly' ? yearlyPackage : monthlyPackage;
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

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="bg-primary/10 pt-16 pb-8 px-6">
          {/* Close button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-12 right-4 w-10 h-10 rounded-full bg-black/10 items-center justify-center"
          >
            <Text className="text-2xl">×</Text>
          </Pressable>

          <View className="items-center">
            <Ionicons name="diamond-outline" size={64} color="#8B5CF6" style={{ marginBottom: 16 }} />
            <Text className="text-3xl font-bold text-center mb-2">
              {t('paywall.title')}
            </Text>
            <Text className="text-muted-foreground text-center">
              {t('paywall.subtitle')}
            </Text>
          </View>
        </View>

        {/* Features */}
        <View className="px-6 py-6">
          <Card className="p-5 bg-card border border-border">
            <Text className="text-lg font-bold mb-4">{t('paywall.featuresTitle')}</Text>
            <View className="gap-3">
              {FEATURE_KEYS.map((feature, index) => (
                <View key={index} className="flex-row items-center">
                  <Ionicons name={feature.iconName as any} size={24} color="#8B5CF6" />
                  <Text className="text-foreground flex-1 ml-3">{t(`paywall.features.${feature.key}`)}</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Packages */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-bold mb-4">{t('paywall.plans.selectPlan')}</Text>

          {/* Yearly Package */}
          <Pressable
            onPress={() => setSelectedPackage('yearly')}
            className="mb-3"
          >
            <Card
              className={`p-5 border-2 ${
                selectedPackage === 'yearly'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              {/* Best Value Badge */}
              <View className="absolute -top-3 left-4 bg-primary px-3 py-1 rounded-full">
                <Text className="text-primary-foreground text-xs font-bold">
                  {t('paywall.plans.mostPopular')}
                </Text>
              </View>

              <View className="flex-row items-center justify-between mt-2 pr-10">
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    {t('paywall.plans.yearly')}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {yearlyPackage ? `${(yearlyPackage.product.price / 12).toFixed(2)}${t('paywall.plans.perMonth')}` : `$3.83${t('paywall.plans.perMonth')}`}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-foreground">
                    {yearlyPackage?.product.priceString || '$45.99'}
                  </Text>
                  <View className="bg-green-100 px-2 py-0.5 rounded-full mt-1">
                    <Text className="text-green-800 text-xs font-semibold">
                      {t('paywall.plans.save', { percent: savings || 52 })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Selection indicator */}
              <View
                className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 items-center justify-center ${
                  selectedPackage === 'yearly'
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}
              >
                {selectedPackage === 'yearly' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </Card>
          </Pressable>

          {/* Monthly Package */}
          <Pressable
            onPress={() => setSelectedPackage('monthly')}
          >
            <Card
              className={`p-5 border-2 ${
                selectedPackage === 'monthly'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <View className="flex-row items-center justify-between pr-10">
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    {t('paywall.plans.monthly')}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {t('paywall.plans.renewsMonthly')}
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-foreground">
                  {monthlyPackage?.product.priceString || '$7.99'}
                </Text>
              </View>

              {/* Selection indicator */}
              <View
                className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 items-center justify-center ${
                  selectedPackage === 'monthly'
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}
              >
                {selectedPackage === 'monthly' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Terms */}
        <View className="px-6 pb-6">
          <Text className="text-xs text-muted-foreground text-center">
            {t('paywall.terms')}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-6 pb-10">
        {/* Purchase Button */}
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing || restoring}
          className={`py-4 rounded-xl items-center mb-3 ${
            purchasing || restoring ? 'bg-primary/50' : 'bg-primary'
          }`}
        >
          {purchasing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-bold text-lg">
              {selectedPackage === 'yearly' ? t('paywall.cta.startYearly') : t('paywall.cta.startMonthly')}
            </Text>
          )}
        </Pressable>

        {/* Restore Button */}
        <Pressable
          onPress={handleRestore}
          disabled={purchasing || restoring}
          className="py-2 items-center"
        >
          {restoring ? (
            <ActivityIndicator color="#007AFF" size="small" />
          ) : (
            <Text className="text-primary text-sm">
              {t('paywall.cta.restore')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default PaywallScreen;
