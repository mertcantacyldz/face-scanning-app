/**
 * AnalysisResultModal Component
 * Displays the AI analysis result in a modal
 */

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { FaceRegion } from '@/lib/face-prompts';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeroCard } from './HeroCard';
import { JsonRenderer } from './JsonRenderer';
import { MetadataSection } from './MetadataSection';
import { RecommendationsList } from './RecommendationsList';
import { UserFriendlySummary } from './UserFriendlySummary';

// ============================================
// TYPES
// ============================================

export interface AnalysisResultModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** The selected region being analyzed */
  selectedRegion: FaceRegion | null;
  /** The analysis result from AI */
  analysisResult: Record<string, any> | null;
}

// ============================================
// COMPONENT
// ============================================

export function AnalysisResultModal({
  visible,
  onClose,
  selectedRegion,
  analysisResult,
}: AnalysisResultModalProps) {
  const { t } = useTranslation('analysis');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        {/* Modal Header */}
        <View className="bg-primary p-4 pb-6">
          <View className="flex-row items-center justify-between">
            {/* Region Icon and Title */}
            <View className="flex-row items-center">
              {selectedRegion?.icon && (
                typeof selectedRegion.icon === 'string' ? (
                  <Text className="text-5xl mr-3">{selectedRegion.icon}</Text>
                ) : (
                  <Image
                    source={selectedRegion.icon}
                    style={{ width: 50, height: 50, marginRight: 12 }}
                    resizeMode="contain"
                  />
                )
              )}
              <View>
                <Text className="text-2xl font-bold text-primary-foreground">
                  {selectedRegion && t(`regions.${selectedRegion.id}.title`)}
                </Text>
                <Text className="text-primary-foreground/80 text-sm">
                  {t('result.title')}
                </Text>
              </View>
            </View>

            {/* Close Button */}
            <Pressable
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-primary-foreground/20 items-center justify-center active:opacity-70"
            >
              <Text className="text-primary-foreground text-2xl">×</Text>
            </Pressable>
          </View>
        </View>

        {/* Modal Content */}
        <ScrollView className="flex-1 p-6">
          {analysisResult ? (
            <View>
              {typeof analysisResult === 'object' ? (
                // Render structured JSON with custom components
                <View>
                  {/* SECTION 1: Hero Card (analysis_result) */}
                  {analysisResult.analysis_result && (
                    <HeroCard data={analysisResult.analysis_result} />
                  )}

                  {/* SECTION 2: User-Friendly Summary */}
                  {analysisResult.user_friendly_summary && (
                    <UserFriendlySummary data={analysisResult.user_friendly_summary} />
                  )}

                  {/* SECTION 3-4: Generic sections */}
                  {Object.entries(analysisResult).map(([key, value]) => {
                    // Skip special sections handled separately
                    if ([
                      'analysis_result',
                      'user_friendly_summary',
                      'recommendations',
                      'metadata',
                    ].includes(key)) {
                      return null;
                    }

                    // Skip if value is not an object
                    if (!value || typeof value !== 'object') {
                      return null;
                    }

                    return (
                      <Card
                        key={key}
                        className="mb-4 p-5 bg-card border border-border"
                      >
                        <Text className="text-lg font-bold mb-3 text-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </Text>
                        <JsonRenderer data={value} depth={0} />
                      </Card>
                    );
                  })}

                  {/* SECTION 5: Recommendations */}
                  {analysisResult.recommendations && (
                    <RecommendationsList data={analysisResult.recommendations} />
                  )}

                  {/* SECTION 6: Metadata (collapsible) */}
                  {analysisResult.metadata && (
                    <MetadataSection data={analysisResult.metadata} />
                  )}
                </View>
              ) : (
                // Render plain text (fallback)
                <Text className="text-base leading-7 text-foreground">
                  {String(analysisResult)}
                </Text>
              )}
            </View>
          ) : (
            // Loading state
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#007AFF" />
              <Text className="mt-4 text-muted-foreground">
                {t('result.analyzing')}
              </Text>
            </View>
          )}

          {/* Bottom Info - AI Disclaimer */}
          {analysisResult && (
            <Card className="mt-6 p-4 bg-muted border-0">
              <Text className="text-xs text-muted-foreground text-center">
                {t('aiDisclaimer')}
              </Text>
            </Card>
          )}

          <View className="h-8" />
        </ScrollView>

        {/* Close Button at Bottom */}
        <View className="p-6 border-t border-border">
          <Pressable
            onPress={onClose}
            className="bg-primary py-4 rounded-lg items-center active:opacity-80"
          >
            <Text className="text-primary-foreground font-semibold text-base">
              {t('closeButton')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
