import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { RegionId } from '@/lib/exercises';
import { getRegionIcon, getRegionTitle } from '@/lib/exercises';
import React, { useCallback, useState } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown // <-- Bunu ekleyin
  ,

  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

interface SpinWheelProps {
  onSpinComplete: (regionId: RegionId) => void;
  disabled?: boolean;
}

const REGIONS: RegionId[] = ['eyebrows', 'eyes', 'nose', 'lips', 'jawline', 'face_shape'];
const SEGMENT_ANGLE = 360 / REGIONS.length;

const COLORS = [
  '#8B5CF6', // eyebrows - vibrant purple
  '#06B6D4', // eyes - cyan
  '#3B82F6', // nose - blue
  '#10B981', // lips - emerald
  '#F59E0B', // jawline - amber
  '#EC4899', // face_shape - pink
];

// Matematiksel Yardımcı Fonksiyonlar
const degToRad = (deg: number) => (deg * Math.PI) / 180;

// Dilim Path'ini oluşturan fonksiyon
const createSlicePath = (index: number, total: number, radius: number) => {
  const angle = 360 / total;
  const startAngle = index * angle;
  const endAngle = (index + 1) * angle;

  // 0 derece saat 12 yönünde başlasın diye -90 çıkarıyoruz
  const startRad = degToRad(startAngle - 90);
  const endRad = degToRad(endAngle - 90);

  const x1 = radius + radius * Math.cos(startRad);
  const y1 = radius + radius * Math.sin(startRad);
  const x2 = radius + radius * Math.cos(endRad);
  const y2 = radius + radius * Math.sin(endRad);

  return `M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`;
};

// İkon/Metin koordinatlarını hesaplayan fonksiyon
const getTextCoordinates = (index: number, total: number, radius: number) => {
  const angle = 360 / total;
  const midAngle = index * angle + angle / 2;
  const rad = degToRad(midAngle - 90);
  
  // Yarıçapın %65'i kadar uzağa koy (ikonun yeri)
  const dist = radius * 0.65;
  
  return {
    x: radius + dist * Math.cos(rad),
    y: radius + dist * Math.sin(rad),
    rotation: midAngle // İkonu merkeze bakacak şekilde döndürmek istersen
  };
};

