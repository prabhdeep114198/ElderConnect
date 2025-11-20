import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Pedometer } from "expo-sensors";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";

const { width } = Dimensions.get("window");

// ============================================
// API CONFIGURATION - JUST CHANGE THESE URLs
// ============================================
const API_CONFIG = {
  BASE_URL: 'https://your-api.com/api', // Change this to your backend URL
  ENDPOINTS: {
    HEALTH_METRICS: '/health/metrics',
    SCHEDULE: '/schedule/today',
    EMERGENCY_CONTACT: '/emergency/sos',
    FAMILY_CALL: '/family/call',
    REMINDERS: '/reminders',
    AI_COMPANION: '/ai/message',
    UPDATE_HEALTH: '/health/update'
  },
  // Add your auth token here if needed
  AUTH_TOKEN: 'your-auth-token-here'
};

// NOTIFICATION HANDLER
Notifications.setNotificationHandler({ 
  handleNotification: async () => 
    ({ shouldShowAlert: true, 
      shouldPlaySound: true, 
      shouldSetBadge: false, 
      shouldShowBanner: true, 
      shouldShowList: true, 
    }), 
});

// ANDROID CHANNEL
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "alarm.wav",
  });
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mode, setMode] = useState<"date" | "time">("date");

  const [savedReminders, setSavedReminders] = useState<any[]>([]);

  // Health tracking states
  const [steps, setSteps] = useState(0);
  const [heartRate, setHeartRate] = useState(72);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [waterIntake, setWaterIntake] = useState(6);

  const [healthMetrics, setHealthMetrics] = useState([
    { label: "Steps Today", value: "0", icon: "walk", trend: "up" },
    { label: "Heart Rate", value: "72 bpm", icon: "heart", trend: "stable" },
    { label: "Sleep Quality", value: "7.5 hrs", icon: "moon", trend: "up" },
    { label: "Hydration", value: "6/8 cups", icon: "water", trend: "down" },
  ]);

  const [upcomingEvents, setUpcomingEvents] = useState([
    { time: "10:00 AM", title: "Take Morning Medication", type: "medication" },
    { time: "2:00 PM", title: "Doctor Appointment", type: "appointment" },
    { time: "6:00 PM", title: "Evening Walk Reminder", type: "activity" },
  ]);

  const [aiMessage, setAiMessage] = useState(
    "Remember to take your afternoon medication in 2 hours. Would you like me to set a reminder?"
  );

  // ============================================
  // API FUNCTIONS
  // ============================================
  const fetchFromAPI = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const mergedHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.AUTH_TOKEN}`,
        ...(options.headers as Record<string, string> | undefined),
      };
  
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        headers: mergedHeaders,
      });
      
      if (!response.ok) {
        console.log(`API Error: ${response.status}`);
        return null;
      }
      
      // Safely parse JSON (some endpoints may return empty responses)
      const text = await response.text();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      console.log(`API Fetch Error (${endpoint}):`, error);
      return null;
    }
  };

  const fetchHealthMetrics = async () => {
    const data = await fetchFromAPI(API_CONFIG.ENDPOINTS.HEALTH_METRICS);
    if (data && data.metrics) {
      setHealthMetrics(data.metrics);
      // Update individual values
      data.metrics.forEach((metric: any) => {
        if (metric.label === "Steps Today") setSteps(parseInt(metric.value.replace(/,/g, '')));
        if (metric.label === "Heart Rate") setHeartRate(parseInt(metric.value));
        if (metric.label === "Sleep Quality") setSleepHours(parseFloat(metric.value));
        if (metric.label === "Hydration") setWaterIntake(parseInt(metric.value.split('/')[0]));
      });
    }
  };

  const fetchSchedule = async () => {
    const data = await fetchFromAPI(API_CONFIG.ENDPOINTS.SCHEDULE);
    if (data && data.events) {
      setUpcomingEvents(data.events);
    }
  };

  const fetchAIMessage = async () => {
    const data = await fetchFromAPI(API_CONFIG.ENDPOINTS.AI_COMPANION);
    if (data && data.message) {
      setAiMessage(data.message);
    }
  };

  const updateHealthData = async (type: string, value: any) => {
    await fetchFromAPI(API_CONFIG.ENDPOINTS.UPDATE_HEALTH, {
      method: 'POST',
      body: JSON.stringify({ type, value, timestamp: new Date().toISOString() })
    });
  };

  // ============================================
  // STEP TRACKING
  // ============================================
  const startStepTracking = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (isAvailable) {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const result = await Pedometer.getStepCountAsync(start, end);
      if (result) {
        setSteps(result.steps);
        updateHealthMetrics();
      }

      // Subscribe to updates
      interface StepCountResult {
        steps: number;
      }

      const pedometerSubscription = Pedometer.watchStepCount((result: StepCountResult) => {
        setSteps(result.steps);
        updateHealthMetrics();
      });
    }
  };

  const updateHealthMetrics = () => {
    setHealthMetrics([
      { label: "Steps Today", value: steps.toLocaleString(), icon: "walk", trend: steps > 5000 ? "up" : "down" },
      { label: "Heart Rate", value: `${heartRate} bpm`, icon: "heart", trend: "stable" },
      { label: "Sleep Quality", value: `${sleepHours} hrs`, icon: "moon", trend: sleepHours >= 7 ? "up" : "down" },
      { label: "Hydration", value: `${waterIntake}/8 cups`, icon: "water", trend: waterIntake >= 6 ? "up" : "down" },
    ]);
  };

  // ============================================
  // REMINDER FUNCTIONS
  // ============================================
  const loadReminders = async () => {
    // Try API first
    const data = await fetchFromAPI(API_CONFIG.ENDPOINTS.REMINDERS);
    if (data && data.reminders) {
      setSavedReminders(data.reminders);
    } else {
      // Fallback to local storage
      const localData = await AsyncStorage.getItem("reminders");
      if (localData) setSavedReminders(JSON.parse(localData));
    }
  };

  const saveReminder = async (reminder: any) => {
    // Save to API
    await fetchFromAPI(API_CONFIG.ENDPOINTS.REMINDERS, {
      method: 'POST',
      body: JSON.stringify(reminder)
    });

    // Save locally as backup
    const updated = [...savedReminders, reminder];
    await AsyncStorage.setItem("reminders", JSON.stringify(updated));
    setSavedReminders(updated);
  };

  const scheduleReminder = async () => {
    try {
      if (selectedDate <= new Date()) {
        Alert.alert("Invalid Time", "Please select a future time.");
        return;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Reminder",
          body: "It's time! Your reminder is here.",
          sound: "alarm.wav",
        },
        trigger: {
          date: selectedDate,
        } as Notifications.DateTriggerInput,
      });

      await saveReminder({
        id: notificationId,
        date: selectedDate,
      });

      setShowReminderModal(false);

      Alert.alert(
        "Reminder Set",
        `Reminder will ring at ${selectedDate.toLocaleString()}`
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not set reminder.");
    }
  };

  const onChange = (event: any, date?: Date) => {
    if (Platform.OS === "android" && event.type === "dismissed") return;

    if (date) {
      setSelectedDate(date);

      if (Platform.OS === "android" && mode === "date") {
        setMode("time");
      }
    }
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================
  const handleEmergencySOS = async () => {
    Alert.alert(
      "Emergency SOS",
      "Calling emergency services and notifying family...",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Now",
          style: "destructive",
          onPress: async () => {
            // Send to API
            await fetchFromAPI(API_CONFIG.ENDPOINTS.EMERGENCY_CONTACT, {
              method: 'POST',
              body: JSON.stringify({
                location: 'Home',
                timestamp: new Date().toISOString(),
                type: 'manual_trigger'
              })
            });

            // Make actual emergency call
            const emergencyNumber = Platform.OS === 'ios' ? 'telprompt:911' : 'tel:911';
            Linking.openURL(emergencyNumber);
          },
        },
      ]
    );
  };

  const handleFamilyCall = async () => {
    // Send to API
    await fetchFromAPI(API_CONFIG.ENDPOINTS.FAMILY_CALL, {
      method: 'POST',
      body: JSON.stringify({ callType: 'video' })
    });

    // Navigate to video call screen
    router.push("/VideoCallScreen");
  };

  const handleHealthCheck = async () => {
    Alert.alert("Health Check", "Refreshing your health data...");
    
    // Update health metrics
    await updateHealthData('steps', steps);
    await updateHealthData('heartRate', heartRate);
    await updateHealthData('sleep', sleepHours);
    await updateHealthData('water', waterIntake);
    
    // Fetch latest from API
    await fetchHealthMetrics();
    
    Alert.alert("Health Check Complete", "All health metrics updated!");
  };

  const handleReminders = () => {
    setSelectedDate(new Date(Date.now() + 60000));
    setMode("date");
    setShowReminderModal(true);
  };

  const handleAIChat = async () => {
    await fetchAIMessage();
    Alert.alert("AI Companion", "Starting conversation with ElderBot...");
    // Navigate to chat screen or show chat modal
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please enable notifications.");
      }
    };

    requestPermissions();
    loadReminders();
    startStepTracking();

    // Fetch data from API
    fetchHealthMetrics();
    fetchSchedule();
    fetchAIMessage();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchHealthMetrics();
      fetchSchedule();
      fetchAIMessage();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(timer);
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    updateHealthMetrics();
  }, [steps, heartRate, sleepHours, waterIntake]);

  // ============================================
  // UI CONFIGURATION
  // ============================================
  const quickActions = [
    {
      title: "Emergency SOS",
      icon: "warning",
      color: Colors.error,
      action: handleEmergencySOS,
    },
    {
      title: "Call Family",
      icon: "call",
      color: Colors.primary,
      action: handleFamilyCall,
    },
    {
      title: "Health Check",
      icon: "heart",
      color: Colors.success,
      action: handleHealthCheck,
    },
    {
      title: "Reminders",
      icon: "alarm",
      color: Colors.warning,
      action: handleReminders,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}!</Text>
        <Text style={styles.time}>
          {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <Text style={styles.date}>
          {currentTime.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionCard, { backgroundColor: action.color }]}
              onPress={action.action}
            >
              <Ionicons name={action.icon as any} size={24} color={Colors.buttonText} />
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* REMINDER MODAL */}
      <Modal visible={showReminderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.appleModalBox}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowReminderModal(false);
                  setMode("date");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Add Reminder</Text>
              <TouchableOpacity onPress={scheduleReminder}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeDisplayContainer}>
              <Text style={styles.selectedTimeLabel}>Remind me at</Text>
              <Text style={styles.selectedTime}>
                {selectedDate.toLocaleString()}
              </Text>
            </View>

            <View style={styles.pickerContainer}>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={selectedDate}
                  mode="datetime"
                  display="spinner"
                  onChange={onChange}
                  textColor={Colors.text}
                  style={styles.iosDatePicker}
                  minimumDate={new Date()}
                />
              ) : (
                <>
                  <DateTimePicker
                    value={selectedDate}
                    mode={mode}
                    display="default"
                    onChange={onChange}
                    minimumDate={new Date()}
                  />
                  {mode === "date" && (
                    <Text style={styles.androidHint}>Select date, then time</Text>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* HEALTH METRICS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Health Summary</Text>
        <View style={styles.metricsGrid}>
          {healthMetrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name={metric.icon as any} size={20} color={Colors.primary} />
                <Ionicons
                  name={
                    metric.trend === "up"
                      ? "trending-up"
                      : metric.trend === "down"
                      ? "trending-down"
                      : "remove"
                  }
                  size={16}
                  color={
                    metric.trend === "up"
                      ? Colors.success
                      : metric.trend === "down"
                      ? Colors.warning
                      : Colors.mutedText
                  }
                />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* UPCOMING EVENTS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {upcomingEvents.map((event, index) => (
          <View key={index} style={styles.eventCard}>
            <View style={styles.eventTime}>
              <Text style={styles.eventTimeText}>{event.time}</Text>
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.eventType}>
                <Ionicons
                  name={
                    event.type === "medication"
                      ? "medkit"
                      : event.type === "appointment"
                      ? "calendar"
                      : "walk"
                  }
                  size={14}
                  color={Colors.primary}
                />
                <Text style={styles.eventTypeText}>{event.type}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* AI COMPANION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your AI Companion</Text>
        <View style={styles.companionCard}>
          <Ionicons name="chatbubble-ellipses" size={32} color={Colors.primary} />
          <View style={styles.companionContent}>
            <Text style={styles.companionTitle}>ElderBot is here to help!</Text>
            <Text style={styles.companionMessage}>"{aiMessage}"</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.chatButton} onPress={handleAIChat}>
          <Text style={styles.chatButtonText}>Start Conversation</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ----------------------------------------------------
   STYLES
---------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: 20 },
  header: { alignItems: "center", marginBottom: 30, paddingVertical: 20 },
  greeting: { fontSize: 28, fontWeight: "bold", color: Colors.primary, marginBottom: 8 },
  time: { fontSize: 36, fontWeight: "300", color: Colors.text, marginBottom: 4 },
  date: { fontSize: 16, color: Colors.mutedText },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: Colors.text, marginBottom: 16 },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionText: { color: Colors.buttonText, fontWeight: "600", marginTop: 8 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  appleModalBox: {
    backgroundColor: "#F2F2F7",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    minHeight: Platform.OS === "ios" ? 450 : "auto",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#C6C6C8",
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  cancelText: {
    fontSize: 17,
    color: "#007AFF",
  },
  saveText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
  },
  timeDisplayContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  selectedTimeLabel: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectedTime: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: Platform.OS === "ios" ? 0 : 20,
  },
  iosDatePicker: {
    height: 200,
  },
  androidHint: {
    textAlign: "center",
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 12,
  },

  // Health metrics
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: (width - 60) / 2,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.mutedText,
  },

  // Upcoming events
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventTime: {
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 2,
    borderRightColor: Colors.primary,
  },
  eventTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  eventType: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventTypeText: {
    fontSize: 12,
    color: Colors.mutedText,
    marginLeft: 4,
    textTransform: "capitalize",
  },

  // Companion
  companionCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  companionContent: {
    flex: 1,
    marginLeft: 12,
  },
  companionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  companionMessage: {
    fontSize: 14,
    color: Colors.mutedText,
    fontStyle: "italic",
  },
  chatButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  chatButtonText: {
    color: Colors.buttonText,
    fontSize: 16,
    fontWeight: "600",
  },
});