import React from 'react';
import { Modal, View, Pressable, ScrollView, Platform } from 'react-native';
import { Text } from './ui/text';
import { Card } from './ui/card';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';

interface AIConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const AIConsentModal: React.FC<AIConsentModalProps> = ({ visible, onAccept, onDecline }) => {
  const { t } = useTranslation(['analysis']);

  const openPrivacy = () => {
    WebBrowser.openBrowserAsync('https://faceloom.netlify.app/privacy.html');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <Card className="w-full max-h-[80%] p-6 rounded-[24px] bg-white dark:bg-slate-900 border-0 shadow-2xl">
          <View className="items-center mb-5">
            <View className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-900/20 justify-center items-center mb-3">
              <Ionicons name="shield-checkmark-outline" size={32} color="#8B5CF6" />
            </View>
            <Text className="text-2xl font-bold text-slate-800 dark:text-white text-center">
              {t('aiConsent.title')}
            </Text>
          </View>

          <ScrollView className="mb-6" showsVerticalScrollIndicator={false}>
            <Text className="text-base text-slate-600 dark:text-slate-400 leading-6 mb-6 text-center">
              {t('aiConsent.description')}
            </Text>

            <View className="flex-row items-start mb-4 pr-3">
              <View className="mt-0.5">
                <Ionicons name="phone-portrait-outline" size={20} color="#10B981" />
              </View>
              <Text className="text-sm text-slate-700 dark:text-slate-300 ml-3 flex-1 leading-5">
                {t('aiConsent.bulletLocal')}
              </Text>
            </View>

            <View className="flex-row items-start mb-4 pr-3">
              <View className="mt-0.5">
                <Ionicons name="analytics-outline" size={20} color="#10B981" />
              </View>
              <Text className="text-sm text-slate-700 dark:text-slate-300 ml-3 flex-1 leading-5">
                {t('aiConsent.bulletProportions')}
              </Text>
            </View>

            <View className="flex-row items-start mb-4 pr-3">
              <View className="mt-0.5">
                <Ionicons name="lock-closed-outline" size={20} color="#10B981" />
              </View>
              <Text className="text-sm text-slate-700 dark:text-slate-300 ml-3 flex-1 leading-5">
                {t('aiConsent.bulletTraining')}
              </Text>
            </View>

            <Pressable onPress={openPrivacy} className="mt-2 items-center active:opacity-60">
              <Text className="text-xs font-semibold text-violet-500 underline">
                {t('aiConsent.privacyLink')}
              </Text>
            </Pressable>
          </ScrollView>

          <View className="flex-row space-x-3">
            <Pressable 
              onPress={onDecline} 
              className="flex-1 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 items-center active:opacity-70"
            >
              <Text className="font-semibold text-slate-600 dark:text-slate-300">
                {t('aiConsent.decline')}
              </Text>
            </Pressable>
            <Pressable 
              onPress={onAccept} 
              className="flex-[2] p-4 rounded-xl bg-violet-600 items-center active:opacity-90 shadow-lg shadow-violet-500/30"
            >
              <Text className="font-bold text-white">
                {t('aiConsent.accept')}
              </Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </Modal>
  );
};
