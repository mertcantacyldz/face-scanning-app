/**
 * SavedPhotoLayout Component
 * Displays saved photo with actions to view results or start new analysis
 * Supports both single photo (legacy) and multi-photo modes
 */

import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { PremiumPromotionCard } from './PremiumPromotionCard';
import { SavedPhotoCard } from './SavedPhotoCard';
import { StatusPill } from './StatusPill';
import type { MultiPhotoMetadata } from '@/lib/photo-storage';

// ============================================
// TYPES
// ============================================

export interface SavedPhotoLayoutProps {
  /** Saved photo URI (legacy single photo) */
  photoUri?: string;
  /** Date when photo was saved (legacy) */
  savedAt?: string;
  /** Multi-photo data */
  multiPhotoData?: MultiPhotoMetadata | null;
  /** Consistency score for multi-photo */
  consistencyScore?: number | null;
  /** Face analysis ID for viewing results */
  faceAnalysisId: string | null;
  /** Whether MediaPipe is ready */
  mediaPipeReady: boolean;
  /** Whether user has premium */
  isPremium: boolean;
  /** Tab bar height for bottom padding */
  tabBarHeight: number;
  /** Callback to view analysis results */
  onViewResults: () => void;
  /** Callback to change/retake photo */
  onChangePhoto: () => void;
  /** Callback to start new scan */
  onNewScan: () => void;
  /** Callback for premium upgrade */
  onUpgradePress?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function SavedPhotoLayout({
  photoUri,
  savedAt,
  multiPhotoData,
  consistencyScore,
  faceAnalysisId,
  mediaPipeReady,
  isPremium,
  tabBarHeight,
  onViewResults,
  onChangePhoto,
  onNewScan,
  onUpgradePress,
}: SavedPhotoLayoutProps) {
  const { t } = useTranslation('home');

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 20, paddingBottom: tabBarHeight + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Pill */}
      <View className="mb-4">
        <StatusPill
          isReady={mediaPipeReady}
          readyText={t('aiStatus.ready')}
          loadingText={t('aiStatus.loading')}
        />
      </View>

      {/* Saved Photo Card - supports both single and multi-photo */}
      <SavedPhotoCard
        photoUri={photoUri}
        savedAt={savedAt}
        multiPhotoData={multiPhotoData}
        consistencyScore={consistencyScore}
        faceAnalysisId={faceAnalysisId}
        onViewResults={onViewResults}
        onChangePhoto={onChangePhoto}
        onNewScan={onNewScan}
      />

      {/* Premium Promotion */}
      {!isPremium && (
        <PremiumPromotionCard delay={400} onUpgradePress={onUpgradePress} />
      )}
    </ScrollView>
  );
}
