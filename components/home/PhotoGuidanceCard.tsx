import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface PhotoGuidanceCardProps {
  compact?: boolean;
}

const GUIDANCE_ITEMS = [
  { icon: 'eye-outline' as const, key: 'tip1' },
  { icon: 'happy-outline' as const, key: 'tip2' },
  { icon: 'sunny-outline' as const, key: 'tip3' },
  { icon: 'scan-outline' as const, key: 'tip4' },
];

export function PhotoGuidanceCard({ compact = false }: PhotoGuidanceCardProps) {
  const { t } = useTranslation('home');

  if (compact) {
    return (
      <View className="bg-primary/10 rounded-xl px-4 py-3 mx-4">
        <View className="flex-row items-center">
          <Ionicons name="information-circle" size={20} color="#6366f1" />
          <Text className="text-sm text-primary ml-2 flex-1">
            {t('guidance.tip1')} • {t('guidance.tip2')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-card rounded-2xl p-4 mx-4 border border-border">
      <View className="flex-row items-center mb-3">
        <Ionicons name="camera" size={20} color="#6366f1" />
        <Text className="text-base font-semibold text-foreground ml-2">
          {t('guidance.title')}
        </Text>
      </View>

      <View className="space-y-2">
        {GUIDANCE_ITEMS.map((item, index) => (
          <View key={index} className="flex-row items-center py-1">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ionicons name={item.icon} size={16} color="#6366f1" />
            </View>
            <Text className="text-sm text-muted-foreground flex-1">
              {t(`guidance.${item.key}`)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
