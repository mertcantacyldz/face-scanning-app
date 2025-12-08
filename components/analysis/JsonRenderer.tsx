import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

// Types
type ValueType =
  | 'score'
  | 'enum'
  | 'coordinate'
  | 'number'
  | 'boolean'
  | 'string'
  | 'array-primitive'
  | 'array-object'
  | 'object'
  | 'null';

interface JsonRendererProps {
  data: any;
  depth?: number;
  excludeKeys?: string[];
}

// Helper: Format key name
function formatKeyName(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper: Detect unit from key name
function detectUnit(key: string): string {
  const keyLower = key.toLowerCase();

  const unitMap: Record<string, string> = {
    angle: '°',
    degree: '°',
    width: 'px',
    height: 'px',
    distance: 'px',
    deviation: 'px',
    ratio: '%',
  };

  for (const [keyword, unit] of Object.entries(unitMap)) {
    if (keyLower.includes(keyword)) {
      return unit;
    }
  }

  return '';
}

// Helper: Get enum color
function getEnumColor(value: string): 'green' | 'yellow' | 'red' | 'gray' {
  const GREEN = ['NONE', 'GOOD', 'HIGH', 'STRAIGHT', 'CENTER', 'BALANCED', 'EXCELLENT'];
  const YELLOW = ['MILD', 'FAIR', 'MEDIUM', 'MODERATE'];
  const RED = ['SEVERE', 'POOR', 'LOW'];

  const valueUpper = value.toUpperCase();

  if (GREEN.some((g) => valueUpper.includes(g))) return 'green';
  if (YELLOW.some((y) => valueUpper.includes(y))) return 'yellow';
  if (RED.some((r) => valueUpper.includes(r))) return 'red';
  return 'gray';
}

// Helper: Detect value type
function detectValueType(value: any): ValueType {
  if (value == null) return 'null';

  if (typeof value === 'boolean') return 'boolean';

  if (typeof value === 'number') {
    // Score: integer 0-10
    if (Number.isInteger(value) && value >= 0 && value <= 10) {
      return 'score';
    }
    return 'number';
  }

  if (typeof value === 'string') {
    // Enum: UPPERCASE_WITH_UNDERSCORES
    if (/^[A-Z][A-Z_]*$/.test(value)) {
      return 'enum';
    }
    return 'string';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return 'array-primitive';
    return typeof value[0] === 'object' ? 'array-object' : 'array-primitive';
  }

  if (typeof value === 'object') {
    // Coordinate object: {x, y, z} or {x, y}
    if ('x' in value && 'y' in value) {
      return 'coordinate';
    }
    return 'object';
  }

  return 'string';
}

// Component: Score Bar
function ScoreBar({ value, max }: { value: number; max: number }) {
  const percentage = (value / max) * 100;
  const bgColor =
    value >= 7 ? 'bg-green-500' : value >= 4 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <View className="flex-row items-center gap-3">
      {/* Progress bar */}
      <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <View
          className={`h-full ${bgColor}`}
          style={{ width: `${percentage}%` }}
        />
      </View>
      {/* Score text */}
      <Text className="font-bold text-sm min-w-[45px]">
        {value}/{max}
      </Text>
    </View>
  );
}

// Component: Enum Badge
function EnumBadge({ value }: { value: string }) {
  const color = getEnumColor(value);

  const colorClasses = {
    green: 'bg-green-100 border-green-300',
    yellow: 'bg-yellow-100 border-yellow-300',
    red: 'bg-red-100 border-red-300',
    gray: 'bg-gray-100 border-gray-300',
  }[color];

  const textColorClasses = {
    green: 'text-green-800',
    yellow: 'text-yellow-800',
    red: 'text-red-800',
    gray: 'text-gray-800',
  }[color];

  return (
    <View
      className={`${colorClasses} border px-3 py-1.5 rounded-full self-start`}
    >
      <Text className={`${textColorClasses} text-xs font-semibold`}>
        {value}
      </Text>
    </View>
  );
}

// Note: CoordinateDisplay component removed - coordinates are now hidden
// See detectValueType() where 'coordinate' type returns null

