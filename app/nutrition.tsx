import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api/client';

export default function NutritionCoachScreen() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();

    const [dietaryRestrictions, setDietaryRestrictions] = useState(['General Healthy Diet']);
    const [mealPlan, setMealPlan] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVeg, setIsVeg] = useState(true);

    useEffect(() => {
        const fetchNutrition = async () => {
            setLoading(true);
            try {
                const response: any = await api.post('/chat/nutrition', {
                    dietType: isVeg ? 'vegetarian' : 'non-vegetarian'
                });
                if (response?.data) {
                    setDietaryRestrictions(response.data.dietaryRestrictions || ['General Healthy Diet']);
                    setMealPlan(response.data.mealPlan || []);
                }
            } catch (error) {
                console.error("Failed to load dynamic nutrition plan:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNutrition();
    }, [isVeg]);

    const handleHydrationLog = () => {
        Alert.alert('Hydration Logged', 'Great job! You just logged a glass of water.');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Nutrition & Hydration Coach</Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="water-outline" size={32} color="#3B82F6" />
                <View style={styles.infoContent}>
                    <Text style={[styles.infoTitle, { color: colors.text }]}>Hydration Goal</Text>
                    <Text style={[styles.infoDesc, { color: colors.mutedText }]}>3/8 Glasses Today</Text>
                </View>
                <TouchableOpacity style={[styles.logButton, { backgroundColor: colors.primary }]} onPress={handleHydrationLog}>
                    <Text style={styles.logButtonText}>+ Log Water</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Dietary Profile</Text>
                <View style={styles.tagsContainer}>
                    {dietaryRestrictions.map((req, i) => (
                        <View key={i} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.tagText, { color: colors.primary }]}>{req}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.toggleSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Dietary Preference</Text>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            { backgroundColor: isVeg ? '#22C55E' : '#EF4444' }
                        ]}
                        onPress={() => setIsVeg(!isVeg)}
                    >
                        <Ionicons name={isVeg ? "leaf" : "fast-food"} size={18} color="#fff" />
                        <Text style={styles.toggleButtonText}>
                            {isVeg ? "Vegetarian" : "Non-Veg"}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.subTitle, { color: colors.mutedText }]}>Switch modes to instantly generate a new AI meal plan.</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's AI Meal Plan</Text>
                <Text style={[styles.subTitle, { color: colors.mutedText, marginBottom: 12 }]}>Customized for your {isVeg ? 'Vegetarian' : 'Non-Vegetarian'} profile.</Text>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    mealPlan.map((item, index) => (
                        <View key={index} style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name={item.icon as any || 'nutrition-outline'} size={24} color={colors.primary} />
                            </View>
                            <View style={styles.mealInfo}>
                                <Text style={[styles.mealType, { color: colors.text }]}>{item.meal} • {item.time}</Text>
                                <Text style={[styles.mealFood, { color: colors.text }]}>{item.food}</Text>
                                <Text style={[styles.mealCals, { color: colors.mutedText }]}>{item.calories} kcal</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 40 },
    backButton: { marginRight: 16 },
    title: { fontSize: 24, fontWeight: 'bold' },
    infoCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
    infoContent: { flex: 1, marginLeft: 16 },
    infoTitle: { fontSize: 16, fontWeight: 'bold' },
    infoDesc: { fontSize: 14, marginTop: 4 },
    logButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    logButtonText: { color: '#fff', fontWeight: 'bold' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    subTitle: { fontSize: 14 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    tagText: { fontWeight: '600' },
    mealCard: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, alignItems: 'center' },
    iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    mealInfo: { flex: 1 },
    mealType: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
    mealFood: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    mealCals: { fontSize: 14 },
    toggleSection: { marginBottom: 24, padding: 16, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.03)', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    toggleButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    toggleButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
