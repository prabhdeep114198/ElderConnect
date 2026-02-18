import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
<<<<<<< HEAD
import { useAuth } from "../../context/AuthContext";
import { getTicketsKey } from "../../utils/userStorageKeys";
import { profileService } from "../../services/api/profile";
=======
import { InteractionType, personalizationService } from "../../services/api/personalization";
>>>>>>> 920d16f1c023befab58238e8f1284ccfab3262ff

interface Event {
  id: string;
  name: string;
  start: string;
  end: string;
  category: string;
  description?: string;
}

interface Ticket {
  ticketId: string;
  eventId: string;
  eventName: string;
  attendeeName: string;
  date: string;
  location: string;
  category: string;
}

export default function EventDetailsPage() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const { id, event: eventParam } = useLocalSearchParams();

  // Registration Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");

  useEffect(() => {
    if (eventParam) {
      setEvent(JSON.parse(eventParam as string));
    }
  }, [eventParam]);

  const generateTicketId = () => {
    return `TKT-${Math.floor(Math.random() * 10000)}-${Date.now().toString().slice(-4)}`;
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !age.trim()) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    if (!event || !user?.id) return;

    try {
      // 1. Persist on Server
      await profileService.joinSocialEvent(user.id, event.id);

      // 2. Save locally for "My Tickets"
      const ticketsKey = getTicketsKey(user.id);
      const storedTickets = await AsyncStorage.getItem(ticketsKey);
      const tickets: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];

      // Check for duplicate registration locally
      if (tickets.find((t) => t.eventId === event.id)) {
        Alert.alert("Already Registered", "You already have a ticket for this event.");
        setModalVisible(false);
        return;
      }

      const newTicket: Ticket = {
        ticketId: generateTicketId(),
        eventId: event.id,
        eventName: event.name,
        attendeeName: name,
        date: event.start,
        location: "Venue details unavailable",
        category: event.category,
      };

      tickets.push(newTicket);
      await AsyncStorage.setItem(ticketsKey, JSON.stringify(tickets));

      // Track interaction for personalization
      await personalizationService.trackInteraction(InteractionType.EVENT_JOIN, {
        id: event.id,
        name: event.name,
        category: event.category
      });

      setModalVisible(false);

      Alert.alert(
        "Registration Successful!",
        "Your ticket has been generated. You can view it in 'My Events'.",
        [
          { text: "View Ticket", onPress: () => router.push("/events/my-events") },
          { text: "OK" }
        ]
      );

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to generate ticket.";
      Alert.alert("Error", msg);
    }
  };

  if (!event) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Event Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{event.name}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {new Date(event.start).toLocaleString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{event.category}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionHeader, { color: colors.text }]}>About</Text>
        <Text style={[styles.description, { color: colors.mutedText }]}>
          {event.description || "No description available for this event."}
        </Text>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.registerButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.registerButtonText, { color: colors.buttonText }]}>Register for Event</Text>
        </TouchableOpacity>
      </View>

      {/* Registration Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Register</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.mutedText }]}>
              Please provide your details to generate a ticket.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your full name"
                placeholderTextColor={colors.mutedText}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.mutedText}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Age</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your age"
                placeholderTextColor={colors.mutedText}
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleRegister}
            >
              <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>Confirm Registration</Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  infoText: {
    fontSize: 16,
    marginLeft: 10
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  registerButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  modalSubtitle: {
    marginBottom: 24,
    fontSize: 14
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16
  },
  confirmButton: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold'
  }
});
