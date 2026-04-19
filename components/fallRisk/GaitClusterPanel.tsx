import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GaitClusters } from '../../types/fallRisk';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
    clusters: GaitClusters;
}

interface ClusterBarProps {
    label: string;
    percentage: number;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Bar
// ─────────────────────────────────────────────────────────────────────────────

function ClusterBar({ label, percentage, color, icon, description }: ClusterBarProps) {
    const { colors } = useTheme();
    const barWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(barWidth, {
            toValue: percentage,
            duration: 900,
            delay: 200,
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    return (
        <View style={styles.barRow}>
            {/* Icon + Label */}
            <View style={styles.barLabelContainer}>
                <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={14} color={color} />
                </View>
                <Text style={[styles.barLabel, { color: colors.text }]}>{label}</Text>
            </View>

            {/* Bar track */}
            <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <Animated.View
                    style={[
                        styles.barFill,
                        {
                            backgroundColor: color,
                            width: barWidth.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>

            {/* Percentage */}
            <Text style={[styles.barPct, { color: colors.text }]}>{percentage}%</Text>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Panel
// ─────────────────────────────────────────────────────────────────────────────

export function GaitClusterPanel({ clusters }: Props) {
    const { colors } = useTheme();

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    // Interpret the dominant pattern for the insight text
    const insightText = clusters.dominantPattern === 'sedentary'
        ? `${clusters.sedentaryPct}% of your days were sedentary this month. Consistent inactivity is the #1 predictor of gait instability.`
        : clusters.dominantPattern === 'active'
            ? `Great job! ${clusters.activePct}% of your days were active. Keep this up to maintain strong balance.`
            : `You have a balanced activity profile. Increasing your active days to 40%+ can significantly reduce fall risk.`;

    const gaitIrregularityLabel =
        clusters.stepVariance < 500_000 ? 'Low (Consistent)' :
        clusters.stepVariance < 2_000_000 ? 'Moderate' : 'High (Irregular)';

    const gaitIrregularityColor =
        clusters.stepVariance < 500_000 ? colors.success :
        clusters.stepVariance < 2_000_000 ? colors.warning : colors.error;

    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim },
            ]}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons name="analytics-outline" size={20} color={colors.primary} />
                    <Text style={[styles.title, { color: colors.text }]}>AI Gait Cluster Analysis</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>30-Day AI</Text>
                </View>
            </View>

            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                K-Means activity clustering over your last 30 days of health data
            </Text>

            {/* Cluster Bars */}
            <View style={styles.barsContainer}>
                <ClusterBar
                    label="Sedentary"
                    percentage={clusters.sedentaryPct}
                    color="#94A3B8"
                    icon="bed-outline"
                    description="Low movement days"
                />
                <ClusterBar
                    label="Moderate"
                    percentage={clusters.moderatePct}
                    color="#3B82F6"
                    icon="walk-outline"
                    description="Moderate movement days"
                />
                <ClusterBar
                    label="Active"
                    percentage={clusters.activePct}
                    color="#10B981"
                    icon="fitness-outline"
                    description="High movement days"
                />
            </View>

            {/* Gait Irregularity Indicator */}
            <View style={[styles.gaitRow, { borderTopColor: colors.border }]}>
                <View style={styles.gaitLabelRow}>
                    <Ionicons name="footsteps-outline" size={16} color={colors.mutedText} />
                    <Text style={[styles.gaitLabel, { color: colors.mutedText }]}>Gait Irregularity Index</Text>
                </View>
                <Text style={[styles.gaitValue, { color: gaitIrregularityColor }]}>
                    {gaitIrregularityLabel}
                </Text>
            </View>

            {/* AI Insight */}
            <View style={[styles.insightBox, { backgroundColor: colors.primary + '08' }]}>
                <Ionicons name="bulb-outline" size={16} color={colors.primary} style={{ marginTop: 1 }} />
                <Text style={[styles.insightText, { color: colors.text }]}>{insightText}</Text>
            </View>
        </Animated.View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 18,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 6,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 16,
        lineHeight: 17,
    },
    barsContainer: {
        gap: 12,
        marginBottom: 16,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    barLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100,
        gap: 6,
    },
    iconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    barLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    barTrack: {
        flex: 1,
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 5,
    },
    barPct: {
        fontSize: 13,
        fontWeight: '700',
        width: 34,
        textAlign: 'right',
    },
    gaitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        marginBottom: 12,
    },
    gaitLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    gaitLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    gaitValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    insightBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        borderRadius: 12,
    },
    insightText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '500',
    },
});
