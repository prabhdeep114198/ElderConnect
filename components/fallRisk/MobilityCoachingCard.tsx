import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { CoachingExercise, ExerciseDifficulty, MobilityCoachingPlan, RiskCategory } from '../../types/fallRisk';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<ExerciseDifficulty, { label: string; color: string; bg: string }> = {
    beginner:     { label: 'Beginner',     color: '#10B981', bg: '#10B98115' },
    intermediate: { label: 'Intermediate', color: '#F59E0B', bg: '#F59E0B15' },
    advanced:     { label: 'Advanced',     color: '#EF4444', bg: '#EF444415' },
};

const RISK_CONFIG: Record<RiskCategory, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    LOW:      { label: 'Low Risk',      color: '#10B981', bg: '#10B98115', icon: 'checkmark-circle-outline' },
    MODERATE: { label: 'Moderate Risk', color: '#F59E0B', bg: '#F59E0B15', icon: 'warning-outline' },
    HIGH:     { label: 'High Risk',     color: '#EF4444', bg: '#EF444415', icon: 'alert-circle-outline' },
    CRITICAL: { label: 'Critical Risk', color: '#DC2626', bg: '#DC262615', icon: 'nuclear-outline' },
};

// ─────────────────────────────────────────────────────────────────────────────
// ExerciseCard — individual card with "Mark Done" toggle
// ─────────────────────────────────────────────────────────────────────────────

interface ExerciseCardProps {
    exercise: CoachingExercise;
    index: number;
}

function ExerciseCard({ exercise, index }: ExerciseCardProps) {
    const { colors } = useTheme();
    const [completed, setCompleted] = useState(exercise.completed ?? false);
    const [expanded, setExpanded] = useState(false);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const checkScale = useRef(new Animated.Value(1)).current;

    const diffConfig = DIFFICULTY_CONFIG[exercise.difficulty];

    const handleComplete = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.sequence([
            Animated.timing(checkScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
            Animated.timing(checkScale, { toValue: 1.0, duration: 120, useNativeDriver: true }),
        ]).start();
        setCompleted(prev => !prev);
    };

    const handleExpand = () => {
        Animated.timing(slideAnim, {
            toValue: expanded ? 0 : 1,
            duration: 250,
            useNativeDriver: false,
        }).start();
        setExpanded(prev => !prev);
    };

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
            speed: 50,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1.0,
            useNativeDriver: true,
            speed: 50,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 12 }}>
            <Pressable
                onPress={handleExpand}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.exerciseCard,
                    {
                        backgroundColor: completed
                            ? (colors.success ?? '#10B981') + '12'
                            : colors.card,
                        borderColor: completed
                            ? (colors.success ?? '#10B981') + '40'
                            : colors.border,
                    },
                ]}
            >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                    {/* Exercise number badge */}
                    <View style={[styles.numberBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.numberText, { color: colors.primary }]}>{index + 1}</Text>
                    </View>

                    {/* Title block */}
                    <View style={styles.titleBlock}>
                        <Text
                            style={[
                                styles.exerciseName,
                                { color: colors.text, textDecorationLine: completed ? 'line-through' : 'none' },
                            ]}
                            numberOfLines={2}
                        >
                            {exercise.name}
                        </Text>
                        <View style={styles.metaRow}>
                            <View style={[styles.difficultyBadge, { backgroundColor: diffConfig.bg }]}>
                                <Text style={[styles.difficultyText, { color: diffConfig.color }]}>
                                    {diffConfig.label}
                                </Text>
                            </View>
                            <Text style={[styles.metaText, { color: colors.mutedText }]}>
                                {exercise.sets} sets · {exercise.duration}
                            </Text>
                        </View>
                    </View>

                    {/* Complete checkbox */}
                    <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                        <Pressable
                            onPress={handleComplete}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={[
                                styles.checkCircle,
                                {
                                    borderColor: completed ? (colors.success ?? '#10B981') : colors.border,
                                    backgroundColor: completed ? (colors.success ?? '#10B981') : 'transparent',
                                },
                            ]}
                        >
                            {completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </Pressable>
                    </Animated.View>

                    {/* Expand chevron */}
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.mutedText}
                        style={{ marginLeft: 4 }}
                    />
                </View>

                {/* Expanded details */}
                {expanded && (
                    <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
                        <View style={styles.detailRow}>
                            <Ionicons name="trophy-outline" size={15} color={colors.primary} />
                            <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Goal</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{exercise.goal}</Text>
                        </View>
                        <View style={[styles.tailoredBox, { backgroundColor: colors.primary + '08' }]}>
                            <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
                            <Text style={[styles.tailoredText, { color: colors.text }]}>
                                {exercise.tailoredReason}
                            </Text>
                        </View>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MobilityCoachingCard — full plan display
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
    plan: MobilityCoachingPlan;
}

export function MobilityCoachingCard({ plan }: Props) {
    const { colors } = useTheme();
    const riskConfig = RISK_CONFIG[plan.riskCategory];

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Ionicons name="body-outline" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Mobility Coaching</Text>
                <View style={[styles.aiBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="sparkles" size={10} color={colors.primary} />
                    <Text style={[styles.aiBadgeText, { color: colors.primary }]}>Groq AI</Text>
                </View>
            </View>

            {/* Risk Category Banner */}
            <View style={[styles.riskBanner, { backgroundColor: riskConfig.bg, borderColor: riskConfig.color + '30' }]}>
                <Ionicons name={riskConfig.icon} size={18} color={riskConfig.color} />
                <Text style={[styles.riskLabel, { color: riskConfig.color }]}>{riskConfig.label}</Text>
            </View>

            {/* AI Summary */}
            <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.summaryText, { color: colors.text }]}>{plan.summary}</Text>
            </View>

            {/* Weekly Goal */}
            <View style={[styles.goalBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <Ionicons name="flag-outline" size={16} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.goalLabel, { color: colors.primary }]}>This Week's Goal</Text>
                    <Text style={[styles.goalText, { color: colors.text }]}>{plan.weeklyGoal}</Text>
                </View>
            </View>

            {/* Exercise Cards */}
            <Text style={[styles.exercisesLabel, { color: colors.mutedText }]}>
                YOUR PERSONALIZED EXERCISES
            </Text>
            {plan.exercises.map((exercise, idx) => (
                <ExerciseCard key={exercise.id} exercise={exercise} index={idx} />
            ))}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 6,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginLeft: 4,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    aiBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    riskBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 14,
    },
    riskLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    summaryBox: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 21,
        fontWeight: '500',
    },
    goalBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 18,
    },
    goalLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    goalText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    exercisesLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    // Exercise Card
    exerciseCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 10,
    },
    numberBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numberText: {
        fontSize: 13,
        fontWeight: '800',
    },
    titleBlock: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 5,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: '700',
    },
    metaText: {
        fontSize: 11,
        fontWeight: '500',
    },
    checkCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandedContent: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        borderTopWidth: 1,
        paddingTop: 12,
        gap: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '600',
        width: 40,
    },
    detailValue: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '500',
    },
    tailoredBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 10,
        borderRadius: 10,
    },
    tailoredText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        fontStyle: 'italic',
        fontWeight: '500',
    },
});
