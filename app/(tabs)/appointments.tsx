// app/(tabs)/appointments.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
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

const { width } = Dimensions.get('window');

interface Appointment {
  id: string;
  title: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  reminder: boolean;
}

export default function AppointmentsScreen() {
  const { colors, theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [newAppointment, setNewAppointment] = useState({
    title: '',
    doctorName: '',
    specialty: '',
    date: '',
    time: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response: any = await profileService.getAppointments(user.id);
      if (response && response.data && response.data.appointments) {
        const mapped = response.data.appointments.map((a: any) => ({
          id: a.id,
          title: a.title,
          doctor: a.doctorName,
          specialty: a.specialty,
          date: new Date(a.scheduledAt).toISOString().split('T')[0],
          time: new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: a.location,
          type: 'checkup',
          status: a.status.toLowerCase(),
          notes: a.notes,
          reminder: a.reminderEnabled
        }));
        setAppointments(mapped);
      }
    } catch (error) {
      console.log("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async () => {
    if (!user) return;
    if (!newAppointment.title || !newAppointment.doctorName || !newAppointment.date) {
      Alert.alert(t("error"), t("fillRequiredFields") || "Please fill required fields");
      return;
    }

    try {
      const scheduledAt = new Date(`${newAppointment.date}T${newAppointment.time || '10:00:00'}`);

      await profileService.createAppointment(user.id, {
        title: newAppointment.title,
        doctorName: newAppointment.doctorName,
        specialty: newAppointment.specialty,
        location: newAppointment.location,
        scheduledAt: scheduledAt.toISOString(),
        notes: newAppointment.notes
      });

      fetchAppointments();
      setShowAddModal(false);
      setNewAppointment({
        title: '',
        doctorName: '',
        specialty: '',
        date: '',
        time: '',
        location: '',
        notes: ''
      });
      Alert.alert(t("success"), t("apptScheduledSuccess") || "Appointment scheduled!");
    } catch (error) {
      console.log("Failed to add appointment:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return colors.primary;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'rescheduled': return colors.warning;
      default: return colors.mutedText;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(i18n.language, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const upcomingAppointments = appointments.filter(a => a.status === 'scheduled');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t("appointments")}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>{t("manageMedicalAppts")}</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color={colors.buttonText} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("upcomingAppts")}</Text>
            {upcomingAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.mutedText} />
                <Text style={[styles.emptyStateText, { color: colors.mutedText }]}>No upcoming appointments</Text>
              </View>
            ) : (
              upcomingAppointments.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={[styles.appointmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setSelectedAppointment(appointment)}
                >
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentDate}>
                      <Text style={[styles.appointmentDateText, { color: colors.text }]}>
                        {formatDate(appointment.date)}
                      </Text>
                      <Text style={[styles.appointmentTimeText, { color: colors.primary }]}>{appointment.time}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                      <Text style={{ color: getStatusColor(appointment.status), fontSize: 12, fontWeight: 'bold' }}>
                        {appointment.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.appointmentTitle, { color: colors.text }]}>{appointment.title}</Text>
                  <Text style={[styles.appointmentDoctor, { color: colors.mutedText }]}>{appointment.doctor} • {appointment.specialty}</Text>
                  <Text style={[styles.appointmentLocation, { color: colors.mutedText }]}>{appointment.location}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("scheduleAppt")}</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("apptTitle")} *</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newAppointment.title}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, title: text }))}
                placeholder="e.g., General Checkup"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("doctor")} *</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newAppointment.doctorName}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, doctorName: text }))}
                placeholder="e.g., Dr. Smith"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("date")} *</Text>
              <TouchableOpacity
                style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: newAppointment.date ? colors.text : colors.mutedText }}>
                  {newAppointment.date || "YYYY-MM-DD"}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={newAppointment.date ? new Date(newAppointment.date) : new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setNewAppointment(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
                }}
              />
            )}

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={addAppointment}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{t("scheduleAppt")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  appointmentCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  appointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  appointmentDateText: { fontSize: 16, fontWeight: 'bold' },
  appointmentDate: { flexDirection: 'column' },
  appointmentTimeText: { fontSize: 14 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  appointmentTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  appointmentDoctor: { fontSize: 14, marginBottom: 2 },
  appointmentLocation: { fontSize: 12 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateText: { marginTop: 10 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  textInput: { borderWidth: 1, borderRadius: 8, padding: 12, height: 50 },
  submitButton: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20 }
});