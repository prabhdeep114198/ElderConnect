import { Ionicons } from '@expo/vector-icons';
import * as Notifications from "expo-notifications";
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AlertSection } from '../components/fallRisk/AlertSection';
import { ForecastCards } from '../components/fallRisk/ForecastCards';
import { RecommendationsSection } from '../components/fallRisk/RecommendationsSection';
import { RiskMeter } from '../components/fallRisk/RiskMeter';
import { RiskTrendChart } from '../components/fallRisk/RiskTrendChart';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fallRiskService } from '../services/api/fallRisk';
import { FallRiskAlert, FallRiskAnalysis, FallRiskRecommendation } from '../types/fallRisk';

// Mock Data
const MOCK_HISTORICAL_DATA = {
    '7d': [
        { label: 'Mon', value: 35 },
        { label: 'Tue', value: 38 },
        { label: 'Wed', value: 42 },
        { label: 'Thu', value: 40 },
        { label: 'Fri', value: 45 },
        { label: 'Sat', value: 48 },
        { label: 'Sun', value: 50 },
    ],
    '30d': Array.from({ length: 30 }, (_, i) => ({ label: `Day ${i + 1}`, value: 30 + Math.random() * 40 })),
    '90d': Array.from({ length: 90 }, (_, i) => ({ label: `W${Math.floor(i / 7) + 1}`, value: 25 + Math.random() * 50 })),
};

const MOCK_FORECAST_DATA = [
    { days: 7, score: 55, trend: 'up' as const },
    { days: 30, score: 62, trend: 'up' as const },
    { days: 90, score: 48, trend: 'stable' as const },
];

const MOCK_ALERTS = [
    { id: '1', type: 'warning' as const, message: 'Reduced activity levels detected over the last 48 hours.', timestamp: '2 hours ago' },
    { id: '2', type: 'info' as const, message: 'Gait stability slightly lower than usual during morning walk.', timestamp: 'Yesterday' },
];

const MOCK_RECOMMENDATIONS = [
    { id: '1', icon: 'walk-outline' as const, title: 'Balance Exercises', description: 'Try 10 minutes of standing on one leg with support to improve stability.' },
    { id: '2', icon: 'bulb-outline' as const, title: 'Home Safety', description: 'Ensure all rugs are secured and walkways are clear of clutter.' },
    { id: '3', icon: 'water-outline' as const, title: 'Hydration', description: 'Proper hydration supports blood pressure and reduces dizziness.' },
];

