import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
  duration: number;
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
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

  // Fetch appointments and doctors from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsRes, doctorsRes] = await Promise.all([
          fetch('https://your-backend.com/api/appointments'),
          fetch('https://your-backend.com/api/doctors')
        ]);

        if (!appointmentsRes.ok || !doctorsRes.ok) throw new Error('Failed to fetch data');

        const appointmentsData: Appointment[] = await appointmentsRes.json();
        const doctorsData: Doctor[] = await doctorsRes.json();

        setAppointments(appointmentsData);
        setDoctors(doctorsData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addAppointment = async () => {
    if (!newAppointment.title || !newAppointment.doctor || !newAppointment.date || !newAppointment.time) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const response = await fetch('https://your-backend.com/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment)
      });

      if (!response.ok) throw new Error('Failed to add appointment');

      const savedAppointment: Appointment = await response.json();
      setAppointments(prev => [...prev, savedAppointment]);
      setShowAddModal(false);
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
      Alert.alert('Success', 'Appointment scheduled successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to schedule appointment');
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`https://your-backend.com/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' })
              });

              if (!response.ok) throw new Error('Failed to cancel appointment');

              setAppointments(prev =>
                prev.map(apt => apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt)
              );
              Alert.alert('Cancelled', 'Appointment has been cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel appointment');
            }
          }
        }
      ]
    );
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text>Loading...</Text>
    </View>
  );

  if (error) return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text style={{ color: 'red' }}>{error}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Appointments</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={24} color={Colors.buttonText} />
          </TouchableOpacity>
        </View>

        {appointments.map((appointment) => (
          <View key={appointment.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{appointment.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                <Text style={styles.statusBadgeText}>{appointment.status}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{appointment.doctor}</Text>
            <Text style={styles.cardDate}>{formatDate(appointment.date)} • {appointment.time}</Text>
            <Text style={styles.cardLoc}>{appointment.location}</Text>

            {appointment.status === 'scheduled' && (
              <TouchableOpacity style={styles.cancelButton} onPress={() => cancelAppointment(appointment.id)}>
                <Ionicons name="close-circle" size={18} color="white" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Appointment</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput style={styles.textInput} value={newAppointment.title} onChangeText={text => setNewAppointment(prev => ({ ...prev, title: text }))} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Doctor</Text>
              <TextInput style={styles.textInput} value={newAppointment.doctor} onChangeText={text => setNewAppointment(prev => ({ ...prev, doctor: text }))} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput style={styles.textInput} value={newAppointment.date} onChangeText={text => setNewAppointment(prev => ({ ...prev, date: text }))} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Time</Text>
              <TextInput style={styles.textInput} value={newAppointment.time} onChangeText={text => setNewAppointment(prev => ({ ...prev, time: text }))} />
            </View>

            <TouchableOpacity style={styles.addAppointmentButton} onPress={addAppointment}>
              <Text style={styles.addAppointmentButtonText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// Keep your existing styles as-is


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 8
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: 14, color: Colors.mutedText, marginTop: 4 },
  cardDate: { fontSize: 14, color: Colors.primary, marginTop: 2 },
  cardLoc: { fontSize: 14, color: Colors.mutedText, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  statusBadgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    alignSelf: 'flex-start'
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6
  },
  modalContainer: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 14, color: Colors.mutedText, marginBottom: 4 },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16
  },
  addAppointmentButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  addAppointmentButtonText: { color: 'white', fontWeight: '600' }
});
