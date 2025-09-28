import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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
import { Colors } from "../../constants/colors";

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
      color: Colors.primary,
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
      color: Colors.error,
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
      color: Colors.info,
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
      color: Colors.info,
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
      color: Colors.success,
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
      color: Colors.warning,
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
      case 'normal': return Colors.success;
      case 'high': return Colors.warning;
      case 'low': return Colors.info;
      case 'critical': return Colors.error;
      default: return Colors.mutedText;
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
      case 'up': return Colors.success;
      case 'down': return Colors.error;
      default: return Colors.mutedText;
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
        { text: '15 min', onPress: () => {
          const exerciseMetric = healthMetrics.find(m => m.name === 'Exercise');
          if (exerciseMetric) updateMetric(exerciseMetric.id, exerciseMetric.value + 15);
        }},
        { text: '30 min', onPress: () => {
          const exerciseMetric = healthMetrics.find(m => m.name === 'Exercise');
          if (exerciseMetric) updateMetric(exerciseMetric.id, exerciseMetric.value + 30);
        }},
        { text: '60 min', onPress: () => {
          const exerciseMetric = healthMetrics.find(m => m.name === 'Exercise');
          if (exerciseMetric) updateMetric(exerciseMetric.id, exerciseMetric.value + 60);
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Health Tracker</Text>
            <Text style={styles.headerSubtitle}>Monitor your daily health metrics</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowVitalModal(true)}
          >
            <Ionicons name="add" size={24} color={Colors.buttonText} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Log</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton} onPress={quickLogWater}>
              <Ionicons name="water" size={24} color={Colors.info} />
              <Text style={styles.quickActionText}>Log Water</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton} onPress={quickLogExercise}>
              <Ionicons name="barbell" size={24} color={Colors.warning} />
              <Text style={styles.quickActionText}>Log Exercise</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton} onPress={() => setShowVitalModal(true)}>
              <Ionicons name="heart" size={24} color={Colors.error} />
              <Text style={styles.quickActionText}>Log Vitals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Metrics</Text>
          <View style={styles.metricsGrid}>
            {healthMetrics.map((metric) => (
              <TouchableOpacity
                key={metric.id}
                style={styles.metricCard}
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
                
                <Text style={styles.metricValue}>
                  {metric.value} {metric.unit}
                </Text>
                <Text style={styles.metricName}>{metric.name}</Text>
                
                {metric.target && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
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
                    <Text style={styles.progressText}>
                      {Math.round(getProgressPercentage(metric.value, metric.target))}% of goal
                    </Text>
                  </View>
                )}
                
                <Text style={styles.metricLastUpdated}>{metric.lastUpdated}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Goals</Text>
          <View style={styles.goalsContainer}>
            {weeklyGoals.map((goal, index) => (
              <View key={index} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalPercentage}>
                    {Math.round((goal.current / goal.target) * 100)}%
                  </Text>
                </View>
                
                <View style={styles.goalProgress}>
                  <View style={styles.goalProgressBar}>
                    <View 
                      style={[
                        styles.goalProgressFill, 
                        { 
                          width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
                          backgroundColor: (goal.current / goal.target) >= 0.8 ? Colors.success : Colors.warning
                        }
                      ]} 
                    />
                  </View>
                </View>
                
                <Text style={styles.goalText}>
                  {goal.current} / {goal.target} {goal.unit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Vital Signs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Vital Signs</Text>
          <View style={styles.vitalsContainer}>
            {vitalSigns.slice(0, 4).map((vital) => (
              <View key={vital.id} style={styles.vitalCard}>
                <View style={styles.vitalHeader}>
                  <Text style={styles.vitalName}>{vital.name}</Text>
                  <View style={[styles.vitalStatus, { backgroundColor: getStatusColor(vital.status) }]}>
                    <Text style={styles.vitalStatusText}>{vital.status}</Text>
                  </View>
                </View>
                
                <Text style={styles.vitalValue}>
                  {vital.systolic && vital.diastolic 
                    ? `${vital.systolic}/${vital.diastolic}` 
                    : vital.value
                  } {vital.unit}
                </Text>
                
                <Text style={styles.vitalTimestamp}>
                  {new Date(vital.timestamp).toLocaleString()}
                </Text>
                
                {vital.notes && (
                  <Text style={styles.vitalNotes}>{vital.notes}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Health Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Insights</Text>
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons name="trending-up" size={20} color={Colors.success} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Great Progress!</Text>
                <Text style={styles.insightText}>
                  Your sleep quality has improved by 15% this week. Keep up the good work!
                </Text>
              </View>
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons name="water" size={20} color={Colors.info} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Stay Hydrated</Text>
                <Text style={styles.insightText}>
                  You're 2 glasses short of your daily water goal. Try setting hourly reminders.
                </Text>
              </View>
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons name="walk" size={20} color={Colors.primary} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Almost There!</Text>
                <Text style={styles.insightText}>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Vital Sign</Text>
            <TouchableOpacity onPress={() => setShowVitalModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vital Sign Type</Text>
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
                      newVital.type === type.key && styles.selectedType
                    ]}
                    onPress={() => setNewVital(prev => ({ ...prev, type: type.key }))}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      newVital.type === type.key && styles.selectedTypeText
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
                  <Text style={styles.inputLabel}>Systolic</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newVital.systolic}
                    onChangeText={(text) => setNewVital(prev => ({ ...prev, systolic: text }))}
                    placeholder="120"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.mutedText}
                  />
                </View>
                <Text style={styles.bpSeparator}>/</Text>
                <View style={styles.bpInput}>
                  <Text style={styles.inputLabel}>Diastolic</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newVital.diastolic}
                    onChangeText={(text) => setNewVital(prev => ({ ...prev, diastolic: text }))}
                    placeholder="80"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.mutedText}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Value ({getVitalUnit(newVital.type)})
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={newVital.value}
                  onChangeText={(text) => setNewVital(prev => ({ ...prev, value: text }))}
                  placeholder={
                    newVital.type === 'blood_sugar' ? '95' :
                    newVital.type === 'temperature' ? '98.6' :
                    newVital.type === 'oxygen' ? '98' : ''
                  }
                  keyboardType="numeric"
                  placeholderTextColor={Colors.mutedText}
                />
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newVital.notes}
                onChangeText={(text) => setNewVital(prev => ({ ...prev, notes: text }))}
                placeholder="Any additional notes..."
                placeholderTextColor={Colors.mutedText}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <TouchableOpacity style={styles.addVitalButton} onPress={addVitalSign}>
              <Text style={styles.addVitalButtonText}>Log Vital Sign</Text>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedMetric.name} Details</Text>
              <TouchableOpacity onPress={() => setSelectedMetric(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Current Value</Text>
                <Text style={styles.detailValue}>
                  {selectedMetric.value} {selectedMetric.unit}
                </Text>
                {selectedMetric.target && (
                  <Text style={styles.detailTarget}>
                    Target: {selectedMetric.target} {selectedMetric.unit}
                  </Text>
                )}
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>7-Day History</Text>
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
                      <Text style={styles.historyDate}>
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text style={styles.historyValue}>{entry.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Trend Analysis</Text>
                <View style={styles.trendContainer}>
                  <Ionicons 
                    name={getTrendIcon(selectedMetric.trend)} 
                    size={24} 
                    color={getTrendColor(selectedMetric.trend)} 
                  />
                  <Text style={styles.trendText}>
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
    backgroundColor: Colors.background,
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
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.mutedText,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Colors.primary,
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
    color: Colors.text,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.text,
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
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
    marginBottom: 4,
  },
  metricName: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: Colors.mutedText,
  },
  metricLastUpdated: {
    fontSize: 10,
    color: Colors.mutedText,
    fontStyle: 'italic',
  },
  goalsContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
  },
  goalPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  goalProgress: {
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  vitalsContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vitalCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    color: Colors.text,
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
    color: Colors.text,
    marginBottom: 4,
  },
  vitalTimestamp: {
    fontSize: 12,
    color: Colors.mutedText,
    marginBottom: 4,
  },
  vitalNotes: {
    fontSize: 12,
    color: Colors.mutedText,
    fontStyle: 'italic',
  },
  insightsContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.background,
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
    color: Colors.text,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
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
    color: Colors.text,
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
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  selectedType: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 12,
    color: Colors.text,
  },
  selectedTypeText: {
    color: Colors.buttonText,
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
    color: Colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addVitalButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addVitalButtonText: {
    color: Colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  detailTarget: {
    fontSize: 14,
    color: Colors.mutedText,
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
    color: Colors.mutedText,
    marginBottom: 2,
  },
  historyValue: {
    fontSize: 8,
    color: Colors.mutedText,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
});