export function SpinWheel({ onSpinComplete, disabled = false }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<RegionId | null>(null);
  const rotation = useSharedValue(0);

  const screenWidth = Dimensions.get('window').width;
  const wheelSize = Math.min(screenWidth - 60, 320);
  const radius = wheelSize / 2;

  const spin = useCallback(() => {
    if (isSpinning || disabled) return;

    setIsSpinning(true);
    setResult(null);

    const randomIndex = Math.floor(Math.random() * REGIONS.length);
    const selectedRegion = REGIONS[randomIndex];

    // Hedef hesaplama:
    // Çarkı döndürüyoruz, ibre (pointer) üstte sabit.
    // İlgili dilimin tepeye gelmesi için ters mantık kurmalıyız.
    // Bir dilim açısı: 60 derece.
    // 0. index (0-60 derece arası) -> Tepeye (270 veya -90) gelmesi lazım.
    // Basit mantık: Tam tur + (360 - (Index * Açı))
    
    // Rastgelelik (dilimin tam ortasına değil, hafif sağına soluna da gelebilsin)
    const randomOffset = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.8); 
    
    const extraSpins = 5; // 5 tam tur
    // Dilimin merkez açısı
    const segmentAngle = randomIndex * SEGMENT_ANGLE;
    
    // Reanimated rotasyonu
    const finalRotation = 360 * extraSpins - segmentAngle - (SEGMENT_ANGLE/2) + randomOffset;

    rotation.value = withSequence(
      withTiming(rotation.value - 20, { duration: 200, easing: Easing.linear }), // Geriye gerilme efekti
      withTiming(rotation.value + finalRotation, {
        duration: 4000,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished) {
          runOnJS(setIsSpinning)(false);
          runOnJS(setResult)(selectedRegion);
          runOnJS(onSpinComplete)(selectedRegion);
        }
      })
    );

  }, [isSpinning, disabled, rotation, onSpinComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View className="items-center">
      {/* Title */}
      <View className="mb-8 items-center">
        <Text className="text-2xl font-bold text-center">🎡 Şansını Dene!</Text>
        <Text className="text-muted-foreground text-center mt-1">
          Ücretsiz 1 bölge analizi kazan
        </Text>
      </View>

      {/* Wheel Container */}
      <View className="relative items-center justify-center p-6" style={{ overflow: 'visible' }}>
        {/* Pointer (İbre) - Sabit durur, çarkın üstünde */}
        <View className="absolute top-0 z-20 items-center justify-center pointer-events-none">
          {/* Üçgen İbre */}
          <View 
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 16,
              borderRightWidth: 16,
              borderTopWidth: 24, // Aşağı bakan üçgen
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#1a1a1a', // Koyu renk ibre
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          />
        </View>

        {/* Dönen Çark */}
        <Animated.View
          style={[
            {
              width: wheelSize,
              height: wheelSize,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            },
            animatedStyle,
          ]}
        >
          {/* SVG - Sadece renkli dilimler */}
          <Svg height={wheelSize} width={wheelSize} viewBox={`0 0 ${wheelSize} ${wheelSize}`}>
            <G>
              {REGIONS.map((region, index) => {
                const path = createSlicePath(index, REGIONS.length, radius);

                return (
                  <G key={region}>
                    {/* Dilim Rengi */}
                    <Path
                      d={path}
                      fill={COLORS[index]}
                      stroke="white"
                      strokeWidth="3"
                    />
                  </G>
                );
              })}
            </G>
          </Svg>

          {/* İkonlar - SVG dışında absolute pozisyonlu */}
          {REGIONS.map((region, index) => {
            const { x, y } = getTextCoordinates(index, REGIONS.length, radius);

            return (
              <View
                key={`icon-${region}`}
                style={{
                  position: 'absolute',
                  left: x - 20, // İkon genişliğinin yarısı kadar sola kaydır
                  top: y - 20, // İkon yüksekliğinin yarısı kadar yukarı kaydır
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 32 }}>
                  {getRegionIcon(region)}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Orta Göbek (Hareketsiz veya çarkla dönebilir, burada çarkla dönüyor) */}
        <View 
            className="absolute bg-white items-center justify-center rounded-full shadow-lg border-4 border-gray-100"
            style={{
                width: wheelSize * 0.18,
                height: wheelSize * 0.18,
                // Tam ortalamak için (position absolute, center center)
            }}
        >
             <Text className="text-xl">🎯</Text>
        </View>
      </View>

      {/* Spin Button */}
      <Pressable
        onPress={spin}
        disabled={isSpinning || disabled}
        className={`mt-10 px-12 py-4 rounded-full shadow-md active:scale-95 transition-transform ${
          isSpinning || disabled ? 'bg-gray-300' : 'bg-primary'
        }`}
      >
        <Text
          className={`font-bold text-lg ${
            isSpinning || disabled ? 'text-gray-500' : 'text-primary-foreground'
          }`}
        >
          {isSpinning ? '🎡 Çark Dönüyor...' : '🎰 ÇARKI ÇEVİR'}
        </Text>
      </Pressable>

      {/* Result Card */}
      {result && (
        <Animated.View 
          entering={FadeInDown.duration(600).springify()}
            className="w-full"
        >
            <Card className="mt-8 p-4 bg-green-50 border-2 border-green-200 w-full shadow-sm">
            <View className="flex-row items-center justify-center">
                <Text className="text-4xl mr-4">{getRegionIcon(result)}</Text>
                <View>
                <Text className="text-green-800 font-bold text-xl mb-1">
                    {getRegionTitle(result)} Kazandınız!
                </Text>
                <Text className="text-green-600 text-sm">
                    Analiz sayfasına yönlendiriliyorsunuz...
                </Text>
                </View>
            </View>
            </Card>
        </Animated.View>
      )}

      {/* Premium CTA */}
      {!result && (
         <Card className="mt-8 p-4 bg-primary/5 border border-primary/20 w-full">
            <Text className="text-center text-sm text-muted-foreground">
            💎 <Text className="font-semibold">Tüm 6 bölgeyi</Text> analiz etmek için{' '}
            <Text className="text-primary font-semibold">Premium'a geç</Text>
            </Text>
        </Card>
      )}
    </View>
  );
}

export default SpinWheel;