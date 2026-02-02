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
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { profileService } from "../../services/api/profile";
import { LinearGradient } from 'expo-linear-gradient';

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
  scheduledAt: string;
}

export default function AppointmentsScreen() {
  const { colors, theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    title: '',
    doctorName: '',
    specialty: '',
    date: '',
    time: '10:00',
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
          reminder: a.reminderEnabled,
          scheduledAt: a.scheduledAt
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
      Alert.alert(t("error"), "Please provide a title, doctor name, and date.");
      return;
    }

    try {
      const scheduledAt = new Date(`${newAppointment.date}T${newAppointment.time}:00`);

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
      resetForm();
      Alert.alert(t("success"), "Appointment scheduled successfully!");
    } catch (error) {
      console.error("Failed to add appointment:", error);
      Alert.alert("Error", "Could not save the appointment.");
    }
  };

  const resetForm = () => {
    setNewAppointment({
      title: '',
      doctorName: '',
      specialty: '',
      date: '',
      time: '10:00',
      location: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const upcomingAppointments = appointments
    .filter(a => a.status === 'scheduled' && new Date(a.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Medical Appointments</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>Keep track of your healthcare schedule</Text>
        </View>

        <TouchableOpacity
          style={styles.mainAddCard}
          onPress={() => setShowAddModal(true)}
        >
          <LinearGradient
            colors={[colors.primary, '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientCard}
          >
            <View style={styles.addCardLeft}>
              <Ionicons name="calendar-sharp" size={32} color="#FFF" />
              <View style={styles.addCardTextContainer}>
                <Text style={styles.addCardTitle}>Schedule New Visit</Text>
                <Text style={styles.addCardSub}>Stay on top of your health</Text>
              </View>
            </View>
            <Ionicons name="add-circle" size={40} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Visits</Text>
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{upcomingAppointments.length}</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : upcomingAppointments.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="medical-outline" size={64} color={colors.mutedText} />
              <Text style={[styles.emptyText, { color: colors.text }]}>Clear Schedule</Text>
              <Text style={[styles.emptySub, { color: colors.mutedText }]}>No medical visits planned for now.</Text>
            </View>
          ) : (
            upcomingAppointments.map((appt) => (
              <View key={appt.id} style={[styles.apptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statusStrip, { backgroundColor: getStatusColor(appt.status) }]} />
                <View style={styles.apptBody}>
                  <View style={styles.apptTopRow}>
                    <Text style={[styles.apptDate, { color: colors.mutedText }]}>{formatDate(appt.date)}</Text>
                    <View style={[styles.timeTag, { backgroundColor: colors.primary + '10' }]}>
                      <Ionicons name="time-outline" size={14} color={colors.primary} />
                      <Text style={[styles.timeText, { color: colors.primary }]}>{appt.time}</Text>
                    </View>
                  </View>

                  <Text style={[styles.apptTitle, { color: colors.text }]}>{appt.title}</Text>

                  <View style={styles.doctorInfo}>
                    <View style={styles.avatarMini}>
                      <Text style={styles.avatarText}>{appt.doctor.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={[styles.doctorName, { color: colors.text }]}>{appt.doctor}</Text>
                      <Text style={[styles.specialty, { color: colors.mutedText }]}>{appt.specialty}</Text>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={16} color={colors.mutedText} />
                    <Text style={[styles.locationText, { color: colors.mutedText }]} numberOfLines={1}>{appt.location}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Appointment Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalWrapper, { backgroundColor: colors.background }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>New Appointment</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>What is this visit for?</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="e.g., Annual Physical, Dental Cleaning"
                placeholderTextColor={colors.mutedText}
                value={newAppointment.title}
                onChangeText={(v) => setNewAppointment(p => ({ ...p, title: v }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Doctor's Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="e.g., Dr. Elizabeth Green"
                placeholderTextColor={colors.mutedText}
                value={newAppointment.doctorName}
                onChangeText={(v) => setNewAppointment(p => ({ ...p, doctorName: v }))}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Date</Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: newAppointment.date ? colors.text : colors.mutedText }}>
                    {newAppointment.date || "Select Date"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.formGroup, { width: 120 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Time</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                  placeholder="09:00"
                  placeholderTextColor={colors.mutedText}
                  value={newAppointment.time}
                  onChangeText={(v) => setNewAppointment(p => ({ ...p, time: v }))}
                />
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={newAppointment.date ? new Date(newAppointment.date) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setNewAppointment(p => ({ ...p, date: date.toISOString().split('T')[0] }));
                }}
              />
            )}

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Location / Clinic</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="e.g., City Medical Center, Suite 402"
                placeholderTextColor={colors.mutedText}
                value={newAppointment.location}
                onChangeText={(v) => setNewAppointment(p => ({ ...p, location: v }))}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={addAppointment}
            >
              <Text style={styles.saveBtnText}>Save Appointment</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'ios' ? 20 : 40 },
  headerSection: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 16, marginTop: 4, fontWeight: '500' },
  mainAddCard: { borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, marginBottom: 32 },
  gradientCard: { padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  addCardTextContainer: { marginLeft: 16 },
  addCardTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  addCardSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  listSection: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  loader: { marginTop: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 4 },
  apptCard: { borderRadius: 16, marginBottom: 16, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  statusStrip: { width: 6 },
  apptBody: { flex: 1, padding: 16 },
  apptTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  apptDate: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  timeTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  timeText: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
  apptTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  doctorInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarMini: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#4F46E5', fontWeight: '800', fontSize: 16 },
  doctorName: { fontSize: 15, fontWeight: '600' },
  specialty: { fontSize: 13, marginTop: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  locationText: { fontSize: 13, marginLeft: 6, flex: 1 },
  modalWrapper: { flex: 1 },
  modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
  modalHeaderTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 4 },
  formContainer: { flex: 1, padding: 20 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row' },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  saveBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' }
});