/**
 * AnalysisLayout Component
 * Displays the analysis flow with mesh preview, validation, and action buttons
 */

import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { MeshCarousel } from './MeshCarousel';
import { PremiumPromotionCard } from './PremiumPromotionCard';
import { ValidationQuality, ValidationStatusCard } from './ValidationStatusCard';

// ============================================
// TYPES
// ============================================

export interface MeshValidation {
  quality: ValidationQuality;
  message: string;
}

export interface AnalysisLayoutProps {
  /** Selected image URI */
  selectedImageUri: string | null;
  /** Generated mesh image URI */
  meshImageUri: string | null;
  /** Mesh validation result */
  meshValidation: MeshValidation | null;
  /** Whether analysis is in progress */
  isAnalyzing: boolean;
  /** Whether user has premium */
  isPremium: boolean;
  /** Tab bar height for bottom spacing */
  tabBarHeight: number;
  /** Callback to retake photo */
  onRetake: () => void;
  /** Callback to confirm mesh and proceed */
  onConfirm: () => void;
  /** Callback for premium upgrade */
  onUpgradePress?: () => void;
}

// ============================================
// SUB-COMPONENTS
// ============================================

function AnalyzingState() {
  const { t } = useTranslation('home');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="items-center py-8">
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: isDark
            ? 'rgba(99, 102, 241, 0.2)'
            : 'rgba(99, 102, 241, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Ionicons name="scan-outline" size={32} color="#6366F1" />
      </View>
      <Text className="text-primary font-semibold mb-2 text-center">
        {t('analysis.analyzing')}
      </Text>
      <Text className="text-muted-foreground text-sm text-center">
        {t('analysis.analyzingSubtitle')}
      </Text>
    </View>
  );
}

function ActionButtons({
  onRetake,
  onConfirm,
}: {
  onRetake: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation('home');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const buttonHeight = 100;

  return (
    <View className="flex-row gap-3">
      <Pressable onPress={onRetake} className="flex-1">
        <View
          style={{
            backgroundColor: isDark
              ? 'rgba(100, 116, 139, 0.3)'
              : 'rgba(100, 116, 139, 0.1)',
            borderRadius: 16,
            padding: 16,
            height: buttonHeight,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isDark
              ? 'rgba(100, 116, 139, 0.4)'
              : 'rgba(100, 116, 139, 0.2)',
          }}
        >
          <Ionicons
            name="refresh-outline"
            size={24}
            color={isDark ? '#94A3B8' : '#64748B'}
          />
          <Text className="text-foreground mt-2 font-medium">
            {t('actions.retake')}
          </Text>
        </View>
      </Pressable>

      <Pressable onPress={onConfirm} className="flex-1">
        <View
          style={{
            backgroundColor: '#6366F1',
            borderRadius: 16,
            padding: 16,
            height: buttonHeight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={{ color: 'white', marginTop: 8, fontWeight: '600' }}>
            {t('actions.confirm')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AnalysisLayout({
  selectedImageUri,
  meshImageUri,
  meshValidation,
  isAnalyzing,
  isPremium,
  onRetake,
  onConfirm,
  onUpgradePress,
}: AnalysisLayoutProps) {
  const { t } = useTranslation('home');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  console.log('Mesh Validation:', meshValidation);

  // Get validation title and description based on quality
  const getValidationContent = () => {
    if (!meshValidation) return { title: '', description: '' };

    switch (meshValidation.quality) {
      case 'excellent':
        return {
          title: t('validation.excellent.title'),
          description: t('validation.excellent.details'),
        };
      case 'good':
        return {
          title: t('validation.acceptable.title'),
          description:
            t('validation.acceptable.issue', { message: meshValidation.message }) +
            t('validation.acceptable.note'),
        };
      case 'warning':
        return {
          title: 'Dikkat!',
          description:
            meshValidation.message +
            '\n\nDaha iyi sonuç için "Tekrar Çek" yapabilirsiniz.',
        };
      case 'poor':
        return {
          title: 'Düşük Kalite',
          description:
            meshValidation.message +
            '\n\nDaha iyi sonuç için "Tekrar Çek" yapabilirsiniz.',
        };
    }
  };

  const validationContent = getValidationContent();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={true}
      indicatorStyle={isDark ? 'white' : 'black'}
      scrollIndicatorInsets={{ right: 2 }}
    >
      {/* ANALYSIS RESULTS - When image selected */}
      {selectedImageUri && (
        <GlassCard
          delay={0}
          borderGradient="primary"
          intensity="medium"
          style={{ padding: 24 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="analytics-outline" size={20} color="#6366F1" />
              <Text className="text-lg font-bold text-foreground">
                {t('analysis.title')}
              </Text>
            </View>
            <Pressable
              onPress={onRetake}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark
                  ? 'rgba(100, 116, 139, 0.3)'
                  : 'rgba(100, 116, 139, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="close"
                size={18}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </Pressable>
          </View>

          {/* Loading State */}
          {isAnalyzing && <AnalyzingState />}

          {/* Mesh Preview & Actions */}
          {meshImageUri && (
            <View>
              <MeshCarousel
                meshUri={meshImageUri}
                originalUri={selectedImageUri}
              />

              {/* Validation Status */}
              {meshValidation && (
                <ValidationStatusCard
                  quality={meshValidation.quality}
                  title={validationContent.title}
                  description={validationContent.description}
                />
              )}

              {/* AI Disclaimer */}
              <View className="flex-row justify-center items-start mb-3 px-2">
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#6B7280"
                  style={{ marginRight: 4, marginTop: 1 }}
                />
                <Text className="text-xs text-muted-foreground text-center flex-1">
                  {t('disclaimer')}
                </Text>
              </View>

              {/* Action Buttons */}
              <ActionButtons onRetake={onRetake} onConfirm={onConfirm} />
            </View>
          )}
        </GlassCard>
      )}
      <View style={{ height: 50 }} />

      {/* Premium Promotion */}
      {!isPremium && !selectedImageUri && (
        <PremiumPromotionCard delay={800} onUpgradePress={onUpgradePress} />
      )}
    </ScrollView>
  );
}
