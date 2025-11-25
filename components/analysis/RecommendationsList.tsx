import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';

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
    makeup_suggestions: '🎨',
    medical_advice: '💊',
    aesthetic_advice: '✨',
    hairstyle_suggestions: '💇',
    accessory_suggestions: '👓',
    attention_points: '⚠️',
    symmetry_suggestions: '⚖️',
    priority_intervention: '🚨',
    filler_suggestions: '💉',
    attractiveness_tips: '💫',
    aesthetic_intervention_need: '🔧',
  };

  return ICONS[key] || '📌';
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
        <Text className="text-2xl">💡</Text>
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
              <Text className="text-lg">{getRecommendationIcon(key)}</Text>
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
