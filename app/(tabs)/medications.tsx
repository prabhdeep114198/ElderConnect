import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { ReminderService } from "../../utils/reminderService";

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
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
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
      `Set reminder for ${med.name} at ${med.times.join(', ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Reminder',
          onPress: async () => {
            try {
              // For simplicity, we'll set it for tomorrow at the first time mentioned
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const [hour, minutePart] = med.times[0].split(':');
              const [minutes, ampm] = minutePart.split(' ');

              let h = parseInt(hour);
              if (ampm === 'PM' && h < 12) h += 12;
              if (ampm === 'AM' && h === 12) h = 0;

              tomorrow.setHours(h, parseInt(minutes), 0, 0);

              await ReminderService.scheduleReminder({
                title: `Medication: ${med.name}`,
                body: `Time to take your ${med.name} (${med.dosage})`,
                date: tomorrow.toISOString(),
                type: 'medication',
              });
              Alert.alert('Reminder Set', `Reminder set for tomorrow at ${med.times[0]}`);
            } catch (error: any) {
              Alert.alert('Error', error.message || "Failed to set reminder");
            }
          }
        }
      ]
    );
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return colors.success;
    if (percentage >= 70) return colors.warning;
    return colors.error;
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t("medications")}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>{t("manageDailyMeds")}</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color={colors.buttonText} />
          </TouchableOpacity>
        </View>

        {/* Today's Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("todaysSummary")}</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryIcon}>
                <Ionicons name="medical" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{todayStats.takenMeds}/{todayStats.totalDoses}</Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>{t("dosesTaken")}</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryIcon}>
                <Ionicons name="checkmark-circle" size={24} color={getComplianceColor(todayStats.compliance)} />
              </View>
              <Text style={[styles.summaryValue, { color: getComplianceColor(todayStats.compliance) }]}>
                {todayStats.compliance}%
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>{t("compliance")}</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryIcon}>
                <Ionicons name="time" size={24} color={colors.warning} />
              </View>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {medications.filter(med =>
                  med.taken.some((taken, i) => !taken && getTimeStatus(med, i) === 'missed')
                ).length}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>{t("missed")}</Text>
            </View>
          </View>
        </View>

        {/* Weekly Compliance Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("weeklyCompliance")}</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                  <Text style={[styles.chartLabel, { color: colors.mutedText }]}>{weekDays[index]}</Text>
                  <Text style={[styles.chartValue, { color: colors.mutedText }]}>{compliance}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Today's Medications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("todaysMedications")}</Text>
          {medications.map((med) => (
            <View key={med.id} style={[styles.medicationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.medicationHeader}>
                <View style={styles.medicationInfo}>
                  <View style={[styles.medicationColor, { backgroundColor: med.color }]} />
                  <View style={styles.medicationDetails}>
                    <Text style={[styles.medicationName, { color: colors.text }]}>{med.name}</Text>
                    <Text style={[styles.medicationDosage, { color: colors.mutedText }]}>{med.dosage} • {med.frequency}</Text>
                    <Text style={[styles.medicationDoctor, { color: colors.mutedText }]}>{t("prescribedBy")} {med.prescribedBy}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => showMedicationDetails(med)}
                >
                  <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
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
                        { borderColor: status === 'taken' ? colors.success : status === 'missed' ? colors.error : colors.warning },
                        status === 'taken' && { backgroundColor: colors.success + '20' },
                        status === 'missed' && { backgroundColor: colors.error + '20' },
                        status === 'upcoming' && { backgroundColor: colors.warning + '20' }
                      ]}
                      onPress={() => markAsTaken(med.id, timeIndex)}
                    >
                      <Text style={[styles.timeText, { color: colors.text }]}>{time}</Text>
                      <View style={styles.timeStatus}>
                        <Ionicons
                          name={
                            status === 'taken' ? 'checkmark-circle' :
                              status === 'missed' ? 'close-circle' : 'time'
                          }
                          size={16}
                          color={
                            status === 'taken' ? colors.success :
                              status === 'missed' ? colors.error : colors.warning
                          }
                        />
                        <Text style={[
                          styles.statusText,
                          {
                            color:
                              status === 'taken' ? colors.success :
                                status === 'missed' ? colors.error : colors.warning
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
                  <Ionicons name="alarm" size={16} color={colors.primary} />
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>{t("setReminder")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Alert.alert('Refill', `Order refill for ${med.name}?`)}
                >
                  <Ionicons name="refresh" size={16} color={colors.success} />
                  <Text style={[styles.actionButtonText, { color: colors.success }]}>{t("refill")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Medication Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("medicationTips")}</Text>
          <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={[styles.tipText, { color: colors.text }]}>{t("tip1")}</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="water" size={20} color={colors.info} />
              <Text style={[styles.tipText, { color: colors.text }]}>{t("tip2")}</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="warning" size={20} color={colors.error} />
              <Text style={[styles.tipText, { color: colors.text }]}>{t("tip3")}</Text>
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
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("addNewMedication")}</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("medicationName")} *</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newMedication.name}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, name: text }))}
                placeholder="Enter medication name"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("dosage")} *</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newMedication.dosage}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, dosage: text }))}
                placeholder="e.g., 10mg, 1 tablet"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("frequency")}</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newMedication.frequency}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, frequency: text }))}
                placeholder="e.g., Once daily, Twice daily"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("specialInstructions")}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newMedication.instructions}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, instructions: text }))}
                placeholder="e.g., Take with food, Avoid alcohol"
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={[styles.addMedicationButton, { backgroundColor: colors.primary }]} onPress={addMedication}>
              <Text style={[styles.addMedicationButtonText, { color: colors.buttonText }]}>{t("addNewMedication")}</Text>
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
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedMed.name}</Text>
              <TouchableOpacity onPress={() => setSelectedMed(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{t("dosage")}</Text>
                <Text style={[styles.detailText, { color: colors.mutedText }]}>{selectedMed.dosage} • {selectedMed.frequency}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{t("specialInstructions")}</Text>
                <Text style={[styles.detailText, { color: colors.mutedText }]}>{selectedMed.instructions}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{t("prescribedBy")}</Text>
                <Text style={[styles.detailText, { color: colors.mutedText }]}>{selectedMed.prescribedBy}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{t("date")}</Text>
                <Text style={[styles.detailText, { color: colors.mutedText }]}>{new Date(selectedMed.startDate).toLocaleDateString()}</Text>
              </View>

              {selectedMed.endDate && (
                <View style={styles.detailSection}>
                  <Text style={[styles.detailTitle, { color: colors.text }]}>End Date</Text>
                  <Text style={[styles.detailText, { color: colors.mutedText }]}>{new Date(selectedMed.endDate).toLocaleDateString()}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{t("possibleSideEffects")}</Text>
                {selectedMed.sideEffects.map((effect, index) => (
                  <Text key={index} style={[styles.sideEffectText, { color: colors.mutedText }]}>• {effect}</Text>
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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
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
    marginBottom: 2,
  },
  chartValue: {
    fontSize: 8,
  },
  medicationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
    marginBottom: 2,
  },
  medicationDosage: {
    fontSize: 14,
    marginBottom: 2,
  },
  medicationDoctor: {
    fontSize: 12,
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
  timeText: {
    fontSize: 14,
    fontWeight: '600',
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
    marginLeft: 4,
  },
  tipsCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
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
  addMedicationButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addMedicationButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sideEffectText: {
    fontSize: 14,
    marginBottom: 4,
  },
});