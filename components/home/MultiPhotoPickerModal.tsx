import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { type MultiPhotoState } from '@/hooks/use-face-mesh';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { ConsistencyBadge, ConsistencyWarningCard } from './ConsistencyBadge';
import { PhotoGrid } from './PhotoGrid';
import { PhotoGuidanceCard } from './PhotoGuidanceCard';
import { ValidatingMeshCarousel } from './ValidatingMeshCarousel';

interface MultiPhotoPickerModalProps {
  visible: boolean;
  photos: MultiPhotoState[];
  processingStatus: 'idle' | 'processing' | 'averaging' | 'complete';
  currentPhotoIndex: number;
  consistencyScore: number | null;
  onPickFromGallery: () => Promise<string[] | null>;
  onRemovePhoto: (index: number) => void;
  onResetPhotos: () => void;
  onComplete: () => void;
  onClose: () => void;
}

export function MultiPhotoPickerModal({
  visible,
  photos,
  processingStatus,
  currentPhotoIndex,
  consistencyScore,
  onPickFromGallery,
  onRemovePhoto,
  onResetPhotos,
  onComplete,
  onClose,
}: MultiPhotoPickerModalProps) {
  const { t } = useTranslation('home');
  const [showLowConsistencyWarning, setShowLowConsistencyWarning] = useState(false);

  const loadedCount = photos.filter(p => p.uri !== null).length;
  const processedCount = photos.filter(p => p.landmarks !== null).length;
  const meshCount = photos.filter(p => p.meshImageUri !== null).length;
  const allProcessed = loadedCount > 0 && processedCount === loadedCount;
  const isProcessing = processingStatus === 'processing' || processingStatus === 'averaging';
  const hasLowQualityPhotos = photos.some(
    p => p.validation?.quality === 'warning' || p.validation?.quality === 'poor'
  );


  const handleComplete = () => {
    // 1. Low Consistency Check (Existing)
    if (consistencyScore !== null && consistencyScore < 60) {
      setShowLowConsistencyWarning(true);
      return;
    }

    // 2. Low Quality Photos Check (New: Persistent Alert)
    if (hasLowQualityPhotos) {
      Alert.alert(
        t('multiPhoto.qualityAlert.title'),
        t('multiPhoto.qualityAlert.message'),
        [
          { text: t('multiPhoto.qualityAlert.edit'), style: 'cancel' },
          { text: t('multiPhoto.qualityAlert.proceed'), onPress: onComplete, style: 'destructive' }
        ]
      );
      return;
    }

    onComplete();
  };

  const handleContinueAnyway = () => {
    setShowLowConsistencyWarning(false);
    onComplete();
  };

  const handleRetakePhotos = () => {
    setShowLowConsistencyWarning(false);
    // User will remove photos manually
  };

  const handlePickGallery = async () => {
    await onPickFromGallery();
  };

  const photoGridItems = photos.map((p, i) => ({
    uri: p.uri,
    isProcessing: processingStatus === 'processing' && currentPhotoIndex === i,
    validation: p.validation,
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              {t('multiPhoto.title')}
            </Text>
            <Text className="text-sm text-muted-foreground mt-0.5">
              {t('multiPhoto.subtitle')}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-muted items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#888" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 180 }}>
          {/* Progress indicator */}
          <View className="px-4 py-4">
            <View className="flex-row items-center justify-center gap-2">
              {[0, 1, 2].map((i) => {
                const photo = photos[i];
                const isComplete = photo.landmarks !== null;
                const isCurrent = processingStatus === 'processing' && currentPhotoIndex === i;

                return (
                  <View key={i} className=" flex items-center">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${isComplete
                        ? 'bg-green-500'
                        : isCurrent
                          ? 'bg-primary'
                          : 'bg-muted'
                        }`}
                    >
                      {isCurrent ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : isComplete ? (
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      ) : (
                        <Text className="text-muted-foreground font-bold">{i + 1}</Text>
                      )}
                    </View>
                    {i < 2 && (
                      <View
                        className={`absolute top-5 left-10 w-8 h-0.5 ${photos[i].landmarks ? 'bg-green-500' : 'bg-muted'
                          }`}
                      />
                    )}
                  </View>
                );
              })}
            </View>
            <Text className="text-center text-sm text-muted-foreground mt-3">
              {t('multiPhoto.step', { current: processedCount })}
            </Text>
          </View>

          {/* Photo Grid */}
          <View className="py-1">
            <PhotoGrid
              photos={photoGridItems}
              onRemove={isProcessing ? undefined : onRemovePhoto}
              disabled={isProcessing}
            />
          </View>

          {/* Consistency Score (if all processed) */}
          {allProcessed && consistencyScore !== null && (
            <View className="items-center py-4">
              <ConsistencyBadge score={consistencyScore} size="large" />
            </View>
          )}

          {/* Low consistency warning */}
          {showLowConsistencyWarning && consistencyScore !== null && (
            <View className="py-4">
              <ConsistencyWarningCard
                score={consistencyScore}
                onRetake={handleRetakePhotos}
                onContinue={handleContinueAnyway}
              />
            </View>
          )}

          {/* Guidance or Mesh Carousel */}
          <View className="py-1">
            {meshCount > 0 ? (
              <ValidatingMeshCarousel photos={photos} />
            ) : !allProcessed ? (
              <View className="py-2">
                <PhotoGuidanceCard />
              </View>
            ) : null}
          </View>

          {/* Processing status */}
          {processingStatus === 'averaging' && (
            <View className="items-center py-6">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="text-muted-foreground mt-3">
                {t('multiPhoto.averaging', { defaultValue: 'Ortalama hesaplanıyor...' })}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom actions */}
        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 pb-8">
          {!allProcessed ? (
            <View className="space-y-3">
              <Button
                onPress={handlePickGallery}
                disabled={isProcessing}
                className="w-full"
              >
                <View className="flex-row items-center">
                  <Ionicons name="images" size={20} color="#fff" />
                  <Text className="text-white font-semibold ml-2">
                    {t('multiPhoto.pickFromGallery', { defaultValue: 'Galeriden Fotoğraf Seç' })}
                  </Text>
                </View>
              </Button>
            </View>
          ) : (
            <View className="space-y-3">
              <Button
                onPress={handleComplete}
                disabled={isProcessing || showLowConsistencyWarning}
                className="w-full"
              >
                <View className="flex-row items-center">
                  <Ionicons name="analytics" size={20} color="#fff" />
                  <Text className="text-white font-semibold ml-2">
                    {t('multiPhoto.complete')}
                  </Text>
                </View>
              </Button>

              <Button
                variant="outline"
                onPress={onResetPhotos}
                disabled={isProcessing}
                className="w-full mt-2"
              >
                <View className="flex-row items-center">
                  <Ionicons name="refresh" size={20} color="#6366f1" />
                  <Text className="text-primary font-semibold ml-2">
                    {t('multiPhoto.changePhotos', { defaultValue: 'Fotoğrafları Değiştir' })}
                  </Text>
                </View>
              </Button>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
