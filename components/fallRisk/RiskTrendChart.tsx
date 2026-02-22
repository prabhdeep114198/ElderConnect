import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../context/ThemeContext';

interface RiskTrendChartProps {
    data: any[];
    forecastData?: any[];
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data, forecastData = [] }) => {
    const { colors } = useTheme();
    const screenWidth = Dimensions.get('window').width;

    const chartData = useMemo(() => {
        return data.map(item => ({
            value: item.value,
            label: item.label,
            dataPointText: String(item.value),
            dataPointColor: colors.primary,
        }));
    }, [data, colors.primary]);

    const secondaryData = useMemo(() => {
        return forecastData.map(item => ({
            value: item.value,
            label: item.label,
            dataPointColor: colors.secondary,
        }));
    }, [forecastData, colors.secondary]);

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.title, { color: colors.text }]}>Risk Trend & Forecast</Text>
            <LineChart
                data={chartData}
                secondaryData={secondaryData}
                width={screenWidth - 80}
                height={200}
                noOfSections={4}
                maxValue={100}
                initialSpacing={20}
                color={colors.primary}
                secondaryLineConfig={{ color: colors.secondary, strokeDashArray: [5, 5] }}
                thickness={3}
                dataPointsColor={colors.primary}
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.mutedText, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.mutedText, fontSize: 10 }}
                areaChart
                startFillColor={colors.primary}
                endFillColor={colors.primary}
                startOpacity={0.2}
                endOpacity={0.05}
                pointerConfig={{
                    pointerStripHeight: 160,
                    pointerStripColor: 'lightgray',
                    pointerStripWidth: 2,
                    pointerColor: colors.primary,
                    radius: 6,
                    pointerLabelComponent: (items: any[]) => {
                        return (
                            <View style={[styles.tooltip, { backgroundColor: colors.backgroundDark }]}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{items[0].value}</Text>
                            </View>
                        );
                    },
                }}
            />
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.legendText, { color: colors.mutedText }]}>Historical</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: colors.secondary, borderRadius: 2, borderWidth: 1, borderColor: colors.secondary, borderStyle: 'dashed' }]} />
                    <Text style={[styles.legendText, { color: colors.mutedText }]}>Forecast</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        borderRadius: 20,
        marginVertical: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '500',
    },
    tooltip: {
        height: 30,
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
});
