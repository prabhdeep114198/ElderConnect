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
import { useTranslation } from 'react-i18next';
import { AlertSection } from '../components/fallRisk/AlertSection';
import { ForecastCards } from '../components/fallRisk/ForecastCards';
import { RecommendationsSection } from '../components/fallRisk/RecommendationsSection';
import { RiskMeter } from '../components/fallRisk/RiskMeter';
import { RiskTrendChart } from '../components/fallRisk/RiskTrendChart';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fallRiskService } from '../services/api/fallRisk';
import { FallRiskAlert, FallRiskAnalysis, FallRiskRecommendation } from '../types/fallRisk';

// Feature constants
const REFRESH_INTERVAL = 30000; // 30 seconds for risk recalculation


export default function FallRiskDashboard() {
    const { colors, uiMode } = useTheme();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [refreshing, setRefreshing] = useState(false);
    const [analysis, setAnalysis] = useState<FallRiskAnalysis | null>(null);
    const [alerts, setAlerts] = useState<FallRiskAlert[]>([]);
    const [recs, setRecs] = useState<FallRiskRecommendation[]>([]);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
    const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
    const [alertThreshold, setAlertThreshold] = useState(70);
    const [error, setError] = useState<string | null>(null);


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
            setError(null);
        } catch (error: any) {
            console.error("Dashboard fetch error:", error);
            setError(error.message || "Failed to fetch data");
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

    // Periodic Refresh from API
    useEffect(() => {
        const interval = setInterval(async () => {
            if (user) {
                await fetchData();
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [user, fetchData]);

    // Threshold Notification (Still kept locally for immediate feedback)
    useEffect(() => {
        if (!analysis) return;

        const checkThreshold = async () => {
            if (analysis.currentScore > alertThreshold) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "🔴 High Fall Risk Alert",
                        body: `Patient risk score is ${Math.round(analysis.currentScore)}, exceeding threshold of ${alertThreshold}.`,
                        data: { score: analysis.currentScore },
                    },
                    trigger: null,
                });
            }
        };

        checkThreshold();
    }, [analysis?.currentScore, alertThreshold]);


    const isCaregiver = uiMode === 'caregiver';

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 10 }}>{t("analysisFailed")}</Text>
                <Text style={{ color: colors.mutedText, textAlign: 'center', marginTop: 5 }}>{error}</Text>
                <TouchableOpacity onPress={onRefresh} style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 20, paddingHorizontal: 30 }]}>
                    <Text style={styles.actionButtonText}>{t("retry")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!analysis) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>{t("loadingAnalysis")}</Text>
                {!user && <Text style={{ color: colors.mutedText, marginTop: 10 }}>{t("waitingForSession")}</Text>}
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
                    title: isCaregiver ? t("caregiverFallRisk") : t("myFallRisk"),
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
                        {isCaregiver ? t("patientsCurrentRisk") : t("yourRiskAnalysis")}
                    </Text>
                    <Text style={[styles.timestamp, { color: colors.mutedText }]}>
                        {t("lastUpdated")}: {lastUpdate}
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
                            {analysis.currentScore > 70 ? t('highRisk') : analysis.currentScore > 40 ? t('moderateRisk') : t('lowRisk')}
                        </Text>
                    </View>
                </View>

                {/* Detailed Indicators Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>{t("riskIndicators")}</Text>
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
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("futureOutlook")}</Text>
                    <ForecastCards data={analysis.forecasts.map(f => ({ days: f.days, score: f.predictedScore, trend: f.trend }))} />
                </View>

                {/* Risk Trend Line Chart */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("riskHistory")}</Text>
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
                        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>{t("caregiverActions")}</Text>

                        <View style={styles.thresholdControl}>
                            <Text style={[styles.thresholdLabel, { color: colors.text }]}>{t("alertThreshold")}: {alertThreshold}</Text>
                            <View style={styles.thresholdButtons}>
                                <TouchableOpacity
                                    onPress={async () => {
                                        const newVal = Math.max(10, alertThreshold - 5);
                                        setAlertThreshold(newVal);
                                        if (user) await fallRiskService.updateThreshold(user.id, newVal);
                                    }}
                                    style={[styles.smallBtn, { backgroundColor: colors.border }]}
                                >
                                    <Ionicons name="remove" size={20} color={colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={async () => {
                                        const newVal = Math.min(95, alertThreshold + 5);
                                        setAlertThreshold(newVal);
                                        if (user) await fallRiskService.updateThreshold(user.id, newVal);
                                    }}
                                    style={[styles.smallBtn, { backgroundColor: colors.border, marginLeft: 10 }]}
                                >
                                    <Ionicons name="add" size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>


                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 15 }]}>
                            <Ionicons name="notifications-outline" size={20} color="#FFF" />
                            <Text style={styles.actionButtonText}>{t("updatePreferences")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary, marginTop: 10 }]}>
                            <Ionicons name="call-outline" size={20} color="#FFF" />
                            <Text style={styles.actionButtonText}>{t("contactPatient")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.error, marginTop: 10 }]}>
                            <Ionicons name="warning-outline" size={20} color="#FFF" />
                            <Text style={styles.actionButtonText}>{t("emergencyProtocols")}</Text>
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
