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

import { usePersonalization } from "../../hooks/usePersonalization";
import { deviceService } from "../../services/api/device";
import { InteractionType, personalizationService } from "../../services/api/personalization";
import { profileService } from "../../services/api/profile";

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

  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const [aiMessage, setAiMessage] = useState<string>(t("aiGreeting") || "Select a feature to get started.");

  const { data: personalizationData, loading: personalizationLoading, refetch: refetchPersonalization } = usePersonalization();

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

      if (medsRes && medsRes.data && medsRes.data.reminders) {
        medsRes.data.reminders.forEach((r: any) => {
          events.push({
            time: new Date(r.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: r.medicationName,
            type: 'medication'
          });
        });
      }

      if (apptsRes && apptsRes.data && apptsRes.data.appointments) {
        apptsRes.data.appointments.forEach((a: any) => {
          events.push({
            time: new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: a.title,
            type: 'appointment'
          });
        });
      }

      setUpcomingEvents(events.sort((a, b) => a.time.localeCompare(b.time)));
    } catch (error) {
      console.log("Failed to fetch schedule:", error);
    }
  };


  const updateHealthData = async (type: string, value: any) => {
    if (!user || !user.id) return;
    try {
      await profileService.updateHealthMetric(user.id, { type, value });
    } catch (error) {
      console.log("Failed to update health metric:", error);
    }
  };

  const fetchAIMessage = async () => {
    if (personalizationData?.dailyBriefing) {
      setAiMessage(personalizationData.dailyBriefing);
    } else {
      setAiMessage(t("aiDefaultTip") || "Staying active is the key to longevity. Have you taken your steps today?");
    }
  };

  // Smart Notifications based on personalization
  useEffect(() => {
    if (personalizationData?.recommendations) {
      // Track views
      personalizationData.recommendations.forEach(rec => {
        personalizationService.trackInteraction(InteractionType.CONTENT_VIEW, {
          title: rec.title,
          type: rec.type,
        });
      });

      const highPriority = personalizationData.recommendations.filter(r => r.priority === 'high');
      highPriority.forEach(rec => {
        Notifications.scheduleNotificationAsync({
          content: {
            title: `🎯 Personal Goal: ${rec.title}`,
            body: rec.description,
            data: { url: rec.actionUrl || '/(tabs)/home' },
          },
          trigger: null, // Immediate
        });
      });
    }
  }, [personalizationData]);

  const handleRecommendationPress = async (rec: any) => {
    if (user) {
      await personalizationService.trackInteraction(InteractionType.FEATURE_USE, {
        feature: 'recommendation_click',
        title: rec.title,
        type: rec.type,
      });
    }

    if (rec.actionUrl) {
      router.push(rec.actionUrl as any);
    } else {
      Alert.alert(rec.title, rec.description);
    }
  };

  const handleDismissRecommendation = async (rec: any) => {
    if (user) {
      await personalizationService.trackInteraction(InteractionType.CONTENT_DISMISS, {
        title: rec.title,
        type: rec.type,
      });
      // In a real app, we would also update local state to hide it until next refresh
      refetchPersonalization();
    }
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

      try {
        const result = await Pedometer.getStepCountAsync(start, end);
        if (result) {
          setSteps(result.steps);
          updateHealthMetrics();
        }
      } catch (e) {
        console.log("Pedometer search not supported on this device/range", e);
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
      const localData = await AsyncStorage.getItem("reminders");
      if (localData) setSavedReminders(JSON.parse(localData));
    }
  };

  const saveReminder = async (reminder: any) => {
    // Reminders are managed via medications or system-wide alerts now
    // This is a local helper for the temporary manual reminder

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
          text: t("Call Now"),
          style: "destructive",
          onPress: async () => {
            if (user) {
              await deviceService.createSOS(user.id, {
                location: 'Home',
                type: 'manual_trigger'
              });
            }

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
      refetchPersonalization();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(timer);
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    fetchAIMessage();
  }, [personalizationData]);

  useEffect(() => {
    updateHealthMetrics();

    // Sync to backend periodically or on change (debounced)
    const timeoutId = setTimeout(() => {
      if (user && user.id) {
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

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'event': return 'calendar';
      case 'activity': return 'fitness';
      case 'music': return 'musical-notes';
      case 'medication': return 'medkit';
      case 'social': return 'people';
      default: return 'star';
    }
  };

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

      {/* PERSONALIZED RECOMMENDATIONS */}
      {personalizationData?.recommendations && personalizationData.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎯 Personalized for You</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recsScroll}>
            {personalizationData.recommendations.map((rec, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.recCard, { backgroundColor: colors.card, borderColor: rec.priority === 'high' ? colors.warning : colors.border }]}
                onPress={() => handleRecommendationPress(rec)}
              >
                <View style={styles.recCardHeader}>
                  <View style={[styles.recIconBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={getRecommendationIcon(rec.type) as any} size={24} color={colors.primary} />
                  </View>
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDismissRecommendation(rec);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.mutedText} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.recTitle, { color: colors.text }]} numberOfLines={1}>{rec.title}</Text>
                <Text style={[styles.recDesc, { color: colors.mutedText }]} numberOfLines={2}>{rec.description}</Text>
                {rec.reason && (
                  <View style={styles.recReasonRow}>
                    <Ionicons name="sparkles" size={12} color={colors.warning} />
                    <Text style={[styles.recReason, { color: colors.warning }]}>AI Tip</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
  recsScroll: {
    paddingRight: 20,
  },
  recCard: {
    width: 200,
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dismissButton: {
    padding: 2,
  },
  recIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  recReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  recReason: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
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