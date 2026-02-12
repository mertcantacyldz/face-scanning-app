import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { View } from 'react-native';
import { type ValidationQuality } from './ValidationStatusCard';

export interface HorizontalValidationCardProps {
    quality: ValidationQuality;
    title: string;
}

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

export function HorizontalValidationCard({
    quality,
    title,
}: HorizontalValidationCardProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const config = QUALITY_CONFIG[quality];

    return (
        <View
            style={{
                backgroundColor: isDark ? config.darkBg : config.lightBg,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDark ? config.darkBorder : config.lightBorder,
            }}
        >
            <Ionicons name={config.icon} size={18} color={config.color} />
            <Text className="text-foreground font-semibold ml-2 text-xs" numberOfLines={1}>
                {title}
            </Text>
        </View>
    );
}