// Main render value function
function renderValue(
  key: string,
  value: any,
  depth: number,
  data?: any
): React.ReactElement | null {
  const type = detectValueType(value);

  // Null/undefined
  if (type === 'null') {
    return <Text className="text-muted-foreground text-sm italic">-</Text>;
  }

  // Score (0-10)
  if (type === 'score') {
    return <ScoreBar value={value} max={10} />;
  }

  // Enum
  if (type === 'enum') {
    return <EnumBadge value={value} />;
  }

  // Coordinate - Hide coordinates (x, y, z)
  if (type === 'coordinate') {
    return null; // Don't render coordinates at all
  }

  // Number
  if (type === 'number') {
    const unit = detectUnit(key);
    return (
      <Text className="text-sm">
        {value.toFixed(2)} {unit}
      </Text>
    );
  }

  // Boolean
  if (type === 'boolean') {
    return (
      <View
        className={`${value ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
          } border px-2 py-1 rounded self-start`}
      >
        <Text
          className={`text-xs font-semibold ${value ? 'text-green-800' : 'text-red-800'
            }`}
        >
          {value ? '✓ Yes' : '✗ No'}
        </Text>
      </View>
    );
  }

  // String
  if (type === 'string') {
    return <Text className="text-sm leading-relaxed">{value}</Text>;
  }

  // Array of primitives
  if (type === 'array-primitive') {
    if (value.length === 0) {
      return <Text className="text-muted-foreground text-sm italic">None</Text>;
    }

    return (
      <View className="gap-1.5">
        {value.map((item: any, idx: number) => (
          <View key={idx} className="flex-row gap-2">
            <Text className="text-primary">•</Text>
            <Text className="flex-1 text-sm leading-relaxed">{String(item)}</Text>
          </View>
        ))}
      </View>
    );
  }

  // Array of objects
  if (type === 'array-object') {
    return (
      <View className="gap-2">
        {value.map((item: any, idx: number) => (
          <Card key={idx} className="p-3 bg-muted/50">
            <JsonRenderer data={item} depth={depth + 1} />
          </Card>
        ))}
      </View>
    );
  }

  // Nested object (recursive)
  if (type === 'object') {
    return (
      <View className="gap-2 ml-3">
        <JsonRenderer data={value} depth={depth + 1} />
      </View>
    );
  }

  return null;
}

// Wrapper function to add explanations
function renderValueWithExplanation(
  key: string,
  value: any,
  depth: number,
  data?: any
): React.ReactElement | null {
  const renderedValue = renderValue(key, value, depth, data);

  // If no value rendered (e.g., coordinates), return null
  if (!renderedValue) {
    return null;
  }

  // Check for explanation field (skip for scores and enums)
  const type = detectValueType(value);
  if (type === 'score' || type === 'enum') {
    return renderedValue; // No explanation needed
  }

  // Look for explanation fields
  if (data && typeof data === 'object') {
    const explanationKey = `${key}_explanation`;
    const interpretationKey = `${key}_interpretation`;
    const explanation = data[explanationKey] || data[interpretationKey];

    if (explanation && typeof explanation === 'string') {
      return (
        <View>
          {renderedValue}
          <Text className="text-xs text-muted-foreground italic mt-1.5 leading-relaxed">
            💡 {explanation}
          </Text>
        </View>
      );
    }
  }

  return renderedValue;
}

// Helper: Extract JSON from markdown code block
function extractJsonFromMarkdown(text: string): any {
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  const cleanedText = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch {
    return null;
  }
}

// Main component
export function JsonRenderer({
  data,
  depth = 0,
  excludeKeys = [],
}: JsonRendererProps) {
  if (!data || typeof data !== 'object') {
    return (
      <View className="p-4 bg-muted/50 rounded-lg">
        <Text className="text-muted-foreground text-center italic">
          Veri bulunamadı
        </Text>
      </View>
    );
  }

  // Check if data has raw_text field (markdown-wrapped JSON)
  if ('raw_text' in data && typeof data.raw_text === 'string') {
    const extractedJson = extractJsonFromMarkdown(data.raw_text);
    if (extractedJson) {
      // Recursively render the extracted JSON
      return <JsonRenderer data={extractedJson} depth={depth} excludeKeys={excludeKeys} />;
    }
    // If extraction failed, show the raw text as plain text
    return (
      <Text className="text-sm leading-relaxed">{data.raw_text}</Text>
    );
  }

  const entries = Object.entries(data).filter(
    ([key]) => !excludeKeys.includes(key) &&
      !key.endsWith('_explanation') &&
      !key.endsWith('_interpretation')
  );

  if (entries.length === 0) {
    return (
      <View className="p-4 bg-muted/50 rounded-lg">
        <Text className="text-muted-foreground text-center italic">
          Analiz verisi boş
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {entries.map(([key, value]) => {
        const renderedValue = renderValueWithExplanation(key, value, depth, data);

        // Skip if value is null (e.g., hidden coordinates)
        if (!renderedValue) {
          return null;
        }

        return (
          <View key={key}>
            {/* Field label */}
            <Text
              className={
                depth === 0
                  ? 'text-base font-bold mb-1.5 text-foreground'
                  : 'text-sm font-semibold mb-1 text-foreground'
              }
            >
              {formatKeyName(key)}
            </Text>

            {/* Field value */}
            <View>{renderedValue}</View>
          </View>
        );
      })}
    </View>
  );
}
