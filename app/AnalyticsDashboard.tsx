import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AnalyticsSummary from '../components/AnalyticsSummary';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHealthAnalytics } from '../hooks/useHealthAnalytics';
import { useWellnessProfile } from '../hooks/useWellnessProfile';
import { TimeGranularity, analyticsService } from '../services/api/analytics';

const AnalyticsDashboard = () => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const { user } = useAuth();
    const [granularity, setGranularity] = useState<TimeGranularity>(TimeGranularity.DAY);
    const [isSeeding, setIsSeeding] = useState(false);

    const { data, loading, refetch: refetchAnalytics } = useHealthAnalytics({
        granularity,
        days: granularity === TimeGranularity.DAY ? 7 : granularity === TimeGranularity.WEEK ? 30 : 90
    });

    const { data: wellnessProfile, loading: wellnessLoading, refetch: refetchWellness } = useWellnessProfile();

    const refetch = async () => {
        await Promise.all([refetchAnalytics(), refetchWellness()]);
    };

    const handleSeedData = async () => {
        if (!user?.id) return;
        setIsSeeding(true);
        try {
            const response = await analyticsService.seedData(user.id);
            Alert.alert('Success', 'Sample data seeded successfully!');
            await refetch();
        } catch (e: any) {
            console.error('Failed to seed data:', e);
            const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
            Alert.alert('Error Seeding Data', errorMsg);
        } finally {
            setIsSeeding(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Health Intelligence</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
                        Long-term trends and wellness analysis
                    </Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={[styles.aiButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/ai-report' as any)}
                    >
                        <Ionicons name="sparkles" size={18} color="#FFF" />
                        <Text style={styles.aiButtonText}>Ask AI Why?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.aiButton, { backgroundColor: colors.success, marginLeft: 10 }]}
                        onPress={() => router.push('/health-trends' as any)}
                    >
                        <Ionicons name="trending-up" size={18} color="#FFF" />
                        <Text style={styles.aiButtonText}>Trajectory</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.refreshButton, { backgroundColor: colors.primary + '20' }]}
                        onPress={refetch}
                    >
                        <Ionicons name="refresh" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.granularityContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[TimeGranularity.DAY, TimeGranularity.WEEK, TimeGranularity.MONTH].map((g) => (
                    <TouchableOpacity
                        key={g}
                        style={[
                            styles.granularityButton,
                            granularity === g && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setGranularity(g)}
                    >
                        <Text style={[
                            styles.granularityText,
                            { color: granularity === g ? colors.buttonText : colors.text }
                        ]}>
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderInsights = () => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Health Insights</Text>
            <View style={[styles.insightsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {data?.insights?.length > 0 ? (
                    data.insights.map((insight: string, index: number) => (
                        <View key={index} style={styles.insightItem}>
                            <View style={[styles.insightIconBadge, { backgroundColor: colors.warning + '20' }]}>
                                <Ionicons name="bulb" size={16} color={colors.warning} />
                            </View>
                            <Text style={[styles.insightText, { color: colors.text }]}>{insight}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={[styles.insightText, { color: colors.mutedText, textAlign: 'center' }]}>
                        {loading ? 'Analyzing health patterns...' : 'Tracking data to generate insights...'}
                    </Text>
                )}
            </View>
        </View>
    );

    const renderTrendAnalysis = () => {
        if (!data?.trends) return null;

        const trendItems = [
            { key: 'heartRate', label: 'Heart Rate', icon: 'heart', color: colors.error },
            { key: 'steps', label: 'Daily Steps', icon: 'walk', color: colors.primary },
            { key: 'sleep', label: 'Sleep Duration', icon: 'moon', color: '#8B5CF6' },
            { key: 'water', label: 'Hydration', icon: 'water', color: '#06B6D4' },
        ];

        return (
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Trend Analysis</Text>
                <View style={[styles.trendsContainerDetailed, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {trendItems.map((item) => {
                        const trend = data.trends[item.key];
                        if (!trend) return null;

                        return (
                            <View key={item.key} style={[styles.trendItemDetailed, { borderBottomColor: colors.border }]}>
                                <View style={[styles.trendIconBox, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                                </View>
                                <View style={styles.trendInfo}>
                                    <Text style={[styles.trendLabelText, { color: colors.text }]}>{item.label}</Text>
                                    <View style={styles.trendStatusRow}>
                                        <Ionicons
                                            name={trend.trend === 'increasing' ? 'trending-up' : trend.trend === 'decreasing' ? 'trending-down' : 'remove'}
                                            size={16}
                                            color={trend.trend === 'increasing' ? colors.success : trend.trend === 'decreasing' ? colors.error : colors.mutedText}
                                        />
                                        <Text style={[styles.trendChangeText, { color: trend.trend === 'increasing' ? colors.success : trend.trend === 'decreasing' ? colors.error : colors.mutedText }]}>
                                            {Math.abs(trend.change).toFixed(1)}% {trend.trend}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.trendAdvice}>
                                    <Text style={[styles.trendAdviceText, { color: colors.mutedText }]}>
                                        {trend.trend === 'increasing' && item.key === 'heartRate' ? 'Rest more' :
                                            trend.trend === 'decreasing' && item.key === 'steps' ? 'Walk more' :
                                                trend.trend === 'decreasing' && item.key === 'sleep' ? 'Sleep earlier' :
                                                    'Doing great'}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="stats-chart" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No trend data available yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.mutedText }]}>
                We need more data points to analyze your health trends correctly.
            </Text>
            <TouchableOpacity
                style={[styles.seedButton, { backgroundColor: colors.primary, opacity: isSeeding ? 0.7 : 1 }]}
                onPress={handleSeedData}
                disabled={isSeeding}
            >
                {isSeeding ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <Ionicons name="flask-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.seedButtonText}>Generate Demo Data</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={
                <RefreshControl refreshing={loading && !!data} onRefresh={refetch} />
            }
        >
            {renderHeader()}
            <View style={styles.content}>
                {(!data?.timeSeries || data.timeSeries.length === 0) && !loading ? (
                    renderEmptyState()
                ) : (
                    <>
                        {data && (
                            <AnalyticsSummary
                                statistics={data.statistics}
                                trends={data.trends}
                                medication={data.medication}
                                social={data.social}
                                safety={data.safety}
                                wellnessProfile={wellnessProfile}
                            />
                        )}
                        {renderTrendAnalysis()}
                        {renderInsights()}
                    </>
                )}
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    aiButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    granularityContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
    },
    granularityButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    granularityText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    insightsContainer: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    insightItem: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    insightIconBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    insightText: {
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        borderWidth: 1,
        marginTop: 20,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
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
        marginBottom: 24,
    },
    seedButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    seedButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    trendsContainerDetailed: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
    },
    trendItemDetailed: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    trendIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    trendInfo: {
        flex: 1,
    },
    trendLabelText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    trendStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendChangeText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    trendAdvice: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    trendAdviceText: {
        fontSize: 11,
        fontWeight: '500',
    },
});

export default AnalyticsDashboard;
