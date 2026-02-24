import { Text } from '@/components/ui/text';
import { type MultiPhotoState } from '@/hooks/use-face-mesh';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { HorizontalValidationCard } from './HorizontalValidationCard';

interface ValidatingMeshCarouselProps {
    photos: MultiPhotoState[];
}

const { width: screenWidth } = Dimensions.get('window');
const CAROUSEL_WIDTH = screenWidth - 140;
const CAROUSEL_HEIGHT = CAROUSEL_WIDTH * 1.3;


export function ValidatingMeshCarousel({ photos }: ValidatingMeshCarouselProps) {
    const { t } = useTranslation('home');
    const processedPhotos = photos.filter((p) => p.meshImageUri !== null);
    const carouselRef = useRef<any>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    if (processedPhotos.length === 0) {
        return null;
    }

    const renderItem = ({ item, index }: { item: MultiPhotoState; index: number }) => {
        return (
            <View className="flex-1 px-2">
                {/* Kalite Kartı - Fotoğrafın Üstünde */}
                <View style={{ marginBottom: 2, height: 44 }}>
                    {item.validation && (
                        <HorizontalValidationCard
                            quality={item.validation.quality}
                            title={t(`validation.quality.${item.validation.quality}`)}
                        />
                    )}
                </View>

                {/* Fotoğraf Alanı */}
                <View className="bg-card rounded-2xl overflow-hidden border border-border relative" style={{ flex: 1 }}>
                    <Image
                        source={{ uri: item.meshImageUri! }}
                        style={{ width: '100%', height: '100%', borderRadius: 16 }}
                        resizeMode="cover"
                    />

                    {/* Fotoğraf Numarası - Sağ Alt Köşede daha şık */}
                    <View className="absolute bottom-3 right-3 bg-black/40 px-3 py-1 rounded-full border border-white/20">
                        <Text className="text-white text-[10px] font-bold">
                            #{photos.indexOf(item) + 1}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ paddingVertical: 10, alignItems: 'center', width: '100%' }}>
            <View style={{ width: CAROUSEL_WIDTH, height: CAROUSEL_HEIGHT }}>
                <Carousel
                    ref={carouselRef}
                    data={processedPhotos}
                    renderItem={renderItem}
                    width={CAROUSEL_WIDTH}
                    height={CAROUSEL_HEIGHT}
                    loop={false}
                    enabled={processedPhotos.length > 1}
                    pagingEnabled={true}
                    snapEnabled={true}
                    onSnapToItem={setActiveIndex}
                    mode="parallax"
                    modeConfig={{
                        parallaxScrollingScale: 1,
                        parallaxScrollingOffset: 0,
                    }}
                />
            </View>

            {processedPhotos.length > 1 && (
                <View style={{ flexDirection: 'row', marginTop: 16, marginBottom: 8 }}>
                    {processedPhotos.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                width: activeIndex === i ? 16 : 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: activeIndex === i ? '#6366f1' : '#ccc',
                                marginHorizontal: 3,
                                opacity: activeIndex === i ? 1 : 0.5
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
