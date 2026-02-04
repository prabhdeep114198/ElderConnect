import React from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface TrendChartsProps {
    timeSeries: any[];
    loading?: boolean;
}

const TrendCharts: React.FC<TrendChartsProps> = ({ timeSeries, loading }) => {
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!timeSeries || timeSeries.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No trend data available for the selected period.</Text>
            </View>
        );
    }

    // Transform data for charts
    const heartRateData = timeSeries.map(d => ({
        value: d.heartRate.avg,
        label: d.period.split('-').slice(1).join('/'), // MM/DD
        dataPointText: Math.round(d.heartRate.avg).toString(),
    }));

    const stepsData = timeSeries.map(d => ({
        value: d.steps.avg,
        label: d.period.split('-').slice(1).join('/'),
    }));

    return (
        <View style={styles.container}>
            <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>Heart Rate Trend (BPM)</Text>
                <LineChart
                    data={heartRateData}
                    height={200}
                    width={width - 80}
                    initialSpacing={20}
                    spacing={40}
                    color={Colors.error}
                    thickness={3}
                    startFillColor={Colors.error}
                    endFillColor="rgba(239, 68, 68, 0.1)"
                    startOpacity={0.4}
                    endOpacity={0.1}
                    noOfSections={4}
                    yAxisColor="#D1D5DB"
                    xAxisColor="#D1D5DB"
                    rulesColor="#E5E7EB"
                    yAxisTextStyle={styles.axisText}
                    xAxisLabelTextStyle={styles.axisText}
                    pointerConfig={{
                        pointerStripUptoDataPoint: true,
                        pointerStripColor: 'lightgray',
                        pointerStripWidth: 2,
                        strokeDashArray: [2, 5],
                        pointerColor: Colors.error,
                        radius: 4,
                        pointerLabelComponent: (items: any) => {
                            return (
                                <View style={styles.pointerLabel}>
                                    <Text style={styles.pointerText}>{items[0].value} BPM</Text>
                                </View>
                            );
                        },
                    }}
                />
            </View>

            <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>Daily Steps</Text>
                <LineChart
                    data={stepsData}
                    height={200}
                    width={width - 80}
                    initialSpacing={20}
                    spacing={40}
                    color={Colors.primary}
                    thickness={3}
                    startFillColor={Colors.primary}
                    endFillColor="rgba(46, 94, 170, 0.1)"
                    startOpacity={0.4}
                    endOpacity={0.1}
                    yAxisColor="#D1D5DB"
                    xAxisColor="#D1D5DB"
                    rulesColor="#E5E7EB"
                    yAxisTextStyle={styles.axisText}
                    xAxisLabelTextStyle={styles.axisText}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20,
    },
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 12,
        marginTop: 10,
    },
    emptyText: {
        color: Colors.mutedText,
        fontSize: 14,
    },
    chartSection: {
        backgroundColor: Colors.card,
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 20,
    },
    axisText: {
        color: Colors.mutedText,
        fontSize: 10,
    },
    pointerLabel: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'white',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    pointerText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.text,
    },
});

export default TrendCharts;
