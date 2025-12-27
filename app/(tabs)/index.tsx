// app/(tabs)/index.tsx - Home Screen
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('home');
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

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const carouselRef = useRef<any>(null);
  const arrowScale = useSharedValue(1);
  const arrowTranslateX = useSharedValue(0); // New: for horizontal slide

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
            full_name: t('welcome.defaultUser', { ns: 'common' }),
            is_premium: false,
          });
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error);
        // Hata durumunda da default profile kullan
        if (session?.user) {
          setProfile({
            id: session.user.id,
            full_name: t('welcome.defaultUser', { ns: 'common' }),
            is_premium: false,
          });
        }
      }
    };

    fetchProfile();
  }, [session]); // session değiştiğinde yeniden çalışsın

  // Enhanced arrow animation: pulse + slide
  useEffect(() => {
    if (!hasInteracted) {
      // Scale animation (pulse) - more noticeable
      arrowScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 500 }),  // Bigger pulse
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );

      // Horizontal slide animation - more movement
      arrowTranslateX.value = withRepeat(
        withSequence(
          withTiming(12, { duration: 500 }),  // Slide more to the right
          withTiming(0, { duration: 500 })    // Slide back
        ),
        -1,
        false
      );
    } else {
      arrowScale.value = withTiming(1, { duration: 200 });
      arrowTranslateX.value = withTiming(0, { duration: 200 });
    }

    return () => {
      arrowScale.value = 1;
      arrowTranslateX.value = 0;
    };
  }, [hasInteracted]);



  // Animated arrow style with both scale and horizontal movement
  const animatedArrowStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: arrowScale.value },
      { translateX: arrowTranslateX.value }
    ]
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
          <Text className="text-lg text-muted-foreground mb-2">{t('loading.title')}</Text>
          <Text className="text-sm text-muted-foreground">{t('loading.subtitle')}</Text>
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
                  {t('welcome.greeting', { name: profile.full_name })}
                </Text>
                <Ionicons name="hand-right-outline" size={28} color="#8B5CF6" />
              </View>
              <Text className="text-muted-foreground">
                {t('welcome.subtitle', {
                  membership: profile.is_premium ? t('welcome.premium') : t('welcome.free')
                })}
              </Text>
            </View>

            {/* FaceAnalyzer AI Durumu */}
            <Card className="p-4 mb-6">
              <CardHeader className="p-0 mb-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="hardware-chip-outline" size={18} color="#8B5CF6" />
                  <Text className="text-primary font-semibold">
                    {t('aiStatus.title')}
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
                    {mediaPipeReady ? t('aiStatus.ready') : t('aiStatus.loading')}
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
                {t('cta.title')}
              </Text>

              <Text className="text-muted-foreground text-center mb-6 leading-6">
                {t('cta.description')}
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
                    {mediaPipeReady ? t('cta.button') : t('cta.buttonLoading')}
                  </Text>
                </View>
              </Button>

              {!mediaPipeReady && (
                <Text className="text-muted-foreground text-xs mt-2 text-center">
                  {t('aiStatus.loading')}
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
                  {t('analysis.title')}
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
                  {t('analysis.analyzing')}
                </Text>
                <Text className="text-muted-foreground text-sm text-center">
                  {t('analysis.analyzingSubtitle')}
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
                        {t('analysis.success')}
                      </Text>
                    </View>
                  </CardHeader>
                  <CardContent className="p-0 space-y-2">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="hardware-chip-outline" size={16} color="#8B5CF6" />
                      <Text className="text-primary text-sm">
                        {t('analysis.pointsDetected', { count: faceLandmarks.totalPoints })}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="resize-outline" size={16} color="#8B5CF6" />
                      <Text className="text-primary text-sm">
                        {t('analysis.faceSize', {
                          width: Math.round(faceLandmarks.faceBox.width),
                          height: Math.round(faceLandmarks.faceBox.height)
                        })}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="analytics-outline" size={16} color="#8B5CF6" />
                      <Text className="text-primary text-sm">
                        {t('analysis.accuracy', { accuracy: (faceLandmarks.confidence * 100).toFixed(1) })}
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
                    {t('analysis.swipeHint')}
                  </Text>
                </View>

                {/* Validation Sonucu - Quality-based */}
                {meshValidation.quality === 'excellent' ? (
                  // 🟢 Mükemmel Kalite (Confidence >= 95%)
                  <Card className="bg-green-500/10 border-green-500/40 p-4 mb-4">
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      <View className="ml-3 flex-1">
                        <Text className="text-foreground font-semibold">
                          Mükemmel Kalite!
                        </Text>
                        <Text className="text-muted-foreground text-xs mt-1">
                          • Tüm yüz bölgeleri tespit edildi{'\n'}
                          • Noktalar doğru konumlanmış{'\n'}
                          • Analiz için hazır
                        </Text>
                      </View>
                    </View>
                  </Card>
                ) : meshValidation.quality === 'good' ? (
                  // 🔵 İyi Kalite (Confidence 80-94%)
                  <Card className="bg-blue-500/10 border-blue-500/40 p-4 mb-4">
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle-outline" size={24} color="#3B82F6" />
                      <View className="ml-3 flex-1">
                        <Text className="text-foreground font-semibold">
                          İyi Kalite
                        </Text>
                        <Text className="text-muted-foreground text-xs mt-1">
                          {meshValidation.message}{'\n'}
                          Devam edebilirsiniz.
                        </Text>
                      </View>
                    </View>
                  </Card>
                ) : (
                  // 🟡 Düşük Kalite / Uyarı (Confidence < 80%)
                  <Card className="bg-yellow-500/10 border-yellow-500/40 p-4 mb-4">
                    <View className="flex-row items-center">
                      <Ionicons name="warning" size={24} color="#F59E0B" />
                      <View className="ml-3 flex-1">
                        <Text className="text-foreground font-semibold">
                          {meshValidation.quality === 'warning' ? 'Dikkat!' : 'Düşük Kalite'}
                        </Text>
                        <Text className="text-muted-foreground text-xs mt-1">
                          {meshValidation.message}{'\n\n'}
                          Daha iyi sonuç için "Tekrar Çek" yapabilirsiniz.
                        </Text>
                      </View>
                    </View>
                  </Card>
                )}

                {/* AI Disclaimer */}
                <Text className="text-xs text-muted-foreground text-center mb-3 px-2">
                  {t('disclaimer')}
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
                      <Text className="text-foreground mt-2 font-medium">{t('actions.retake')}</Text>
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
                        {t('actions.confirm')}
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
                  {t('actions.newAnalysis')}
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
                {t('premium.title')}
              </Text>
              <Text className="text-muted-foreground mb-4 text-center leading-6">
                {t('premium.benefits')}
              </Text>
              <Button
                onPress={() => {/* Navigate to premium */ }}
                className="w-full"
              >
                <Text className="text-primary-foreground font-bold">
                  {t('premium.button')}
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
                  {t('photoGuidelines.title')}
                </Text>
                <Text className="text-muted-foreground text-sm text-center mb-4">
                  {t('photoGuidelines.subtitle')}
                </Text>

                {/* İpuçları */}
                <View className="bg-muted/30 rounded-xl p-4 mb-4">
                  <Text className="text-foreground font-semibold text-sm mb-2">
                    {t('photoGuidelines.rules.title')}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {t('photoGuidelines.rules.list')}
                  </Text>
                </View>

                <View className=" flex justify-center gap-3">
                  <Button
                    onPress={takePhoto}
                    className="w-full"
                  >
                    <Text className="text-primary-foreground font-semibold text-base">
                      📷 {t('photoGuidelines.camera')}
                    </Text>
                  </Button>

                  <Button
                    onPress={pickImage}
                    variant="outline"
                    className="w-full"
                  >
                    <Text className="text-primary font-semibold text-base">
                      🖼️ {t('photoGuidelines.gallery')}
                    </Text>
                  </Button>

                  <Button
                    onPress={() => setShowImagePicker(false)}
                    variant="ghost"
                    className="w-full"
                  >
                    <Text className="text-muted-foreground font-semibold">
                      {t('photoGuidelines.cancel')}
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