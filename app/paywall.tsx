import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { usePremium } from '@/hooks/use-premium';
import { calculateSavings } from '@/lib/revenuecat';

const FEATURES = [
  { icon: '🔍', text: '6 bölge tam AI analizi' },
  { icon: '📊', text: 'Detaylı çekicilik skoru' },
  { icon: '🏋️', text: 'Tüm egzersiz adımları' },
  { icon: '📈', text: 'İlerleme takibi & grafikler' },
  { icon: '📅', text: 'Sınırsız analiz geçmişi' },
  { icon: '🎯', text: 'Kişiselleştirilmiş öneriler' },
];

const PaywallScreen = () => {
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
      Alert.alert('Hata', 'Paket bulunamadı. Lütfen daha sonra tekrar deneyin.');
      return;
    }

    setPurchasing(true);
    const result = await purchase(pkg);
    setPurchasing(false);

    if (result.success) {
      Alert.alert('Başarılı! 🎉', 'Premium üyeliğiniz aktif edildi!', [
        { text: 'Harika!', onPress: () => router.back() },
      ]);
    } else if (result.error && result.error !== 'cancelled') {
      Alert.alert('Hata', result.error);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restore();
    setRestoring(false);

    if (result.success && result.isPremium) {
      Alert.alert('Başarılı!', 'Satın alımlarınız geri yüklendi!', [
        { text: 'Harika!', onPress: () => router.back() },
      ]);
    } else if (result.success && !result.isPremium) {
      Alert.alert('Bilgi', 'Geri yüklenecek satın alım bulunamadı.');
    } else {
      Alert.alert('Hata', result.error || 'Geri yükleme başarısız');
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
            <Text className="text-6xl mb-4">👑</Text>
            <Text className="text-3xl font-bold text-center mb-2">
              Premium'a Geç
            </Text>
            <Text className="text-muted-foreground text-center">
              Tüm özelliklerin kilidini aç
            </Text>
          </View>
        </View>

        {/* Features */}
        <View className="px-6 py-6">
          <Card className="p-5 bg-card border border-border">
            <Text className="text-lg font-bold mb-4">Premium Özellikleri</Text>
            <View className="gap-3">
              {FEATURES.map((feature, index) => (
                <View key={index} className="flex-row items-center">
                  <Text className="text-2xl mr-3">{feature.icon}</Text>
                  <Text className="text-foreground flex-1">{feature.text}</Text>
                  <Text className="text-green-500 text-xl">✓</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Packages */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-bold mb-4">Plan Seçin</Text>

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
                  EN POPÜLER
                </Text>
              </View>

              <View className="flex-row items-center justify-between mt-2">
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    Yıllık Plan
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {yearlyPackage ? `${(yearlyPackage.product.price / 12).toFixed(2)}/ay` : '$3.83/ay'}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-foreground">
                    {yearlyPackage?.product.priceString || '$45.99'}
                  </Text>
                  <View className="bg-green-100 px-2 py-0.5 rounded-full mt-1">
                    <Text className="text-green-800 text-xs font-semibold">
                      %{savings || 52} TASARRUF
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
                  <Text className="text-primary-foreground text-sm">✓</Text>
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
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    Aylık Plan
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Her ay yenilenir
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
                  <Text className="text-primary-foreground text-sm">✓</Text>
                )}
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Terms */}
        <View className="px-6 pb-6">
          <Text className="text-xs text-muted-foreground text-center">
            Ödeme Apple/Google hesabınızdan alınır. Abonelik dönem sonunda otomatik
            yenilenir. İstediğiniz zaman iptal edebilirsiniz.
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
              {selectedPackage === 'yearly' ? 'Yıllık Planı Başlat' : 'Aylık Planı Başlat'}
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
              Satın Alımları Geri Yükle
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default PaywallScreen;
