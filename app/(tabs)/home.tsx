import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Pedometer } from "expo-sensors";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

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
  ({
    shouldShowAlert: true,
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
  const { colors, theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user, requireAuth } = useAuth();

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
    { label: t("stepsToday"), value: "0", icon: "walk", trend: "up" },
    { label: t("heartRate"), value: `72 ${t("bpm")}`, icon: "heart", trend: "stable" },
    { label: t("sleepQuality"), value: `7.5 ${t("hrs")}`, icon: "moon", trend: "up" },
    { label: t("hydration"), value: `6/8 ${t("cups")}`, icon: "water", trend: "down" },
  ]);

  const [upcomingEvents, setUpcomingEvents] = useState([
    { time: "10:00 AM", title: t("takeMorningMedication"), type: "medication" },
    { time: "2:00 PM", title: t("doctorAppointment"), type: "appointment" },
    { time: "6:00 PM", title: t("eveningWalkReminder"), type: "activity" },
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
      { label: t("stepsToday"), value: steps.toLocaleString(), icon: "walk", trend: steps > 5000 ? "up" : "down" },
      { label: t("heartRate"), value: `${heartRate} ${t("bpm")}`, icon: "heart", trend: "stable" },
      { label: t("sleepQuality"), value: `${sleepHours} ${t("hrs")}`, icon: "moon", trend: sleepHours >= 7 ? "up" : "down" },
      { label: t("hydration"), value: `${waterIntake}/8 ${t("cups")}`, icon: "water", trend: waterIntake >= 6 ? "up" : "down" },
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
    requireAuth(async () => {
      // Send to API
      await fetchFromAPI(API_CONFIG.ENDPOINTS.FAMILY_CALL, {
        method: 'POST',
        body: JSON.stringify({ callType: 'video' })
      });

      // Navigate to video call screen
      router.push("/VideoCallScreen");
    });
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
    requireAuth(() => {
      router.push("/reminders");
    });
  };

  const handleAIChat = async () => {
    requireAuth(() => {
      // await fetchAIMessage(); // Optional: Refresh message before entering
      router.push("/chatbot");
    });
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
    if (hour < 12) setGreeting(t("goodMorning"));
    else if (hour < 18) setGreeting(t("goodAfternoon"));
    else setGreeting(t("goodEvening"));

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
      title: t("emergencySOS"),
      icon: "warning",
      color: colors.error,
      action: handleEmergencySOS,
    },
    {
      title: t("callFamily"),
      icon: "call",
      color: colors.primary,
      action: handleFamilyCall,
    },
    {
      title: t("healthCheck"),
      icon: "heart",
      color: colors.success,
      action: handleHealthCheck,
    },
    {
      title: t("reminders"),
      icon: "alarm",
      color: colors.warning,
      action: handleReminders,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.primary }]}>{greeting}!</Text>
        <Text style={[styles.time, { color: colors.text }]}>
          {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <Text style={[styles.date, { color: colors.mutedText }]}>
          {currentTime.toLocaleDateString(i18n.language, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {!user && (
        <TouchableOpacity
          style={[styles.guestCta, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
          onPress={() => router.push("/auth/login")}
        >
          <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
          <View style={styles.guestCtaContent}>
            <Text style={[styles.guestCtaTitle, { color: colors.primary }]}>{t("signInToUnlock") || "Sign in to unlock full access"}</Text>
            <Text style={[styles.guestCtaSubtitle, { color: colors.mutedText }]}>
              {t("guestModeMessage") || "Enjoy personalized health tracking and stay connected with your family."}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* QUICK ACTIONS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("quickActions")}</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionCard, { backgroundColor: action.color }]}
              onPress={action.action}
            >
              <Ionicons name={action.icon as any} size={24} color={colors.buttonText} />
              <Text style={[styles.quickActionText, { color: colors.buttonText }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* REMINDER MODAL */}
      <Modal visible={showReminderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.appleModalBox, { backgroundColor: theme === 'dark' ? colors.card : "#F2F2F7" }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => {
                  setShowReminderModal(false);
                  setMode("date");
                }}
              >
                <Text style={styles.cancelText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>{t("addReminder")}</Text>
              <TouchableOpacity onPress={scheduleReminder}>
                <Text style={styles.saveText}>{t("saveChanges")}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.timeDisplayContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.selectedTimeLabel, { color: colors.mutedText }]}>{t("remindMeAt")}</Text>
              <Text style={[styles.selectedTime, { color: colors.text }]}>
                {selectedDate.toLocaleString()}
              </Text>
            </View>

            <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={selectedDate}
                  mode="datetime"
                  display="spinner"
                  onChange={onChange}
                  textColor={colors.text}
                  style={styles.iosDatePicker}
                  minimumDate={new Date()}
                  themeVariant={theme}
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
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("todaysHealthSummary")}</Text>
        <View style={styles.metricsGrid}>
          {healthMetrics.map((metric, index) => (
            <View key={index} style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <View style={styles.metricHeader}>
                <Ionicons name={metric.icon as any} size={20} color={colors.primary} />
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
                      ? colors.success
                      : metric.trend === "down"
                        ? colors.warning
                        : colors.mutedText
                  }
                />
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedText }]}>{metric.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* UPCOMING EVENTS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("todaysSchedule")}</Text>
        {upcomingEvents.map((event, index) => (
          <View key={index} style={[styles.eventCard, { backgroundColor: colors.card }]}>
            <View style={[styles.eventTime, { borderRightColor: colors.primary }]}>
              <Text style={[styles.eventTimeText, { color: colors.primary }]}>{event.time}</Text>
            </View>
            <View style={styles.eventContent}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
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
                  color={colors.primary}
                />
                <Text style={[styles.eventTypeText, { color: colors.mutedText }]}>{event.type}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* AI COMPANION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("yourAICompanion")}</Text>
        <View style={[styles.companionCard, { backgroundColor: colors.card }]}>
          <Ionicons name="chatbubble-ellipses" size={32} color={colors.primary} />
          <View style={styles.companionContent}>
            <Text style={[styles.companionTitle, { color: colors.text }]}>{t("elderBotHelp")}</Text>
            <Text style={[styles.companionMessage, { color: colors.mutedText }]}>"{aiMessage}"</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.chatButton, { backgroundColor: colors.primary }]} onPress={handleAIChat}>
          <Text style={[styles.chatButtonText, { color: colors.buttonText }]}>{t("startConversation")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ----------------------------------------------------
   STYLES
---------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  header: { alignItems: "center", marginBottom: 30, paddingVertical: 20 },
  greeting: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  time: { fontSize: 36, fontWeight: "300", marginBottom: 4 },
  date: { fontSize: 16 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
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
  quickActionText: { fontWeight: "600", marginTop: 8 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  appleModalBox: {
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 0.5,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: "600",
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
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  selectedTimeLabel: {
    fontSize: 13,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectedTime: {
    fontSize: 22,
    fontWeight: "600",
  },
  pickerContainer: {
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
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
  },

  // Upcoming events
  eventCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventTime: {
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 2,
  },
  eventTimeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  eventType: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventTypeText: {
    fontSize: 12,
    marginLeft: 4,
    textTransform: "capitalize",
  },

  // Companion
  companionCard: {
    flexDirection: "row",
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
    marginBottom: 4,
  },
  companionMessage: {
    fontSize: 14,
    fontStyle: "italic",
  },
  chatButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  guestCta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  guestCtaContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  guestCtaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  guestCtaSubtitle: {
    fontSize: 13,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});