import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getQuickConsistencyStatus, type ConsistencyLevel } from '@/lib/normalization';

interface ConsistencyBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onPress?: () => void;
}

export function ConsistencyBadge({
  score,
  size = 'medium',
  showLabel = true,
  onPress,
}: ConsistencyBadgeProps) {
  const { t } = useTranslation('home');
  const status = getQuickConsistencyStatus(score);

  const sizeStyles = {
    small: {
      container: 'px-2 py-1',
      icon: 14,
      text: 'text-xs',
    },
    medium: {
      container: 'px-3 py-1.5',
      icon: 16,
      text: 'text-sm',
    },
    large: {
      container: 'px-4 py-2',
      icon: 20,
      text: 'text-base',
    },
  };

  const styles = sizeStyles[size];

  const content = (
    <View
      className={`flex-row items-center rounded-full ${styles.container}`}
      style={{ backgroundColor: `${status.color}20` }}
    >
      <Ionicons
        name={status.icon as keyof typeof Ionicons.glyphMap}
        size={styles.icon}
        color={status.color}
      />
      {showLabel && (
        <Text
          className={`${styles.text} font-medium ml-1.5`}
          style={{ color: status.color }}
        >
          {t(`multiPhoto.consistency.${status.level}`)}
        </Text>
      )}
      <Text
        className={`${styles.text} font-bold ml-1`}
        style={{ color: status.color }}
      >
        %{Math.round(score)}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
}

interface ConsistencyWarningCardProps {
  score: number;
  onRetake: () => void;
  onContinue: () => void;
}

export function ConsistencyWarningCard({
  score,
  onRetake,
  onContinue,
}: ConsistencyWarningCardProps) {
  const { t } = useTranslation('home');
  const status = getQuickConsistencyStatus(score);

  if (status.level !== 'poor') {
    return null;
  }

  return (
    <View className="bg-red-500/10 rounded-2xl p-4 mx-4 border border-red-500/30">
      <View className="flex-row items-center mb-3">
        <Ionicons name="warning" size={24} color="#EF4444" />
        <Text className="text-base font-semibold text-red-500 ml-2">
          {t('multiPhoto.consistency.poor')}
        </Text>
      </View>

      <Text className="text-sm text-muted-foreground mb-4">
        {t('multiPhoto.lowConsistencyWarning', {
          defaultValue: 'Fotoğraflar arasında tutarsızlık var. Sonuçlar güvenilir olmayabilir.',
        })}
      </Text>

      <View className="flex-row space-x-3">
        <Pressable
          onPress={onRetake}
          className="flex-1 bg-red-500 rounded-xl py-3 items-center"
        >
          <Text className="text-white font-semibold">
            {t('multiPhoto.retakePhotos', { defaultValue: 'Fotoğrafları Değiştir' })}
          </Text>
        </Pressable>

        <Pressable
          onPress={onContinue}
          className="flex-1 bg-muted rounded-xl py-3 items-center"
        >
          <Text className="text-foreground font-semibold">
            {t('multiPhoto.continueAnyway', { defaultValue: 'Yine de Devam Et' })}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
