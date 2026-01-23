import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
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
  View,
  ActivityIndicator
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { profileService } from "../../services/api/profile";
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
  const { user } = useAuth();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [stats, setStats] = useState({
    totalMeds: 0,
    takenMeds: 0,
    totalDoses: 0,
    compliance: 0,
    missed: 0
  });
  const [weeklyCompliance, setWeeklyCompliance] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    instructions: ''
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [medsRes, complianceRes]: any = await Promise.all([
        profileService.getMedications(user.id),
        profileService.getComplianceReport(user.id, 7)
      ]);

      if (medsRes && medsRes.data) {
        // Map backend medication to frontend interface
        const mapped: Medication[] = medsRes.data.medications.map((m: any) => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          times: m.schedule || ['08:00 AM'],
          taken: (m.schedule || ['08:00 AM']).map(() => false),
          color: m.color || '#6366F1',
          instructions: m.instructions || '',
          sideEffects: m.sideEffects ? m.sideEffects.split(',') : [],
          prescribedBy: m.prescribedBy || 'Self',
          startDate: m.startDate || new Date().toISOString(),
          endDate: m.endDate
        }));
        setMedications(mapped);
      }

      if (complianceRes && complianceRes.data) {
        setWeeklyCompliance(complianceRes.data.daily || [0, 0, 0, 0, 0, 0, 0]);
        setStats({
          totalMeds: medsRes.data.medications.length,
          takenMeds: complianceRes.data.takenToday || 0,
          totalDoses: complianceRes.data.totalToday || 1,
          compliance: complianceRes.data.overallCompliance || 0,
          missed: complianceRes.data.missedToday || 0
        });
      }
    } catch (error) {
      console.log("Failed to fetch medication data:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsTaken = async (medId: string, timeIndex: number) => {
    if (!user) return;
    try {
      await profileService.logMedication(user.id, medId, {
        scheduledTime: new Date().toISOString(),
        status: 'taken'
      });

      setMedications(prev => prev.map(med => {
        if (med.id === medId) {
          const newTaken = [...med.taken];
          newTaken[timeIndex] = true;
          return { ...med, taken: newTaken };
        }
        return med;
      }));

      Alert.alert(t('success'), t('medicationLogged') || 'Medication logged!');
      fetchData();
    } catch (error) {
      console.log("Failed to log medication:", error);
    }
  };

  const addMedication = async () => {
    if (!user) return;
    if (!newMedication.name || !newMedication.dosage) {
      Alert.alert(t('error'), t('fillRequiredFields') || 'Please fill required fields');
      return;
    }

    try {
      await profileService.addMedication(user.id, {
        name: newMedication.name,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency || 'Once daily',
        instructions: newMedication.instructions,
        schedule: ['08:00 AM'],
        startDate: new Date().toISOString()
      });

      fetchData();
      setNewMedication({ name: '', dosage: '', frequency: '', instructions: '' });
      setShowAddModal(false);
      Alert.alert(t('success'), t('medicationAdded') || 'Medication added!');
    } catch (error) {
      console.log("Failed to add medication:", error);
    }
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

  const getTimeStatus = (med: Medication, timeIndex: number): 'taken' | 'missed' | 'upcoming' => {
    if (med.taken[timeIndex]) return 'taken';
    // Simplified missed logic for now
    const now = new Date();
    if (now.getHours() > 12) return 'missed';
    return 'upcoming';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && !medications.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
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
                <Text style={[styles.summaryValue, { color: colors.text }]}>{stats.takenMeds}/{stats.totalDoses}</Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>{t("dosesTaken")}</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="checkmark-circle" size={24} color={getComplianceColor(stats.compliance)} />
                </View>
                <Text style={[styles.summaryValue, { color: getComplianceColor(stats.compliance) }]}>
                  {stats.compliance}%
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>{t("compliance")}</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="time" size={24} color={colors.warning} />
                </View>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {stats.missed}
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
                          height: `${Math.max(5, compliance)}%`,
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
            {medications.length === 0 ? (
              <Text style={{ color: colors.mutedText, textAlign: 'center' }}>No medications added yet.</Text>
            ) : (
              medications.map((med) => (
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
              ))
            )}
          </View>
        </ScrollView>
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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