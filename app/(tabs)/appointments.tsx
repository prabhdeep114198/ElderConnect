// app/(tabs)/appointments.tsx
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
  const [showAddModal, setShowAddModal] = useState(false);
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
      Alert.alert('Error', 'Please fill in all required fields.');
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
    Alert.alert('Success', 'Appointment scheduled successfully!');
  };

  const cancelAppointment = (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            setAppointments(prev => prev.map(apt => 
              apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
            ));
            Alert.alert('Cancelled', 'Appointment has been cancelled.');
          }
        }
      ]
    );
  };

  const rescheduleAppointment = (appointmentId: string) => {
    Alert.alert(
      'Reschedule Appointment',
      'Would you like to reschedule this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reschedule', 
          onPress: () => {
            setAppointments(prev => prev.map(apt => 
              apt.id === appointmentId ? { ...apt, status: 'rescheduled' as const } : apt
            ));
            Alert.alert('Rescheduled', 'Please contact the office to set a new time.');
          }
        }
      ]
    );
  };

  const callDoctor = (doctor: string) => {
    const doctorInfo = doctors.find(d => d.name === doctor);
    if (doctorInfo) {
      Alert.alert(
        'Call Doctor',
        `Call ${doctorInfo.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => Alert.alert('Calling...', `Calling ${doctorInfo.phone}`) }
        ]
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return Colors.primary;
      case 'completed': return Colors.success;
      case 'cancelled': return Colors.error;
      case 'rescheduled': return Colors.warning;
      default: return Colors.mutedText;
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
    return date.toLocaleDateString('en-US', { 
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
    if (isToday(dateString)) return 'Today';
    if (isTomorrow(dateString)) return 'Tomorrow';
    return formatDate(dateString);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Appointments</Text>
            <Text style={styles.headerSubtitle}>Manage your medical appointments</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.viewToggle}
              onPress={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            >
              <Ionicons 
                name={viewMode === 'list' ? 'calendar' : 'list'} 
                size={20} 
                color={Colors.primary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={24} color={Colors.buttonText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Appointments */}
        {todayAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today&apos;s Appointments</Text>
            <View style={styles.todayContainer}>
              {todayAppointments.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.todayCard}
                  onPress={() => setSelectedAppointment(appointment)}
                >
                  <View style={styles.todayTime}>
                    <Text style={styles.todayTimeText}>{appointment.time}</Text>
                  </View>
                  <View style={styles.todayInfo}>
                    <Text style={styles.todayTitle}>{appointment.title}</Text>
                    <Text style={styles.todayDoctor}>{appointment.doctor}</Text>
                    <Text style={styles.todayLocation}>{appointment.location}</Text>
                  </View>
                  <View style={styles.todayActions}>
                    <TouchableOpacity 
                      style={styles.todayActionButton}
                      onPress={() => callDoctor(appointment.doctor)}
                    >
                      <Ionicons name="call" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{upcomingAppointments.length}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              </View>
              <Text style={styles.statValue}>{pastAppointments.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="people" size={24} color={Colors.info} />
              </View>
              <Text style={styles.statValue}>{doctors.length}</Text>
              <Text style={styles.statLabel}>Doctors</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          {upcomingAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.mutedText} />
              <Text style={styles.emptyStateText}>No upcoming appointments</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Schedule Appointment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingAppointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                style={styles.appointmentCard}
                onPress={() => setSelectedAppointment(appointment)}
              >
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentDate}>
                    <Text style={styles.appointmentDateText}>
                      {getDateLabel(appointment.date)}
                    </Text>
                    <Text style={styles.appointmentTimeText}>{appointment.time}</Text>
                  </View>
                  <View style={[styles.appointmentType, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                    <Ionicons 
                      name={getTypeIcon(appointment.type)} 
                      size={16} 
                      color={getStatusColor(appointment.status)} 
                    />
                  </View>
                </View>
                
                <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                <Text style={styles.appointmentDoctor}>{appointment.doctor} • {appointment.specialty}</Text>
                <Text style={styles.appointmentLocation}>{appointment.location}</Text>
                
                {appointment.notes && (
                  <Text style={styles.appointmentNotes}>{appointment.notes}</Text>
                )}
                
                <View style={styles.appointmentActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => callDoctor(appointment.doctor)}
                  >
                    <Ionicons name="call" size={16} color={Colors.primary} />
                    <Text style={styles.actionButtonText}>Call</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => rescheduleAppointment(appointment.id)}
                  >
                    <Ionicons name="time" size={16} color={Colors.warning} />
                    <Text style={styles.actionButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => cancelAppointment(appointment.id)}
                  >
                    <Ionicons name="close" size={16} color={Colors.error} />
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* My Doctors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Doctors</Text>
          <View style={styles.doctorsGrid}>
            {doctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={styles.doctorCard}
                onPress={() => setSelectedDoctor(doctor)}
              >
                <View style={styles.doctorAvatar}>
                  <Ionicons name="person" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                <View style={styles.doctorRating}>
                  <Ionicons name="star" size={12} color={Colors.warning} />
                  <Text style={styles.doctorRatingText}>{doctor.rating}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Appointments */}
        {pastAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Appointments</Text>
            {pastAppointments.slice(0, 3).map((appointment) => (
              <View key={appointment.id} style={styles.pastAppointmentCard}>
                <View style={styles.pastAppointmentHeader}>
                  <Text style={styles.pastAppointmentDate}>
                    {formatDate(appointment.date)} • {appointment.time}
                  </Text>
                  <View style={[styles.pastAppointmentStatus, { backgroundColor: getStatusColor(appointment.status) }]}>
                    <Text style={styles.pastAppointmentStatusText}>{appointment.status}</Text>
                  </View>
                </View>
                <Text style={styles.pastAppointmentTitle}>{appointment.title}</Text>
                <Text style={styles.pastAppointmentDoctor}>{appointment.doctor}</Text>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Appointment</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Appointment Title *</Text>
              <TextInput
                style={styles.textInput}
                value={newAppointment.title}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, title: text }))}
                placeholder="e.g., Annual Physical Checkup"
                placeholderTextColor={Colors.mutedText}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Doctor *</Text>
              <TextInput
                style={styles.textInput}
                value={newAppointment.doctor}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, doctor: text }))}
                placeholder="e.g., Dr. Sarah Johnson"
                placeholderTextColor={Colors.mutedText}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Specialty</Text>
              <TextInput
                style={styles.textInput}
                value={newAppointment.specialty}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, specialty: text }))}
                placeholder="e.g., Family Medicine"
                placeholderTextColor={Colors.mutedText}
              />
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Date *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newAppointment.date}
                  onChangeText={(text) => setNewAppointment(prev => ({ ...prev, date: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.mutedText}
                />
              </View>
              
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Time *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newAppointment.time}
                  onChangeText={(text) => setNewAppointment(prev => ({ ...prev, time: text }))}
                  placeholder="10:00 AM"
                  placeholderTextColor={Colors.mutedText}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={newAppointment.location}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, location: text }))}
                placeholder="e.g., City Medical Center, Room 205"
                placeholderTextColor={Colors.mutedText}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Appointment Type</Text>
              <View style={styles.typeSelector}>
                {[
                  { key: 'checkup', label: 'Checkup' },
                  { key: 'follow-up', label: 'Follow-up' },
                  { key: 'consultation', label: 'Consultation' },
                  { key: 'emergency', label: 'Emergency' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      newAppointment.type === type.key && styles.selectedType
                    ]}
                    onPress={() => setNewAppointment(prev => ({ ...prev, type: type.key as any }))}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      newAppointment.type === type.key && styles.selectedTypeText
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newAppointment.notes}
                onChangeText={(text) => setNewAppointment(prev => ({ ...prev, notes: text }))}
                placeholder="Any special instructions or notes..."
                placeholderTextColor={Colors.mutedText}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <TouchableOpacity style={styles.addAppointmentButton} onPress={addAppointment}>
              <Text style={styles.addAppointmentButtonText}>Schedule Appointment</Text>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appointment Details</Text>
              <TouchableOpacity onPress={() => setSelectedAppointment(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>{selectedAppointment.title}</Text>
                <Text style={styles.detailSubtitle}>
                  {getDateLabel(selectedAppointment.date)} • {selectedAppointment.time}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Doctor</Text>
                <Text style={styles.detailText}>{selectedAppointment.doctor}</Text>
                <Text style={styles.detailText}>{selectedAppointment.specialty}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailText}>{selectedAppointment.location}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailText}>{selectedAppointment.type}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedAppointment.status) }]}>
                  <Text style={styles.statusBadgeText}>{selectedAppointment.status}</Text>
                </View>
              </View>
              
              {selectedAppointment.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailText}>{selectedAppointment.notes}</Text>
                </View>
              )}
              
              <View style={styles.detailActions}>
                <TouchableOpacity 
                  style={[styles.detailActionButton, { backgroundColor: Colors.primary }]}
                  onPress={() => callDoctor(selectedAppointment.doctor)}
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text style={styles.detailActionButtonText}>Call Doctor</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.detailActionButton, { backgroundColor: Colors.warning }]}
                  onPress={() => rescheduleAppointment(selectedAppointment.id)}
                >
                  <Ionicons name="time" size={20} color="white" />
                  <Text style={styles.detailActionButtonText}>Reschedule</Text>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Doctor Information</Text>
              <TouchableOpacity onPress={() => setSelectedDoctor(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.doctorDetailHeader}>
                <View style={styles.doctorDetailAvatar}>
                  <Ionicons name="person" size={48} color={Colors.primary} />
                </View>
                <Text style={styles.doctorDetailName}>{selectedDoctor.name}</Text>
                <Text style={styles.doctorDetailSpecialty}>{selectedDoctor.specialty}</Text>
                <View style={styles.doctorDetailRating}>
                  <Ionicons name="star" size={16} color={Colors.warning} />
                  <Text style={styles.doctorDetailRatingText}>{selectedDoctor.rating} rating</Text>
                </View>
              </View>
              
              <View style={styles.doctorDetailSection}>
                <Text style={styles.detailLabel}>Contact Information</Text>
                <TouchableOpacity style={styles.contactItem}>
                  <Ionicons name="call" size={20} color={Colors.primary} />
                  <Text style={styles.contactText}>{selectedDoctor.phone}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactItem}>
                  <Ionicons name="mail" size={20} color={Colors.primary} />
                  <Text style={styles.contactText}>{selectedDoctor.email}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.doctorDetailSection}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailText}>{selectedDoctor.address}</Text>
              </View>
              
              <View style={styles.detailActions}>
                <TouchableOpacity 
                  style={[styles.detailActionButton, { backgroundColor: Colors.primary }]}
                  onPress={() => Alert.alert('Calling...', `Calling ${selectedDoctor.phone}`)}
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text style={styles.detailActionButtonText}>Call</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.detailActionButton, { backgroundColor: Colors.success }]}
                  onPress={() => {
                    setSelectedDoctor(null);
                    setShowAddModal(true);
                  }}
                >
                  <Ionicons name="calendar" size={20} color="white" />
                  <Text style={styles.detailActionButtonText}>Book Appointment</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewToggle: {
    padding: 8,
    marginRight: 8,
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
  todayContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  todayTime: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 16,
  },
  todayTimeText: {
    color: Colors.buttonText,
    fontWeight: '600',
    fontSize: 12,
  },
  todayInfo: {
    flex: 1,
  },
  todayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  todayDoctor: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 2,
  },
  todayLocation: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  todayActions: {
    flexDirection: 'row',
  },
  todayActionButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.mutedText,
    marginVertical: 16,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: Colors.buttonText,
    fontWeight: '600',
  },
  appointmentCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentDate: {
    flex: 1,
  },
  appointmentDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  appointmentTimeText: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
  },
  appointmentType: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  appointmentDoctor: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 4,
  },
  appointmentLocation: {
    fontSize: 12,
    color: Colors.mutedText,
    marginBottom: 8,
  },
  appointmentNotes: {
    fontSize: 12,
    color: Colors.text,
    fontStyle: 'italic',
    marginBottom: 12,
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 6,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
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
  doctorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  doctorCard: {
    width: (width - 60) / 2,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
    marginBottom: 8,
  },
  doctorRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorRatingText: {
    fontSize: 12,
    color: Colors.mutedText,
    marginLeft: 4,
  },
  pastAppointmentCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pastAppointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pastAppointmentDate: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  pastAppointmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pastAppointmentStatusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pastAppointmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  pastAppointmentDoctor: {
    fontSize: 12,
    color: Colors.mutedText,
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
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputHalf: {
    flex: 0.48,
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
  addAppointmentButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addAppointmentButtonText: {
    color: Colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  detailSubtitle: {
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  detailActionButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  detailActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  doctorDetailHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  doctorDetailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  doctorDetailSpecialty: {
    fontSize: 16,
    color: Colors.mutedText,
    marginBottom: 8,
  },
  doctorDetailRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorDetailRatingText: {
    fontSize: 14,
    color: Colors.mutedText,
    marginLeft: 4,
  },
  doctorDetailSection: {
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
  },
});