export default function FallRiskDashboard() {
    const { colors, uiMode } = useTheme();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [analysis, setAnalysis] = useState<FallRiskAnalysis | null>(null);
    const [alerts, setAlerts] = useState<FallRiskAlert[]>([]);
    const [recs, setRecs] = useState<FallRiskRecommendation[]>([]);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
    const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
    const [alertThreshold, setAlertThreshold] = useState(70);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const [analysisData, alertsData, recsData] = await Promise.all([
                fallRiskService.getAnalysis(user.id),
                fallRiskService.getAlerts(user.id),
                fallRiskService.getRecommendations(user.id)
            ]);
            setAnalysis(analysisData);
            setAlerts(alertsData);
            setRecs(recsData);
            setLastUpdate(new Date().toLocaleTimeString());
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    // Real-time update simulation & Threshold Notification
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!analysis) return;

            const change = Math.random() * 4 - 2;
            const newScore = Math.min(100, Math.max(0, analysis.currentScore + change));

            setAnalysis(prev => prev ? { ...prev, currentScore: newScore } : null);
            setLastUpdate(new Date().toLocaleTimeString());

            // Trigger Alert if threshold exceeded
            if (newScore > alertThreshold && analysis.currentScore <= alertThreshold) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "🔴 High Fall Risk Alert",
                        body: `Patient risk score has exceeded your set threshold of ${alertThreshold}. Current score: ${Math.round(newScore)}`,
                        data: { score: newScore },
                    },
                    trigger: null,
                });
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [analysis, alertThreshold]);

    const isCaregiver = uiMode === 'caregiver';

    if (!analysis) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Loading Analysis...</Text>
            </View>
        );
    }

    const historicalDataFormatted = analysis.historicalData.map(d => ({
        value: d.score,
        label: new Date(d.timestamp).toLocaleDateString([], { weekday: 'short' }),
    }));

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: isCaregiver ? "Caregiver: Fall Risk" : "My Fall Risk",
                    headerRight: () => (
                        <TouchableOpacity onPress={onRefresh} style={{ marginRight: 15 }}>
                            <Ionicons name="refresh" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {isCaregiver ? "Patient's Current Risk" : "Your Risk Analysis"}
                    </Text>
                    <Text style={[styles.timestamp, { color: colors.mutedText }]}>
                        Last updated: {lastUpdate}
                    </Text>
                </View>

                {/* Current Risk Circular Meter */}
                <View style={styles.meterSection}>
                    <RiskMeter
                        score={analysis.currentScore}
                        size={220}
                        accessible={true}
                        accessibilityLabel={`Fall risk score is ${Math.round(analysis.currentScore)} out of 100`}
                        accessibilityRole="summary"
                    />
                    <View style={[styles.statusBadge, { backgroundColor: analysis.currentScore > 70 ? colors.error + '20' : analysis.currentScore > 40 ? colors.warning + '20' : colors.success + '20' }]}>
                        <Text style={[styles.statusText, { color: analysis.currentScore > 70 ? colors.error : analysis.currentScore > 40 ? colors.warning : colors.success }]}>
                            {analysis.currentScore > 70 ? 'High Risk' : analysis.currentScore > 40 ? 'Moderate Risk' : 'Low Risk'}
                        </Text>
                    </View>
                </View>

                {/* Detailed Indicators Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Risk Indicators</Text>
                    <View style={styles.indicatorsGrid}>
                        <View style={[styles.indicatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="footsteps" size={24} color={colors.primary} />
                            <Text style={[styles.indicatorVal, { color: colors.text }]}>{analysis.indicators.gaitSpeedVar}%</Text>
                            <Text style={[styles.indicatorLabel, { color: colors.mutedText }]}>Gait Variab.</Text>
                        </View>
                        <View style={[styles.indicatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="fitness" size={24} color={colors.primary} />
                            <Text style={[styles.indicatorVal, { color: colors.text }]}>{analysis.indicators.activityLevel}%</Text>
                            <Text style={[styles.indicatorLabel, { color: colors.mutedText }]}>Activity</Text>
                        </View>
                        <View style={[styles.indicatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="medkit" size={24} color={colors.primary} />
                            <Text style={[styles.indicatorVal, { color: colors.text }]}>{analysis.indicators.medicationAdherence}%</Text>
                            <Text style={[styles.indicatorLabel, { color: colors.mutedText }]}>Med Adher.</Text>
                        </View>
                        <View style={[styles.indicatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="home" size={24} color={colors.primary} />
                            <Text style={[styles.indicatorVal, { color: colors.text }]}>{analysis.indicators.environmentalRisk}%</Text>
                            <Text style={[styles.indicatorLabel, { color: colors.mutedText }]}>Env. Risk</Text>
                        </View>
                    </View>
                </View>

                {/* Forecast Cards */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Future Outlook</Text>
                    <ForecastCards data={analysis.forecasts.map(f => ({ days: f.days, score: f.predictedScore, trend: f.trend }))} />
                </View>

                {/* Risk Trend Line Chart */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Risk History</Text>
                        <View style={styles.filterContainer}>
                            {(['7d', '30d', '90d'] as const).map((range) => (
                                <TouchableOpacity
                                    key={range}
                                    onPress={() => setTimeRange(range)}
                                    style={[
                                        styles.filterButton,
                                        timeRange === range && { backgroundColor: colors.primary }
                                    ]}
                                    accessibilityLabel={`Filter by ${range}`}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: timeRange === range }}
                                >
                                    <Text style={[
                                        styles.filterText,
                                        { color: timeRange === range ? '#FFF' : colors.mutedText }
                                    ]}>
                                        {range.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <RiskTrendChart
                        data={historicalDataFormatted.slice(timeRange === '7d' ? -7 : timeRange === '30d' ? -30 : -90)}
                        forecastData={analysis.forecasts.map((f, i) => ({ label: `+${f.days}d`, value: f.predictedScore }))}
                    />
                </View>

                {/* Alerts Section */}
                <AlertSection alerts={alerts} />

                {/* Recommendations Section */}
                <RecommendationsSection recommendations={recs} />

                {/* Caregiver Specific Section */}
                {isCaregiver && (
                    <View style={[styles.caregiverSection, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Caregiver Actions</Text>

                        <View style={styles.thresholdControl}>
                            <Text style={[styles.thresholdLabel, { color: colors.text }]}>Alert Threshold: {alertThreshold}</Text>
                            <View style={styles.thresholdButtons}>
                                <TouchableOpacity
                                    onPress={() => setAlertThreshold(prev => Math.max(10, prev - 5))}
                                    style={[styles.smallBtn, { backgroundColor: colors.border }]}
                                >
                                    <Ionicons name="remove" size={20} color={colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setAlertThreshold(prev => Math.min(95, prev + 5))}
                                    style={[styles.smallBtn, { backgroundColor: colors.border, marginLeft: 10 }]}
                                >
                                    <Ionicons name="add" size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 15 }]}>
                            <Ionicons name="notifications-outline" size={20} color="#FFF" />
                            <Text style={styles.actionButtonText}>Update Preferences</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary, marginTop: 10 }]}>
                            <Ionicons name="call-outline" size={20} color="#FFF" />
                            <Text style={styles.actionButtonText}>Contact Patient</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.error, marginTop: 10 }]}>
                            <Ionicons name="warning-outline" size={20} color="#FFF" />
                            <Text style={styles.actionButtonText}>Emergency Protocols</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    timestamp: {
        fontSize: 12,
        marginTop: 4,
    },
    meterSection: {
        alignItems: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    statusBadge: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    indicatorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    indicatorCard: {
        width: '48%',
        padding: 15,
        borderRadius: 16,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    indicatorVal: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
    },
    indicatorLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
        textAlign: 'center',
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        padding: 2,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
    },
    caregiverSection: {
        padding: 20,
        borderRadius: 20,
        marginTop: 10,
        marginBottom: 30,
    },
    thresholdControl: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    thresholdLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    thresholdButtons: {
        flexDirection: 'row',
    },
    smallBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});
