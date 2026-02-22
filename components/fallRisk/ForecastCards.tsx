import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ForecastData {
    days: number;
    score: number;
    trend: 'up' | 'down' | 'stable';
}

interface ForecastCardsProps {
    data: ForecastData[];
}

export const ForecastCards: React.FC<ForecastCardsProps> = ({ data }) => {
    const { colors } = useTheme();

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return 'trending-up';
            case 'down': return 'trending-down';
            default: return 'remove';
        }
    };

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return colors.error;
            case 'down': return colors.success;
            default: return colors.mutedText;
        }
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {data.map((item, index) => (
                <View key={index} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                    <Text style={[styles.daysLabel, { color: colors.mutedText }]}>{item.days} Day Forecast</Text>
                    <View style={styles.scoreRow}>
                        <Text style={[styles.scoreValue, { color: colors.text }]}>{item.score}</Text>
                        <Ionicons
                            name={getTrendIcon(item.trend)}
                            size={20}
                            color={getTrendColor(item.trend)}
                            style={styles.trendIcon}
                        />
                    </View>
                    <Text style={[styles.riskLabel, { color: item.score > 70 ? colors.error : colors.mutedText }]}>
                        {item.score > 70 ? 'High Risk' : item.score > 40 ? 'Moderate' : 'Low Risk'}
                    </Text>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    card: {
        width: 130,
        padding: 15,
        borderRadius: 16,
        marginHorizontal: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    daysLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    trendIcon: {
        marginLeft: 6,
    },
    riskLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
});
