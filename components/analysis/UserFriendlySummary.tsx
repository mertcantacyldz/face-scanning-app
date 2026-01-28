import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface UserFriendlySummaryProps {
  data: {
    assessment: string;
    explanation: string;
    key_findings: string[];
  };
}

export function UserFriendlySummary({ data }: UserFriendlySummaryProps) {
  const { t } = useTranslation('analysis');

  if (!data) return null;

  return (
    <Card className="mb-6 p-6 bg-primary/10 border-2 border-primary/20">
      {/* Header with icon */}
      <View className="flex-row items-center gap-2 mb-4">
        <Ionicons name="information-circle" size={28} color="#8B5CF6" />
        <Text className="text-xl font-bold text-primary">{t('ui.summary')}</Text>
      </View>

      {/* Assessment (bold headline) */}
      <Text className="text-xl font-bold mb-3 text-foreground">
        {data.assessment}
      </Text>

      {/* Explanation (paragraph) */}
      <Text className="text-base leading-relaxed mb-4 text-foreground">
        {data.explanation}
      </Text>

      {/* Key Findings (bullet list) */}
      {data.key_findings && data.key_findings.length > 0 && (
        <View>
          <Text className="font-semibold mb-2 text-foreground">{t('ui.keyFindings')}:</Text>
          <View className="gap-1.5">
            {data.key_findings.map((finding, idx) => (
              <View key={idx} className="flex-row gap-2">
                <Text className="text-primary font-bold">•</Text>
                <Text className="flex-1 text-sm leading-relaxed text-foreground">
                  {finding}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}
