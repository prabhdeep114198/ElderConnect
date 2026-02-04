import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AnalyticsSummary from '../components/AnalyticsSummary';
import TrendCharts from '../components/TrendCharts';
import { useTheme } from '../context/ThemeContext';
import { useHealthAnalytics } from '../hooks/useHealthAnalytics';
import { TimeGranularity } from '../services/api/analytics';

const AnalyticsDashboard = () => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [granularity, setGranularity] = useState<TimeGranularity>(TimeGranularity.DAY);

    const { data, loading, refetch } = useHealthAnalytics({
        granularity,
        days: granularity === TimeGranularity.DAY ? 7 : granularity === TimeGranularity.WEEK ? 30 : 90
    });

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('healthTrends') || 'Health Trends'}</Text>
                <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
                    {t('trackingProgress') || 'Tracking your vitals and activity'}
                </Text>
            </View>
            <View style={styles.granularityContainer}>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Insights</Text>
            <View style={[styles.insightsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {data?.insights?.length > 0 ? (
                    data.insights.map((insight: string, index: number) => (
                        <View key={index} style={styles.insightItem}>
                            <Ionicons name="bulb-outline" size={20} color={colors.warning} style={styles.insightIconStyle} />
                            <Text style={[styles.insightText, { color: colors.text }]}>{insight}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={[styles.insightText, { color: colors.mutedText, textAlign: 'center' }]}>
                        {loading ? 'Analyzing data...' : 'No insights available yet. Keep tracking your health!'}
                    </Text>
                )}
            </View>
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
                <AnalyticsSummary
                    statistics={data?.statistics}
                    trends={data?.trends}
                    medication={data?.medication}
                    social={data?.social}
                    safety={data?.safety}
                />
                <TrendCharts timeSeries={data?.timeSeries} loading={loading && !data} />
                {renderInsights()}
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
        flexDirection: 'column',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    granularityContainer: {
        flexDirection: 'row',
        marginTop: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: 4,
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
        alignItems: 'flex-start',
    },
    insightIconStyle: {
        marginTop: 2,
        marginRight: 10,
    },
    insightText: {
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
});

export default AnalyticsDashboard;
