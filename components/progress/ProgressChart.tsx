import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface DataPoint {
  value: number;
  date: string;
  label?: string;
}

interface ProgressChartProps {
  data: DataPoint[];
  title?: string;
  titleTr?: string;
  color?: string;
  height?: number;
  showLabels?: boolean;
}

export function ProgressChart({
  data,
  title,
  titleTr,
  color = '#007AFF',
  height = 200,
  showLabels = true,
}: ProgressChartProps) {
  const { i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80; // More padding to prevent overflow

  // Transform data for the chart
  const chartData = data.map((point, index) => ({
    value: point.value,
    label: showLabels ? formatDateLabel(point.date, i18n.language) : undefined,
    dataPointText: point.value.toString(),
  }));

  // Calculate improvement (oldest to latest for correct direction)
  const firstValue = data.length > 0 ? data[0].value : 0; // First (oldest)
  const lastValue = data.length > 0 ? data[data.length - 1].value : 0; // Last (latest)
  const improvement = lastValue - firstValue; // Latest - First = improvement
  const improvementPercent = firstValue > 0
    ? Math.round((improvement / firstValue) * 100)
    : 0;

  if (data.length === 0) {
    return (
      <Card className="p-3 bg-card border border-border">
        <Text className="text-center text-muted-foreground text-sm">
          {i18n.language === 'tr' ? 'Henüz veri yok' : 'No data yet'}
        </Text>
      </Card>
    );
  }

  return (
    <Card className="p-3 bg-card border border-border">
      {/* Header - Clickable to toggle */}
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            {(title || titleTr) && (
              <Text className="text-base font-bold text-foreground">
                {titleTr || title}
              </Text>
            )}
            {data.length >= 2 && (
              <View className="flex-row items-center mt-1">
                <Text
                  className={`text-sm font-semibold ${
                    improvement >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {improvement >= 0 ? '↑' : '↓'} {Math.abs(improvement).toFixed(1)} {i18n.language === 'tr' ? 'puan' : 'points'}
                </Text>
                <Text className="text-xs text-muted-foreground ml-2">
                  ({improvementPercent >= 0 ? '+' : ''}{improvementPercent}%)
                </Text>
              </View>
            )}
          </View>
          <View className="w-8 h-8 bg-muted rounded-full items-center justify-center ml-2">
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#768294"
            />
          </View>
        </View>
      </Pressable>

      {/* Chart - Only show when expanded */}
      {isExpanded && (
        <>
          <View style={{ marginLeft: -16, marginTop: 12 }}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={height}
              color={color}
              thickness={2}
              dataPointsColor={color}
              dataPointsRadius={4}
              curved
              areaChart
              startFillColor={color}
              startOpacity={0.3}
              endFillColor={color}
              endOpacity={0.05}
              yAxisColor="transparent"
              xAxisColor="#E5E7EB"
              yAxisTextStyle={{ color: '#6B7280', fontSize: 9 }}
              xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 8 }}
              hideRules
              maxValue={10}
              noOfSections={5}
              spacing={Math.max(30, chartWidth / (chartData.length + 1))}
              showVerticalLines
              verticalLinesColor="rgba(0,0,0,0.05)"
              pointerConfig={{
                pointerStripHeight: height,
                pointerStripColor: 'rgba(0,0,0,0.1)',
                pointerStripWidth: 2,
                pointerColor: color,
                radius: 6,
                pointerLabelWidth: 80,
                pointerLabelHeight: 32,
                activatePointersOnLongPress: true,
                autoAdjustPointerLabelPosition: true,
                pointerLabelComponent: (items: any) => (
                  <View className="bg-foreground px-2 py-1 rounded-lg">
                    <Text className="text-background text-xs font-bold">
                      {items[0].value}/10
                    </Text>
                  </View>
                ),
              }}
            />
          </View>

          {/* Legend */}
          {data.length >= 2 && (
            <View className="flex-row justify-between mt-2 px-1">
              <Text className="text-xs text-muted-foreground">
                {i18n.language === 'tr' ? 'İlk' : 'First'}: {firstValue}/10
              </Text>
              <Text className="text-xs text-muted-foreground">
                {i18n.language === 'tr' ? 'Son' : 'Latest'}: {lastValue}/10
              </Text>
            </View>
          )}
        </>
      )}
    </Card>
  );
}

// Format date for x-axis label
function formatDateLabel(dateString: string, language: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';
  const month = date.toLocaleDateString(locale, { month: 'short' });
  return `${day} ${month}`;
}

export default ProgressChart;
