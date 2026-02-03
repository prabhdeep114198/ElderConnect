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

import { profileService } from "../../services/api/profile";
import { deviceService } from "../../services/api/device";
import { getRemindersKey } from "../../utils/userStorageKeys";

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
  const { colors, theme, uiMode, fontSize } = useTheme();
  const { t, i18n } = useTranslation();
  const { user, requireAuth } = useAuth();

  const isSenior = uiMode === "senior";

  const getFontSize = (base: number) => {
    const scales: any = { small: 0.9, medium: 1, large: 1.2, extraLarge: 1.5 };
    return base * (scales[fontSize] || 1);
  };

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

  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const [aiMessage, setAiMessage] = useState<string>(t("aiGreeting") || "Select a feature to get started.");

  // ============================================
  // API FUNCTIONS
  // ============================================
  const fetchHealthMetrics = async () => {
    if (!user) return;
    try {
      const response: any = await profileService.getDailyMetrics(user.id);
      if (response && response.data && response.data.metrics) {
        setHealthMetrics(response.data.metrics);
        const raw = response.data.raw;
        if (raw) {
          if (raw.heartRate) setHeartRate(raw.heartRate);
          if (raw.sleepHours) setSleepHours(raw.sleepHours);
          if (raw.waterIntake) setWaterIntake(raw.waterIntake);
        }
      }
    } catch (error) {
      console.log("Failed to fetch health metrics:", error);
    }
  };

  const fetchSchedule = async () => {
    if (!user) return;
    try {
      // Get medications and appointments and merge them for the schedule
      const [medsRes, apptsRes]: any = await Promise.all([
        profileService.getMedicationReminders(user.id),
        profileService.getAppointments(user.id)
      ]);

      const events: any[] = [];
      const now = new Date();

      if (medsRes && medsRes.data && medsRes.data.reminders) {
        medsRes.data.reminders.forEach((r: any) => {
          const scheduledTime = new Date(r.scheduledTime);
          // Only show if it's today or in the future
          if (scheduledTime >= now || scheduledTime.toDateString() === now.toDateString()) {
            events.push({
              time: scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: r.medicationName,
              type: 'medication',
              timestamp: scheduledTime.getTime()
            });
          }
        });
      }

      if (apptsRes && apptsRes.data && apptsRes.data.appointments) {
        apptsRes.data.appointments.forEach((a: any) => {
          const scheduledAt = new Date(a.scheduledAt);
          // Only show if it's today or in the future
          if (scheduledAt >= now || scheduledAt.toDateString() === now.toDateString()) {
            events.push({
              time: scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: a.title,
              type: 'appointment',
              timestamp: scheduledAt.getTime()
            });
          }
        });
      }

      setUpcomingEvents(events.sort((a, b) => a.timestamp - b.timestamp));
    } catch (error) {
      console.log("Failed to fetch schedule:", error);
    }
  };


  const updateHealthData = async (type: string, value: any) => {
    if (!user) return;
    try {
      await profileService.updateHealthMetric(user.id, { type, value });
    } catch (error) {
      console.log("Failed to update health metric:", error);
    }
  };

  const fetchAIMessage = async () => {
    // This could call a specialized AI service or use the companion chat history
    setAiMessage(t("aiDefaultTip") || "Staying active is the key to longevity. Have you taken your steps today?");
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
    if (!user) return;
    try {
      const response: any = await profileService.getMedicationReminders(user.id);
      if (response && response.data && response.data.reminders) {
        setSavedReminders(response.data.reminders);
      }
    } catch (error) {
      console.log("Failed to load reminders:", error);
      // Fallback to local storage
      const localData = await AsyncStorage.getItem(getRemindersKey(user.id));
      if (localData) setSavedReminders(JSON.parse(localData));
    }
  };

  const saveReminder = async (reminder: any) => {
    // Reminders are managed via medications or system-wide alerts now
    // This is a local helper for the temporary manual reminder

    // Save locally as backup
    const updated = [...savedReminders, reminder];
    await AsyncStorage.setItem(getRemindersKey(user?.id || ''), JSON.stringify(updated));
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
    try {
      // Fetch user profile to get emergency contacts
      let emergencyContacts: any[] = [];

      if (user?.id) {
        try {
          const profileResponse: any = await profileService.getProfile(user.id);
          if (profileResponse?.data?.profile?.emergencyContacts) {
            emergencyContacts = profileResponse.data.profile.emergencyContacts;
          }
        } catch (error) {
          console.log("Failed to fetch emergency contacts:", error);
        }
      }

      // Log SOS event to backend
      if (user) {
        await deviceService.createSOS(user.id, {
          location: 'Home',
          type: 'manual_trigger'
        });
      }

      // Build alert options
      const alertButtons: any[] = [
        { text: "Cancel", style: "cancel" }
      ];

      // Add caregiver/family contact options
      if (emergencyContacts.length > 0) {
        emergencyContacts.slice(0, 2).forEach((contact) => {
          alertButtons.unshift({
            text: `📞 Call ${contact.name} (${contact.relation})`,
            onPress: () => {
              const phoneNumber = contact.phone.replace(/[^0-9+]/g, '');
              const telUrl = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
              Linking.openURL(telUrl);
            }
          });
        });
      }

      // Add 911 option
      alertButtons.unshift({
        text: "🚨 Call 911 Emergency",
        style: "destructive",
        onPress: () => {
          const emergencyNumber = Platform.OS === 'ios' ? 'telprompt:911' : 'tel:911';
          Linking.openURL(emergencyNumber);
        }
      });

      Alert.alert(
        "🆘 Emergency SOS",
        emergencyContacts.length > 0
          ? "Who would you like to call for help?"
          : "Emergency services will be notified immediately.",
        alertButtons
      );
    } catch (error) {
      console.error("SOS Error:", error);
      Alert.alert("Error", "Failed to activate SOS. Please call emergency services directly.");
    }
  };

  const handleFamilyCall = async () => {
    requireAuth(async () => {
      // Typically would notify family/system of the call
      if (user) {
        // Optional: record call event
      }

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

    // Sync to backend periodically or on change (debounced)
    const timeoutId = setTimeout(() => {
      if (user) {
        updateHealthData('steps', steps);
        updateHealthData('heartRate', heartRate);
        updateHealthData('sleep', sleepHours);
        updateHealthData('water', waterIntake);
      }
    }, 5000); // 5 second debounce to avoid spamming API on every step

    return () => clearTimeout(timeoutId);
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
        <Text style={[styles.greeting, { color: colors.primary, fontSize: getFontSize(isSenior ? 34 : 28) }]}>{greeting}!</Text>
        <Text style={[styles.time, { color: colors.text, fontSize: getFontSize(isSenior ? 48 : 36) }]}>
          {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        {!isSenior && (
          <Text style={[styles.date, { color: colors.mutedText, fontSize: getFontSize(16) }]}>
            {currentTime.toLocaleDateString(i18n.language, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        )}
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
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(20) }]}>{t("quickActions")}</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickActionCard,
                { backgroundColor: action.color },
                isSenior && { width: '100%', flexDirection: 'row', justifyContent: 'center', height: 80 }
              ]}
              onPress={action.action}
            >
              <Ionicons name={action.icon as any} size={isSenior ? 32 : 24} color={colors.buttonText} />
              <Text style={[
                styles.quickActionText,
                { color: colors.buttonText, fontSize: getFontSize(isSenior ? 20 : 16) },
                isSenior && { marginLeft: 15, marginTop: 0 }
              ]}>
                {action.title}
              </Text>
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
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(20) }]}>{t("todaysHealthSummary")}</Text>
        <View style={styles.metricsGrid}>
          {healthMetrics.map((metric, index) => (
            <View key={index} style={[
              styles.metricCard,
              { backgroundColor: colors.card },
              isSenior && { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }
            ]}>
              <View style={[styles.metricHeader, isSenior && { marginBottom: 0, marginRight: 15 }]}>
                <Ionicons name={metric.icon as any} size={isSenior ? 28 : 20} color={colors.primary} />
                {!isSenior && (
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
                )}
              </View>
              <View style={isSenior && { flex: 1 }}>
                <Text style={[styles.metricValue, { color: colors.text, fontSize: getFontSize(isSenior ? 24 : 20) }]}>{metric.value}</Text>
                <Text style={[styles.metricLabel, { color: colors.mutedText, fontSize: getFontSize(14) }]}>{metric.label}</Text>
              </View>
              {isSenior && (
                <Ionicons
                  name={
                    metric.trend === "up" ? "arrow-up-circle" : metric.trend === "down" ? "arrow-down-circle" : "remove-circle"
                  }
                  size={24}
                  color={metric.trend === "up" ? colors.success : metric.trend === "down" ? colors.warning : colors.mutedText}
                />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* UPCOMING EVENTS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(20) }]}>{t("todaysSchedule")}</Text>
        {upcomingEvents.map((event, index) => (
          <View key={index} style={[styles.eventCard, { backgroundColor: colors.card }, isSenior && { padding: 20 }]}>
            <View style={[styles.eventTime, { borderRightColor: colors.primary }, isSenior && { minWidth: 80 }]}>
              <Text style={[styles.eventTimeText, { color: colors.primary, fontSize: getFontSize(16) }]}>{event.time}</Text>
            </View>
            <View style={styles.eventContent}>
              <Text style={[styles.eventTitle, { color: colors.text, fontSize: getFontSize(18) }]}>{event.title}</Text>
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
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(20) }]}>{t("yourAICompanion")}</Text>
        <View style={[styles.companionCard, { backgroundColor: colors.card }, isSenior && { padding: 25 }]}>
          <Ionicons name="chatbubble-ellipses" size={isSenior ? 48 : 32} color={colors.primary} />
          <View style={styles.companionContent}>
            <Text style={[styles.companionTitle, { color: colors.text, fontSize: getFontSize(18) }]}>{t("elderBotHelp")}</Text>
            <Text style={[styles.companionMessage, { color: colors.mutedText, fontSize: getFontSize(16) }]}>"{aiMessage}"</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.chatButton, { backgroundColor: colors.primary, height: isSenior ? 70 : 56, justifyContent: 'center' }]} onPress={handleAIChat}>
          <Text style={[styles.chatButtonText, { color: colors.buttonText, fontSize: getFontSize(18), fontWeight: 'bold' }]}>{t("startConversation")}</Text>
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