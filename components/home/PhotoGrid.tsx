import React from 'react';
import { View, Image, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface PhotoGridItem {
  uri: string | null;
  isProcessing?: boolean;
  validation?: {
    quality: 'excellent' | 'good' | 'warning' | 'poor';
    confidence: number;
  } | null;
}

interface PhotoGridProps {
  photos: PhotoGridItem[];
  onAdd?: (index: number) => void;
  onRemove?: (index: number) => void;
  compact?: boolean;
  disabled?: boolean;
}

const QUALITY_COLORS = {
  excellent: '#10B981',
  good: '#3B82F6',
  warning: '#F59E0B',
  poor: '#EF4444',
};

export function PhotoGrid({
  photos,
  onAdd,
  onRemove,
  compact = false,
  disabled = false,
}: PhotoGridProps) {
  const { t } = useTranslation('home');

  const renderPhotoSlot = (item: PhotoGridItem, index: number) => {
    const hasPhoto = !!item.uri;
    const isProcessing = item.isProcessing;
    const quality = item.validation?.quality;
    const qualityColor = quality ? QUALITY_COLORS[quality] : undefined;

    return (
      <View
        key={index}
        className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 ${
          hasPhoto ? 'border-primary/30' : 'border-dashed border-muted-foreground/30'
        } ${compact ? 'mx-1' : 'mx-2'}`}
      >
        {hasPhoto ? (
          <View className="flex-1 relative">
            <Image
              source={{ uri: item.uri! }}
              className="w-full h-full"
              resizeMode="cover"
            />

            {/* Processing overlay */}
            {isProcessing && (
              <View className="absolute inset-0 bg-black/50 items-center justify-center">
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}

            {/* Quality indicator */}
            {quality && !isProcessing && (
              <View
                className="absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: qualityColor }}
              >
                <Ionicons
                  name={quality === 'poor' ? 'close' : 'checkmark'}
                  size={14}
                  color="#fff"
                />
              </View>
            )}

            {/* Remove button */}
            {onRemove && !isProcessing && !disabled && (
              <Pressable
                onPress={() => onRemove(index)}
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-500/90 items-center justify-center"
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
              </Pressable>
            )}

            {/* Photo number badge */}
            <View className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 items-center justify-center">
              <Text className="text-white text-xs font-bold">{index + 1}</Text>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => onAdd?.(index)}
            disabled={disabled}
            className="flex-1 items-center justify-center bg-muted/30"
          >
            <View className="items-center">
              <Ionicons
                name="add-circle-outline"
                size={compact ? 28 : 36}
                color="#888"
              />
              {!compact && (
                <Text className="text-muted-foreground text-xs mt-1">
                  {t('multiPhoto.addPhoto', { number: index + 1 })}
                </Text>
              )}
            </View>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View className={`flex-row ${compact ? 'px-2' : 'px-4'}`}>
      {photos.slice(0, 3).map((item, index) => renderPhotoSlot(item, index))}
    </View>
  );
}
