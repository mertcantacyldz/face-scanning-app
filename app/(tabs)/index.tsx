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
  View,
  useColorScheme,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { WebView } from 'react-native-webview';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  AnimatedBackground,
  FaceScanVisual,
  GlassCard,
  PulsingButton,
  StatusPill,
  FeatureHighlight,
  FeatureHighlightsRow,
} from '@/components/home';
import { useAuth } from '@/hooks/use-auth';
import { useFaceMesh } from '@/hooks/use-face-mesh';
import { usePremium } from '@/hooks/use-premium';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700; // iPhone SE, small Android devices

interface Profile {
  id: string;
  full_name: string;
  is_premium: boolean;
}

export default function HomeScreen() {
  const { t } = useTranslation('home');
  const [profile, setProfile] = useState<Profile | null>(null);
  const { session } = useAuth();
  const { isPremium } = usePremium();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Responsive layout - dynamic tab bar height
  const tabBarHeight = useBottomTabBarHeight();

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
    setShowImagePicker,
    mediaPipeHTML,
  } = useFaceMesh();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const carouselRef = useRef<any>(null);
  const arrowScale = useSharedValue(1);
  const arrowTranslateX = useSharedValue(0);

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
          setProfile({
            id: userId,
            full_name: t('welcome.defaultUser', { ns: 'common' }),
            is_premium: false,
          });
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error);
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
  }, [session]);

  // Enhanced arrow animation: pulse + slide
  useEffect(() => {
    if (!hasInteracted) {
      arrowScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );

      arrowTranslateX.value = withRepeat(
        withSequence(
          withTiming(12, { duration: 500 }),
          withTiming(0, { duration: 500 })
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

  const animatedArrowStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: arrowScale.value },
      { translateX: arrowTranslateX.value }
    ]
  }));

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

  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center">
        <AnimatedBackground />
        <View className="items-center z-10">
          <Text className="text-lg text-muted-foreground mb-2">{t('loading.title')}</Text>
          <Text className="text-sm text-muted-foreground">{t('loading.subtitle')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Animated Background */}
      <AnimatedBackground />

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

      {/* Main Content Area */}
      {!meshImageUri && !selectedImage ? (
        /* STATIC HERO LAYOUT (No Scroll) */
        <View className="flex-1 px-4 pb-5 justify-between">
          <View className="flex-1 pt-2">
            {/* Status Pill */}
            <View className="mb-4">
              <StatusPill
                isReady={mediaPipeReady}
                readyText={t('aiStatus.ready')}
                loadingText={t('aiStatus.loading')}
              />
            </View>

            {/* Face Scan Visual */}
            <FaceScanVisual />

            {/* Hero Text - Responsive margins */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(200)}
              style={{ alignItems: 'center', marginTop: isSmallScreen ? 16 : 32, marginBottom: isSmallScreen ? 8 : 12 }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: isDark ? '#F1F5F9' : '#1E293B',
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                {t('hero.tagline')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textAlign: 'center',
                }}
              >
                {t('hero.subtitle')}
              </Text>
            </Animated.View>

            {/* Feature Highlights */}
            <View className="mt-2">
              <FeatureHighlightsRow>
                <FeatureHighlight
                  icon="git-network-outline"
                  label={t('features.points')}
                  color="primary"
                  delay={300}
                />
                <FeatureHighlight
                  icon="shield-checkmark-outline"
                  label={t('features.privacy')}
                  color="accent"
                  delay={400}
                />
                <FeatureHighlight
                  icon="sparkles-outline"
                  label={t('features.aiPowered')}
                  color="premium"
                  delay={500}
                />
              </FeatureHighlightsRow>
            </View>
          </View>

          {/* CTA Section - Pushed to bottom with dynamic tab bar spacing */}
          <View style={{ marginBottom: tabBarHeight + 20 }}>
            <GlassCard
              delay={600}
              borderGradient="primary"
              intensity="medium"
              style={{ padding: 24 }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textAlign: 'center',
                  marginBottom: 20,
                  lineHeight: 22,
                }}
              >
                {t('cta.description')}
              </Text>

              <PulsingButton
                onPress={() => setShowImagePicker(true)}
                disabled={!mediaPipeReady}
                title={mediaPipeReady ? t('cta.button') : t('cta.buttonLoading')}
                icon="scan-outline"
              />

              {/* Privacy note */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                <Ionicons name="lock-closed-outline" size={14} color={isDark ? '#64748B' : '#94A3B8'} />
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? '#64748B' : '#94A3B8',
                    marginLeft: 6,
                  }}
                >
                  {t('cta.disclaimer')}
                </Text>
              </View>
            </GlassCard>
          </View>
        </View>
      ) : (
        /* SCROLLABLE ANALYSIS LAYOUT */
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={true}
          indicatorStyle={isDark ? 'white' : 'black'}
          scrollIndicatorInsets={{ right: 2 }}
        >

          {/* ANALYSIS RESULTS - When image selected */}
          {selectedImage && (
            <GlassCard
              delay={0}
              borderGradient="primary"
              intensity="medium"
              style={{ padding: 24 }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="analytics-outline" size={20} color="#6366F1" />
                  <Text className="text-lg font-bold text-foreground">
                    {t('analysis.title')}
                  </Text>
                </View>
                <Pressable
                  onPress={handleRetake}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isDark ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                </Pressable>
              </View>

              {/* Loading or Results */}
              {isAnalyzing ? (
                <View className="items-center py-8">
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="scan-outline" size={32} color="#6366F1" />
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
                  {/* Success Card */}
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <View className="flex-row items-center gap-2 mb-3">
                      <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                      <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 16 }}>
                        {t('analysis.success')}
                      </Text>
                    </View>
                    <View className="space-y-2">
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="git-network-outline" size={16} color="#10B981" />
                        <Text style={{ color: isDark ? '#A7F3D0' : '#065F46', fontSize: 14 }}>
                          {t('analysis.pointsDetected', { count: faceLandmarks.totalPoints })}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="resize-outline" size={16} color="#10B981" />
                        <Text style={{ color: isDark ? '#A7F3D0' : '#065F46', fontSize: 14 }}>
                          {t('analysis.faceSize', {
                            width: Math.round(faceLandmarks.faceBox.width),
                            height: Math.round(faceLandmarks.faceBox.height)
                          })}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="analytics-outline" size={16} color="#10B981" />
                        <Text style={{ color: isDark ? '#A7F3D0' : '#065F46', fontSize: 14 }}>
                          {t('analysis.accuracy', { accuracy: (faceLandmarks.confidence * 100).toFixed(1) })}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Mesh Preview */}
              {meshImageUri && (
                <View className="mt-4">
                  {/* Carousel Container */}
                  <View className="items-center mb-4">
                    <View
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

                      {/* Right Arrow */}
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
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              borderRadius: 20,
                              width: 40,
                              height: 40,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="chevron-forward-outline" size={24} color="#FFFFFF" />
                          </Pressable>
                        </Animated.View>
                      )}

                      {/* Left Arrow */}
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
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              borderRadius: 20,
                              width: 40,
                              height: 40,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="chevron-back-outline" size={24} color="#FFFFFF" />
                          </Pressable>
                        </Animated.View>
                      )}
                    </View>

                    <Text className="text-muted-foreground text-xs mt-2">
                      {t('analysis.swipeHint')}
                    </Text>
                  </View>

                  {/* Validation Result */}
                  {meshValidation.quality === 'excellent' ? (
                    <View
                      style={{
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                      }}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        <View className="ml-3 flex-1">
                          <Text className="text-foreground font-semibold">
                            {t('validation.excellent.title')}
                          </Text>
                          <Text className="text-muted-foreground text-xs mt-1">
                            {t('validation.excellent.details')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : meshValidation.quality === 'good' ? (
                    <View
                      style={{
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                      }}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle-outline" size={24} color="#3B82F6" />
                        <View className="ml-3 flex-1">
                          <Text className="text-foreground font-semibold">
                            {t('validation.acceptable.title')}
                          </Text>
                          <Text className="text-muted-foreground text-xs mt-1">
                            {t('validation.acceptable.issue', { message: meshValidation.message })}
                            {t('validation.acceptable.note')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View
                      style={{
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                      }}
                    >
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
                    </View>
                  )}

                  {/* AI Disclaimer */}
                  <View className="flex-row justify-center items-start mb-3 px-2">
                    <Ionicons name="information-circle-outline" size={16} color="#6B7280" style={{ marginRight: 4, marginTop: 1 }} />
                    <Text className="text-xs text-muted-foreground text-center flex-1">
                      {t('disclaimer')}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3">
                    <Pressable onPress={handleRetake} className="flex-1">
                      <View
                        style={{
                          backgroundColor: isDark ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.1)',
                          borderRadius: 16,
                          padding: 16,
                          minHeight: 80,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(100, 116, 139, 0.4)' : 'rgba(100, 116, 139, 0.2)',
                        }}
                      >
                        <Ionicons name="refresh-outline" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                        <Text className="text-foreground mt-2 font-medium">{t('actions.retake')}</Text>
                      </View>
                    </Pressable>

                    <Pressable onPress={handleConfirmMesh} className="flex-1">
                      <View
                        style={{
                          backgroundColor: '#6366F1',
                          borderRadius: 16,
                          padding: 16,
                          minHeight: 80,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={24} color="white" />
                        <Text style={{ color: 'white', marginTop: 8, fontWeight: '600' }}>
                          {t('actions.confirm')}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}

            </GlassCard>
          )}

          {/* Premium Promotion */}
          {!isPremium && !selectedImage && (
            <GlassCard
              delay={800}
              borderGradient="premium"
              intensity="medium"
              style={{ padding: 24, marginTop: 24 }}
            >
              <View className="items-center">
                <View className="flex-row items-center justify-center gap-2 mb-3">
                  <Ionicons name="diamond-outline" size={20} color="#F59E0B" />
                  <Text
                    style={{
                      color: isDark ? '#FCD34D' : '#D97706',
                      fontWeight: '700',
                      fontSize: 18,
                    }}
                  >
                    {t('premium.title')}
                  </Text>
                </View>
                <Text
                  style={{
                    color: isDark ? '#94A3B8' : '#64748B',
                    textAlign: 'center',
                    marginBottom: 16,
                    lineHeight: 22,
                  }}
                >
                  {t('premium.benefits')}
                </Text>
                <Button
                  onPress={() => {/* Navigate to premium */ }}
                  style={{
                    backgroundColor: '#F59E0B',
                    width: '100%',
                  }}
                >
                  <Text style={{ color: '#1E293B', fontWeight: '700' }}>
                    {t('premium.button')}
                  </Text>
                </Button>
              </View>
            </GlassCard>
          )}
        </ScrollView>
      )
      }

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
              <View
                style={{
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 4,
                    backgroundColor: isDark ? '#475569' : '#E2E8F0',
                    borderRadius: 2,
                    alignSelf: 'center',
                    marginBottom: 24,
                  }}
                />

                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: isDark ? '#F1F5F9' : '#1E293B',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  {t('photoGuidelines.title')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? '#94A3B8' : '#64748B',
                    textAlign: 'center',
                    marginBottom: 16,
                  }}
                >
                  {t('photoGuidelines.subtitle')}
                </Text>

                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <View className="flex-row items-center mb-3 gap-2">
                    <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                    <Text
                      style={{
                        color: isDark ? '#F1F5F9' : '#1E293B',
                        fontWeight: '600',
                        fontSize: 14,
                      }}
                    >
                      {t('photoGuidelines.rules.title')}
                    </Text>
                  </View>
                  <View className="gap-2">
                    {t('photoGuidelines.rules.list').split('\n').map((rule, index) => (
                      <View key={index} className="flex-row items-start">
                        <Ionicons name="ellipse" size={6} color="#6B7280" style={{ marginTop: 7, marginRight: 8 }} />
                        <Text
                          style={{
                            color: isDark ? '#94A3B8' : '#64748B',
                            fontSize: 13,
                            lineHeight: 20,
                            flex: 1,
                          }}
                        >
                          {rule.replace(/^•\s*/, '')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="gap-3">
                  <Button onPress={takePhoto} className="w-full">
                    <View className="flex-row items-center justify-center gap-2">
                      <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                      <Text className="text-primary-foreground font-semibold text-base">
                        {t('photoGuidelines.camera')}
                      </Text>
                    </View>
                  </Button>

                  <Button onPress={pickImage} variant="outline" className="w-full">
                    <View className="flex-row items-center justify-center gap-2">
                      <Ionicons name="image-outline" size={20} color="#6366F1" />
                      <Text className="text-primary font-semibold text-base">
                        {t('photoGuidelines.gallery')}
                      </Text>
                    </View>
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
