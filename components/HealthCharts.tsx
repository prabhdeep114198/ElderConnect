import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { deviceService } from '../services/api/device';
import { profileService } from '../services/api/profile';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get("window").width;

interface HealthChartsProps {
    userId: string;
}

export const HealthCharts: React.FC<HealthChartsProps> = ({ userId }) => {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({
        steps: { labels: [], data: [] },
        sleep: { labels: [], data: [] },
        bp: { labels: [], data: [], dataDiastolic: [] },
        heartRate: { labels: [], data: [] },
        weight: { labels: [], data: [] },
        water: { labels: [], data: [] },
        exercise: { labels: [], data: [] },
    });

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 6); // Last 7 days

            const startStr = startDate.toISOString();
            const endStr = endDate.toISOString();

            // Fetch from daily_health_metrics table
            const metricsRes: any = await profileService.getMetricsRange(userId, startStr, endStr);
            const metricsData = metricsRes?.data?.metrics || [];

            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            const processChartData = (metricKey: 'steps' | 'heartRate' | 'sleepHours' | 'waterIntake') => {
                const dailyMap = new Map<string, number>();

                // Initialize last 7 days with 0
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + i);
                    const dateKey = d.toISOString().split('T')[0];
                    dailyMap.set(dateKey, 0);
                }

                // Fill with actual data
                metricsData.forEach((metric: any) => {
                    const dateKey = new Date(metric.date).toISOString().split('T')[0];
                    if (dailyMap.has(dateKey)) {
                        dailyMap.set(dateKey, metric[metricKey] || 0);
                    }
                });

                const labels: string[] = [];
                const values: number[] = [];

                dailyMap.forEach((val, key) => {
                    const date = new Date(key);
                    labels.push(days[date.getDay()]);
                    values.push(val);
                });

                return { labels, data: values };
            };

            const stepsData = processChartData('steps');
            const sleepData = processChartData('sleepHours');
            const hrData = processChartData('heartRate');
            const waterData = processChartData('waterIntake');

            // For exercise and weight, we still need to fetch from telemetry/vitals
            // since they're not in daily_health_metrics
            let exerciseData = { labels: stepsData.labels, data: Array(7).fill(0) };
            let weightData = { labels: stepsData.labels, data: Array(7).fill(0) };
            let bpSystolic = { labels: stepsData.labels, data: Array(7).fill(0) };
            let bpDiastolic = { labels: stepsData.labels, data: Array(7).fill(0) };

            // Fetch exercise from telemetry
            try {
                const exerciseRes: any = await deviceService.getTelemetry(userId, {
                    metricType: 'exercise',
                    startDate: startStr,
                    endDate: endStr,
                    limit: 100
                });
                if (exerciseRes?.data?.telemetry) {
                    const processedExercise = processVitalData(exerciseRes.data.telemetry, (item) => item.value?.minutes || item.reading?.minutes || 0);
                    exerciseData = processedExercise;
                }
            } catch (e) { }

            // Fetch weight from vitals
            try {
                const weightRes: any = await deviceService.getVitals(userId, {
                    vitalType: 'weight',
                    startDate: startStr,
                    endDate: endStr,
                    limit: 100
                });
                if (weightRes?.data?.vitals) {
                    const processedWeight = processVitalData(weightRes.data.vitals, (item) => item.reading?.kg || item.value?.kg || 0);
                    weightData = processedWeight;
                }
            } catch (e) { }

            // Fetch BP from vitals
            try {
                const bpRes: any = await deviceService.getVitals(userId, {
                    vitalType: 'blood_pressure',
                    startDate: startStr,
                    endDate: endStr,
                    limit: 100
                });
                if (bpRes?.data?.vitals) {
                    bpSystolic = processVitalData(bpRes.data.vitals, (item) => item.bloodPressureReading?.systolic || 0);
                    bpDiastolic = processVitalData(bpRes.data.vitals, (item) => item.bloodPressureReading?.diastolic || 0);
                }
            } catch (e) { }

            // Helper for processing telemetry/vitals data
            function processVitalData(items: any[], valueExtractor: (item: any) => number) {
                const dailyMap = new Map<string, number>();
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + i);
                    const dateKey = d.toISOString().split('T')[0];
                    dailyMap.set(dateKey, 0);
                }

                if (items && Array.isArray(items)) {
                    items.forEach((item: any) => {
                        const dateKey = new Date(item.timestamp || item.recordedAt).toISOString().split('T')[0];
                        if (dailyMap.has(dateKey)) {
                            const val = valueExtractor(item);
                            const currentMax = dailyMap.get(dateKey) || 0;
                            if (val > currentMax) {
                                dailyMap.set(dateKey, val);
                            }
                        }
                    });
                }

                const labels: string[] = [];
                const values: number[] = [];

                dailyMap.forEach((val, key) => {
                    const date = new Date(key);
                    labels.push(days[date.getDay()]);
                    values.push(val);
                });

                return { labels, data: values };
            }

            setData({
                steps: stepsData,
                sleep: sleepData,
                heartRate: hrData,
                weight: weightData,
                water: waterData,
                exercise: exerciseData,
                bp: {
                    labels: bpSystolic.labels,
                    data: bpSystolic.data,
                    dataDiastolic: bpDiastolic.data
                }
            });

        } catch (e) {
            console.error("Error loading charts", e);
        } finally {
            setLoading(false);
        }
    };

    const chartConfig = {
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        color: (opacity = 1) => colors.primary,
        strokeWidth: 2,
        barPercentage: 0.7,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => colors.text,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: colors.primary
        }
    };

    if (loading) return <ActivityIndicator size="small" color={colors.primary} />;

    const hasData = (d: any) => d.data.some((v: number) => v > 0);

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>Weekly Health Trends</Text>

            {/* Steps - Bar Chart */}
            {hasData(data.steps) && (
                <View style={styles.chartContainer}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>Steps</Text>
                    <BarChart
                        data={{
                            labels: data.steps.labels,
                            datasets: [{ data: data.steps.data }]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})` }}
                        style={styles.chart}
                        showValuesOnTopOfBars
                    />
                </View>
            )}

            {/* Heart Rate - Line Chart */}
            {hasData(data.heartRate) && (
                <View style={styles.chartContainer}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>Heart Rate (BPM)</Text>
                    <LineChart
                        data={{
                            labels: data.heartRate.labels,
                            datasets: [{ data: data.heartRate.data }]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})` }}
                        bezier
                        style={styles.chart}
                    />
                </View>
            )}

            {/* Water - Bar Chart */}
            {hasData(data.water) && (
                <View style={styles.chartContainer}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>Water Intake (Glasses)</Text>
                    <BarChart
                        data={{
                            labels: data.water.labels,
                            datasets: [{ data: data.water.data }]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})` }}
                        style={styles.chart}
                        showValuesOnTopOfBars
                    />
                </View>
            )}

            {/* Sleep - Bar Chart */}
            {hasData(data.sleep) && (
                <View style={styles.chartContainer}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>Sleep (Hours)</Text>
                    <BarChart
                        data={{
                            labels: data.sleep.labels,
                            datasets: [{ data: data.sleep.data }]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix="h"
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(103, 58, 183, ${opacity})` }}
                        style={styles.chart}
                        showValuesOnTopOfBars
                    />
                </View>
            )}

            {/* Weight - Line Chart */}
            {hasData(data.weight) && (
                <View style={styles.chartContainer}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>Weight (kg)</Text>
                    <LineChart
                        data={{
                            labels: data.weight.labels,
                            datasets: [{ data: data.weight.data }]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})` }}
                        bezier
                        style={styles.chart}
                    />
                </View>
            )}

            {/* Exercise - Bar Chart */}
            {hasData(data.exercise) && (
                <View style={styles.chartContainer}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>Exercise (Minutes)</Text>
                    <BarChart
                        data={{
                            labels: data.exercise.labels,
                            datasets: [{ data: data.exercise.data }]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix="m"
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})` }}
                        style={styles.chart}
                        showValuesOnTopOfBars
                    />
                </View>
            )}

            {/* BP Chart - Line Chart */}
            {hasData(data.bp) && (
                <View style={styles.chartContainer}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>Blood Pressure</Text>
                    <LineChart
                        data={{
                            labels: data.bp.labels,
                            datasets: [
                                { data: data.bp.data, color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})`, strokeWidth: 2 }, // Systolic
                                { data: data.bp.dataDiastolic, color: (opacity = 1) => `rgba(233, 30, 99, 0.5)`, strokeWidth: 2 } // Diastolic
                            ],
                            legend: ["Systolic", "Diastolic"]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})` }}
                        bezier
                        style={styles.chart}
                    />
                </View>
            )}

            {!hasData(data.steps) && !hasData(data.sleep) && !hasData(data.heartRate) && !hasData(data.water) &&
                <Text style={{ textAlign: 'center', color: colors.mutedText, marginTop: 20 }}>No data recorded this week.</Text>
            }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        paddingHorizontal: 0,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    chartContainer: {
        marginBottom: 30,
        alignItems: 'center'
    },
    chartTitle: {
        fontSize: 16,
        marginBottom: 10,
        alignSelf: 'flex-start',
        marginLeft: 20
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16
    }
});
