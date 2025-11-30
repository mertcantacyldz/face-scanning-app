import React from 'react';
import { View, Modal, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string; // e.g., "Burun Analizi", "İlerleme Takibi"
  featureIconName?: string; // Ionicons name
}

const PREMIUM_BENEFITS = [
  '6 bölge detaylı AI analizi',
  'Kişiselleştirilmiş egzersizler',
  'İlerleme takibi & grafikler',
  'Sınırsız analiz geçmişi',
];

export function PremiumModal({
  visible,
  onClose,
  feature = 'Bu özellik',
  featureIconName = 'lock-closed-outline',
}: PremiumModalProps) {
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
        <Card className="w-full max-w-sm bg-background rounded-2xl overflow-hidden">
          {/* Header */}
          <View className="bg-primary/10 pt-8 pb-4 px-6 items-center">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
              <Ionicons name={featureIconName as any} size={48} color="#8B5CF6" />
            </View>
            <Text className="text-xl font-bold text-center text-foreground">
              Premium Özellik
            </Text>
            <Text className="text-muted-foreground text-center mt-1">
              &quot;{feature}&quot; için Premium üyelik gerekli
            </Text>
          </View>

          {/* Benefits */}
          <View className="px-6 py-4">
            <Text className="text-sm font-semibold text-foreground mb-3">
              Premium ile neler kazanırsın:
            </Text>
            <View className="gap-2">
              {PREMIUM_BENEFITS.map((benefit, index) => (
                <View key={index} className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text className="text-sm text-foreground ml-2">{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Price Preview */}
          <View className="px-6 py-3">
            <Card className="bg-primary/5 border-primary/20 border p-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-muted-foreground">
                    Yıllık Plan
                  </Text>
                  <Text className="font-bold text-foreground">
                    $45.99/yıl
                  </Text>
                </View>
                <View className="bg-green-100 px-2 py-1 rounded-full">
                  <Text className="text-green-800 text-xs font-semibold">
                    %52 TASARRUF
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Actions */}
          <View className="p-6 pt-2 gap-3">
            <Pressable
              onPress={handleGoPremium}
              className="bg-primary py-4 rounded-xl items-center active:opacity-80"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="crown-outline" size={20} color="#FFFFFF" />
                <Text className="text-primary-foreground font-bold text-base">
                  Premium&apos;a Geç
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={onClose}
              className="py-3 items-center active:opacity-70"
            >
              <Text className="text-muted-foreground">
                Belki Sonra
              </Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

export default PremiumModal;
