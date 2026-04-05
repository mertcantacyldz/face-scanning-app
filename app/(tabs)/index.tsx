// app/(tabs)/index.tsx - Home Screen

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { AIConsentModal } from '@/components/AIConsentModal';
import {
  AnimatedBackground,
  HeroLayout,
  ImagePickerModal,
  MultiPhotoPickerModal,
  SavedPhotoLayout,
} from '@/components/home';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { useFaceMesh } from '@/hooks/use-face-mesh';
import { usePremium } from '@/hooks/use-premium';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

// ============================================
// TYPES
// ============================================

interface Profile {
  id: string;
  full_name: string;
  is_premium: boolean;
  ai_consent_given?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export default function HomeScreen() {
  const { t } = useTranslation('home');
  const [profile, setProfile] = useState<Profile | null>(null);
  const { session } = useAuth();
  const { isPremium } = usePremium();

  // Responsive layout - dynamic tab bar height
  const tabBarHeight = useBottomTabBarHeight();

  // Face mesh analysis hook
  const {
    mediaPipeReady,
    showImagePicker,
    webViewRef,
    handleWebViewMessage,
    startNewAnalysis,
    pickImage,
    setShowImagePicker,
    mediaPipeHTML,
    // Saved photo state (legacy single photo)
    savedPhotoUri,
    savedPhotoDate,
    savedPhotoAnalysisId,
    isLoadingPhoto,
    clearSavedPhoto,
    // Multi-photo state
    multiPhotos,
    currentPhotoIndex,
    multiPhotoProcessingStatus,
    consistencyScore,
    savedMultiPhotos,
    // Multi-photo handlers
    resetMultiPhotoState,
    removeMultiPhoto,
    processAllMultiPhotos,
    finalizeMultiPhotoAnalysis,
    clearMultiPhotoData,
    pickMultipleImages,
  } = useFaceMesh();

  // Multi-photo modal state
  const [showMultiPhotoModal, setShowMultiPhotoModal] = useState(false);

  // AI Consent state
  const [showAIConsentModal, setShowAIConsentModal] = useState(false);
  const [aiConsentGiven, setAiConsentGiven] = useState(false);

  // Mode selection dialog state
  const [showModeSelection, setShowModeSelection] = useState(false);

  // Fetch user profile when session is ready
  useEffect(() => {

    // Bir kez çalıştırıp sonra bu satırı silebilirsin:
    const fetchProfile = async () => {
      if (!session?.user) {
        console.log('[HOME] No session yet, waiting...');
        return;
      }

      try {
        const userId = session.user.id;
        console.log('[HOME] Fetching profile for user:', userId);

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileData) {
          console.log('[HOME] Profile loaded:', JSON.stringify({
            onboarding_completed: profileData.onboarding_completed,
            full_name: profileData.full_name,
            gender: profileData.gender,
          }));

          // 🛡️ Fallback onboarding guard: if profile says onboarding not done, redirect
          if (profileData.onboarding_completed === false) {
            console.log('🚨 [HOME] Onboarding not completed! Redirecting to onboarding...');
            router.replace('/(onboarding)/welcome');
            return;
          }

          setProfile(profileData);
          setAiConsentGiven(!!profileData.ai_consent_given);
        } else {
          console.log('[HOME] Profile not found, error:', error);
          setProfile({
            id: userId,
            full_name: t('welcome.defaultUser', { ns: 'common' }),
            is_premium: false,
          });
        }
      } catch (error) {
        console.error('[HOME] Profil yükleme hatası:', error);
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

  // Loading state - profile or photo loading
  if (!profile || isLoadingPhoto) {
    return (
      <View className="flex-1 justify-center items-center">
        <AnimatedBackground />
        <View className="items-center z-10">
          <Text className="text-lg text-muted-foreground mb-2">
            {t('loading.title')}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {t('loading.subtitle')}
          </Text>
        </View>
      </View>
    );
  }

  // State determination
  const hasStoredPhoto = !!savedPhotoUri;
  const hasMultiPhoto = !!savedMultiPhotos && savedMultiPhotos.photos.length >= 1;
  const isMultiPhotoProcessing = multiPhotoProcessingStatus !== 'idle' && multiPhotoProcessingStatus !== 'complete';

  // Handlers
  const handleViewResults = () => {
    if (savedPhotoAnalysisId) {
      router.push({
        pathname: '/analysis',
        params: { faceAnalysisId: savedPhotoAnalysisId },
      });
    }
  };

  const handleStartScan = () => {
    console.log('🎯 [SCAN] Tarama başlatılıyor');

    // 🛡️ AI Consent Guard (Guideline 2.1)
    // Check if user has given consent. If not, show modal first.
    if (!aiConsentGiven) {
      console.log('🛡️ [SCAN] AI Consent required before scan');
      setShowAIConsentModal(true);
      return;
    }

    startNewAnalysis('multi');
    // Don't clear old analysis - user might cancel modal
    setShowMultiPhotoModal(true);
  };

  const handleCloseImagePicker = () => {
    setShowImagePicker(false);
  };

  const handleCloseMultiPhotoModal = () => {
    setShowMultiPhotoModal(false);
  };

  const handlePickFromGallery = async (): Promise<string[] | null> => {
    const uris = await pickMultipleImages();

    if (!uris || uris.length === 0) {
      return null;
    }

    // Validate photo count (1-3 allowed)
    if (uris.length > 3) {
      Alert.alert(
        t('multiPhoto.invalidCount.title'),
        t('multiPhoto.invalidCount.message')
      );
      return null;
    }

    // If less than 3 photos, show warning
    if (uris.length < 3) {
      return new Promise((resolve) => {
        Alert.alert(
          t('multiPhoto.warning.title'),
          t('multiPhoto.warning.message'),
          [
            {
              text: t('multiPhoto.warning.retry'),
              style: 'cancel',
              onPress: () => resolve(null),
            },
            {
              text: t('multiPhoto.warning.continue'),
              onPress: async () => {
                // User confirmed - process photos but keep modal open
                await processAllMultiPhotos(uris);
                // Don't close modal - user will click "Analiz Et" when ready
                resolve(uris);
              },
            },
          ]
        );
      });
    }

    // 3 photos selected - process and show in modal
    await processAllMultiPhotos(uris);
    // Don't close modal - user will click "Analiz Et" when ready
    return uris;
  };
  // V1.0
  const handleMultiPhotoComplete = async () => {
    console.log('✅ [COMPLETE] Yeni analiz tamamlanıyor');

    // We don't call clearMultiPhotoData() here because it resets the hook's internal state
    // (wiping the landmarks we just selected). finalizeMultiPhotoAnalysis() will handle 
    // the transition and save the new data.

    if (hasStoredPhoto) {
      console.log('🗑️ [COMPLETE] Eski single-photo analiz siliniyor');
      await clearSavedPhoto();
    }

    await finalizeMultiPhotoAnalysis();
    setShowMultiPhotoModal(false);
  };

  const handleRemoveMultiPhoto = (index: number) => {
    removeMultiPhoto(index);
  };

  const handleResetMultiPhotos = () => {
    resetMultiPhotoState();
  };

  const handleAcceptConsent = async () => {
    try {
      console.log('✅ [CONSENT] User accepted AI consent');
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Persist to database
        const { error } = await supabase
          .from('profiles')
          .update({ ai_consent_given: true })
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ [CONSENT] Error updating database:', error);
        }
      }

      setAiConsentGiven(true);
      setShowAIConsentModal(false);

      // Auto-start scan after consent if that was the intent
      startNewAnalysis('multi');
      setShowMultiPhotoModal(true);
    } catch (error) {
      console.error('❌ [CONSENT] Unexpected error:', error);
      // Fallback: let user proceed if UI is open
      setAiConsentGiven(true);
      setShowAIConsentModal(false);
    }
  };

  const handleDeclineConsent = () => {
    console.log('❌ [CONSENT] User declined AI consent');
    setShowAIConsentModal(false);
  };

  // Determine which layout to show
  const renderContent = () => {
    console.log('🔍 [RENDER] renderContent() çağrıldı:', {
      isMultiPhotoProcessing,
      hasMultiPhoto,
      hasStoredPhoto,
    });

    // Multi-photo processing in progress
    if (isMultiPhotoProcessing) {
      console.log('→ [RENDER] HeroLayout (multi-photo processing)');
      // Show processing state - modal handles this
      return (
        <HeroLayout
          mediaPipeReady={mediaPipeReady}
          tabBarHeight={tabBarHeight}
          onStartScan={handleStartScan}
        />
      );
    }

    // Has saved multi-photo analysis
    if (hasMultiPhoto) {
      console.log('→ [RENDER] SavedPhotoLayout (multi-photo)');
      return (
        <SavedPhotoLayout
          multiPhotoData={savedMultiPhotos}
          consistencyScore={consistencyScore}
          faceAnalysisId={savedPhotoAnalysisId}
          mediaPipeReady={mediaPipeReady}
          isPremium={isPremium}
          tabBarHeight={tabBarHeight}
          onViewResults={handleViewResults}
          onNewScan={handleStartScan}
          onUpgradePress={() => router.push('/paywall')}
        />
      );
    }

    // Has saved single photo (legacy)
    if (hasStoredPhoto) {
      console.log('→ [RENDER] SavedPhotoLayout (single-photo)');
      return (
        <SavedPhotoLayout
          photoUri={savedPhotoUri!}
          savedAt={savedPhotoDate || new Date().toISOString()}
          faceAnalysisId={savedPhotoAnalysisId}
          mediaPipeReady={mediaPipeReady}
          isPremium={isPremium}
          tabBarHeight={tabBarHeight}
          onViewResults={handleViewResults}
          onNewScan={handleStartScan}
          onUpgradePress={() => router.push('/paywall')}
        />
      );
    }

    // No saved photo - show hero
    console.log('→ [RENDER] HeroLayout (default)');
    return (
      <HeroLayout
        mediaPipeReady={mediaPipeReady}
        tabBarHeight={tabBarHeight}
        onStartScan={handleStartScan}
      />
    );
  };

  return (
    <View className="flex-1">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Hidden WebView for FaceAnalyzer AI */}
      <View
        style={{
          width: 0,
          height: 0,
          overflow: 'hidden',
          position: 'absolute',
        }}
      >
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
      {renderContent()}

      {/* Image Picker Modal (legacy single photo) */}
      <ImagePickerModal
        visible={showImagePicker}
        onClose={handleCloseImagePicker}
        onPickGallery={pickImage}
      />

      {/* Multi-Photo Picker Modal */}
      <MultiPhotoPickerModal
        visible={showMultiPhotoModal}
        photos={multiPhotos}
        processingStatus={multiPhotoProcessingStatus}
        currentPhotoIndex={currentPhotoIndex}
        consistencyScore={consistencyScore}
        onPickFromGallery={handlePickFromGallery}
        onRemovePhoto={handleRemoveMultiPhoto}
        onResetPhotos={handleResetMultiPhotos}
        onComplete={handleMultiPhotoComplete}
        onClose={handleCloseMultiPhotoModal}
      />

      {/* AI Consent Modal (Guideline 2.1) */}
      <AIConsentModal
        visible={showAIConsentModal}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
      />
    </View>
  );
}
