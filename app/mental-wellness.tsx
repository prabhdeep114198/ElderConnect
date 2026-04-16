import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { nostalgiaService } from '../services/api/nostalgia';

interface Assessment {
    id: string;
    type: 'MOOD' | 'COGNITIVE';
    source: string;
    score: number;
    label: string;
    analysis: string;
    metadata?: {
        markers?: string[];
    };
    createdAt: string;
}

const MentalWellnessScreen = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (showLoading = true) => {
        if (!user?.id) return;
        if (showLoading) setLoading(true);
        try {
            const data = await nostalgiaService.getAssessments(user.id);
            setAssessments(data);
        } catch (error) {
            console.error('Failed to fetch mental wellness data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={[styles.loadingText, { color: colors.mutedText }]}>Reflecting on your wellness...</Text>
            </View>
        );
    }

    const moodLogs = assessments.filter(a => a.type === 'MOOD');
    const cognitiveLogs = assessments.filter(a => a.type === 'COGNITIVE');
    const latestCognitive = cognitiveLogs[0];

    const getMoodIcon = (label: string) => {
        switch (label.toLowerCase()) {
            case 'positive': return 'sunny';
            case 'stable': return 'cloud-outline';
            case 'sad': return 'cloudy-night';
            case 'lonely': return 'moon';
            default: return 'partly-sunny';
        }
    };

    const getMoodColor = (score: number) => {
        if (score > 0.7) return '#10B981'; // Success
        if (score > 4) return '#8B5CF6'; // Purple/Wellness
        return '#F59E0B'; // Warning
    };

    return (
        <ScrollView 
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Mental Wellness</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {assessments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="heart-half-outline" size={64} color={colors.mutedText} />
                        <Text style={[styles.emptyText, { color: colors.text }]}>Beginning your journey.</Text>
                        <Text style={[styles.emptySubtext, { color: colors.mutedText }]}>
                            Record a memory in the Diary to see your mood and cognitive trends.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Cognitive Stability Gauge */}
                        <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: '#8B5CF630' }]}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="analytics" size={22} color="#8B5CF6" />
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Linguistic Stability</Text>
                            </View>
                            
                            {latestCognitive ? (
                                <>
                                    <View style={styles.stabilityRow}>
                                        <View style={styles.gaugeContainer}>
                                            <Text style={[styles.gaugeValue, { color: '#8B5CF6' }]}>
                                                {Math.round(latestCognitive.score * 100)}%
                                            </Text>
                                            <Text style={styles.gaugeLabel}>STABLE</Text>
                                        </View>
                                        <View style={styles.stabilityInfo}>
                                            <Text style={[styles.assessmentLabel, { color: colors.text }]}>
                                                Trend: {latestCognitive.label}
                                            </Text>
                                            <Text style={[styles.assessmentText, { color: colors.mutedText }]}>
                                                {latestCognitive.analysis}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {latestCognitive.metadata?.markers && (
                                        <View style={styles.markersList}>
                                            {latestCognitive.metadata.markers.map((m, i) => (
                                                <View key={i} style={[styles.markerBadge, { backgroundColor: '#8B5CF620' }]}>
                                                    <Text style={[styles.markerText, { color: '#8B5CF6' }]}>{m}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </>
                            ) : (
                                <Text style={[styles.emptySubtext, { color: colors.mutedText }]}>
                                    Collecting more voice data for cognitive analysis...
                                </Text>
                            )}
                        </View>

                        {/* Mood Heatmap/Recent Timeline */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Emotional Journey</Text>
                        <View style={styles.moodGrid}>
                            {moodLogs.slice(0, 10).map((mood, idx) => (
                                <View key={idx} style={[styles.moodItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={[styles.moodIconBg, { backgroundColor: getMoodColor(mood.score) + '15' }]}>
                                        <Ionicons name={getMoodIcon(mood.label) as any} size={24} color={getMoodColor(mood.score)} />
                                    </View>
                                    <Text style={[styles.moodDate, { color: colors.mutedText }]}>
                                        {new Date(mood.createdAt).toLocaleDateString(undefined, { weekday: 'short' })}
                                    </Text>
                                    <View style={[styles.moodBadge, { backgroundColor: getMoodColor(mood.score) }]}>
                                        <Text style={styles.moodBadgeText}>{mood.label}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* AI Insights Card */}
                        <View style={[styles.insightCard, { backgroundColor: '#8B5CF610', borderColor: '#8B5CF630' }]}>
                            <View style={styles.insightHeader}>
                                <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                                <Text style={[styles.insightTitle, { color: '#8B5CF6' }]}>Wellness Wisdom</Text>
                            </View>
                            <Text style={[styles.insightText, { color: colors.text }]}>
                                {moodLogs.length > 3 && moodLogs[0].score > 0.7 
                                    ? "Your positive outlook this week is a great sign of mental resilience. Sharing your stories is clearly helping your mood!"
                                    : "Recording your memories can act as a gentle brain exercise. Keep sharing your life stories to stay sharp and connected."}
                            </Text>
                        </View>
                    </>
                )}
            </View>
            <View style={{ height: 60 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    mainCard: {
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
        marginBottom: 30,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    stabilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gaugeContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 8,
        borderColor: '#8B5CF615',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    gaugeValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    gaugeLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: 'bold',
        marginTop: -4,
    },
    stabilityInfo: {
        flex: 1,
    },
    assessmentLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    assessmentText: {
        fontSize: 13,
        lineHeight: 18,
    },
    markersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 20,
    },
    markerBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginRight: 6,
        marginBottom: 6,
    },
    markerText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    moodItem: {
        width: '48%',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 16,
    },
    moodIconBg: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    moodDate: {
        fontSize: 12,
        marginBottom: 8,
    },
    moodBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    moodBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    insightCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    insightTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    insightText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    }
});

export default MentalWellnessScreen;
