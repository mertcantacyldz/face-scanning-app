// app/(tabs)/index.tsx - Home Screen
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { WebView } from 'react-native-webview';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { useFaceMesh } from '@/hooks/use-face-mesh';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface Profile {
  id: string;
  full_name: string;
  is_premium: boolean;
}

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { session } = useAuth();

  // Face mesh analiz hook'u
  const {
    mediaPipeReady,
    selectedImage,
    faceLandmarks,
    meshImageUri,
    meshValidation,
    isAnalyzing,
    showImagePicker,
    webViewRef,
    handleWebViewMessage,
    handleConfirmMesh,
    handleRetake,
    startNewAnalysis,
    takePhoto,
    pickImage,
    showPhotoGuidelines,
    setShowImagePicker,
    mediaPipeHTML,
  } = useFaceMesh();

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [showedOnboarding, setShowedOnboarding] = useState<boolean>(false);
  const carouselRef = useRef<any>(null);
  const arrowScale = useSharedValue(1);

  // Kullanıcı profilini al - session hazır olduğunda
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) {
        console.log('No session yet, waiting...');
        return;
      }

      try {
        const userId = session.user.id;
        console.log('Fetching profile for user:', userId);

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileData) {
          console.log('Profile loaded successfully:', profileData);
          setProfile(profileData);
        } else {
          console.log('Profile not found, error:', error);
          // Anonymous user için default profile oluştur
          setProfile({
            id: userId,
            full_name: 'Kullanıcı',
            is_premium: false,
          });
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error);
        // Hata durumunda da default profile kullan
        if (session?.user) {
          setProfile({
            id: session.user.id,
            full_name: 'Kullanıcı',
            is_premium: false,
          });
        }
      }
    };

    fetchProfile();
  }, [session]); // session değiştiğinde yeniden çalışsın

  // Arrow pulse animation
  useEffect(() => {
    if (!hasInteracted) {
      arrowScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      arrowScale.value = 1;
    }

    return () => {
      arrowScale.value = 1;
    };
  }, [hasInteracted]);

  // Onboarding hint: auto-swipe on first load
  useEffect(() => {
    if (meshImageUri && !showedOnboarding && carouselRef.current) {
      const timer = setTimeout(() => {
        // Animate carousel slightly to the right then back
        carouselRef.current?.scrollTo({ index: 0.3, animated: true });

        setTimeout(() => {
          carouselRef.current?.scrollTo({ index: 0, animated: true });
          setShowedOnboarding(true);
        }, 500);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [meshImageUri, showedOnboarding]);

  // Animated arrow style
  const animatedArrowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: arrowScale.value }]
  }));

  // Carousel render function
  const renderCarouselItem = ({ item }: { item: string }) => (
    <View className="flex-1 justify-center items-center">
      <Image
        source={{ uri: item }}
        style={{
          width: screenWidth - 80,
          height: screenWidth - 80,
          borderRadius: 16
        }}
        resizeMode="contain"
      />
    </View>
  );

  // Handle carousel index change
  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

 if (!profile) {
  return (
    <View className="flex-1 bg-background justify-center items-center">
      <View className="items-center">
        <Text className="text-lg text-muted-foreground mb-2">Yükleniyor...</Text>
        <Text className="text-sm text-muted-foreground">Profil bilgileri alınıyor</Text>
      </View>
    </View>
  );
}


