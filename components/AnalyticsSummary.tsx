import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface StatCardProps {
    title: string;
    value: string | number;
    unit?: string;
    trend?: 'increasing' | 'decreasing' | 'stable';
    change?: number;
    icon: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, trend, change, icon, color }) => {
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
            case 'increasing': return Colors.success;
            case 'decreasing': return Colors.error;
            case 'stable': return Colors.mutedText;
            default: return Colors.mutedText;
        }
    };

    return (
        <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardValue}>{value}</Text>
                {unit && <Text style={styles.cardUnit}>{unit}</Text>}
            </View>
            {trend && change !== undefined && (
                <View style={styles.trendContainer}>
                    <Ionicons name={getTrendIcon()} size={14} color={getTrendColor()} />
                    <Text style={[styles.trendText, { color: getTrendColor() }]}>
                        {Math.abs(change).toFixed(1)}% vs previous
                    </Text>
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
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ statistics, trends, medication, social, safety }) => {
    if (!statistics || !trends) return null;

    const getSafetyColor = (status: string) => {
        switch (status) {
            case 'safe': return Colors.success;
            case 'notice': return Colors.warning;
            case 'warning': return Colors.error;
            default: return Colors.mutedText;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                <StatCard
                    title="Avg Heart Rate"
                    value={Math.round(statistics.heartRate.avg)}
                    unit="BPM"
                    trend={trends.heartRate.trend}
                    change={trends.heartRate.change}
                    icon="heart"
                    color={Colors.error}
                />
                <StatCard
                    title="Daily Steps"
                    value={Math.round(statistics.steps.avg).toLocaleString()}
                    unit="steps"
                    trend={trends.steps.trend}
                    change={trends.steps.change}
                    icon="walk"
                    color={Colors.primary}
                />
                <StatCard
                    title="Avg Sleep"
                    value={statistics.sleep.avg.toFixed(1)}
                    unit="hrs"
                    trend={trends.sleep.trend}
                    change={trends.sleep.change}
                    icon="moon"
                    color="#8B5CF6"
                />
                <StatCard
                    title="Avg Water"
                    value={Math.round(statistics.water.avg)}
                    unit="ml"
                    trend={trends.water.trend}
                    change={trends.water.change}
                    icon="water"
                    color="#06B6D4"
                />
                {medication && (
                    <StatCard
                        title="Medication Adherence"
                        value={`${medication.adherenceRate}%`}
                        unit=""
                        icon="medkit"
                        color="#10B981"
                        trend={medication.adherenceRate >= 90 ? 'stable' : 'decreasing'}
                        change={0}
                    />
                )}
                {social && (
                    <StatCard
                        title="Social Engagement"
                        value={`${social.engagementScore}%`}
                        unit=""
                        icon="people"
                        color="#6366F1"
                    />
                )}
                {safety && (
                    <StatCard
                        title="Safety Status"
                        value={safety.status.toUpperCase()}
                        unit=""
                        icon="shield-checkmark"
                        color={getSafetyColor(safety.status)}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: (width - 48) / 2, // Slightly adjusted for better padding
        backgroundColor: Colors.card,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 12,
        color: Colors.mutedText,
        fontWeight: '600',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    cardUnit: {
        fontSize: 12,
        color: Colors.mutedText,
        marginLeft: 4,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    trendText: {
        fontSize: 11,
        marginLeft: 4,
        fontWeight: '500',
    },
});

export default AnalyticsSummary;
