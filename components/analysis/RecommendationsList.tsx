import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';

interface RecommendationsListProps {
  data: Record<string, string | string[]>;
}

// Helper: Format key name
function formatKeyName(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper: Get icon for recommendation type
function getRecommendationIcon(key: string): string {
  const ICONS: Record<string, string> = {
    makeup_suggestions: 'brush-outline',
    medical_advice: 'medical-outline',
    aesthetic_advice: 'sparkles-outline',
    hairstyle_suggestions: 'cut-outline',
    accessory_suggestions: 'glasses-outline',
    attention_points: 'warning-outline',
    symmetry_suggestions: 'analytics-outline',
    priority_intervention: 'alert-circle-outline',
    filler_suggestions: 'medkit-outline',
    attractiveness_tips: 'star-outline',
    aesthetic_intervention_need: 'construct-outline',
  };

  return ICONS[key] || 'pin-outline';
}

export function RecommendationsList({ data }: RecommendationsListProps) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return null;
  }

  return (
    <Card className="p-5 mb-6 bg-blue-50/50 border-2 border-blue-200/50">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <Ionicons name="bulb-outline" size={24} color="#3B82F6" />
        <Text className="text-xl font-bold text-foreground">
          Recommendations
        </Text>
      </View>

      {/* Recommendations */}
      <View className="gap-5">
        {entries.map(([key, value]) => (
          <View key={key}>
            {/* Section title with icon */}
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name={getRecommendationIcon(key) as any} size={20} color="#3B82F6" />
              <Text className="font-bold text-base text-foreground">
                {formatKeyName(key)}
              </Text>
            </View>

            {/* Content */}
            <View className="ml-7">
              {Array.isArray(value) ? (
                // Array: bullet list
                <View className="gap-1.5">
                  {value.map((item, idx) => (
                    <View key={idx} className="flex-row gap-2">
                      <Text className="text-blue-600 font-bold">•</Text>
                      <Text className="flex-1 text-sm leading-relaxed text-foreground">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                // String: paragraph
                <Text className="text-sm leading-relaxed text-foreground">
                  {value}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