return (
  <View className="flex-1 bg-background">
    {/* Hidden WebView for FaceAnalyzer AI */}
    <View style={{ 
      width: 0, 
      height: 0, 
      overflow: 'hidden',
      position: 'absolute',
    }}>
      <WebView
        ref={webViewRef}
        source={{ html: mediaPipeHTML }}
        onMessage={handleWebViewMessage}
        style={{ 
          width: 1, 
          height: 1,
          opacity: 0,
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>

    <ScrollView 
      className="flex-1"
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hoşgeldin Mesajı - Sadece mesh yokken görünür */}
      {!meshImageUri && (
        <>
          <View className="mb-8">
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-2xl font-bold text-foreground">
                Merhaba {profile.full_name}!
              </Text>
              <Ionicons name="hand-right-outline" size={28} color="#8B5CF6" />
            </View>
            <Text className="text-muted-foreground">
              {profile.is_premium ? 'Premium üyeliğinizle' : 'Ücretsiz hesabınızla'}
              {' '}FaceAnalyzer AI ile 468 noktalı yüz analizi yapmaya hazır mısınız?
            </Text>
          </View>

          {/* FaceAnalyzer AI Durumu */}
          <Card className="p-4 mb-6">
            <CardHeader className="p-0 mb-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="hardware-chip-outline" size={18} color="#8B5CF6" />
                <Text className="text-primary font-semibold">
                  FaceAnalyzer AI Durumu
                </Text>
              </View>
            </CardHeader>
            <CardContent className="p-0">
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name={mediaPipeReady ? 'checkmark-circle' : 'time-outline'}
                  size={16}
                  color={mediaPipeReady ? '#10B981' : '#F59E0B'}
                />
                <Text className="text-muted-foreground text-sm">
                  {mediaPipeReady
                    ? 'FaceAnalyzer AI hazır - 468 noktalı özgün analiz teknolojimiz!'
                    : 'FaceAnalyzer AI yükleniyor...'
                  }
                </Text>
              </View>
            </CardContent>
          </Card>
        </>
      )}

      {/* Ana Analiz Kartı */}
      {!selectedImage ? (
        <Card className="p-6 mb-6">
          <CardContent className="items-center p-0">
            <View className="w-24 h-24 bg-muted rounded-full items-center justify-center mb-4">
              <Ionicons name="hardware-chip-outline" size={56} color="#8B5CF6" />
            </View>

            <Text className="text-xl font-bold text-foreground mb-3 text-center">
              FaceAnalyzer AI
            </Text>
            
            <Text className="text-muted-foreground text-center mb-6 leading-6">
              Özgün yüz analiz teknolojimiz ile yüzünüzün 468 özel noktasını 
              gelişmiş AI ile tespit ediyoruz
            </Text>

            <Button
              onPress={showPhotoGuidelines}
              disabled={!mediaPipeReady}
              className="w-full"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name={mediaPipeReady ? 'hardware-chip-outline' : 'time-outline'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text className="text-primary-foreground font-semibold text-base">
                  {mediaPipeReady ? 'FaceAnalyzer ile Analiz Et' : 'AI Yükleniyor...'}
                </Text>
              </View>
            </Button>

            {!mediaPipeReady && (
              <Text className="text-muted-foreground text-xs mt-2 text-center">
                FaceAnalyzer AI teknolojimiz yükleniyor, lütfen bekleyin
              </Text>
            )}
          </CardContent>
        </Card>
      ) : (
        // Analiz Sonuçları
        <Card className="p-6 mb-6">
          <CardHeader className="p-0 mb-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="hardware-chip-outline" size={20} color="#8B5CF6" />
              <Text className="text-lg font-bold text-foreground">
                FaceAnalyzer AI Analizi
              </Text>
            </View>
          </CardHeader>
          
        

          {/* Loading veya Sonuç */}
          {isAnalyzing ? (
            <View className="items-center py-8">
              <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
                <Ionicons name="hardware-chip-outline" size={32} color="#8B5CF6" />
              </View>
              <Text className="text-primary font-semibold mb-2 text-center">
                FaceAnalyzer AI Analizi
              </Text>
              <Text className="text-muted-foreground text-sm text-center">
                Özgün AI teknolojimiz ile 468 yüz noktası tespit ediliyor...
              </Text>
            </View>
          ) : faceLandmarks ? (
            <View>
              {/* Ana Sonuç Kartı */}
              <Card className="bg-primary/10 p-4 rounded-lg mb-4 border-primary/20">
                <CardHeader className="p-0 mb-3">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle" size={22} color="#8B5CF6" />
                    <Text className="text-primary font-bold text-lg">
                      FaceAnalyzer AI Analizi Tamamlandı!
                    </Text>
                  </View>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="hardware-chip-outline" size={16} color="#8B5CF6" />
                    <Text className="text-primary text-sm">
                      <Text className="font-semibold">{faceLandmarks.totalPoints}</Text> FaceAnalyzer noktası tespit edildi
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="resize-outline" size={16} color="#8B5CF6" />
                    <Text className="text-primary text-sm">
                      Yüz boyutu: <Text className="font-semibold">{Math.round(faceLandmarks.faceBox.width)}x{Math.round(faceLandmarks.faceBox.height)}</Text> piksel
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="analytics-outline" size={16} color="#8B5CF6" />
                    <Text className="text-primary text-sm">
                      FaceAnalyzer doğruluk: <Text className="font-semibold">{(faceLandmarks.confidence * 100).toFixed(1)}%</Text>
                    </Text>
                  </View>
                </CardContent>
              </Card>

            </View>
          ) : null}

          {/* Mesh Önizleme */}
          {meshImageUri && (
            <View className="mt-6">
              {/* Carousel Container */}
              <View className="items-center mb-4">
                <View
                  className="relative"
                  style={{
                    width: screenWidth - 80,
                    height: screenWidth - 80,
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  <Carousel
                    ref={carouselRef}
                    data={[meshImageUri, selectedImage || meshImageUri]}
                    renderItem={renderCarouselItem}
                    width={screenWidth - 80}
                    height={screenWidth - 80}
                    mode="parallax"
                    modeConfig={{
                      parallaxScrollingScale: 0.95,
                      parallaxScrollingOffset: 50,
                    }}
                    defaultIndex={0}
                    loop={false}
                    enabled={true}
                    onSnapToItem={handleIndexChange}
                  />

                  {/* Right Arrow (show on mesh image - index 0) */}
                  {currentIndex === 0 && (
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          right: 16,
                          top: '50%',
                          marginTop: -20,
                          zIndex: 10,
                        },
                        animatedArrowStyle
                      ]}
                    >
                      <Pressable
                        onPress={() => carouselRef.current?.next({ animated: true })}
                        className="bg-black/40 dark:bg-white/20 rounded-full w-10 h-10 items-center justify-center"
                      >
                        <Ionicons name="chevron-forward-outline" size={24} color="#FFFFFF" />
                      </Pressable>
                    </Animated.View>
                  )}

                  {/* Left Arrow (show on original image - index 1) */}
                  {currentIndex === 1 && (
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          left: 16,
                          top: '50%',
                          marginTop: -20,
                          zIndex: 10,
                        },
                        animatedArrowStyle
                      ]}
                    >
                      <Pressable
                        onPress={() => carouselRef.current?.prev({ animated: true })}
                        className="bg-black/40 dark:bg-white/20 rounded-full w-10 h-10 items-center justify-center"
                      >
                        <Ionicons name="chevron-back-outline" size={24} color="#FFFFFF" />
                      </Pressable>
                    </Animated.View>
                  )}
                </View>

                {/* Label */}
                <Text className="text-muted-foreground text-xs mt-2">
                  {currentIndex === 0 ? 'Mesh Görünümü' : 'Orijinal Fotoğraf'}
                </Text>
              </View>

              {/* Validation Sonucu */}
              {meshValidation.isValid ? (
                <Card className="bg-green-500/10 border-green-500/40 p-4 mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <View className="ml-3 flex-1">
                      <Text className="text-foreground font-semibold">
                        Tarama Başarılı!
                      </Text>
                      <Text className="text-muted-foreground text-xs mt-1">
                        • Tüm yüz bölgeleri tespit edildi{'\n'}
                        • Noktalar doğru konumlanmış{'\n'}
                        • Analiz için hazır
                      </Text>
                    </View>
                  </View>
                </Card>
              ) : (
                <Card className="bg-yellow-500/10 border-yellow-500/40 p-4 mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="warning" size={24} color="#F59E0B" />
                    <View className="ml-3 flex-1">
                      <Text className="text-foreground font-semibold">
                        Dikkat Gerekli
                      </Text>
                      <Text className="text-muted-foreground text-xs mt-1">
                        {meshValidation.message}
                        {'\n\n'}Devam edebilirsiniz ama daha iyi sonuç için yeniden deneyebilirsiniz.
                      </Text>
                    </View>
                  </View>
                </Card>
              )}

              {/* AI Disclaimer */}
              <Text className="text-xs text-muted-foreground text-center mb-3 px-2">
                ℹ️ Sonuçlar yapay zeka tarafından üretilen yaklaşık değerlendirmelerdir. Fotoğraf kalitesi ve ışık sonuçları etkileyebilir.
              </Text>

              {/* Butonlar */}
              <View className="flex-row gap-3">
                {/* Tekrar Çek */}
                <Pressable
                  onPress={handleRetake}
                  className="flex-1"
                >
                  <Card className="p-4 items-center bg-muted">
                    <Ionicons name="camera-reverse" size={24} color="#111827" />
                    <Text className="text-foreground mt-2 font-medium">Tekrar Çek</Text>
                  </Card>
                </Pressable>

                {/* Devam Et */}
                <Pressable
                  onPress={handleConfirmMesh}
                  className="flex-1"
                >
                  <Card className="p-4 items-center bg-primary">
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                    <Text className="text-primary-foreground mt-2 font-medium">
                      Devam Et
                    </Text>
                  </Card>
                </Pressable>
              </View>
            </View>
          )}

          {/* Yeni Analiz Butonu */}
          <Button
            onPress={startNewAnalysis}
            variant="outline"
            className="mt-6"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="refresh-outline" size={18} color="#8B5CF6" />
              <Text className="text-primary font-semibold">
                Yeni FaceAnalyzer Analizi
              </Text>
            </View>
          </Button>
        </Card>
      )}

      {/* Premium Tanıtımı */}
      {!profile.is_premium && (
        <Card className="p-6">
          <CardContent className="items-center p-0">
            <Text className="text-foreground font-bold text-lg mb-3 text-center">
              ⭐ Premium ile Çok Daha Fazlası
            </Text>
            <Text className="text-muted-foreground mb-4 text-center leading-6">
              • Sınırsız FaceAnalyzer analiz{'\n'}
              • Detaylı yüz şekli raporları{'\n'}
              • Kişiselleştirilmiş öneriler{'\n'}
              • Analiz geçmişi ve ilerleme takibi{'\n'}
              • Öncelikli AI analiz hızı
            </Text>
            <Button 
              onPress={() => {/* Navigate to premium */}}
              className="w-full"
            >
              <Text className="text-primary-foreground font-bold">
                🚀 Premium&apos;a Geç
              </Text>
            </Button>
          </CardContent>
        </Card>
      )}
    </ScrollView>

    {/* Image Picker Modal */}
    <Modal
      visible={showImagePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePicker(false)}
    >
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
        activeOpacity={1}
        onPress={() => setShowImagePicker(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-background rounded-t-3xl p-6">
              <View className="w-12 h-1 bg-muted rounded-full self-center mb-6" />
              
              <Text className="text-xl font-bold text-foreground mb-2 text-center">
                FaceAnalyzer AI ile Analiz
              </Text>
              <Text className="text-muted-foreground text-sm text-center mb-4">
                468 noktalı özgün AI analizi için fotoğraf seçin
              </Text>

              {/* İpuçları */}
              <View className="bg-muted/30 rounded-xl p-4 mb-4">
                <Text className="text-foreground font-semibold text-sm mb-2">
                  💡 İyi Bir Tarama İçin:
                </Text>
                <Text className="text-muted-foreground text-xs">
                  • Yüzünüz tamamen görünür olmalı{'\n'}
                  • Gözler, burun ve ağız net olmalı{'\n'}
                  • Saç veya el yüzü kapatmamalı{'\n'}
                  • Işıklandırma yeterli olmalı
                </Text>
              </View>

              <View className=" flex justify-center gap-3">
                <Button 
                  onPress={takePhoto}
                  className="w-full"
                >
                  <Text className="text-primary-foreground font-semibold text-base">
                    📷 Kameradan Çek
                  </Text>
                </Button>
                
                <Button 
                  onPress={pickImage}
                  variant="outline"
                  className="w-full"
                >
                  <Text className="text-primary font-semibold text-base">
                    🖼️ Galeriden Seç
                  </Text>
                </Button>
                
                <Button 
                  onPress={() => setShowImagePicker(false)}
                  variant="ghost"
                  className="w-full"
                >
                  <Text className="text-muted-foreground font-semibold">
                    İptal
                  </Text>
                </Button>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>

  </View>
);
}