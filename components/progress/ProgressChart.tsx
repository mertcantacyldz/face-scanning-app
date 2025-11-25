import React from 'react';
import { View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';

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
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80; // Account for padding

  // Transform data for the chart
  const chartData = data.map((point, index) => ({
    value: point.value,
    label: showLabels ? formatDateLabel(point.date) : undefined,
    dataPointText: point.value.toString(),
  }));

  // Calculate improvement
  const firstValue = data.length > 0 ? data[data.length - 1].value : 0;
  const lastValue = data.length > 0 ? data[0].value : 0;
  const improvement = lastValue - firstValue;
  const improvementPercent = firstValue > 0
    ? Math.round((improvement / firstValue) * 100)
    : 0;

  if (data.length === 0) {
    return (
      <Card className="p-4 bg-card border border-border">
        <Text className="text-center text-muted-foreground">
          Henüz veri yok
        </Text>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border border-border">
      {/* Header */}
      {(title || titleTr) && (
        <View className="mb-4">
          <Text className="text-lg font-bold text-foreground">
            {titleTr || title}
          </Text>
          {data.length >= 2 && (
            <View className="flex-row items-center mt-1">
              <Text
                className={`text-sm font-semibold ${
                  improvement >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {improvement >= 0 ? '↑' : '↓'} {Math.abs(improvement)} puan
              </Text>
              <Text className="text-xs text-muted-foreground ml-2">
                ({improvementPercent >= 0 ? '+' : ''}{improvementPercent}%)
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Chart */}
      <View style={{ marginLeft: -20 }}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={height}
          color={color}
          thickness={3}
          dataPointsColor={color}
          dataPointsRadius={6}
          curved
          areaChart
          startFillColor={color}
          startOpacity={0.3}
          endFillColor={color}
          endOpacity={0.05}
          yAxisColor="transparent"
          xAxisColor="#E5E7EB"
          yAxisTextStyle={{ color: '#6B7280', fontSize: 10 }}
          xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 9 }}
          hideRules
          maxValue={10}
          noOfSections={5}
          spacing={chartWidth / (chartData.length + 1)}
          showVerticalLines
          verticalLinesColor="rgba(0,0,0,0.05)"
          pointerConfig={{
            pointerStripHeight: height,
            pointerStripColor: 'rgba(0,0,0,0.1)',
            pointerStripWidth: 2,
            pointerColor: color,
            radius: 8,
            pointerLabelWidth: 100,
            pointerLabelHeight: 40,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => (
              <View className="bg-foreground px-3 py-2 rounded-lg">
                <Text className="text-background text-sm font-bold">
                  {items[0].value}/10
                </Text>
              </View>
            ),
          }}
        />
      </View>

      {/* Legend */}
      {data.length >= 2 && (
        <View className="flex-row justify-between mt-4 px-2">
          <Text className="text-xs text-muted-foreground">
            İlk: {firstValue}/10
          </Text>
          <Text className="text-xs text-muted-foreground">
            Son: {lastValue}/10
          </Text>
        </View>
      )}
    </Card>
  );
}

// Format date for x-axis label
function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('tr-TR', { month: 'short' });
  return `${day} ${month}`;
}

export default ProgressChart;
