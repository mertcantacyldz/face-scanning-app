import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Image,
  Pressable,
  View,
  useColorScheme,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/text';
import { GlassCard } from './GlassCard';

const { width: screenWidth } = Dimensions.get('window');

interface SavedPhotoCardProps {
  photoUri: string;
  savedAt: string;
  faceAnalysisId?: string | null;
  onViewResults: () => void;
  onChangePhoto: () => void;
  onNewScan: () => void;
}

// Tarihi "2 gün önce", "bugün" vb. formatına çevir
const formatRelativeDate = (isoDate: string, language: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (language === 'tr') {
    if (diffDays === 0) {
      if (diffHours < 1) return 'Az önce';
      return `${diffHours} saat önce`;
    }
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    return `${Math.floor(diffDays / 30)} ay önce`;
  } else {
    if (diffDays === 0) {
      if (diffHours < 1) return 'Just now';
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
};

export function SavedPhotoCard({
  photoUri,
  savedAt,
  faceAnalysisId,
  onViewResults,
  onChangePhoto,
  onNewScan,
}: SavedPhotoCardProps) {
  const { t, i18n } = useTranslation('home');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const relativeDate = formatRelativeDate(savedAt, i18n.language);
  const imageSize = screenWidth - 80;

  return (
    <GlassCard
      delay={200}
      borderGradient="primary"
      intensity="medium"
      style={{ padding: 24 }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-center gap-2 mb-4">
        <Ionicons name="image-outline" size={22} color="#6366F1" />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#F1F5F9' : '#1E293B',
          }}
        >
          {t('savedPhoto.title')}
        </Text>
      </View>

      {/* Photo Preview */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(300)}
        style={{
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <View
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.4 : 0.2,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Image
            source={{ uri: photoUri }}
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: 20,
            }}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* Date Badge */}
      <View
        style={{
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isDark
              ? 'rgba(99, 102, 241, 0.15)'
              : 'rgba(99, 102, 241, 0.1)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={isDark ? '#A5B4FC' : '#6366F1'}
          />
          <Text
            style={{
              fontSize: 13,
              color: isDark ? '#A5B4FC' : '#6366F1',
              fontWeight: '500',
            }}
          >
            {t('savedPhoto.lastScan', { date: relativeDate })}
          </Text>
        </View>
      </View>

      {/* Primary Action - View Results */}
      {faceAnalysisId && (
        <Pressable
          onPress={onViewResults}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#4F46E5' : '#6366F1',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 12,
          })}
        >
          <Ionicons name="analytics-outline" size={20} color="#FFFFFF" />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            {t('savedPhoto.viewResults')}
          </Text>
        </Pressable>
      )}

      {/* Secondary Actions Row */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {/* Change Photo */}
        <Pressable
          onPress={onChangePhoto}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed
              ? isDark
                ? 'rgba(100, 116, 139, 0.4)'
                : 'rgba(100, 116, 139, 0.2)'
              : isDark
                ? 'rgba(100, 116, 139, 0.2)'
                : 'rgba(100, 116, 139, 0.1)',
            borderRadius: 14,
            padding: 14,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isDark
              ? 'rgba(100, 116, 139, 0.3)'
              : 'rgba(100, 116, 139, 0.2)',
          })}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={22}
            color={isDark ? '#94A3B8' : '#64748B'}
          />
          <Text
            style={{
              marginTop: 6,
              fontSize: 13,
              fontWeight: '500',
              color: isDark ? '#94A3B8' : '#64748B',
            }}
          >
            {t('savedPhoto.changePhoto')}
          </Text>
        </Pressable>

        {/* New Scan */}
        <Pressable
          onPress={onNewScan}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed
              ? isDark
                ? 'rgba(99, 102, 241, 0.25)'
                : 'rgba(99, 102, 241, 0.15)'
              : isDark
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(99, 102, 241, 0.08)',
            borderRadius: 14,
            padding: 14,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isDark
              ? 'rgba(99, 102, 241, 0.3)'
              : 'rgba(99, 102, 241, 0.2)',
          })}
        >
          <Ionicons
            name="scan-outline"
            size={22}
            color={isDark ? '#A5B4FC' : '#6366F1'}
          />
          <Text
            style={{
              marginTop: 6,
              fontSize: 13,
              fontWeight: '500',
              color: isDark ? '#A5B4FC' : '#6366F1',
            }}
          >
            {t('savedPhoto.newScan')}
          </Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}
