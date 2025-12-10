import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = 'exercise_guide_collapsed';

export function ExerciseGuideCard() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        loadCollapsedState();
    }, []);

    const loadCollapsedState = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved === 'true') {
                setIsCollapsed(true);
            }
        } catch (error) {
            console.log('Error loading guide state:', error);
        }
    };

    const toggleCollapsed = async () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);

        try {
            await AsyncStorage.setItem(STORAGE_KEY, newState.toString());
        } catch (error) {
            console.log('Error saving guide state:', error);
        }
    };

    return (
        <View className="mx-4 mb-4 mt-2 bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
            {/* Header - Always Visible */}
            <TouchableOpacity
                onPress={toggleCollapsed}
                className="flex-row items-center justify-between p-4"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center flex-1">
                    <Ionicons name="book-outline" size={20} color="#2563eb" />
                    <Text className="text-base font-semibold text-blue-900 ml-2">
                        Egzersiz Rehberi
                    </Text>
                </View>
                {isCollapsed ? (
                    <Ionicons name="chevron-down-outline" size={20} color="#2563eb" />
                ) : (
                    <Ionicons name="chevron-up-outline" size={20} color="#2563eb" />
                )}
            </TouchableOpacity>

            {/* Collapsible Content */}
            {!isCollapsed && (
                <View className="px-4 pb-4">
                    {/* Scientific Research Section */}
                    <View className="mb-4">
                        <View className="flex-row items-start mb-2">
                            <Text className="text-2xl mr-2">💡</Text>
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-blue-900 mb-1">
                                    Bilimsel Araştırma
                                </Text>
                                <Text className="text-xs text-blue-800 leading-relaxed">
                                    2018 yılında JAMA Dermatology dergisinde yayınlanan araştırmada,
                                    yüz egzersizlerinin yüz dolgunluğunu artırdığı gözlemlenmiştir.
                                    Bu egzersizler benzer kas tonusu ve cilt dolgunluğu artırma
                                    prensiplerine dayanır.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Recommended Practice */}
                    <View className="bg-white rounded-lg p-3 mb-4">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="calendar-outline" size={16} color="#2563eb" />
                            <Text className="text-sm font-semibold text-gray-900 ml-2">
                                Önerilen Uygulama
                            </Text>
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-start">
                                <Text className="text-green-600 mr-2">•</Text>
                                <Text className="text-xs text-gray-700 flex-1">
                                    Günde 30 dakika, haftada 5-6 gün düzenli uygulama
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <Text className="text-green-600 mr-2">•</Text>
                                <Text className="text-xs text-gray-700 flex-1">
                                    Cildi fazla çekmemeye ve kırıştırmamaya dikkat edin
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <Text className="text-green-600 mr-2">•</Text>
                                <Text className="text-xs text-gray-700 flex-1">
                                    Her zaman kasları hareket ettirmeye odaklanın, cildi değil
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <Text className="text-green-600 mr-2">•</Text>
                                <Text className="text-xs text-gray-700 flex-1">
                                    Düzenli ve tutarlı uygulama esastır
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Important Warning */}
                    <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <View className="flex-row items-start">
                            <Ionicons name="alert-circle-outline" size={16} color="#d97706" style={{ marginTop: 2 }} />
                            <View className="flex-1 ml-2">
                                <Text className="text-xs font-semibold text-amber-900 mb-1">
                                    ⚠️ Önemli Uyarı
                                </Text>
                                <Text className="text-xs text-amber-800 leading-relaxed">
                                    Bu egzersizler ve bilgiler, tıbbi tavsiye veya tedavi yerine
                                    geçmez. Araştırma sonuçları bireysel deneyimleri garanti etmez.
                                    Sonuçlar kişiden kişiye değişir. Herhangi bir sağlık veya estetik
                                    kararı için bir doktora veya uzmana danışılmalıdır. Bu egzersizler
                                    genel kas farkındalığı ve eğlence amaçlıdır.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

export default ExerciseGuideCard;
