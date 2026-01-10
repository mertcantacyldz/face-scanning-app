import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = 'exercise_guide_collapsed';

export function ExerciseGuideCard({ initialExpanded = false, hideHeader = false }: { initialExpanded?: boolean; hideHeader?: boolean }) {
    const { t } = useTranslation('exercises');
    const [isCollapsed, setIsCollapsed] = useState(!initialExpanded);

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

    // If hideHeader is true, just render the content directly
    if (hideHeader) {
        return (
            <View>
                {/* Scientific Research Section */}
                <View className="mb-4">
                    <View className="flex-row items-start mb-2">
                        <Text className="text-2xl mr-2">💡</Text>
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-foreground mb-1">
                                {t('guide.research.title')}
                            </Text>
                            <Text className="text-xs text-muted-foreground leading-relaxed">
                                {t('guide.research.text')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Recommended Practice */}
                <View className="bg-card rounded-lg p-3 mb-4 border border-border">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="calendar-outline" size={16} color="#8B5CF6" />
                        <Text className="text-sm font-semibold text-foreground ml-2">
                            {t('guide.recommended.title')}
                        </Text>
                    </View>

                    <View className="gap-1.5">
                        <View className="flex-row items-start">
                            <Text className="text-success mr-2">•</Text>
                            <Text className="text-xs text-muted-foreground flex-1">
                                {t('guide.recommended.point1')}
                            </Text>
                        </View>

                        <View className="flex-row items-start">
                            <Text className="text-success mr-2">•</Text>
                            <Text className="text-xs text-muted-foreground flex-1">
                                {t('guide.recommended.point2')}
                            </Text>
                        </View>

                        <View className="flex-row items-start">
                            <Text className="text-success mr-2">•</Text>
                            <Text className="text-xs text-muted-foreground flex-1">
                                {t('guide.recommended.point3')}
                            </Text>
                        </View>

                        <View className="flex-row items-start">
                            <Text className="text-success mr-2">•</Text>
                            <Text className="text-xs text-muted-foreground flex-1">
                                {t('guide.recommended.point4')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Important Warning */}
                <View className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                    <View className="flex-row items-start">
                        <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                        <View className="flex-1 ml-2">
                            <Text className="text-xs font-semibold text-foreground mb-1">
                                {t('guide.warning.title')}
                            </Text>
                            <Text className="text-xs text-muted-foreground leading-relaxed">
                                {t('guide.warning.text')}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="mx-4 mb-4 mt-2 bg-muted border border-border rounded-xl overflow-hidden">
            {/* Header - Always Visible */}
            <TouchableOpacity
                onPress={toggleCollapsed}
                className="flex-row items-center justify-between p-4"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center flex-1">
                    <Ionicons name="book-outline" size={20} color="#8B5CF6" />
                    <Text className="text-base font-semibold text-foreground ml-2">
                        {t('guide.title')}
                    </Text>
                </View>
                {isCollapsed ? (
                    <Ionicons name="chevron-down-outline" size={20} color="#8B5CF6" />
                ) : (
                    <Ionicons name="chevron-up-outline" size={20} color="#8B5CF6" />
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
                                <Text className="text-sm font-semibold text-foreground mb-1">
                                    {t('guide.research.title')}
                                </Text>
                                <Text className="text-xs text-muted-foreground leading-relaxed">
                                    {t('guide.research.text')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Recommended Practice */}
                    <View className="bg-card rounded-lg p-3 mb-4 border border-border">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="calendar-outline" size={16} color="#8B5CF6" />
                            <Text className="text-sm font-semibold text-foreground ml-2">
                                {t('guide.recommended.title')}
                            </Text>
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-start">
                                <Text className="text-success mr-2">•</Text>
                                <Text className="text-xs text-muted-foreground flex-1">
                                    {t('guide.recommended.point1')}
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <Text className="text-success mr-2">•</Text>
                                <Text className="text-xs text-muted-foreground flex-1">
                                    {t('guide.recommended.point2')}
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <Text className="text-success mr-2">•</Text>
                                <Text className="text-xs text-muted-foreground flex-1">
                                    {t('guide.recommended.point3')}
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <Text className="text-success mr-2">•</Text>
                                <Text className="text-xs text-muted-foreground flex-1">
                                    {t('guide.recommended.point4')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Important Warning */}
                    <View className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                        <View className="flex-row items-start">
                            <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                            <View className="flex-1 ml-2">
                                <Text className="text-xs font-semibold text-foreground mb-1">
                                    {t('guide.warning.title')}
                                </Text>
                                <Text className="text-xs text-muted-foreground leading-relaxed">
                                    {t('guide.warning.text')}
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
