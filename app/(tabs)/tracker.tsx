import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

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

  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([
    {
      id: '1',
      name: 'Steps',
      value: 6847,
      unit: 'steps',
      target: 8000,
      icon: 'walk',
      color: colors.primary,
      trend: 'up',
      lastUpdated: '2 hours ago',
      history: [
        { date: '2024-12-09', value: 5200 },
        { date: '2024-12-10', value: 6100 },
        { date: '2024-12-11', value: 7300 },
        { date: '2024-12-12', value: 6847 }
      ]
    },
    {
      id: '2',
      name: 'Heart Rate',
      value: 72,
      unit: 'bpm',
      target: 75,
      icon: 'heart',
      color: colors.error,
      trend: 'stable',
      lastUpdated: '30 minutes ago',
      history: [
        { date: '2024-12-09', value: 74 },
        { date: '2024-12-10', value: 71 },
        { date: '2024-12-11', value: 73 },
        { date: '2024-12-12', value: 72 }
      ]
    },
    {
      id: '3',
      name: 'Sleep',
      value: 7.5,
      unit: 'hours',
      target: 8,
      icon: 'moon',
      color: colors.info,
      trend: 'up',
      lastUpdated: 'This morning',
      history: [
        { date: '2024-12-09', value: 6.8 },
        { date: '2024-12-10', value: 7.2 },
        { date: '2024-12-11', value: 7.8 },
        { date: '2024-12-12', value: 7.5 }
      ]
    },
    {
      id: '4',
      name: 'Water Intake',
      value: 6,
      unit: 'glasses',
      target: 8,
      icon: 'water',
      color: colors.info,
      trend: 'down',
      lastUpdated: '1 hour ago',
      history: [
        { date: '2024-12-09', value: 7 },
        { date: '2024-12-10', value: 8 },
        { date: '2024-12-11', value: 6 },
        { date: '2024-12-12', value: 6 }
      ]
    },
    {
      id: '5',
      name: 'Weight',
      value: 68.5,
      unit: 'kg',
      icon: 'fitness',
      color: colors.success,
      trend: 'stable',
      lastUpdated: 'Yesterday',
      history: [
        { date: '2024-12-09', value: 68.8 },
        { date: '2024-12-10', value: 68.6 },
        { date: '2024-12-11', value: 68.4 },
        { date: '2024-12-12', value: 68.5 }
      ]
    },
    {
      id: '6',
      name: 'Exercise',
      value: 45,
      unit: 'minutes',
      target: 60,
      icon: 'barbell',
      color: colors.warning,
      trend: 'up',
      lastUpdated: '3 hours ago',
      history: [
        { date: '2024-12-09', value: 30 },
        { date: '2024-12-10', value: 35 },
        { date: '2024-12-11', value: 40 },
        { date: '2024-12-12', value: 45 }
      ]
    }
  ]);

  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([
    {
      id: '1',
      name: 'Blood Pressure',
      systolic: 120,
      diastolic: 80,
      unit: 'mmHg',
      status: 'normal',
      timestamp: '2024-12-12 08:30',
      notes: 'Measured after morning walk'
    },
    {
      id: '2',
      name: 'Blood Sugar',
      value: 95,
      unit: 'mg/dL',
      status: 'normal',
      timestamp: '2024-12-12 07:45',
      notes: 'Fasting glucose level'
    },
    {
      id: '3',
      name: 'Temperature',
      value: 98.6,
      unit: '°F',
      status: 'normal',
      timestamp: '2024-12-12 09:00'
    },
    {
      id: '4',
      name: 'Oxygen Saturation',
      value: 98,
      unit: '%',
      status: 'normal',
      timestamp: '2024-12-12 08:45'
    }
  ]);

  const weeklyGoals = [
    { name: 'Steps', current: 45230, target: 56000, unit: 'steps' },
    { name: 'Exercise', current: 280, target: 420, unit: 'minutes' },
    { name: 'Sleep', current: 52.5, target: 56, unit: 'hours' },
    { name: 'Water', current: 42, target: 56, unit: 'glasses' }
  ];

  const addVitalSign = () => {
    if (newVital.type === 'blood_pressure' && (!newVital.systolic || !newVital.diastolic)) {
      Alert.alert('Error', 'Please enter both systolic and diastolic values.');
      return;
    }
    if (newVital.type !== 'blood_pressure' && !newVital.value) {
      Alert.alert('Error', 'Please enter a value.');
      return;
    }

    const vital: VitalSign = {
      id: Date.now().toString(),
      name: getVitalName(newVital.type),
      systolic: newVital.type === 'blood_pressure' ? parseInt(newVital.systolic) : undefined,
      diastolic: newVital.type === 'blood_pressure' ? parseInt(newVital.diastolic) : undefined,
      value: newVital.type !== 'blood_pressure' ? parseFloat(newVital.value) : undefined,
      unit: getVitalUnit(newVital.type),
      status: 'normal',
      timestamp: new Date().toISOString(),
      notes: newVital.notes
    };

    setVitalSigns(prev => [vital, ...prev]);
    setNewVital({ type: 'blood_pressure', systolic: '', diastolic: '', value: '', notes: '' });
    setShowVitalModal(false);
    Alert.alert('Success', 'Vital sign recorded successfully!');
  };

  const getVitalName = (type: string) => {
    switch (type) {
      case 'blood_pressure': return 'Blood Pressure';
      case 'blood_sugar': return 'Blood Sugar';
      case 'temperature': return 'Temperature';
      case 'oxygen': return 'Oxygen Saturation';
      default: return 'Unknown';
    }
  };

  const getVitalUnit = (type: string) => {
    switch (type) {
      case 'blood_pressure': return 'mmHg';
      case 'blood_sugar': return 'mg/dL';
      case 'temperature': return '°F';
      case 'oxygen': return '%';
      default: return '';
    }
  };

  const updateMetric = (metricId: string, newValue: number) => {
    setHealthMetrics(prev => prev.map(metric => {
      if (metric.id === metricId) {
        const today = new Date().toISOString().split('T')[0];
        const updatedHistory = [...metric.history];
        const todayIndex = updatedHistory.findIndex(h => h.date === today);

        if (todayIndex >= 0) {
          updatedHistory[todayIndex].value = newValue;
        } else {
          updatedHistory.push({ date: today, value: newValue });
        }

        return {
          ...metric,
          value: newValue,
          history: updatedHistory,
          lastUpdated: 'Just now'
        };
      }
      return metric;
    }));
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

  const quickLogWater = () => {
    const waterMetric = healthMetrics.find(m => m.name === 'Water Intake');
    if (waterMetric) {
      updateMetric(waterMetric.id, waterMetric.value + 1);
      Alert.alert('Water Logged', 'Added 1 glass of water to your daily intake!');
    }
  };

  const quickLogExercise = () => {
    Alert.alert(
      'Log Exercise',
      'How many minutes did you exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '15 min', onPress: () => {
            const exerciseMetric = healthMetrics.find(m => m.name === 'Exercise');
            if (exerciseMetric) updateMetric(exerciseMetric.id, exerciseMetric.value + 15);
          }
        },
        {
          text: '30 min', onPress: () => {
            const exerciseMetric = healthMetrics.find(m => m.name === 'Exercise');
            if (exerciseMetric) updateMetric(exerciseMetric.id, exerciseMetric.value + 30);
          }
        },
        {
          text: '60 min', onPress: () => {
            const exerciseMetric = healthMetrics.find(m => m.name === 'Exercise');
            if (exerciseMetric) updateMetric(exerciseMetric.id, exerciseMetric.value + 60);
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Health Tracker</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>Monitor your daily health metrics</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowVitalModal(true)}
          >
            <Ionicons name="add" size={24} color={colors.buttonText} />
          </TouchableOpacity>
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
                style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}
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

                {metric.target && (
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
        </View>

        {/* Weekly Goals */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Goals</Text>
          <View style={[styles.goalsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {weeklyGoals.map((goal, index) => (
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
                  {goal.current} / {goal.target} {goal.unit}
                </Text>
              </View>
            ))}
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
                {selectedMetric.target && (
                  <Text style={[styles.detailTarget, { color: colors.mutedText }]}>
                    Target: {selectedMetric.target} {selectedMetric.unit}
                  </Text>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>7-Day History</Text>
                <View style={styles.historyChart}>
                  {selectedMetric.history.slice(-7).map((entry, index) => (
                    <View key={index} style={styles.historyBar}>
                      <View
                        style={[
                          styles.historyBarFill,
                          {
                            height: `${(entry.value / Math.max(...selectedMetric.history.map(h => h.value))) * 100}%`,
                            backgroundColor: selectedMetric.color
                          }
                        ]}
                      />
                      <Text style={[styles.historyDate, { color: colors.mutedText }]}>
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text style={[styles.historyValue, { color: colors.mutedText }]}>{entry.value}</Text>
                    </View>
                  ))}
                </View>
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
  },
  metricCard: {
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
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
});