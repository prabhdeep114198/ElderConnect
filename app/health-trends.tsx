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
import { api } from '../services/api/client';

interface HealthTrend {
    id: string;
    assessmentDate: string;
    deteriorationScore: number;
    trendSummary: string;
    aggregates: {
        physical: {
            steps7dAvg: number;
            steps30dAvg: number;
            stepsDelta: number;
        };
        vitals: {
            hr7dAvg: number;
            hrBaseline: number;
            hrDelta: number;
            spo27dAvg: number;
            spo2Baseline: number;
        };
        adherence: {
            medMissRate7d: number;
            medMissRate30d: number;
            adherenceTrend: string;
        };
        emergency: {
            risk7dAvg: number;
        };
    };
}

const HealthTrendsScreen = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [trends, setTrends] = useState<HealthTrend[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTrends = async (showLoading = true) => {
        if (!user?.id) return;
        if (showLoading) setLoading(true);
        try {
            const data = await api.get<HealthTrend[]>(`/deterioration/trends/${user.id}`);
            setTrends(data);
        } catch (error) {
            console.error('Failed to fetch health trends:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTrends();
    }, [user?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTrends(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedText }]}>Analyzing long-term patterns...</Text>
            </View>
        );
    }

    const latest = trends[0];

    return (
        <ScrollView 
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Health Trends</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {!latest ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="analytics-outline" size={64} color={colors.mutedText} />
                        <Text style={[styles.emptyText, { color: colors.text }]}>No trend data yet.</Text>
                        <Text style={[styles.emptySubtext, { color: colors.mutedText }]}>Trends are generated weekly based on your activity and vitals.</Text>
                    </View>
                ) : (
                    <>
                        {/* Summary Card */}
                        <View style={[styles.summaryCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                            <View style={styles.summaryHeader}>
                                <Ionicons name="pulse" size={24} color={colors.primary} />
                                <Text style={[styles.summaryTitle, { color: colors.primary }]}>AI Trend Analysis</Text>
                            </View>
                            <Text style={[styles.summaryText, { color: colors.text }]}>
                                {latest.trendSummary}
                            </Text>
                        </View>

                        {/* Overall Risk Score */}
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.cardLabel, { color: colors.mutedText }]}>Deterioration Risk Score</Text>
                            <View style={styles.scoreRow}>
                                <Text style={[styles.scoreValue, { color: latest.deteriorationScore > 50 ? colors.error : colors.success }]}>
                                    {latest.deteriorationScore}%
                                </Text>
                                <View style={[styles.statusBadge, { backgroundColor: latest.deteriorationScore < 20 ? colors.success + '20' : latest.deteriorationScore < 50 ? colors.warning + '20' : colors.error + '20' }]}>
                                    <Text style={[styles.statusText, { color: latest.deteriorationScore < 20 ? colors.success : latest.deteriorationScore < 50 ? colors.warning : colors.error }]}>
                                        {latest.deteriorationScore < 20 ? 'Optimum' : latest.deteriorationScore < 50 ? 'Stable' : 'Declining'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${latest.deteriorationScore}%`, backgroundColor: latest.deteriorationScore > 50 ? colors.error : colors.primary }]} />
                            </View>
                            <Text style={[styles.footerText, { color: colors.mutedText }]}>
                                Compared to your 30-day baseline performance.
                            </Text>
                        </View>

                        {/* Detailed Metrics */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Metric Analysis (Last 7 Days)</Text>
                        
                        {/* Mobility Metric */}
                        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.metricHeader}>
                                <View style={[styles.metricIcon, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name="walk" size={20} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.metricLabel, { color: colors.text }]}>Daily Steps</Text>
                                    <Text style={[styles.metricSublabel, { color: colors.mutedText }]}>Activity consistency</Text>
                                </View>
                                <View style={styles.metricValues}>
                                    <Text style={[styles.metricMainValue, { color: colors.text }]}>{Math.round(latest.aggregates.physical.steps7dAvg)}</Text>
                                    <Text style={[styles.metricChange, { color: latest.aggregates.physical.stepsDelta < 0 ? colors.error : colors.success }]}>
                                        {latest.aggregates.physical.stepsDelta < 0 ? '↓' : '↑'}{Math.abs(Math.round(latest.aggregates.physical.stepsDelta * 100))}%
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Medication Adherence Metric */}
                        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.metricHeader}>
                                <View style={[styles.metricIcon, { backgroundColor: colors.warning + '15' }]}>
                                    <Ionicons name="medical" size={20} color={colors.warning} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.metricLabel, { color: colors.text }]}>Medication Miss Rate</Text>
                                    <Text style={[styles.metricSublabel, { color: colors.mutedText }]}>Adherence stability</Text>
                                </View>
                                <View style={styles.metricValues}>
                                    <Text style={[styles.metricMainValue, { color: colors.text }]}>{Math.round(latest.aggregates.adherence.medMissRate7d * 100)}%</Text>
                                    <Text style={[styles.metricChange, { color: latest.aggregates.adherence.adherenceTrend === 'declining' ? colors.error : colors.success }]}>
                                        {latest.aggregates.adherence.adherenceTrend}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Vitals Stability */}
                        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.metricHeader}>
                                <View style={[styles.metricIcon, { backgroundColor: colors.error + '15' }]}>
                                    <Ionicons name="heart" size={20} color={colors.error} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.metricLabel, { color: colors.text }]}>Heart Rate Stability</Text>
                                    <Text style={[styles.metricSublabel, { color: colors.mutedText }]}>Resting baseline deviation</Text>
                                </View>
                                <View style={styles.metricValues}>
                                    <Text style={[styles.metricMainValue, { color: colors.text }]}>{latest.aggregates.vitals.hr7dAvg.toFixed(1)} bpm</Text>
                                    <Text style={[styles.metricChange, { color: Math.abs(latest.aggregates.vitals.hrDelta) > 0.1 ? colors.warning : colors.success }]}>
                                        {latest.aggregates.vitals.hrDelta > 0 ? '↑' : '↓'}{Math.abs(Math.round(latest.aggregates.vitals.hrDelta * 100))}%
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* History Timeline */}
                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>Previous Assessments</Text>
                        {trends.slice(1).map((trend, idx) => (
                            <View key={idx} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.historyDate, { color: colors.text }]}>
                                    {new Date(trend.assessmentDate).toLocaleDateString()}
                                </Text>
                                <View style={styles.historyStats}>
                                    <Text style={[styles.historyScore, { color: trend.deteriorationScore > 50 ? colors.error : colors.text }]}>
                                        Score: {trend.deteriorationScore}%
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
                                </View>
                            </View>
                        ))}
                    </>
                )}
                <View style={{ height: 40 }} />
            </View>
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 16,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    summaryCard: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    card: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    scoreValue: {
        fontSize: 42,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
        marginBottom: 12,
    },
    progressBarFill: {
        height: 8,
        borderRadius: 4,
    },
    footerText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    metricCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metricIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    metricLabel: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    metricSublabel: {
        fontSize: 12,
    },
    metricValues: {
        alignItems: 'flex-end',
    },
    metricMainValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    metricChange: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    historyDate: {
        fontSize: 14,
        fontWeight: '500',
    },
    historyStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyScore: {
        fontSize: 14,
        marginRight: 8,
    }
});

export default HealthTrendsScreen;
