import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { nostalgiaService, NostalgiaMemory } from '../services/api/nostalgia';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function MemoryTimelineScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { userId } = useLocalSearchParams(); // Passed in when caregiver routes to a specific elder
    const { user } = useAuth();
    
    // Default to viewing own timeline if no userId passed
    const targetUserId = (userId as string) || user?.id;

    const [memories, setMemories] = useState<NostalgiaMemory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (targetUserId) {
            loadTimeline(targetUserId);
        }
    }, [targetUserId]);

    const loadTimeline = async (id: string) => {
        try {
            setLoading(true);
            const data = await nostalgiaService.getTimeline(id);
            setMemories(data);
        } catch (error) {
            console.error('Failed to load memory timeline', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const renderMemory = ({ item, index }: { item: NostalgiaMemory; index: number }) => (
        <View style={styles.timelineItem}>
            {/* Timeline Line & Dot */}
            <View style={styles.timelineGraphic}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                {index !== memories.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
            </View>

            {/* Content Card */}
            <View style={[styles.memoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.dateText, { color: colors.primary }]}>{formatDate(item.recordedAt)}</Text>
                <Text style={[styles.promptText, { color: colors.text }]}>{item.prompt}</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.transcriptText, { color: colors.mutedText }]} numberOfLines={4}>
                    "{item.transcript}"
                </Text>
                
                {item.audioUrl && (
                    <TouchableOpacity style={[styles.audioButton, { backgroundColor: colors.background }]}>
                        <Ionicons name="play-circle" size={24} color={colors.primary} />
                        <Text style={[styles.audioText, { color: colors.primary }]}>Play Original Audio</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Digital Legacy</Text>
            </View>

            {memories.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={60} color={colors.border} />
                    <Text style={[styles.emptyText, { color: colors.mutedText }]}>No memories recorded yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={memories}
                    renderItem={renderMemory}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, paddingBottom: 10 },
    backButton: { marginRight: 15 },
    title: { fontSize: 24, fontWeight: 'bold' },
    listContainer: { padding: 20, paddingTop: 10, paddingBottom: 40 },
    timelineItem: { flexDirection: 'row', marginBottom: 20 },
    timelineGraphic: { alignItems: 'center', marginRight: 15, width: 20 },
    dot: { width: 14, height: 14, borderRadius: 7, marginTop: 5 },
    line: { width: 2, flex: 1, marginTop: 5 },
    memoryCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    dateText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
    promptText: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, lineHeight: 24 },
    divider: { height: 1, width: '100%', marginBottom: 12 },
    transcriptText: { fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
    audioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        padding: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    audioText: { marginLeft: 8, fontWeight: '600', fontSize: 14 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 15, fontSize: 16, textAlign: 'center' },
});
