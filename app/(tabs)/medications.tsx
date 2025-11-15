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

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  taken: boolean[];
  color: string;
  instructions: string;
  sideEffects: string[];
  prescribedBy: string;
  startDate: string;
  endDate?: string;
}

export default function MedicationsScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    instructions: ''
  });

  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      times: ['8:00 AM'],
      taken: [true],
      color: '#3B82F6',
      instructions: 'Take with food. Avoid potassium supplements.',
      sideEffects: ['Dizziness', 'Dry cough', 'Fatigue'],
      prescribedBy: 'Dr. Sarah Johnson',
      startDate: '2024-01-15',
      endDate: '2024-07-15'
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      times: ['8:00 AM', '8:00 PM'],
      taken: [true, false],
      color: '#10B981',
      instructions: 'Take with meals to reduce stomach upset.',
      sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste'],
      prescribedBy: 'Dr. Michael Chen',
      startDate: '2024-02-01'
    },
    {
      id: '3',
      name: 'Vitamin D3',
      dosage: '1000 IU',
      frequency: 'Once daily',
      times: ['8:00 AM'],
      taken: [false],
      color: '#F59E0B',
      instructions: 'Take with fat-containing meal for better absorption.',
      sideEffects: ['Rare: Kidney stones with high doses'],
      prescribedBy: 'Dr. Sarah Johnson',
      startDate: '2024-01-01'
    },
    {
      id: '4',
      name: 'Aspirin',
      dosage: '81mg',
      frequency: 'Once daily',
      times: ['8:00 AM'],
      taken: [true],
      color: '#EF4444',
      instructions: 'Take with food to prevent stomach irritation.',
      sideEffects: ['Stomach upset', 'Bleeding risk'],
      prescribedBy: 'Dr. Michael Chen',
      startDate: '2024-01-10'
    }
  ]);

  const todayStats = {
    totalMeds: medications.length,
    takenMeds: medications.reduce((sum, med) => sum + med.taken.filter(t => t).length, 0),
    totalDoses: medications.reduce((sum, med) => sum + med.times.length, 0),
    compliance: 0
  };
  
  todayStats.compliance = Math.round((todayStats.takenMeds / todayStats.totalDoses) * 100);

  const weeklyCompliance = [92, 88, 95, 90, 85, 93, todayStats.compliance];
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const markAsTaken = (medId: string, timeIndex: number) => {
    setMedications(prev => prev.map(med => {
      if (med.id === medId) {
        const newTaken = [...med.taken];
        newTaken[timeIndex] = !newTaken[timeIndex];
        return { ...med, taken: newTaken };
      }
      return med;
    }));
    
    Alert.alert(
      'Medication Logged',
      'Your medication has been marked as taken.',
      [{ text: 'OK' }]
    );
  };

  const addMedication = () => {
    if (!newMedication.name || !newMedication.dosage) {
      Alert.alert('Error', 'Please fill in medication name and dosage.');
      return;
    }

    const newMed: Medication = {
      id: Date.now().toString(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency || 'Once daily',
      times: ['8:00 AM'],
      taken: [false],
      color: '#6366F1',
      instructions: newMedication.instructions,
      sideEffects: [],
      prescribedBy: 'Self-added',
      startDate: new Date().toISOString().split('T')[0]
    };

    setMedications(prev => [...prev, newMed]);
    setNewMedication({ name: '', dosage: '', frequency: '', instructions: '' });
    setShowAddModal(false);
    
    Alert.alert('Success', 'Medication added successfully!');
  };

  const showMedicationDetails = (med: Medication) => {
    setSelectedMed(med);
  };

  const setReminder = (med: Medication) => {
    Alert.alert(
      'Set Reminder',
      `Set reminder for ${med.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Set Reminder', 
          onPress: () => Alert.alert('Reminder Set', `Reminder set for ${med.name} at ${med.times.join(', ')}`) 
        }
      ]
    );
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return Colors.success;
    if (percentage >= 70) return Colors.warning;
    return Colors.error;
  };

  const getTimeStatus = (med: Medication, timeIndex: number) => {
    const currentTime = new Date();
    const [hours, minutes] = med.times[timeIndex].split(':');
    const medTime = new Date();
    medTime.setHours(parseInt(hours.replace(/[^\d]/g, '')));
    medTime.setMinutes(parseInt(minutes.replace(/[^\d]/g, '')));
    
    if (med.taken[timeIndex]) return 'taken';
    if (currentTime > medTime) return 'missed';
    return 'upcoming';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Medications</Text>
            <Text style={styles.headerSubtitle}>Manage your daily medications</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color={Colors.buttonText} />
          </TouchableOpacity>
        </View>

        {/* Today's Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="medical" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.summaryValue}>{todayStats.takenMeds}/{todayStats.totalDoses}</Text>
              <Text style={styles.summaryLabel}>Doses Taken</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="checkmark-circle" size={24} color={getComplianceColor(todayStats.compliance)} />
              </View>
              <Text style={[styles.summaryValue, { color: getComplianceColor(todayStats.compliance) }]}>
                {todayStats.compliance}%
              </Text>
              <Text style={styles.summaryLabel}>Compliance</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="time" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.summaryValue}>
                {medications.filter(med => 
                  med.taken.some((taken, i) => !taken && getTimeStatus(med, i) === 'missed')
                ).length}
              </Text>
              <Text style={styles.summaryLabel}>Missed</Text>
            </View>
          </View>
        </View>

        {/* Weekly Compliance Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Compliance</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {weeklyCompliance.map((compliance, index) => (
                <View key={index} style={styles.chartBar}>
                  <View 
                    style={[
                      styles.chartBarFill, 
                      { 
                        height: `${compliance}%`,
                        backgroundColor: getComplianceColor(compliance)
                      }
                    ]} 
                  />
                  <Text style={styles.chartLabel}>{weekDays[index]}</Text>
                  <Text style={styles.chartValue}>{compliance}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Today's Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Medications</Text>
          {medications.map((med) => (
            <View key={med.id} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <View style={styles.medicationInfo}>
                  <View style={[styles.medicationColor, { backgroundColor: med.color }]} />
                  <View style={styles.medicationDetails}>
                    <Text style={styles.medicationName}>{med.name}</Text>
                    <Text style={styles.medicationDosage}>{med.dosage} • {med.frequency}</Text>
                    <Text style={styles.medicationDoctor}>Prescribed by {med.prescribedBy}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={() => showMedicationDetails(med)}
                >
                  <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.medicationTimes}>
                {med.times.map((time, timeIndex) => {
                  const status = getTimeStatus(med, timeIndex);
                  return (
                    <TouchableOpacity
                      key={timeIndex}
                      style={[
                        styles.timeSlot,
                        status === 'taken' && styles.timeSlotTaken,
                        status === 'missed' && styles.timeSlotMissed,
                        status === 'upcoming' && styles.timeSlotUpcoming
                      ]}
                      onPress={() => markAsTaken(med.id, timeIndex)}
                    >
                      <Text style={styles.timeText}>{time}</Text>
                      <View style={styles.timeStatus}>
                        <Ionicons 
                          name={
                            status === 'taken' ? 'checkmark-circle' :
                            status === 'missed' ? 'close-circle' : 'time'
                          } 
                          size={16} 
                          color={
                            status === 'taken' ? Colors.success :
                            status === 'missed' ? Colors.error : Colors.warning
                          } 
                        />
                        <Text style={[
                          styles.statusText,
                          { color: 
                            status === 'taken' ? Colors.success :
                            status === 'missed' ? Colors.error : Colors.warning
                          }
                        ]}>
                          {status === 'taken' ? 'Taken' : 
                           status === 'missed' ? 'Missed' : 'Pending'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <View style={styles.medicationActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setReminder(med)}
                >
                  <Ionicons name="alarm" size={16} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Set Reminder</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => Alert.alert('Refill', `Order refill for ${med.name}?`)}
                >
                  <Ionicons name="refresh" size={16} color={Colors.success} />
                  <Text style={styles.actionButtonText}>Refill</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Medication Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color={Colors.warning} />
              <Text style={styles.tipText}>Take medications at the same time each day for better results</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="water" size={20} color={Colors.info} />
              <Text style={styles.tipText}>Always take pills with a full glass of water unless directed otherwise</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="warning" size={20} color={Colors.error} />
              <Text style={styles.tipText}>Never stop taking prescribed medications without consulting your doctor</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Medication Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Medication</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Medication Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newMedication.name}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, name: text }))}
                placeholder="Enter medication name"
                placeholderTextColor={Colors.mutedText}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dosage *</Text>
              <TextInput
                style={styles.textInput}
                value={newMedication.dosage}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, dosage: text }))}
                placeholder="e.g., 10mg, 1 tablet"
                placeholderTextColor={Colors.mutedText}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <TextInput
                style={styles.textInput}
                value={newMedication.frequency}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, frequency: text }))}
                placeholder="e.g., Once daily, Twice daily"
                placeholderTextColor={Colors.mutedText}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Special Instructions</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newMedication.instructions}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, instructions: text }))}
                placeholder="e.g., Take with food, Avoid alcohol"
                placeholderTextColor={Colors.mutedText}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <TouchableOpacity style={styles.addMedicationButton} onPress={addMedication}>
              <Text style={styles.addMedicationButtonText}>Add Medication</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Medication Details Modal */}
      <Modal
        visible={!!selectedMed}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedMed && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedMed.name}</Text>
              <TouchableOpacity onPress={() => setSelectedMed(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Dosage Information</Text>
                <Text style={styles.detailText}>{selectedMed.dosage} • {selectedMed.frequency}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Instructions</Text>
                <Text style={styles.detailText}>{selectedMed.instructions}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Prescribed By</Text>
                <Text style={styles.detailText}>{selectedMed.prescribedBy}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Start Date</Text>
                <Text style={styles.detailText}>{new Date(selectedMed.startDate).toLocaleDateString()}</Text>
              </View>
              
              {selectedMed.endDate && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>End Date</Text>
                  <Text style={styles.detailText}>{new Date(selectedMed.endDate).toLocaleDateString()}</Text>
                </View>
              )}
              
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Possible Side Effects</Text>
                {selectedMed.sideEffects.map((effect, index) => (
                  <Text key={index} style={styles.sideEffectText}>• {effect}</Text>
                ))}
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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  chartBarFill: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 10,
    color: Colors.mutedText,
    marginBottom: 2,
  },
  chartValue: {
    fontSize: 8,
    color: Colors.mutedText,
  },
  medicationCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  medicationColor: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 12,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  medicationDosage: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 2,
  },
  medicationDoctor: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  infoButton: {
    padding: 4,
  },
  medicationTimes: {
    marginBottom: 12,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  timeSlotTaken: {
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
  },
  timeSlotMissed: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
  },
  timeSlotUpcoming: {
    backgroundColor: Colors.warning + '20',
    borderColor: Colors.warning,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  timeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  medicationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
  },
  tipsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
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
  addMedicationButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addMedicationButtonText: {
    color: Colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 20,
  },
  sideEffectText: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 4,
  },
});