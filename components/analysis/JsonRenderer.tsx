import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
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

// Helper: Format key name - now uses i18n translations
function formatKeyName(key: string, t: (key: string) => string): string {
  // Try to get translation from fields namespace
  const translationKey = `fields.${key}`;
  const translated = t(translationKey);

  // If translation exists (not same as key), use it
  if (translated !== translationKey) {
    return translated;
  }

  // Fallback: convert snake_case to Title Case
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper: Detect unit from key name
function detectUnit(key: string): string {
  const keyLower = key.toLowerCase();

  const unitMap: Record<string, string> = {
    ratio: '%',
    percentage: '%',
    angle: '°',
    degree: '°',
    width: 'px',
    height: 'px',
    distance: 'px',
    deviation: 'px',
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
function detectValueType(value: any, key: string = ''): ValueType {
  if (value == null) return 'null';

  if (typeof value === 'boolean') return 'boolean';

  if (typeof value === 'number') {
    const keyLower = key.toLowerCase();
    const isScoreKey = keyLower.includes('score');

    // Score: number 0-10
    // v2.0: Allow floats for scores if they're in 0-10 range and key says "score"
    // Other regions use integers, but Nose uses precise floats
    if (value >= 0 && value <= 10) {
      if (isScoreKey || Number.isInteger(value)) {
        return 'score';
      }
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
        {value.toFixed(1)}/{max}
      </Text>
    </View>
  );
}

// Helper: Translate enum value
function translateEnum(value: string, t: (key: string) => string): string {
  const translationKey = `enums.${value}`;
  const translated = t(translationKey);

  // If translation exists (not same as key), use it
  if (translated !== translationKey) {
    return translated;
  }

  // Fallback: convert UPPER_CASE to Title Case
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

// Component: Enum Badge
function EnumBadge({ value, t }: { value: string; t: (key: string) => string }) {
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

  const displayValue = translateEnum(value, t);

  return (
    <View
      className={`${colorClasses} border px-3 py-1.5 rounded-full self-start`}
    >
      <Text className={`${textColorClasses} text-xs font-semibold`}>
        {displayValue}
      </Text>
    </View>
  );
}

// Component: Coordinate Display
function CoordinateDisplay({ value }: { value: Record<string, number> }) {
  return (
    <View className="flex-row gap-2 flex-wrap">
      {Object.entries(value).map(([key, val]) => (
        <View key={key} className="bg-muted px-2 py-1 rounded">
          <Text className="text-xs text-foreground">
            <Text className="font-semibold">{key.toUpperCase()}:</Text>{' '}
            {typeof val === 'number' ? val.toFixed(2) : String(val)}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Main render value function
function renderValue(
  key: string,
  value: any,
  depth: number,
  t: (key: string, options?: any) => string
): React.ReactElement | null {
  // SPECIAL CASE: user_explanation (display prominently as a comment box)
  if (key === 'user_explanation' && typeof value === 'string' && value.trim()) {
    return (
      <View className="bg-primary/5 p-3 rounded-lg border-l-4 border-primary mt-1 mb-3">
        <View className="flex-row items-center mb-1 gap-1">
          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#8B5CF6" />
          <Text className="text-[10px] font-bold text-primary uppercase tracking-tighter">
            {t('ui.ai_comment', { defaultValue: 'AI COMMENT' })}
          </Text>
        </View>
        <Text className="text-sm italic text-muted-foreground leading-relaxed">
          {value}
        </Text>
      </View>
    );
  }

  const type = detectValueType(value, key);

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
    return <EnumBadge value={value} t={t} />;
  }

  // Coordinate
  if (type === 'coordinate') {
    return <CoordinateDisplay value={value} />;
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
          {value ? `✓ ${t('ui.yes')}` : `✗ ${t('ui.no')}`}
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
      return <Text className="text-muted-foreground text-sm italic">{t('ui.none')}</Text>;
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
            <JsonRendererInner data={item} depth={depth + 1} t={t} />
          </Card>
        ))}
      </View>
    );
  }

  // Nested object (recursive)
  if (type === 'object') {
    return (
      <View className="gap-2 ml-3">
        <JsonRendererInner data={value} depth={depth + 1} t={t} />
      </View>
    );
  }

  return null;
}

// Inner component (used for recursion with t function)
function JsonRendererInner({
  data,
  depth = 0,
  excludeKeys = [],
  t,
}: JsonRendererProps & { t: (key: string, options?: any) => string }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const entries = Object.entries(data).filter(
    ([key]) => !excludeKeys.includes(key)
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      {entries.map(([key, value]) => (
        <View key={key}>
          {/* Field label */}
          <Text
            className={
              depth === 0
                ? 'text-base font-bold mb-1.5 text-foreground'
                : 'text-sm font-semibold mb-1 text-foreground'
            }
          >
            {formatKeyName(key, t)}
          </Text>

          {/* Field value */}
          <View>{renderValue(key, value, depth, t)}</View>
        </View>
      ))}
    </View>
  );
}

// Main component (exported, uses useTranslation hook)
export function JsonRenderer({
  data,
  depth = 0,
  excludeKeys = [],
}: JsonRendererProps) {
  const { t } = useTranslation('analysis');

  return (
    <JsonRendererInner
      data={data}
      depth={depth}
      excludeKeys={excludeKeys}
      t={t}
    />
  );
}
