import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

import { FallRiskRecommendation } from '../../types/fallRisk';

interface RecommendationsSectionProps {
    recommendations: FallRiskRecommendation[];
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ recommendations }) => {
    const { colors } = useTheme();

    const getIcon = (category: string): keyof typeof Ionicons.glyphMap => {
        switch (category) {
            case 'exercise': return 'fitness';
            case 'environment': return 'home';
            case 'medication': return 'medkit';
            default: return 'bulb';
        }
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>Recommendations</Text>
            {recommendations.map(rec => (
                <View key={rec.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name={getIcon(rec.category)} size={24} color={colors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <View style={styles.recHeader}>
                            <Text style={[styles.recTitle, { color: colors.text }]}>{rec.title}</Text>
                            <View style={[styles.priorityBadge, { backgroundColor: rec.priority === 'high' ? colors.error + '20' : colors.primary + '20' }]}>
                                <Text style={[styles.priorityText, { color: rec.priority === 'high' ? colors.error : colors.primary }]}>{rec.priority}</Text>
                            </View>
                        </View>
                        <Text style={[styles.recDesc, { color: colors.mutedText }]}>{rec.description}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 15,
        paddingBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    recTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    recHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    recDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
});
