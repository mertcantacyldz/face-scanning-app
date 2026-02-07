import { Ionicons } from '@expo/vector-icons';
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

import { Text } from '@/components/ui/text';
import { Button } from '../ui/button';
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

      {/* Actions Section */}
      <View style={{ gap: 10 }}>
        {/* Ana Buton - Analiz Sonuçlarını Gör */}
        {faceAnalysisId && (
          <Button
            onPress={onViewResults}
            className=' w-full  flex-row gap-3 mb-4'
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? isDark
                  ? '#5B21B6'
                  : '#7C3AED'
                : isDark
                  ? '#6D28D9'
                  : '#8B5CF6',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            })}
          >

            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#FFFFFF',
              }}
            >
              {t('savedPhoto.viewResults')}
            </Text>
          </Button>
        )}

        {/* Alt Butonlar - Yan Yana */}
        <View className='w- full flex-row justify-between gap-2 '>
          {/* Yeni Tarama */}
          <Pressable
            onPress={onNewScan}
            className='flex justify-center items-center'
            style={({ pressed }) => ({

              backgroundColor: pressed
                ? isDark
                  ? '#1E293B'
                  : '#F1F5F9'
                : isDark
                  ? '#334155'
                  : '#FFFFFF',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.2 : 0.08,
              shadowRadius: 4,
              elevation: 2,
            })}
          >
            <View
              style={{
                backgroundColor: isDark
                  ? 'rgba(139, 92, 246, 0.2)'
                  : 'rgba(139, 92, 246, 0.1)',
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="scan"
                size={24}
                color={isDark ? '#A78BFA' : '#8B5CF6'}
              />
            </View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isDark ? '#E2E8F0' : '#334155',
                textAlign: 'center',
              }}
            >
              {t('savedPhoto.newScan')}
            </Text>
          </Pressable>

          {/* Fotoğraf Değiştir */}
          <Pressable
            onPress={onChangePhoto}
            className='flex justify-center items-center'
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed
                ? isDark
                  ? '#1E293B'
                  : '#F1F5F9'
                : isDark
                  ? '#334155'
                  : '#FFFFFF',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.2 : 0.08,
              shadowRadius: 4,
              elevation: 2,
            })}
          >
            <View
              style={{
                backgroundColor: isDark
                  ? 'rgba(99, 102, 241, 0.2)'
                  : 'rgba(99, 102, 241, 0.1)',
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="images"
                size={24}
                color={isDark ? '#818CF8' : '#6366F1'}
              />
            </View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isDark ? '#E2E8F0' : '#334155',
                textAlign: 'center',
              }}
            >
              {t('savedPhoto.changePhoto')}
            </Text>
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}