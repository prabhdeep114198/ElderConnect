import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api/client';

export default function FallPreventionScreen() {
    const { colors } = useTheme();
    const router = useRouter();

    const [exercises, setExercises] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const response: any = await api.post('/chat/exercises', {});
                if (response?.data?.exercises) {
                    setExercises(response.data.exercises);
                }
            } catch (error) {
                console.error("Failed to load dynamic exercises:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExercises();
    }, []);

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Fall Prevention Coaching</Text>
            </View>

            <View style={[styles.alertCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                <Ionicons name="warning" size={32} color={colors.warning} />
                <View style={styles.alertContent}>
                    <Text style={[styles.alertTitle, { color: colors.text }]}>Proactive Safety Active</Text>
                    <Text style={[styles.alertDesc, { color: colors.mutedText }]}>Based on your recent activity, we recommend these daily balance exercises to keep you steady.</Text>
                </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Daily Balance Routine</Text>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
            ) : (
                exercises.map((ex, idx) => (
                    <View key={idx} style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name={ex.icon as any || 'walk-outline'} size={28} color={colors.primary} />
                        </View>
                        <View style={styles.exInfo}>
                            <Text style={[styles.exTitle, { color: colors.text }]}>{ex.title}</Text>
                            <Text style={[styles.exDesc, { color: colors.mutedText }]}>{ex.desc}</Text>
                            <View style={styles.metaRow}>
                                <Ionicons name="time-outline" size={14} color={colors.mutedText} />
                                <Text style={[styles.metaText, { color: colors.mutedText }]}>{ex.duration}</Text>
                                <Ionicons name="repeat-outline" size={14} color={colors.mutedText} style={{ marginLeft: 12 }} />
                                <Text style={[styles.metaText, { color: colors.mutedText }]}>{ex.reps}</Text>
                            </View>
                        </View>
                    </View>
                ))
            )}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 40 },
    backButton: { marginRight: 16 },
    title: { fontSize: 24, fontWeight: 'bold' },
    alertCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
    alertContent: { flex: 1, marginLeft: 16 },
    alertTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    alertDesc: { fontSize: 14, lineHeight: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    exerciseCard: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, alignItems: 'center' },
    iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    exInfo: { flex: 1 },
    exTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    exDesc: { fontSize: 14, marginBottom: 8 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 12, marginLeft: 4 }
});
