import React from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { languageStorage, type SupportedLanguage } from '@/lib/language-storage';

interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleLanguageChange = async (langCode: SupportedLanguage) => {
    await i18n.changeLanguage(langCode);
    await languageStorage.set(langCode);
  };

  return (
    <View className="flex-row gap-3">
      {LANGUAGES.map((lang) => {
        const isActive = i18n.language === lang.code;

        return (
          <Pressable
            key={lang.code}
            onPress={() => handleLanguageChange(lang.code)}
            className={`flex-1 flex-row items-center justify-center p-3 rounded-lg border-2 ${
              isActive
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card'
            }`}
          >
            <Text className="text-2xl mr-2">{lang.flag}</Text>
            <Text className={`font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {lang.label}
            </Text>
            {isActive && (
              <Ionicons name="checkmark-circle" size={18} color="#8B5CF6" className="ml-1" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
