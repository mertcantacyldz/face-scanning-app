/**
 * ImagePickerModal Component
 * Bottom sheet modal for selecting photo source (camera/gallery)
 */

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { Modal, TouchableOpacity, View } from 'react-native';

// ============================================
// TYPES
// ============================================

export interface ImagePickerModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback when camera option selected */
  onTakePhoto: () => void;
  /** Callback when gallery option selected */
  onPickGallery: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function ImagePickerModal({
  visible,
  onClose,
  onTakePhoto,
  onPickGallery,
}: ImagePickerModalProps) {
  const { t } = useTranslation('home');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1}>
            <View
              style={{
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
              }}
            >
              {/* Handle Bar */}
              <View
                style={{
                  width: 48,
                  height: 4,
                  backgroundColor: isDark ? '#475569' : '#E2E8F0',
                  borderRadius: 2,
                  alignSelf: 'center',
                  marginBottom: 24,
                }}
              />

              {/* Title */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: isDark ? '#F1F5F9' : '#1E293B',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {t('photoGuidelines.title')}
              </Text>

              {/* Subtitle */}
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                {t('photoGuidelines.subtitle')}
              </Text>

              {/* Guidelines Box */}
              <View
                style={{
                  backgroundColor: isDark
                    ? 'rgba(99, 102, 241, 0.1)'
                    : 'rgba(99, 102, 241, 0.05)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <View className="flex-row items-center mb-3 gap-2">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#10B981"
                  />
                  <Text
                    style={{
                      color: isDark ? '#F1F5F9' : '#1E293B',
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    {t('photoGuidelines.rules.title')}
                  </Text>
                </View>
                <View className="gap-2">
                  {t('photoGuidelines.rules.list')
                    .split('\n')
                    .map((rule, index) => (
                      <View key={index} className="flex-row items-start">
                        <Ionicons
                          name="ellipse"
                          size={6}
                          color="#6B7280"
                          style={{ marginTop: 7, marginRight: 8 }}
                        />
                        <Text
                          style={{
                            color: isDark ? '#94A3B8' : '#64748B',
                            fontSize: 13,
                            lineHeight: 20,
                            flex: 1,
                          }}
                        >
                          {rule.replace(/^•\s*/, '')}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="gap-3">
                <Button onPress={onTakePhoto} className="w-full">
                  <View className="flex-row items-center justify-center gap-2">
                    <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                    <Text className="text-primary-foreground font-semibold text-base">
                      {t('photoGuidelines.camera')}
                    </Text>
                  </View>
                </Button>

                <Button
                  onPress={onPickGallery}
                  variant="outline"
                  className="w-full"
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Ionicons name="image-outline" size={20} color="#6366F1" />
                    <Text className="text-primary font-semibold text-base">
                      {t('photoGuidelines.gallery')}
                    </Text>
                  </View>
                </Button>

                <Button onPress={onClose} variant="ghost" className="w-full">
                  <Text className="text-muted-foreground font-semibold">
                    {t('photoGuidelines.cancel')}
                  </Text>
                </Button>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
