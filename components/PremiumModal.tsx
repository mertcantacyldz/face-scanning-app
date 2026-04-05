import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string; // e.g., "Nose Analysis", "Progress Tracking"
  featureIconName?: string; // Ionicons name
}

const PREMIUM_BENEFIT_KEYS = [
  'detailedAnalysis',
  'personalizedExercises',
  'progressTracking',
  'unlimitedHistory',
];

export function PremiumModal({
  visible,
  onClose,
  feature = '',
  featureIconName = 'lock-closed-outline',
}: PremiumModalProps) {
  const { t } = useTranslation('premium');
  const { isAnonymous } = useAuth();

  const handleGoPremium = () => {
    onClose();
    router.push('/paywall');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <Card className="w-full max-w-sm bg-background rounded-2xl overflow-hidden max-h-[93%]">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="bg-primary/10 pt-4 pb-4 px-6 items-center">
              <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
                <Ionicons name={featureIconName as any} size={48} color="#8B5CF6" />
              </View>
              <Text className="text-xl font-bold text-center text-foreground">
                {t('modal.title')}
              </Text>
              <Text className="text-muted-foreground text-center mt-1">
                {t('modal.subtitle', { feature: feature || t('modal.title') })}
              </Text>
            </View>

            {/* Benefits */}
            <View className="px-6 py-4">
              <Text className="text-sm font-semibold text-foreground mb-3">
                {t('modal.benefitsTitle')}
              </Text>
              <View className="gap-2">
                {PREMIUM_BENEFIT_KEYS.map((benefitKey, index) => (
                  <View key={index} className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text className="text-sm text-foreground ml-2">{t(`modal.benefits.${benefitKey}`)}</Text>
                  </View>
                ))}
              </View>
            </View>


            {/* Price Preview */}
            <View className="px-6 py-3 gap-3">
              {/* Monthly Plan */}
              <View className="flex-1 rounded-xl p-3 border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-xs font-semibold text-muted-foreground">
                      {t('modal.price.monthly')}
                    </Text>
                    <Text className="font-bold text-foreground">
                      {t('modal.price.monthlyAmount')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Yearly Plan */}
              <View className="flex-1 rounded-xl p-3 border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-xs font-semibold text-muted-foreground">
                      {t('modal.price.yearly')}
                    </Text>
                    <Text className="font-bold text-foreground">
                      {t('modal.price.amount')}
                    </Text>
                  </View>
                  <View className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    <Text className="text-green-800 dark:text-green-400 text-[10px] font-bold">
                      {t('modal.price.save', { percent: 52 })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="p-6 pt-2 gap-3">
              <Pressable
                onPress={handleGoPremium}
                className="bg-primary py-4 rounded-xl items-center active:opacity-80"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="star" size={20} color="#FFFFFF" />
                  <Text className="text-primary-foreground font-bold text-base">
                    {t('modal.buttons.upgrade')}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={onClose}
                className="py-3 items-center active:opacity-70"
              >
                <Text className="text-muted-foreground">
                  {t('modal.buttons.maybeLater')}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
}

export default PremiumModal;
