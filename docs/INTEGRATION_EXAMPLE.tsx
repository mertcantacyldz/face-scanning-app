import React from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// 🔗 GitHub Pages URLs - Update these after deployment!
const PRIVACY_URL = 'https://[your-username].github.io/faceloom/privacy.html';
const TERMS_URL = 'https://[your-username].github.io/faceloom/terms.html';
const LEGAL_HOME_URL = 'https://[your-username].github.io/faceloom/';

/**
 * Legal Links Component
 * Add this to your Settings screen or About page
 */
export function LegalLinksSection() {
    const openURL = async (url: string, title: string) => {
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', `Cannot open ${title}`);
            }
        } catch (error) {
            console.error(`Error opening ${title}:`, error);
            Alert.alert('Error', `Failed to open ${title}`);
        }
    };

    return (
        <View className="mb-6">
            <Text className="text-lg font-semibold mb-3 text-gray-800">Legal</Text>

            <TouchableOpacity
                onPress={() => openURL(PRIVACY_URL, 'Privacy Policy')}
                className="p-4 bg-white rounded-lg mb-2 border border-gray-200"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-base font-medium text-gray-900">Privacy Policy</Text>
                        <Text className="text-sm text-gray-500 mt-1">How we handle your data</Text>
                    </View>
                    <Text className="text-blue-600 text-lg">→</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => openURL(TERMS_URL, 'Terms of Service')}
                className="p-4 bg-white rounded-lg border border-gray-200"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-base font-medium text-gray-900">Terms of Service</Text>
                        <Text className="text-sm text-gray-500 mt-1">Terms of using our app</Text>
                    </View>
                    <Text className="text-blue-600 text-lg">→</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

/**
 * Inline Legal Text with Links
 * Use this in signup/login screens
 */
export function LegalAgreementText() {
    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    };

    return (
        <Text className="text-sm text-gray-600 text-center px-4">
            By continuing, you agree to our{' '}
            <Text
                className="text-blue-600 underline"
                onPress={() => openLink(TERMS_URL)}
            >
                Terms of Service
            </Text>
            {' '}and{' '}
            <Text
                className="text-blue-600 underline"
                onPress={() => openLink(PRIVACY_URL)}
            >
                Privacy Policy
            </Text>
        </Text>
    );
}

/**
 * Footer with Legal Links
 * Use at the bottom of auth screens
 */
export function LegalFooter() {
    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    };

    return (
        <View className="py-6 border-t border-gray-200">
            <View className="flex-row justify-center items-center space-x-4">
                <TouchableOpacity onPress={() => openLink(PRIVACY_URL)}>
                    <Text className="text-sm text-gray-600">Privacy</Text>
                </TouchableOpacity>

                <Text className="text-gray-400">•</Text>

                <TouchableOpacity onPress={() => openLink(TERMS_URL)}>
                    <Text className="text-sm text-gray-600">Terms</Text>
                </TouchableOpacity>
            </View>

            <Text className="text-xs text-gray-400 text-center mt-2">
                © 2024 FaceLoom
            </Text>
        </View>
    );
}

/**
 * Example Settings Screen Implementation
 */
export default function SettingsScreen() {
    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="p-4">
                <Text className="text-2xl font-bold mb-6 text-gray-900">Settings</Text>

                {/* Account Section */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold mb-3 text-gray-800">Account</Text>

                    <TouchableOpacity className="p-4 bg-white rounded-lg mb-2 border border-gray-200">
                        <Text className="text-base text-gray-900">Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="p-4 bg-white rounded-lg border border-gray-200">
                        <Text className="text-base text-gray-900">Manage Subscription</Text>
                    </TouchableOpacity>
                </View>

                {/* Legal Section - Using our component */}
                <LegalLinksSection />

                {/* About Section */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold mb-3 text-gray-800">About</Text>

                    <View className="p-4 bg-white rounded-lg border border-gray-200">
                        <Text className="text-sm text-gray-600">Version 1.0.0</Text>
                        <Text className="text-sm text-gray-600 mt-1">© 2024 FaceLoom</Text>
                    </View>
                </View>

                {/* Danger Zone */}
                <View className="mb-6">
                    <TouchableOpacity className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <Text className="text-base text-red-600 font-medium">Delete Account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
