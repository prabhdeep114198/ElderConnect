import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { HealthCharts } from "../../components/HealthCharts";
import { ResponsiveView } from "../../components/ResponsiveView";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { deviceService } from "../../services/api/device";
import { profileService } from "../../services/api/profile";

const { width } = Dimensions.get('window');

interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  history: { date: string; value: number }[];
}

interface VitalSign {
  id: string;
  name: string;
  systolic?: number;
  diastolic?: number;
  value?: number;
  unit: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  timestamp: string;
  notes?: string;
}

export default function HealthTrackerScreen() {
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const { isWeb, contentWidth } = useResponsive();
  const effectiveWidth = isWeb ? contentWidth : width;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [newVital, setNewVital] = useState({
    type: 'blood_pressure',
    systolic: '',
    diastolic: '',
    value: '',
    notes: ''
  });


  const loadHealthData = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // Last 7 days inclusive

      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();

      // 1. Fetch Aggregated Daily Metrics (Source of Truth for Steps, HR, Sleep, Water)
      let dailyMetricsData: any[] = [];
      try {
        const metricsRes: any = await profileService.getMetricsRange(user.id, startStr, endStr);
        dailyMetricsData = metricsRes?.data?.metrics || [];
      } catch (e) {
        console.log("Error fetching daily metrics range:", e);
      }

      // Helper to get history from daily metrics
      const getHistoryFromDaily = (key: string) => {
        const historyMap = dailyMetricsData.map(d => ({
          date: d.date,
          value: Number(d[key]) || 0
        }));

        // Ensure 7 days
        const fullHistory = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const found = historyMap.find(h => new Date(h.date).toISOString().split('T')[0] === dateStr);
          fullHistory.push({ date: d.toISOString(), value: found ? found.value : 0 });
        }
        return fullHistory;
      };

      // Helper to get latest value from daily metrics
      const getLatestFromDaily = (key: string) => {
        if (dailyMetricsData.length === 0) return 0;
        // Sort by date descending
        const sorted = [...dailyMetricsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return Number(sorted[0][key]) || 0;
      };

      // 2. Define Fetch Logic for Other Metrics (Exercise, Weight) via Telemetry/Vitals
      const fetchRawMetric = async (metricName: string, type: 'telemetry' | 'vital', typeName: string, extractor: (i: any) => number) => {
        let items = [];
        try {
          if (type === 'telemetry') {
            const res: any = await deviceService.getTelemetry(user.id, { metricType: typeName, startDate: startStr, endDate: endStr, limit: 100 });
            if (res.data?.data?.telemetry) items = res.data.data.telemetry;
          } else {
            const res: any = await deviceService.getVitals(user.id, { vitalType: typeName, startDate: startStr, endDate: endStr, limit: 100 });
            if (res.data?.data?.vitals) items = res.data.data.vitals;
          }
        } catch (e) {
          console.log(`Error fetching ${metricName}`, e);
        }

        // Process raw items into daily history
        const dailyMap = new Map<string, number>();
        // Initialize 0s
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          dailyMap.set(d.toISOString().split('T')[0], 0);
        }

        if (items && Array.isArray(items)) {
          items.forEach((item: any) => {
            const dKey = new Date(item.timestamp || item.recordedAt).toISOString().split('T')[0];
            if (dailyMap.has(dKey)) {
              const val = extractor(item);
              const curr = dailyMap.get(dKey) || 0;
              if (metricName === 'Exercise') {
                dailyMap.set(dKey, curr + val); // Sum for exercise
              } else {
                if (val > curr) dailyMap.set(dKey, val); // Max for weight
              }
            }
          });
        }

        const history = Array.from(dailyMap.entries())
          .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
          .map(([date, value]) => ({ date, value }));

        const latest = history[history.length - 1]?.value || 0;
        return { history, latest };
      };

      const exerciseData = await fetchRawMetric('Exercise', 'telemetry', 'exercise', (i) => i.value?.minutes || i.reading?.minutes || 0);
      const weightData = await fetchRawMetric('Weight', 'vital', 'weight', (i) => i.value?.kg || i.reading?.kg || 0);

      // 3. Construct the HealthMetrics State
      const metricsMap = [
        {
          id: '1', name: 'Steps', unit: 'steps', target: 8000, icon: 'walk', color: colors.primary,
          history: getHistoryFromDaily('steps'), value: getLatestFromDaily('steps')
        },
        {
          id: '2', name: 'Heart Rate', unit: 'bpm', target: 75, icon: 'heart', color: colors.error,
          history: getHistoryFromDaily('heartRate'), value: getLatestFromDaily('heartRate')
        },
        {
          id: '3', name: 'Sleep', unit: 'hours', target: 8, icon: 'moon', color: colors.info,
          history: getHistoryFromDaily('sleepHours'), value: getLatestFromDaily('sleepHours')
        },
        {
          id: '4', name: 'Water Intake', unit: 'glasses', target: 8, icon: 'water', color: colors.info,
          history: getHistoryFromDaily('waterIntake'), value: getLatestFromDaily('waterIntake')
        },
        {
          id: '5', name: 'Weight', unit: 'kg', target: 0, icon: 'fitness', color: colors.success,
          history: weightData.history, value: weightData.latest
        },
        {
          id: '6', name: 'Exercise', unit: 'minutes', target: 60, icon: 'barbell', color: colors.warning,
          history: exerciseData.history, value: exerciseData.latest
        }
      ];

      const updatedMetrics: HealthMetric[] = metricsMap.map(m => {
        const hist = m.history.map(h => h.value);
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (hist.length >= 3) {
          const last3 = hist.slice(-3);
          if (last3[2] > last3[1] && last3[1] > last3[0]) trend = 'up';
          else if (last3[2] < last3[1] && last3[1] < last3[0]) trend = 'down';
        }

        return {
          id: m.id,
          name: m.name,
          value: m.value,
          unit: m.unit,
          target: m.target,
          icon: m.icon as any,
          color: m.color,
          trend,
          history: m.history,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      });

      console.log('📊 Loaded Real DB Health Metrics');
      setHealthMetrics(updatedMetrics);

      // 4. Fetch Recent Vitals
      const vitalsResponse: any = await deviceService.getVitals(user.id, { limit: 50 });
      const backendVitals = vitalsResponse?.data?.vitals || [];
      const mappedVitals = backendVitals.map((v: any) => ({
        id: v.id,
        name: getVitalName(v.vitalType),
        systolic: v.reading?.systolic,
        diastolic: v.reading?.diastolic,
        value: v.vitalType !== 'blood_pressure' ? extractNumericReading(v) : undefined,
        unit: getVitalUnit(v.vitalType),
        status: v.isAbnormal ? 'high' : 'normal',
        timestamp: v.recordedAt,
        notes: v.notes
      }));
      setVitalSigns(mappedVitals);

      // 5. Calculate Weekly Goals
      const sumHistory = (metricName: string) => {
        const m = updatedMetrics.find(x => x.name === metricName);
        if (!m) return 0;
        return m.history.reduce((acc, curr) => acc + curr.value, 0);
      };

      const newGoals = [
        { name: 'Steps', current: sumHistory('Steps'), target: 56000, unit: 'steps' },
        { name: 'Exercise', current: sumHistory('Exercise'), target: 420, unit: 'minutes' },
        { name: 'Sleep', current: sumHistory('Sleep'), target: 56, unit: 'hours' },
        { name: 'Water', current: sumHistory('Water Intake'), target: 56, unit: 'glasses' }
      ];

      console.log('🎯 Weekly Goals Calculated from DB History');
      setWeeklyGoals(newGoals);

    } catch (error) {
      console.error("Failed to load health data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  const extractNumericReading = (v: any) => {
    const data = v.reading || v.value;
    if (!data) return 0;

    // Telemetry uses 'value' directly if it's a number, or a nested object
    if (typeof data === 'number') return data;

    return data.bpm || data.fahrenheit || data.celsius || data.mgdl ||
      data.percentage || data.value || data.kg || data.lbs ||
      data.steps || data.hours || data.minutes || 0;
  };

  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([
    {
      id: '1',
      name: 'Steps',
      value: 0,
      unit: 'steps',
      target: 8000,
      icon: 'walk',
      color: colors.primary,
      trend: 'stable',
      lastUpdated: '--',
      history: []
    },
    {
      id: '2',
      name: 'Heart Rate',
      value: 0,
      unit: 'bpm',
      target: 75,
      icon: 'heart',
      color: colors.error,
      trend: 'stable',
      lastUpdated: '--',
      history: []
    },
    {
      id: '3',
      name: 'Sleep',
      value: 0,
      unit: 'hours',
      target: 8,
      icon: 'moon',
      color: colors.info,
      trend: 'stable',
      lastUpdated: '--',
      history: []
    },
    {
      id: '4',
      name: 'Water Intake',
      value: 0,
      unit: 'glasses',
      target: 8,
      icon: 'water',
      color: colors.info,
      trend: 'stable',
      lastUpdated: '--',
      history: []
    },
    {
      id: '5',
      name: 'Weight',
      value: 0,
      unit: 'kg',
      target: 0,
      icon: 'fitness',
      color: colors.success,
      trend: 'stable',
      lastUpdated: '--',
      history: []
    },
    {
      id: '6',
      name: 'Exercise',
      value: 0,
      unit: 'minutes',
      target: 60,
      icon: 'barbell',
      color: colors.warning,
      trend: 'stable',
      lastUpdated: '--',
      history: []
    }
  ]);

  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);

  const [weeklyGoals, setWeeklyGoals] = useState([
    { name: 'Steps', current: 0, target: 56000, unit: 'steps' },
    { name: 'Exercise', current: 0, target: 420, unit: 'minutes' },
    { name: 'Sleep', current: 0, target: 56, unit: 'hours' },
    { name: 'Water', current: 0, target: 56, unit: 'glasses' }
  ]);


  const addVitalSign = async () => {
    if (!user?.id) return;

    if (newVital.type === 'blood_pressure' && (!newVital.systolic || !newVital.diastolic)) {
      Alert.alert('Error', 'Please enter both systolic and diastolic values.');
      return;
    }
    if (newVital.type !== 'blood_pressure' && !newVital.value) {
      Alert.alert('Error', 'Please enter a value.');
      return;
    }

    try {
      const payload: any = {
        vitalType: newVital.type,
        recordedAt: new Date().toISOString(),
        recordedBy: 'manual',
        notes: newVital.notes,
        reading: {}
      };

      if (newVital.type === 'blood_pressure') {
        payload.reading = {
          systolic: parseInt(newVital.systolic),
          diastolic: parseInt(newVital.diastolic)
        };
        payload.unit = 'mmHg';
      } else {
        switch (newVital.type) {
          case 'heart_rate':
            payload.reading = { bpm: parseInt(newVital.value) };
            payload.unit = 'bpm';
            break;
          case 'temperature':
            payload.reading = { fahrenheit: parseFloat(newVital.value) };
            payload.unit = '°F';
            break;
          case 'blood_sugar':
            payload.reading = { mgdl: parseInt(newVital.value) };
            payload.unit = 'mg/dL';
            break;
          case 'oxygen':
            payload.vitalType = 'oxygen_saturation';
            payload.reading = { percentage: parseInt(newVital.value) };
            payload.unit = '%';
            break;
        }
      }

      await deviceService.recordVitals(user.id, payload);

      Alert.alert('Success', 'Vital sign recorded successfully!');
      setShowVitalModal(false);
      setNewVital({ type: 'blood_pressure', systolic: '', diastolic: '', value: '', notes: '' });
      loadHealthData();
    } catch (error) {
      console.error("Failed to record vitals", error);
      Alert.alert('Error', 'Failed to save vital sign. Please try again.');
    }
  };

  const getVitalName = (type: string) => {
    switch (type) {
      case 'blood_pressure': return 'Blood Pressure';
      case 'blood_sugar': return 'Blood Sugar';
      case 'temperature': return 'Temperature';
      case 'oxygen':
      case 'oxygen_saturation': return 'Oxygen Saturation';
      case 'heart_rate': return 'Heart Rate';
      case 'weight': return 'Weight';
      default: return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getVitalUnit = (type: string) => {
    switch (type) {
      case 'blood_pressure': return 'mmHg';
      case 'blood_sugar': return 'mg/dL';
      case 'temperature': return '°F';
      case 'oxygen':
      case 'oxygen_saturation': return '%';
      case 'heart_rate': return 'bpm';
      case 'weight': return 'kg';
      case 'steps': return 'steps';
      case 'exercise': return 'min';
      case 'water': return 'glasses';
      case 'sleep': return 'hours';
      default: return '';
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return colors.success;
      case 'high': return colors.warning;
      case 'low': return colors.info;
      case 'critical': return colors.error;
      default: return colors.mutedText;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return colors.success;
      case 'down': return colors.error;
      default: return colors.mutedText;
    }
  };

  const getProgressPercentage = (current: number, target?: number) => {
    if (!target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const showMetricDetails = (metric: HealthMetric) => {
    setSelectedMetric(metric);
  };

  const quickLogWater = async () => {
    const waterMetric = healthMetrics.find(m => m.name === 'Water Intake');
    if (waterMetric && user?.id) {
      try {
        await deviceService.recordVitals(user.id, {
          vitalType: 'water',
          recordedAt: new Date().toISOString(),
          recordedBy: 'manual',
          reading: { value: waterMetric.value + 1 }
        });
        loadHealthData();
        Alert.alert('Water Logged', 'Added 1 glass of water to your daily intake!');
      } catch (e) {
        console.error("Failed to log water", e);
      }
    }
  };

  const quickLogExercise = () => {
    Alert.alert(
      'Log Exercise',
      'How many minutes did you exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '15 min', onPress: async () => {
            const exerciseMetric = healthMetrics.find(m => m.name === 'Exercise');
            if (exerciseMetric && user?.id) {
              await deviceService.recordVitals(user.id, {
                vitalType: 'exercise',
                recordedAt: new Date().toISOString(),
                recordedBy: 'manual',
                reading: { value: exerciseMetric.value + 15 }
              });
              loadHealthData();
            }
          }
        },
        {
          text: '30 min', onPress: async () => {
            const exerciseMetric = healthMetrics.find(m => m.name === 'Exercise');
            if (exerciseMetric && user?.id) {
              await deviceService.recordVitals(user.id, {
                vitalType: 'exercise',
                recordedAt: new Date().toISOString(),
                recordedBy: 'manual',
                reading: { value: exerciseMetric.value + 30 }
              });
              loadHealthData();
            }
          }
        },
        {
          text: '60 min', onPress: async () => {
            const exerciseMetric = healthMetrics.find(m => m.name === 'Exercise');
            if (exerciseMetric && user?.id) {
              await deviceService.recordVitals(user.id, {
                vitalType: 'exercise',
                recordedAt: new Date().toISOString(),
                recordedBy: 'manual',
                reading: { value: exerciseMetric.value + 60 }
              });
              loadHealthData();
            }
          }
        }
      ]
    );
  };

  const seedSampleData = async () => {
    if (!user?.id) return;

    try {
      Alert.alert('Seed Data', 'Generating 7 days of sample health data...');
      const response: any = await profileService.updateHealthMetric(user.id, {
        type: 'steps',
        value: 0
      });

      // Call the seed endpoint via a POST request
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v1/users/${user.id}/health/seed?days=7`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      Alert.alert('Success', 'Sample data created! Pull down to refresh.');
      loadHealthData();
    } catch (error) {
      console.error('Failed to seed data', error);
      Alert.alert('Error', 'Failed to create sample data');
    }
  };


  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>Loading health data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadHealthData(true)} />
        }
      >
        <ResponsiveView style={styles.responsiveContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>Health Tracker</Text>
              <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#E5E5EA' : colors.mutedText }]}>Monitor your daily health metrics</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.info }]}
                onPress={seedSampleData}
              >
                <Ionicons name="flask" size={20} color={colors.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowVitalModal(true)}
              >
                <Ionicons name="add" size={24} color={colors.buttonText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Log</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={quickLogWater}>
                <Ionicons name="water" size={24} color={colors.info} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Log Water</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={quickLogExercise}>
                <Ionicons name="barbell" size={24} color={colors.warning} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Log Exercise</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowVitalModal(true)}>
                <Ionicons name="heart" size={24} color={colors.error} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Log Vitals</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Metrics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today&apos;s Metrics</Text>
            <View style={styles.metricsGrid}>
              {healthMetrics.map((metric) => (
                <TouchableOpacity
                  key={metric.id}
                  style={[
                    styles.metricCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isWeb && { width: '48%', marginBottom: 16 }
                  ]}
                  onPress={() => showMetricDetails(metric)}
                >
                  <View style={styles.metricHeader}>
                    <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
                      <Ionicons name={metric.icon as any} size={20} color={metric.color} />
                    </View>
                    <View style={styles.metricTrend}>
                      <Ionicons
                        name={getTrendIcon(metric.trend)}
                        size={16}
                        color={getTrendColor(metric.trend)}
                      />
                    </View>
                  </View>

                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {metric.value} {metric.unit}
                  </Text>
                  <Text style={[styles.metricName, { color: colors.mutedText }]}>{metric.name}</Text>

                  {!!metric.target && (
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${getProgressPercentage(metric.value, metric.target)}%`,
                              backgroundColor: metric.color
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressText, { color: colors.mutedText }]}>
                        {Math.round(getProgressPercentage(metric.value, metric.target))}% of goal
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.metricLastUpdated, { color: colors.mutedText }]}>{metric.lastUpdated}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Charts for specific metrics */}
            <HealthCharts userId={user?.id || ''} />
          </View>

          {/* Weekly Goals */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Goals</Text>
            <View style={[styles.goalsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {weeklyGoals.map((goal, index) => {
                // Get the corresponding metric to access history
                const metric = healthMetrics.find(m => m.name === goal.name ||
                  (goal.name === 'Water' && m.name === 'Water Intake'));
                const hasHistory = metric && metric.history && metric.history.length > 0;

                return (
                  <View key={index} style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                      <Text style={[styles.goalPercentage, { color: colors.primary }]}>
                        {Math.round((goal.current / goal.target) * 100)}%
                      </Text>
                    </View>

                    <View style={styles.goalProgress}>
                      <View style={[styles.goalProgressBar, { backgroundColor: colors.background }]}>
                        <View
                          style={[
                            styles.goalProgressFill,
                            {
                              width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
                              backgroundColor: (goal.current / goal.target) >= 0.8 ? colors.success : colors.warning
                            }
                          ]}
                        />
                      </View>
                    </View>

                    <Text style={[styles.goalText, { color: colors.mutedText }]}>
                      {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                    </Text>

                    {/* Mini 7-day breakdown chart */}
                    {hasHistory && (
                      <View style={styles.miniChartContainer}>
                        <Text style={[styles.miniChartTitle, { color: colors.mutedText }]}>Daily Breakdown</Text>
                        <View style={styles.miniChart}>
                          {metric.history.slice(-7).map((entry, idx) => {
                            const maxValue = Math.max(...metric.history.slice(-7).map(h => h.value), 1);
                            const heightPercent = (entry.value / maxValue) * 100;
                            return (
                              <View key={idx} style={styles.miniBar}>
                                <View style={styles.miniBarContainer}>
                                  <View
                                    style={[
                                      styles.miniBarFill,
                                      {
                                        height: `${heightPercent}%`,
                                        backgroundColor: metric.color
                                      }
                                    ]}
                                  />
                                </View>
                                <Text style={[styles.miniBarLabel, { color: colors.mutedText }]}>
                                  {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recent Vital Signs */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Vital Signs</Text>
            <View style={[styles.vitalsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {vitalSigns.slice(0, 4).map((vital) => (
                <View key={vital.id} style={[styles.vitalCard, { borderBottomColor: colors.border }]}>
                  <View style={styles.vitalHeader}>
                    <Text style={[styles.vitalName, { color: colors.text }]}>{vital.name}</Text>
                    <View style={[styles.vitalStatus, { backgroundColor: getStatusColor(vital.status) }]}>
                      <Text style={styles.vitalStatusText}>{vital.status}</Text>
                    </View>
                  </View>

                  <Text style={[styles.vitalValue, { color: colors.text }]}>
                    {vital.systolic && vital.diastolic
                      ? `${vital.systolic}/${vital.diastolic}`
                      : vital.value
                    } {vital.unit}
                  </Text>

                  <Text style={[styles.vitalTimestamp, { color: colors.mutedText }]}>
                    {new Date(vital.timestamp).toLocaleString()}
                  </Text>

                  {vital.notes && (
                    <Text style={[styles.vitalNotes, { color: colors.mutedText }]}>{vital.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Health Insights */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Insights</Text>
            <View style={[styles.insightsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.insightCard}>
                <View style={[styles.insightIcon, { backgroundColor: colors.background }]}>
                  <Ionicons name="trending-up" size={20} color={colors.success} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Great Progress!</Text>
                  <Text style={[styles.insightText, { color: colors.mutedText }]}>
                    Your sleep quality has improved by 15% this week. Keep up the good work!
                  </Text>
                </View>
              </View>

              <View style={styles.insightCard}>
                <View style={[styles.insightIcon, { backgroundColor: colors.background }]}>
                  <Ionicons name="water" size={20} color={colors.info} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Stay Hydrated</Text>
                  <Text style={[styles.insightText, { color: colors.mutedText }]}>
                    You&apos;re 2 glasses short of your daily water goal. Try setting hourly reminders.
                  </Text>
                </View>
              </View>

              <View style={styles.insightCard}>
                <View style={[styles.insightIcon, { backgroundColor: colors.background }]}>
                  <Ionicons name="walk" size={20} color={colors.primary} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Almost There!</Text>
                  <Text style={[styles.insightText, { color: colors.mutedText }]}>
                    You need 1,153 more steps to reach your daily goal. A 10-minute walk should do it!
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ResponsiveView>
      </ScrollView>

      {/* Add Vital Sign Modal */}
      <Modal
        visible={showVitalModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Log Vital Sign</Text>
            <TouchableOpacity onPress={() => setShowVitalModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Vital Sign Type</Text>
              <View style={styles.typeSelector}>
                {[
                  { key: 'blood_pressure', label: 'Blood Pressure' },
                  { key: 'blood_sugar', label: 'Blood Sugar' },
                  { key: 'temperature', label: 'Temperature' },
                  { key: 'oxygen', label: 'Oxygen Saturation' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      newVital.type === type.key && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setNewVital(prev => ({ ...prev, type: type.key }))}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      { color: colors.text },
                      newVital.type === type.key && { color: colors.buttonText }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {newVital.type === 'blood_pressure' ? (
              <View style={styles.bpContainer}>
                <View style={styles.bpInput}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Systolic</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                    value={newVital.systolic}
                    onChangeText={(text) => setNewVital(prev => ({ ...prev, systolic: text }))}
                    placeholder="120"
                    keyboardType="numeric"
                    placeholderTextColor={colors.mutedText}
                  />
                </View>
                <Text style={[styles.bpSeparator, { color: colors.text }]}>/</Text>
                <View style={styles.bpInput}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Diastolic</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                    value={newVital.diastolic}
                    onChangeText={(text) => setNewVital(prev => ({ ...prev, diastolic: text }))}
                    placeholder="80"
                    keyboardType="numeric"
                    placeholderTextColor={colors.mutedText}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Value ({getVitalUnit(newVital.type)})
                </Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                  value={newVital.value}
                  onChangeText={(text) => setNewVital(prev => ({ ...prev, value: text }))}
                  placeholder={
                    newVital.type === 'blood_sugar' ? '95' :
                      newVital.type === 'temperature' ? '98.6' :
                        newVital.type === 'oxygen' ? '98' : ''
                  }
                  keyboardType="numeric"
                  placeholderTextColor={colors.mutedText}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newVital.notes}
                onChangeText={(text) => setNewVital(prev => ({ ...prev, notes: text }))}
                placeholder="Any additional notes..."
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={[styles.addVitalButton, { backgroundColor: colors.primary }]} onPress={addVitalSign}>
              <Text style={[styles.addVitalButtonText, { color: colors.buttonText }]}>Log Vital Sign</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Metric Details Modal */}
      <Modal
        visible={!!selectedMetric}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedMetric && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedMetric.name} Details</Text>
              <TouchableOpacity onPress={() => setSelectedMetric(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>Current Value</Text>
                <Text style={[styles.detailValue, { color: colors.primary }]}>
                  {selectedMetric.value} {selectedMetric.unit}
                </Text>
                {!!selectedMetric.target && (
                  <Text style={[styles.detailTarget, { color: colors.mutedText }]}>
                    Target: {selectedMetric.target} {selectedMetric.unit}
                  </Text>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>7-Day History</Text>
                {selectedMetric.history.length > 0 ? (
                  <View style={{ marginTop: 12 }}>
                    {selectedMetric.history.slice(-7).map((entry, index) => (
                      <View key={index} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.historyItemDate, { color: colors.text }]}>
                          {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </Text>
                        <Text style={[styles.historyItemValue, { color: colors.primary }]}>
                          {entry.value} {selectedMetric.unit}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.detailTarget, { color: colors.mutedText, marginTop: 8 }]}>
                    No history data available
                  </Text>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>Trend Analysis</Text>
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={getTrendIcon(selectedMetric.trend)}
                    size={24}
                    color={getTrendColor(selectedMetric.trend)}
                  />
                  <Text style={[styles.trendText, { color: colors.text }]}>
                    {selectedMetric.trend === 'up' ? 'Increasing trend' :
                      selectedMetric.trend === 'down' ? 'Decreasing trend' : 'Stable trend'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  responsiveContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  metricCard: {
    width: '48%', // Flexible for mobile/web
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 0, // Handled by gap
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTrend: {
    padding: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricName: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
  },
  metricLastUpdated: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  goalsContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  goalCard: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalProgress: {
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 12,
  },
  vitalsContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  vitalCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  vitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vitalName: {
    fontSize: 16,
    fontWeight: '600',
  },
  vitalStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vitalStatusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vitalTimestamp: {
    fontSize: 12,
    marginBottom: 4,
  },
  vitalNotes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  insightsContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectedType: {
    // handled inline
  },
  typeButtonText: {
    fontSize: 12,
  },
  selectedTypeText: {
    color: 'white',
  },
  bpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  bpInput: {
    flex: 1,
  },
  bpSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addVitalButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addVitalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailTarget: {
    fontSize: 14,
  },
  historyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 8,
  },
  historyBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  historyBarFill: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 10,
    marginBottom: 2,
  },
  historyValue: {
    fontSize: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    marginLeft: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyItemDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  miniChartContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  miniChartTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  miniChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
    paddingHorizontal: 4,
  },
  miniBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  miniBarContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  miniBarFill: {
    width: '80%',
    borderRadius: 2,
    minHeight: 2,
  },
  miniBarLabel: {
    fontSize: 9,
    marginTop: 4,
  },
});