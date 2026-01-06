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
import { HealthMetric, useHealth, VitalSign } from "../../context/HealthContext";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get('window');

export default function HealthTrackerScreen() {
  const { colors, theme } = useTheme();
  const { healthMetrics, vitalSigns, weeklyGoals, updateMetric, addVitalSign: addVitalContext } = useHealth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [newVital, setNewVital] = useState({
    type: 'blood_pressure',
    systolic: '',
    diastolic: '',
    value: '',
    notes: ''
  });

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

    addVitalContext(vital);
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
    setEditValue(metric.value.toString());
  };

  const handleUpdateMetric = () => {
    if (selectedMetric && editValue) {
      const val = parseFloat(editValue);
      if (!isNaN(val)) {
        updateMetric(selectedMetric.id, val);
        setSelectedMetric(null);
        Alert.alert('Success', 'Metric updated!');
      } else {
        Alert.alert('Error', 'Please enter a valid number');
      }
    }
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

                {/* Manual Update Input */}
                <View style={{ marginTop: 10, marginBottom: 10 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Update Value</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          flex: 1,
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                          marginRight: 10
                        }
                      ]}
                      value={editValue}
                      onChangeText={setEditValue}
                      keyboardType="numeric"
                      placeholder="Enter new value"
                      placeholderTextColor={colors.mutedText}
                    />
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.primary,
                        padding: 12,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      onPress={handleUpdateMetric}
                    >
                      <Text style={{ color: colors.buttonText, fontWeight: 'bold' }}>Update</Text>
                    </TouchableOpacity>
                  </View>
                </View>

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