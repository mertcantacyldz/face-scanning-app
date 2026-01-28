import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { JsonRenderer } from './JsonRenderer';
import { useTranslation } from 'react-i18next';

interface MetadataSectionProps {
  data: Record<string, any>;
}

export function MetadataSection({ data }: MetadataSectionProps) {
  const { t } = useTranslation('analysis');
  const [expanded, setExpanded] = useState(false);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return (
    <View className="mt-6">
      {/* Header (collapsible trigger) */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex-row justify-between items-center active:opacity-70"
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-lg">ⓘ</Text>
          <Text className="font-semibold text-muted-foreground text-base">
            {t('ui.metadata')}
          </Text>
        </View>
        <Text className="text-muted-foreground text-xl">
          {expanded ? '▼' : '▶'}
        </Text>
      </Pressable>

      {/* Content (expandable) */}
      {expanded && (
        <Card className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <JsonRenderer data={data} depth={0} />
        </Card>
      )}
    </View>
  );
}
