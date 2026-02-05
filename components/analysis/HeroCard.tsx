import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

interface HeroCardProps {
  data: {
    general_assessment: string;
    asymmetry_level?: string;
    overall_score?: number;
    // Face shape specific fields
    face_shape?: string;
    confidence_score?: number;
    // Other possible fields
    dominant_issue?: string;
    asymmetry_type?: string;
  };
}

// Helper: Get enum color
function getEnumColor(value: string): 'green' | 'yellow' | 'red' | 'gray' {
  const GREEN = ['NONE', 'GOOD', 'HIGH', 'OVAL', 'BALANCED', 'EXCELLENT'];
  const YELLOW = ['MILD', 'FAIR', 'MEDIUM', 'MODERATE', 'SQUARE', 'ROUND'];
  const RED = ['SEVERE', 'POOR', 'LOW'];

  const valueUpper = value.toUpperCase();

  if (GREEN.some((g) => valueUpper.includes(g))) return 'green';
  if (YELLOW.some((y) => valueUpper.includes(y))) return 'yellow';
  if (RED.some((r) => valueUpper.includes(r))) return 'red';
  return 'gray';
}

export function HeroCard({ data }: HeroCardProps) {
  // Determine score (overall_score or confidence_score)
  const score = data.overall_score ?? data.confidence_score ?? 0;

  // Determine badge value (asymmetry_level or face_shape)
  const badgeValue = data.asymmetry_level || data.face_shape;

  // Score color
  const scoreColor =
    score >= 7
      ? 'text-green-600'
      : score >= 4
        ? 'text-yellow-600'
        : 'text-red-600';

  // Badge color
  const badgeColor = badgeValue ? getEnumColor(badgeValue) : 'gray';

  const badgeColorClasses = {
    green: 'bg-green-100 border-green-300',
    yellow: 'bg-yellow-100 border-yellow-300',
    red: 'bg-red-100 border-red-300',
    gray: 'bg-gray-100 border-gray-300',
  }[badgeColor];

  const badgeTextColorClasses = {
    green: 'text-green-800',
    yellow: 'text-yellow-800',
    red: 'text-red-800',
    gray: 'text-gray-800',
  }[badgeColor];

  return (
    <Card className="bg-primary/10 p-8 mb-6 border-2 border-primary/20">
      {/* Score Circle */}
      <View className="items-center mb-6">
        <View className="w-36 h-36 rounded-full bg-white shadow-xl items-center justify-center border-4 border-primary/20">
          <Text className={`text-6xl font-bold ${scoreColor}`}>
            {typeof score === 'number' ? score.toFixed(1) : score}
          </Text>
          <Text className="text-sm text-muted-foreground font-medium">
            / 10
          </Text>
        </View>
      </View>

      {/* Badge (Asymmetry Level or Face Shape) */}
      {badgeValue && (
        <View className="items-center mb-6">
          <View
            className={`${badgeColorClasses} border-2 px-6 py-2 rounded-full`}
          >
            <Text
              className={`${badgeTextColorClasses} text-base font-bold tracking-wide`}
            >
              {badgeValue}
            </Text>
          </View>
        </View>
      )}

      {/* General Assessment Text */}
      <Text className="text-center text-base leading-relaxed text-foreground">
        {data.general_assessment}
      </Text>

      {/* Optional: Dominant Issue or Asymmetry Type */}
      {(data.dominant_issue || data.asymmetry_type) && (
        <View className="mt-4 p-3 bg-muted rounded-lg">
          <Text className="text-sm text-foreground text-center">
            {data.dominant_issue || data.asymmetry_type}
          </Text>
        </View>
      )}
    </Card>
  );
}
