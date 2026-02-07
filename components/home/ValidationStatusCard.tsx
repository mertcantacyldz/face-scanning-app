/**
 * ValidationStatusCard Component
 * Displays mesh validation quality status with appropriate styling
 */

import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

// ============================================
// TYPES
// ============================================

export type ValidationQuality = 'excellent' | 'good' | 'warning' | 'poor';

export interface ValidationStatusCardProps {
  /** Quality level of the validation */
  quality: ValidationQuality;
  /** Title text to display */
  title: string;
  /** Description/details text */
  description: string;
}

// ============================================
// CONSTANTS
// ============================================

const QUALITY_CONFIG = {
  excellent: {
    color: '#10B981',
    icon: 'checkmark-circle' as const,
    lightBg: 'rgba(16, 185, 129, 0.1)',
    darkBg: 'rgba(16, 185, 129, 0.15)',
    lightBorder: 'rgba(16, 185, 129, 0.2)',
    darkBorder: 'rgba(16, 185, 129, 0.3)',
  },
  good: {
    color: '#3B82F6',
    icon: 'checkmark-circle-outline' as const,
    lightBg: 'rgba(59, 130, 246, 0.1)',
    darkBg: 'rgba(59, 130, 246, 0.15)',
    lightBorder: 'rgba(59, 130, 246, 0.2)',
    darkBorder: 'rgba(59, 130, 246, 0.3)',
  },
  warning: {
    color: '#F59E0B',
    icon: 'warning' as const,
    lightBg: 'rgba(245, 158, 11, 0.1)',
    darkBg: 'rgba(245, 158, 11, 0.15)',
    lightBorder: 'rgba(245, 158, 11, 0.2)',
    darkBorder: 'rgba(245, 158, 11, 0.3)',
  },
  poor: {
    color: '#EF4444',
    icon: 'close-circle' as const,
    lightBg: 'rgba(239, 68, 68, 0.1)',
    darkBg: 'rgba(239, 68, 68, 0.15)',
    lightBorder: 'rgba(239, 68, 68, 0.2)',
    darkBorder: 'rgba(239, 68, 68, 0.3)',
  },
};

// ============================================
// COMPONENT
// ============================================

export function ValidationStatusCard({
  quality,
  title,
  description,
}: ValidationStatusCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const config = QUALITY_CONFIG[quality];

  return (
    <View
      style={{
        backgroundColor: isDark ? config.darkBg : config.lightBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: isDark ? config.darkBorder : config.lightBorder,
      }}
    >
      <View className="flex-row items-center">
        <Ionicons name={config.icon} size={24} color={config.color} />
        <View className="ml-3 flex-1">
          <Text className="text-foreground font-semibold">{title}</Text>
          <Text className="text-muted-foreground text-xs mt-1">
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
}
