import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface StatCardProps {
    title: string;
    value: string | number;
    unit?: string;
    trend?: 'increasing' | 'decreasing' | 'stable';
    change?: number;
    icon: string;
    color: string;
    target?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, trend, change, icon, color, target }) => {
    const { colors } = useTheme();

    const getTrendIcon = () => {
        switch (trend) {
            case 'increasing': return 'trending-up';
            case 'decreasing': return 'trending-down';
            case 'stable': return 'remove';
            default: return 'remove';
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'increasing': return colors.success;
            case 'decreasing': return colors.error;
            case 'stable': return colors.mutedText;
            default: return colors.mutedText;
        }
    };

    const getProgress = () => {
        if (!target) return 0;
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
        return Math.min(100, (numValue / target) * 100);
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
                {trend && (
                    <View style={styles.trendIconContainer}>
                        <Ionicons name={getTrendIcon()} size={16} color={getTrendColor()} />
                    </View>
                )}
            </View>

            <View style={styles.cardContent}>
                <Text style={[styles.cardValue, { color: colors.text }]}>
                    {value} <Text style={[styles.cardUnit, { color: colors.mutedText }]}>{unit}</Text>
                </Text>
                <Text style={[styles.cardTitle, { color: colors.mutedText }]}>{title}</Text>
            </View>

            {target && (
                <View style={styles.progressSection}>
                    <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                        <View style={[styles.progressFill, { width: `${getProgress()}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.mutedText }]}>
                        {Math.round(getProgress())}% of goal
                    </Text>
                </View>
            )}

            {trend && change !== undefined && (
                <View style={styles.trendFooter}>
                    <View style={styles.trendBadge}>
                        <Ionicons name={getTrendIcon()} size={14} color={getTrendColor()} />
                        <Text style={[styles.trendFooterText, { color: getTrendColor() }]}>
                            {Math.abs(change).toFixed(1)}% vs previous
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

interface AnalyticsSummaryProps {
    statistics: any;
    trends: any;
    medication?: any;
    social?: any;
    safety?: any;
    wellnessProfile?: any;
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ statistics, trends, medication, social, safety, wellnessProfile }) => {
    const { colors } = useTheme();

    if (!statistics || !trends) return null;

    // Use backend wellness scores if available, otherwise calculate fallback
    const wellnessScore = wellnessProfile?.physicalScore || Math.round(
        (Math.min(100, (statistics.steps.avg / 8000) * 100) +
            Math.min(100, (statistics.sleep.avg / 8) * 100) +
            Math.min(100, (statistics.water.avg / 2000) * 100) +
            (medication?.adherenceRate || 80)) / 4
    );

    const sleepScore = wellnessProfile?.sleepScore || (statistics.sleep.avg / 8) * 100;

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Metrics</Text>
            <View style={styles.grid}>
                <StatCard
                    title="Overall Wellness"
                    value={wellnessScore}
                    unit="%"
                    icon="fitness"
                    color={wellnessScore > 75 ? colors.success : wellnessScore > 50 ? colors.warning : colors.error}
                    target={100}
                />
                <StatCard
                    title="Avg Heart Rate"
                    value={Math.round(statistics.heartRate.avg)}
                    unit="BPM"
                    trend={trends.heartRate.trend}
                    change={trends.heartRate.change}
                    icon="heart"
                    color={colors.error}
                />
                <StatCard
                    title="Daily Steps"
                    value={Math.round(statistics.steps.avg)}
                    unit="steps"
                    trend={trends.steps.trend}
                    change={trends.steps.change}
                    icon="walk"
                    color={colors.primary}
                    target={8000}
                />
                <StatCard
                    title="Sleep Quality"
                    value={Math.round(sleepScore)}
                    unit="score"
                    trend={trends.sleep.trend}
                    change={trends.sleep.change}
                    icon="moon"
                    color="#8B5CF6"
                    target={100}
                />
                <StatCard
                    title="Avg Hydration"
                    value={Math.round(statistics.water.avg)}
                    unit="ml"
                    trend={trends.water.trend}
                    change={trends.water.change}
                    icon="water"
                    color="#06B6D4"
                    target={2000}
                />
                <StatCard
                    title="Mental Score"
                    value={wellnessProfile?.mentalScore || 70}
                    unit="%"
                    icon="happy"
                    color="#9C27B0"
                    target={100}
                />
                {medication && (
                    <StatCard
                        title="Medications"
                        value={wellnessProfile?.medicationAdherence ?? medication.adherenceRate}
                        unit="%"
                        icon="medkit"
                        color="#10B981"
                        target={100}
                    />
                )}
                {social && (
                    <StatCard
                        title="Social Engagement"
                        value={wellnessProfile?.socialScore || social.engagementScore}
                        unit="%"
                        icon="people"
                        color="#6366F1"
                        target={100}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: (width - 48) / 2,
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendIconContainer: {
        padding: 4,
    },
    cardContent: {
        marginBottom: 12,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    cardUnit: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    progressSection: {
        marginTop: 8,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 10,
        fontWeight: '600',
    },
    trendFooter: {
        marginTop: 8,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendFooterText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 4,
    },
});

export default AnalyticsSummary;
