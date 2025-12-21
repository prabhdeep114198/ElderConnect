// app/(tabs)/appointments.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from "react";
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
  View
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get('window');

interface Appointment {
  id: string;
  title: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  type: 'checkup' | 'follow-up' | 'consultation' | 'emergency';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  reminder: boolean;
  duration: number; // in minutes
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
}

export default function AppointmentsScreen() {
  const { colors, theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    doctor: '',
    specialty: '',
    date: '',
    time: '',
    location: '',
    type: 'checkup' as const,
    notes: ''
  });

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      title: 'Annual Physical Checkup',
      doctor: 'Dr. Sarah Johnson',
      specialty: 'Family Medicine',
      date: '2024-12-15',
      time: '10:00 AM',
      location: 'City Medical Center, Room 205',
      type: 'checkup',
      status: 'scheduled',
      notes: 'Bring previous lab results and medication list',
      reminder: true,
      duration: 60
    },
    {
      id: '2',
      title: 'Cardiology Follow-up',
      doctor: 'Dr. Michael Chen',
      specialty: 'Cardiology',
      date: '2024-12-18',
      time: '2:30 PM',
      location: 'Heart Specialists Clinic',
      type: 'follow-up',
      status: 'scheduled',
      notes: 'Review recent EKG results',
      reminder: true,
      duration: 45
    },
    {
      id: '3',
      title: 'Eye Examination',
      doctor: 'Dr. Emily Rodriguez',
      specialty: 'Ophthalmology',
      date: '2024-12-20',
      time: '11:15 AM',
      location: 'Vision Care Center',
      type: 'checkup',
      status: 'scheduled',
      reminder: false,
      duration: 30
    },
    {
      id: '4',
      title: 'Diabetes Management',
      doctor: 'Dr. Robert Kim',
      specialty: 'Endocrinology',
      date: '2024-12-10',
      time: '9:00 AM',
      location: 'Diabetes Care Clinic',
      type: 'follow-up',
      status: 'completed',
      notes: 'Discussed medication adjustments',
      reminder: true,
      duration: 45
    }
  ]);

  const [doctors, setDoctors] = useState<Doctor[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'Family Medicine',
      phone: '(555) 123-4567',
      email: 'sarah.johnson@citymedical.com',
      address: '123 Medical Plaza, Suite 205',
      rating: 4.8
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Cardiology',
      phone: '(555) 234-5678',
      email: 'michael.chen@heartcare.com',
      address: '456 Heart Center Dr, Suite 301',
      rating: 4.9
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      specialty: 'Ophthalmology',
      phone: '(555) 345-6789',
      email: 'emily.rodriguez@visioncare.com',
      address: '789 Vision Blvd, Suite 102',
      rating: 4.7
    },
    {
      id: '4',
      name: 'Dr. Robert Kim',
      specialty: 'Endocrinology',
      phone: '(555) 456-7890',
      email: 'robert.kim@diabetescare.com',
      address: '321 Wellness Ave, Suite 405',
      rating: 4.6
    }
  ]);

  const upcomingAppointments = appointments
    .filter(apt => apt.status === 'scheduled' && new Date(apt.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastAppointments = appointments
    .filter(apt => apt.status === 'completed' || new Date(apt.date) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    return apt.date === today && apt.status === 'scheduled';
  });

  const addAppointment = () => {
    if (!newAppointment.title || !newAppointment.doctor || !newAppointment.date || !newAppointment.time) {
      Alert.alert(t("error"), t("fillAllFields"));
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      title: newAppointment.title,
      doctor: newAppointment.doctor,
      specialty: newAppointment.specialty,
      date: newAppointment.date,
      time: newAppointment.time,
      location: newAppointment.location,
      type: newAppointment.type,
      status: 'scheduled',
      notes: newAppointment.notes,
      reminder: true,
      duration: 60
    };

    setAppointments(prev => [...prev, appointment]);
    setNewAppointment({
      title: '',
      doctor: '',
      specialty: '',
      date: '',
      time: '',
      location: '',
      type: 'checkup',
      notes: ''
    });
    setShowAddModal(false);
    Alert.alert(t("success"), t("apptScheduledSuccess"));
  };

  const cancelAppointment = (appointmentId: string) => {
    Alert.alert(
      t("cancel"),
      t("cancelApptConfirm"),
      [
        { text: t("no"), style: 'cancel' },
        {
          text: t("yesCancel"),
          style: 'destructive',
          onPress: () => {
            setAppointments(prev => prev.map(apt =>
              apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
            ));
            Alert.alert(t("cancelled"), t("apptCancelledMsg"));
          }
        }
      ]
    );
  };

  const rescheduleAppointment = (appointmentId: string) => {
    Alert.alert(
      t("reschedule"),
      t("rescheduleApptConfirm"),
      [
        { text: t("cancel"), style: 'cancel' },
        {
          text: t("reschedule"),
          onPress: () => {
            setAppointments(prev => prev.map(apt =>
              apt.id === appointmentId ? { ...apt, status: 'rescheduled' as const } : apt
            ));
            Alert.alert(t("rescheduled"), t("rescheduleContactMsg"));
          }
        }
      ]
    );
  };

  const callDoctor = (doctor: string) => {
    const doctorInfo = doctors.find(d => d.name === doctor);
    if (doctorInfo) {
      Alert.alert(
        t("callDoctor"),
        `${t("call")} ${doctorInfo.name}?`,
        [
          { text: t("cancel"), style: 'cancel' },
          { text: t("call"), onPress: () => Alert.alert(t("calling"), `${t("calling")} ${doctorInfo.phone}`) }
        ]
      );
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'checkup': return 'medical';
      case 'follow-up': return 'refresh';
      case 'consultation': return 'chatbubble';
      case 'emergency': return 'warning';
      default: return 'calendar';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateString === tomorrow.toISOString().split('T')[0];
  };

  const getDateLabel = (dateString: string) => {
    if (isToday(dateString)) return t("today");
    if (isTomorrow(dateString)) return t("tomorrow");
    return formatDate(dateString);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t("appointments")}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>{t("manageMedicalAppts")}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.viewToggle, { borderColor: colors.primary }]}
              onPress={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            >
              <Ionicons
                name={viewMode === 'list' ? 'calendar' : 'list'}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={24} color={colors.buttonText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Appointments */}
        {todayAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("todayAppts")}</Text>
            <View style={styles.todayContainer}>
              {todayAppointments.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
                  onPress={() => setSelectedAppointment(appointment)}
                >
                  <View style={[styles.todayTime, { backgroundColor: colors.primary }]}>
                    <Text style={styles.todayTimeText}>{appointment.time}</Text>
                  </View>
                  <View style={styles.todayInfo}>
                    <Text style={[styles.todayTitle, { color: colors.text }]}>{appointment.title}</Text>
                    <Text style={[styles.todayDoctor, { color: colors.primary }]}>{appointment.doctor}</Text>
                    <Text style={[styles.todayLocation, { color: colors.mutedText }]}>{appointment.location}</Text>
                  </View>
                  <View style={styles.todayActions}>
                    <TouchableOpacity
                      style={[styles.todayActionButton, { backgroundColor: colors.primary + '10' }]}
                      onPress={() => callDoctor(appointment.doctor)}
                    >
                      <Ionicons name="call" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("overview")}</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="calendar" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{upcomingAppointments.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>{t("upcoming")}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.success + '10' }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{pastAppointments.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>{t("completed")}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.info + '10' }]}>
                <Ionicons name="people" size={24} color={colors.info} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{doctors.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>{t("doctorsTitle")}</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("upcomingAppts")}</Text>
          {upcomingAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.mutedText} />
              <Text style={[styles.emptyStateText, { color: colors.mutedText }]}>No upcoming appointments</Text>
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Schedule Appointment</Text>
              </TouchableOpacity>
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
                      {getDateLabel(appointment.date)}
                    </Text>
                    <Text style={[styles.appointmentTimeText, { color: colors.primary }]}>{appointment.time}</Text>
                  </View>
                  <View style={[styles.appointmentType, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                    <Ionicons
                      name={getTypeIcon(appointment.type)}
                      size={16}
                      color={getStatusColor(appointment.status)}
                    />
                  </View>
                </View>

                <Text style={[styles.appointmentTitle, { color: colors.text }]}>{appointment.title}</Text>
                <Text style={[styles.appointmentDoctor, { color: colors.mutedText }]}>{appointment.doctor} • {appointment.specialty}</Text>
                <Text style={[styles.appointmentLocation, { color: colors.mutedText }]}>{appointment.location}</Text>

                {appointment.notes && (
                  <Text style={[styles.appointmentNotes, { color: colors.mutedText, backgroundColor: colors.background }]}>{appointment.notes}</Text>
                )}

                <View style={[styles.appointmentActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => callDoctor(appointment.doctor)}
                  >
                    <Ionicons name="call" size={16} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>{t("call")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => rescheduleAppointment(appointment.id)}
                  >
                    <Ionicons name="time" size={16} color={colors.warning} />
                    <Text style={[styles.actionButtonText, { color: colors.warning }]}>{t("reschedule")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => cancelAppointment(appointment.id)}
                  >
                    <Ionicons name="close" size={16} color={colors.error} />
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>{t("cancel")}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* My Doctors */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("doctorsTitle")}</Text>
          <View style={styles.doctorsGrid}>
            {doctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={[styles.doctorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setSelectedDoctor(doctor)}
              >
                <View style={[styles.doctorAvatar, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.doctorName, { color: colors.text }]}>{doctor.name}</Text>
                <Text style={[styles.doctorSpecialty, { color: colors.mutedText }]}>{doctor.specialty}</Text>
                <View style={styles.doctorRating}>
                  <Ionicons name="star" size={12} color={colors.warning} />
                  <Text style={[styles.doctorRatingText, { color: colors.text }]}>{doctor.rating}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Appointments */}
        {pastAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("recentAppts")}</Text>
            {pastAppointments.slice(0, 3).map((appointment) => (
              <View key={appointment.id} style={[styles.pastAppointmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.pastAppointmentHeader}>
                  <Text style={[styles.pastAppointmentDate, { color: colors.mutedText }]}>
                    {formatDate(appointment.date)} • {appointment.time}
                  </Text>
                  <View style={[styles.pastAppointmentStatus, { backgroundColor: getStatusColor(appointment.status) }]}>
                    <Text style={styles.pastAppointmentStatusText}>{appointment.status}</Text>
                  </View>
                </View>
                <Text style={[styles.pastAppointmentTitle, { color: colors.text }]}>{appointment.title}</Text>
                <Text style={[styles.pastAppointmentDoctor, { color: colors.mutedText }]}>{appointment.doctor}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Appointment Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
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
                placeholder="e.g., Annual Physical Checkup"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("doctor")} *</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newAppointment.doctor}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, doctor: text }))}
                placeholder="e.g., Dr. Sarah Johnson"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("specialty")}</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newAppointment.specialty}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, specialty: text }))}
                placeholder="e.g., Family Medicine"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t("date")} *</Text>
                <TouchableOpacity
                  style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: newAppointment.date ? colors.text : colors.mutedText, fontSize: 16 }}>
                    {newAppointment.date || "YYYY-MM-DD"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={newAppointment.date ? new Date(newAppointment.date) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const year = selectedDate.getFullYear();
                        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const day = String(selectedDate.getDate()).padStart(2, '0');
                        setNewAppointment(prev => ({ ...prev, date: `${year}-${month}-${day}` }));
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputHalf}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t("time")} *</Text>
                <TouchableOpacity
                  style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center' }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={{ color: newAppointment.time ? colors.text : colors.mutedText, fontSize: 16 }}>
                    {newAppointment.time || "10:00 AM"}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={new Date()} // Current date, but picker will only return time
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event: DateTimePickerEvent, selectedTime?: Date) => {
                      setShowTimePicker(false);
                      if (selectedTime) {
                        let hours = selectedTime.getHours();
                        const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12;
                        hours = hours ? hours : 12; // the hour '0' should be '12'
                        const strTime = `${hours}:${minutes} ${ampm}`;
                        setNewAppointment(prev => ({ ...prev, time: strTime }));
                      }
                    }}
                  />
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("location")}</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newAppointment.location}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, location: text }))}
                placeholder="e.g., City Medical Center, Room 205"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("apptType")}</Text>
              <View style={styles.typeSelector}>
                {[
                  { key: 'checkup', label: t('checkup') },
                  { key: 'follow-up', label: t('followUp') },
                  { key: 'consultation', label: t('consultation') },
                  { key: 'emergency', label: t('emergency') }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      { borderColor: colors.border },
                      newAppointment.type === type.key && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setNewAppointment(prev => ({ ...prev, type: type.key as any }))}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      { color: newAppointment.type === type.key ? "white" : colors.text }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t("notes")}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={newAppointment.notes}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, notes: text }))}
                placeholder="Any special instructions or notes..."
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={[styles.addAppointmentButton, { backgroundColor: colors.primary }]} onPress={addAppointment}>
              <Text style={styles.addAppointmentButtonText}>{t("scheduleAppt")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Appointment Details Modal */}
      <Modal
        visible={!!selectedAppointment}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedAppointment && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Appointment Details</Text>
              <TouchableOpacity onPress={() => setSelectedAppointment(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedAppointment.title}</Text>
                <Text style={[styles.detailSubtitle, { color: colors.mutedText }]}>
                  {getDateLabel(selectedAppointment.date)} • {selectedAppointment.time}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.mutedText }]}>{t("doctor")}</Text>
                <Text style={[styles.detailText, { color: colors.text }]}>{selectedAppointment.doctor}</Text>
                <Text style={[styles.detailText, { color: colors.text }]}>{selectedAppointment.specialty}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.mutedText }]}>{t("location")}</Text>
                <Text style={[styles.detailText, { color: colors.text }]}>{selectedAppointment.location}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.mutedText }]}>{t("apptType")}</Text>
                <Text style={[styles.detailText, { color: colors.text }]}>{selectedAppointment.type}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.mutedText }]}>{t("status")}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedAppointment.status) }]}>
                  <Text style={styles.statusBadgeText}>{selectedAppointment.status}</Text>
                </View>
              </View>

              {selectedAppointment.notes && (
                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.mutedText }]}>{t("notes")}</Text>
                  <Text style={[styles.detailText, { color: colors.text }]}>{selectedAppointment.notes}</Text>
                </View>
              )}

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailActionButton, { backgroundColor: colors.primary }]}
                  onPress={() => callDoctor(selectedAppointment.doctor)}
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text style={styles.detailActionButtonText}>{t("callDoctor")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailActionButton, { backgroundColor: colors.warning }]}
                  onPress={() => rescheduleAppointment(selectedAppointment.id)}
                >
                  <Ionicons name="time" size={20} color="white" />
                  <Text style={styles.detailActionButtonText}>{t("reschedule")}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Doctor Details Modal */}
      <Modal
        visible={!!selectedDoctor}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedDoctor && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Doctor Information</Text>
              <TouchableOpacity onPress={() => setSelectedDoctor(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.doctorDetailHeader}>
                <View style={[styles.doctorDetailAvatar, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name="person" size={48} color={colors.primary} />
                </View>
                <Text style={[styles.doctorDetailName, { color: colors.text }]}>{selectedDoctor.name}</Text>
                <Text style={[styles.doctorDetailSpecialty, { color: colors.mutedText }]}>{selectedDoctor.specialty}</Text>
                <View style={styles.doctorDetailRating}>
                  <Ionicons name="star" size={16} color={colors.warning} />
                  <Text style={[styles.doctorDetailRatingText, { color: colors.text }]}>{selectedDoctor.rating} rating</Text>
                </View>
              </View>

              <View style={styles.doctorDetailSection}>
                <Text style={[styles.detailLabel, { color: colors.mutedText }]}>{t("contactInfo")}</Text>
                <TouchableOpacity style={styles.contactItem}>
                  <Ionicons name="call" size={20} color={colors.primary} />
                  <Text style={[styles.contactText, { color: colors.text }]}>{selectedDoctor.phone}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactItem}>
                  <Ionicons name="mail" size={20} color={colors.primary} />
                  <Text style={[styles.contactText, { color: colors.text }]}>{selectedDoctor.email}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.doctorDetailSection}>
                <Text style={[styles.detailLabel, { color: colors.mutedText }]}>{t("address")}</Text>
                <Text style={[styles.detailText, { color: colors.text }]}>{selectedDoctor.address}</Text>
              </View>

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailActionButton, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Calling...', `Calling ${selectedDoctor.phone}`)}
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text style={styles.detailActionButtonText}>{t("call")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailActionButton, { backgroundColor: colors.success }]}
                  onPress={() => {
                    setSelectedDoctor(null);
                    setShowAddModal(true);
                  }}
                >
                  <Ionicons name="calendar" size={20} color="white" />
                  <Text style={styles.detailActionButtonText}>{t("bookAppt")}</Text>
                </TouchableOpacity>
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
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  viewToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  todayContainer: {
    // marginBottom: 16,
  },
  todayCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
  },
  todayTime: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    height: 60,
    width: 80,
  },
  todayTimeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  todayInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  todayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  todayDoctor: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  todayLocation: {
    fontSize: 12,
  },
  todayActions: {
    justifyContent: 'center',
  },
  todayActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    opacity: 0.7,
  },
  emptyStateText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  emptyStateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  appointmentCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentDateText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentType: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appointmentDoctor: {
    fontSize: 14,
    marginBottom: 4,
  },
  appointmentLocation: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  appointmentNotes: {
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  appointmentActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  doctorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  doctorCard: {
    width: (width - 52) / 2,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  doctorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorRatingText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  pastAppointmentCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    opacity: 0.8,
  },
  pastAppointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pastAppointmentDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  pastAppointmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pastAppointmentStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  pastAppointmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  pastAppointmentDoctor: {
    fontSize: 12,
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
    fontSize: 20,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputHalf: {
    width: '48%',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectedType: {
    // backgroundColor handled inline
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTypeText: {
    color: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addAppointmentButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  addAppointmentButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailSubtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  detailActionButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  detailActionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  doctorDetailHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  doctorDetailAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  doctorDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  doctorDetailSpecialty: {
    fontSize: 16,
    marginBottom: 8,
  },
  doctorDetailRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorDetailRatingText: {
    marginLeft: 4,
    fontSize: 14,
  },
  doctorDetailSection: {
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 12,
  },
});